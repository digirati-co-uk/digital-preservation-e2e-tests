
import {expect, Locator, Page} from '@playwright/test';
import {NavigationPage} from "./NavigationPage";
import * as path from 'path';

export class DepositPage {
  readonly page: Page;
  readonly navigationPage: NavigationPage;

  //consts
  readonly notYetPopulated:string;
  readonly objectsFolderName : string;
  readonly testImageLocation : string;
  readonly testImageWithInvalidCharsLocation : string;
  //readonly cannotUploadTopLevelMessage : string;
  readonly newTestFolderTitle : string;
  readonly newTestFolderSlug : string;
  readonly testFolderSlugShouldNotExist: string;
  readonly depositsURL: RegExp;
  readonly testInvalidArchivalURI : string;
  readonly testFileLocation : string;
  readonly testValidArchivalURI : string;
  readonly testArchivalGroupName : string;
  readonly testDepositNote : string;
  readonly testWordDocLocation : string;
  readonly testPdfDocLocation : string;
  readonly metsFileName : string;

  //Locator to initially create the deposit
  readonly newDepositButton: Locator;

  //Deposit page
  //Deposit history information
  readonly depositCreatedDate : Locator;
  readonly depositCreatedBy : Locator;
  readonly depositLastModified : Locator;
  readonly depositLastModifiedBy : Locator;
  readonly depositPreserved : Locator;
  readonly depositPreservedBy : Locator;
  readonly depositVersionPreserved : Locator;
  readonly depositExported : Locator;
  readonly depositExportedBy  : Locator;
  readonly depositVersionExported  : Locator;

  //Header Locators
  readonly depositHeaderNoSlug : Locator;
  readonly depositHeaderSlug : Locator;

  //Deposit file structure table locators
  readonly depositFilesTable : Locator;
  //readonly depositFilesDirectories : Locator;
  //readonly depositFilesFiles : Locator;
  readonly objectsFolder : Locator;
  readonly uploadFileToObjectsFolder :Locator;
  readonly createFolderWithinObjectsFolder : Locator;
  readonly metsFile : Locator;
  //readonly testImageInFilesToplevel : Locator;
  //readonly testImageInFilesCorrect: Locator;
  //readonly newTestFolderInTableShouldNotExist: Locator;
  readonly newTestFolderInTable : Locator;
  readonly uploadFileToTestFolder : Locator;
  readonly deleteTestFolder : Locator;
  readonly newTestImageFileInTable : Locator;
  readonly newTestImageFileTranslatedCharsInTable : Locator;
  readonly newTestWordFileInTable : Locator;
  readonly newTestPdfFileInTable : Locator;

  //Actions on files and folders
  readonly uploadFileIcon : Locator;
  readonly createFolderIcon : Locator;
  readonly deleteFileIcon : Locator;
  readonly deleteFolderIcon : Locator;

  //Archival Group input fields
  readonly archivalGroupInput : Locator;
  readonly archivalGroupNameInput : Locator;
  readonly archivalGroupDepositNoteInput : Locator;

  //Top level buttons,alerts
  readonly alertMessage : Locator;
  readonly deleteDepositButton : Locator;
  readonly updateArchivalPropertiesButton : Locator;

  //New Deposit Dialog used in 'Browse - create deposit ' journey
  //readonly modalArchivalGroupName : Locator;
  //readonly modalArchivalNote : Locator;
  readonly modalArchivalSlug : Locator;
  readonly modalCreateNewDepositButton : Locator;
  readonly slugDisplayOnModal: Locator;

  //New folder dialog
  readonly newFolderCloseDialogButton : Locator;
  readonly newFolderNameInput : Locator;
  readonly newFolderDialogButton : Locator;

  //Delete Deposit Modal
  readonly deleteDepositModalButton : Locator;
  readonly confirmDeleteDeposit: Locator;

  //Delete item modal
  readonly deleteItemModalButton : Locator;

  //New file dialog
  readonly fileUploadWidget: Locator;
  readonly fileUploadSubmitButton: Locator;
  readonly fileNameField : Locator;
  readonly checksumField : Locator;

  //Import job fields
  readonly importJobStatusCompleted : Locator;

  //Deposit Listing Page
  readonly depositsTable: Locator;
  readonly depositTableRows: Locator;
  readonly depositRow1: Locator;
  readonly depositRow1Slug: Locator;
  readonly depositRow1Status: Locator;
  readonly showAllDepositsButton: Locator;
  readonly showActiveDepositsButton: Locator;

  //Deposit Listing Page - Locators to get all instances of a column value
  readonly allRowsArchivalGroup: Locator;
  readonly allRowsArchivalGroupSlug: Locator;
  readonly allRowsArchivalGroupName: Locator;
  readonly allRowsStatus: Locator;
  readonly allRowsLastModifiedDate: Locator;
  readonly allRowsLastModifiedBy: Locator;
  readonly allRowsCreatedDate: Locator;
  readonly allRowsCreatedBy: Locator;
  readonly allRowsPreservedDate: Locator;
  readonly allRowsPreservedBy: Locator;
  readonly allRowsExportedDate: Locator;
  readonly allRowsExportedBy: Locator;

  //Deposit Listing Page - Locators to get all instances of a column value, for preserved rows only
  readonly allPreservedRowsPreservedDate: Locator;
  readonly allPreservedRowsPreservedBy: Locator;
  readonly allPreservedRowsExportedDate: Locator;
  readonly allPreservedRowsExportedBy: Locator;

  //Deposit Listing Page - Locators to sort the columns
  readonly sortByArchivalGroup: Locator;
  readonly sortByStatus: Locator;
  readonly sortByLastModified: Locator;
  readonly sortByCreatedDate: Locator;




  constructor(page: Page) {
    this.page = page;
    this.navigationPage = new NavigationPage(page);

    //consts
    this.notYetPopulated = '-';
    //Note - format of deposits might change in the future
    //At some point we might acquire identifiers for Deposits (and other things) from a Leeds external
    //identity service, in which case they might no longer be 8-char alphanumeric.
    //They will be for now though.
    this.depositsURL = /deposits\/\w{8}/;
    this.testFileLocation = '../../../test-data/deposit/';
    this.objectsFolderName = 'objects';
    this.metsFileName = '__METSlike.json';
    this.testImageLocation = 'test_image.png';
    this.testImageWithInvalidCharsLocation = 'test&&image.png';
    this.testWordDocLocation = 'test_word_document.docx';
    this.testPdfDocLocation = 'test_pdf_document.pdf';
    //this.cannotUploadTopLevelMessage = 'Uploaded files must go in or below the objects folder.';
    this.newTestFolderTitle = 'New test folder inside objects';
    this.newTestFolderSlug = this.objectsFolderName + '/new-test-folder-inside-objects';
    this.testFolderSlugShouldNotExist = 'new-test-folder-inside-objects';
    this.testDepositNote = 'Playwright test archival group note';
    this.testArchivalGroupName = 'Playwright test archival group name';
    this.testInvalidArchivalURI = 'playwright invalid slug';
    this.testValidArchivalURI = 'playwright-valid-slug-abc';

    //Locator to initially create the deposit
    this.newDepositButton = page.getByRole('button', { name: 'New Deposit' });

    //DEPOSIT PAGE:
    //Deposit history information
    this.depositCreatedDate = page.getByLabel('created', {exact:true});
    this.depositCreatedBy = page.getByLabel('created-by', {exact:true});
    this.depositLastModified = page.getByLabel('last-modified', {exact:true});
    this.depositLastModifiedBy = page.getByLabel('last-modified-by', {exact:true});
    this.depositPreserved = page.getByLabel('preserved', {exact:true});
    this.depositPreservedBy = page.getByLabel('preserved-by', {exact:true});
    this.depositVersionPreserved = page.getByLabel('version-preserved', {exact:true});
    this.depositExported = page.getByLabel('exported', {exact:true});
    this.depositExportedBy = page.getByLabel('exported-by', {exact:true});
    this.depositVersionExported = page.getByLabel('version-exported', {exact:true});

    //Header Locators
    this.depositHeaderNoSlug = page.getByRole('heading', {name: /Deposit \w{8}/});
    this.depositHeaderSlug = page.getByRole('heading', {name: /Deposit/});

    //Actions on files and folders
    this.uploadFileIcon = page.getByLabel('upload file', { exact: true });
    this.createFolderIcon = page.getByLabel('new folder', { exact: true });
    this.deleteFileIcon = page.getByLabel('delete file', { exact: true });
    this.deleteFolderIcon = page.getByLabel('delete folder', { exact: true });

    //Deposit file structure table locators
    this.depositFilesTable = page.getByRole('table', {name: 'table-deposit-files'});
    //this.depositFilesDirectories = this.depositFilesTable.locator('*[data-type="directory"]');
    //this.depositFilesFiles = this.depositFilesTable.locator('*[data-type="file"]');

    //Locators specific to the objects folder
    this.objectsFolder = this.depositFilesTable.locator(`[data-type="directory"][data-path="${this.objectsFolderName}"]`);
    this.uploadFileToObjectsFolder = this.objectsFolder.locator(this.uploadFileIcon);
    this.createFolderWithinObjectsFolder = this.objectsFolder.locator(this.createFolderIcon);

    //METS file locators
    this.metsFile = this.depositFilesTable.locator('[data-type="file"][data-path="__METSlike.json"]');

    //Locators specific to the test folders / files
    //this.testImageInFilesToplevel = this.depositFilesTable.locator(`[data-type="file"][data-path="${this.testImageLocation}"]`);
    //this.testImageInFilesCorrect = this.depositFilesTable.locator(`[data-type="file"][data-path="${this.objectsFolderName}/${this.testImageLocation}"]`);
    this.newTestImageFileTranslatedCharsInTable = page.locator(`[data-type="file"][data-path="${this.objectsFolderName}/${this.testImageWithInvalidCharsLocation.replaceAll('&','-')}"]`);
    this.newTestFolderInTable = page.locator(`[data-type="directory"][data-path="${this.newTestFolderSlug}"]`);
    this.uploadFileToTestFolder = this.newTestFolderInTable.locator(this.uploadFileIcon);
    this.deleteTestFolder = this.newTestFolderInTable.locator(this.deleteFolderIcon);
    //this.newTestFolderInTableShouldNotExist = page.locator(`[data-type="directory"][data-path="${this.testFolderSlugShouldNotExist}"]`);

    //Locators for test files within the new test folder
    this.newTestImageFileInTable = page.locator(`[data-type="file"][data-path="${this.newTestFolderSlug}/${this.testImageLocation}"]`);
    this.newTestWordFileInTable = page.locator(`[data-type="file"][data-path="${this.newTestFolderSlug}/${this.testWordDocLocation}"]`);
    this.newTestPdfFileInTable = page.locator(`[data-type="file"][data-path="${this.newTestFolderSlug}/${this.testPdfDocLocation}"]`);

    //Archival Group input fields
    this.archivalGroupInput = this.page.locator('#agPathUnderRoot');
    this.archivalGroupNameInput = this.page.locator('#agName');
    this.archivalGroupDepositNoteInput = this.page.locator('#submissionText');

    //Top level buttons,alerts
    this.updateArchivalPropertiesButton = this.page.getByRole('button', { name: 'Update properties' });
    this.alertMessage = page.getByRole('alert');
    this.deleteDepositButton = page.getByRole('button', { name: 'Delete Deposit' });

    //New Deposit Dialog used in 'Browse - create deposit ' journey
    this.modalCreateNewDepositButton = page.getByRole('button', { name: 'Create New Deposit' });
    //this.modalArchivalGroupName = page.locator('#archivalGroupProposedName');
    //this.modalArchivalNote = page.locator('#submissionText');
    this.modalArchivalSlug = page.locator('#archivalGroupSlug');
    this.slugDisplayOnModal = page.locator('#slugDisplay');

    //New folder dialog
    this.newFolderNameInput = page.locator('#newFolderName');
    this.newFolderDialogButton = page.getByRole('button', {name: 'Create new folder'});
    this.newFolderCloseDialogButton = page.getByRole('button', {name: 'Close'}).nth(1);

    //Delete Deposit Modal
    this.deleteDepositModalButton = page.locator('#deleteDepositButton');
    this.confirmDeleteDeposit = page.getByRole('checkbox');

    //Delete item modal
    this.deleteItemModalButton = page.getByRole('button', {name: 'Delete', exact: true});

    //New file dialog
    this.fileUploadWidget = this.page.getByLabel('Choose a file to upload');
    this.fileUploadSubmitButton = this.page.getByLabel('Upload file').getByRole('button', { name: 'Upload file' });
    this.fileNameField = this.page.getByLabel('File name');
    this.checksumField = this.page.getByLabel('Checksum');

    //Import job fields
    this.importJobStatusCompleted = page.getByRole('link', { name: 'completed' });

    //Deposit Listing Page
    this.depositsTable = page.getByRole('table', {name: 'table-deposits-index'});
    this.depositTableRows = this.depositsTable.getByRole('row');
    this.depositRow1 = page.getByRole('row', {name: 'row-1', exact:true});
    this.depositRow1Slug = this.depositRow1.getByRole('cell', {name: 'td-archival-group'});
    this.depositRow1Status = this.depositRow1.getByRole('cell', {name: 'td-status'});
    this.allPreservedRowsPreservedDate = this.depositTableRows.filter({has: page.getByRole('cell', {name: 'td-status'}).getByText('preserved')}).getByRole('cell', {name: 'td-preserved'});
    this.allPreservedRowsPreservedBy = this.depositTableRows.filter({has: page.getByRole('cell', {name: 'td-status'}).getByText('preserved')}).getByRole('cell', {name: 'td-preserved-by'});
    this.allPreservedRowsExportedDate = this.depositTableRows.filter({has: page.getByRole('cell', {name: 'td-status'}).getByText('preserved')}).getByRole('cell', {name: 'td-exported'});
    this.allPreservedRowsExportedBy = this.depositTableRows.filter({has: page.getByRole('cell', {name: 'td-status'}).getByText('preserved')}).getByRole('cell', {name: 'td-exported-by'});
    this.allRowsArchivalGroup =  this.depositTableRows.getByRole('cell', {name: 'td-archival-group', exact: true});
    this.allRowsArchivalGroupSlug =  this.depositTableRows.getByRole('cell', {name: 'td-archival-group', exact: true}).getByLabel('ag-path');
    this.allRowsArchivalGroupName =  this.depositTableRows.getByRole('cell', {name: 'td-archival-group', exact: true}).getByLabel('ag-name');
    this.allRowsStatus = this.depositTableRows.getByRole('cell', {name: 'td-status', exact: true});
    this.allRowsLastModifiedDate= this.depositTableRows.getByRole('cell', {name: 'td-last-modified', exact: true});
    this.allRowsLastModifiedBy= this.depositTableRows.getByRole('cell', {name: 'td-last-modified-by', exact: true});
    this.allRowsCreatedDate= this.depositTableRows.getByRole('cell', {name: 'td-created', exact: true});
    this.allRowsCreatedBy= this.depositTableRows.getByRole('cell', {name: 'td-created-by', exact: true});
    this.allRowsPreservedDate = this.depositTableRows.getByRole('cell', {name: 'td-preserved', exact: true});
    this.allRowsPreservedBy = this.depositTableRows.getByRole('cell', {name: 'td-preserved-by', exact: true});
    this.allRowsExportedDate= this.depositTableRows.getByRole('cell', {name: 'td-exported', exact: true});
    this.allRowsExportedBy= this.depositTableRows.getByRole('cell', {name: 'td-exported-by', exact: true});
    this.showAllDepositsButton = page.getByRole('link', {name: 'Show all deposits'});
    this.showActiveDepositsButton = page.getByRole('link', {name: 'Show active only'});
    this.sortByArchivalGroup = page.getByRole('link', { name: 'archival group' });
    this.sortByStatus = page.getByRole('link', {name: 'status'});
    this.sortByLastModified = page.getByRole('link', {name: 'last modified'});
    this.sortByCreatedDate = page.getByRole('link', {name: 'created'});

  }

  async goto() {
    await this.page.goto(this.navigationPage.baseBrowsePath);
  }

  async getStarted() {
    await this.goto();
    await expect(this.navigationPage.baseBrowsePathHeading, 'The page heading is shown').toBeVisible();
  }

  async uploadFile(fileName:string, removeName: boolean, uploadButton: Locator){

    //await this.uploadFileToDepositButton.click();
    await uploadButton.click();

    //Select a file to upload
    await this.fileUploadWidget.setInputFiles(path.join(__dirname, fileName));
    if (removeName){
      await this.fileNameField.fill('');
    }
    await this.fileUploadSubmitButton.click();
  }

  depositLinkInTable(depositId : string) : Locator {
    return this.page.getByRole('link', { name: depositId });
  }

  async deleteFile (fileToDelete : Locator, fileName: string){
    await fileToDelete.locator(this.deleteFileIcon).click();
    await this.deleteItemModalButton.click();
    await expect(fileToDelete).toBeHidden();
    await expect(this.alertMessage, 'Success message is shown').toContainText(`${fileName} DELETED`);
  }

  async navigateToDepositListingPageWithParams(urlParams : string){
    await this.navigationPage.depositMenuOption.click();
    const pageURL = this.page.url();
    //Apply url param urlParams
    const urlWithParams = pageURL + `?${urlParams}`;
    await this.page.goto(urlWithParams);
    await expect(this.depositsTable, 'The deposit table has loaded').toBeVisible();
  }

  generateDateInPast(daysInPast: number) : Date {
    let myDate : Date = new Date();
    myDate.setDate(myDate.getDate() - daysInPast);
    myDate.setHours(0,0,0,0);
    return myDate;
  }

  validateSortOrder<T>(dataToValidate: string[], ascending: boolean, parser: (value: string) => T, sorter?: (value1: T, value2:T) => number): T[] {
    let listOfItems: T[] = [];

    for (let dataItem of dataToValidate) {
      listOfItems.push(parser(dataItem));
    }

    //(a: number, b: number) => a - b
    let listOfItemsSorted = [...listOfItems].sort(sorter);

    if (!ascending) {
      listOfItemsSorted.reverse();
    }

    expect(listOfItems, `dataToValidate is in sorted order`).toEqual(listOfItemsSorted);
    return listOfItems;
  }

}


  

