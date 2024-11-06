import {expect} from "@playwright/test";
import { DepositPage } from './pages/DepositPage';
import { test } from '../../fixture';
import {checkDateIsWithinNumberOfSeconds, createdByUserName, frontendBaseUrl} from "../helpers/helpers";
import * as path from 'path';

test.describe('Deposit Tests', () => {

  let depositPage: DepositPage;

  test.beforeEach('Set up POM', async ({ page }) => {
    depositPage = new DepositPage(page);
  });

  test(`can create a Deposit from the Deposits Left Hand Nav item`, async ({page, baseURL}) => {

    //Set a 5 minute timeout
    test.setTimeout(300_000);

    let depositId : string;

    await test.step('Create a Deposit with no name or note, check URI not available', async () => {
      await depositPage.getStarted();
      await depositPage.navigation.depositMenuOption.click();
      await expect(depositPage.navigation.depositsHeading, 'Deposits listing page has loaded').toBeVisible();
      await depositPage.newDepositButton.click();

      await expect(depositPage.modalArchivalSlug, 'There is NO URI field').not.toBeVisible();
      await depositPage.modalCreateNewDepositButton.click();

      //Validate that we're navigated into the new Deposit
      await expect(page, 'We have been navigated into the new Deposit page').toHaveURL(depositPage.depositsURL);
      await expect(depositPage.depositHeaderNoSlug, 'The new Deposit page has loaded').toBeVisible();
      depositId = await depositPage.depositHeaderNoSlug.textContent();
      depositId = depositId.replace('Deposit ', '');
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

      //Shouldn't be allowed to enter with spaces in a URI
      await depositPage.archivalGroupInput.fill(depositPage.testInvalidArchivalURI);
      //Save changes, verify failed
      await depositPage.updateArchivalPropertiesButton.click();
      await expect(depositPage.alertMessage, 'Failure message is shown').toHaveText('UnknownError: Status InternalServerError');
      await expect(depositPage.archivalGroupInput, 'The Archival group was not set').toBeEmpty();

      //Wait for a second so that we can see if the modified time stamp properly updates
      await page.waitForTimeout(1_000);

      //Use a valid URI this time
      await depositPage.archivalGroupInput.fill(frontendBaseUrl+depositPage.testValidArchivalURI);
      await depositPage.archivalGroupNameInput.fill(depositPage.testArchivalGroupName);
      await depositPage.archivalGroupDepositNoteInput.fill(depositPage.testDepositNote);

      //Save changes
      await depositPage.updateArchivalPropertiesButton.click();
      await expect(depositPage.alertMessage, 'Successful update message is shown').toHaveText('Deposit successfully updated');

      //navigate to the main deposits page
      await depositPage.navigation.depositMenuOption.click();

      //Check that the archival group name and URI are shown on the listing page
      await expect(page.getByRole('row').filter({has: depositPage.depositLinkInTable(depositId)}).getByText(depositPage.testArchivalGroupName), 'The deposit has a name in the table').toBeVisible();
      await expect(page.getByRole('row').filter({has: depositPage.depositLinkInTable(depositId)}).getByText(depositPage.testValidArchivalURI), 'The deposit has a URI in the table').toBeVisible();

      //navigate back to ensure the values have persisted
      await depositPage.depositLinkInTable(depositId).click();
      await expect(depositPage.archivalGroupNameInput, 'The Archival Group Name is correct').toHaveValue(depositPage.testArchivalGroupName);
      await expect(depositPage.archivalGroupDepositNoteInput, 'The archival group Note is correct').toHaveValue(depositPage.testDepositNote);

      //TODO Is this right? Have added a note to Google doc
      //await expect(depositPage.archivalGroupInput, 'The archival group URI is correct').toHaveValue(baseURL+depositPage.testValidArchivalURI);

      //Check that the modified date no longer matches the created date
      const depositCreatedDate = await depositPage.depositCreatedDate.textContent();
      const depositLastModified = await depositPage.depositLastModified.textContent();
      expect(depositCreatedDate, 'Created and Modified dates no longer match').not.toEqual(depositLastModified);

    });

    await test.step('Can toggle to hide and show the Archival group information', async() => {
      await depositPage.archivalGroupToggle.click();
      await expect(depositPage.archivalGroupInput, 'Archival Group is hidden').toBeHidden();
      await expect(depositPage.archivalGroupNameInput, 'Archival Group Name is hidden').toBeHidden();
      await expect(depositPage.archivalGroupDepositNoteInput, 'Archival Group Note is hidden').toBeHidden();

      await depositPage.archivalGroupToggle.click();
      await expect(depositPage.archivalGroupInput, 'Archival Group is visible').toBeVisible();
      await expect(depositPage.archivalGroupNameInput, 'Archival Group Name is visible').toBeVisible();
      await expect(depositPage.archivalGroupDepositNoteInput, 'Archival Group Note is visible').toBeVisible();

    });

    await test.step('Validate that we cannot add a file or folder at the top level', async() => {
      //Try to add folder (this currently fails)
      await depositPage.createNewFolder.click();
      await depositPage.newFolderNameInput.fill(depositPage.newTestFolderTitle);
      await depositPage.newFolderDialogButton.click();
      //TODO remove soft once bug fixed
      await expect.soft(depositPage.newTestFolderInTableShouldNotExist, 'The new test folder has not been created').not.toBeVisible();

      //Try to add a file at the top leve
      await depositPage.uploadFile(depositPage.testFileLocation+depositPage.testImageLocation, false);
      await expect(depositPage.testImageInFilesToplevel, 'File was not added').not.toBeVisible();
      await expect(depositPage.alertMessage, 'We see the corresponding error message').toHaveText(depositPage.cannotUploadTopLevelMessage);
    });

    await test.step('Validate that we can create a sub folder, and add a variety of files', async() => {

      //Create a new sub folder
      await depositPage.objectsFolder.click();
      await expect(depositPage.tableRowContext, 'objects is shown as selected').toHaveText('objects');
      await depositPage.createNewFolder.click();
      await depositPage.newFolderNameInput.fill(depositPage.newTestFolderTitle);
      await depositPage.newFolderDialogButton.click();
      await expect(depositPage.newTestFolderInTable, 'The new test folder has been created in the correct place in the hierarchy').toBeVisible();

      //Add some files to the new folder
      await expect(depositPage.tableRowContext, 'The new folder is shown as selected').toHaveText(depositPage.newTestFolderSlug);
      await depositPage.uploadFile(depositPage.testFileLocation+depositPage.testImageLocation, false);
      await expect(depositPage.newTestImageFileInTable, 'We see the new file in the Deposits table').toBeVisible();

      await expect(depositPage.tableRowContext, 'The new folder is shown as selected').toHaveText(depositPage.newTestFolderSlug);
      await depositPage.uploadFile(depositPage.testFileLocation+depositPage.testWordDocLocation, false);
      await expect(depositPage.newTestWordFileInTable, 'We see the new file in the Deposits table').toBeVisible();

    });

    await test.step('Check that a file upload will be rejected if the checksum is not correct', async() => {

      //Start upload process to the right location
      await expect(depositPage.tableRowContext, 'The correct upload folder is shown as selected').toHaveText(depositPage.newTestFolderSlug);
      await depositPage.uploadFileToDepositButton.click();

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
      await depositPage.newTestFolderInTable.click();
      await expect(depositPage.tableRowContext, 'The  correct upload is shown as selected').toHaveText(depositPage.newTestFolderSlug);
      await depositPage.uploadFile(depositPage.testFileLocation+depositPage.testPdfDocLocation, true);

      //Verify that the file has been uploaded and that the name is blank
      await expect(depositPage.newTestPdfFileInTable, 'We see the new file in the Deposits table').toBeVisible();
      await expect(depositPage.newTestPdfFileInTable.getByRole('cell', {name: 'name'}), 'There is no name displayed in the table').toBeEmpty();
    });

    await test.step( 'The file path as stored in the deposit uses the reduced character set (0-9a-z._-)', async() => {

      //Add a test data file named with disallowed special characters in it
      await depositPage.objectsFolder.click();
      await expect(depositPage.tableRowContext, 'objects is shown as selected').toHaveText('objects');
      await depositPage.uploadFile(depositPage.testFileLocation+depositPage.testImageWithInvalidCharsLocation, false);
      await expect(depositPage.newTestImageFileTranslatedCharsInTable, 'We see the new file in the Deposits table').toBeVisible();

    });

    await test.step('user cannot delete a folder that has contents', async() => {
      //Try to delete the folder we created earlier, which has 3 files in it
      //Ensure we have it selected by selecting another item, then selecting it
      await depositPage.newTestPdfFileInTable.click();
      await depositPage.newTestFolderInTable.click();
      await depositPage.deleteSelectedItem.click();
      await depositPage.deleteItemModalButton.click();
      await expect(depositPage.alertMessage, 'Failure message is shown').toHaveText('You cannot delete a folder that has files in it; delete the files first.');
    });

    await test.step('user can delete a file from the deposit', async() => {
      //Delete all the files we have created
      await depositPage.deleteFile(depositPage.newTestPdfFileInTable, depositPage.testPdfDocLocation);
      await depositPage.deleteFile(depositPage.newTestWordFileInTable, depositPage.testWordDocLocation);
      await depositPage.deleteFile(depositPage.newTestImageFileInTable, depositPage.testImageLocation);
    });

    await test.step('user can delete an empty folder from the deposit', async() => {
      await depositPage.newTestFolderInTable.click();
      await depositPage.deleteSelectedItem.click();
      await depositPage.deleteItemModalButton.click();
      await expect(depositPage.alertMessage, 'Success message is shown').toContainText(`Folder ${depositPage.newTestFolderSlug} DELETED.`);
    });

    await test.step('user cannot delete any files in the root', async() => {
      //Try to delete the objects folder
      await depositPage.objectsFolder.click();
      await expect(depositPage.objectsFolder, 'The row is now the active one').toHaveClass('deposit-row table-active');
      await depositPage.deleteSelectedItem.click();
      await depositPage.deleteItemModalButton.click();
      await expect(depositPage.alertMessage, 'Error message is shown').toContainText(`You cannot delete the objects directory.`);
      await expect(depositPage.objectsFolder, 'objects folder is still there').toBeVisible();

      //Try to delete the __METSlike.json file
      await depositPage.metsFile.click();
      //Verify that it is NOT selected and therefore clicking Delete will not attempt to
      //delete this file
      await expect(depositPage.tableRowContext, 'The Mets file is not the currently selected context').not.toHaveText(depositPage.metsFileName);
      await expect(depositPage.metsFile, 'The row is not the active one').not.toHaveClass('deposit-row table-active');
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
      //TODO highlight to Tom and check if he agrees the checking of this box shouldn't be retained
      //await expect.soft(depositPage.deleteDepositModalButton, 'Delete button is initially disabled').toBeDisabled();
      //await depositPage.confirmDeleteDeposit.check();
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

    await test.step('Try to create Deposit with a VALID slug', async() => {
      //This click into the archival group slug field is important,
      //otherwise the typing doesn't register properly in the following step
      await depositPage.modalArchivalSlug.click();
      //Clear the previous slug
      await depositPage.modalArchivalSlug.clear();
      await depositPage.modalArchivalSlug.pressSequentially(depositPage.testValidArchivalURI);
      await expect(depositPage.slugDisplayOnModal, 'The slug is as expected').toHaveText(depositPage.testValidArchivalURI);
      await depositPage.modalCreateNewDepositButton.click();

      //Validate that we're navigated into the new Deposit
      depositURL = page.url();
      await expect(page, 'We have been navigated into the new Deposit page').toHaveURL(depositPage.depositsURL);
      await expect(depositPage.depositHeaderSlug, 'The new Deposit page has loaded').toBeVisible();
      await expect(depositPage.depositHeaderSlug, 'The slug is listed in the deposit title').toContainText(depositPage.testValidArchivalURI);
    });

    await test.step('Verify we cannot create a second deposit at the same slug', async() => {
      //Validate we can't create another deposit at this archival group location
      await depositPage.getStarted();
      await depositPage.newDepositButton.click();
      await expect(depositPage.modalArchivalSlug, 'Slug field has loaded').toBeVisible();

      //This click into the archival group slug field is important,
      //otherwise the typing doesn't register properly in the following step
      await depositPage.modalArchivalSlug.click();
      await depositPage.modalArchivalSlug.pressSequentially(depositPage.testValidArchivalURI);
      await expect(depositPage.slugDisplayOnModal, 'The slug is as expected').toHaveText(depositPage.testValidArchivalURI);
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



  test.skip(`Deposits listing`, async ({}) => {

    await test.step( 'Deposits listing is in created date desc order', async() => {});

    await test.step('show only - createdBy, lastModifiedBy, preservedBy, exportedBy', async() => {

    });

    await test.step('further filter any of these by date range', async() => {

    });
    await test.step('filter by status, whether active ', async() => {

    });
    await test.step('deposits are paged when the number exceeds 100', async() => {

    });

  });

  //TODO await Tom's reply as I am unable to see sorting etc on the page
  //Create a deposit then visit the listing page
  // What's mandatory, what's not?

  //Test in date desc order

  // PBI 79215 - Deposits Page
  //
  // User can filter and order deposits
  // - show only - createdBy, lastModifiedBy, preservedBy, exportedBy
  // - further filter any of these by date range
  // - filter by status, whether active
  // - deposits are paged when the number exceeds 100


});



