
import { expect, type Locator, type Page } from '@playwright/test';


export class ContainerPages {
  readonly page: Page;
  readonly newFolderButton: Locator;
  readonly folderPathNameInput: Locator;
  readonly folderPathTitleInput: Locator;
  readonly createNewFolderConfirmationButton: Locator;
  readonly alertMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newFolderButton = page.getByRole('button', {name: 'New Folder'});
    this.folderPathNameInput = page.getByRole('textbox', {name: 'Folder path name'});
    this.folderPathTitleInput = page.getByRole('textbox', {name: 'Folder title'});
    this.createNewFolderConfirmationButton = page.getByRole('button', {name:'Create New Folder'});
    this.alertMessage = page.getByRole('alert');
  }

  async goto() {
    await this.page.goto('/browse/_for_tests');
  }

  async getStarted() {
    await expect(this.newFolderButton).toBeVisible();
  }

}


  

