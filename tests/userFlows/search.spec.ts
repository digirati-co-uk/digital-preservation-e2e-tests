import { test } from '../../fixture';
import {SearchPage} from "./pages/SearchPage";
import {BrowserContext, expect, Locator, Page} from "@playwright/test";
import {generateUniqueId} from "../helpers/helpers";

test.describe('Search Tests', () => {

  let searchPage: SearchPage;

  test.beforeEach('Set up POM', async ({ page }) => {
    searchPage = new SearchPage(page);
  });

  test(`Test the identity service search`, async ({page}) => {

    await test.step('Search by PID', async() => {
      await executeSearch(searchPage.pidToSearchFor);

      await expect(searchPage.identifierTabResultCount).toHaveText('1');
      await searchPage.identifierTab.click();
      await expect(searchPage.identifierTabHeading, 'The tab header is correct and visible').toBeVisible();
      await expect(searchPage.identifierItemName, 'The Item name is correct in the result').toHaveText(searchPage.expectedTitleForPid);

      //Check that the url contains /Search
      expect(page.url()).toContain('/Search');
    });

    await test.step('Search by IRN', async() => {
      await executeSearch(searchPage.irnToSearchFor);

      await expect(searchPage.identifierTabResultCount).toHaveText('1');
      await searchPage.identifierTab.click();
      await expect(searchPage.identifierTabHeading, 'The tab header is correct and visible').toBeVisible();
      await expect(searchPage.identifierItemName, 'The Item name is correct in the result').toHaveText(searchPage.expectedTitleForIRN);

    });
  });

  test(`Test the deposit service search`, async ({page, context}) => {

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

    await test.step('Check that we can open the deposit in a new tab', async() => {
      //Check we can open it in another tab
      const pagePromise = context.waitForEvent('page');
      await searchPage.firstDepositLink.click();
      const depositsTab = await pagePromise;
      await depositsTab.waitForLoadState();

      //Verify we are on the deposit page
      await expect(depositsTab, 'We have been navigated into the new Deposit page').toHaveURL(searchPage.depositPage.depositsURL);
      await depositsTab.close();

    });

    await test.step('Tidy up and delete the Deposit', async() => {
      //Navigate back into the first deposit in order to delete it
      await page.goto(depositURL);
      //Tidy up
      await searchPage.depositPage.deleteTheCurrentDeposit();
    });
  });

  test(`Test the Fedora service search`, async ({page, context}) => {

    //Set a 2-minute timeout
    test.setTimeout(120_000);

    //This term should return a number of results.
    await executeSearch(searchPage.depositPage.testValidArchivalURI);
    await searchPage.fedoraTab.click();
    //Check the page title is correct
    await expect(searchPage.fedoraTabHeading, 'We can see the correct page heading').toBeVisible();

    //Check the total items is >500
    expect(Number.parseInt(await searchPage.totalSearchResults.textContent()), 'We see hundreds of search results').toBeGreaterThanOrEqual(500);

    //Check that some of the fedora id results are for the standard files we put into each archival group
    //when running the archival group tests
    await expect(searchPage.testImageResult, 'We can see the test image file in the results').toBeVisible();
    await expect(searchPage.testWordDocResult, 'We can see the test word doc in the results').toBeVisible();
    await expect(searchPage.metsFileResult, 'We can see mets files in the results').toBeVisible();

    //Check fedord id in format info:fedora and contains the full path
    //'_for_testing/playwright-testing/playwright-valid-slug-abcd'
    for (const fedoraId of (await searchPage.fedoraIdColumn.all())) {
      await expect(fedoraId, 'The full path to the Fedora object is displayed').toContainText(`info:fedora/${searchPage.navigationPage.basePath}/${searchPage.depositPage.testValidArchivalURI}`);
    }

    //Check we can open it in another tab
    const pagePromise = context.waitForEvent('page');
    await searchPage.testImageResultLink.click();
    const archivalGroupTab = await pagePromise;
    await archivalGroupTab.waitForLoadState();

    //Verify we are on the archival group page and within the correct file
    await expect(archivalGroupTab.getByRole('link', { name: 'Go to Archival Group' })).toBeVisible();
    await expect(archivalGroupTab.getByRole('heading', {name: searchPage.depositPage.testImageLocation})).toBeVisible();
    await archivalGroupTab.close();

  });

  test(`Execute a search directly using query params`, async ({page}) => {
    await page.goto(`/Search?text=${searchPage.depositPage.testValidArchivalURI}`);
    await checkAllTabsArePresent();

    //Check the Fedora results page, should have hundreds of results
    await searchPage.fedoraTab.click();
    await expect(searchPage.fedoraTabHeading, 'We can see the correct page heading').toBeVisible();
    //Check the total items is >500
    expect(Number.parseInt(await searchPage.totalSearchResults.textContent()), 'We see hundreds of search results').toBeGreaterThanOrEqual(500);

    //Check the deposits result tab, should have hundreds of results
    await searchPage.depositTab.click();
    await expect(searchPage.depositTabHeading, 'We can see the correct page heading').toBeVisible();
    //Check the total items is >500
    expect(Number.parseInt(await searchPage.totalSearchResults.textContent()), 'We see hundreds of search results').toBeGreaterThanOrEqual(500);

    //Check the identifer tab, should have 0 results
    await searchPage.identifierTab.click();
    await expect(searchPage.identifierTabHeading, 'We can see the correct page heading').toBeVisible();
    //Check the total items is 0
    expect(Number.parseInt(await searchPage.identifierTabResultCount.textContent()), 'We see no search results').toEqual(0);

  });

  test(`Check pagination and ordering of large result sets`, async ({page}) => {

    await test.step('check the pagination', async() => {

      await page.goto(`/Search?text=${searchPage.depositPage.testValidArchivalURI}`);
      await checkAllTabsArePresent();

      //Check the Fedora results page, should have hundreds of results
      await searchPage.fedoraTab.click();
      await expect(searchPage.fedoraTabHeading, 'We can see the correct page heading').toBeVisible();

      //Assert we are currently on page 1 of the results
      await expect(searchPage.paginationPage1Button, 'Page 1 is set to active in the pagination').toHaveClass('page-item active');
      await expect(searchPage.activePageNumber, 'Pagination states Page 1 of ...').toHaveText('1');
      await expect(searchPage.paginationPage3Button, 'Page 3 is set to NOT active in the pagination').not.toHaveClass('page-item active');

      //Click on page 3 of the results and verify it's the one now selected
      await searchPage.paginationPage3Button.click();
      await expect(searchPage.paginationPage1Button, 'Page 1 is set to NOT active in the pagination').not.toHaveClass('page-item active');
      await expect(searchPage.paginationPage3Button, 'Page 3 is set to active in the pagination').toHaveClass('page-item active');
      await expect(searchPage.activePageNumber, 'Pagination states Page 3 of ...').toHaveText('3');

      //Navigate to the Deposits tab, and change to page 5 of the results
      await searchPage.depositTab.click();
      await expect(searchPage.depositTabHeading, 'We can see the correct page heading').toBeVisible();

      //Assert we are currently on page 1 of the results
      await expect(searchPage.paginationPage1Button, 'Page 1 is set to active in the pagination').toHaveClass('page-item active');
      await expect(searchPage.activePageNumber, 'Pagination states Page 1 of ...').toHaveText('1');
      await expect(searchPage.paginationPage5Button, 'Page 3 is set to NOT active in the pagination').not.toHaveClass('page-item active');

      //Click on page 5 of the results and verify it's the one now selected
      await searchPage.paginationPage5Button.click();
      await expect(searchPage.paginationPage1Button, 'Page 1 is set to NOT active in the pagination').not.toHaveClass('page-item active');
      await expect(searchPage.paginationPage5Button, 'Page 5 is set to active in the pagination').toHaveClass('page-item active');
      await expect(searchPage.activePageNumber, 'Pagination states Page 5 of ...').toHaveText('5');

      //Switch back to the Fedora tab and check that we are still on page 3 there
      await searchPage.fedoraTab.click();
      await expect(searchPage.fedoraTabHeading, 'We can see the correct page heading').toBeVisible();
      await expect(searchPage.paginationPage1Button, 'Page 1 is set to NOT active in the pagination').not.toHaveClass('page-item active');
      await expect(searchPage.paginationPage3Button, 'Page 3 is set to active in the pagination').toHaveClass('page-item active');
      await expect(searchPage.activePageNumber, 'Pagination states Page 3 of ...').toHaveText('3');
    });

    await test.step('Check the ordering', async() => {

      await executeSearch(searchPage.depositPage.testValidArchivalURI);

      //Check the Fedora results page for correct ordering
      await searchPage.fedoraTab.click();
      await expect(searchPage.fedoraTabHeading, 'We can see the correct page heading').toBeVisible();
      searchPage.depositPage.validateSortOrder<Date>((await searchPage.fedoraTableDateCreatedRows.allTextContents()), false, (value) => new Date(value), (a: Date, b:Date) => a.getTime() - b.getTime());

      //Navigate to the Deposits tab, and check for correct ordering
      await searchPage.depositTab.click();
      await expect(searchPage.depositTabHeading, 'We can see the correct page heading').toBeVisible();
      searchPage.depositPage.validateSortOrder<Date>((await searchPage.depositTableDateCreatedRows.allTextContents()), false, (value) => new Date(value), (a: Date, b:Date) => a.getTime() - b.getTime());

    });

  });

  test(`Check the FAQ tab`, async ({}) => {
    //use a weird search term to get the page to jump straight to the FAQ tab
    await executeSearch('xxxxyyyyxxxxzzzzyyyyyzzzzuuuuiiiiqqqquuuuooooqqqqllllqqqqdddd');
    //Check we are on the FAQ tab
    await expect(searchPage.faqTabHeading, 'The tab page heading is visible').toBeVisible();
    //Check the various sub headings are visible
    await expect(searchPage.faqTabSubHeading1,'The correct sub heading is shown').toBeVisible();
    await expect(searchPage.faqTabSubHeading2,'The correct sub heading is shown').toBeVisible();
    await expect(searchPage.faqTabSubHeading3,'The correct sub heading is shown').toBeVisible();
    await expect(searchPage.faqTabSubHeading4,'The correct sub heading is shown').toBeVisible();

  });

  test(`Check that no search term directs to the FAQ page`, async ({}) => {
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
    await checkAllTabsArePresent();
  }

  async function checkAllTabsArePresent(){
    await expect(searchPage.fedoraTab, 'The Fedora results tab is visible').toBeVisible();
    await expect(searchPage.depositTab, 'The Deposits results tab is visible').toBeVisible();
    await expect(searchPage.identifierTab, 'The Identifier results tab is visible').toBeVisible();
    await expect(searchPage.faqTab, 'The FAQ results tab is visible').toBeVisible();
    await expect(searchPage.allTabs, 'There are only 4 tabs').toHaveCount(4);
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


