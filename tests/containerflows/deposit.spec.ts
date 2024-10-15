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

    await test.step('Create a Deposit with no name or note', async () => {
      await depositPage.getStarted();
      await depositPage.navigation.depositMenuOption.click();
      await expect(depositPage.navigation.depositsHeading, 'Deposits listing page has loaded').toBeVisible();
      await depositPage.newDepositButton.click();
      await depositPage.modalCreateNewDepositButton.click();

      //Validate that we're navigated into the new Deposit
      await expect(page, 'We have been navigated into the new Deposit page').toHaveURL(depositPage.depositsURL);
      await expect(depositPage.depositHeader, 'The new Deposit page has loaded').toBeVisible();
    });

    await test.step('Validate the created and modified dates are correct', async() => {

      //Check the created and modified dates are now
      const depositCreatedDate = await depositPage.depositCreatedDate.textContent();
      const depositLastModified = await depositPage.depositLastModified.textContent();
      //TODO fix once Tom has fixed
      checkDateIsWithinNumberOfSeconds(depositCreatedDate, 3_605_000);
      checkDateIsWithinNumberOfSeconds(depositLastModified, 3_605_000);

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

    //TODO
    await test.step('Can add the Archival Group name and a note, and the URI', async() => {
      //TODO this shouldn't be allowed
      await depositPage.archivalGroupInput.fill('Christine test uri');

      await depositPage.archivalGroupNameInput.fill('Christine test name');
      await depositPage.archivalGroupDepositNoteInput.fill('Christine test note');

      //TODO hit save?
      //TODO navigate away and then back to ensure the values have persisted

    });

    await test.step('Can toggle to hide and show the Archival group information', async() => {
      await depositPage.archivalGroupToggle.click();
      await expect(depositPage.archivalGroupInput).toBeHidden();
      await expect(depositPage.archivalGroupNameInput).toBeHidden();
      await expect(depositPage.archivalGroupDepositNoteInput).toBeHidden();

      await depositPage.archivalGroupToggle.click();
      await expect(depositPage.archivalGroupInput).toBeVisible();
      await expect(depositPage.archivalGroupNameInput).toBeVisible();
      await expect(depositPage.archivalGroupDepositNoteInput).toBeVisible();

    });

    await test.step('Validate that we cannot add a file or folder at the top level', async() => {
      await depositPage.uploadFile(depositPage.testImageLocation);
      await expect(depositPage.testImageInFilesToplevel).not.toBeVisible();
      await expect(depositPage.alertMessage).toHaveText(depositPage.cannotUploadTopLevelMessage);
    });

    //TODO
    await test.step('Validate that we can create a sub folder, and add a variety of files', async() => {
      //Create a new sub folder
      await depositPage.objectsFolder.click();
      await depositPage.createNewFolder.click();
      await depositPage.newFolderNameInput.fill(depositPage.newTestFolderTitle);
      await depositPage.newFolderDialogButton.click();
      await expect(depositPage.newTestFolderInTable, 'The new test folder has been created in the correct place in the hierarchy').toBeVisible();

      //Add a file to the new folder
      await depositPage.newTestFolderInTable.click();
      await depositPage.uploadFile(depositPage.testImageLocation);
      await expect(depositPage.newTestFileInTable).toBeVisible();


    });

    //TODO
    await test.step('We can create a file without giving it a name', async() => {

    });

    //TODO
    await test.step('Validate that folders and files are displayed in a tree structure, with the correct metadata', async() => {

    });

    //TODO
    await test.step( 'The file path as stored in the deposit uses the reduced character set (0-9a-z._-)', async() => {});

    //TODO
    await test.step('Check that a file upload will be rejected if the checksum is not correct', async() => {});

    //TODO
    await test.step('user can delete a file from the deposit', async() => {});
    //TODO
    await test.step('user cannot delete any files in the root', async() => {});
    //TODO
    await test.step('user can delete a folder from the deposit', async() => {});
    //TODO
    await test.step('user can only delete an empty folder (need to delete files in it first)', async() => {
  });
});

  //TODO
  test.skip(`can create a Deposit within a Container, and the slug defaults to that location`, async ({page}) => {

  });

  //TODO
  //What's mandatory, what's not?
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



