import { expect, test} from '@playwright/test';
import { authenticator, totp, hotp  } from 'otplib';


test.describe('test totp token call to  activity storage controller works',  () => {

 const  APIUrl : string = process.env.STORAGE_API_ENDPOINT;
 const  activityPath = '/activity/importjobs/collection';
 const  secret = process.env.TOTP_SECRET
 const  headerName = "x-activity-api";


 totp.options =  {
       digits: 8,
    step: 300,
   };




test('make call to storage api', async ({request}) => {

    const nowStamp: number = new Date().getUTCDate();
    

    const opts = totp.allOptions();
    console.log(opts)
    
    const token = totp.generate(secret);
 console.log(token);
    
    var uri = APIUrl + activityPath;

    const reqApi = await request.get(uri,
        {
            headers : {
                 'x-activity-api' : token,
                'Accept': 'application/json'
            }
        }
    );

    const result = await reqApi.json();
   
    expect(reqApi.ok()).toBeTruthy();
       
  });


});