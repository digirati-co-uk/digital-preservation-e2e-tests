
import {expect, Locator, Page} from '@playwright/test';
import {NavigationPage} from "./NavigationPage";
import * as path from 'path';

export class DepositPage {
  readonly page: Page;
  readonly navigation: NavigationPage;
  readonly newDepositButton: Locator;
  readonly modalCreateNewDepositButton : Locator;

  //Deposit page
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
  readonly notYetPopulated:string;
  readonly depositsURL: RegExp;
  readonly depositHeader : Locator;
  readonly depositFilesTable : Locator;
  readonly depositFilesDirectories : Locator;
  readonly depositFilesFiles : Locator;
  readonly objectsFolder : Locator;
  readonly metsFile : Locator;
  readonly uploadFileToDepositButton : Locator;
  readonly testImageInFilesToplevel : Locator;
  readonly testImageInFilesCorrect: Locator;
  readonly archivalGroupInput : Locator;
  readonly archivalGroupNameInput : Locator;
  readonly archivalGroupDepositNoteInput : Locator;
  readonly updateArchivalPropertiesButton : Locator;
  readonly archivalGroupToggle : Locator;
  readonly createNewFolder : Locator;
  readonly newFolderNameInput : Locator;
  readonly newFolderDialogButton : Locator;
  readonly alertMessage : Locator;
  readonly testImageLocation : string;
  readonly cannotUploadTopLevelMessage : string;
  readonly newTestFolderTitle : string;
  readonly newTestFolderSlug : string;
  readonly newTestFolderInTable : Locator;
  readonly newTestImageFileInTable : Locator;
  readonly newTestWordFileInTable : Locator;
  readonly newTestPdfFileInTable : Locator;
  readonly testFileLocation : string;
  readonly deleteDepositModalButton : Locator;
  readonly deleteDepositButton : Locator;
  readonly confirmDeleteDeposit: Locator;
  readonly newFolderCloseDialogButton : Locator;
  readonly testArchivalGroupName : string;
  readonly testDepositNote : string;
  readonly tableRowContext : Locator;
  readonly testWordDocLocation : string;
  readonly testPdfDocLocation : string;
  readonly fileUploadWidget: Locator;
  readonly fileUploadSubmitButton: Locator;
  readonly fileNameField : Locator;
  readonly checksumField : Locator;



  constructor(page: Page) {
    this.page = page;
    this.navigation = new NavigationPage(page);
    //consts
    this.notYetPopulated = '-';
    this.depositsURL = /deposits\/\w{8}/;
    this.testFileLocation = '../../../test-data/deposit/';
    this.testImageLocation = 'test_image.png';
    this.testWordDocLocation = 'test_word_document.docx';
    this.testPdfDocLocation = 'test_pdf_document.pdf';
    this.cannotUploadTopLevelMessage = 'Uploaded files must go in or below the objects folder.';
    this.newTestFolderTitle = 'New test folder inside objects';
    this.newTestFolderSlug = 'objects/new-test-folder-inside-objects';
    this.testDepositNote = 'Playwright test archival group note';
    this.testArchivalGroupName = 'Playwright test archival group name';

    //Locators
    this.newDepositButton = page.getByRole('button', { name: 'New Deposit' });
    this.modalCreateNewDepositButton = page.getByRole('button', { name: 'Create New Deposit' });
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
    this.depositHeader = page.getByRole('heading', {name: /Deposit \w{8}/});
    this.depositFilesTable = page.getByRole('table', {name: 'table-deposit-files'});
    this.depositFilesDirectories = this.depositFilesTable.locator('*[data-type="directory"]');
    this.depositFilesFiles = this.depositFilesTable.locator('*[data-type="file"]');
    this.objectsFolder = this.depositFilesTable.locator('[data-type="directory"][data-path="objects"]');
    this.metsFile = this.depositFilesTable.locator('[data-type="file"][data-path="__METSlike.json"]');
    this.testImageInFilesToplevel = this.depositFilesTable.locator(`[data-type="file"][data-path="${this.testImageLocation}"]`);
    this.testImageInFilesCorrect = this.depositFilesTable.locator(`[data-type="file"][data-path="objects/${this.testImageLocation}"]`);
    this.uploadFileToDepositButton = page.getByRole('button', {name: 'Upload file'});
    this.archivalGroupInput = this.page.locator('#agUri');
    this.archivalGroupNameInput = this.page.locator('#agName');
    this.archivalGroupDepositNoteInput = this.page.locator('#submissionText');
    this.updateArchivalPropertiesButton = this.page.getByRole('button', { name: 'Update properties' });
    this.archivalGroupToggle = this.page.getByRole('button', {name: 'Toggle Details'});
    this.createNewFolder = this.page.getByRole('button', {name: 'New folder'});
    this.alertMessage = page.getByRole('alert');
    this.newTestFolderInTable = page.locator(`[data-type="directory"][data-path="${this.newTestFolderSlug}"]`);
    this.newTestImageFileInTable = page.locator(`[data-type="file"][data-path="${this.newTestFolderSlug}/${this.testImageLocation}"]`);
    this.newTestWordFileInTable = page.locator(`[data-type="file"][data-path="${this.newTestFolderSlug}/${this.testWordDocLocation}"]`);
    this.newTestPdfFileInTable = page.locator(`[data-type="file"][data-path="${this.newTestFolderSlug}/${this.testPdfDocLocation}"]`);
    this.deleteDepositButton = page.getByRole('button', { name: 'Delete Deposit' });
    this.tableRowContext = page.locator('#tableRowContext');

    //New folder dialog
    this.newFolderNameInput = page.locator('#newFolderName');
    this.newFolderDialogButton = page.getByRole('button', {name: 'Create new folder'});
    this.newFolderCloseDialogButton = page.getByRole('button', {name: 'Close'}).nth(1);

    //Delete Deposit Modal
    this.deleteDepositModalButton = page.locator('#deleteDepositButton');
    this.confirmDeleteDeposit = page.getByRole('checkbox');

    //New file dialog
    this.fileUploadWidget = this.page.getByLabel('Choose a file to upload');
    this.fileUploadSubmitButton = this.page.getByLabel('Upload file').getByRole('button', { name: 'Upload file' });
    this.fileNameField = this.page.getByLabel('File name');
    this.checksumField = this.page.getByLabel('Checksum');
  }

  async goto() {
    await this.page.goto(this.navigation.baseBrowsePath);
  }

  async getStarted() {
    await this.goto();
    await expect.soft(this.navigation.baseBrowsePathHeading, 'The page heading is shown').toBeVisible();
  }

  async uploadFile(fileName:string, removeName: boolean){
    await this.uploadFileToDepositButton.click();

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

}


  

