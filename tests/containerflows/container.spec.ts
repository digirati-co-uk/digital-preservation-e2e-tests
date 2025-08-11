import { ContainerPage } from './pages/ContainerPage';
import { checkDateIsWithinNumberOfSeconds, generateUniqueId} from '../helpers/helpers';
import { presentationApiContext, test } from '../../fixture';
import {expect, Locator} from '@playwright/test';

test.describe('Container Tests', () => {

  let containerPage: ContainerPage;

  test.beforeEach('Set up POM', async ({ page }) => {
    containerPage = new ContainerPage(page);
  });

  test(`cannot create a container/folder without a properly formed slug`, async ({}) => {
    await containerPage.getStarted();
    await containerPage.newFolderButton.click();
    await containerPage.folderPathTitleInput.fill(containerPage.playwrightContainerTitle);

    //Try to paste into the field a slug with spaces - the spaces should be automatically replaced with dashes
    await containerPage.folderPathNameInput.clear();
    await containerPage.folderPathNameInput.click();
    await containerPage.folderPathNameInput.fill(containerPage.playwrightContainerTitle);
    expect(await containerPage.folderPathNameInput.inputValue(), 'The field is blank because the JS popup blocked it').toEqual('');

    //Try to type into the field a slug with spaces and capitals - the spaces and uppercase letters should be automatically stripped
    await containerPage.folderPathNameInput.clear();
    await containerPage.folderPathNameInput.click();
    //Need a delay on the typing to allow time for the script that modifies the slug to run in the background
    await containerPage.folderPathNameInput.pressSequentially(containerPage.playwrightContainerTitle, { delay: 300 });
    expect(await containerPage.folderPathNameInput.inputValue(), 'The slug was replaced with a valid one').toEqual(containerPage.titleStrippedOfUpperCaseSpaces);
  });

  test(`can create a container/folder with a properly formed slug and see the details displayed`, async ({page}) => {

    //Set a 2-minute timeout
    test.setTimeout(120_000);

    const uniqueId = generateUniqueId();
    const folderTitle = `${containerPage.playwrightContainerTitle} ${uniqueId}`;
    const folderSlug = `${containerPage.playwrightContainerSlug}-${uniqueId.toLowerCase()}`;
    let containerItem;

    await test.step(`Can create the container via the Front End`, async () => {
      await containerPage.getStarted();  
      await containerPage.createContainer(folderSlug, folderTitle);
      await expect(containerPage.alertMessage, 'The successful created container message is shown').toContainText(containerPage.createdContainerMessage);
      await expect(containerPage.alertMessage, 'The successful created container message is shown and references the correct title').toContainText(folderTitle);
      //TODO if becomes an issue - note in the future if pagination is introduced we may not be on the page that
      //the container is on - address this once pagination/search/filtering/sorting introduced
      //by sorting on created desc e.g.
      await expect(containerPage.getFolderSlug(folderSlug), 'The new Container is visible on the page').toBeVisible();
    });

    await test.step(`API contains all the expected fields`, async () => {

      const containerResponse = await presentationApiContext.get(`${containerPage.navigationPage.baseBrowseAPIPath}${folderSlug.toLowerCase()}`);
      const body = await containerResponse.body();
      containerItem = JSON.parse(body.toString('utf-8'));

      //type matches Container
      expect(containerItem.type, 'Type is set to Container').toEqual('Container');

      //id matches what we sent in the get
      expect(containerItem.id, 'ID matches').toEqual(expect.stringContaining(`${containerPage.navigationPage.baseBrowseAPIPath}${folderSlug.toLowerCase()}`));
      //name matches the title
      expect(containerItem.name, 'Name is set to the correct Title').toEqual(folderTitle);

      //the containers element is empty
      expect(containerItem.containers, 'Containers is empty').toHaveLength(0);

      //the binaries element is empty
      expect(containerItem.binaries, 'Binaries is empty').toHaveLength(0);

      //created date is within last few seconds
      checkDateIsWithinNumberOfSeconds(containerItem.created, 10_000);

      //lastmodified is within the last few seconds
      checkDateIsWithinNumberOfSeconds(containerItem.lastModified, 10_000);

      //check that the created and modified dates match
      expect(containerItem.lastModified, 'Created and Modified dates match').toEqual(containerItem.created);

      //createdBy and modifiedBy match containerPage.createdBy
      expect(containerItem.createdBy, 'Correct value in createdBy').toEqual(expect.stringContaining(containerPage.createdBy));
      expect(containerItem.lastModifiedBy, 'Correct value in modifiedBy').toEqual(expect.stringContaining(containerPage.createdBy));
    });

    await test.step('Table headers are displayed as expected', async () => {
      await expect(containerPage.pathHeader, 'Path table header is visible').toBeVisible();
      await expect(containerPage.titleHeader, 'Title table header is visible').toBeVisible();
      await expect(containerPage.lastModifiedHeader, 'Last Modified table header is visible').toBeVisible();
      await expect(containerPage.byHeader, 'Last Modified By table header is visible').toHaveCount(2);
      await expect(containerPage.createdHeader, 'Created table header is visible').toBeVisible();
      await expect(containerPage.archivalGroupHeader, 'Created By table header is visible').toBeVisible();
    });

    await test.step('Verify correct columns shown with the correct data', async () => {

      //TODO - note in the future if pagination is introduced we may not be on the page that
      //the container is on - address this once pagination/search/filtering/sorting introduced
      //by sorting on created desc e.g.
      const  newContainerRow: Locator = containerPage.containerTableRow.filter({has: page.getByRole('link', {name: folderSlug})});
      await expect(newContainerRow, 'Can see the newly created container in the table').toBeVisible();

      //Check the API elements are displayed as expected
      await expect(newContainerRow.locator(page.getByRole('cell', {name:'td-path'})), 'The title of the new container displays correctly').toContainText(folderSlug.toLowerCase());

      const displayedModifiedDate = await newContainerRow.locator(page.getByRole('cell', {name: 'td-last-modified', exact:true})).textContent();
      expect(containerItem.lastModified, 'The last modified date matches the API data').toEqual(expect.stringContaining(displayedModifiedDate?.substring(0,9)!));

      const displayedCreatedDate = await newContainerRow.locator(page.getByRole('cell', {name: 'td-created', exact:true})).textContent();
      expect(containerItem.created, 'The created date matches the API data').toEqual(expect.stringContaining(displayedCreatedDate?.substring(0,9)!));

      const rowCount: number = await containerPage.resourcesTableRows.count();
      //Add 1 to include the header row that will have been returned in the above locator call
      if (rowCount <= containerPage.maxTableRowsShowingAllColumns+1) {
        await expect(newContainerRow.locator(page.getByRole('cell', {name: 'td-title'})), 'The title matches the API data').toContainText(containerItem.name);

        const displayedModifiedBy = await newContainerRow.locator(page.getByRole('cell', {name: 'td-last-modified-by'})).textContent();
        expect(containerItem.lastModifiedBy, 'The last modified by matches the API data').toEqual(expect.stringContaining(displayedModifiedBy!));

        const displayedCreatedBy = await newContainerRow.locator(page.getByRole('cell', {name: 'td-created-by'})).textContent();
        expect(containerItem.createdBy, 'The created by matches the API data').toEqual(expect.stringContaining(displayedCreatedBy!));
      }
    });

    await test.step('Delete the container', async () => {

      const myContainerLink: Locator = containerPage.getFolderSlug(folderSlug.toLowerCase());
      await myContainerLink.click();

      //Delete the parent container
      await containerPage.deleteContainerButton.click();
      await containerPage.confirmDeleteContainer.click();

      //Verify deleted
      await expect(containerPage.alertMessage, 'We see the successful deletion message').toContainText(`${folderSlug} deleted successfully`);
    });
  });

  test(`cannot create a container/folder with an existing slug`, async () => {

    //Set a 2-minute timeout
    test.setTimeout(120_000);

    await containerPage.getStarted();  
    const uniqueId = generateUniqueId();
    const folderTitle = `${containerPage.playwrightContainerTitle} ${uniqueId}`;
    const folderSlug = `${containerPage.playwrightContainerSlug}-${uniqueId}`
    await containerPage.createContainer(folderSlug, folderTitle);
    await expect(containerPage.alertMessage, 'The successful created container message is shown').toContainText(containerPage.createdContainerMessage);
    await expect(containerPage.alertMessage, 'The successful created container message is shown and references the correct title').toContainText(folderTitle);
    await expect(containerPage.getFolderSlug(folderSlug), 'The new Container is visible on the page').toBeVisible();
    
    //Now try again with the same slug, this should fail
    await containerPage.createContainer(folderSlug, folderTitle);
    await expect(containerPage.alertMessage, 'The duplicate path error message is shown').toContainText(containerPage.duplicateContainerMessage);

    //check number of containers with this slug is 1 i.e. a second one was not created
    await expect(containerPage.getFolderSlug(folderSlug), 'There is only 1 Container with the unique slug').toHaveCount(1);
  });

  test(`can create a container/folder without a title and title defaults to the slug, and create a child`, async ({page}) => {

    await containerPage.getStarted();

    const uniqueId = generateUniqueId();
    const folderSlug = `${containerPage.playwrightContainerSlug}-${uniqueId}`.toLowerCase();
    let folderSlugChild: string;
    let folderTitleChild: string;

    await test.step(`Can create the container without a slug`, async () => {
      
      await containerPage.createContainer(folderSlug, '');
      await expect(containerPage.alertMessage, 'The successful created container message is shown').toContainText(containerPage.createdContainerMessage);
      await expect(containerPage.alertMessage, 'The successful created container message is shown and references the correct title').toContainText(folderSlug.toLowerCase());
      await expect(containerPage.getFolderSlug(folderSlug.toLowerCase()).first(), 'The new Container is visible on the page').toBeVisible();
    });

    await test.step(`can create a child container`, async () => {

      const myContainerLink: Locator = containerPage.getFolderSlug(folderSlug.toLowerCase()).first();
      await expect(myContainerLink, 'Can see the Container on the page').toBeVisible();

      //Navigate into the new parent Container
      await myContainerLink.click();
      await containerPage.checkCorrectContainerTitle(folderSlug);

      //Create a child Container within the parent Container
      const uniqueIdChild = generateUniqueId();
      folderSlugChild = `${containerPage.playwrightContainerSlug}-${uniqueIdChild}`;
      folderTitleChild = `${containerPage.playwrightContainerTitle} ${uniqueIdChild}`;
      await containerPage.createContainer(folderSlugChild, folderTitleChild);

      //Check we are still within the correct 'parent' Container
      await containerPage.checkCorrectContainerTitle(folderSlug);
      await expect(containerPage.alertMessage, 'The successful created container message is shown').toContainText(containerPage.createdContainerMessage);
      await expect(containerPage.alertMessage, 'The successful created container message is shown and references the correct title').toContainText(folderTitleChild);
      await expect(containerPage.getFolderSlug(folderSlugChild), 'We can see the child Container on the page').toBeVisible();

      //Navigate into the child container
      await containerPage.getFolderSlug(folderSlugChild).click();
      await containerPage.checkCorrectContainerTitle(folderTitleChild);

    });

    await test.step(`delete the created containers`, async () => {

      //now delete the child container
      await containerPage.deleteContainerButton.click();
      await containerPage.confirmDeleteContainer.click();

      //Check we are back within the correct 'parent' Container
      await expect(containerPage.alertMessage, 'We see the successful deletion message').toContainText(`${folderSlugChild} deleted successfully`);
      await containerPage.checkCorrectContainerTitle(folderSlug);

      //Delete the parent container
      await containerPage.deleteContainerButton.click();
      await containerPage.confirmDeleteContainer.click();

      //Verify deleted
      await expect(containerPage.alertMessage).toContainText(`${folderSlug} deleted successfully`);

    });
  });
});


