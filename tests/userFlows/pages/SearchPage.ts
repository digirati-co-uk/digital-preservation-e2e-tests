import { expect, type Locator, type Page } from '@playwright/test';
import {NavigationPage} from "./NavigationPage";
import {DepositPage} from "./DepositPage";
import {ArchivalGroupPage} from "./ArchivalGroupPage";

export class SearchPage {
  readonly page: Page;
  readonly navigationPage: NavigationPage;
  readonly depositPage: DepositPage;
  readonly archivalGroupPage: ArchivalGroupPage;

  //Search Locators
  readonly searchBox: Locator;
  readonly pidToSearchFor: string = 'pdc7mlqc';
  readonly expectedTitleForPid : string = 'UAT Test 1';
  readonly irnToSearchFor: string = '1000008';
  readonly expectedTitleForIRN : string = 'UAT Test 8';
  readonly fedoraTab: Locator;
  readonly fedoraTabResultCount: Locator;
  readonly depositTab: Locator;
  readonly depositTabResultCount: Locator;
  readonly identifierTab: Locator;
  readonly identifierTabResultCount: Locator;
  readonly faqTab: Locator;
  readonly allTabs: Locator;
  readonly identifierTabHeading: Locator;
  readonly identifierItemName: Locator;
  readonly depositTabHeading: Locator;
  readonly depositItemName: Locator;
  readonly faqTabHeading: Locator;
  readonly faqTabSubHeading1: Locator;
  readonly faqTabSubHeading2: Locator;
  readonly faqTabSubHeading3: Locator;
  readonly faqTabSubHeading4: Locator;
  readonly fedoraTabHeading: Locator;
  readonly fedoraIdColumn: Locator;
  readonly totalSearchResults: Locator;
  readonly testImageResult: Locator;
  readonly testWordDocResult: Locator;
  readonly metsFileResult: Locator;
  readonly testImageResultLink: Locator;
  readonly paginationPage1Button: Locator;
  readonly paginationPage3Button: Locator;
  readonly paginationPage5Button: Locator;
  readonly activePageNumber: Locator;
  readonly depositTableDateCreatedRows: Locator;
  readonly fedoraTableDateCreatedRows: Locator;
  readonly firstDepositLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.navigationPage = new NavigationPage(page);
    this.depositPage = new DepositPage(page);
    this.archivalGroupPage = new ArchivalGroupPage(page);

    //Locators
    this.searchBox = page.getByRole('textbox', { name: 'Search' });
    this.fedoraTab = page.getByRole('tab', { name: 'Fedora' });
    this.fedoraTabResultCount= this.fedoraTab.getByLabel('fedora-tab-count');
    this.depositTab = page.getByRole('tab', { name: 'Deposit' });
    this.depositTabResultCount= this.depositTab.getByLabel('deposit-tab-count');
    this.identifierTab = page.getByRole('tab', { name: 'Identifier' });
    this.identifierTabResultCount= this.identifierTab.getByLabel('identifier-tab-count');
    this.faqTab = page.getByRole('tab', { name: 'FAQ' });
    this.allTabs = page.getByRole('tablist').getByRole('tab');
    this.identifierTabHeading = page.getByRole('heading', {name: 'Identifier'});
    this.identifierItemName = page.getByLabel('td-identifier-title');
    this.depositTabHeading = page.getByRole('heading', {name: 'Deposits'});
    this.depositItemName = page.getByLabel('td-deposits-ArchivalGroupName');
    this.faqTabHeading = page.getByRole('heading', {name: 'Frequently Asked Questions on search'});
    this.faqTabSubHeading1 = page.getByRole('heading', {name: 'General'});
    this.faqTabSubHeading2 = page.getByRole('heading', {name: 'Fedora Search'});
    this.faqTabSubHeading3 = page.getByRole('heading', {name: 'Deposit Search'});
    this.faqTabSubHeading4 = page.getByRole('heading', {name: 'Identifier Search'});
    this.fedoraTabHeading = page.getByRole('heading', {name: 'Fedora'});
    this.fedoraIdColumn = page.getByLabel('td-fedoraid');
    this.totalSearchResults = page.getByLabel('Total items').filter({visible: true});
    this.testImageResult = this.fedoraIdColumn.getByText(this.depositPage.testImageLocation).first();
    this.testWordDocResult = this.fedoraIdColumn.getByText(this.depositPage.testWordDocLocation).first();
    this.metsFileResult = this.fedoraIdColumn.getByText('mets.xml').first();
    this.testImageResultLink = page.getByRole('row').filter({has: this.testImageResult}).first().getByLabel('td-fedora-link').getByRole('link');
    this.paginationPage1Button = page.getByLabel('Paging').getByRole('listitem').filter({has: page.getByText('1', {exact:true})});
    this.paginationPage3Button = page.getByLabel('Paging').getByRole('listitem').filter({has: page.getByText('3', {exact:true})});
    this.paginationPage5Button = page.getByLabel('Paging').getByRole('listitem').filter({has: page.getByText('5', {exact:true})});
    this.activePageNumber = page.getByRole('navigation', { name: 'Paging' }).getByLabel('Page number');
    this.depositTableDateCreatedRows = page.getByRole('table', {name: 'table-deposit-files'}).getByRole('cell', {name: 'td-deposits-created', exact: true});;
    //TODO raise with Frank that this is named incorrectly
    this.fedoraTableDateCreatedRows = page.getByRole('table', {name: 'table-deposit-files'}).getByRole('cell', {name: 'td-path', exact: true});
    this.firstDepositLink = page.getByLabel('td-deposits-link').first().getByRole('link');
  }

  async goto() {
    await this.page.goto(this.navigationPage.baseBrowsePath);
  }

  async getStarted() {
    await this.goto();
    await expect(this.navigationPage.baseBrowsePathHeading, 'The page heading is shown').toBeVisible();
    await expect(this.searchBox, 'The search box is visible').toBeVisible();
  }
}


  

