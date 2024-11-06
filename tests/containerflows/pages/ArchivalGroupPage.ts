
import {expect, Locator, Page} from '@playwright/test';
import {NavigationPage} from "./NavigationPage";
import {DepositPage} from "./DepositPage";

export class ArchivalGroupPage {
  readonly page: Page;
  readonly navigation: NavigationPage;
  readonly deposit: DepositPage;

  //Deposit page
  readonly createDiffImportJobButton :Locator ;
  readonly noCurrentImportJobsText : Locator;

  //Create diff page
  readonly runImportPreserveButton : Locator;
  readonly diffStatus : Locator;
  readonly diffDepositValue : Locator;
  readonly diffArchivalGroup : Locator;
  readonly diffArchivalGroupName : Locator;
  readonly diffDateBegun : Locator;
  readonly diffDateFinished : Locator;
  readonly diffSourceVersion : Locator;
  readonly diffNewVersion : Locator;
  readonly diffCreated : Locator;
  readonly diffCreatedBy : Locator;
  readonly diffImportJob : Locator;
  readonly diffOriginalImportJob : Locator;
  readonly diffContainersToAdd : Locator;
  readonly diffBinariesToAdd : Locator;
  readonly diffBinariesToPatch : Locator;
  readonly diffContainersToDelete : Locator;
  readonly diffBinariesToDelete : Locator;
  readonly diffContainersToRename : Locator;
  readonly diffBinariesToRemove : Locator;
  readonly diffContainersAdded : Locator;
  readonly diffBinariesAdded : Locator;
  readonly diffBinariesPatched : Locator;
  readonly diffContainersDeleted : Locator;
  readonly diffBinariesDeleted : Locator;
  readonly diffContainersRenamed : Locator;
  readonly diffBinariesRemoved : Locator;

  //Run Import Result Page
  readonly importJobPageTitle : Locator;

  //Archival Group Page
  readonly archivalGroupPageHeading : Locator;
  readonly breadcrumbs : Locator;
  readonly versionsButton : Locator;
  readonly iiifButton : Locator;

  constructor(page: Page) {
    this.page = page;
    this.navigation = new NavigationPage(page);
    this.deposit = new DepositPage(page);

    //Deposit page
    this.createDiffImportJobButton = page.getByRole('button', { name: 'Create diff import job' });
    this.noCurrentImportJobsText = page.getByText('There are no submitted import jobs for this Deposit');

    //Create diff page
    this.runImportPreserveButton = page.getByRole('button', { name: 'Run Import (Preserve)' });
    this.diffStatus = page.getByLabel('status');
    this.diffDepositValue = page.getByLabel('deposit');
    this.diffArchivalGroup = page.getByLabel('archival group', {exact:true});
    this.diffArchivalGroupName = page.getByLabel('archival group name');
    this.diffSourceVersion = page.getByLabel('source version');
    this.diffContainersToAdd = page.getByLabel('containers to add');
    this.diffBinariesToAdd = page.getByLabel('binaries to add');
    this.diffBinariesToPatch = page.getByLabel('binaries to patch');
    this.diffContainersToDelete = page.getByLabel('containers to delete');
    this.diffBinariesToDelete = page.getByLabel('binaries to delete');
    this.diffContainersToRename = page.getByLabel('containers to rename');
    this.diffBinariesToRemove = page.getByLabel('binaries to rename');

    //Run Import Result Page
    this.importJobPageTitle = page.getByRole('heading', {name: `Import Job Result`});
    this.diffDateBegun = page.getByLabel('date begun');
    this.diffDateFinished = page.getByLabel('date finished');
    this.diffNewVersion = page.getByLabel('new version');
    this.diffCreated = page.getByLabel('created', {exact:true});
    this.diffCreatedBy = page.getByLabel('created by');
    this.diffImportJob = page.getByLabel('import job', {exact:true});
    this.diffOriginalImportJob = page.getByLabel('original import job');
    this.diffContainersAdded = page.getByLabel('containers added');
    this.diffBinariesAdded = page.getByLabel('binaries added');
    this.diffBinariesPatched = page.getByLabel('binaries patched');
    this.diffContainersDeleted = page.getByLabel('containers deleted');
    this.diffBinariesDeleted = page.getByLabel('binaries deleted');
    this.diffContainersRenamed = page.getByLabel('containers renamed');
    this.diffBinariesRemoved = page.getByLabel('binaries renamed');

    //Archival Group Page
    this.archivalGroupPageHeading = page.getByRole('heading', { name: this.deposit.testArchivalGroupName });
    this.breadcrumbs = page.getByRole('navigation');
    this.versionsButton = page.getByRole('link', { name: 'Versions' });
    this.iiifButton = page.getByRole('link', { name: 'IIIF' });

  }

  async goto() {
  }

  async getStarted() {
  }

  async checkModifiedBinariesFoldersEmpty(){
    await expect(this.diffBinariesPatched).toBeEmpty();
    await expect(this.diffContainersDeleted).toBeEmpty();
    await expect(this.diffBinariesDeleted).toBeEmpty();
    await expect(this.diffContainersRenamed).toBeEmpty();
    await expect(this.diffBinariesRemoved).toBeEmpty();
  }

  async checkToModifyBinariesFoldersEmpty(){
    await expect(this.diffBinariesToPatch).toBeEmpty();
    await expect(this.diffContainersToDelete).toBeEmpty();
    await expect(this.diffBinariesToDelete).toBeEmpty();
    await expect(this.diffContainersToRename).toBeEmpty();
    await expect(this.diffBinariesToRemove).toBeEmpty();
  }

  async allowJobToComplete(){
    //Refresh the page until changes to completed
    let jobCompleted : boolean = false;
    const importJobURL = this.page.url();
    while (!jobCompleted){
      //Wait for a few seconds before reloading to give the job time to complete
      await this.page.waitForTimeout(2_000);
      await this.page.goto(importJobURL);
      await expect(this.diffStatus).toBeVisible();
      const status = await this.diffStatus.textContent();
      jobCompleted =  status == 'completed';
    }
  }

  generateBreadcrumb( breadcrumbName: string): Locator{
    return this.breadcrumbs.getByRole('link', { name:  breadcrumbName});
  }

  async getArchivalGroupHistoryItem(nameOfItem: string) : Promise<string> {
    return await this.page.getByRole('row').filter({has: this.page.getByRole('rowheader').getByText(nameOfItem, {exact:true})}).getByRole('cell').textContent();
  }
}


  

