import {test, expect} from '@playwright/test';

test('view-repository-root', async ({request}) => {
  const rootReq = await request.get('/repository');
  expect(rootReq.ok()).toBeTruthy();

  const root = await rootReq.json();
  expect(root).toEqual(expect.objectContaining({
    "id": expect.stringContaining('/repository/'), //Why not @id anymore?
    type: expect.stringMatching('RepositoryRoot') //Why not Container any more?
  }));
});