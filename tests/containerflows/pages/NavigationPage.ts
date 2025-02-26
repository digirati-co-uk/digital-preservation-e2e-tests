
import { expect, type Locator, type Page } from '@playwright/test';
export class NavigationPage {
  readonly page: Page;
  readonly dashboardMenuOption: Locator;
  readonly browseMenuOption: Locator;
  readonly depositMenuOption: Locator;
  readonly homepageHeading : Locator;
  readonly browseTheRepositoryLink: Locator;
  readonly connectivityChecksLink: Locator;
  readonly repositoryBrowsePathHeading : Locator;
  readonly connectivityChecksHeading : Locator;
  readonly startingPathHeading : Locator;
  readonly depositsHeading : Locator;
  readonly basePath: string = '_for_testing/playwright-testing';
  readonly baseBrowsePath: string = `/browse/${this.basePath}`;
  readonly baseAPIPath: string = `/repository/${this.basePath}/`;
  readonly baseBrowsePathHeading : Locator;
  readonly breadCrumb : Locator;

  constructor(page: Page) {
    this.page = page;

    //Locators
    this.baseBrowsePathHeading = page.getByRole('heading', {name: 'Playwright Testing'});
    this.dashboardMenuOption = page.getByRole('link', { name: 'Dashboard' });
    this.browseMenuOption = page.getByRole('link', { name: 'Browse' });
    this.depositMenuOption = page.getByRole('link', { name: 'Deposits', exact:true });
    this.homepageHeading = page.getByRole('heading', {name: 'Home page'});
    this.browseTheRepositoryLink = page.getByRole('link', { name: 'Browse the repository' });
    this.connectivityChecksLink = page.getByRole('link', { name: 'View connectivity checks' });
    this.repositoryBrowsePathHeading = page.getByRole('heading', {name: 'Browse Repository'});
    this.depositsHeading = page.getByRole('heading', {name: 'Deposits'});
    this.startingPathHeading = page.getByRole('heading', {name: 'For Tests'});
    this.connectivityChecksHeading = page.getByRole('heading', {name: 'Connectivity Checks'});
    this.breadCrumb = page.getByRole('link', {name: 'breadcrumb-item' });
    

  }

  async goto() {
    await this.page.goto(this.baseBrowsePath);
  }

  async getStarted() {
    await this.goto();
    await expect(this.baseBrowsePathHeading, 'The page heading is shown').toBeVisible();
  }
}


  

