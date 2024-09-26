import { expect } from '@playwright/test';
import { ContainerPages } from './pages/ContainerPages';
import { generateUniqueId } from '../helpers/helpers';
import { apiContext, test } from '../../fixture';

test.describe('Create Container Tests', () => {

  let containerPage: ContainerPages;

  test.beforeEach('Set up POM', async ({ page }) => {
    containerPage = new ContainerPages(page);    
  });

  test(`cannot create a container/folder without a properly formed slug`, async () => {
    await containerPage.goto();
    await containerPage.getStarted();  
    
    await containerPage.newFolderButton.click();
    //Note passing title into slug here, which isn't properly formed as it's a Title not a slug
    await containerPage.folderPathNameInput.fill(containerPage.playwrightContainerTitle);
    await containerPage.folderPathTitleInput.fill(containerPage.playwrightContainerTitle);
    await containerPage.createNewFolderConfirmationButton.click();
    await expect(containerPage.alertMessage, 'The incorrect path format error message is shown').toHaveText(containerPage.incorrectPathFormatMessage);
  });

  test(`cannot create a container/folder with invalid characters in the path`, async () => {
    await containerPage.goto();
    await containerPage.getStarted();  

    for (var slug of containerPage.playwrightContainerInvalidSlugs){
      await containerPage.newFolderButton.click();
      await containerPage.folderPathNameInput.fill(slug);
      await containerPage.folderPathTitleInput.fill(slug);
      await containerPage.createNewFolderConfirmationButton.click();
      await expect(containerPage.alertMessage, 'The incorrect path format error message is shown').toHaveText(containerPage.incorrectPathFormatMessage);
    }
  });

  //Hopefully Gary
  //will be able to spin up a clean environment for each run to avoid a glut
  //of data building up. We cannot easily delete, because deletion on Fedora is not 
  //straightforward
  test(`can create a container/folder with a properly formed slug`, async ({request}) => {

    const uniqueId = generateUniqueId();
    const folderTitle = `${containerPage.playwrightContainerTitle} ${uniqueId}`;
    const folderSlug = `${containerPage.playwrightContainerSlug}-${uniqueId}`;

    await test.step(`Can create the container via the Front End`, async () => {
      await containerPage.goto();
      await containerPage.getStarted();  
      await containerPage.newFolderButton.click();
      await containerPage.folderPathNameInput.fill(folderSlug);
      await containerPage.folderPathTitleInput.fill(folderTitle);
      await containerPage.createNewFolderConfirmationButton.click();
      await expect(containerPage.alertMessage, 'The successful created container message is shown').toContainText(containerPage.createdContainerMessage);
      await expect(containerPage.alertMessage, 'The successful created container message is shown and references the correct title').toContainText(folderTitle);
    });

    await test.step(`API contains all the expected fields`, async () => {
      
      const containerResponse = await apiContext.get(`${containerPage.baseAPIPath}${folderSlug.toLowerCase()}`);
      let body = await containerResponse.body();
      let containerItem = JSON.parse(body.toString('utf-8'));

      //type matches Container
      expect(containerItem.type).toEqual('Container');

      //id matches what we sent in the get
      expect(containerItem.id).toEqual(expect.stringContaining(`${containerPage.baseAPIPath}${folderSlug.toLowerCase()}`));
      //name matches the title
      expect(containerItem.name).toEqual(folderTitle);

      //containers is empty
      expect(containerItem.containers).toHaveLength(0);

      //binaries is empty
      expect(containerItem.binaries).toHaveLength(0);

      //created date is within last few seconds
      const now = new Date();
      const createdDate = new Date(containerItem.created);
      expect(createdDate < now ).toBeTruthy();

      //Add 3 seconds to createdDate
      const createdDatePlus = new Date(createdDate.getTime() + 3000);
      expect(createdDatePlus < now ).toBeFalsy();

      //lastmodified is within the last few seconds
      const modifiedDate = new Date(containerItem.lastModified);
      expect(modifiedDate < now ).toBeTruthy();

      //Add 3 seconds to modifiedDate
      const modifiedDatePlus = new Date(modifiedDate.getTime() + 3000);
      expect(modifiedDatePlus < now ).toBeFalsy();

      //check that the created ad modified dates match
      expect(containerItem.lastModified).toEqual(containerItem.created);

      //createdBy and modifiedBy match containerPage.createdBy
      expect(containerItem.createdBy).toEqual(expect.stringContaining(containerPage.createdBy));
      expect(containerItem.lastModifiedBy).toEqual(expect.stringContaining(containerPage.createdBy));
    });
  });

  //TODO unskip - fails just now because YOU CAN do this, Tom is working on this
  test.skip(`cannot create a container/folder with an existing slug`, async () => {

    await containerPage.goto();
    await containerPage.getStarted();  
    await containerPage.newFolderButton.click();
    const uniqueId = generateUniqueId();
    const folderTitle = `${containerPage.playwrightContainerTitle} ${uniqueId}`;
    const folderSlug = `${containerPage.playwrightContainerSlug}-${uniqueId}`
    await containerPage.folderPathNameInput.fill(folderSlug);
    await containerPage.folderPathTitleInput.fill(folderTitle);
    await containerPage.createNewFolderConfirmationButton.click();
    await expect(containerPage.alertMessage, 'The successful created container message is shown').toContainText(containerPage.createdContainerMessage);
    await expect(containerPage.alertMessage, 'The successful created container message is shown and references the correct title').toContainText(folderTitle);

    //Now try again with the same slug
    await containerPage.newFolderButton.click();
    await containerPage.folderPathNameInput.fill(folderSlug);
    await containerPage.folderPathTitleInput.fill(folderTitle);
    await containerPage.createNewFolderConfirmationButton.click();
    await expect(containerPage.alertMessage, 'The duplicate path error message is shown').toContainText(containerPage.duplicateContainerMessage);
  });

  test.skip(`can create a container/folder without a title and title defaults to the slug`, async ({page}) => {

    await containerPage.goto();
    await containerPage.getStarted();  
    await containerPage.newFolderButton.click();
    const uniqueId = generateUniqueId();
    const folderSlug = `${containerPage.playwrightContainerSlug}-${uniqueId}`;
    await containerPage.folderPathNameInput.fill(folderSlug);
    await containerPage.createNewFolderConfirmationButton.click();
    await expect(containerPage.alertMessage, 'The successful created container message is shown').toContainText(containerPage.createdContainerMessage);
    await expect(containerPage.alertMessage, 'The successful created container message is shown and references the correct title').toContainText(folderSlug.toLowerCase());
    await expect(page.getByRole('link', {name: folderSlug})).toBeVisible();

  });


  //TODO as part of Tom's next ticket, navigation, I will click into thefolders that have been created, and verify 
  //the page displays correctly. Given the number of UI elements that may change between now and then
  //it's not worth writing the tests yet.





});


