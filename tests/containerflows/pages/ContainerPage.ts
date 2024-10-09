
import { expect, type Locator, type Page } from '@playwright/test';
export class ContainerPage {
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
  readonly basePath: string;
  readonly baseBrowsePathHeading: Locator;
  readonly containerTableRow: Locator;

  constructor(page: Page) {
    this.page = page;

    //consts
    this.incorrectPathFormatMessage = 'Invalid container file path - only a-z, 0-9 and .-_ are allowed.';
    this.createdContainerMessage = 'Created Container';
    this.playwrightContainerTitle = 'Playwright Container Testing';
    this.playwrightContainerSlug = 'Playwright-Container-Slug';
    this.playwrightContainerInvalidSlugs = ['&%&^%&','looks-almost-correct*'];
    this.duplicateContainerMessage = 'Failed to create Container: Conflict';
    this.createdBy = '/agents/dlipdev';
    this.basePath = '/_for_tests/playwright-testing';
    this.baseBrowsePath = `/browse${this.basePath}`;
    this.baseAPIPath = `/repository${this.basePath}/`;

    //Locators
    this.newFolderButton = page.getByRole('button', {name: 'New Folder'});
    this.folderPathNameInput = page.getByRole('textbox', {name: 'Folder path name'});
    this.folderPathTitleInput = page.getByRole('textbox', {name: 'Folder title'});
    this.createNewFolderConfirmationButton = page.getByRole('button', {name:'Create New Folder'});
    this.alertMessage = page.getByRole('alert');
    this.baseBrowsePathHeading = page.getByRole('heading', {name: 'Browse - Playwright Testing'});
    this.containerTableRow = page.getByRole('row');
  }

  async goto() {
    await this.page.goto(this.baseBrowsePath);
  }

  async getStarted() {
    await this.goto();
    await expect(this.baseBrowsePathHeading).toBeVisible();
    await expect(this.newFolderButton).toBeVisible();
  }

  async createContainer(slug: string, title: string){
    await this.newFolderButton.click();
    await this.folderPathNameInput.fill(slug);
    await this.folderPathTitleInput.fill(title);
    await this.createNewFolderConfirmationButton.click();
  };

  async checkCorrectContainerTitle(folderTitle: string){
    await expect(this.page.getByRole('heading', {name: `Browse - ${folderTitle.toLowerCase()}`}), 'We have successfully navigated into the Container').toBeVisible();
  };

  getFolderTitle(folderTitle: string) : Locator {
    return this.page.getByRole('link', {name: folderTitle, exact:true});
  };

}


  

