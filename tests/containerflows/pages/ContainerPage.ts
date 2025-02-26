
import { expect, type Locator, type Page } from '@playwright/test';
import {NavigationPage} from "./NavigationPage";
export class ContainerPage {
  readonly page: Page;
  readonly navigationPage : NavigationPage;
  readonly newFolderButton: Locator;
  readonly folderPathNameInput: Locator;
  readonly folderPathTitleInput: Locator;
  readonly createNewFolderConfirmationButton: Locator;
  readonly alertMessage: Locator;
  readonly incorrectPathFormatMessage: string; 
  readonly createdContainerMessage: string;
  readonly playwrightContainerTitle: string;
  readonly playwrightContainerSlug: string;
  readonly titleStrippedOfUpperCaseSpaces: string;
  readonly duplicateContainerMessage: string;
  readonly createdBy : string;
  readonly maxTableRowsShowingAllColumns: number;
  readonly containerTableRow: Locator;
  readonly deleteContainerButton: Locator;
  readonly confirmDeleteContainer: Locator;
  readonly resourcesTableRows: Locator;

  //Column headers
  readonly pathHeader: Locator;
  readonly titleHeader: Locator;
  readonly lastModifiedHeader: Locator;
  readonly byHeader: Locator;
  readonly createdHeader: Locator;
  readonly archivalGroupHeader: Locator;

  constructor(page: Page) {
    this.page = page;
    this.navigationPage = new NavigationPage(this.page);

    //consts
    this.incorrectPathFormatMessage = 'Invalid container file path - only a-z, 0-9 and .-_ are allowed.';
    this.createdContainerMessage = 'Created Container';
    this.playwrightContainerTitle = 'Playwright Container Testing';
    this.playwrightContainerSlug = 'playwright-container-testing';
    this.titleStrippedOfUpperCaseSpaces= 'laywrightontaineresting';
    this.duplicateContainerMessage = 'Failed to create Container: Conflict';
    this.createdBy = '/agents/dlipdev';
    this.maxTableRowsShowingAllColumns = 19;

    //Locators
    this.newFolderButton = page.getByRole('button', {name: 'New Folder'});
    this.folderPathNameInput = page.getByRole('textbox', {name: 'Folder path name'});
    this.folderPathTitleInput = page.getByRole('textbox', {name: 'Folder title'});
    this.createNewFolderConfirmationButton = page.getByRole('button', {name:'Create New Folder'});
    this.alertMessage = page.getByRole('alert');
    this.containerTableRow = page.getByRole('row');
    this.deleteContainerButton = page.getByRole('button', {name: 'Delete Container'});
    this.confirmDeleteContainer = page.getByRole('button', {name: 'Delete', exact: true});
    this.resourcesTableRows = page.getByRole('table', {name: 'table-resources'}).getByRole('row');

    //Column header locators
    this.pathHeader = page.getByRole('columnheader', {name: 'Path'});
    this.titleHeader = page.getByRole('columnheader', {name: 'Title'});
    this.lastModifiedHeader = page.getByRole('columnheader', {name: 'Last Modified'});
    this.byHeader = page.getByRole('columnheader', {name: 'By'});
    this.createdHeader = page.getByRole('columnheader', {name: 'Created'});
    this.archivalGroupHeader = page.getByRole('columnheader').getByRole('img');
  }

  async goto() {
    await this.page.goto(this.navigationPage.baseBrowsePath);
  }

  async getStarted() {
    await this.goto();
    await expect(this.navigationPage.baseBrowsePathHeading, 'The page heading is shown').toBeVisible();
    await expect(this.newFolderButton, 'The New Folder button is available').toBeVisible();
  }

  async createContainer(slug: string, title: string){
    await this.newFolderButton.click();
    await this.folderPathTitleInput.fill(title);
    await this.folderPathNameInput.fill(slug);
    await this.createNewFolderConfirmationButton.click();
  };

  async checkCorrectContainerTitle(folderTitle: string){
    await expect(this.page.getByRole('heading', {name: `${folderTitle.toLowerCase()}`}), 'We have successfully navigated into the Container').toBeVisible();
  };

  getFolderSlug(folderSlug: string) : Locator {
    return this.page.getByRole('link', {name: folderSlug, exact:true});
  };

  getBreadCrumbSlug(breadCrumb: string) : Locator {
    return this.page.getByRole('link', {name: breadCrumb, exact:true});
  }

}


  

