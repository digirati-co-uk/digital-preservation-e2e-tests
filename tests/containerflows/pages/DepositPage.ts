
import {expect, Locator, Page} from '@playwright/test';
import {NavigationPage} from "./NavigationPage";
export class DepositPage {
  readonly page: Page;
  readonly navigation: NavigationPage;
  readonly newDepositButton: Locator;
  readonly modalCreateNewDepositButton : Locator;


  constructor(page: Page) {
    this.page = page;
    this.navigation = new NavigationPage(page);
    //consts

    //Locators
    this.newDepositButton = page.getByRole('button', { name: 'New Deposit' });
    this.modalCreateNewDepositButton = page.getByRole('button', { name: 'Create New Deposit' });

  }

  async goto() {
    await this.page.goto(this.navigation.baseBrowsePath);
    await expect(this.navigation.baseBrowsePathHeading).toBeVisible();
  }

  async getStarted() {
    await this.goto();
    await expect(this.navigation.baseBrowsePathHeading).toBeVisible();
  }



}


  

