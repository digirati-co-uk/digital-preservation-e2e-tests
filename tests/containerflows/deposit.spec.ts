import { expect, Locator } from '@playwright/test';
import { DepositPage } from './pages/DepositPage';
import { test } from '../../fixture';
import {checkDateIsWithinNumberOfSeconds, createdByUserName} from "../helpers/helpers";

test.describe('Deposit Tests', () => {

  let depositPage: DepositPage;

  test.beforeEach('Set up POM', async ({ page }) => {
    depositPage = new DepositPage(page);
  });

  test(`can create a Deposit from the Deposits Left Hand Nav item`, async ({page}) => {

    let depositId : string;

    await test.step('Create a Deposit with no name or note, URI not available', async () => {
      await depositPage.getStarted();
      await depositPage.navigation.depositMenuOption.click();
      await expect(depositPage.navigation.depositsHeading, 'Deposits listing page has loaded').toBeVisible();
      await depositPage.newDepositButton.click();

      //TODO Verify there is NO URI field
      await depositPage.modalCreateNewDepositButton.click();

      //Validate that we're navigated into the new Deposit
      await expect(page, 'We have been navigated into the new Deposit page').toHaveURL(depositPage.depositsURL);
      await expect(depositPage.depositHeader, 'The new Deposit page has loaded').toBeVisible();
      depositId = await depositPage.depositHeader.textContent();
      depositId = depositId.replace('Deposit ', '');
      console.log(depositId);
    });
    await test.step('Validate the created and modified dates are correct', async() => {

      //Check the created and modified dates are now
      const depositCreatedDate = await depositPage.depositCreatedDate.textContent();
      const depositLastModified = await depositPage.depositLastModified.textContent();
      //TODO fix once Tom has fixed
      checkDateIsWithinNumberOfSeconds(depositCreatedDate, 3_630_000);
      checkDateIsWithinNumberOfSeconds(depositLastModified, 3_630_000);

      //Check they match
      expect(depositCreatedDate, 'Created and Modified dates match').toEqual(depositLastModified);

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
      //TODO this shouldn't be allowed to enter with spaces in a URI
      //await depositPage.archivalGroupInput.fill('Christine test uri');

      await depositPage.archivalGroupNameInput.fill(depositPage.testArchivalGroupName);
      await depositPage.archivalGroupDepositNoteInput.fill(depositPage.testDepositNote);

      //Save changes
      await depositPage.updateArchivalPropertiesButton.click();
      await expect(depositPage.alertMessage, 'Successful update message is shown').toHaveText('Deposit successfully updated');

      //navigate to the main deposits page
      await depositPage.navigation.depositMenuOption.click();

      //Check that the archival group name is shown on the listing page
      await expect(page.getByRole('row').filter({has: depositPage.depositLinkInTable(depositId)}).getByText(depositPage.testArchivalGroupName)).toBeVisible();

      //navigate back to ensure the values have persisted
      await depositPage.depositLinkInTable(depositId).click();
      await expect(depositPage.archivalGroupNameInput, 'The Archival Group Name is correct').toHaveValue(depositPage.testArchivalGroupName);
      await expect(depositPage.archivalGroupDepositNoteInput, 'The archival group Note is correct').toHaveValue(depositPage.testDepositNote);

      //TODO Check with Tom, should this update? Because it's not...
      //Check that the modified date no longer matches the created date

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
      await depositPage.uploadFile(depositPage.testFileLocation+depositPage.testImageLocation);
      await expect(depositPage.testImageInFilesToplevel, 'File was not added').not.toBeVisible();
      await expect(depositPage.alertMessage, 'We see the corresponding error message').toHaveText(depositPage.cannotUploadTopLevelMessage);
    });

    //TODO
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
      await depositPage.uploadFile(depositPage.testFileLocation+depositPage.testImageLocation);
      await expect.soft(depositPage.newTestImageFileInTable, 'We see the new file in the Deposits table').toBeVisible();

      await expect(depositPage.tableRowContext, 'The new folder is shown as selected').toHaveText(depositPage.newTestFolderSlug);
      await depositPage.uploadFile(depositPage.testFileLocation+depositPage.testWordDocLocation);
      await expect.soft(depositPage.newTestWordFileInTable, 'We see the new file in the Deposits table').toBeVisible();

      await expect(depositPage.tableRowContext, 'The new folder is shown as selected').toHaveText(depositPage.newTestFolderSlug);
      await depositPage.uploadFile(depositPage.testFileLocation+depositPage.testPdfDocLocation);
      await expect.soft(depositPage.newTestPdfFileInTable, 'We see the new file in the Deposits table').toBeVisible();

    });

    //TODO
    await test.step('We can create a file without giving it a name', async() => {

    });

    //TODO not sure if I can test the visual of the tree structure, but
    //we have tested nested in the create subfolder/files tests
    await test.step('Validate that folders and files are displayed in a tree structure, with the correct metadata', async() => {

    });

    //TODO
    await test.step( 'The file path as stored in the deposit uses the reduced character set (0-9a-z._-)', async() => {
    });


    //TODO
    await test.step('Check that a file upload will be rejected if the checksum is not correct', async() => {});

    //TODO
    await test.step('user cannot delete a folder that has contents', async() => {
    });

    //TODO
    await test.step('user can delete a file from the deposit', async() => {});

    //TODO
    await test.step('user can delete an empty folder from the deposit', async() => {});

    //TODO
    await test.step('user cannot delete any files in the root', async() => {});

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
      await expect.soft(depositPage.deleteDepositModalButton, 'Delete button is initially disabled').toBeDisabled();
      //TODO highlight to Tom and check if he agrees the checking of this box shouldn't be retained
      //await depositPage.confirmDeleteDeposit.check();
      await depositPage.deleteDepositModalButton.click();

      //Check back at the main deposits page and the deposit we created is not on the page
      await expect(page.getByText(`Deposit ${depositId} successfully deleted`), 'We see successful message telling us the deposit has been deleted').toBeVisible();

      //Check that depositId is not visible in the deposit table
      await expect(depositPage.depositLinkInTable(depositId), 'The deposit is no longer visible in the Deposits listing').not.toBeVisible();
    });
  });

  //TODO
  test.skip(`can create a Deposit within a Container, and the slug defaults to that location`, async ({page}) => {

  });

  //TODO
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

  test.skip(`Deposits listing`, async ({page}) => {

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




});



