import { expect, test } from '@playwright/test';
import { ContainerPages } from './pages/ContainerPages';
import { generateUniqueId } from '../helpers/helpers';


test.describe('Create Container Tests', () => {

  let containerPage: ContainerPages;

  test.beforeEach('Set up POM', async ({ page }) => {
    containerPage = new ContainerPages(page);
  });

  test(`cannot create a container/folder without a properly formed slug`, async () => {
    await containerPage.goto();
    await containerPage.getStarted();  
    
    await containerPage.newFolderButton.click();
    //Note passing title into slug here, which isn't properly formed as it's a Title not a slug
    await containerPage.folderPathNameInput.fill(containerPage.playwrightContainerTitle);
    await containerPage.folderPathTitleInput.fill(containerPage.playwrightContainerTitle);
    await containerPage.createNewFolderConfirmationButton.click();
    await expect(containerPage.alertMessage, 'The incorrect path format error message is shown').toHaveText(containerPage.incorrectPathFormatMessage);
  });

  test(`cannot create a container/folder with invalid characters in the path`, async () => {
    await containerPage.goto();
    await containerPage.getStarted();  

    for (var slug of containerPage.playwrightContainerInvalidSlugs){
      await containerPage.newFolderButton.click();
      await containerPage.folderPathNameInput.fill(slug);
      await containerPage.folderPathTitleInput.fill(slug);
      await containerPage.createNewFolderConfirmationButton.click();
      await expect(containerPage.alertMessage, 'The incorrect path format error message is shown').toHaveText(containerPage.incorrectPathFormatMessage);
    }
  });

  test.skip(`can create a container/folder with a properly formed slug`, async () => {

    await containerPage.goto();
    await containerPage.getStarted();  
    await containerPage.newFolderButton.click();
    const uniqueId = generateUniqueId();
    const folderTitle = `${containerPage.playwrightContainerTitle} ${uniqueId}`;
    await containerPage.folderPathNameInput.fill(`${containerPage.playwrightContainerSlug}-${uniqueId}`);
    await containerPage.folderPathTitleInput.fill(folderTitle);
    await containerPage.createNewFolderConfirmationButton.click();
    await expect(containerPage.alertMessage, 'The successful created container message is shown').toContainText(containerPage.createdContainerMessage);
    await expect(containerPage.alertMessage, 'The successful created container message is shown and references the correct title').toContainText(folderTitle);
  });

  //TODO unskip - fails just now because YOU CAN do this, Tom is working on this
  test.skip(`cannot create a container/folder with an existing slug`, async () => {

    await containerPage.goto();
    await containerPage.getStarted();  
    await containerPage.newFolderButton.click();
    const uniqueId = generateUniqueId();
    const folderTitle = `${containerPage.playwrightContainerTitle} ${uniqueId}`;
    await containerPage.folderPathNameInput.fill(`${containerPage.playwrightContainerSlug}-${uniqueId}`);
    await containerPage.folderPathTitleInput.fill(folderTitle);
    await containerPage.createNewFolderConfirmationButton.click();
    await expect(containerPage.alertMessage, 'The successful created container message is shown').toContainText(containerPage.createdContainerMessage);
    await expect(containerPage.alertMessage, 'The successful created container message is shown and references the correct title').toContainText(folderTitle);

    //Now try again with the same slug
    await containerPage.newFolderButton.click();
    await containerPage.folderPathNameInput.fill(`${containerPage.playwrightContainerSlug}-${uniqueId}`);
    await containerPage.folderPathTitleInput.fill(folderTitle);
    await containerPage.createNewFolderConfirmationButton.click();
    await expect(containerPage.alertMessage, 'The duplicate path error message is shown').toContainText(containerPage.duplicateContainerMessage);
  });

});


