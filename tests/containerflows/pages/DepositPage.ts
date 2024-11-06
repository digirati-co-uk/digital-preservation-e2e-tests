
import {expect, Locator, Page} from '@playwright/test';
import {NavigationPage} from "./NavigationPage";
import * as path from 'path';

export class DepositPage {
  readonly page: Page;
  readonly navigation: NavigationPage;
  readonly newDepositButton: Locator;
  readonly modalCreateNewDepositButton : Locator;

  //Deposit page
  readonly uploadFileToObjectsFolder :Locator;

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
  readonly depositHeaderNoSlug : Locator;
  readonly depositHeaderSlug : Locator;
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
  readonly testImageWithInvalidCharsLocation : string;
  readonly cannotUploadTopLevelMessage : string;
  readonly newTestFolderTitle : string;
  readonly newTestFolderSlug : string;
  readonly testFolderSlugShouldNotExist: string;
  readonly newTestFolderInTable : Locator;
  readonly newTestFolderInTableShouldNotExist: Locator;
  readonly newTestImageFileInTable : Locator;
  readonly newTestImageFileTranslatedCharsInTable : Locator;
  readonly newTestWordFileInTable : Locator;
  readonly newTestPdfFileInTable : Locator;
  readonly testFileLocation : string;
  readonly deleteDepositModalButton : Locator;
  readonly deleteDepositButton : Locator;
  readonly confirmDeleteDeposit: Locator;
  readonly newFolderCloseDialogButton : Locator;
  readonly testInvalidArchivalURI : string;
  readonly testValidArchivalURI : string;
  readonly testArchivalGroupName : string;
  readonly testDepositNote : string;
  readonly tableRowContext : Locator;
  readonly testWordDocLocation : string;
  readonly testPdfDocLocation : string;
  readonly fileUploadWidget: Locator;
  readonly fileUploadSubmitButton: Locator;
  readonly fileNameField : Locator;
  readonly checksumField : Locator;
  readonly modalArchivalGroupName : Locator;
  readonly modalArchivalNote : Locator;
  readonly modalArchivalSlug : Locator;
  readonly deleteSelectedItem : Locator;
  readonly deleteItemModalButton : Locator;
  readonly metsFileName : string;
  readonly slugDisplayOnModal: Locator;


  constructor(page: Page) {
    this.page = page;
    this.navigation = new NavigationPage(page);

    //consts
    this.notYetPopulated = '-';
    this.depositsURL = /deposits\/\w{8}/;
    this.testFileLocation = '../../../test-data/deposit/';
    this.metsFileName = '__METSlike.json';
    this.testImageLocation = 'test_image.png';
    this.testImageWithInvalidCharsLocation = 'test&&image.png';
    this.testWordDocLocation = 'test_word_document.docx';
    this.testPdfDocLocation = 'test_pdf_document.pdf';
    this.cannotUploadTopLevelMessage = 'Uploaded files must go in or below the objects folder.';
    this.newTestFolderTitle = 'New test folder inside objects';
    this.newTestFolderSlug = 'objects/new-test-folder-inside-objects';
    this.testFolderSlugShouldNotExist = 'new-test-folder-inside-objects';
    this.testDepositNote = 'Playwright test archival group note';
    this.testArchivalGroupName = 'Playwright test archival group name';
    this.testInvalidArchivalURI = 'playwright invalid slug';
    this.testValidArchivalURI = 'playwright-valid-slug';

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

    //Deposit file structure table locators
    this.depositFilesTable = page.getByRole('table', {name: 'table-deposit-files'});
    this.depositFilesDirectories = this.depositFilesTable.locator('*[data-type="directory"]');
    this.depositFilesFiles = this.depositFilesTable.locator('*[data-type="file"]');
    this.objectsFolder = this.depositFilesTable.locator('[data-type="directory"][data-path="objects"]')
    this.uploadFileToObjectsFolder = this.objectsFolder.getByLabel('upload file');
    this.metsFile = this.depositFilesTable.locator('[data-type="file"][data-path="__METSlike.json"]');
    this.testImageInFilesToplevel = this.depositFilesTable.locator(`[data-type="file"][data-path="${this.testImageLocation}"]`);
    this.testImageInFilesCorrect = this.depositFilesTable.locator(`[data-type="file"][data-path="objects/${this.testImageLocation}"]`);
    this.newTestFolderInTable = page.locator(`[data-type="directory"][data-path="${this.newTestFolderSlug}"]`);
    this.newTestFolderInTableShouldNotExist = page.locator(`[data-type="directory"][data-path="${this.testFolderSlugShouldNotExist}"]`);
    this.newTestImageFileInTable = page.locator(`[data-type="file"][data-path="${this.newTestFolderSlug}/${this.testImageLocation}"]`);
    this.newTestImageFileTranslatedCharsInTable = page.locator(`[data-type="file"][data-path="objects/${this.testImageWithInvalidCharsLocation.replaceAll('&','-')}"]`);
    this.newTestWordFileInTable = page.locator(`[data-type="file"][data-path="${this.newTestFolderSlug}/${this.testWordDocLocation}"]`);
    this.newTestPdfFileInTable = page.locator(`[data-type="file"][data-path="${this.newTestFolderSlug}/${this.testPdfDocLocation}"]`);


    //DELETE?
    //this.uploadFileToDepositButton = page.getByRole('button', {name: 'Upload file'});
    //this.archivalGroupToggle = this.page.getByRole('button', {name: 'Toggle Details'});
    //this.createNewFolder = this.page.getByRole('button', {name: 'New folder'});
    //this.tableRowContext = page.locator('#tableRowContext');
    //this.deleteSelectedItem = page.getByRole('button', { name: 'Delete selected' });


    //Archival Group input fields
    this.archivalGroupInput = this.page.locator('#agUri');
    this.archivalGroupNameInput = this.page.locator('#agName');
    this.archivalGroupDepositNoteInput = this.page.locator('#submissionText');

    //Top level buttons,alerts
    this.updateArchivalPropertiesButton = this.page.getByRole('button', { name: 'Update properties' });
    this.alertMessage = page.getByRole('alert');
    this.deleteDepositButton = page.getByRole('button', { name: 'Delete Deposit' });

    //New Deposit Dialog used in 'Browse - create deposit ' journey
    this.modalCreateNewDepositButton = page.getByRole('button', { name: 'Create New Deposit' });
    this.modalArchivalGroupName = page.locator('#archivalGroupProposedName');
    this.modalArchivalNote = page.locator('#submissionText');
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
  }

  async goto() {
    await this.page.goto(this.navigation.baseBrowsePath);
  }

  async getStarted() {
    await this.goto();
    await expect(this.navigation.baseBrowsePathHeading, 'The page heading is shown').toBeVisible();
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
    await fileToDelete.click();
    await this.deleteSelectedItem.click();
    await this.deleteItemModalButton.click();
    await expect(fileToDelete).toBeHidden();
    await expect(this.alertMessage, 'Success message is shown').toContainText(`${fileName} DELETED`);
  }

}


  

