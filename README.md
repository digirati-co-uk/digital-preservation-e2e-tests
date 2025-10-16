
To install and run the tests after cloning from git, open a terminal window, navigate to the cloned repo, and ten run:

    npm install

    npx playwright install

Create a '.env' file as a copy of '.env.dist' and then populate the FRONTEND_USERNAME and FRONTEND_PASSWORD with the Playwright username and password (TBC). Then run:

   `npx playwright test`

To run playwright UI 

   `npx playwright test --ui`

   
