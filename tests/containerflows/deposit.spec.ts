import { expect, Locator } from '@playwright/test';
import { DepositPage } from './pages/DepositPage';
import { test } from '../../fixture';

test.describe('Deposit Tests', () => {

  let depositPage: DepositPage;

  test.beforeEach('Set up POM', async ({ page }) => {
    depositPage = new DepositPage(page);
  });

  test(`can create a Deposit from the Deposits Left Hand Nav item`, async ({page}) => {

    await test.step('Create a Deposit with no name or note', async () => {
      await depositPage.getStarted();
      await depositPage.navigation.depositMenuOption.click();
      await expect(depositPage.navigation.depositsHeading).toBeVisible();
      await depositPage.newDepositButton.click();
      await depositPage.modalCreateNewDepositButton.click();

      //Validate that we're navigated into the new Deposit
      await expect(page).toHaveURL(/deposits\/\w{8}/);
      await expect(page.getByRole('heading', {name: /Deposit \w{8}/})).toBeVisible();

      //Check the created and modified dates are now

      //Check they match


    });
  });

  test.skip(`can create a Deposit within a Container, and the slug defaults to that location`, async ({page}) => {

  });

  //What's mandatory, what's not?
  test.skip(`cannot create a Deposit without ???`, async ({page}) => {


  });

});


