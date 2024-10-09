
import { expect, type Locator, type Page } from '@playwright/test';
export class NavigationPage {
  readonly page: Page;
  readonly dashboardMenuOption: Locator;
  readonly browseMenuOption: Locator;
  readonly homepageHeading : Locator;
  readonly browseTheRepositoryLink: Locator;
  readonly connectivityChecksLink: Locator;
  readonly repositoryBrowsePathHeading : Locator;
  readonly connectivityChecksHeading : Locator;
  readonly startingPathHeading : Locator;


  constructor(page: Page) {
    this.page = page;

    //consts

    //Locators
    this.dashboardMenuOption = page.getByRole('link', { name: 'Dashboard' });
    this.browseMenuOption = page.getByRole('link', { name: 'Browse' });
    this.homepageHeading = page.getByRole('heading', {name: 'Home page'});
    this.browseTheRepositoryLink = page.getByRole('link', { name: 'Browse the repository' });
    this.connectivityChecksLink = page.getByRole('link', { name: 'View connectivity checks' });
    this.repositoryBrowsePathHeading = page.getByRole('heading', {name: 'Browse - repository'});
    this.startingPathHeading = page.getByRole('heading', {name: 'Browse - For Tests'});
    this.connectivityChecksHeading = page.getByRole('heading', {name: 'Connectivity Checks'});


  }

  async goto() {
    await this.page.goto('/browse/_for_tests');
  }

  async getStarted() {
    await this.goto();
    await expect(this.startingPathHeading).toBeVisible();
  }



}


  

