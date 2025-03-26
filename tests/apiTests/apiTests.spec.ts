import { expect, request} from '@playwright/test';
import { apiContext, test } from '../../fixture';

//THESE SHOULD NOT BE RUN, THEY ARE POC / WIP

test(`view the preservation activity stream`, async ({request}) => {
  let streamReq = await apiContext.get('/activity/archivalgroups/collection');
  expect(streamReq.ok()).toBeTruthy();

  //https://storage-dev.dlip.digirati.io/activity/importjobs/collection

  const activityStream = await streamReq.json();
  expect(activityStream).toEqual(expect.objectContaining({
    "id": expect.stringContaining('/activity/archivalgroups'),
    type: expect.stringMatching('OrderedCollection')
  }));

  let lastPage = activityStream.last;
  while (lastPage != null) {
    let lastPageId :string = lastPage.id;
    lastPageId = lastPageId.replace(process.env.PRESERVATION_API_ENDPOINT, '');
    let pageReq = await apiContext.get(lastPageId);
    expect(pageReq.ok()).toBeTruthy();

    const pageStream = await pageReq.json();
    console.log(pageStream.orderedItems);
    // {
    //   type: 'Create',
    //     object: {
    //   id: 'https://preservation-dev.dlip.digirati.io/repository/_for_testing/playwright-testing/playwright-valid-slug-abcdceoyh0',
    //     type: 'ArchivalGroup',
    //     seeAlso: [Array]
    // },
    //   endTime: '2025-03-18T14:33:52.645896Z'
    // }
    lastPage = pageStream.prev;

  }
});

test('view-repository-root', async ({page}) => {

  test.setTimeout(4000_000);
  let rootReq = await apiContext.get('/repository');
  expect(rootReq.ok()).toBeTruthy();

  const root = await rootReq.json();
  expect(root).toEqual(expect.objectContaining({
    "id": expect.stringContaining('/repository/'), //Why not @id anymore?
    type: expect.stringMatching('RepositoryRoot') //Why not Container any more?
  }));

  for (let i=0; i<(1500); i++){
    await page.waitForTimeout(3_000);
    rootReq = await apiContext.get('/repository');
    expect(rootReq.ok()).toBeTruthy();
    console.log('Still alive '+i);
  }

  rootReq = await apiContext.get('/repository');
  expect(rootReq.ok()).toBeTruthy();
});

