import { expect, test } from '@playwright/test';
import { ContainerPages } from './pages/ContainerPages';

test.describe('Create Container Tests', () => {

  let containerPage: ContainerPages;

  test.beforeEach('Set up POM', async ({ page }) => {
    containerPage = new ContainerPages(page);
  });


  test('Create Container', async ({ page }) => {

    await test.step(`cannot create a container/folder without a properly formed slug`, async () => {
      await containerPage.goto();
      await containerPage.getStarted();  
      
      await containerPage.newFolderButton.click();
      await containerPage.folderPathNameInput.fill('Christine test folder');
      await containerPage.folderPathTitleInput.fill('Christine test folder');
      await containerPage.createNewFolderConfirmationButton.click();
      await expect(containerPage.alertMessage).toHaveText(containerPage.incorrectPathFormat);


    });

   

  });


});


