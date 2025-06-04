import { expect} from '@playwright/test';
import { presentationApiContext, test } from '../../fixture';

test('view-repository-root', async ({page}) => {

  test.setTimeout(4000_000);
  let rootReq = await presentationApiContext.get('/repository');
  expect(rootReq.ok()).toBeTruthy();

  const root = await rootReq.json();
  expect(root).toEqual(expect.objectContaining({
    "id": expect.stringContaining('/repository/'), //Why not @id anymore?
    type: expect.stringMatching('RepositoryRoot') //Why not Container any more?
  }));

  await page.waitForTimeout(3_800_000);
  rootReq = await presentationApiContext.get('/repository');
  expect(rootReq.ok()).toBeTruthy();
});
