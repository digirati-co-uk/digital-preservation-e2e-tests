import {expect} from "@playwright/test";
import {test} from '../../fixture';
import {ArchivalGroupPage} from "./pages/ArchivalGroupPage";
import {IIIFBuilderPage} from "./pages/IIIFBuilderPage";

test.describe('IIIF Builder End To End Tests', () => {

  let archivalGroupPage: ArchivalGroupPage;
  let iiifBuilderPage: IIIFBuilderPage;

  test.beforeEach('Set up POM', async ({ page }) => {
    archivalGroupPage = new ArchivalGroupPage(page);
    iiifBuilderPage = new IIIFBuilderPage(page);
  });

  test(`Can create a Deposit using an EMU Id @api`, async ({page}) => {

    //This test will create a Deposit from a test EMU Id, upload
    //some files to that Deposit via AWS, and sync the Deposit via the UI.
    //We then check that we could create an Archival group from that Deposit, and
    //the correct files would be added. We do NOT create the archival group,
    //as we would no longer be able to create a new Deposit with this ID after that,
    //and this test would fail.

    //Set a 2-minute timeout
    test.setTimeout(120_000);

    //We then go on to test that METS population works when files are added directly to the Deposit
    let depositURL: string;

    await test.step('Create Deposit with a VALID IRN PID', async() => {

      //TODO test an invalid PID

      //Enter valid PID
      await archivalGroupPage.depositPage.getStarted();
      await archivalGroupPage.depositPage.navigationPage.depositMenuOption.click();
      await archivalGroupPage.depositPage.newDepositButton.click();
      await archivalGroupPage.depositPage.objectIdentifier.fill(iiifBuilderPage.irnForDeposit);
      await archivalGroupPage.depositPage.modalCreateNewDepositButton.click();

      //Validate that we're navigated into the new Deposit
      depositURL = page.url();
      await expect(page, 'We have been navigated into the new Deposit page').toHaveURL(archivalGroupPage.depositPage.depositsURL);
      await expect(page.getByRole('heading', {name: iiifBuilderPage.irnForDepositHeading}), 'The slug is listed in the deposit title').toBeVisible();

      //TODO Test the other fields are set correctly
    });

    await test.step('Create some files directly in the AWS bucket for the Deposit', async() => {
      let files = [
        `${archivalGroupPage.depositPage.newTestFolderSlug}/${archivalGroupPage.depositPage.testImageLocation}`,
        `${archivalGroupPage.depositPage.newTestFolderSlug}/${archivalGroupPage.depositPage.testWordDocLocation}`,
        `${archivalGroupPage.depositPage.newTestFolderSlug}/${archivalGroupPage.depositPage.testPdfDocLocation}`,
      ];
      await archivalGroupPage.depositPage.uploadFilesToDepositS3Bucket(files, depositURL, 'test-data/deposit/',true, true);

      //Verify the files are there in the UI
      await page.goto(depositURL);
      await archivalGroupPage.depositPage.actionsMenu.click();
      await archivalGroupPage.depositPage.refreshStorageButton.click();
      await expect(archivalGroupPage.depositPage.newTestImageFileInTable, 'We see the new file in the Deposits table').toBeVisible();
      await expect(archivalGroupPage.depositPage.newTestWordFileInTable, 'We see the new file in the Deposits table').toBeVisible();
      await expect(archivalGroupPage.depositPage.newTestPdfFileInTable, 'We see the new file in the Deposits table').toBeVisible();
    });

    await test.step('Check that we can now run an import job', async() => {
      await archivalGroupPage.depositPage.createDiffImportJobButton.click();
      //Check the 3 files are in the list, plus the METS file
      await expect(archivalGroupPage.diffBinariesToAdd.getByRole('listitem'), 'There are only 4 items in the Binaries to add').toHaveCount(4);
      await expect.soft(archivalGroupPage.diffBinariesToAdd, 'Failing due to BUG 103922: First test file to add is correct').toContainText(archivalGroupPage.depositPage.testImageLocation);
      await expect(archivalGroupPage.diffBinariesToAdd, 'Second test file to add is correct').toContainText(archivalGroupPage.depositPage.testWordDocLocation);
      await expect(archivalGroupPage.diffBinariesToAdd, 'Third test file to add is correct').toContainText(archivalGroupPage.depositPage.testPdfDocLocation);
      await expect(archivalGroupPage.diffBinariesToAdd, 'Mets file to add is correct').toContainText(archivalGroupPage.depositPage.metsFileName);
      await expect(archivalGroupPage.depositPage.runImportButton, 'We can now see the button to run the Import').toBeVisible();
      await page.goBack();
    });

    await test.step('Tidy up and delete the deposit', async() => {
      //Navigate back into the first deposit in order to delete it
      await page.goto(depositURL);
      //Tidy up
      await archivalGroupPage.depositPage.deleteTheCurrentDeposit();
    });
  });

  test(`Can create a further deposit for an EMU Id, and see the changes reflected in the IIIF Manifest`, async ({page, context}) => {

    //This test looks for a specific archival group, previously created using one
    //of the test PIDs. We can then create a further deposit from that Archival Group,
    //make a change to that Deposit and preserve. This will then ensure a message
    //is published to each activity stream, and the IIIF Builder should consume that
    //and ultimately replublish the Manifest.

    //On alternate runs we either add of remove the jpg from the Manifest, and we
    //check that the published Manifest has the image, or it's been removed, as appropriate.

    //Set a 10-minute timeout, as we need to wait for the IIIF Builder and DLCS to do their parts
    test.setTimeout(600_000);
    let removedJpg : boolean = false;

    await test.step('Create a further deposit from the archival group', async() => {
      //Create a New Deposit within an existing Archival Group
      await archivalGroupPage.createDepositFromArchivalGroup(iiifBuilderPage.fullPathOfIRN, true);

      //Initially the page will contain a message stating that it is exporting files to the Deposit.
      //Need to pause then refresh to load the files
      await expect(archivalGroupPage.depositPage.alertMessage).toContainText('The server is currently exporting files into this Deposit');
      await page.waitForTimeout(3_000);
      await page.reload();

    });

    await test.step('Add or delete the image file', async() => {
      if (await archivalGroupPage.depositPage.newTestImageFileInTable.isVisible()) {
        //Delete the file
        await archivalGroupPage.depositPage.deleteFile(archivalGroupPage.depositPage.newTestImageFileInTable, archivalGroupPage.depositPage.testImageLocation);
        removedJpg = true;
      } else {
        //Add the file
        await archivalGroupPage.depositPage.uploadFile(archivalGroupPage.depositPage.testFileLocation+archivalGroupPage.depositPage.testImageLocation, false, archivalGroupPage.depositPage.uploadFileToTestFolder);
        await expect(archivalGroupPage.depositPage.newTestImageFileInTable, 'We see the new file in the Deposits table').toBeVisible();
      }
    });

    await test.step('Create and run the diff import job', async() => {

      await archivalGroupPage.depositPage.createDiffImportJobButton.click();
      await archivalGroupPage.runImportPreserveButton.click();

      //Wait for the job to change to completed
      await archivalGroupPage.allowJobToComplete();

      //Follow the archival group link
      await archivalGroupPage.diffArchivalGroupLink.click();
      await expect(iiifBuilderPage.archivalGroupHeader).toBeVisible();
      await expect(page, 'The URL is correct').toHaveURL(iiifBuilderPage.fullPathOfIRN);
    });

    await test.step('Open the IIIF Viewer and JSON and verify the change has been made', async() => {

      //open the iiif viewer link
      const pagePromise = context.waitForEvent('page');
      await archivalGroupPage.iiifButton.click();
      const iiifViewerTab = await pagePromise;
      await iiifViewerTab.waitForLoadState();
      const iiifPagePromise  = context.waitForEvent('page');

      //Click to open the raw IIIF JSON
      await iiifViewerTab.getByRole('link', {name: iiifBuilderPage.iiifManifestLink}).click();
      const iiifTab = await iiifPagePromise;
      await iiifTab.waitForLoadState();

      //Get the JSON from the page
      let jsonBody: any = JSON.parse(await iiifTab.innerText('pre'));

      //check id, type and number of canvases is correct
      expect(jsonBody.id, 'Manifest has the correct ID').toContain(iiifBuilderPage.irnForArchivalGroup);
      expect(jsonBody.type, 'Manifest has the correct Type').toEqual('Manifest');

      // We need to sleep/refresh here until the iiif Publisher has done it's thing
      // and we hit the right number of canvases
      if(removedJpg) {
        jsonBody = await iiifBuilderPage.refreshTheManifestJSON(iiifTab, 3);
        expect(jsonBody.items, 'Manifest has the correct number of canvas items').toHaveLength(3);
      }else{
        jsonBody = await iiifBuilderPage.refreshTheManifestJSON(iiifTab, 4);
        expect(jsonBody.items, 'Manifest has the correct number of canvas items').toHaveLength(4);
      }

      //92023 Rewrite Rules testing
      //Check that all of the URLs are the rewritten Leeds domain URLs
      const domain: string = process.env.LEEDS_DOMAIN;
      const dlcsDomain: string = `${process.env.PRESERVATION_API_ENDPOINT_NOT_REWRITTEN}/${process.env.LEEDS_DLCS_CUSTOMER}`;
      expect(jsonBody.id, 'Manifest ID is correct').toEqual(`${domain}/presentation/cc/${iiifBuilderPage.irnForArchivalGroup}`);
      await checkManifestBodyRewritten(jsonBody, domain);

      //Check that the non rewritten DLCS endpoint is not referenced anywhere
      let jsonAsString = JSON.stringify(jsonBody);
      expect(jsonAsString, 'There are no references to the DLCS domain').not.toEqual(expect.stringContaining(dlcsDomain));

      //Now open a page with the non Leeds (i.e. dlcs) domain URL, check the id is the non-rewritten, but
      //everything else is the rewritten URLs
      await page.goto(`${dlcsDomain}/cc/${iiifBuilderPage.irnForArchivalGroup}`);
      await page.waitForLoadState();

      //Get the JSON from the page
      jsonBody = JSON.parse(await page.innerText('pre'));
      expect(jsonBody.id, 'Manifest ID is correct').toEqual(`${dlcsDomain}/cc/${iiifBuilderPage.irnForArchivalGroup}`);
      await checkManifestBodyRewritten(jsonBody, domain);

      //Replace the DLCS URL in the initial ID paramter with blank, and then check no further occurrences
      jsonAsString = JSON.stringify(jsonBody);
      jsonAsString = jsonAsString.replace(dlcsDomain, '');
      expect(jsonAsString, 'There are no references to the DLCS domain').not.toEqual(expect.stringContaining(dlcsDomain));

      //Tidy up
      await iiifTab.close();
      await iiifViewerTab.close();

    });

    async function checkManifestBodyRewritten(jsonBody : any, domain: string){
      //Check each item in the items array
      for(let canvas of jsonBody.items) {
        expect(canvas.id, 'Canvas ID is correct').toEqual(expect.stringContaining(`${domain}/canvases`));

        //NOT ALL ITEMS HAVE THUMBNAILS
        if (canvas.thumbnail != null) {
          for (let thumbnail of canvas.thumbnail) {
            expect(thumbnail.id, 'Thumbnail Id is correct').toEqual(expect.stringContaining(`${domain}/thumbs`));
            expect(thumbnail.service[0]["@id"], 'Thumbnail Image Service ID is correct').toEqual(expect.stringContaining(`${domain}/thumbs/v2`));
            expect(thumbnail.service[1].id, 'Thumbnail Image Service ID is correct').toEqual(expect.stringContaining(`${domain}/thumbs`));
          }
        }

        for(let annotationPage of canvas.items) {
          expect(annotationPage.id, 'Annotation Page ID is correct').toEqual(expect.stringContaining(`${domain}/canvases`));
          for(let annotation of annotationPage.items) {
            expect(annotation.id, 'Annotation Id is correct').toEqual(expect.stringContaining(`${domain}/canvases`));
            expect(annotation.body.id, 'Annotation Body Id is correct').toEqual(expect.stringContaining(`${domain}/`));
            expect(annotation.target, 'Annotation Target is correct').toEqual(expect.stringContaining(`${domain}/canvases`));
            if (annotation.body.service != null) {
              expect(annotation.body.service[0]["@id"], 'Annotation Body Image Service ID is correct').toEqual(expect.stringContaining(`${domain}/image/v2`));
              expect(annotation.body.service[1].id, 'Annotation Body Image Service ID is correct').toEqual(expect.stringContaining(`${domain}/image`));
            }
          }
        }
      }
    }
  });

});