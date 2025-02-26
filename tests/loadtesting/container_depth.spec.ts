import { ContainerPage } from '../containerflows/pages/ContainerPage';
import { generateUniqueId} from '../helpers/helpers';
import { test } from '../../fixture';
import {expect, Locator} from '@playwright/test';

test.describe('Load Container Tests', () => {

  let containerPage: ContainerPage;

  test.beforeEach('Set up POM', async ({ page }) => {
    containerPage = new ContainerPage(page);
  });

  test(`Load test creating a large folder structure`, async ({page}) => {

    test.setTimeout(33_300_000);
    const uniqueId = generateUniqueId();
    const folderSlug = `${containerPage.playwrightContainerSlug}-${uniqueId}`.toLowerCase();
    const folderDepth =  2;   // Depth of the folders
    const folderBreadth = 2;  // Number of folders in container/folder
    let folderSlugChild: string;
    let folderTitleChild: string;
    let uniqueIdChild: string;
    let folderCount : number = 0;

    await test.step(`Create the parent Container for the load test`, async () => {
      await containerPage.getStarted();
      await containerPage.createContainer(folderSlug, '');
      await expect(containerPage.getFolderSlug(folderSlug.toLowerCase()), 'The new Container is visible on the page').toBeVisible();
    });

    await test.step(`Create the child containers`, async () => {

      const myContainerLink: Locator = containerPage.getFolderSlug(folderSlug.toLowerCase());

      //Navigate into the new parent Container
      await myContainerLink.click();
      await containerPage.checkCorrectContainerTitle(folderSlug);

      uniqueIdChild  = generateUniqueId();
      folderSlugChild = `${uniqueIdChild}`;
      folderTitleChild = `${uniqueIdChild}`;
      
      console.log(`folderSlugChild: ${folderSlugChild}`);

      // Create folders 1-2-3
      for(let d = 1; d <= folderDepth; d++){
          
        if (d > 1){
         const link: Locator = containerPage.getFolderSlug(folderSlug.toLowerCase());
         await link.click();
        }

        const folderLevelOneSlug : string = `${folderSlugChild}-${d}`;
        const folderLevelOneTitle : string = `${folderTitleChild} ${d}`;

        console.log(`Folder Count: ${++folderCount} SlugPath 1: ${folderLevelOneSlug}`);

        await containerPage.createContainer(folderLevelOneSlug, folderLevelOneTitle);

        for(let d2 = 1; d2 <= folderDepth; d2++) {

          if (d2 > 1 ){
            await containerPage.getBreadCrumbSlug(folderLevelOneSlug).click();
          }else{
            //const myContainerLink: Locator = containerPage.getFolderSlug(folderLevelOneSlug.toLowerCase());
            await containerPage.getFolderSlug(folderLevelOneSlug).click();
          }

          await containerPage.checkCorrectContainerTitle(folderLevelOneTitle);

          const folderLevelTwoSlug : string = `${folderLevelOneSlug}-${d2}`;
          const folderLevelTwoTitle : string = `${folderLevelOneTitle} ${d2}`;

          console.log(`Folder Count: ${++folderCount}  SlugPath 2: ${folderLevelOneSlug} -->  ${folderLevelTwoSlug}`);

          await containerPage.createContainer(folderLevelTwoSlug, folderLevelTwoTitle);
          await containerPage.getFolderSlug(folderLevelTwoSlug).click();

          for(let b =1; b <= folderBreadth; b++ ){
            const folderLevelThreeSlug : string = `${folderLevelTwoSlug}-${b}`;
            const folderLevelThreeTitle : string = `${folderLevelTwoTitle} ${b}`;

            console.log(`Folder Count: ${++folderCount}  SlugPath 3: ${folderLevelOneSlug} -->  ${folderLevelTwoSlug} -->  ${folderLevelThreeSlug}`);

            await containerPage.createContainer(folderLevelThreeSlug, folderLevelThreeTitle);
          }
        }
      }
    });


    await test.step(`delete the created containers/folders`, async () => {

      const myContainerLink: Locator = containerPage.getFolderSlug(folderSlug.toLowerCase());
      await expect(myContainerLink, 'Can see the Container on the page').toBeVisible();

      //Navigate into the new parent Container
      await myContainerLink.click();
      await containerPage.checkCorrectContainerTitle(folderSlug);

      folderSlugChild = `${uniqueIdChild}`;
      folderTitleChild = `${uniqueIdChild}`;

      console.log(`folderSlugChild: ${folderSlugChild}`);

      // Need to Delete them in reverse order as only empty folders can be deleted
      for(let d = 1; d <= folderDepth; d++  )  {
        let folderLevelOneSlug : string = `${folderSlugChild}-${d}`;
        let folderLevelOneTitle : string = `${folderTitleChild} ${d}`;

        const myContainerLink: Locator = containerPage.getFolderSlug(folderLevelOneSlug.toLowerCase());
        await myContainerLink.click();

        console.log(`SlugPath 1: ${folderLevelOneSlug}`);

        for(let d2 = 1; d2 <= folderDepth; d2++) {

          let folderLevelTwoSlug : string = `${folderLevelOneSlug}-${d2}`;
          let folderLevelTwoTitle : string = `${folderLevelOneTitle} ${d2}`;

          console.log(`SlugPath 2: ${folderLevelOneSlug} -->  ${folderLevelTwoSlug} `);

          //const myContainerLink: Locator = containerPage.getFolderSlug(folderLevelTwoSlug.toLowerCase());
          await containerPage.getFolderSlug(folderLevelTwoSlug).click();

          for(let b =1; b <= folderBreadth; b++ ){
            let folderLevelThreeSlug : string = `${folderLevelTwoSlug}-${b}`;
            let folderLevelThreeTitle : string = `${folderLevelTwoTitle} ${b}`;

            console.log(`SlugPath 3: ${folderLevelOneSlug} -->  ${folderLevelTwoSlug} -->  ${folderLevelThreeSlug}`);

            // Delete Level 3
            //const myContainerLink: Locator = containerPage.getFolderSlug(folderLevelThreeSlug.toLowerCase());
            await containerPage.getFolderSlug(folderLevelThreeSlug).click();

            //now delete the child container
            console.log(`Deleting 3 : ${folderLevelThreeSlug} `);
            await deleteTheContainer();
          }

          // Delete Level 2
          console.log(`Deleting 2 : ${folderLevelTwoSlug} `);
          await deleteTheContainer();
        }

        //Delete Level 1
        await deleteTheContainer();
        }
      
      //Delete the parent container
      await deleteTheContainer();

      //Verify deleted
      await expect(containerPage.alertMessage).toContainText(`${folderSlug} deleted successfully`);
    });
  });

  async function deleteTheContainer(){
    await containerPage.deleteContainerButton.click();
    await containerPage.confirmDeleteContainer.click();
  }
});
