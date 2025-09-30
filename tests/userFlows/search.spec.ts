import { test } from '../../fixture';
import {SearchPage} from "./pages/SearchPage";
import {expect, Page} from "@playwright/test";
import {generateUniqueId} from "../helpers/helpers";

test.describe('Search Tests', () => {

  let searchPage: SearchPage;

  test.beforeEach('Set up POM', async ({ page }) => {
    searchPage = new SearchPage(page);
  });

  test(`test the identity service search`, async ({page}) => {

    await test.step('Search by PID', async() => {
      await executeSearch(searchPage.pidToSearchFor);
      await checkAllTabsArePresent();

      await expect(searchPage.identifierTabResultCount).toHaveText('1');
      await searchPage.identifierTab.click();
      await expect(searchPage.identifierTabHeading, 'The tab header is correct and visible').toBeVisible();
      await expect(searchPage.identifierItemName, 'The Item name is correct in the result').toHaveText(searchPage.expectedTitleForPid);

      //Check that the url contains /Search
      expect(page.url()).toContain('/Search');
    });

    await test.step('Search by IRN', async() => {
      await executeSearch(searchPage.irnToSearchFor);
      await checkAllTabsArePresent();

      await expect(searchPage.identifierTabResultCount).toHaveText('1');
      await searchPage.identifierTab.click();
      await expect(searchPage.identifierTabHeading, 'The tab header is correct and visible').toBeVisible();
      await expect(searchPage.identifierItemName, 'The Item name is correct in the result').toHaveText(searchPage.expectedTitleForIRN);

    });
  });

  test(`test the deposit service search`, async ({page}) => {

    //Set a 5-minute timeout
    test.setTimeout(300_000);

    let depositId: string;
    const uniqueId : string = generateUniqueId();
    let uniqueTitle: string = `This is a unique name for a deposit ${uniqueId}`;
    let archivalGroupString: string = searchPage.depositPage.testValidArchivalURI + uniqueId;
    let archivalGroupNote: string = searchPage.depositPage.testDepositNote + uniqueId;
    let depositURL: string;

    await test.step('Create a unique deposit for the search', async() => {
      await searchPage.depositPage.getStarted();
      await searchPage.depositPage.newDepositButton.click();
      await searchPage.depositPage.modalArchivalName.fill(uniqueTitle);
      await searchPage.depositPage.modalArchivalSlug.fill(archivalGroupString);
      await searchPage.depositPage.modalArchivalNote.fill(archivalGroupNote);
      await searchPage.depositPage.modalCreateNewDepositButton.click();
      await expect(page, 'We have been navigated into the new Deposit page').toHaveURL(searchPage.depositPage.depositsURL);
      depositURL = page.url();
      depositId = depositURL.substring(depositURL.lastIndexOf('/') + 1);
    });

    await test.step('Execute the search using the archival group location', async() => {

      //Check we get one result using the archival group location
      await checkDepositSearchResults(archivalGroupString, page, uniqueTitle, 1);

      //Check that the search is not case sensitive
      await checkDepositSearchResults(archivalGroupString.toUpperCase(), page, uniqueTitle, 1);

      //Test with partial matches - should get a MINIMUM of 1 match
      archivalGroupString = archivalGroupString.substring(0,archivalGroupString.length - 2);
      await checkDepositSearchResults(archivalGroupString, page, uniqueTitle, 1, false);
    });

    await test.step('Execute the search using the depositId', async() => {

      //Check we get one result using the deposit id
      await checkDepositSearchResults(depositId, page, uniqueTitle, 1);

      //Check that the search is not case sensitive
      await checkDepositSearchResults(depositId.toUpperCase(), page, uniqueTitle, 1);

      //Test with partial matches - should get a MINIMUM of 1 match
      depositId = depositId.substring(0,depositId.length - 2);
      await checkDepositSearchResults(depositId, page, uniqueTitle, 1, false);
    });

    await test.step('Execute the search using the submission text', async() => {

      //Check we get one result using the submission text/note
      await checkDepositSearchResults(archivalGroupNote, page, uniqueTitle, 1);

      //Check that the search is not case sensitive
      await checkDepositSearchResults(archivalGroupNote.toUpperCase(), page, uniqueTitle, 1);

      //Test with partial matches - should get a MINIMUM of 1 match
      archivalGroupNote = archivalGroupNote.substring(0,archivalGroupNote.length - 2);
      await checkDepositSearchResults(archivalGroupNote, page, uniqueTitle, 1, false);
    });

    await test.step('Execute the search using the archival group name', async() => {

      //Check we get one result using the archival group name
      await checkDepositSearchResults(uniqueTitle, page, uniqueTitle, 1);

      //Check that the search is not case sensitive
      await checkDepositSearchResults(uniqueTitle.toUpperCase(), page, uniqueTitle, 1);

      //Test with partial matches - should get a MINIMUM of 1 match
      uniqueTitle = uniqueTitle.substring(0,uniqueTitle.length - 2);
      await checkDepositSearchResults(uniqueTitle, page, uniqueTitle, 1, false);
    });

    await test.step('Tidy up and delete the Deposit', async() => {
      //Navigate back into the first deposit in order to delete it
      await page.goto(depositURL);
      //Tidy up
      await searchPage.depositPage.deleteTheCurrentDeposit();
    });
  });

  test(`TODO test the Fedora service search`, async ({}) => {
    //

  });

  test(`TODO execute a test directly using query params`, async ({}) => {

  });

  test(`TODO check pagination and ordering of large result sets`, async ({}) => {
    //test step - check the pagination - use search term 'playwright' to get thousands of results
  });

  test(`Check the FAQ tab`, async ({}) => {
    //use a weird search term to get the page to jump straight to the FAQ tab
    await executeSearch('xxxxyyyyxxxxzzzzyyyyyzzzzuuuuiiiiqqqquuuuooooqqqqllllqqqqdddd');
    await checkAllTabsArePresent();
    //Check we are on the FAQ tab
    await expect(searchPage.faqTabHeading, 'The tab page heading is visible').toBeVisible();
    //Check the various sub headings are visible
    await expect(searchPage.faqTabSubHeading1,'The correct sub heading is shown').toBeVisible();
    await expect(searchPage.faqTabSubHeading2,'The correct sub heading is shown').toBeVisible();
    await expect(searchPage.faqTabSubHeading3,'The correct sub heading is shown').toBeVisible();
    await expect(searchPage.faqTabSubHeading4,'The correct sub heading is shown').toBeVisible();

  });

  test(`FAILING TILL BUG FIXED Check that no search term directs to the FAQ page`, async ({}) => {
    //use an empty search term
    await executeSearch(' ');
    //Check we are on the FAQ tab
    await expect.soft(searchPage.faqTabHeading, 'The tab page heading is visible').toBeVisible();

    //use an empty search term
    await executeSearch('');
    //Check we are on the FAQ tab
    await expect.soft(searchPage.faqTabHeading, 'The tab page heading is visible').toBeVisible();

  });

  async function checkDepositSearchResults(searchTerm: string, page: Page, depositName: string, expectedResults: number, exact: boolean = true){
    //Check we get one result using the archival group location
    await executeSearch(searchTerm);
    await checkAllTabsArePresent();
    if (exact) {
      //Check the correct number of results displayed on the results page
      await expect(searchPage.depositTabResultCount).toHaveText(expectedResults.toString());
    }else{
      const numResults: number = Number.parseInt(await searchPage.depositTabResultCount.textContent());
      expect(numResults).toBeGreaterThanOrEqual(expectedResults);
    }
    //Check the other tabs have 0 results
    await expect(searchPage.fedoraTabResultCount).toHaveText('0');
    await expect(searchPage.identifierTabResultCount).toHaveText('0');

    //Click into deposit tab and check one result only - check it's the right one
    await checkDepositTabResults(page, depositName, expectedResults, exact);
  }

  async function executeSearch(searchTerm: string){
    await searchPage.getStarted();
    await searchPage.searchBox.fill(searchTerm);
    await searchPage.searchBox.press('Enter');
  }

  async function checkAllTabsArePresent(){
    await expect(searchPage.fedoraTab, 'The Fedora results tab is visible').toBeVisible();
    await expect(searchPage.depositTab, 'The Deposits results tab is visible').toBeVisible();
    await expect(searchPage.identifierTab, 'The Identifier results tab is visible').toBeVisible();
    await expect(searchPage.faqTab, 'The FAQ results tab is visible').toBeVisible();
    await expect(searchPage.allTabs).toHaveCount(4);
  }

  async function checkDepositTabResults(page: Page, depositName: string, expectedResults: number, exact:boolean = true){
    await searchPage.depositTab.click();
    await expect(searchPage.depositTabHeading, 'The tab header is correct and visible').toBeVisible();

    //Check we have a row containing the deposit name
    await expect(searchPage.depositItemName.filter({hasText:depositName}).first(), 'The Item name is correct in the result').toBeVisible();

    //Check we have at least expectedResults this many rows returned
    let numResults : number = await (page.getByRole('table', {name: 'table-deposit-files'}).getByRole('row')).count();
    //Subtract the header row from the count
    numResults--;
    if (exact) {
      await expect(page.getByText(`${expectedResults} records found`), 'The correct number of results are listed').toBeVisible();
      expect (numResults).toEqual(expectedResults);
    }else{
      expect (numResults).toBeGreaterThanOrEqual(expectedResults);
    }
  }
});


