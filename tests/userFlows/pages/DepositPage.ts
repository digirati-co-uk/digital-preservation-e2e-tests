import {BrowserContext, expect, Locator, Page} from '@playwright/test';
import {NavigationPage} from "./NavigationPage";
import * as path from 'path';
import { Document, Element } from '@xmldom/xmldom';
import {presentationApiContext} from "../../../fixture";
import {checkForFileInS3, uploadFile} from "../../helpers/helpers";

export class DepositPage {
  readonly page: Page;
  readonly navigationPage: NavigationPage;

  //consts
  readonly notYetPopulated:string;
  readonly objectsFolderName : string;
  readonly metadataFolderName: string;
  readonly brunnhildeFolderName: string;
  readonly testImageLocation : string;
  readonly testImageFileType : string;
  readonly testImageFileSize : string;
  readonly virusScanCheckMark : string;
  readonly nestedTestImageLocation : string;
  readonly testImageLocationFullPath: string;
  readonly testWordDocLocationFullPath: string;
  readonly testPdfDocLocationFullPath: string;
  readonly testImageWithInvalidCharsLocation : string;
  readonly testImageWithInvalidCharsLocationTranslated : string;
  readonly newTestFolderTitle : string;
  readonly newTestFolderSlug : string;
  readonly newTestFolderTitle2 : string;
  readonly newTestFolderSlug2 : string;
  readonly folder2FullPath : string;
  readonly folder3FullPath : string;
  readonly nestedImageFullPath : string;
  readonly testFolderSlugShouldNotExist: string;
  readonly depositsListingURL: string;
  readonly depositsURL: RegExp;
  readonly testInvalidArchivalURI : string;
  readonly invalidURIMadeValid: string;
  readonly testFileLocation : string;
  readonly virusTestFileLocation: string;
  readonly secondTestFileLocation : string;
  readonly testValidArchivalURI : string;
  readonly testArchivalGroupName : string;
  readonly testDepositNote : string;
  readonly testWordDocLocation : string;
  readonly testPdfDocLocation : string;
  readonly metsFileName : string;
  readonly numberOfItemsPerPage: number;
  readonly inDepositOnlyText: string;
  readonly inBothText: string;
  readonly inMETSOnlyText: string;
  readonly level2FolderName : string;
  readonly level3FolderName : string;

  //Locator to initially create the deposit
  readonly newDepositButton: Locator;

  //Deposit page
  readonly createDiffImportJobButton : Locator ;
  readonly runImportButton : Locator;
  readonly filesNotInMetsError : Locator;
  readonly noCurrentImportJobsText : Locator;
  readonly depositNotActiveText : Locator;
  readonly depositNoFiles: Locator;

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
  readonly objectsFolder : Locator;
  readonly metadataFolder : Locator;
  readonly brunnhildeFolder: Locator;
  readonly uploadFileToObjectsFolder :Locator;
  readonly uploadFileToMetadataFolder : Locator;
  readonly uploadFileToBrunnhildeFolder: Locator;
  readonly createFolderWithinObjectsFolder : Locator;
  readonly createFolderWithinMetadataFolder : Locator;
  readonly createFolderWithinBrunnhildeFolder: Locator;
  readonly metsFile : Locator;
  readonly newTestFolderInTable : Locator;
  readonly secondNewTestFolderInTable : Locator;
  readonly uploadFileToTestFolder : Locator;
  readonly uploadFileToSecondTestFolder : Locator;
  readonly deleteTestFolder : Locator;
  readonly newTestImageFileInTable : Locator;
  readonly newTestImageFileTranslatedCharsInTable : Locator;
  readonly newTestWordFileInTable : Locator;
  readonly newTestPdfFileInTable : Locator;
  readonly nestedImageFileInTable : Locator;

  //Actions on files and folders
  readonly uploadFileIcon : Locator;
  readonly createFolderIcon : Locator;
  readonly fileFolderCheckbox: Locator;
  readonly testImageSelectArea: Locator;
  readonly testWordDocSelectArea: Locator;
  readonly testPdfSelectArea: Locator;
  readonly testImageCheckbox: Locator;
  readonly testWordDocCheckbox: Locator;
  readonly testPdfCheckbox: Locator;

  //Archival Group input fields
  readonly archivalGroupInput : Locator;
  readonly archivalGroupNameInput : Locator;
  readonly archivalGroupDepositNoteInput : Locator;

  //buttons,alerts
  readonly alertMessage : Locator;
  readonly actionsMenu : Locator;
  readonly selectAllNonMetsButton : Locator;
  readonly releaseLockButton: Locator;
  readonly lockButton: Locator;
  readonly runPipelineButton: Locator;
  readonly cancelPipelineButton: Locator;
  readonly refreshStorageButton: Locator;
  readonly deleteSelectedButton: Locator;
  readonly deleteFromMetsAndDeposit: Locator;
  readonly deleteFromDepositOnly : Locator;
  readonly deleteDepositButton : Locator;
  readonly updateArchivalPropertiesButton : Locator;

  //New Deposit Dialog used in 'Browse - create deposit ' journey
  readonly objectIdentifier : Locator;
  readonly modalArchivalSlug : Locator;
  readonly modalArchivalName : Locator;
  readonly modalArchivalNote : Locator;
  readonly modalCreateNewDepositButton : Locator;
  readonly slugDisplayOnModal: Locator;
  readonly useBagitLayout: Locator;
  readonly usingBagitGuidance: Locator;

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

  //Deposit listing page - pagination
  readonly paginator: Locator;
  readonly previousButton: Locator;
  readonly nextButton: Locator;
  readonly previousButtonText: Locator;
  readonly nextButtonText: Locator;
  readonly page1Element: Locator;
  readonly page2Element: Locator;
  readonly paginatorElements: Locator;
  readonly totalNumberOfItems: Locator;
  readonly totalPagesCount: Locator;
  readonly firstRowID: Locator;

  //Add to METS dialog box
  readonly addToMetsButton : Locator;
  readonly testImageFileInDialog : Locator;
  readonly testWordDocFileInDialog : Locator;
  readonly testPdfDocFileInDialog : Locator;
  readonly addToMetsDialogButton : Locator;
  readonly addToMetsCloseDialogButton : Locator;
  readonly addToMetsHelpText: Locator;

  //Access Conditions And Rights Modal
  readonly allAccessConditions: string[];
  readonly selectedAccessConditions: string[];
  readonly modifiedAccessConditions: string[];
  readonly selectedRightsOption: string;
  readonly selectedRightsOptionShortCode: string;
  readonly modifiedRightsOptionShortCode: string;
  readonly modifiedRightsOptionURL: string;
  readonly selectedRightsOptionURL: string;
  readonly modifiedRightsOption: string;
  readonly openAccessConditionsAndRightsButton: Locator;
  readonly saveAccessConditionsAndRightsButton: Locator;
  readonly closeAccessConditionsAndRightsButton: Locator;

  //BitCurator test specific Locators
  readonly bitCuratorFileOneName: string;
  readonly bitCuratorFileTwoName: string;
  readonly bitCuratorFileThreeName: string;
  readonly bitCuratorFileFourName: string;
  readonly bitCuratorMetadataFileFiveName: string;
  readonly bitCuratorFileOneFullPath: string;
  readonly bitCuratorFileTwoFullPath: string;
  readonly bitCuratorFileThreeFullPath: string;
  readonly bitCuratorFileFourFullPath: string;
  readonly bitCuratorFileFiveFullPath: string;
  readonly bitCuratorFileOne: Locator;
  readonly bitCuratorFileTwo: Locator;
  readonly bitCuratorFileThree: Locator;
  readonly bitCuratorFileFour: Locator;
  readonly bitCuratorFileFive: Locator;
  readonly bitCuratorFileOneSelectArea: Locator;
  readonly bitCuratorFileTwoSelectArea: Locator;
  readonly bitCuratorFileThreeSelectArea: Locator;
  readonly bitCuratorFileFourSelectArea: Locator;
  readonly bitCuratorFileFiveSelectArea: Locator;
  readonly pronomKey: string;
  readonly expectedFileType: string;
  readonly checkSumType: string;
  readonly bitCuratorFileThreeChecksum: string;
  readonly bitCuratorFileFourChecksum: string;
  readonly bitCuratorDepositFileSizeTotals: Locator;
  readonly bitCuratorDepositFilesTotals: Locator;
  readonly fileToDeleteName: string;
  readonly fileToDeleteLocator: Locator;

  //Pipeline table locators
  readonly pipelineJobTable: Locator;
  readonly pipelineJobTableLastRow: Locator;
  readonly pipelineJobStatus: Locator;
  readonly testImageChecksum: string;
  readonly testWordDocChecksum: string;
  readonly testPdfDocChecksum: string;

  constructor(page: Page) {
    this.page = page;
    this.navigationPage = new NavigationPage(page);

    //consts
    this.notYetPopulated = '-';
    //Note - format of deposits might change in the future
    //At some point we might acquire identifiers for Deposits (and other things) from a Leeds external
    //identity service, in which case they might no longer be 8-char alphanumeric.
    //They will be for now though.
    this.depositsListingURL = '/deposits?pageSize=100';
    this.depositsURL = /deposits\/\w{12}/;
    this.objectsFolderName = 'objects';
    this.metadataFolderName = 'metadata';
    this.brunnhildeFolderName = 'brunnhilde';
    this.metsFileName = 'mets.xml';
    this.testImageLocation = 'test_image().jpg';
    this.nestedTestImageLocation = 'test_image.png';
    this.testImageFileType = 'image/jpeg';
    this.testImageFileSize = '45 KB';
    this.virusScanCheckMark = '✅';
    this.testImageWithInvalidCharsLocation = 'test&&image.jpg';
    this.testImageWithInvalidCharsLocationTranslated = 'test--image.jpg';
    this.testWordDocLocation = 'test_word_document.docx';
    this.testPdfDocLocation = 'test_pdf_document.pdf';
    this.newTestFolderTitle = 'New test folder inside objects';
    this.newTestFolderTitle2 = 'Second test folder inside objects';
    this.newTestFolderSlug = this.objectsFolderName + `/new-test-folder-inside-objects`;
    this.newTestFolderSlug2 = this.objectsFolderName + '/second-test-folder-inside-objects';
    this.testFileLocation = `../../../test-data/deposit/${this.newTestFolderSlug}/`;
    this.virusTestFileLocation = `../../../test-data/virus-file/eicar.txt/`;
    this.secondTestFileLocation = `../../../test-data/deposit/${this.newTestFolderSlug2}/`;
    this.testImageLocationFullPath = this.newTestFolderSlug+'/'+this.testImageLocation;
    this.testWordDocLocationFullPath = this.newTestFolderSlug+'/'+this.testWordDocLocation;
    this.testPdfDocLocationFullPath = this.newTestFolderSlug+'/'+this.testPdfDocLocation;
    this.testFolderSlugShouldNotExist = 'new-test-folder-inside-objects';
    this.testDepositNote = 'Playwright test archival group note';
    this.testArchivalGroupName = 'Playwright test archival group name';
    this.testInvalidArchivalURI = 'playwright invalid slug';
    this.invalidURIMadeValid = 'playwrightinvalidslug';
    this.testValidArchivalURI = 'playwright-valid-slug-abcd';
    this.numberOfItemsPerPage = 10;
    this.createDiffImportJobButton = page.getByRole('button', { name: 'Create diff import job' });
    this.runImportButton = page.getByRole('button', {name: 'Run Import (Preserve)'});
    this.filesNotInMetsError = page.getByText('Unprocessable: Could not find file ');
    this.noCurrentImportJobsText = page.getByText('There are no submitted import jobs for this Deposit');
    this.depositNotActiveText = page.getByText('No jobs can be run as this deposit is no longer active.').first();
    this.depositNoFiles = page.getByText('No jobs can be run as there are no valid files in the Deposit.').first();
    this.inDepositOnlyText = 'Deposit';
    this.inBothText = 'Both';
    this.inMETSOnlyText = 'Mets';
    this.level2FolderName = 'folderatlevel2';
    this.level3FolderName = 'folderatlevel3';
    this.folder2FullPath = `${this.newTestFolderSlug}/${this.level2FolderName}`;
    this.folder3FullPath = `${this.folder2FullPath}/${this.level3FolderName}`;
    this.nestedImageFullPath = `${this.folder3FullPath}/${this.nestedTestImageLocation}`;

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
    this.depositHeaderNoSlug = page.getByRole('heading', {name: /\w{12}/});
    this.depositHeaderSlug = page.getByRole('heading', {name: /Deposit/});

    //Actions on files and folders
    this.uploadFileIcon = page.getByLabel('upload file', { exact: true });
    this.createFolderIcon = page.getByLabel('new folder', { exact: true });
    this.fileFolderCheckbox = page.getByLabel('select-row').getByRole('checkbox');

    //Deposit file structure table locators
    this.depositFilesTable = page.getByRole('table', {name: 'table-deposit-files'});

    //Locators specific to the objects folder
    this.objectsFolder = this.depositFilesTable.locator(`[data-type="directory"][data-path="${this.objectsFolderName}"]`);
    this.metadataFolder = this.depositFilesTable.locator(`[data-type="directory"][data-path="${this.metadataFolderName}"]`);
    this.brunnhildeFolder = this.depositFilesTable.locator(`[data-type="directory"][data-path="${this.brunnhildeFolderName}"]`);
    this.uploadFileToObjectsFolder = this.objectsFolder.locator(this.uploadFileIcon);
    this.uploadFileToMetadataFolder = this.metadataFolder.locator(this.uploadFileIcon);
    this.uploadFileToBrunnhildeFolder = this.brunnhildeFolder.locator(this.uploadFileIcon);

    this.createFolderWithinObjectsFolder = this.objectsFolder.locator(this.createFolderIcon);
    this.createFolderWithinMetadataFolder = this.metadataFolder.locator(this.createFolderIcon);
    this.createFolderWithinBrunnhildeFolder = this.brunnhildeFolder.locator(this.createFolderIcon);

    //METS file locators
    this.metsFile = this.depositFilesTable.locator('[data-type="file"][data-path="mets.xml"]');

    //Locators specific to the test folders / files
    this.newTestImageFileTranslatedCharsInTable = page.locator(`[data-type="file"][data-path="${this.objectsFolderName}/${this.testImageWithInvalidCharsLocationTranslated}"]`);
    this.newTestFolderInTable = page.locator(`[data-type="directory"][data-path="${this.newTestFolderSlug}"]`);
    this.secondNewTestFolderInTable = page.locator(`[data-type="directory"][data-path="${this.newTestFolderSlug2}"]`);
    this.uploadFileToTestFolder = this.newTestFolderInTable.locator(this.uploadFileIcon);
    this.uploadFileToSecondTestFolder = this.secondNewTestFolderInTable.locator(this.uploadFileIcon);
    this.deleteTestFolder = this.newTestFolderInTable.locator(this.fileFolderCheckbox);

    //Locators for test files within the new test folder
    this.newTestImageFileInTable = page.locator(`[data-type="file"][data-path="${this.newTestFolderSlug}/${this.testImageLocation}"]`);
    this.newTestWordFileInTable = page.locator(`[data-type="file"][data-path="${this.newTestFolderSlug}/${this.testWordDocLocation}"]`);
    this.newTestPdfFileInTable = page.locator(`[data-type="file"][data-path="${this.newTestFolderSlug}/${this.testPdfDocLocation}"]`);
    this.nestedImageFileInTable = page.locator(`[data-type="file"][data-path="${this.nestedImageFullPath}"]`);
    this.testImageSelectArea =  this.newTestImageFileInTable.getByLabel('select-row');
    this.testWordDocSelectArea = this.newTestWordFileInTable.getByLabel('select-row');
    this.testPdfSelectArea =  this.newTestPdfFileInTable.getByLabel('select-row')
    this.testImageCheckbox = this.testImageSelectArea.getByRole('checkbox');
    this.testWordDocCheckbox = this.testWordDocSelectArea.getByRole('checkbox');
    this.testPdfCheckbox = this.testPdfSelectArea.getByRole('checkbox');

    //Archival Group input fields
    this.archivalGroupInput = this.page.locator('#agPathUnderRoot');
    this.archivalGroupNameInput = this.page.locator('#agName');
    this.archivalGroupDepositNoteInput = this.page.locator('#submissionText');

    //buttons,alerts
    this.updateArchivalPropertiesButton = this.page.getByRole('button', { name: 'Update properties' });
    this.alertMessage = page.getByRole('alert');
    this.actionsMenu = page.getByRole('button', {name: 'Actions'});
    this.selectAllNonMetsButton = page.getByRole('button', {name: 'Select all non-METS'});
    this.releaseLockButton = page.getByRole('button', {name: 'Release lock'});
    this.lockButton = page.getByRole('button', {name: 'Lock deposit'});
    this.runPipelineButton = page.getByRole('button', {name: 'Run pipeline'});
    this.cancelPipelineButton = page.getByRole('button', {name: 'Stop pipeline run'});
    this.refreshStorageButton = page.getByRole('button', {name: 'Refresh storage'});
    this.deleteSelectedButton = page.getByRole('button', {name: 'Delete selected...'});
    this.deleteFromMetsAndDeposit = page.locator('#deleteFromMetsAndDeposit');
    this.deleteFromDepositOnly = page.locator('#deleteFromDeposit');
    this.deleteDepositButton = page.getByRole('button', { name: 'Delete Deposit' });

    //New Deposit Dialog used in 'Browse - create deposit ' journey
    this.modalCreateNewDepositButton = page.getByRole('button', { name: 'Create New Deposit' });
    this.objectIdentifier = page.locator('#objectIdentifier');
    this.modalArchivalSlug = page.locator('#archivalGroupSlug');
    this.modalArchivalName = page.locator('#archivalGroupProposedName');
    this.modalArchivalNote = page.locator('#submissionText');
    this.slugDisplayOnModal = page.locator('#slugDisplay');
    this.useBagitLayout = page.getByRole('checkbox', {name:'use bagit layout'});
    this.usingBagitGuidance = page.getByText('This Deposit uses BagIt layout on disk/S3.');

    //New folder dialog
    this.newFolderNameInput = page.locator('#newFolderName');
    this.newFolderDialogButton = page.getByRole('button', {name: 'Create new folder'});
    this.newFolderCloseDialogButton = page.getByRole('button', {name: 'Close'}).nth(1);

    //Delete Deposit Modal
    this.deleteDepositModalButton = page.locator('#deleteDepositButton');
    this.confirmDeleteDeposit = page.getByRole('dialog').getByRole('checkbox');

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
    this.showAllDepositsButton = page.locator('#activeOrAllDepositsToggle');
    this.showActiveDepositsButton = page.locator('#activeOrAllDepositsToggle');
    this.sortByArchivalGroup = page.getByRole('link', { name: 'archival group' });
    this.sortByStatus = page.getByRole('link', {name: 'status'});
    this.sortByLastModified = page.getByRole('link', {name: 'last modified'});
    this.sortByCreatedDate = page.getByRole('link', {name: 'created'});

    //Deposit listing page - pagination
    this.paginator = page.getByLabel('Paging');
    this.previousButton  = this.paginator.getByRole('listitem').first();
    this.page1Element = this.paginator.getByRole('listitem').getByText('1');
    this.page2Element = this.paginator.getByRole('listitem').getByText('2');
    this.nextButton  = this.paginator.getByRole('listitem').last();
    this.previousButtonText  = this.previousButton.getByText('Previous');
    this.nextButtonText  = this.nextButton.getByText('Next');
    this.paginatorElements = this.paginator.getByRole('listitem');
    this.totalNumberOfItems = page.getByLabel('Total items');
    this.totalPagesCount = page.getByLabel('Total pages');
    this.firstRowID = page.getByRole('table', {name: 'table-deposits-index'}).getByRole('row', {name:'row-1', exact: true}).getByRole('cell', {name:'td-id'});

    //Add to METS dialog box
    this.addToMetsButton = page.getByRole('button', {name: 'Add selected to METS'});
    this.testImageFileInDialog = this.page.getByRole('dialog').getByRole('cell').getByText(this.testImageLocation);
    this.testWordDocFileInDialog = this.page.getByRole('dialog').getByRole('cell').getByText(this.testWordDocLocation);
    this.testPdfDocFileInDialog = this.page.getByRole('dialog').getByRole('cell').getByText(this.testPdfDocLocation);
    this.addToMetsDialogButton = this.page.getByRole('button', {name: 'Add to METS'});
    this.addToMetsCloseDialogButton = this.page.getByRole('button', {name: 'Close'}).first();
    this.addToMetsHelpText = this.page.locator('#addToMetsHelp');

    //Access Conditions And Rights Modal
    this.openAccessConditionsAndRightsButton = page.getByRole('button', {name: 'Set rights and access conditions'});
    this.saveAccessConditionsAndRightsButton = page.getByRole('button', {name: 'Save'});
    this.closeAccessConditionsAndRightsButton = page.getByRole('button', {name: 'Close'}).first();
    this.allAccessConditions = ['Open', 'Restricted', 'Staff', 'Closed'];
    this.selectedAccessConditions = [this.allAccessConditions[1], this.allAccessConditions[3]];
    this.modifiedAccessConditions = [this.allAccessConditions[0], this.allAccessConditions[2]];
    this.selectedRightsOption = 'In Copyright - EU Orphan Work';
    this.modifiedRightsOption = 'No Copyright - United States';
    this.modifiedRightsOptionShortCode = 'NoC-US';
    this.modifiedRightsOptionURL = 'http://rightsstatements.org/vocab/NoC-US/1.0/';
    this.selectedRightsOptionURL = 'http://rightsstatements.org/vocab/InC-OW-EU/1.0/';
    this.selectedRightsOptionShortCode = 'InC-OW-EU';

    //BitCurator test specific Locators
    this.bitCuratorFileOneName = 'metadata';
    this.bitCuratorFileTwoName = 'nyc';
    this.bitCuratorFileThreeName = 'DSCF1044.JPG';
    this.bitCuratorFileFourName = 'warteck.jpg';
    this.bitCuratorMetadataFileFiveName = 'mimetypes.csv';
    this.bitCuratorFileOneFullPath = this.bitCuratorFileOneName;
    this.bitCuratorFileTwoFullPath = `objects/${this.bitCuratorFileTwoName}`;
    this.bitCuratorFileThreeFullPath = `objects/nyc/${this.bitCuratorFileThreeName}`;
    this.bitCuratorFileFourFullPath = `objects/${this.bitCuratorFileFourName}`;
    this.bitCuratorFileFiveFullPath = `metadata/brunnhilde/csv_reports/${this.bitCuratorMetadataFileFiveName}`;
    this.bitCuratorFileOne = page.locator(`[data-type="directory"][data-path="${this.bitCuratorFileOneFullPath}"]`);
    this.bitCuratorFileTwo = page.locator(`[data-type="directory"][data-path="${this.bitCuratorFileTwoFullPath}"]`);
    this.bitCuratorFileThree = page.locator(`[data-type="file"][data-path="${this.bitCuratorFileThreeFullPath}"]`);
    this.bitCuratorFileFour = page.locator(`[data-type="file"][data-path="${this.bitCuratorFileFourFullPath}"]`);
    this.bitCuratorFileFive = page.locator(`[data-type="file"][data-path="${this.bitCuratorFileFiveFullPath}"]`);
    this.bitCuratorFileOneSelectArea = this.bitCuratorFileOne.getByLabel('select-row');
    this.bitCuratorFileTwoSelectArea = this.bitCuratorFileTwo.getByLabel('select-row');
    this.bitCuratorFileThreeSelectArea = this.bitCuratorFileThree.getByLabel('select-row');
    this.bitCuratorFileFourSelectArea = this.bitCuratorFileFour.getByLabel('select-row');
    this.bitCuratorFileFiveSelectArea = this.bitCuratorFileFive.getByLabel('select-row');
    this.pronomKey = 'fmt/1507';
    this.expectedFileType = 'image/jpeg';
    this.checkSumType = 'SHA256';
    this.bitCuratorFileThreeChecksum = 'e2e9f06f8180d1f101eb5e02f97b70bc395750e6ffdecf045db43605acb50682';
    this.bitCuratorFileFourChecksum = '243c32394db4879c2fee146a0175ad5d402ed151656e7fb5ea580d04e2d4a6db';
    this.bitCuratorDepositFileSizeTotals = page.getByText('45.6 MB in Deposit, 45.6 MB in METS, 45.6 MB Overall.');
    this.bitCuratorDepositFilesTotals = page.getByText('15 files in 6 directories');
    this.fileToDeleteName = 'IMAGE-2.tiff';
    this.fileToDeleteLocator = page.getByRole('row').filter({has: page.getByRole('cell').filter({ hasText: this.fileToDeleteName })});

    //Pipeline table locators
    this.pipelineJobTable = page.getByRole('table', {name: 'table-deposit-pipeline-jobs'});
    this.pipelineJobTableLastRow = this.pipelineJobTable.getByRole('row').last();
    this.pipelineJobStatus = this.pipelineJobTableLastRow.getByLabel('td-status');
    this.testImageChecksum = '62db932f4c8b13da0bb441b21a5b90fa47758a29afa519cb03fcae9606912e82';
    this.testWordDocChecksum = '132d77469b1653818753e0c9c6a7e6387f29042cdffcd4887387a004d9e30dff';
    this.testPdfDocChecksum = 'b07b3df4509ddd400f18b0c078f1a40d2241eb716d0ee3b1ec7a97df18ac5305';

  }

  async goto() {
    await this.page.goto(this.navigationPage.baseBrowsePath);
  }

  async getStarted() {
    await this.goto();
    await expect(this.navigationPage.baseBrowsePathHeading, 'The page heading is shown').toBeVisible();
  }

  async uploadFile(fileName:string, removeName: boolean, uploadButton: Locator){
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
    await fileToDelete.locator(this.fileFolderCheckbox).click();
    await this.actionsMenu.click();
    await this.deleteSelectedButton.click();
    await this.deleteFromMetsAndDeposit.click();
    await this.deleteItemModalButton.click();
    await expect(fileToDelete, 'The delete icon for the file is no longer visible').toBeHidden();
    await expect(this.alertMessage, 'Success message is shown').toContainText(`1 item(s) DELETED.`);
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

  async filterUsingAdvancedSearchDropdown(selectElementId: string, valueToSelect: string){

    //Await the table to display
    await expect(this.depositsTable, 'We can see the deposits table').toBeVisible();

    //Click advanced search
    await this.page.locator('#showFormToggle').click();

    //change dropdown to required value
    await this.page.selectOption(`#${selectElementId}`, valueToSelect);

    //Click Submit
    await this.page.getByRole('button', { name: 'Submit' }).click();
  }

  async filterUsingAdvancedSearchDateField(dateElementId: string, valueToEnter: string){

    //Await the table to display
    await expect(this.depositsTable, 'We can see the deposits table').toBeVisible();

    //Click advanced search
    await this.page.locator('#showFormToggle').click();

    //change dropdown to required value
    await this.page.locator(`#${dateElementId}`).fill(valueToEnter);

    //Click Submit
    await this.page.getByRole('button', { name: 'Submit' }).click();
  }

  async openMetsFileInTab(context: BrowserContext, locatorToClick: Locator){
    const pagePromise = context.waitForEvent('page');
    //View the METS
    await locatorToClick.click();
    const metsFileTab = await pagePromise;
    await metsFileTab.waitForLoadState();
    await metsFileTab.close();
  }

  async checkAmdSecExists(metsXML: Document, itemToFind: string, shouldBePresent: boolean) :Promise<string>{
    const amdSecValues = metsXML.getElementsByTagName('mets:amdSec');
    const itemToFindElement = amdSecValues.filter(item => (item.getElementsByTagName('premis:originalName'))[0].textContent.trim() === itemToFind.trim());
    if (shouldBePresent) {
      expect(itemToFindElement, `We found ${itemToFind} in the amdSec`).toHaveLength(1);
      return itemToFindElement[0].getAttribute('ID');
    }else{
      expect(itemToFindElement, `We did not find ${itemToFind} in the amdSec`).toHaveLength(0);
      return '';
    }
  }

  async checkForChecksum(metsXML: Document, itemToFind: string, checksumType: string, checksum: string){
    const amdSecValues = metsXML.getElementsByTagName('mets:amdSec');
    const itemToFindElement = amdSecValues.filter(item => (item.getElementsByTagName('premis:originalName'))[0].textContent.trim() === itemToFind.trim());

    //itemToFindElement should have length 1
    const messageDigestAlgorithmElement = itemToFindElement[0].getElementsByTagName('premis:messageDigestAlgorithm');
    expect(messageDigestAlgorithmElement, 'There is only 1 messageDigestAlgoithm item').toHaveLength(1);
    expect(messageDigestAlgorithmElement[0].textContent, 'The checksum type is as expected').toEqual(checksumType);
    const messageDigestElement = itemToFindElement[0].getElementsByTagName('premis:messageDigest');
    expect(messageDigestElement, 'There is only 1 messageDigest item').toHaveLength(1);
    expect(messageDigestElement[0].textContent, 'The checksum is as expected').toEqual(checksum);
  }

  async checkPronomInformation(metsXML: Document, itemToFind: string, formatName: string, formatKey: string){
    const amdSecValues = metsXML.getElementsByTagName('mets:amdSec');
    const itemToFindElement = amdSecValues.filter(item => (item.getElementsByTagName('premis:originalName'))[0].textContent.trim() === itemToFind.trim());

    //itemToFindElement should have length 1
    const formatNameElement = itemToFindElement[0].getElementsByTagName('premis:formatName');
    expect(formatNameElement, 'There is only 1 formatName item').toHaveLength(1);
    expect(formatNameElement[0].textContent, 'The format name is as expected').toEqual(formatName);
    const formatKeyElement = itemToFindElement[0].getElementsByTagName('premis:formatRegistryKey');
    expect(formatKeyElement, 'There is only 1 formatRegistryKey item').toHaveLength(1);
    expect(formatKeyElement[0].textContent, 'The format key is as expected').toEqual(formatKey);
  }

  async checkFileSecExists(metsXML: Document, itemToFind: string, admId: string, mimeType: string = null) : Promise<string>{
    const fileSecValues = metsXML.getElementsByTagName('mets:fileSec')[0];
    const files = fileSecValues.getElementsByTagName('mets:file');

    const itemToFindElement = files.filter(item => item.getAttribute('ADMID').trim() === admId.trim());

    //At this stage we should have only item in itemToFindElement
    if (mimeType!=null) {
      const mimeTypeAttribute = itemToFindElement[0].getAttribute('MIMETYPE');
      expect(mimeTypeAttribute, 'Mime type is correct').toEqual(mimeType);
    }

    const fileLocations = itemToFindElement[0].getElementsByTagName('mets:FLocat');
    const itemToFindFLocatElement = fileLocations.filter(item => item.getAttribute('xlink:href').trim() === itemToFind.trim());
    expect(itemToFindFLocatElement, `We found ${itemToFind} in the fileSec`).toHaveLength(1);
    return itemToFindElement[0].getAttribute('ID');
  }

  //TODO - I could send the list of levels in a string array, and loop through that array to iterate down the levels
  //As I progress through further tests I'll see if this is necessary.
  async checkFolderStructureCorrect(metsXML: Document, firstLevel: string, secondLevel:string, thirdLevel: string, fourthLevel:string, fifthLevel: string, admId: string): Promise<Element>{
    //Structure Map will always have length 1
    let structMap = (metsXML.getElementsByTagName('mets:structMap'))[0];
    let rootElement = (structMap.getElementsByTagName('mets:div')).filter(item => item.getAttribute('LABEL').trim() === firstLevel);
    expect(rootElement, `We found ${firstLevel} at the correct location in the structMap`).toHaveLength(1);
    let testFolderElement = (rootElement[0].getElementsByTagName('mets:div')).filter(item => item.getAttribute('LABEL').trim() === secondLevel);
    expect(testFolderElement, `We found ${secondLevel} at the correct location in the structMap`).toHaveLength(1);
    if (thirdLevel != null) {
      testFolderElement = (testFolderElement[0].getElementsByTagName('mets:div')).filter(item => item.getAttribute('LABEL').trim() === thirdLevel);
      expect(testFolderElement, `We found ${thirdLevel} at the correct location in the structMap`).toHaveLength(1);
    }
    if (fourthLevel != null) {
      testFolderElement = (testFolderElement[0].getElementsByTagName('mets:div')).filter(item => item.getAttribute('LABEL').trim() === fourthLevel);
      expect(testFolderElement, `We found ${fourthLevel} at the correct location in the structMap`).toHaveLength(1);
    }
    if (fifthLevel != null) {
      testFolderElement = (testFolderElement[0].getElementsByTagName('mets:div')).filter(item => item.getAttribute('LABEL').trim() === fifthLevel);
      expect(testFolderElement, `We found ${fifthLevel} at the correct location in the structMap`).toHaveLength(1);
    }

    //Check the ADMID matches
    if (admId != null) {
      expect(testFolderElement[0].getAttribute('ADMID'), 'The ADMID elements match correctly').toEqual(admId);
    }
    return testFolderElement[0];
  }

  async checkFileExistsInStructure(metsXML: Document, firstLevel: string, secondLevel:string, thirdLevel: string, fourthLevel:string, fifthLevel: string, fileName: string, amdId: string, fileID:string) {

    const testFolderElement = await this.checkFolderStructureCorrect(metsXML, firstLevel, secondLevel, thirdLevel, fourthLevel, fifthLevel, amdId);

    const testFile1 = (testFolderElement.getElementsByTagName('mets:div')).filter(item => item.getAttribute('LABEL').trim() === fileName.trim());
    expect(testFile1, `We found ${fileName} at the correct location in the structMap`).toHaveLength(1);
    //Get the <mets:fptr> child
    //Check that the FILEID attribute on the fptr matches fileID
    expect((testFile1[0].getElementsByTagName('mets:fptr'))[0].getAttribute('FILEID'), 'The file IDs match in the METS file').toEqual(fileID);
  }

  async checkFileNotPresentInMETS(metsXML: Document, fileName: string, fullFilePath: string){
    //check gone form the amd section
    await this.checkAmdSecExists(metsXML, fullFilePath, false);

    //check gone from the fileSec
    const fileLocations = metsXML.getElementsByTagName('mets:FLocat');
    const itemToFindFLocatElement = fileLocations.filter(item => item.getAttribute('xlink:href').trim() === fullFilePath.trim());
    expect(itemToFindFLocatElement, 'The file has been removed from the fileSec section').toHaveLength(0);

    //Check gone from the structMap
    //Structure Map will always have length 1
    let structMap = (metsXML.getElementsByTagName('mets:structMap'))[0];
    let elementToFind = (structMap.getElementsByTagName('mets:div')).filter(item => item.getAttribute('LABEL').trim() === fileName);
    expect(elementToFind, 'The file has been removed from the structMap section').toHaveLength(0);
  }

  async checkFolderDeletedFromMETS(metsXML: Document, folderName: string, fullFolderPath: string){
    //check gone form the amd section
    await this.checkAmdSecExists(metsXML, fullFolderPath, false);

    //Check gone from the structMap
    //Structure Map will always have length 1
    let structMap = (metsXML.getElementsByTagName('mets:structMap'))[0];
    let elementToFind = (structMap.getElementsByTagName('mets:div')).filter(item => item.getAttribute('LABEL').trim() === folderName);
    expect(elementToFind, 'The folder has been deleted from the structMap section').toHaveLength(0);
  }

  async checkAccessExists(metsXML: Document, itemToFind: string, shouldBePresent: boolean = true){
    const itemToFindElement = await this.getAccessConditionElement(metsXML, itemToFind);
    if(shouldBePresent) {
      expect(itemToFindElement, `We found ${itemToFind} in the dmdSec`).toHaveLength(1);
      expect(itemToFindElement[0].getAttribute('type')).toEqual('restriction on access');
    }else{
      expect(itemToFindElement, `We did not find ${itemToFind} in the dmdSec`).toHaveLength(0);
    }
  }
  async checkRightsExist(metsXML: Document, itemToFind: string, shouldBePresent: boolean = true){
    const itemToFindElement = await this.getAccessConditionElement(metsXML, itemToFind);
    if(shouldBePresent) {
      expect(itemToFindElement, `We found ${itemToFind} in the dmdSec`).toHaveLength(1);
      expect(itemToFindElement[0].getAttribute('type')).toEqual('use and reproduction');
    }else{
      expect(itemToFindElement, `We did not find ${itemToFind} in the dmdSec`).toHaveLength(0);
    }
  }

  async getAccessConditionElement(metsXML: Document, itemToFind: string): Promise<Element[]>{
    //Only ever 1 dmdSec
    const dmdSecValue = (metsXML.getElementsByTagName('mets:dmdSec'))[0];
    const accessRightsElements = dmdSecValue.getElementsByTagName('mods:accessCondition');
    const itemToFindElement = accessRightsElements.filter(item => (item.textContent.trim() === itemToFind.trim()));
    return itemToFindElement;

  }
  async uploadFilesToDepositS3Bucket(files: string[], depositURL: string, sourceDir: string, createChecksum: boolean, uploadMETS: boolean = false){
    let depositId: string = depositURL.substring(depositURL.length-12);
    const depositResponse = await presentationApiContext.get(`deposits/${depositId}`);
    const body = await depositResponse.body();
    const depositItem = JSON.parse(body.toString('utf-8'));
    //Get the s3 files location
    const filesLocation = depositItem.files;

    if (uploadMETS){
      files.push(`mets.xml`);
    }
    for (const file of files) {
      await uploadFile(filesLocation, sourceDir + file, file, createChecksum);
    }

  }

  async validateFilePresentInMETS(context: BrowserContext ,metsXML: Document, admID: string, filename: string, firstLevel: string, secondLevel: string, thirdLevel: string, fourthLevel: string, fifthLevel: string, expectToFind: boolean, mimetype: string = null){
    //Validate that we have an amdSec with each new file
    const admIDImage  = await this.checkAmdSecExists(metsXML, filename, expectToFind);

    if (expectToFind) {
      //Check for a fileSec entry
      const fileIDImage = await this.checkFileSecExists(metsXML, filename, admIDImage, mimetype);

      //Check for the correct folder and file structure
      await this.checkFileExistsInStructure(metsXML, '__ROOT', firstLevel, secondLevel, thirdLevel, fourthLevel, fifthLevel, admID, fileIDImage);
    }
  }

  async createASubFolder(page: Page, parentFolder: Locator, newFolderName: string, newFolderPath: string){
    //Create a new sub folder
    await parentFolder.click();
    await this.newFolderNameInput.fill(newFolderName);
    await this.newFolderDialogButton.click();
    await expect(this.createFolderLocator(newFolderPath), 'The new test folder has been created in the correct place in the hierarchy').toBeVisible();
  }

  createFolderLocator(folderPath: string){
    return this.page.locator(`[data-type="directory"][data-path="${folderPath}"]`);
  }

  async deleteTheCurrentDeposit(){
    await this.actionsMenu.click();
    await this.deleteDepositButton.click();
    await expect(this.deleteDepositModalButton, 'Delete button is initially disabled').toBeDisabled();
    await this.confirmDeleteDeposit.check();
    await this.deleteDepositModalButton.click();
  }

  async deleteFolder(folderLocation: Locator){
    await folderLocation.click();
    await this.actionsMenu.click();
    await this.deleteSelectedButton.click();
    await this.deleteFromMetsAndDeposit.click();
    await this.deleteItemModalButton.click();
    await expect(this.alertMessage, 'Success message is shown').toContainText(`1 item(s) DELETED.`);
  }

  async verifyBagitStructure(inBagitFormat: boolean, page: Page){
    const depositURL: string = page.url();
    let depositId: string = depositURL.substring(depositURL.length-12);

    const depositResponse = await presentationApiContext.get(`deposits/${depositId}`);
    const body = await depositResponse.body();
    const depositItem = JSON.parse(body.toString('utf-8'));
    //Get the s3 files location
    const filesLocation = depositItem.files;

    expect(await checkForFileInS3(filesLocation, 'data'), `The data folder is ${inBagitFormat?'':'not'} present`).toEqual(inBagitFormat);
    if (inBagitFormat) {
      expect(await checkForFileInS3(filesLocation, `data/${this.newTestFolderSlug}`), `The subfolder is within the data folder`).toEqual(inBagitFormat);
      await expect(this.usingBagitGuidance, 'We can see the advice that we are using Bagit Layout').toBeVisible();
    }
  }

  async setAccessConditionsAndRights(accessConditions: string[], rightsStatement: string, saveChanges: boolean = true){
    await this.openAccessConditionsAndRightsButton.click();
    await this.page.selectOption(`#accessRestrictionsSelect`, accessConditions);
    await this.page.selectOption(`#rightsStatementSelect`, rightsStatement);
    if (saveChanges) {
      await this.saveAccessConditionsAndRightsButton.click();
    }else{
      await this.closeAccessConditionsAndRightsButton.click();
    }
    await expect(this.page.getByRole('dialog')).not.toBeVisible();
  }

  async refreshStorage(){
    //Refresh the storage
    await this.actionsMenu.click();
    await this.refreshStorageButton.click();
  }
}