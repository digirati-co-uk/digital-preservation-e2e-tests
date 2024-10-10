import { test } from '../../fixture';
import {NavigationPage} from "./pages/NavigationPage";
import {expect} from "@playwright/test";

test.describe('Navigation Tests', () => {

  let navigationPage: NavigationPage;

  test.beforeEach('Set up POM', async ({ page }) => {
    navigationPage = new NavigationPage(page);
  });

  test(`test the Dashboard link in the Left Hand Nav`, async ({page}) => {
    await navigationPage.getStarted();

    //Test 'Dashboard' link on LHS navigates to the homepage and
    //displays the Browse and connectivity checks
    await navigationPage.dashboardMenuOption.click();

    await expect(navigationPage.browseTheRepositoryLink).toBeVisible();

    //Check that the Browse link navigates into the Folder browsing
    await navigationPage.browseTheRepositoryLink.click();
    await expect(navigationPage.repositoryBrowsePathHeading).toBeVisible();

    //Return to the Dashboard and check that connectivity link works
    await navigationPage.dashboardMenuOption.click();
    await navigationPage.connectivityChecksLink.click();
    await expect(navigationPage.connectivityChecksHeading).toBeVisible();

  });

  test(`test the Browse link in the Left Hand Nav`, async ({page}) => {
    await navigationPage.getStarted();
    //Test the Browse link exists and takes you into the Browse repository page
    await navigationPage.browseMenuOption.click();
    await expect(navigationPage.repositoryBrowsePathHeading).toBeVisible();
  });

  test(`test the Deposit link in the Left Hand Nav`, async ({page}) => {
    await navigationPage.getStarted();
    //Test the Deposits link exists and takes you into the Deposits page
    await navigationPage.depositMenuOption.click();
    await expect(navigationPage.depositsHeading).toBeVisible();
  });

  

  

});


