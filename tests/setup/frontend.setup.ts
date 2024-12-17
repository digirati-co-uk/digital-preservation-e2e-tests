import {expect, test as setup} from '@playwright/test';
import 'dotenv/config';
import {frontendSessionFile} from '../auth';


setup('login as user', async ({page}) => {
  await page.goto('/', {waitUntil: 'networkidle'});

  // Check if we're still logged in from a previous test run
  //If Sign In shows, then we are logged OUT

  if (await page.getByRole('heading', {name: 'Sign in'}).isVisible()) {
    await page.getByRole('textbox', {name: 'username@leeds.ac.uk'}).fill(process.env.FRONTEND_USERNAME!);
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('textbox', {name: 'Enter the password'}).fill(process.env.FRONTEND_PASSWORD!);
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page, 'After login, we have landed on the correct URL').toHaveURL('/', {timeout: 10_000});
  }

  await page.context().storageState({path: frontendSessionFile});
});
