import { ContainerPage } from './pages/ContainerPage';
import { checkDateIsWithinNumberOfSeconds, generateUniqueId} from '../helpers/helpers';
import { apiContext, test } from '../../fixture';
import {expect, Locator} from '@playwright/test';

test.describe('Container Tests', () => {

  let containerPage: ContainerPage;

  test.beforeEach('Set up POM', async ({ page }) => {
    containerPage = new ContainerPage(page);
  });

  //TODO with the new auto generation of the slug which strips invalid chars, this test needs removed or rewritten
  test.skip(`cannot create a container/folder without a properly formed slug`, async ({}) => {
    await containerPage.getStarted();  
    
    //Note passing title into slug here, which isn't properly formed as it's a Title not a slug
    await containerPage.createContainer(containerPage.playwrightContainerTitle, containerPage.playwrightContainerTitle);
    await expect(containerPage.alertMessage, 'The incorrect path format error message is shown').toHaveText(containerPage.incorrectPathFormatMessage);
    await expect(containerPage.getFolderTitle(containerPage.playwrightContainerTitle), 'We cannot see the Container on the page, because it was not created').not.toBeVisible();
  });

  //TODO with the new auto generation of the slug which strips invalid chars, this test needs removed or rewritten
  test.skip(`cannot create a container/folder with invalid characters in the path`, async ({}) => {
    await containerPage.getStarted();  

    for (let slug of containerPage.playwrightContainerInvalidSlugs){
      await containerPage.createContainer(slug, slug);
      await expect(containerPage.alertMessage, 'The incorrect path format error message is shown').toHaveText(containerPage.incorrectPathFormatMessage);
      await expect(containerPage.getFolderTitle(slug), 'We cannot see the Container on the page, because it was not created').not.toBeVisible();

    }
  });

  //Hopefully we will be able to spin up a clean environment for each run to avoid a glut
  //of data building up, as we cannot easily delete, because deletion on Fedora is not
  //straightforward
  test(`can create a container/folder with a properly formed slug and see the details displayed`, async ({page}) => {

    const uniqueId = generateUniqueId();
    const folderTitle = `${containerPage.playwrightContainerTitle} ${uniqueId}`;
    const folderSlug = `${containerPage.playwrightContainerSlug}-${uniqueId.toLowerCase()}`;
    let containerItem;

    await test.step(`Can create the container via the Front End`, async () => {
      await containerPage.getStarted();  
      await containerPage.createContainer(folderSlug, folderTitle);
      await expect(containerPage.alertMessage, 'The successful created container message is shown').toContainText(containerPage.createdContainerMessage);
      await expect(containerPage.alertMessage, 'The successful created container message is shown and references the correct title').toContainText(folderTitle);
      //TODO - note in the future if pagination is intricued we may not be on the page that
      //the container is on - address this once pagination/search/filtering/sorting introduced
      //by sorting on created desc e.g.
      await expect(containerPage.getFolderTitle(folderTitle), 'The new Container is visible on the page').toBeVisible();
    });

    await test.step(`API contains all the expected fields`, async () => {

      const containerResponse = await apiContext.get(`${containerPage.navigationPage.baseAPIPath}${folderSlug.toLowerCase()}`);
      const body = await containerResponse.body();
      containerItem = JSON.parse(body.toString('utf-8'));

      //type matches Container
      expect(containerItem.type, 'Type is set to Container').toEqual('Container');

      //id matches what we sent in the get
      expect(containerItem.id, 'ID matches').toEqual(expect.stringContaining(`${containerPage.navigationPage.baseAPIPath}${folderSlug.toLowerCase()}`));
      //name matches the title
      expect(containerItem.name, 'Name is set to the correct Title').toEqual(folderTitle);

      //the containers element is empty
      expect(containerItem.containers, 'Containers is empty').toHaveLength(0);

      //the binaries element is empty
      expect(containerItem.binaries, 'Binaries is empty').toHaveLength(0);

      //TODO Speak to Tom about these timestamps being out
      //created date is within last few seconds
      checkDateIsWithinNumberOfSeconds(containerItem.created, 10_000);

      //lastmodified is within the last few seconds
      checkDateIsWithinNumberOfSeconds(containerItem.lastModified, 30_000);

      //check that the created ad modified dates match
      expect(containerItem.lastModified, 'Created and Modified dates match').toEqual(containerItem.created);

      //createdBy and modifiedBy match containerPage.createdBy
      expect(containerItem.createdBy, 'Correct value in createdBy').toEqual(expect.stringContaining(containerPage.createdBy));
      expect(containerItem.lastModifiedBy, 'Correct value in modifiedBy').toEqual(expect.stringContaining(containerPage.createdBy));
    });

    await test.step('Table headers are displayed as expected', async () => {
      //TODO - modify to use Tom's aria-labels once deployed
      
    });

    await test.step('Verify correct columns shown with the correct data', async () => {

      //TODO - note in the future if pagination is introduced we may not be on the page that
      //the container is on - address this once pagination/search/filtering/sorting introduced
      //by sorting on created desc e.g.
      //TODO - modify to use Tom's aria-labels once deployed
      const  newContainerRow: Locator = containerPage.containerTableRow.filter({has: page.getByRole('link', {name: folderTitle})});
      await expect(newContainerRow).toBeVisible();
      await expect(newContainerRow.locator(page.getByRole('cell')).nth(1)).toContainText(folderSlug.toLowerCase());

      //Check the API elements are displayed as expected
      await expect(newContainerRow.locator(page.getByRole('cell')).nth(1)).toContainText(folderSlug.toLowerCase());
      await expect(newContainerRow.locator(page.getByRole('cell')).nth(2)).toContainText(containerItem.name);

      const displayedModifiedDate = await newContainerRow.locator(page.getByRole('cell')).nth(3).textContent();
      expect(containerItem.lastModified).toEqual(expect.stringContaining(displayedModifiedDate?.substring(0,9)!));

      const displayedModifiedBy = await newContainerRow.locator(page.getByRole('cell')).nth(4).textContent();
      expect(containerItem.lastModifiedBy).toEqual(expect.stringContaining(displayedModifiedBy!));

      const displayedCreatedDate = await newContainerRow.locator(page.getByRole('cell')).nth(5).textContent();
      expect(containerItem.created).toEqual(expect.stringContaining(displayedCreatedDate?.substring(0,9)!));

      const displayedCreatedBy = await newContainerRow.locator(page.getByRole('cell')).nth(6).textContent();
      expect(containerItem.createdBy).toEqual(expect.stringContaining(displayedCreatedBy!));

    });
  });

  test(`cannot create a container/folder with an existing slug`, async ({}) => {

    await containerPage.getStarted();  
    const uniqueId = generateUniqueId();
    const folderTitle = `${containerPage.playwrightContainerTitle} ${uniqueId}`;
    const folderSlug = `${containerPage.playwrightContainerSlug}-${uniqueId}`
    await containerPage.createContainer(folderSlug, folderTitle);
    await expect(containerPage.alertMessage, 'The successful created container message is shown').toContainText(containerPage.createdContainerMessage);
    await expect(containerPage.alertMessage, 'The successful created container message is shown and references the correct title').toContainText(folderTitle);
    await expect(containerPage.getFolderTitle(folderTitle), 'The new Container is visible on the page').toBeVisible();
    
    //Now try again with the same slug, this should fail
    await containerPage.createContainer(folderSlug, folderTitle);
    await expect(containerPage.alertMessage, 'The duplicate path error message is shown').toContainText(containerPage.duplicateContainerMessage);

    //TODO check count is 1
  });

  test(`can create a container/folder without a title and title defaults to the slug, and create a child`, async ({}) => {

    await containerPage.getStarted();

    const uniqueId = generateUniqueId();
    const folderSlug = `${containerPage.playwrightContainerSlug}-${uniqueId}`.toLowerCase();

    await test.step(`Can create the container without a slug`, async () => {
      
      await containerPage.createContainer(folderSlug, '');
      await expect(containerPage.alertMessage, 'The successful created container message is shown').toContainText(containerPage.createdContainerMessage);
      await expect(containerPage.alertMessage, 'The successful created container message is shown and references the correct title').toContainText(folderSlug.toLowerCase());
      await expect(containerPage.getFolderTitle(folderSlug.toLowerCase()), 'The new Container is visible on the page').toBeVisible();
    });

    await test.step(`can create a child container`, async () => {

      const myContainerLink: Locator = containerPage.getFolderTitle(folderSlug.toLowerCase());
      await expect(myContainerLink, 'Can see the Container on the page').toBeVisible();
  
      //Navigate into the new parent Container
      await myContainerLink.click();
      await containerPage.checkCorrectContainerTitle(folderSlug);

      //Create a child Container within the parent Container
      const uniqueIdChild = generateUniqueId();
      const folderSlugChild = `${containerPage.playwrightContainerSlug}-${uniqueIdChild}`;
      const folderTitleChild = `${containerPage.playwrightContainerTitle} ${uniqueIdChild}`;
      await containerPage.createContainer(folderSlugChild, folderTitleChild);
  
      //Check we are still within the correct 'parent' Container
      await containerPage.checkCorrectContainerTitle(folderSlug);
      await expect(containerPage.alertMessage, 'The successful created container message is shown').toContainText(containerPage.createdContainerMessage);
      await expect(containerPage.alertMessage, 'The successful created container message is shown and references the correct title').toContainText(folderTitleChild);
      await expect(containerPage.getFolderTitle(folderTitleChild), 'We can see the child Container on the page').toBeVisible();

    });

    //TODO Navigate to Fedora and delete the new Container?
    //Or Tom provide API to do this

  });

  

});


