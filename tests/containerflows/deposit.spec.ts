import {expect, Locator} from "@playwright/test";
import { DepositPage } from './pages/DepositPage';
import { test } from '../../fixture';
import {
  checkDateIsWithinNumberOfSeconds,
  createdByUserName,
  generateUniqueId
} from "../helpers/helpers";
import * as path from 'path';

test.describe('Deposit Tests', () => {

  let depositPage: DepositPage;

  test.beforeEach('Set up POM', async ({ page }) => {
    depositPage = new DepositPage(page);
  });

  test(`can create a Deposit from the Deposits Left Hand Nav item`, async ({page}) => {

    //Set a 5 minute timeout
    test.setTimeout(300_000);

    let depositId : string;

    await test.step('Create a Deposit with no name or note, check URI not available', async () => {
      await depositPage.getStarted();
      await depositPage.navigationPage.depositMenuOption.click();
      await expect(depositPage.navigationPage.depositsHeading, 'Deposits listing page has loaded').toBeVisible();
      await depositPage.newDepositButton.click();

      await expect(depositPage.modalArchivalSlug, 'There is NO URI field').not.toBeVisible();
      await depositPage.modalCreateNewDepositButton.click();

      //Validate that we're navigated into the new Deposit
      await expect(page, 'We have been navigated into the new Deposit page').toHaveURL(depositPage.depositsURL);
      await expect(depositPage.depositHeaderNoSlug, 'The new Deposit page has loaded').toBeVisible();
      depositId = await depositPage.depositHeaderNoSlug.textContent();
      depositId = depositId.replace('Deposit ', '');
      depositId = depositId.trim();
    });

    await test.step('Validate the created and modified dates are correct', async() => {

      //Check the created and modified dates are now
      const depositCreatedDate = await depositPage.depositCreatedDate.textContent();
      const depositLastModified = await depositPage.depositLastModified.textContent();

      //Check they match
      expect(depositCreatedDate, 'Created and Modified dates match').toEqual(depositLastModified);

      //Need to see if this is fixed after the clocks change in April...
      checkDateIsWithinNumberOfSeconds(depositCreatedDate, 30_000);
      checkDateIsWithinNumberOfSeconds(depositLastModified, 30_000);

    });

    await test.step('Validate expected definition fields are present', async() => {
      //Check the other fields are present
      await expect(depositPage.depositCreatedBy, 'Created by field is correctly set to user').toHaveText(createdByUserName);
      await expect(depositPage.depositLastModifiedBy, 'Last Modified by field is correctly set to user').toHaveText(createdByUserName);
      await expect(depositPage.depositPreserved, 'Preserved field not yet set').toHaveText(depositPage.notYetPopulated);
      await expect(depositPage.depositPreservedBy, 'Preserved by field not yet set').toHaveText(depositPage.notYetPopulated);
      await expect(depositPage.depositVersionPreserved, 'Version Preserved field not yet set').toHaveText(depositPage.notYetPopulated);
      await expect(depositPage.depositExported, 'Exported field not yet set').toHaveText(depositPage.notYetPopulated);
      await expect(depositPage.depositExportedBy, 'Exported by field not yet set').toHaveText(depositPage.notYetPopulated);
      await expect(depositPage.depositVersionExported, 'Version Exported field not yet set').toHaveText(depositPage.notYetPopulated);

    });

    await test.step('Validate that the METS file and objects folder exist at the top level', async() => {
      await expect(depositPage.objectsFolder, 'Objects folder is present').toBeVisible();
      await expect(depositPage.metsFile, 'METS file is present').toBeVisible();
    });

    await test.step('Can add the Archival Group name and a note, and the URI', async() => {

      //Test that initially there is no create archival group button, and
      //message indicating no Archival group set
      await expect(depositPage.noCurrentImportJobsText, 'The message that we cannot create a job is visible').toBeVisible();
      await expect(depositPage.createDiffImportJobButton, 'Button to create a diff import job is not yet visible').not.toBeVisible();

      //Shouldn't be allowed to enter with spaces in a URI
      await depositPage.archivalGroupInput.fill(depositPage.testInvalidArchivalURI);
      //Save changes, verify failed
      await depositPage.updateArchivalPropertiesButton.click();
      await expect(depositPage.alertMessage, 'Failure message is shown').toHaveText(`BadRequest: Archive path '${depositPage.testInvalidArchivalURI}' contains invalid characters.`);
      await expect(depositPage.archivalGroupInput, 'The Archival group was not set').toBeEmpty();

      //Wait for a second so that we can see if the modified time stamp properly updates
      await page.waitForTimeout(1_000);

      //Use a valid URI this time
      await depositPage.archivalGroupInput.fill(depositPage.navigationPage.basePath + '/' +depositPage.testValidArchivalURI);
      await depositPage.archivalGroupNameInput.fill(depositPage.testArchivalGroupName);
      await depositPage.archivalGroupDepositNoteInput.fill(depositPage.testDepositNote);

      //Save changes
      await depositPage.updateArchivalPropertiesButton.click();
      await expect(depositPage.alertMessage, 'Successful update message is shown').toHaveText('Deposit successfully updated');

      //navigate to the main deposits page
      await depositPage.navigationPage.depositMenuOption.click();

      //Check that the archival group name and URI are shown on the listing page
      await expect(page.getByRole('row').filter({has: depositPage.depositLinkInTable(depositId)}).getByText(depositPage.testArchivalGroupName), 'The deposit has a name in the table').toBeVisible();
      await expect(page.getByRole('row').filter({has: depositPage.depositLinkInTable(depositId)}).getByText(depositPage.testValidArchivalURI), 'The deposit has a URI in the table').toBeVisible();

      //navigate back to ensure the values have persisted
      await depositPage.depositLinkInTable(depositId).click();
      await expect(depositPage.archivalGroupNameInput, 'The Archival Group Name is correct').toHaveValue(depositPage.testArchivalGroupName);
      await expect(depositPage.archivalGroupDepositNoteInput, 'The archival group Note is correct').toHaveValue(depositPage.testDepositNote);

      await expect(depositPage.archivalGroupInput, 'The archival group URI is correct').toHaveValue(depositPage.navigationPage.basePath + '/' +depositPage.testValidArchivalURI);

      //Check that the modified date no longer matches the created date
      const depositCreatedDate = await depositPage.depositCreatedDate.textContent();
      const depositLastModified = await depositPage.depositLastModified.textContent();
      expect(depositCreatedDate, 'Created and Modified dates no longer match').not.toEqual(depositLastModified);

    });

    await test.step('Validate that we can create a sub folder, and add a variety of files', async() => {

      //Create a new sub folder
      await depositPage.createFolderWithinObjectsFolder.click();
      await depositPage.newFolderNameInput.fill(depositPage.newTestFolderTitle);
      await depositPage.newFolderDialogButton.click();
      await expect(depositPage.newTestFolderInTable, 'The new test folder has been created in the correct place in the hierarchy').toBeVisible();

      //Add some files to the new folder
      await depositPage.uploadFile(depositPage.testFileLocation+depositPage.testImageLocation, false, depositPage.uploadFileToTestFolder);
      await expect(depositPage.newTestImageFileInTable, 'We see the new file in the Deposits table').toBeVisible();

      await depositPage.uploadFile(depositPage.testFileLocation+depositPage.testWordDocLocation, false, depositPage.uploadFileToTestFolder);
      await expect(depositPage.newTestWordFileInTable, 'We see the new file in the Deposits table').toBeVisible();

    });

    await test.step('Check that a file upload will be rejected if the checksum is not correct', async() => {

      //Start upload process to the right location
      await depositPage.uploadFileToTestFolder.click();

      //Select a file to upload
      await depositPage.fileUploadWidget.setInputFiles(path.join(__dirname, '../../test-data/deposit/'+depositPage.testPdfDocLocation));

      //Read the checksum value
      const checksum : string = await depositPage.checksumField.inputValue();

      //Wait for the Upload request to be sent, and overwrite the checksum when it is
      await page.route(`**/${depositId}?handler=UploadFile`, async route => {
        // Fetch original request.
        const request = route.request();
        // Add a prefix to the title.
        let body = request.postData();
        body = body.replace(checksum, 'nonsensechecksum');
        await route.continue({postData: body});
      });

      //Upload the file, which will trigger the above interception
      await depositPage.fileUploadSubmitButton.click();

      //Verify that the file was NOT uploaded, and we receive a checksum error message
      await expect(depositPage.alertMessage, 'Checksum did not match message has been displayed').toContainText('Checksum on server did not match');
      await expect(depositPage.newTestPdfFileInTable, 'We cannot see the new file in the Deposits table').not.toBeVisible();
    });

    await test.step('We can create a file without giving it a name', async() => {

      // Override previous await.route so that we longer interfere with the checksum
      await page.route(`**/${depositId}?handler=UploadFile`, async route => {
        await route.continue();
      });

      //Click on the correct parent folder, then upload the file,
      //blanking out the filename
      await depositPage.uploadFile(depositPage.testFileLocation+depositPage.testPdfDocLocation, true, depositPage.uploadFileToTestFolder);

      //Verify that the file has been uploaded and that the name is blank
      await expect(depositPage.newTestPdfFileInTable, 'We see the new file in the Deposits table').toBeVisible();
      await expect(depositPage.newTestPdfFileInTable.getByRole('cell', {name: 'name'}), 'There is no name displayed in the table').toBeEmpty();
    });

    await test.step( 'The file path as stored in the deposit uses the reduced character set (0-9a-z._-)', async() => {
      //Add a test data file named with disallowed special characters in it
      await depositPage.uploadFile(depositPage.testFileLocation+depositPage.testImageWithInvalidCharsLocation, false, depositPage.uploadFileToObjectsFolder);
      await expect(depositPage.newTestImageFileTranslatedCharsInTable, 'We see the new file in the Deposits table').toBeVisible();
    });

    await test.step('user cannot delete a folder that has contents', async() => {
      //Try to delete the folder we created earlier, which has 3 files in it
      await depositPage.deleteTestFolder.click();
      await depositPage.deleteItemModalButton.click();
      await expect(depositPage.alertMessage, 'Failure message is shown').toHaveText('You cannot delete a folder that has files in it; delete the files first.');
    });

    await test.step('user can delete a file from the deposit', async() => {
      //Delete all the files we have created
      await depositPage.deleteFile(depositPage.newTestPdfFileInTable, depositPage.testPdfDocLocation);
      await depositPage.deleteFile(depositPage.newTestWordFileInTable, depositPage.testWordDocLocation);
      await depositPage.deleteFile(depositPage.newTestImageFileInTable, depositPage.testImageLocation);
      await depositPage.deleteFile(depositPage.newTestImageFileTranslatedCharsInTable, depositPage.testImageWithInvalidCharsLocation.replaceAll('&','-'));
    });

    await test.step('user can delete an empty folder from the deposit', async() => {
      await depositPage.deleteTestFolder.click();
      await depositPage.deleteItemModalButton.click();
      await expect(depositPage.alertMessage, 'Success message is shown').toContainText(`Folder ${depositPage.newTestFolderSlug} DELETED.`);
    });

    await test.step('user cannot delete any files in the root', async() => {
      //Verify no delete button on objects row
      await expect(depositPage.objectsFolder.locator(depositPage.deleteFolderIcon), 'There is no delete on the objects row').not.toBeVisible();

      //Verify no delete button on __METSlike.json file row
      await expect(depositPage.metsFile.locator(depositPage.deleteFolderIcon), 'There is no delete on the __METSlike.json row').not.toBeVisible();
    });

    await test.step('Delete the deposit', async() => {

      await depositPage.deleteDepositButton.click();
      await expect(depositPage.deleteDepositModalButton, 'Delete button is initially disabled').toBeDisabled();
      await depositPage.confirmDeleteDeposit.check();

      //Close the dialog, check that we are still on the deposit page
      await depositPage.newFolderCloseDialogButton.click();
      await expect(page, 'We have remained on the deposit page').toHaveURL(depositPage.depositsURL);
      await expect(depositPage.newFolderCloseDialogButton, 'The dialog has closed').not.toBeVisible();

      //Open the dialog again, this time click the delete button
      await depositPage.deleteDepositButton.click();
      await expect(depositPage.deleteDepositModalButton, 'Delete button is initially disabled').toBeDisabled();
      await depositPage.confirmDeleteDeposit.check();
      await depositPage.deleteDepositModalButton.click();

      //Check back at the main deposits page and the deposit we created is not on the page
      await expect(page.getByText(`Deposit ${depositId} successfully deleted`), 'We see successful message telling us the deposit has been deleted').toBeVisible();

      //Check that depositId is not visible in the deposit table
      await expect(depositPage.depositLinkInTable(depositId), 'The deposit is no longer visible in the Deposits listing').not.toBeVisible();
    });
  });

  test(`can create a Deposit within a Container, and the slug defaults to that location`, async ({page}) => {

    //We have tested in detail the Deposit functionality in the test above,
    //this is a simple test that we can create a Deposit from within the
    //Browse Containers view, with a slug

    let depositURL: string;
    const validSlug : string = depositPage.testValidArchivalURI+generateUniqueId();

    await test.step('Try to create Deposit with an invalid slug', async() => {
      await depositPage.getStarted();
      await depositPage.newDepositButton.click();
      await expect(depositPage.modalArchivalSlug, 'Slug field has loaded').toBeVisible();

      //Enter an invalid slug, check the invalid characters were not allowed
      //This click into the archival group slug field is important,
      //otherwise the typing doesn't register properly in the following step
      await depositPage.modalArchivalSlug.click();
      await depositPage.modalArchivalSlug.pressSequentially(depositPage.testInvalidArchivalURI);
      //The slug should have had the spaces removed
      await expect(depositPage.slugDisplayOnModal, 'The invalid slug has the spaces stripped.').toHaveText(depositPage.testInvalidArchivalURI.replaceAll(' ', ''));
    });

    await test.step('Create Deposit with a VALID slug', async() => {

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
      //todo reinstate if Tom adds the 'Deposit' back into the header
      //await expect(depositPage.depositHeaderSlug, 'The new Deposit page has loaded').toBeVisible();
      await expect(page.getByRole('heading', {name: validSlug}), 'The slug is listed in the deposit title').toBeVisible();
    });

    await test.step('Verify we cannot create a second deposit at the same slug', async() => {
      //Validate we can't create another deposit at this archival group location
      await depositPage.getStarted();
      await depositPage.newDepositButton.click();
      await expect(depositPage.modalArchivalSlug, 'Slug field has loaded').toBeVisible();

      //This click into the archival group slug field is important,
      //otherwise the typing doesn't register properly in the following step
      await depositPage.modalArchivalSlug.click();
      await depositPage.modalArchivalSlug.pressSequentially(validSlug);
      await expect(depositPage.slugDisplayOnModal, 'The slug is as expected').toHaveText(validSlug);
      await depositPage.modalCreateNewDepositButton.click();

      //Cannot create message is displayed to the user
      await expect(depositPage.alertMessage).toContainText('There is already an ACTIVE deposit for the archival group.');
    });

    await test.step('Tidy up and delete the Deposit', async() => {
      //Navigate back into the first deposit in order to delete it
      await page.goto(depositURL);
      //Tidy up
      await depositPage.deleteDepositButton.click();
      await depositPage.confirmDeleteDeposit.check();
      await depositPage.deleteDepositModalButton.click();
    });
  });

  test(`Deposits listing - check basic page details are correct`, async ({page}) => {

    let depositURL: string;
    const validSlug : string = depositPage.testValidArchivalURI+generateUniqueId();

    //Create a recent date to filter by in later steps
    const yesterday : Date = depositPage.generateDateInPast(1);

    //Create a deposit to ensure we have one new deposit, then visit the listing page
    await test.step('Create a deposit to ensure something new in the listing', async() => {
      await depositPage.getStarted();
      await depositPage.newDepositButton.click();
      await depositPage.modalArchivalSlug.click();
      await depositPage.modalArchivalSlug.fill(validSlug);
      await depositPage.modalCreateNewDepositButton.click();

      //Validate that we're navigated into the new Deposit
      await expect(page, 'We have been navigated into the new Deposit page').toHaveURL(depositPage.depositsURL);
      depositURL = page.url();
    });

    await test.step('navigate to the listings page', async() => {
      await depositPage.navigationPage.depositMenuOption.click();
      await expect(depositPage.depositsTable, 'Deposits table has loaded').toBeVisible();
    });

    await test.step('Deposits listing is in created date desc order', async() => {
      //This means the item we just created should be at the top, in row position 1
      await expect(depositPage.depositRow1Slug, 'The correct slug is shown in row 1').toContainText(validSlug);
      await expect(depositPage.depositRow1Status, 'The correct status is shown in row 1').toContainText('new');
    });

    await test.step('filter by status, whether active', async() => {
      //First check that all items show the 'new' status
      expect((await depositPage.allRowsStatus.allTextContents()).every((currentValue : string) => currentValue === 'new'), 'The table shows only active Deposits').toBeTruthy();

      //Check we see statuses other than 'new' when we change to how all
      await depositPage.showAllDepositsButton.click();
      await page.waitForLoadState('networkidle');
      await expect(depositPage.showActiveDepositsButton, 'We can see the show active deposits button').toBeVisible();
      expect((await depositPage.allRowsStatus.allTextContents()).every((currentValue : string) => currentValue === 'new'), 'The table shows all Deposits').toBeFalsy();
    });

    await test.step('show only - createdBy, lastModifiedBy, preservedBy, exportedBy', async() => {
      //Test that if active, then no preserved date, preserved By, Exported, or exported by
      await depositPage.showActiveDepositsButton.click();
      expect((await depositPage.allRowsPreservedDate.allTextContents()).every((currentValue : string) => currentValue === ''), 'Preserved date is blank on new rows').toBeTruthy();
      expect((await depositPage.allRowsPreservedBy.allTextContents()).every((currentValue : string) => currentValue === ''), 'Preserved By is blank on new rows').toBeTruthy();

      //Test if status is preserved, then the preserved fields are set
      await depositPage.showAllDepositsButton.click();
      expect((await depositPage.allPreservedRowsPreservedDate.allTextContents()).every((currentValue : string) => currentValue != ''), 'Preserved date is populated on all preserved rows').toBeTruthy();
      expect((await depositPage.allPreservedRowsPreservedBy.allTextContents()).every((currentValue : string) => currentValue != ''), 'Preserved by is populated on all preserved rows').toBeTruthy();
      expect((await depositPage.allPreservedRowsExportedBy.allTextContents()).every((currentValue : string) => currentValue === ''), 'Exported by is blank on preserved rows').toBeTruthy();

    });

    await test.step('Tidy up and delete the deposit', async() => {
      //Navigate back into the first deposit in order to delete it
      await page.goto(depositURL);
      //Tidy up
      await depositPage.deleteDepositButton.click();
      await depositPage.confirmDeleteDeposit.check();
      await depositPage.deleteDepositModalButton.click();
    });
  });

  test(`Deposits listing - check columns are sortable`, async ({page}) => {

    let depositURL: string;
    const validSlug : string = depositPage.testValidArchivalURI+generateUniqueId();

    //Create a recent date to filter by in later steps
    const yesterday : Date = depositPage.generateDateInPast(1);

    //Create a deposit to ensure we have one new deposit, then visit the listing page
    await test.step('Create a deposit to ensure something new in the listing', async() => {
      await depositPage.getStarted();
      await depositPage.newDepositButton.click();
      await depositPage.modalArchivalSlug.click();
      await depositPage.modalArchivalSlug.fill(validSlug);
      await depositPage.modalCreateNewDepositButton.click();

      //Validate that we're navigated into the new Deposit
      await expect(page, 'We have been navigated into the new Deposit page').toHaveURL(depositPage.depositsURL);
      depositURL = page.url();
    });

    //Test can sort by the various fields
    await test.step('columns are sortable - archival group', async() => {
      await depositPage.navigateToDepositListingPageWithParams(`showAll=true`);

      //TODO re-instate once sorting bug fixed
      //sort by slug desc
      await depositPage.sortByArchivalGroup.click();
      //depositPage.validateSortOrder<String>((await depositPage.allRowsArchivalGroupSlug.allTextContents()), false, (value) => value);
      //Ascending
      await depositPage.sortByArchivalGroup.click();
      //depositPage.validateSortOrder<String>((await depositPage.allRowsArchivalGroupSlug.allTextContents()), true, (value) => value);

      await depositPage.navigateToDepositListingPageWithParams(`showAll=true&orderby=archivalGroupName&ascending=true`);
      //depositPage.validateSortOrder<String>((await depositPage.allRowsArchivalGroupName.allTextContents()), false, (value) => value);

      await depositPage.navigateToDepositListingPageWithParams(`showAll=true&orderby=archivalGroupName`);
      //depositPage.validateSortOrder<String>((await depositPage.allRowsArchivalGroupName.allTextContents()), true, (value) => value);

    });

    await test.step('columns are sortable - status', async() => {
      await depositPage.navigateToDepositListingPageWithParams(`showAll=true`);

      //sort by status descending
      await depositPage.sortByStatus.click();
      depositPage.validateSortOrder<String>((await depositPage.allRowsStatus.allTextContents()), false, (value) => value);
      //Ascending
      await depositPage.sortByStatus.click();
      depositPage.validateSortOrder<String>((await depositPage.allRowsStatus.allTextContents()), true, (value) => value);
    });

    await test.step('columns are sortable - created date', async() => {
      await depositPage.navigateToDepositListingPageWithParams(`showAll=true`);

      //sort by created date desc
      await depositPage.sortByCreatedDate.click();
      depositPage.validateSortOrder<Date>((await depositPage.allRowsCreatedDate.allTextContents()), false, (value) => new Date(value), (a: Date, b:Date) => a.getTime() - b.getTime());
      //Ascending
      await depositPage.sortByCreatedDate.click();
      depositPage.validateSortOrder<Date>((await depositPage.allRowsCreatedDate.allTextContents()), true, (value) => new Date(value), (a: Date, b:Date) => a.getTime() - b.getTime());
    });

    await test.step('columns are sortable - last modified date', async() => {
      await depositPage.navigateToDepositListingPageWithParams(`showAll=true`);

      //sort by modified date desc
      await depositPage.sortByLastModified.click();
      depositPage.validateSortOrder<Date>((await depositPage.allRowsLastModifiedDate.allTextContents()), false, (value) => new Date(value), (a: Date, b:Date) => a.getTime() - b.getTime());
      //Ascending
      await depositPage.sortByLastModified.click();
      depositPage.validateSortOrder<Date>((await depositPage.allRowsLastModifiedDate.allTextContents()), true, (value) => new Date(value), (a: Date, b:Date) => a.getTime() - b.getTime());
    });

    await test.step('Tidy up and delete the deposit', async() => {
      //Navigate back into the first deposit in order to delete it
      await page.goto(depositURL);
      //Tidy up
      await depositPage.deleteDepositButton.click();
      await depositPage.confirmDeleteDeposit.check();
      await depositPage.deleteDepositModalButton.click();
    });
  });

  test(`Deposits listing - check pagination`, async ({page}) => {

    let depositURL: string;
    const validSlug : string = depositPage.testValidArchivalURI+generateUniqueId();
    let requiredPageSize: number;
    let totalNumberOfItems: number;

    //Create a deposit to ensure we have one new deposit, then visit the listing page
    await test.step('Create a deposit to ensure something new in the listing', async() => {
      await depositPage.getStarted();
      await depositPage.newDepositButton.click();
      await depositPage.modalArchivalSlug.click();
      await depositPage.modalArchivalSlug.fill(validSlug);
      await depositPage.modalCreateNewDepositButton.click();

      //Validate that we're navigated into the new Deposit
      await expect(page, 'We have been navigated into the new Deposit page').toHaveURL(depositPage.depositsURL);
      depositURL = page.url();
    });

    await test.step('there is no pagination element when only one page of deposits', async() => {

      await depositPage.navigateToDepositListingPageWithParams(`showAll=true`);

      //If there are numberOfItemsPerPage items or less, then check pagination doesn't show - to do this, need the
      //total number of items and then set the URL Parameter to be greater than this
      totalNumberOfItems = Number.parseInt(await depositPage.totalNumberOfItems.textContent());

      //Set up the page size such that we will only have one page of results
      requiredPageSize = totalNumberOfItems +1;
      await depositPage.navigateToDepositListingPageWithParams(`showAll=true&pageSize=${requiredPageSize}`);
      await expect(depositPage.totalPagesCount).not.toBeVisible();
      //Should not see the paginator
      await expect(depositPage.paginator).not.toBeVisible();

    });

    await test.step('there are pagination elements when more than one page of deposits', async() => {

      //Now set it up such that we should get 2 pages of results
      requiredPageSize = totalNumberOfItems - 1;
      await depositPage.navigateToDepositListingPageWithParams(`showAll=true&pageSize=${requiredPageSize}`);
      await expect(depositPage.totalPagesCount).toHaveText('2');
      //Should have 4 list items, Previous, 1, 2 Next
      await expect(depositPage.paginatorElements).toHaveCount(4);
      //Previous is disabled
      await expect(depositPage.previousButtonText).toBeVisible();
      expect(await depositPage.previousButton.getAttribute('class')).toContain('disabled');
      //Next is enabled
      await expect(depositPage.nextButtonText).toBeVisible();
      expect(await depositPage.nextButton.getAttribute('class')).not.toContain('disabled');

    });

    await test.step('the pagination elements allow you to move between pages', async() => {

      //paginate to the next page.
      //First read the value of the first row to ensure we have a new first row after paginating
      let firstRowId : string = await depositPage.firstRowID.textContent();
      await depositPage.nextButton.click();
      //Previous is enabled
      await expect(depositPage.previousButtonText).toBeVisible();
      expect(await depositPage.previousButton.getAttribute('class')).not.toContain('disabled');
      //Next is disabled
      await expect(depositPage.nextButtonText).toBeVisible();
      expect(await depositPage.nextButton.getAttribute('class')).toContain('disabled');

      //read first row id and compare to previous to ensure changed
      let nextPageFirstRowId : string = await depositPage.firstRowID.textContent();
      expect(nextPageFirstRowId).not.toEqual(firstRowId);

      //Check the previous works
      await depositPage.previousButton.click();
      expect(await depositPage.previousButton.getAttribute('class')).toContain('disabled');
      firstRowId = await depositPage.firstRowID.textContent();
      expect(nextPageFirstRowId).not.toEqual(firstRowId);

      //Check that we can click on the numbered elements to move pages
      await depositPage.page2Element.click();
      expect(await depositPage.previousButton.getAttribute('class')).not.toContain('disabled');
      nextPageFirstRowId = await depositPage.firstRowID.textContent();
      expect(nextPageFirstRowId).not.toEqual(firstRowId);
    });

    await test.step('Tidy up and delete the deposit', async() => {
      //Navigate back into the first deposit in order to delete it
      await page.goto(depositURL);
      //Tidy up
      await depositPage.deleteDepositButton.click();
      await depositPage.confirmDeleteDeposit.check();
      await depositPage.deleteDepositModalButton.click();
    });
  });

  test(`Deposits listing - advanced search and filtering`, async ({page}) => {

    //Set a 2-minute timeout
    test.setTimeout(120_000);

    let depositURL: string;
    const validSlug : string = depositPage.testValidArchivalURI+generateUniqueId();

    //Create a recent date to filter by in later steps
    const yesterday : Date = depositPage.generateDateInPast(1);
    const formattedYesterday = yesterday.toISOString().substring(0, 10);

    //Create a deposit to ensure we have one new deposit, then visit the listing page
    await test.step('Create a deposit to ensure something new in the listing', async() => {
      await depositPage.getStarted();
      await depositPage.newDepositButton.click();
      await depositPage.modalArchivalSlug.click();
      await depositPage.modalArchivalSlug.fill(validSlug);
      await depositPage.modalCreateNewDepositButton.click();

      //Validate that we're navigated into the new Deposit
      await expect(page, 'We have been navigated into the new Deposit page').toHaveURL(depositPage.depositsURL);
      depositURL = page.url();
    });

    await test.step('filter by status using URL params', async() => {

      //status param, set to new
      await depositPage.navigateToDepositListingPageWithParams(`status=new`);
      expect((await depositPage.allRowsStatus.allTextContents()).every((currentValue: string) => currentValue === 'new'), 'All rows have status new').toBeTruthy();
    });

    await test.step('filter by status using advanced search', async() => {

      await depositPage.navigationPage.depositMenuOption.click();
      await depositPage.filterUsingAdvancedSearchDropdown('statusSelect', 'preserved');
      expect((await depositPage.allRowsStatus.allTextContents()).every((currentValue: string) => currentValue === 'preserved'), 'All rows have status preserved').toBeTruthy();
      expect(page.url()).toContain('status=preserved');
    });

    await test.step('filter by archival group', async() => {

      //archival group path filter - use the slug we just created, it should return only one row
      await depositPage.navigateToDepositListingPageWithParams(`archivalGroupPath=${depositPage.navigationPage.basePath}/${validSlug}&showAll=true`);
      await expect(depositPage.allRowsStatus, 'There is one matching row').toHaveCount(1);
    });

    await test.step('filter by archival group using advanced search', async() => {

      //archival group path filter - use the slug we just created, it should return only one row
      await depositPage.navigationPage.depositMenuOption.click();
      //Click advanced search
      await page.locator('#showFormToggle').click();

      //enter value
      await page.getByRole('textbox', {name: 'Archival group path or slug'}).fill(`${depositPage.navigationPage.basePath}/${validSlug}`);
      //Click Submit
      await page.getByRole('button', { name: 'Submit' }).click();

      await expect(depositPage.allRowsStatus, 'There is one matching row').toHaveCount(1);
      const archivalGroupPath: string = encodeURIComponent(`${depositPage.navigationPage.basePath}/${validSlug}`);
      expect(page.url()).toContain(`archivalGroupPath=${archivalGroupPath}`);
    });

    await test.step('filter by created after field', async() => {

      //Filter the listing by created date after
      await depositPage.navigateToDepositListingPageWithParams(`createdAfter=${formattedYesterday}&showAll=true`);
      // Now check that the created column doesn't have any values prior to that date
      let allDateFields: Date[] = (await depositPage.allRowsCreatedDate.allTextContents()).map((x: string) => new Date(x));
      expect(allDateFields.every((currentValue: Date) => currentValue > yesterday), 'All the rows are created yesterday or later').toBeTruthy();

    });

    await test.step('filter by created after field using advanced search ', async() => {
      await depositPage.navigationPage.depositMenuOption.click();
      await depositPage.filterUsingAdvancedSearchDateField('createdAfterInput', formattedYesterday);
      let allDateFields: Date[] = (await depositPage.allRowsCreatedDate.allTextContents()).map((x: string) => new Date(x));
      expect(allDateFields.every((currentValue: Date) => currentValue > yesterday), 'All the rows are created yesterday or later').toBeTruthy();
      expect(page.url()).toContain(`createdAfter=${formattedYesterday}`);
    });

    await test.step('filter by created before field', async() => {
      //Apply url param createdBefore, then check that the created column doesn't have any values after
      //that date
      await depositPage.navigateToDepositListingPageWithParams(`createdBefore=${formattedYesterday}&showAll=true`);
      // Now check that the created column doesn't have any values after to that date
      let allDateFields: Date[] = (await depositPage.allRowsCreatedDate.allTextContents()).map((x: string) => new Date(x));
      expect(allDateFields.every((currentValue: Date) => currentValue < yesterday), 'All the rows are created earlier than yesterday').toBeTruthy();
    });

    await test.step('filter by created before field using advanced search', async() => {
      await depositPage.navigationPage.depositMenuOption.click();
      await depositPage.filterUsingAdvancedSearchDateField('createdBeforeInput', formattedYesterday);
      let allDateFields: Date[] = (await depositPage.allRowsCreatedDate.allTextContents()).map((x: string) => new Date(x));
      expect(allDateFields.every((currentValue: Date) => currentValue < yesterday), 'All the rows are created earlier than yesterday').toBeTruthy();
      expect(page.url()).toContain(`createdBefore=${formattedYesterday}`);
    });

    await test.step('filter by created by field', async() => {

      //createdBy
      await depositPage.navigateToDepositListingPageWithParams(`createdBy=${createdByUserName}`);
      expect((await depositPage.allRowsCreatedBy.allTextContents()).every((currentValue: string) => currentValue === createdByUserName), 'All rows have correct created by username').toBeTruthy();

    });

    await test.step('filter by created by field using advanced search', async() => {

      //createdBy
      await depositPage.navigationPage.depositMenuOption.click();
      await depositPage.filterUsingAdvancedSearchDropdown('createdBySelect', createdByUserName);
      expect((await depositPage.allRowsCreatedBy.allTextContents()).every((currentValue: string) => currentValue === createdByUserName), 'All rows have correct created by username').toBeTruthy();
      expect(page.url()).toContain(`createdBy=${createdByUserName}`);

    });

    await test.step('filter by combination of created fields', async() => {

      //Test multiple request parameters - test that we can combine a before and after filter
      const now : Date = new Date();
      await depositPage.navigateToDepositListingPageWithParams(`createdAfter=${formattedYesterday}&createdBefore=${now.toISOString().substring(0, 10)}&showAll=true`);
      let allDateFields: Date[] = (await depositPage.allRowsCreatedDate.allTextContents()).map((x: string) => new Date(x));
      expect(allDateFields.every((currentValue: Date) => currentValue > yesterday), 'All the rows are created yesterday or later').toBeTruthy();
      expect(allDateFields.every((currentValue: Date) => currentValue < now), 'All the rows are created earlier than now').toBeTruthy();

    });

    await test.step('filter by combination of created fields using advanced search', async() => {

      //Test multiple request parameters - test that we can combine a before and after filter
      const now : Date = new Date();
      await depositPage.navigationPage.depositMenuOption.click();
      await depositPage.filterUsingAdvancedSearchDateField('createdAfterInput', formattedYesterday);
      await page.locator('#showFormToggle').click();
      await depositPage.filterUsingAdvancedSearchDateField('createdBeforeInput', formattedYesterday);
      let allDateFields: Date[] = (await depositPage.allRowsCreatedDate.allTextContents()).map((x: string) => new Date(x));
      expect(allDateFields.every((currentValue: Date) => currentValue > yesterday), 'All the rows are created yesterday or later').toBeTruthy();
      expect(allDateFields.every((currentValue: Date) => currentValue < now), 'All the rows are created earlier than now').toBeTruthy();
      expect(page.url()).toContain(`createdBefore=${formattedYesterday}`);
      expect(page.url()).toContain(`createdAfter=${formattedYesterday}`);
    });

    await test.step('filter by last modified date after field', async() => {
      //LAST MODIFIED FIELDS
      //Filter the listing by modified date after
      await depositPage.navigateToDepositListingPageWithParams(`lastModifiedAfter=${formattedYesterday}&showAll=true`);
      // Now check that the created column doesn't have any values prior to that date
      let allDateFields: Date[] = (await depositPage.allRowsLastModifiedDate.allTextContents()).map((x: string) => new Date(x));
      expect(allDateFields.every((currentValue: Date) => currentValue > yesterday), 'All the rows are modified yesterday or later').toBeTruthy();

    });

    await test.step('filter by last modified date after field using advanced search', async() => {
      await depositPage.navigationPage.depositMenuOption.click();
      await depositPage.filterUsingAdvancedSearchDateField('lastModifiedAfterInput', formattedYesterday);
      // Now check that the created column doesn't have any values prior to that date
      let allDateFields: Date[] = (await depositPage.allRowsLastModifiedDate.allTextContents()).map((x: string) => new Date(x));
      expect(allDateFields.every((currentValue: Date) => currentValue > yesterday), 'All the rows are modified yesterday or later').toBeTruthy();
      expect(page.url()).toContain(`lastModifiedAfter=${formattedYesterday}`);
    });

    await test.step('filter by last modified before field', async() => {
      //Apply url param lastModifiedBefore, then check that the modified column doesn't have any values after
      //that date
      await depositPage.navigateToDepositListingPageWithParams(`lastModifiedBefore=${formattedYesterday}&showAll=true`);
      // Now check that the created column doesn't have any values after to that date
      let allDateFields: Date[]  = (await depositPage.allRowsLastModifiedDate.allTextContents()).map((x: string) => new Date(x));
      expect(allDateFields.every((currentValue: Date) => currentValue < yesterday), 'All the rows are modified earlier than yesterday').toBeTruthy();
    });

    await test.step('filter by last modified before field using advanced search', async() => {
      await depositPage.navigationPage.depositMenuOption.click();
      await depositPage.filterUsingAdvancedSearchDateField('lastModifiedBeforeInput', formattedYesterday);
      // Now check that the created column doesn't have any values prior to that date
      let allDateFields: Date[] = (await depositPage.allRowsLastModifiedDate.allTextContents()).map((x: string) => new Date(x));
      expect(allDateFields.every((currentValue: Date) => currentValue < yesterday), 'All the rows are modified earlier than yesterday').toBeTruthy();
      expect(page.url()).toContain(`lastModifiedBefore=${formattedYesterday}`);
    });

    await test.step('filter by last modified by field', async() => {
      //modified by
      await depositPage.navigateToDepositListingPageWithParams(`modifiedBy=${createdByUserName}`);
      expect((await depositPage.allRowsLastModifiedBy.allTextContents()).every((currentValue: string) => currentValue === createdByUserName), 'All rows have correct modified by username').toBeTruthy();
    });

    await test.step('filter by last modified by field using advanced search', async() => {
      //modified by
      await depositPage.navigationPage.depositMenuOption.click();
      await depositPage.filterUsingAdvancedSearchDropdown('lastModifiedBySelect', createdByUserName);
      expect((await depositPage.allRowsLastModifiedBy.allTextContents()).every((currentValue: string) => currentValue === createdByUserName), 'All rows have correct created by username').toBeTruthy();
      expect(page.url()).toContain(`lastModifiedBy=${createdByUserName}`);

    });

    await test.step('filter by preserved date after field', async() => {
      //Filter the listing by preserved date after
      await depositPage.navigateToDepositListingPageWithParams(`preservedAfter=${formattedYesterday}&showAll=true`);
      // Now check that the preserved column doesn't have any values prior to that date
      let allDateFields: Date[] = (await depositPage.allRowsPreservedDate.allTextContents()).map((x: string) => new Date(x));
      expect(allDateFields.every((currentValue: Date) => currentValue > yesterday), 'All the rows are preserved yesterday or later').toBeTruthy();

    });

    await test.step('filter by preserved date after field using advanced search', async() => {
      await depositPage.navigationPage.depositMenuOption.click();
      await depositPage.showAllDepositsButton.click();
      await depositPage.filterUsingAdvancedSearchDateField('preservedAfterInput', formattedYesterday);
      // Now check that the preserved  column doesn't have any values prior to that date
      let allDateFields: Date[] = (await depositPage.allRowsPreservedDate.allTextContents()).map((x: string) => new Date(x));
      expect(allDateFields.every((currentValue: Date) => currentValue > yesterday), 'All the rows are modified yesterday or later').toBeTruthy();
      expect(page.url()).toContain(`preservedAfter=${formattedYesterday}`);
    });

    await test.step('filter by preserved before field', async() => {

      await depositPage.navigateToDepositListingPageWithParams(`preservedBefore=${formattedYesterday}&showAll=true`);
      // Now check that the preserved column doesn't have any values after to that date
      let allDateFields: Date[]  = (await depositPage.allRowsPreservedDate.allTextContents()).map((x: string) => new Date(x));
      expect(allDateFields.every((currentValue: Date) => currentValue < yesterday), 'All the rows are modified earlier than yesterday').toBeTruthy();
    });

    await test.step('filter by preserved before field using advanced search', async() => {
      await depositPage.navigationPage.depositMenuOption.click();
      await depositPage.showAllDepositsButton.click();
      await depositPage.filterUsingAdvancedSearchDateField('preservedBeforeInput', formattedYesterday);
      // Now check that the preserved column doesn't have any values prior to that date
      let allDateFields: Date[]  = (await depositPage.allRowsPreservedDate.allTextContents()).map((x: string) => new Date(x));
      expect(allDateFields.every((currentValue: Date) => currentValue < yesterday), 'All the rows are modified earlier than yesterday').toBeTruthy();
      expect(page.url()).toContain(`preservedBefore=${formattedYesterday}`);
    });

    await test.step('filter by preserved by field', async() => {
      //preserved by
      await depositPage.navigateToDepositListingPageWithParams(`preservedBy=${createdByUserName}&showAll=true`);
      expect((await depositPage.allRowsPreservedBy.allTextContents()).every((currentValue: string) => currentValue === createdByUserName), 'All rows have correct preserved by username').toBeTruthy();
    });

    await test.step('filter by preserved by field using advanced search', async() => {
      //preserved by
      await depositPage.navigationPage.depositMenuOption.click();
      await depositPage.showAllDepositsButton.click();
      await depositPage.filterUsingAdvancedSearchDropdown('preservedBySelect', createdByUserName);
      expect((await depositPage.allRowsPreservedBy.allTextContents()).every((currentValue: string) => currentValue === createdByUserName), 'All rows have correct preserved by username').toBeTruthy();
      expect(page.url()).toContain(`preservedBy=${createdByUserName}`);

    });

    await test.step('filter by exported date after field', async() => {
      //Filter the listing by exported date after
      await depositPage.navigateToDepositListingPageWithParams(`exportedAfter=${formattedYesterday}&showAll=true`);
      // Now check that the exported column doesn't have any values prior to that date
      let allDateFields: Date[] = (await depositPage.allRowsExportedDate.allTextContents()).map((x: string) => new Date(x));
      expect(allDateFields.every((currentValue: Date) => currentValue > yesterday), 'All the rows are exported yesterday or later').toBeTruthy();

    });

    await test.step('filter by exported date after field using advanced search', async() => {
      await depositPage.navigationPage.depositMenuOption.click();
      await depositPage.showAllDepositsButton.click();
      await depositPage.filterUsingAdvancedSearchDateField('exportedAfterInput', formattedYesterday);
      // Now check that the preserved  column doesn't have any values prior to that date
      let allDateFields: Date[] = (await depositPage.allRowsExportedDate.allTextContents()).map((x: string) => new Date(x));
      expect(allDateFields.every((currentValue: Date) => currentValue > yesterday), 'All the rows are exported yesterday or later').toBeTruthy();
      expect(page.url()).toContain(`exportedAfter=${formattedYesterday}`);
    });

    await test.step('filter by exported before field', async() => {

      await depositPage.navigateToDepositListingPageWithParams(`exportedBefore=${formattedYesterday}&showAll=true`);
      // Now check that the exported column doesn't have any values after to that date
      let allDateFields: Date[]  = (await depositPage.allRowsExportedDate.allTextContents()).map((x: string) => new Date(x));
      expect(allDateFields.every((currentValue: Date) => currentValue < yesterday), 'All the rows are exported earlier than yesterday').toBeTruthy();
    });

    await test.step('filter by exported before field using advanced search', async() => {
      await depositPage.navigationPage.depositMenuOption.click();
      await depositPage.showAllDepositsButton.click();
      await depositPage.filterUsingAdvancedSearchDateField('exportedBeforeInput', formattedYesterday);
      // Now check that the exported column doesn't have any values prior to that date
      let allDateFields: Date[]  = (await depositPage.allRowsExportedDate.allTextContents()).map((x: string) => new Date(x));
      expect(allDateFields.every((currentValue: Date) => currentValue < yesterday), 'All the rows are exported earlier than yesterday').toBeTruthy();
      expect(page.url()).toContain(`exportedBefore=${formattedYesterday}`);
    });

    await test.step('filter by exported by field', async() => {
      //exported by
      await depositPage.navigateToDepositListingPageWithParams(`exportedBy=${createdByUserName}`);
      expect((await depositPage.allRowsExportedBy.allTextContents()).every((currentValue: string) => currentValue === createdByUserName), 'All rows have correct exported by username').toBeTruthy();
    });

    await test.step('filter by exported by field using advanced search', async() => {
      //exported by
      await depositPage.navigationPage.depositMenuOption.click();
      await depositPage.showAllDepositsButton.click();
      await depositPage.filterUsingAdvancedSearchDropdown('exportedBySelect', createdByUserName);
      expect((await depositPage.allRowsExportedBy.allTextContents()).every((currentValue: string) => currentValue === createdByUserName), 'All rows have correct exported by username').toBeTruthy();
      expect(page.url()).toContain(`exportedBy=${createdByUserName}`);
    });

    await test.step('Tidy up and delete the deposit', async() => {
      //Navigate back into the first deposit in order to delete it
      await page.goto(depositURL);
      //Tidy up
      await depositPage.deleteDepositButton.click();
      await depositPage.confirmDeleteDeposit.check();
      await depositPage.deleteDepositModalButton.click();
    });
  });
});



