
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
  readonly baseBrowsePath: string;
  readonly baseAPIPath: string;
  readonly basePath: string;
  readonly baseBrowsePathHeading : Locator;


  constructor(page: Page) {
    this.page = page;

    //consts
    this.basePath = '_for_tests/playwright-testing';
    this.baseBrowsePath = `/browse/${this.basePath}`;
    this.baseAPIPath = `/repository/${this.basePath}/`;

    //Locators
    this.baseBrowsePathHeading = page.getByRole('heading', {name: 'Browse - Playwright Testing'});
    this.dashboardMenuOption = page.getByRole('link', { name: 'Dashboard' });
    this.browseMenuOption = page.getByRole('link', { name: 'Browse' });
    this.depositMenuOption = page.getByRole('link', { name: 'Deposits' });
    this.homepageHeading = page.getByRole('heading', {name: 'Home page'});
    this.browseTheRepositoryLink = page.getByRole('link', { name: 'Browse the repository' });
    this.connectivityChecksLink = page.getByRole('link', { name: 'View connectivity checks' });
    this.repositoryBrowsePathHeading = page.getByRole('heading', {name: 'Browse - repository'});
    this.depositsHeading = page.getByRole('heading', {name: 'Deposits'});
    this.startingPathHeading = page.getByRole('heading', {name: 'Browse - For Tests'});
    this.connectivityChecksHeading = page.getByRole('heading', {name: 'Connectivity Checks'});

  }

  async goto() {
    await this.page.goto(this.baseBrowsePath);
  }

  async getStarted() {
    await this.goto();
    await expect(this.baseBrowsePathHeading, 'The page heading is shown').toBeVisible();
  }



}


  

