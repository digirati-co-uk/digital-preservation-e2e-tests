import { expect, Locator, Page } from '@playwright/test';
import { ContainerPages } from './pages/ContainerPages';
import { generateUniqueId } from '../helpers/helpers';
import { apiContext, test } from '../../fixture';

test.describe('Navigation Tests', () => {

  let containerPage: ContainerPages;

  test.beforeEach('Set up POM', async ({ page }) => {
    containerPage = new ContainerPages(page);    
  });

  test(`test the Dashboard link in the Left Hand Nav`, async ({page}) => {
    await containerPage.getStarted();  
    //TODO test 'Dashboard' link on LHS navigates to the homepage and 
    //displays the Browse and connectivity checks
    //Check that the Browse link navigates into the Folder browsing

  });

  test(`test the Browse link in the Left Hand Nav`, async ({page}) => {
    await containerPage.getStarted();  
    //TODO test that Browser on the LHS navigates into Browse - repository

  });

  

  

});


