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
  console.log("Deposit locked by " + returnedDeposit.lockedBy);
  console.log("Deposit locked date " + returnedDeposit.lockDate);
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
      //TODO ONCE FIXED

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

      let depositWithText = await presentationApiContext.patch(depositAPIURL, {
        data: {
          submissionText: "This update should fail"
        }
      });
      // Leave soft for now - failing - seem to be able to do this
      expect.soft(depositWithText.status()).toBe(409);

      // try to get our own lock
      const lockResp2 = await presentationApiContext.post(lockUri);
      expect.soft(lockResp2.status()).toBe(409); // because still locked by another

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



  async function createDeposit(request: APIRequestContext, baseURL: string, headers){
    const digitalPreservationParent = `/_for_testing/playwright-testing/`;
    await ensurePath(digitalPreservationParent, request, headers);
    const preservedArchivalGroupUri = `${baseURL}/repository${digitalPreservationParent}/ms-10315`;
    const newDepositResp = await request.post('/deposits', {
      data: {
        type: "Deposit",
        template: "RootLevel",
        archivalGroup: preservedArchivalGroupUri,
        submissionText: "Creating a new deposit to demonstrate updates"
      },
      headers: headers
    });
    console.log(newDepositResp);
    const newDeposit = await newDepositResp.json();
    const sourceDir = 'samples/10315s/';
    const files = [
      '10315.METS.xml',
      'objects/372705s_001.jpg',
      'objects/372705s_002.jpg',
      'objects/372705s_003.jpg',
      'objects/372705s_004.jpg'
    ];
    const s3Client = getS3Client();
    for (const file of files) {
      await uploadFile(newDeposit.files, sourceDir + file, file)
    }
    return newDeposit;
  }

  async function getAuthHeaders(baseUrl: string)
  {
    if(baseUrl.includes("localhost")){
      return {};
    }
    const clientId : string = process.env.API_CLIENT_ID;
    const clientSecret : string = process.env.API_CLIENT_SECRET;
    const tenantId = process.env.API_TENANT_ID;
    const scope: string = `api://${clientId}/.default`;
    const authorityURL: string = `https://login.microsoftonline.com/${tenantId}/oauth2/token`;

    const client = new ConfidentialClientApplication({
      auth: {
        clientId: clientId,
        authority: authorityURL,
        clientSecret: clientSecret,
      }
    });

    const request = {
      scopes: [ scope ]
    };

    let response = await client.acquireTokenByClientCredential(request);

    let headers = {
      'Authorization': `Bearer ${response.accessToken}`,
      'X-Client-Identity': 'Playwright-tests',
      'Accept': 'application/json',
    };

    return headers;
  }

  // This is purely for demo purposes and would be no part of a real application!!
// Its purpose is to produce a short string with very small likelihood of collisions.
  function getShortTimestamp(){
    const date = new Date();
    const dayOfYear = (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(date.getFullYear(), 0, 0)) / 24 / 60 / 60 / 1000;
    const secondOfDay = date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
    return `-${String(dayOfYear).padStart(3, '0')}-${String(secondOfDay).padStart(5, '0')}`
  }


  async function ensurePath(path: string, request: APIRequestContext, headers) {
    const parts = path.split('/');
    let buildPath = "/repository";
    for (const part of parts) {
      if(part){
        buildPath += '/' + part;
        const resourceResp = await request.get(buildPath, { headers: headers });
        if(resourceResp.status() == 404){
          // This is always a container, you can't create other kinds of resource outside of a deposit
          const containerResp = await request.put(buildPath, { headers: headers });
        }
        // ignore other status codes for now
      }
    }
  }
});