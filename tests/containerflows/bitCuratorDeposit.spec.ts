import {expect, Locator} from "@playwright/test";
import { DepositPage } from './pages/DepositPage';
import {presentationApiContext, test} from '../../fixture';
import {
  checkDateIsWithinNumberOfSeconds, checkForFileInS3,
  createdByUserName, frontendBaseUrl,
  generateUniqueId
} from "../helpers/helpers";
import * as path from 'path';
import { DOMParser, Document } from '@xmldom/xmldom';
import {ArchivalGroupPage} from "./pages/ArchivalGroupPage";

test.describe('BitCurator Deposit Tests', () => {

  let depositPage: DepositPage;
  let archivalGroupPage: ArchivalGroupPage;

  test.beforeEach('Set up POM', async ({ page }) => {
    depositPage = new DepositPage(page);
    archivalGroupPage = new ArchivalGroupPage(page);
  });

  test(`can create a Deposit from BitCurator output by adding files directly to the Deposit`, async ({page, context}) => {

    //Set a 2-minute timeout
    test.setTimeout(120_000);

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

    await test.step('Create Deposit', async() => {
      await depositPage.getStarted();
      await depositPage.newDepositButton.click();
      await expect(depositPage.modalArchivalSlug, 'Slug field has loaded').toBeVisible();
      await depositPage.modalArchivalName.fill(validSlug);
      await depositPage.modalArchivalSlug.click();
      await expect(depositPage.slugDisplayOnModal, 'The slug is as expected').toHaveText(validSlug);
      await depositPage.useBagitLayout.check();
      await depositPage.modalCreateNewDepositButton.click();

      //Validate that we're navigated into the new Deposit
      depositURL = page.url();
      await expect(page, 'We have been navigated into the new Deposit page').toHaveURL(depositPage.depositsURL);
      await expect(page.getByRole('heading', {name: validSlug}), 'The slug is listed in the deposit title').toBeVisible();
    });

    await test.step('Create some files directly in the AWS bucket for the Deposit', async() => {
      const files = [
        "data/metadata/brunnhilde/csv_reports/formats.csv",
        "data/metadata/brunnhilde/csv_reports/formatVersions.csv",
        "data/metadata/brunnhilde/csv_reports/mimetypes.csv",
        "data/metadata/brunnhilde/csv_reports/years.csv",
        "data/metadata/brunnhilde/logs/viruscheck-log.txt",
        "data/metadata/brunnhilde/report.html",
        "data/metadata/brunnhilde/siegfried.csv",
        "data/metadata/brunnhilde/tree.txt",
        "data/objects/nyc/DSCF0981.JPG",
        "data/objects/nyc/DSCF1044.JPG",
        "data/objects/nyc/DSCF1090.JPG",
        "data/objects/nyc/DSCF1128.JPG",
        "data/objects/Fedora-Usage-Principles.docx",
        "data/objects/IMAGE-2.tiff",
        "data/objects/warteck.jpg",
        "bag-info.txt",
        "bagit.txt",
        "manifest-sha256.txt",
        "tagmanifest-sha256.txt"
      ];
      await depositPage.uploadFilesToDepositS3Bucket(files, depositURL, 'test-data/test-bag/', false);

      //Verify the files are there in the UI
      await page.goto(depositURL);
      await depositPage.actionsMenu.click();
      await depositPage.refreshStorageButton.click();
      await expect(depositPage.bitCuratorFileOne, 'We see the new file in the Deposits table').toBeVisible();
      await expect(depositPage.bitCuratorFileTwo, 'We see the new file in the Deposits table').toBeVisible();
      await expect(depositPage.bitCuratorFileThree, 'We see the new file in the Deposits table').toBeVisible();
      await expect(depositPage.bitCuratorFileFour, 'We see the new file in the Deposits table').toBeVisible();
      await expect(depositPage.bitCuratorFileFive, 'We see the new file in the Deposits table').toBeVisible();
      await expect(depositPage.usingBagitGuidance, 'We can see the advice that we are using Bagit Layout').toBeVisible();
    });

    await test.step('Verify the files are Deposit only, and are not present in the METS file', async() => {
      // TODO Talk to Tom
      // await expect(depositPage.bitCuratorFileOneSelectArea, 'Listed as Deposit only').toHaveText(depositPage.inDepositOnlyText);
      await expect(depositPage.bitCuratorFileTwoSelectArea, 'Listed as Deposit only').toHaveText(depositPage.inDepositOnlyText);
      await expect(depositPage.bitCuratorFileThreeSelectArea, 'Listed as Deposit only').toHaveText(depositPage.inDepositOnlyText);
      await expect(depositPage.bitCuratorFileFourSelectArea, 'Listed as Deposit only').toHaveText(depositPage.inDepositOnlyText);
      await expect(depositPage.bitCuratorFileFiveSelectArea, 'Listed as Deposit only').toHaveText(depositPage.inDepositOnlyText);

      //Open the METS file
      await depositPage.openMetsFileInTab(context, depositPage.metsFile.getByRole('link'));

      //Check files are not in the METS
      await depositPage.checkFileNotPresentInMETS(metsXML, depositPage.bitCuratorFileTwoName, depositPage.bitCuratorFileTwoFullPath);
      await depositPage.checkFileNotPresentInMETS(metsXML, depositPage.bitCuratorFileThreeName, depositPage.bitCuratorFileThreeFullPath);
      await depositPage.checkFileNotPresentInMETS(metsXML, depositPage.bitCuratorFileFourName, depositPage.bitCuratorFileFourFullPath);
      await depositPage.checkFileNotPresentInMETS(metsXML, depositPage.bitCuratorFileFiveName, depositPage.bitCuratorFileFiveFullPath);
    });

    await test.step('Verify the metadata folder and its child folders cannot have files added to them', async() => {
      //Check that you can't create a folder or upload a file into the metadata folder
      await expect(depositPage.uploadFileToMetadataFolder, 'There is no upload file button in the metadata folder').not.toBeVisible();
      await expect(depositPage.createFolderWithinMetadataFolder, 'There is no create folder button in the metadata folder').not.toBeVisible();

      //Check a subitem as well which had previously been showing the icons
      await expect(depositPage.uploadFileToBrunnhildeFolder, 'There is no upload file button in the brunnhilde folder').not.toBeVisible();
      await expect(depositPage.createFolderWithinBrunnhildeFolder, 'There is no create folder button in the brunnhilde folder').not.toBeVisible();
    });

    await test.step('Select all non-Mets, verify existence in the METS file', async() => {

      //Select all Non Mets, check it's selected the right things
      await depositPage.actionsMenu.click();
      await depositPage.selectAllNonMetsButton.click();

      //Now add them to Mets
      await depositPage.actionsMenu.click();
      await depositPage.addToMetsButton.click();
      await depositPage.addToMetsDialogButton.click();

      //Open the METS file
      await depositPage.openMetsFileInTab(context, depositPage.metsFile.getByRole('link'));

      //Passing TRUE to the methods below, as we DO now expect to find them in the METS
      //Passing mimetype to check it's present in the METS
      //TODO ask Tom - Mime type - we had this anyway - how do we know it came from BitCurator?
      await depositPage.validateFilePresentInMETS(context,metsXML, null, depositPage.bitCuratorFileThreeFullPath, depositPage.objectsFolderName.trim(), 'nyc', null, null, depositPage.bitCuratorFileThreeName, true, depositPage.expectedFileType);
      await depositPage.validateFilePresentInMETS(context,metsXML, null, depositPage.bitCuratorFileFourFullPath, depositPage.objectsFolderName.trim(), null, null, null, depositPage.bitCuratorFileFourName, true, depositPage.expectedFileType);
      //Check mime type on the UI
      await expect(depositPage.bitCuratorFileThree.getByLabel('content-type'), 'Content type is correct').toHaveText(depositPage.expectedFileType);
      await expect(depositPage.bitCuratorFileFour.getByLabel('content-type'),'Content type is correct').toHaveText(depositPage.expectedFileType);

      //Check that the items are now listed as 'Both'
      await expect(depositPage.bitCuratorFileTwoSelectArea, 'Listed as Both').toHaveText(depositPage.inBothText);
      await expect(depositPage.bitCuratorFileThreeSelectArea, 'Listed as Both').toHaveText(depositPage.inBothText);
      await expect(depositPage.bitCuratorFileFourSelectArea, 'Listed as Both').toHaveText(depositPage.inBothText);
      await expect(depositPage.bitCuratorFileFiveSelectArea, 'Listed as Both').toHaveText(depositPage.inBothText);

    });

    //Check for the additional information in the METS produced by the BitCurator info
    await test.step('Check the file size totals', async() => {
      await expect(depositPage.bitCuratorDepositFilesTotals).toBeVisible();
      await expect(depositPage.bitCuratorDepositFileSizeTotals).toBeVisible();
    });

    //Check for the additional information in the METS produced by the BitCurator info
    await test.step('Check that we have the info from the BitCurator process in the METS', async() => {

      //PROMON info and checksum
      //Checksum was already there in other Deposit tests because AWS added it, but we
      //switched that off, so we now know it came from BitCurator
      await depositPage.checkForChecksum(metsXML, depositPage.bitCuratorFileThreeFullPath, depositPage.checkSumType, depositPage.bitCuratorFileThreeChecksum);
      await depositPage.checkForChecksum(metsXML, depositPage.bitCuratorFileFourFullPath, depositPage.checkSumType, depositPage.bitCuratorFileFourChecksum);
      //Check the hash in the UI
      await expect(depositPage.bitCuratorFileThree.getByLabel('hash'), 'hash is correct').toHaveText(depositPage.bitCuratorFileThreeChecksum.substring(0,8));
      await expect(depositPage.bitCuratorFileFour.getByLabel('hash'), 'hash is correct').toHaveText(depositPage.bitCuratorFileFourChecksum.substring(0,8));


      //THIS IS NEW STUFF from BitCurator
      await depositPage.checkPronomInformation(metsXML, depositPage.bitCuratorFileThreeFullPath, 'Exchangeable Image File Format (Compressed)', depositPage.pronomKey);
      await depositPage.checkPronomInformation(metsXML, depositPage.bitCuratorFileFourFullPath, 'Exchangeable Image File Format (Compressed)', depositPage.pronomKey);
      //Check the pronom in the UI
      await expect(depositPage.bitCuratorFileThree.getByLabel('pronom'), 'pronom is correct').toHaveText(depositPage.pronomKey);
      await expect(depositPage.bitCuratorFileFour.getByLabel('pronom'), 'pronom is correct').toHaveText(depositPage.pronomKey);
    });

    await test.step('Check that we can now run an import job', async() => {
      await depositPage.createDiffImportJobButton.click();
      //Check the 15 files are in the list, plus the METS file
      await expect(archivalGroupPage.diffBinariesToAdd.getByRole('listitem'), 'There are 16 items in the Binaries to add').toHaveCount(16);
      await expect(archivalGroupPage.diffBinariesToAdd, 'First test file to add is correct').toContainText(depositPage.bitCuratorFileThreeName);
      await expect(archivalGroupPage.diffBinariesToAdd, 'Second test file to add is correct').toContainText(depositPage.bitCuratorFileFourName);
      await expect(archivalGroupPage.diffBinariesToAdd, 'Third test file to add is correct').toContainText(depositPage.bitCuratorFileFiveName);
      await expect(archivalGroupPage.diffBinariesToAdd, 'Mets file to add is correct').toContainText(archivalGroupPage.depositPage.metsFileName);
      await expect(depositPage.runImportButton, 'We can now see the button to run the Import').toBeVisible();
      await page.goBack();
    });

    await test.step('Tidy up and delete the Deposit', async() => {
      //Navigate back into the first deposit in order to delete it
      await page.goto(depositURL);
      //Tidy up
      await depositPage.deleteTheCurrentDeposit();
    });
  });
});