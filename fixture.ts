import { test as base } from '@playwright/test';
import {
  AuthenticationResult,
  AuthorizationCodeRequest,
  ClientCredentialRequest,
  ConfidentialClientApplication
} from "@azure/msal-node";
export let apiContext;

export const test = base.extend<{}, { forEachWorker: void }>({
  forEachWorker: [async ({playwright}, use) => {
    // This code runs before all the tests in the worker process.

    const clientId : string = process.env.API_CLIENT_ID;
    const clientSecret : string = process.env.API_CLIENT_SECRET;
    const tenantId = process.env.API_TENANT_ID;
    const scope: string = `api://${clientId}/.default`;
    const authorityURL: string = `https://login.microsoftonline.com/${tenantId}/oauth2/token`;

    const client = new ConfidentialClientApplication({
      auth: {
        clientId: clientId,
        authority: authorityURL,
        clientSecret: clientSecret,
      }
    });

    const request = {
      scopes: [ scope ]
    };

    let response = await client.acquireTokenByClientCredential(request);

    //Note the access token has an expiry of 60 minutes We may need to come back to this to
    //Refresh the token if tests ever take longer than 1 hour to run
    apiContext = await playwright.request.newContext({
      
      // All requests we send go to this API endpoint.
      baseURL: `${process.env.PRESERVATION_API_ENDPOINT!}`,
      extraHTTPHeaders: {
        // Add authorization token to all requests.
        'Authorization': `Bearer ${response.accessToken}`,
        'X-Client-Identity': 'Playwright-tests',
      } ,

    });

    await use();

    await apiContext.dispose();
  }, { scope: 'worker', auto: true }],  // automatically starts for every worker.
});




