import {expect, Locator} from "@playwright/test";
import { test} from '../../fixture';
import { DOMParser, Document } from '@xmldom/xmldom';
import {ArchivalGroupPage} from "./pages/ArchivalGroupPage";

test.describe('IIIF Builder End To End Test', () => {

  let archivalGroupPage: ArchivalGroupPage;

  test.beforeEach('Set up POM', async ({ page }) => {
    archivalGroupPage = new ArchivalGroupPage(page);
  });

  test(`Can create a Deposit using an EMU Id, and it publishes a IIIF Manifest`, async ({page, context}) => {

    //Set a 5-minute timeout
    test.setTimeout(300_000);

    //We then go on to test that METS population works when files are added directly to the Deposit
    let depositURL: string;

    //Set up the METS file listener to intercept any requests to the METS page to grab the XML
    let metsXML : Document;
    await context.route(`**/mets`, async route => {
      const response = await route.fetch();
      const metsAsString = await response.text();
      metsXML = new DOMParser().parseFromString(metsAsString, 'text/xml');
      await route.fulfill();
    });

    await test.step('Create Deposit with a VALID IRN PID', async() => {

      //TODO test an invalid PID

      //Enter valid PID
      await archivalGroupPage.depositPage.getStarted();
      await archivalGroupPage.depositPage.navigationPage.depositMenuOption.click();
      await archivalGroupPage.depositPage.newDepositButton.click();
      await archivalGroupPage.depositPage.objectIdentifier.fill('1000001');
      await archivalGroupPage.depositPage.modalCreateNewDepositButton.click();

      //Validate that we're navigated into the new Deposit
      depositURL = page.url();
      await expect(page, 'We have been navigated into the new Deposit page').toHaveURL(archivalGroupPage.depositPage.depositsURL);
      await expect(page.getByRole('heading', {name: 'UAT Test 1'}), 'The slug is listed in the deposit title').toBeVisible();

      //TODO Move the constants into variables and test the other fields are set correctly
    });

    await test.step('Create some files directly in the AWS bucket for the Deposit', async() => {
      await archivalGroupPage.depositPage.uploadFilesToDepositS3Bucket(depositURL, true);

      //Verify the files are there in the UI
      await page.goto(depositURL);
      await archivalGroupPage.depositPage.actionsMenu.click();
      await page.getByRole('button', {name: 'Refresh storage'}).click();
      await expect(archivalGroupPage.depositPage.newTestImageFileInTable, 'We see the new file in the Deposits table').toBeVisible();
      await expect(archivalGroupPage.depositPage.newTestWordFileInTable, 'We see the new file in the Deposits table').toBeVisible();
      await expect(archivalGroupPage.depositPage.newTestPdfFileInTable, 'We see the new file in the Deposits table').toBeVisible();
    });

    await test.step('Check that we can now run an import job', async() => {
      await archivalGroupPage.depositPage.createDiffImportJobButton.click();
      //Check the 3 files are in the list, plus the METS file
      await expect(archivalGroupPage.diffBinariesToAdd.getByRole('listitem'), 'There are only 4 items in the Binaries to add').toHaveCount(4);
      await expect(archivalGroupPage.diffBinariesToAdd, 'First test file to add is correct').toContainText(archivalGroupPage.depositPage.testImageLocation);
      await expect(archivalGroupPage.diffBinariesToAdd, 'Second test file to add is correct').toContainText(archivalGroupPage.depositPage.testWordDocLocation);
      await expect(archivalGroupPage.diffBinariesToAdd, 'Third test file to add is correct').toContainText(archivalGroupPage.depositPage.testPdfDocLocation);
      await expect(archivalGroupPage.diffBinariesToAdd, 'Mets file to add is correct').toContainText(archivalGroupPage.depositPage.metsFileName);
      await expect(archivalGroupPage.depositPage.runImportButton, 'We can now see the button to run the Import').toBeVisible();
      await page.goBack();
    });

    await test.step('Tidy up and delete the deposit', async() => {
      //Navigate back into the first deposit in order to delete it
      await page.goto(depositURL);
      //Tidy up
      await archivalGroupPage.depositPage.deleteTheCurrentDeposit();
    });
  });



});