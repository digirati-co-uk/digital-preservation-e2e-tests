import {Locator, Page} from '@playwright/test';


export class IIIFBuilderPage {
  readonly page: Page;
  readonly irnForArchivalGroup : string;
  readonly irnForDeposit : string;
  readonly irnForDepositHeading : string;
  readonly iiifManifestLink : string;
  readonly fullPathOfIRN: string;
  readonly archivalGroupHeader: Locator;

  constructor(page: Page) {
    this.page = page;
    this.irnForArchivalGroup = 'c54x355t';
    this.irnForDeposit = '1000002';
    this.irnForDepositHeading = 'UAT Test 2';
    this.iiifManifestLink = 'IIIF Manifest Link';
    this.fullPathOfIRN = `/browse/cc/${this.irnForArchivalGroup}`;
    this.archivalGroupHeader = this.page.getByRole('heading', {name: 'UAT Test 8'});

  }
  async refreshTheManifestJSON(page : Page, expectedItems: number){
    let jsonBody = JSON.parse(await page.innerText('pre'));
    while (jsonBody.items.length!=expectedItems){
      //Wait 30 secs - it can take a while for the IIIF Builder to do it's thing
      await page.waitForTimeout(30_000);
      await page.reload();
      //Get the JSON from the page
      jsonBody = JSON.parse(await page.innerText('pre'));
    }
    return jsonBody;
  }

}