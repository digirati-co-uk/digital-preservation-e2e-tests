import {expect, Locator} from "@playwright/test";
import { DepositPage } from './pages/DepositPage';
import { test } from '../../fixture';
import {ArchivalGroupPage} from "./pages/ArchivalGroupPage";
import {checkDateIsWithinNumberOfSeconds, createdByUserName, generateUniqueId} from "../helpers/helpers";
import {arch} from "node:os";

test.describe('Archival Group Tests', () => {


  let archivalGroupPage: ArchivalGroupPage;

  test.beforeEach('Set up POM', async ({ page }) => {
    archivalGroupPage = new ArchivalGroupPage(page);
  });

  test(`can create an Archival Group from a Deposit`, async ({page, baseURL}, testInfo) => {

    //Set a 5 minute timeout
    test.setTimeout(300_000);

    let archivalGroupString : string = archivalGroupPage.deposit.testValidArchivalURI + generateUniqueId();
    let depositId : string;
    let objectsFolderFullPath : string = archivalGroupPage.navigation.basePath +'/';
    let testImageFileFullPath : string = archivalGroupPage.navigation.basePath +'/';;
    let testWordFileFullPath : string = archivalGroupPage.navigation.basePath +'/';;

    await test.step('Create a Deposit from within the structure to ensure archival group already set', async () => {
      await archivalGroupPage.deposit.getStarted();
      await archivalGroupPage.deposit.newDepositButton.click();
      await archivalGroupPage.deposit.modalArchivalSlug.click();
      await archivalGroupPage.deposit.modalArchivalSlug.pressSequentially(archivalGroupString);
      await archivalGroupPage.deposit.modalCreateNewDepositButton.click();
      await expect(page, 'We have been navigated into the new Deposit page').toHaveURL(archivalGroupPage.deposit.depositsURL);
      depositId = page.url();
      depositId = depositId.substring(depositId.lastIndexOf('/')+1);
    });

    await test.step('Check that we cannot create an archival group until we add some files', async () => {
      //TODO Fix this once we know how Tom is going to prohibit the creation
      //await expect.soft (archivalGroupPage.createDiffImportJobButton, 'Button to create an archival group is disabled until we add files').toBeDisabled();
    });

    await test.step('Add a name and some files to the Deposit', async () => {
      await archivalGroupPage.deposit.archivalGroupNameInput.fill(archivalGroupPage.deposit.testArchivalGroupName);
      await archivalGroupPage.deposit.updateArchivalPropertiesButton.click();
      await expect(archivalGroupPage.deposit.alertMessage, 'Successful update message is shown').toHaveText('Deposit successfully updated');
      //Add some files to the new folder
      await archivalGroupPage.deposit.uploadFile(archivalGroupPage.deposit.testFileLocation+archivalGroupPage.deposit.testImageLocation, false, archivalGroupPage.deposit.uploadFileToObjectsFolder);
      await archivalGroupPage.deposit.uploadFile(archivalGroupPage.deposit.testFileLocation+archivalGroupPage.deposit.testWordDocLocation, false, archivalGroupPage.deposit.uploadFileToObjectsFolder);

      objectsFolderFullPath = objectsFolderFullPath + archivalGroupString + '/objects';
      testImageFileFullPath = objectsFolderFullPath + '/' + archivalGroupPage.deposit.testImageLocation;
      testWordFileFullPath =  objectsFolderFullPath + '/' + archivalGroupPage.deposit.testWordDocLocation;

    });

    await test.step('Check for presence of required Import Jobs fields and info', async () => {
      await expect(archivalGroupPage.createDiffImportJobButton, 'Button to create an archival group is now enabled').toBeEnabled();
      await expect(archivalGroupPage.noCurrentImportJobsText, 'Message indicating no current jobs is visible').toBeVisible();
    });

    await test.step('Create a diff import job, validate expected fields are present and check values', async () => {

      await archivalGroupPage.createDiffImportJobButton.click();

      //Validate the fields on the page are correct
      await expect(page.getByRole('heading', {name: `Diff from ${depositId} to ${archivalGroupPage.deposit.testArchivalGroupName}`})).toBeVisible();
      await expect(page.getByRole('link', {name: depositId})).toHaveAttribute('href', `/deposits/${depositId}`);
      await expect(archivalGroupPage.diffArchivalGroup).toHaveText(`${archivalGroupPage.navigation.basePath}/${archivalGroupString}`);
      await expect(archivalGroupPage.diffArchivalGroupName).toHaveText(archivalGroupPage.deposit.testArchivalGroupName);
      await expect(archivalGroupPage.diffSourceVersion).toHaveText('(none)');

      //Check objects only thing in the list
      await expect(archivalGroupPage.diffContainersToAdd.getByRole('listitem')).toHaveCount(1);
      await expect(archivalGroupPage.diffContainersToAdd).toContainText(objectsFolderFullPath);

      //Check the 2 files are in the list, and that's the only 2 things there
      await expect(archivalGroupPage.diffBinariesToAdd.getByRole('listitem')).toHaveCount(2);
      await expect(archivalGroupPage.diffBinariesToAdd).toContainText(testImageFileFullPath);
      await expect(archivalGroupPage.diffBinariesToAdd).toContainText(testWordFileFullPath);

      await archivalGroupPage.checkToModifyBinariesFoldersEmpty();

    });

    await test.step('Run the import job, ', async () => {
      //Check that initially we have status of waiting, deposit link, archival group link, created, created by, importjob& original import job set and mcatch
      await archivalGroupPage.runImportPreserveButton.click();
      await expect(archivalGroupPage.importJobPageTitle, 'We can see the import job title').toBeVisible();
      await expect(archivalGroupPage.diffStatus, 'The initial Waiting status is shown').toContainText('waiting');
      await expect(archivalGroupPage.diffDepositValue).toHaveText(depositId);
      await expect(archivalGroupPage.diffDepositValue.getByRole('link')).toHaveAttribute('href', `/deposits/${depositId}`);
      await expect(archivalGroupPage.diffArchivalGroup).toHaveText(`${archivalGroupPage.navigation.basePath}/${archivalGroupString}`);
      await expect(archivalGroupPage.diffArchivalGroup.getByRole('link')).toHaveAttribute('href', `${archivalGroupPage.navigation.baseBrowsePath}/${archivalGroupString}`);

      await expect(archivalGroupPage.diffDateBegun).toBeEmpty();
      await expect(archivalGroupPage.diffDateFinished).toBeEmpty();
      await expect(archivalGroupPage.diffSourceVersion).toHaveText('(none)');
      await expect(archivalGroupPage.diffNewVersion).toHaveText('...');
      checkDateIsWithinNumberOfSeconds(await archivalGroupPage.diffCreated.textContent(), 30_000);
      await expect(archivalGroupPage.diffCreatedBy).toHaveText(createdByUserName);
      await expect(archivalGroupPage.diffImportJob).toHaveText(await archivalGroupPage.diffOriginalImportJob.textContent());
      await expect(archivalGroupPage.diffContainersAdded).toBeEmpty();
      await expect(archivalGroupPage.diffBinariesAdded).toBeEmpty();

      await archivalGroupPage.checkModifiedBinariesFoldersEmpty();

      //Wait for the job to change to completed
      await archivalGroupPage.allowJobToComplete();

      //Check the new completed values are as expected
      await expect(archivalGroupPage.importJobPageTitle, 'We can see the import job title').toBeVisible();
      await expect(archivalGroupPage.diffStatus, 'The initial Waiting status is shown').toContainText('completed');
      await expect(archivalGroupPage.diffDepositValue).toHaveText(depositId);
      await expect(archivalGroupPage.diffDepositValue.getByRole('link')).toHaveAttribute('href', `/deposits/${depositId}`);
      await expect(archivalGroupPage.diffArchivalGroup).toHaveText(`${archivalGroupPage.navigation.basePath}/${archivalGroupString}`);
      await expect(archivalGroupPage.diffArchivalGroup.getByRole('link')).toHaveAttribute('href', `${archivalGroupPage.navigation.baseBrowsePath}/${archivalGroupString}`);


      //TODO the same as created?? Check this with Tom, if there's a delay begun maybe later??
      //Maybe best just to check date begun is in the last 30 seconds?
      //Check the created and begun dates are the same
      const diffDateBegun = await archivalGroupPage.diffDateBegun.textContent();
      const diffCreated = await archivalGroupPage.diffCreated.textContent();
      //Maybe should be a difference between them rather than match?
      expect.soft(diffDateBegun, 'Created and Begun dates match').toEqual(diffCreated);

      //Check finished in the last 10 seconds
      checkDateIsWithinNumberOfSeconds(await archivalGroupPage.diffDateFinished.textContent(), 10_000);

      await expect(archivalGroupPage.diffSourceVersion).toHaveText('(none)');
      await expect(archivalGroupPage.diffNewVersion).toHaveText('v1');
      checkDateIsWithinNumberOfSeconds(await archivalGroupPage.diffCreated.textContent(), 60_000);
      await expect(archivalGroupPage.diffCreatedBy).toHaveText(createdByUserName);
      await expect(archivalGroupPage.diffImportJob).toHaveText(await archivalGroupPage.diffOriginalImportJob.textContent());

      //Check objects only thing in the list
      await expect(archivalGroupPage.diffContainersAdded.getByRole('listitem')).toHaveCount(1);
      await expect(archivalGroupPage.diffContainersAdded).toContainText(objectsFolderFullPath);

      //Check the 2 files are in the list, and that's the only 2 things there
      await expect(archivalGroupPage.diffBinariesAdded.getByRole('listitem')).toHaveCount(2);
      await expect(archivalGroupPage.diffBinariesAdded).toContainText(testImageFileFullPath);
      await expect(archivalGroupPage.diffBinariesAdded).toContainText(testWordFileFullPath);

      await archivalGroupPage.checkModifiedBinariesFoldersEmpty();

    });

    await test.step('Navigate to the archival group', async () => {
      //Follow the archival group link
      await archivalGroupPage.diffArchivalGroup.click();
      await expect(page).toHaveURL(`${archivalGroupPage.navigation.baseBrowsePath}/${archivalGroupString}`);

      await expect(archivalGroupPage.archivalGroupPageHeading).toBeVisible();
      await expect(archivalGroupPage.versionsButton).toBeVisible();
      await expect(archivalGroupPage.iiifButton).toBeVisible();
      await expect(archivalGroupPage.deposit.newDepositButton).toBeVisible();

      // breadcrumbs
      const breadcrumbElements : string[] = archivalGroupPage.navigation.basePath.split('/');
      for (let breadcrumb of breadcrumbElements){
        await expect(archivalGroupPage.generateBreadcrumb(breadcrumb)).toBeVisible();
      }
      await expect(archivalGroupPage.breadcrumbs.getByText(archivalGroupString)).toBeVisible();

      //TODO
      // Create, created by, modified fields,
      await archivalGroupPage.getArchivalGroupHistoryItem('Created');
      expect(await archivalGroupPage.getArchivalGroupHistoryItem('Created by')).toEqual(createdByUserName);
      await archivalGroupPage.getArchivalGroupHistoryItem('Last modified');
      expect(await archivalGroupPage.getArchivalGroupHistoryItem('Last modified by')).toEqual(createdByUserName);

      //versions - 1 only, date should match created
      //Validate the file structure matches
    });

    //TODO - can do
    await test.step('Check the original Deposit is now inactive and not editable', async () => {

    });

  });





});



