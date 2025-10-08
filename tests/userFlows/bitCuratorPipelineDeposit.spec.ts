import {BrowserContext, expect, Locator, Page} from "@playwright/test";
import {presentationApiContext, test} from '../../fixture';
import {ArchivalGroupPage} from "./pages/ArchivalGroupPage";
import { DOMParser, Document } from '@xmldom/xmldom';
import {generateUniqueId} from "../helpers/helpers";
import {DepositPage} from "./pages/DepositPage";

test.describe('Run the BitCurator Deposit Pipeline Tests', () => {

  let archivalGroupPage: ArchivalGroupPage;
  let depositPage: DepositPage;

  test.beforeEach('Set up POM', async ({ page }) => {
    archivalGroupPage = new ArchivalGroupPage(page);
    depositPage = new DepositPage(page);
  });
  for (const refreshStorage of [true, false]) {
    test(`can run the BitCurator pipeline, NOT in Bagit layout, ${refreshStorage?'WITH':'WITHOUT'} refresh of storage @api`, async ({page, context}) => {

      //Set a 10-minute timeout
      test.setTimeout(600_000);

      //Set up the METS file listeners to intercept any requests to the METS page to grab the XML
      let metsXML: Document;

      await context.route(`**/mets`, async route => {
        const response = await route.fetch();
        const metsAsString = await response.text();
        metsXML = new DOMParser().parseFromString(metsAsString, 'text/xml');
        await route.fulfill();
      });

      await page.route('**/*view=mets', async route => {
        const response = await route.fetch();
        const metsAsString = await response.text();
        metsXML = new DOMParser().parseFromString(metsAsString, 'text/xml');
        await route.fulfill();
      });

      let archivalGroupString: string = depositPage.testValidArchivalURI + generateUniqueId();
      let depositId, depositURL: string;
      let objectsFolderFullPath: string = archivalGroupPage.navigationPage.basePath + '/';
      let testImageFileFullPath: string = archivalGroupPage.navigationPage.basePath + '/';
      let testWordFileFullPath: string = archivalGroupPage.navigationPage.basePath + '/';
      let archivalGroupURL: string;

      await test.step('Create a Deposit from within the structure to ensure archival group already set', async () => {
        await depositPage.getStarted();
        await depositPage.newDepositButton.click();

        await depositPage.modalArchivalSlug.fill(archivalGroupString);
        await depositPage.modalCreateNewDepositButton.click();
        await expect(page, 'We have been navigated into the new Deposit page').toHaveURL(depositPage.depositsURL);
        depositURL = page.url();
        depositId = depositURL.substring(depositURL.lastIndexOf('/') + 1);
      });

      await test.step('Add a name and some files to the Deposit', async () => {
        await depositPage.archivalGroupNameInput.fill(depositPage.testArchivalGroupName);
        await depositPage.updateArchivalPropertiesButton.click();
        await expect(depositPage.alertMessage, 'Successful update message is shown').toContainText('Deposit successfully updated');
        //Create some new sub folders
        await depositPage.createASubFolder(page, depositPage.createFolderWithinObjectsFolder, depositPage.newTestFolderTitle, depositPage.newTestFolderSlug);

        //Add some files to the new folder
        await depositPage.uploadFile(depositPage.testFileLocation + depositPage.testImageLocation, false, depositPage.uploadFileToTestFolder);
        await depositPage.uploadFile(depositPage.testFileLocation + depositPage.testWordDocLocation, false, depositPage.uploadFileToTestFolder);

        objectsFolderFullPath = objectsFolderFullPath + archivalGroupString;
        testImageFileFullPath = objectsFolderFullPath + '/' + depositPage.newTestFolderSlug + '/' + depositPage.testImageLocation;
        testWordFileFullPath = objectsFolderFullPath + '/' + depositPage.newTestFolderSlug + '/' + depositPage.testWordDocLocation;
      });

      await test.step('Add a file directly in s3', async () => {
        let files = [
          `${depositPage.newTestFolderSlug}/${depositPage.testPdfDocLocation}`,
        ];
        await depositPage.uploadFilesToDepositS3Bucket(files, depositURL, 'test-data/deposit/', false);
      });

      if (refreshStorage) {
        await test.step('Refresh storage', async () => {
          await depositPage.refreshStorage();
        });
      }

      await test.step('Kick off the pipeline and await it finishing', async () => {
        //Start the pipeline
        await depositPage.actionsMenu.click();
        await expect(depositPage.cancelPipelineButton, 'The button to stop the pipeline run should be disabled initially').toBeDisabled();
        await depositPage.runPipelineButton.click();

        //Test for 'Deposit locked and pipeline running' alert banner
        await expect(depositPage.alertMessage, 'We see the Deposit Locked message').toContainText('Deposit locked and pipeline run message sent.');

        //Check the deposit is locked by checking that there is a menu option to release the lock
        await depositPage.actionsMenu.click();
        await expect(depositPage.releaseLockButton).toBeVisible();
        await expect(depositPage.lockButton).not.toBeVisible();

        //Test that the various menu actions such as add to mets are
        //disabled whilst the pipeline is running
        await expect(depositPage.selectAllNonMetsButton, 'The Select all non-METS button is disabled').toBeDisabled();
        await expect(depositPage.runPipelineButton, 'The Run Pipeline button is disabled').toBeDisabled();
        await expect(depositPage.deleteSelectedButton, 'The Delete Selected button is disabled').toBeDisabled();
        await expect(depositPage.refreshStorageButton, 'The Refresh Storage button is disabled').toBeDisabled();
        //Check the stop pipeline button is ENABLED
        await expect(depositPage.cancelPipelineButton, 'The button to stop the pipeline run should be enabled now').toBeEnabled();

        //Check that you cannot run the import job while the pipeline is running
        await expect(depositPage.createDiffImportJobButton, 'Cannot run an import job while the pipeline is running').toContainClass('disabled');
        await depositPage.createDiffImportJobButton.click({force: true});
        await expect(page.getByRole('heading', {name: `Diff from ${depositId} to ${depositPage.testArchivalGroupName}`}), 'We have not changed page').not.toBeVisible();

        //Check that another user can't amend the deposit while the pipeline is running
        const depositAPIURL = `/deposits/${depositId}`;
        let depositWithText = await presentationApiContext.patch(depositAPIURL, {
          data: {
            submissionText: "This update should fail"
          }
        });
        expect(depositWithText.status(), 'We get the correct response code from the API').toBe(409);

        //Refresh the page until changes to completed
        let pipelineCompleted: boolean = false;
        while (!pipelineCompleted) {
          //Wait for a few seconds before reloading to give the job time to complete
          await page.waitForTimeout(1_000);
          await page.goto(page.url());

          await expect(depositPage.pipelineJobStatus, 'The Status of the diff is visible').toBeVisible();
          const status = await depositPage.pipelineJobStatus.textContent();
          pipelineCompleted = status == 'completed';
          if (!pipelineCompleted) {
            await expect(depositPage.alertMessage, 'We see the Please Refresh message').toContainText('Please refresh for status updates');
          }
        }

        //There should be no banner now that we are finished and we should see the BitCurator metadata files
        await expect(depositPage.alertMessage, 'There are no banner messages as the pipeline is complete').toBeHidden();
        await expect(depositPage.bitCuratorFileFiveSelectArea, 'Metadata file present and listed as in Both Deposit and mets').toHaveText(depositPage.inBothText);

        //Check the deposit is now unlocked
        await depositPage.actionsMenu.click();
        await expect(depositPage.releaseLockButton).not.toBeVisible();
        await expect(depositPage.lockButton).toBeVisible();
      });

      await test.step('Check that we have the info from the BitCurator process in the METS for all 3 files', async () => {

        //Open the METS file
        await depositPage.openMetsFileInTab(context, depositPage.metsFile.getByRole('link'));

        //PROMON info and checksum
        //Checksum checks
        await depositPage.checkForChecksum(metsXML, depositPage.testImageLocationFullPath, depositPage.checkSumType, depositPage.testImageChecksum);
        await depositPage.checkForChecksum(metsXML, depositPage.testWordDocLocationFullPath, depositPage.checkSumType, depositPage.testWordDocChecksum);
        await depositPage.checkForChecksum(metsXML, depositPage.testPdfDocLocationFullPath, depositPage.checkSumType, depositPage.testPdfDocChecksum);
        //Check the hash in the UI
        await expect(depositPage.newTestImageFileInTable.getByLabel('hash'), 'hash is correct').toHaveText(depositPage.testImageChecksum.substring(0, 8));
        await expect(depositPage.newTestWordFileInTable.getByLabel('hash'), 'hash is correct').toHaveText(depositPage.testWordDocChecksum.substring(0, 8));
        await expect(depositPage.newTestPdfFileInTable.getByLabel('hash'), 'hash is correct').toHaveText(depositPage.testPdfDocChecksum.substring(0, 8));

        //Pronom
        await depositPage.checkPronomInformation(metsXML, depositPage.testImageLocationFullPath, 'JPEG File Interchange Format', 'fmt/43');
        await depositPage.checkPronomInformation(metsXML, depositPage.testWordDocLocationFullPath, 'Microsoft Word for Windows', 'fmt/412');
        await depositPage.checkPronomInformation(metsXML, depositPage.testPdfDocLocationFullPath, 'Acrobat PDF 1.7 - Portable Document Format', 'fmt/276');
        //Check the pronom in the UI
        await expect(depositPage.newTestImageFileInTable.getByLabel('pronom'), 'pronom is correct').toHaveText('fmt/43');
        await expect(depositPage.newTestWordFileInTable.getByLabel('pronom'), 'pronom is correct').toHaveText('fmt/412');
        await expect(depositPage.newTestPdfFileInTable.getByLabel('pronom'), 'pronom is correct').toHaveText('fmt/276');
      });

      await test.step('Create a diff import job, validate expected fields are present and check values', async () => {

        await depositPage.createDiffImportJobButton.click();

        //Validate the fields on the page are correct
        await expect(page.getByRole('heading', {name: `Diff from ${depositId} to ${depositPage.testArchivalGroupName}`}), 'The correct page heading is shown').toBeVisible();
        await expect(page.getByRole('link', {name: depositId}), 'The deposit link is correct').toHaveAttribute('href', `/deposits/${depositId}`);
        await expect(archivalGroupPage.diffArchivalGroup, 'The Archival Group slug is correct').toHaveText(`${archivalGroupPage.navigationPage.basePath}/${archivalGroupString}`);
        await expect(archivalGroupPage.diffArchivalGroupName, 'The archival group name is correct').toHaveText(depositPage.testArchivalGroupName);
        await expect(archivalGroupPage.diffSourceVersion, 'There is no diffSourceVersion').toHaveText('(none)');

        await archivalGroupPage.checkToModifyBinariesFoldersEmpty();
      });

      await test.step('Run the import job', async () => {
        //Check that initially we have status of waiting, deposit link, archival group link, created, created by,
        //import job & original import job set and match
        await archivalGroupPage.runImportPreserveButton.click();
        await expect(archivalGroupPage.importJobPageTitle, 'We can see the import job title').toBeVisible();

        //Wait for the job to change to completed
        await archivalGroupPage.allowJobToComplete();

        //Check the new completed values are as expected
        await expect(archivalGroupPage.diffNewVersion, 'New version is set to v1').toHaveText('v1');

      });

      await test.step('Navigate to the archival group top level folder', async () => {
        //Follow the archival group link
        await archivalGroupPage.diffArchivalGroup.click();
        archivalGroupURL = `${archivalGroupPage.navigationPage.baseBrowsePath}/${archivalGroupString}`;
        await expect(page, 'The URL is correct').toHaveURL(archivalGroupURL);

        //Check correct header and buttons visible
        await expect(archivalGroupPage.archivalGroupPageHeading, 'The correct page title is displayed').toBeVisible();
        await expect(depositPage.newDepositButton, 'Can see the New Deposit button').toBeVisible();

        //Validate the file structure matches
        await expect(archivalGroupPage.resourcesTableRows, 'We correctly have only the 3 rows in the Resources table, objects, metadata and METS.xml').toHaveCount(3);
        await expect(archivalGroupPage.objectsFolderInTable, 'That row is the objects folder, as expected').toHaveText(depositPage.objectsFolderName);
        await expect(archivalGroupPage.metadataFolderInTable, 'That row is the metadata folder, as expected').toHaveText(depositPage.metadataFolderName);
        await expect(archivalGroupPage.metsRowInTable, 'THe 2nd row contains the METS file, as expected').toHaveText(depositPage.metsFileName);

      });

      await test.step('Check we can access the METS for this archival group via the UI', async () => {

        await page.goto(page.url() + `?view=mets`);

        //The METS interceptor should have populated metsXML
        //Verify the 2 test files are in the METS i.e. the right METS was returned
        await checkMetsForTheTestFiles(context, metsXML, true, depositPage.testImageLocationFullPath, depositPage.testWordDocLocationFullPath);
        await page.goBack();
      });

      await test.step('Check we can access the METS for this archival group via the API', async () => {
        //Call the METS endpoint on the API, verify we get the METS file back
        const archivalGroupAPILocation: string = `repository/${archivalGroupPage.navigationPage.basePath}/${archivalGroupString}?view=mets`;
        const metsResponse = await presentationApiContext.get(archivalGroupAPILocation,
          {
            ignoreHTTPSErrors: true
          });
        const metsAsString = await metsResponse.text();
        metsXML = new DOMParser().parseFromString(metsAsString, 'text/xml');

        //Verify the 2 test files are in the METS i.e. the right METS was returned
        await checkMetsForTheTestFiles(context, metsXML, true, depositPage.testImageLocationFullPath, depositPage.testWordDocLocationFullPath);

      });
    });
  }

  test(`can cancel the BitCurator pipeline run @api`, async ({page, context}) => {

    //Set a 2-minute timeout
    test.setTimeout(120_000);

    let archivalGroupString: string = depositPage.testValidArchivalURI + generateUniqueId();
    let depositId, depositURL: string;
    let objectsFolderFullPath: string = archivalGroupPage.navigationPage.basePath + '/';
    let testImageFileFullPath: string = archivalGroupPage.navigationPage.basePath + '/';
    let testWordFileFullPath: string = archivalGroupPage.navigationPage.basePath + '/';
    let archivalGroupURL: string;

    await test.step('Create a Deposit from within the structure to ensure archival group already set', async () => {
      await depositPage.getStarted();
      await depositPage.newDepositButton.click();

      await depositPage.modalArchivalSlug.fill(archivalGroupString);
      await depositPage.modalCreateNewDepositButton.click();
      await expect(page, 'We have been navigated into the new Deposit page').toHaveURL(depositPage.depositsURL);
      depositURL = page.url();
      depositId = depositURL.substring(depositURL.lastIndexOf('/') + 1);
    });

    await test.step('Add a name and some files to the Deposit', async () => {
      await depositPage.archivalGroupNameInput.fill(depositPage.testArchivalGroupName);
      await depositPage.updateArchivalPropertiesButton.click();
      await expect(depositPage.alertMessage, 'Successful update message is shown').toContainText('Deposit successfully updated');
      //Create some new sub folders
      await depositPage.createASubFolder(page, depositPage.createFolderWithinObjectsFolder, depositPage.newTestFolderTitle, depositPage.newTestFolderSlug);

      //Add some files to the new folder
      await depositPage.uploadFile(depositPage.testFileLocation + depositPage.testImageLocation, false, depositPage.uploadFileToTestFolder);
      await depositPage.uploadFile(depositPage.testFileLocation + depositPage.testWordDocLocation, false, depositPage.uploadFileToTestFolder);

      objectsFolderFullPath = objectsFolderFullPath + archivalGroupString;
      testImageFileFullPath = objectsFolderFullPath + '/' + depositPage.newTestFolderSlug + '/' + depositPage.testImageLocation;
      testWordFileFullPath = objectsFolderFullPath + '/' + depositPage.newTestFolderSlug + '/' + depositPage.testWordDocLocation;
    });

    await test.step('Add a file directly in s3', async () => {
      let files = [
        `${depositPage.newTestFolderSlug}/${depositPage.testPdfDocLocation}`,
      ];
      await depositPage.uploadFilesToDepositS3Bucket(files, depositURL, 'test-data/deposit/', false);
    });

    await test.step('Kick off the pipeline and then cancel it', async () => {
      //Start the pipeline
      await depositPage.actionsMenu.click();
      await depositPage.runPipelineButton.click();

      //Test for 'Deposit locked and pipeline running' alert banner
      await expect(depositPage.alertMessage, 'We see the Deposit Locked message').toContainText('Deposit locked and pipeline run message sent.');

      //Now click the stop pipeline button
      await depositPage.actionsMenu.click();
      await depositPage.cancelPipelineButton.click();
      await expect(depositPage.pipelineJobStatus, 'The Status of the diff is correct').toHaveText('completedWithErrors');

      //There should be a banner stating we cancelled the job
      await expect(depositPage.alertMessage, 'We see the Pipeline cancelled banner').toContainText('Force complete of pipeline succeeded and lock released');

      //Check the deposit is now unlocked
      await depositPage.actionsMenu.click();
      await expect(depositPage.releaseLockButton).not.toBeVisible();
      await expect(depositPage.lockButton).toBeVisible();
      await depositPage.actionsMenu.click();
    });

    await test.step('Delete the deposit', async () => {
      await depositPage.deleteTheCurrentDeposit();
    });
  });

  async function checkMetsForTheTestFiles(context: BrowserContext, metsXML: Document, shouldExist: boolean, file1Location: string, file2Location: string){
    //Validate that we have/don't have (based on shouldExist) an amdSec with each new file
    await depositPage.checkAmdSecExists(metsXML, file1Location, shouldExist);
    await depositPage.checkAmdSecExists(metsXML, file2Location, shouldExist);
  }
});



