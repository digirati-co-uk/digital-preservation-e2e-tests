
import { expect, type Locator, type Page } from '@playwright/test';
export class ContainerPages {
  readonly page: Page;
  readonly newFolderButton: Locator;
  readonly folderPathNameInput: Locator;
  readonly folderPathTitleInput: Locator;
  readonly createNewFolderConfirmationButton: Locator;
  readonly alertMessage: Locator;
  readonly incorrectPathFormatMessage: string; 
  readonly createdContainerMessage: string;
  readonly playwrightContainerTitle: string;
  readonly playwrightContainerSlug: string;
  readonly duplicateContainerMessage: string;
  readonly playwrightContainerInvalidSlugs: string[];
  readonly createdBy : string;
  readonly baseBrowsePath: string;
  readonly baseAPIPath: string;

  constructor(page: Page) {
    this.page = page;

    //consts
    this.incorrectPathFormatMessage = 'Invalid container file path - only a-z, 0-9 and .-_ are allowed.';
    this.createdContainerMessage = 'Created Container';
    this.playwrightContainerTitle = 'Playwright Container Test';
    this.playwrightContainerSlug = 'Playwright-Container-Slug';
    this.playwrightContainerInvalidSlugs = ['&%&^%&','looks-almost-correct*'];
    //TODO Set to Tom's new message
    this.duplicateContainerMessage = 'Invalid container file path - only a-z, 0-9 and .-_ are allowed.';
    this.createdBy = '/agents/dlipdev';
    this.baseBrowsePath = '/browse/_for_tests';
    this.baseAPIPath = '/repository/_for_tests/';

    //Locators
    this.newFolderButton = page.getByRole('button', {name: 'New Folder'});
    this.folderPathNameInput = page.getByRole('textbox', {name: 'Folder path name'});
    this.folderPathTitleInput = page.getByRole('textbox', {name: 'Folder title'});
    this.createNewFolderConfirmationButton = page.getByRole('button', {name:'Create New Folder'});
    this.alertMessage = page.getByRole('alert');
  }

  async goto() {
    await this.page.goto(this.baseBrowsePath);
  }

  async getStarted() {
    await expect(this.newFolderButton).toBeVisible();
  }

}


  

