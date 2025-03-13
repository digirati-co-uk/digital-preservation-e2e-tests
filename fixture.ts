import { test as base } from '@playwright/test';

export let apiContext;

export const test = base.extend<{}, { forEachWorker: void }>({
  forEachWorker: [async ({playwright}, use) => {
    // This code runs before all the tests in the worker process.

    apiContext = await playwright.request.newContext({
        // All requests we send go to this API endpoint.
        baseURL: `${process.env.PRESERVATION_API_ENDPOINT!}`,
    });

    await use();

    // This code runs after all the tests in the worker process.
    await apiContext.dispose();
  }, { scope: 'worker', auto: true }],  // automatically starts for every worker.
});




