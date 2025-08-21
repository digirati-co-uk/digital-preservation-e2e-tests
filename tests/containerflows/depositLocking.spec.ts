import {APIRequestContext, expect, Locator} from "@playwright/test";
import {frontendBaseUrl, generateUniqueId, getS3Client, uploadFile} from "../helpers/helpers";
import {ConfidentialClientApplication} from "@azure/msal-node";
import {Document, DOMParser} from "@xmldom/xmldom";
import {DepositPage} from "./pages/DepositPage";
import {ArchivalGroupPage} from "./pages/ArchivalGroupPage";
import {test, presentationApiContext} from "../../fixture";


async function logDepositLockDetails(request: APIRequestContext, deposit, headers) {
  const depositResp = await request.get(deposit.id, { headers: headers });
  expect(depositResp.status()).toBe(200);
  const returnedDeposit = await depositResp.json();
  return returnedDeposit;
}

let depositPage: DepositPage;
let archivalGroupPage: ArchivalGroupPage;

test.beforeEach('Set up POM', async ({ page }) => {
  depositPage = new DepositPage(page);
  archivalGroupPage = new ArchivalGroupPage(page);
});

test.describe('Locking and unlocking a deposit', () => {

  test(`Locking and unlocking a deposit`, async ({page, context}) => {

    //Set a 5-minute timeout
    test.setTimeout(300_000);

    //We have tested in detail the Deposit functionality in the test above,
    //this is a simple test that we can create a Deposit from within the
    //Browse Containers view, with a slug.

    //We then go on to test that METS population works when files are added directly to the Deposit

    let depositURL: string;
    const validSlug : string = depositPage.testValidArchivalURI+generateUniqueId();

    //Set up the METS file listener to intercept any requests to the METS page to grab the XML
    let metsXML : Document;
    await context.route(`**/mets`, async route => {
      const response = await route.fetch();
      const metsAsString = await response.text();
      metsXML = new DOMParser().parseFromString(metsAsString, 'text/xml');
      await route.fulfill();
    });

    await test.step('Create Deposit with a VALID slug', async() => {

      await depositPage.getStarted();
      await depositPage.newDepositButton.click();
      await expect(depositPage.modalArchivalSlug, 'Slug field has loaded').toBeVisible();

      await depositPage.modalArchivalName.fill(validSlug);
      //This click into the archival group slug field is important,
      //otherwise the typing doesn't register properly in the following step
      await depositPage.modalArchivalSlug.click();
      //Clear the previous slug
      await depositPage.modalArchivalSlug.clear();
      await depositPage.modalArchivalSlug.pressSequentially(validSlug);
      await expect(depositPage.slugDisplayOnModal, 'The slug is as expected').toHaveText(validSlug);
      await depositPage.modalCreateNewDepositButton.click();

      //Validate that we're navigated into the new Deposit
      depositURL = page.url();
      await expect(page, 'We have been navigated into the new Deposit page').toHaveURL(depositPage.depositsURL);
      //TODO reinstate if Tom adds the 'Deposit' back into the header
      //await expect(depositPage.depositHeaderSlug, 'The new Deposit page has loaded').toBeVisible();
      await expect(page.getByRole('heading', {name: validSlug}), 'The slug is listed in the deposit title').toBeVisible();
    });

    await test.step('Create a sub folder and add some files', async() => {

      await page.goto(depositURL);
      //Create a new sub folder
      await depositPage.createASubFolder(page, depositPage.createFolderWithinObjectsFolder, depositPage.newTestFolderTitle, depositPage.newTestFolderSlug);
      //Add some files to the new folder
      await depositPage.uploadFile(depositPage.testFileLocation + depositPage.testImageLocation, false, depositPage.uploadFileToTestFolder);
      await depositPage.uploadFile(depositPage.testFileLocation + depositPage.testWordDocLocation, false, depositPage.uploadFileToTestFolder);
    });

    await test.step('Lock and unlock the deposit', async() => {

      //Lock the deposit as the API user
      const depositId: string = depositURL.substring(depositURL.length-12);
      const depositAPIURL = `/deposits/${depositId}`;
      const lockUri = `${depositAPIURL}/lock`;
      const lockResp = await presentationApiContext.post(lockUri);
      expect(lockResp.status()).toBe(204);

      //Refresh the UI, and check we see the banner telling us the deposit is locked
      await page.reload();
      await expect(depositPage.alertMessage, 'The banner alerting us the Deposit is locked is shown').toContainText('This Deposit is locked by')

      //Check that we cannot run the import job
      await depositPage.createDiffImportJobButton.click();
      await archivalGroupPage.runImportPreserveButton.click();
      await expect(depositPage.alertMessage, 'We see the banner alerting us that the job cannot be created as it is locked').toContainText('Conflict: Deposit is locked by another user:');
      await expect(await archivalGroupPage.runImportPreserveButton, 'We can still see the run import button as the job did not progress').toBeVisible();
      await page.goto(depositURL);

      //Check that we cannot delete the Deposit
      await depositPage.deleteTheCurrentDeposit();
      await expect(page, 'We have remained on the deposit page').toHaveURL(depositURL);
      await expect(depositPage.alertMessage.filter({hasText: 'Conflict: Deposit is locked by'}), 'The banner alerting us the Deposit is locked is shown').toBeVisible();


      //Check that we cannot tick files, or upload files
      await expect(depositPage.testImageCheckbox, 'The checkbox is hidden').toBeHidden();
      await expect(depositPage.testWordDocCheckbox, 'The checkbox is hidden').toBeHidden();
      await expect(depositPage.uploadFileToTestFolder, 'There is no option to upload files').toBeHidden();

      //Check that there is a menu option to release the lock
      await depositPage.actionsMenu.click();
      await expect(depositPage.releaseLockButton).toBeVisible();

      //Release the lock and check we have various UI options back
      await depositPage.releaseLockButton.click();
      await expect(depositPage.alertMessage, 'The banner alerting us the Deposit is unlocked is shown').toContainText('Lock released')
      await expect(depositPage.testImageCheckbox, 'The checkbox is hidden').toBeVisible();
      await expect(depositPage.testWordDocCheckbox, 'The checkbox is hidden').toBeVisible();
      await expect(depositPage.uploadFileToTestFolder, 'There is no option to upload files').toBeVisible();

      // Now lock the deposit in the UI
      await depositPage.actionsMenu.click();
      await depositPage.lockButton.click();
      await expect(depositPage.alertMessage, 'The banner alerting us the Deposit is locked is shown').toContainText('Deposit locked')

      //Check we cannot update the submission text if the deposit is locked by another user
      let depositWithText = await presentationApiContext.patch(depositAPIURL, {
        data: {
          submissionText: "This update should fail"
        }
      });
      expect(depositWithText.status(), 'FAILING DUE TO BUG: We get the correct response code from the API').toBe(409);

      // try to get our own , should get a 409 because still locked by another
      const lockResp2 = await presentationApiContext.post(lockUri);
      expect(lockResp2.status(), 'FAILING DUE TO BUG: We get the correct response code from the API').toBe(409);

      // we need to force it
      const forceLockUri = `${depositAPIURL}/lock?force=true`;
      const forceLockResp = await presentationApiContext.post(forceLockUri);
      expect(forceLockResp.status()).toBe(204); // now OK

      depositWithText = await presentationApiContext.patch(depositAPIURL, {
        data: {
          submissionText: "This update should work"
        }
      });
      expect(depositWithText.status()).toBe(200);

      //Now in the UI remove the lock through the actions menu
      //to allow subsequent delete
      await page.reload();
      await expect(depositPage.archivalGroupDepositNoteInput, 'We see the updated note on the page').toHaveText('This update should work');
      await depositPage.actionsMenu.click();
      await depositPage.releaseLockButton.click();

    });

    await test.step('Tidy up and delete the Deposit', async() => {
      //Navigate back into the first deposit in order to delete it
      await page.goto(depositURL);
      //Tidy up
      await depositPage.deleteTheCurrentDeposit();
    });
  });
});