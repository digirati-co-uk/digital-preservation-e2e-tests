import {expect} from "@playwright/test";
import { test } from '../../fixture';
import {ArchivalGroupPage} from "./pages/ArchivalGroupPage";
import {checkDateIsWithinNumberOfSeconds, createdByUserName, generateUniqueId} from "../helpers/helpers";
import {arch} from "node:os";

test.describe('Archival Group Tests', () => {

  let archivalGroupPage: ArchivalGroupPage;

  test.beforeEach('Set up POM', async ({ page }) => {
    archivalGroupPage = new ArchivalGroupPage(page);
  });

  test(`can create an Archival Group from a Deposit`, async ({page}) => {

    //Set a 5-minute timeout
    test.setTimeout(300_000);

    let archivalGroupString : string = archivalGroupPage.depositPage.testValidArchivalURI + generateUniqueId();
    let depositId : string;
    let objectsFolderFullPath : string = archivalGroupPage.navigationPage.basePath +'/';
    let testImageFileFullPath : string = archivalGroupPage.navigationPage.basePath +'/';
    let testWordFileFullPath : string = archivalGroupPage.navigationPage.basePath +'/';

    await test.step('Create a Deposit from within the structure to ensure archival group already set', async () => {
      await archivalGroupPage.depositPage.getStarted();
      await archivalGroupPage.depositPage.newDepositButton.click();
      await archivalGroupPage.depositPage.modalArchivalSlug.click();
      //TODO fill versus pressSequentially and the autocorrect one does versus the other
      await archivalGroupPage.depositPage.modalArchivalSlug.pressSequentially(archivalGroupString);
      await archivalGroupPage.depositPage.modalCreateNewDepositButton.click();
      await expect(page, 'We have been navigated into the new Deposit page').toHaveURL(archivalGroupPage.depositPage.depositsURL);
      depositId = page.url();
      depositId = depositId.substring(depositId.lastIndexOf('/')+1);
    });

    await test.step('Check that we cannot create an archival group until we add some files', async () => {
      await expect.soft (archivalGroupPage.createDiffImportJobButton, 'Button to create an archival group is hidden until we add files').toBeHidden();
      await expect(archivalGroupPage.depositNoFiles).toBeVisible();
    });

    await test.step('Add a name and some files to the Deposit', async () => {
      //TODO fill versus pressSequentially and the autocorrect one does versus the other
      await archivalGroupPage.depositPage.archivalGroupNameInput.fill(archivalGroupPage.depositPage.testArchivalGroupName);
      await archivalGroupPage.depositPage.updateArchivalPropertiesButton.click();
      await expect(archivalGroupPage.depositPage.alertMessage, 'Successful update message is shown').toHaveText('Deposit successfully updated');
      //Add some files to the new folder
      await archivalGroupPage.depositPage.uploadFile(archivalGroupPage.depositPage.testFileLocation + archivalGroupPage.depositPage.testImageLocation, false, archivalGroupPage.depositPage.uploadFileToObjectsFolder);
      await archivalGroupPage.depositPage.uploadFile(archivalGroupPage.depositPage.testFileLocation + archivalGroupPage.depositPage.testWordDocLocation, false, archivalGroupPage.depositPage.uploadFileToObjectsFolder);

      objectsFolderFullPath = objectsFolderFullPath + archivalGroupString + '/objects';
      testImageFileFullPath = objectsFolderFullPath + '/' + archivalGroupPage.depositPage.testImageLocation;
      testWordFileFullPath =  objectsFolderFullPath + '/' + archivalGroupPage.depositPage.testWordDocLocation;

    });

    await test.step('Check for presence of required Import Jobs fields and info', async () => {
      await expect(archivalGroupPage.createDiffImportJobButton, 'Button to create an archival group is now enabled').toBeEnabled();
      await expect(archivalGroupPage.noCurrentImportJobsText, 'Message indicating no current jobs is visible').toBeVisible();
    });

    await test.step('Create a diff import job, validate expected fields are present and check values', async () => {

      await archivalGroupPage.createDiffImportJobButton.click();

      //Validate the fields on the page are correct
      await expect(page.getByRole('heading', {name: `Diff from ${depositId} to ${archivalGroupPage.depositPage.testArchivalGroupName}`}), 'The correct page heading is shown').toBeVisible();
      await expect(page.getByRole('link', {name: depositId}), 'The deposit link is correct').toHaveAttribute('href', `/deposits/${depositId}`);
      await expect(archivalGroupPage.diffArchivalGroup, 'The Archival Group slug is correct').toHaveText(`${archivalGroupPage.navigationPage.basePath}/${archivalGroupString}`);
      await expect(archivalGroupPage.diffArchivalGroupName, 'The archival group name is correct').toHaveText(archivalGroupPage.depositPage.testArchivalGroupName);
      await expect(archivalGroupPage.diffSourceVersion, 'There is no diffSourceVersion').toHaveText('(none)');

      //Check objects only thing in the list
      await expect(archivalGroupPage.diffContainersToAdd.getByRole('listitem'), 'There is only 1 item in the Containers to Add').toHaveCount(1);
      await expect(archivalGroupPage.diffContainersToAdd, 'The Container to Add is objects').toContainText(objectsFolderFullPath);

      //Check the 2 files are in the list, and that's the only 2 things there
      await expect(archivalGroupPage.diffBinariesToAdd.getByRole('listitem'), 'There are only 2 items in the Binaries to add').toHaveCount(2);
      await expect(archivalGroupPage.diffBinariesToAdd, 'First test file to add is correct').toContainText(testImageFileFullPath);
      await expect(archivalGroupPage.diffBinariesToAdd, 'Second test file to add is correct').toContainText(testWordFileFullPath);

      await archivalGroupPage.checkToModifyBinariesFoldersEmpty();

    });

    await test.step('Run the import job, ', async () => {
      //Check that initially we have status of waiting, deposit link, archival group link, created, created by,
      //import job & original import job set and match
      await archivalGroupPage.runImportPreserveButton.click();
      await expect(archivalGroupPage.importJobPageTitle, 'We can see the import job title').toBeVisible();
      await expect(archivalGroupPage.diffStatus, 'The initial Waiting status is shown').toContainText('waiting');
      await expect(archivalGroupPage.diffDepositValue, 'The deposit link is correct').toHaveText(depositId);
      await expect(archivalGroupPage.diffDepositValue.getByRole('link'), 'The deposit link is correct').toHaveAttribute('href', `/deposits/${depositId}`);
      await expect(archivalGroupPage.diffArchivalGroup, 'The Archival Group slug is correct').toHaveText(`${archivalGroupPage.navigationPage.basePath}/${archivalGroupString}`);
      await expect(archivalGroupPage.diffArchivalGroup.getByRole('link'), 'The Archival Group slug link is correct').toHaveAttribute('href', `${archivalGroupPage.navigationPage.baseBrowsePath}/${archivalGroupString}`);

      await expect(archivalGroupPage.diffDateBegun, 'Date Begun is empty').toBeEmpty();
      await expect(archivalGroupPage.diffDateFinished, 'Date Finished is empty').toBeEmpty();
      await expect(archivalGroupPage.diffSourceVersion, 'There is no diffSourceVersion').toHaveText('(none)');
      await expect(archivalGroupPage.diffNewVersion, 'There is no diffNewVersion').toHaveText('...');
      checkDateIsWithinNumberOfSeconds(await archivalGroupPage.diffCreated.textContent(), 30_000);
      await expect(archivalGroupPage.diffCreatedBy, 'Created by is correct').toHaveText(createdByUserName);
      await expect(archivalGroupPage.diffImportJob, 'Diff import job and original import job match').toHaveText(await archivalGroupPage.diffOriginalImportJob.textContent());
      await expect(archivalGroupPage.diffContainersAdded, 'No Containers have been added yet').toBeEmpty();
      await expect(archivalGroupPage.diffBinariesAdded, 'No Binaries have been added yet').toBeEmpty();

      await archivalGroupPage.checkModifiedBinariesFoldersEmpty();

      //Wait for the job to change to completed
      await archivalGroupPage.allowJobToComplete();

      //Check the new completed values are as expected
      await expect(archivalGroupPage.importJobPageTitle, 'We can see the import job title').toBeVisible();
      await expect(archivalGroupPage.diffStatus, 'The initial Waiting status is shown').toContainText('completed');
      await expect(archivalGroupPage.diffDepositValue, 'The deposit link is correct').toHaveText(depositId);
      await expect(archivalGroupPage.diffDepositValue.getByRole('link'), 'The deposit link is correct').toHaveAttribute('href', `/deposits/${depositId}`);
      await expect(archivalGroupPage.diffArchivalGroup, 'The Archival Group slug is correct').toHaveText(`${archivalGroupPage.navigationPage.basePath}/${archivalGroupString}`);
      await expect(archivalGroupPage.diffArchivalGroup.getByRole('link'), 'The Archival Group slug link is correct').toHaveAttribute('href', `${archivalGroupPage.navigationPage.baseBrowsePath}/${archivalGroupString}`);

      //check date begun is in the last 30 seconds
      checkDateIsWithinNumberOfSeconds(await archivalGroupPage.diffDateBegun.textContent(), 30_000);

      //Check finished in the last 10 seconds
      checkDateIsWithinNumberOfSeconds(await archivalGroupPage.diffDateFinished.textContent(), 10_000);

      await expect(archivalGroupPage.diffSourceVersion, 'There is no diffSourceVersion').toHaveText('(none)');
      await expect(archivalGroupPage.diffNewVersion, 'New version is set to v1').toHaveText('v1');
      checkDateIsWithinNumberOfSeconds(await archivalGroupPage.diffCreated.textContent(), 60_000);
      await expect(archivalGroupPage.diffCreatedBy, 'Created by is correct').toHaveText(createdByUserName);
      await expect(archivalGroupPage.diffImportJob, 'Diff import job and original import job match').toHaveText(await archivalGroupPage.diffOriginalImportJob.textContent());

      //Check objects only thing in the list
      await expect(archivalGroupPage.diffContainersAdded.getByRole('listitem'), 'There is only 1 item in the Containers Added').toHaveCount(1);
      await expect(archivalGroupPage.diffContainersAdded, 'The Container Added is objects').toContainText(objectsFolderFullPath);

      //Check the 2 files are in the list, and that's the only 2 things there
      await expect(archivalGroupPage.diffBinariesAdded.getByRole('listitem'), 'There are only 2 items in the Binaries added').toHaveCount(2);
      await expect(archivalGroupPage.diffBinariesAdded, 'First test file added is correct').toContainText(testImageFileFullPath);
      await expect(archivalGroupPage.diffBinariesAdded, 'Second test file added is correct').toContainText(testWordFileFullPath);

      await archivalGroupPage.checkModifiedBinariesFoldersEmpty();

    });

    await test.step('Navigate to the archival group top level folder', async () => {
      //Follow the archival group link
      await archivalGroupPage.diffArchivalGroup.click();
      await expect(page, 'The URL is correct').toHaveURL(`${archivalGroupPage.navigationPage.baseBrowsePath}/${archivalGroupString}`);

      //Check correct header and buttons visible
      await expect(archivalGroupPage.archivalGroupPageHeading, 'The correct page title is displayed').toBeVisible();
      await expect(archivalGroupPage.depositPage.newDepositButton, 'Can see the New Deposit button').toBeVisible();

      //Versions and IIIF should be disabled for now, and therefore aren't 'active' links
      await expect(archivalGroupPage.versionsButton, 'The Versions button is shown').not.toBeVisible();
      await expect(archivalGroupPage.iiifButton, 'The IIIF button is shown').not.toBeVisible();

      // breadcrumbs
      const breadcrumbElements: string[] = archivalGroupPage.navigationPage.basePath.split('/');
      for (let breadcrumb of breadcrumbElements) {
        await expect(archivalGroupPage.generateBreadcrumbLocator(breadcrumb), 'Breadcrumb link is displayed as expected').toBeVisible();
      }
      await expect(archivalGroupPage.breadcrumbs.getByText(archivalGroupString), 'Breadcrumb link is displayed as expected').toBeVisible();

      //Check the created and modified dates are in the last 20 seconds, and the expected author is displayed
      checkDateIsWithinNumberOfSeconds(await archivalGroupPage.getArchivalGroupHistoryItem('Created'), 20_000);
      expect(await archivalGroupPage.getArchivalGroupHistoryItem('Created by'), 'Created by is correct').toEqual(createdByUserName);
      checkDateIsWithinNumberOfSeconds(await archivalGroupPage.getArchivalGroupHistoryItem('Last modified'), 20_000);
      expect(await archivalGroupPage.getArchivalGroupHistoryItem('Last modified by'), 'Last modified by is correct').toEqual(createdByUserName);

      //TODO after Tom looks at the formatting of the version table
      //versions - 1 only, date should match created
      //deposits -  1 only

      //Validate the file structure matches
      await expect(archivalGroupPage.resourcesTableRows, 'We correctly have only the one row in the Resources table').toHaveCount(1);
      await expect(archivalGroupPage.objectsFolderInTable, 'That row is the objects folder, as expected').toHaveText(archivalGroupPage.depositPage.objectsFolderName);

    });

    await test.step('Navigate into the archival group sub directory', async () => {

      await archivalGroupPage.objectsFolderInTable.getByRole('link').click();

      //Validate that the page has changed
      let expectedURL : string = `${archivalGroupPage.navigationPage.baseBrowsePath}/${archivalGroupString}/${archivalGroupPage.depositPage.objectsFolderName}`;
      await expect(page, 'The URL is correct').toHaveURL(expectedURL);

      //we can see the title and buttons
      await expect(archivalGroupPage.objectsPageTitle, 'The correct page title is displayed').toBeVisible();
      await expect(archivalGroupPage.depositPage.newDepositButton, 'Can see the New Deposit button').toBeVisible();
      await expect(archivalGroupPage.goToArchivalGroupButton, 'Can see the Go to Archival Group button').toBeVisible();

      // breadcrumbs
      const breadcrumbElements: string[] = objectsFolderFullPath.replace(archivalGroupPage.depositPage.objectsFolderName, '').split('/');
      console.log(breadcrumbElements);
      for (let breadcrumb of breadcrumbElements){
        if (breadcrumb.trim().length >0){
          await expect(archivalGroupPage.generateBreadcrumbLocator(breadcrumb), 'Breadcrumb link is displayed as expected').toBeVisible();
        }
      }
      await expect(archivalGroupPage.breadcrumbs.getByText(archivalGroupPage.depositPage.objectsFolderName), 'Breadcrumb link is displayed as expected').toBeVisible();

      //We can see our 2 images
      await expect(archivalGroupPage.resourcesTableRows, 'We correctly have 2 rows in the Resources table').toHaveCount(2);
      await expect(archivalGroupPage.resourcesTableRows.getByLabel('td-path').getByText(archivalGroupPage.depositPage.testImageLocation), 'Test file one is correct').toBeVisible();
      await expect(archivalGroupPage.resourcesTableRows.getByLabel('td-path').getByText(archivalGroupPage.depositPage.testWordDocLocation), 'Test file two is correct').toBeVisible();

      //Click and verify we see the file
      await archivalGroupPage.resourcesTableRows.getByLabel('td-path').getByText(archivalGroupPage.depositPage.testImageLocation).click();

      //TODO this will be removed and redone when the file page is built.
      await expect(page.getByText('A binary woah')).toBeVisible();

    });

    await test.step('Check the original Deposit is now inactive and not editable', async () => {
      await page.goto(`/deposits/${depositId}`);
      await expect(archivalGroupPage.depositPage.updateArchivalPropertiesButton, 'Button to update properties is disabled').toBeDisabled();
      await expect(archivalGroupPage.depositPage.archivalGroupInput, 'Archival Group is disabled').toBeDisabled();
      await expect(archivalGroupPage.depositPage.archivalGroupNameInput, 'Archival Group Name is disabled').toBeDisabled();
      await expect(archivalGroupPage.depositPage.archivalGroupDepositNoteInput, 'Archival Group Note is disabled').toBeDisabled();
      await expect(archivalGroupPage.depositNotActiveText).toBeVisible();
      await expect(archivalGroupPage.createDiffImportJobButton, 'Button to create an archival group is now hidden').toBeHidden();

      //check there are no delete/add buttons
      await expect(archivalGroupPage.depositPage.uploadFileIcon, 'Correctly cannot see upload icons').toBeHidden();
      await expect(archivalGroupPage.depositPage.createFolderIcon, 'Correctly cannot see create folder icons').toBeHidden();
      await expect(archivalGroupPage.depositPage.deleteFolderIcon, 'Correctly cannot see delete folder icons').toBeHidden();
      await expect(archivalGroupPage.depositPage.deleteFileIcon, 'Correctly cannot see delete item icons').toBeHidden();

      //Check status of job is completed
      await expect(archivalGroupPage.depositPage.importJobStatusCompleted, 'Job is marked as completed').toBeVisible();
    });

  });

});



