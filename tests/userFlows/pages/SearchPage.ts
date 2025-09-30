import { expect, type Locator, type Page } from '@playwright/test';
import {NavigationPage} from "./NavigationPage";
import {DepositPage} from "./DepositPage";

export class SearchPage {
  readonly page: Page;
  readonly navigationPage: NavigationPage;
  readonly depositPage: DepositPage;

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

  constructor(page: Page) {
    this.page = page;
    this.navigationPage = new NavigationPage(page);
    this.depositPage = new DepositPage(page);

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


  

