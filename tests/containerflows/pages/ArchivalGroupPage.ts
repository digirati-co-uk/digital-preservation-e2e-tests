
import {BrowserContext, expect, Locator, Page} from '@playwright/test';
import {NavigationPage} from "./NavigationPage";
import {DepositPage} from "./DepositPage";

export class ArchivalGroupPage {
  readonly page: Page;
  readonly navigationPage: NavigationPage;
  readonly depositPage: DepositPage;

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
  readonly diffBinariesToRename : Locator;
  readonly diffContainersAdded : Locator;
  readonly diffBinariesAdded : Locator;
  readonly diffBinariesPatched : Locator;
  readonly diffContainersDeleted : Locator;
  readonly diffBinariesDeleted : Locator;
  readonly diffContainersRenamed : Locator;
  readonly diffBinariesRemoved : Locator;

  //Run Import Result Page
  readonly importJobPageTitle : Locator;

  //Archival Group Pages
  readonly archivalGroupPageHeading : Locator;
  readonly breadcrumbs : Locator;
  readonly versionsButton : Locator;
  readonly iiifButton : Locator;
  readonly resourcesTableRows : Locator;
  readonly metadataFolderInTable: Locator;
  readonly objectsFolderInTable : Locator;
  readonly metsRowInTable : Locator;
  readonly goToArchivalGroupButton : Locator;
  readonly objectsPageTitle : Locator;
  readonly createNewDepositModalButton : Locator;
  readonly copyFilesFromS3Checkbox : Locator;

  //Binary page locators
  readonly nameField : Locator;
  readonly pathField : Locator;
  readonly contentTypeField : Locator;
  readonly fileFormatField : Locator;
  readonly virusScanField : Locator;
  readonly sizeField : Locator;
  readonly digestField : Locator;
  readonly contentField : Locator;

  //<small>Created by: <a class="dlip-agent" href="/agents/zz_libplaywrighttest@leeds.ac.uk">zz_libplaywrighttest@leeds.ac.uk</a> | Last modified by: <a class="dlip-agent" href="/agents/zz_libplaywrighttest@leeds.ac.uk">zz_libplaywrighttest@leeds.ac.uk</a></small>

  constructor(page: Page) {
    this.page = page;
    this.navigationPage = new NavigationPage(page);
    this.depositPage = new DepositPage(page);

    //Create diff page
    this.runImportPreserveButton = page.getByRole('button', { name: 'Run Import (Preserve)' });
    this.diffStatus = page.getByLabel('status');
    this.diffDepositValue = page.getByLabel('deposit');
    this.diffArchivalGroup = page.getByLabel('archival group', {exact:true});
    //this.diffArchivalGroup = page.getByLabel('archival group', {exact:true}).getByRole('link');
    this.diffArchivalGroupName = page.getByLabel('archival group name');
    this.diffSourceVersion = page.getByLabel('source version');
    this.diffContainersToAdd = page.getByLabel('containers to add');
    this.diffBinariesToAdd = page.getByLabel('binaries to add');
    this.diffBinariesToPatch = page.getByLabel('binaries to patch');
    this.diffContainersToDelete = page.getByLabel('containers to delete');
    this.diffBinariesToDelete = page.getByLabel('binaries to delete');
    this.diffContainersToRename = page.getByLabel('containers to rename');
    this.diffBinariesToRename = page.getByLabel('binaries to rename');

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
    this.archivalGroupPageHeading = page.getByRole('heading', { name: this.depositPage.testArchivalGroupName });
    this.breadcrumbs = page.getByRole('navigation');
    this.versionsButton = page.getByRole('link', { name: 'Versions' });
    this.iiifButton = page.getByRole('link', { name: 'IIIF'});
    this.resourcesTableRows = page.getByRole('table', {name: 'table-resources'}).locator('tbody tr');
    this.metadataFolderInTable = this.resourcesTableRows.nth(0).getByLabel('td-path');
    this.objectsFolderInTable = this.resourcesTableRows.nth(1).getByLabel('td-path');
    this.metsRowInTable = this.resourcesTableRows.nth(2).getByLabel('td-path');
    this.goToArchivalGroupButton = page.getByRole('link', {name: 'Go to Archival Group'});
    this.objectsPageTitle = page.getByRole('heading', {name: this.depositPage.objectsFolderName});
    this.createNewDepositModalButton = page.getByRole('button', {name: 'Create New Deposit'});
    this.copyFilesFromS3Checkbox = page.getByRole('dialog').getByRole('checkbox');

    //Binary page locators
    this.nameField = this.page.getByRole('row').filter({has: this.page.getByRole('rowheader', {name: 'Name'})}).getByRole('cell');
    this.pathField = this.page.getByRole('row').filter({has: this.page.getByRole('rowheader', {name: 'Path'})}).getByRole('cell');
    this.contentTypeField = this.page.getByRole('row').filter({has: this.page.getByRole('rowheader', {name: 'Content Type'})}).getByRole('cell');
    this.fileFormatField = this.page.getByRole('row').filter({has: this.page.getByRole('rowheader', {name: 'File format'})}).getByRole('cell');
    this.virusScanField = this.page.getByRole('row').filter({has: this.page.getByRole('rowheader', {name: 'Virus scan'})}).getByRole('cell');
    this.sizeField = this.page.getByRole('row').filter({has: this.page.getByRole('rowheader', {name: 'Size'})}).getByRole('cell');
    this.digestField = this.page.getByRole('row').filter({has: this.page.getByRole('rowheader', {name: 'Digest'})}).getByRole('cell');
    this.contentField = this.page.getByRole('row').filter({has: this.page.getByRole('rowheader', {name: 'Content', exact: true})}).getByRole('cell');
  }

  async checkModifiedBinariesFoldersEmpty(){
    await expect(this.diffBinariesPatched, 'Binaries Patched is empty').toBeEmpty();
    await expect(this.diffContainersDeleted, 'Containers Deleted is empty').toBeEmpty();
    await expect(this.diffBinariesDeleted, 'Binaries Deleted is empty').toBeEmpty();
    await expect(this.diffContainersRenamed, 'Containers Renamed is empty').toBeEmpty();
    await expect(this.diffBinariesRemoved, 'Binaries Removed is empty').toBeEmpty();
  }

  async checkToModifyBinariesFoldersEmpty(){
    await expect(this.diffBinariesToPatch, 'Binaries to Patch is empty').toBeEmpty();
    await expect(this.diffContainersToDelete, 'Containers to Delete is empty').toBeEmpty();
    await expect(this.diffBinariesToDelete, 'Binaries to Delete is empty').toBeEmpty();
    await expect(this.diffContainersToRename, 'Containers to Rename is empty').toBeEmpty();
    await expect(this.diffBinariesToRename, 'Binaries to Rename is empty').toBeEmpty();
  }

  //TODO may need to rethink this, if the environment takes some time to process jobs to completion
  //as this will block the tests
  async allowJobToComplete(){
    //Refresh the page until changes to completed
    let jobCompleted : boolean = false;
    const importJobURL = this.page.url();
    while (!jobCompleted){
      //Wait for a few seconds before reloading to give the job time to complete
      await this.page.waitForTimeout(2_000);
      await this.page.goto(importJobURL);
      await expect(this.diffStatus, 'The Status of the diff is visible').toBeVisible();
      const status = await this.diffStatus.textContent();
      jobCompleted =  status == 'completed';
    }
  }

  generateBreadcrumbLocator( breadcrumbName: string): Locator{
    return this.breadcrumbs.getByRole('link', { name:  breadcrumbName});
  }

  async getArchivalGroupHistoryItem(nameOfItem: string) : Promise<string> {
    return await this.page.getByRole('row').filter({has: this.page.getByRole('rowheader').getByText(nameOfItem, {exact:true})}).getByRole('cell').textContent();
  }

  async createDepositFromArchivalGroup(archivalGroupURL: string, copyFromS3: boolean){
    await this.page.goto(archivalGroupURL);
    await expect(this.depositPage.newDepositButton, 'Can see the New Deposit button').toBeVisible();
    await this.depositPage.newDepositButton.click();
    if(copyFromS3){
      //Copy the s3 contents
      await this.copyFilesFromS3Checkbox.check();
    }
    await this.createNewDepositModalButton.click();
  }

}


  

