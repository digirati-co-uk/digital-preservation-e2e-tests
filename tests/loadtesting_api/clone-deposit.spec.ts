import {expect, test} from '@playwright/test';
import {
    getS3Client,
    copyS3File,
    ensurePath,
    waitForStatus,
    getYMD,
    getSecondOfDay,
    getAuthHeaders,
    listKeys
} from '../helpers/common-utils';
import {parseS3Url} from "amazon-s3-url";

// Scenario:
// A completely new archival group / package / book / etc.
// Someone has started working on it in Goobi, but it hasn't ever been saved to Preservation.
// Now it's time to commit it to Preservation.
// (later we'll make further changes to it).
// This TEST uses a local folder to upload a load of files from a folder to a deposit. 

// A Deposit is the mechanism to get files in and out of Preservation:
// https://github.com/uol-dlip/docs/blob/main/rfcs/003-preservation-api.md#deposit
test.describe('Create an empty deposit and copy some files in from S3', () => {

    let newDeposit = null;

    test('create-deposit', async ({request}) => {

        let source : string = process.env.SOURCE_DEPOSIT;
        let baseURL =`${process.env.PRESERVATION_API_ENDPOINT!}`;


        // Set a very very long timeout so you can debug on breakpoints or whatnot.
        test.setTimeout(991000000);

        const parentContainer = `/native-tests/basic-1/${getYMD()}`;
        await ensurePath(parentContainer, request);

        // We want to have a new WORKING SPACE - a _Deposit_
        // So we ask for one:
        const secondOfDay = getSecondOfDay();
        let preservedDigitalObjectUri = `${baseURL}/repository${parentContainer}/load-test-${secondOfDay}`;
        const agName = "Deposit for load test " + secondOfDay;
        console.log("Create a new Deposit:");
        console.log("POST /deposits");
        var headers = await getAuthHeaders();
        const depositReq = await request.post('/deposits', {
            data: {
                type: "Deposit",
                template: "None",  // This is what tells the API it's one of ours
                archivalGroup: preservedDigitalObjectUri,
                archivalGroupName: agName,
                submissionText: "An empty deposit we will copy files into, including METS"
            },
            headers: headers,
        });


        expect(depositReq.status()).toBe(201); /// 201 ??
        newDeposit = await depositReq.json();
        // https://github.com/uol-dlip/docs/blob/main/rfcs/003-preservation-api.md#deposit
        console.log("New Deposit created:");
        console.log(newDeposit);
        console.log("----");

        expect(newDeposit.files).toMatch(/s3:\/\/.*/);

        // Unlike the create-deposit.spec example, we ARE going to set the checksum, because we have no
        // other way of providing it. Later we will be able to get checksums from BagIt.
        
        let count = 0;
        const s3Client = getS3Client();
        const files = await listKeys(s3Client, source);
        console.log("Copying " + files.length + " files to the S3 location provided by the Deposit:");
        console.log(newDeposit.files);
        const sourceS3Obj = parseS3Url(source);
        const destS3Obj = parseS3Url(newDeposit.files);
        for (const file of files) {
            if(file.Key == sourceS3Obj.key){
                continue;
                // not the source key itself
            }
            if(file.Key.indexOf("__METSlike.json") != -1) {
                continue;
            }
            const destKey = file.Key.replace(sourceS3Obj.key, destS3Obj.key);
            const copySource = `/${sourceS3Obj.bucket}/${file.Key}`;
            console.log(`copying file ${copySource}: to /${destS3Obj.bucket}/${destKey} - ${count++} of ${files.length}`);
            await copyS3File(s3Client, copySource, destS3Obj.bucket, destKey);
        }
        console.log("----");

        // now we can try to create an import job
        const diffJobGeneratorUri = newDeposit.id + '/importjobs/diff';
        const diffResp = await request.get(diffJobGeneratorUri,  {
            headers: await getAuthHeaders()
        }
        );
        expect(diffResp.status()).toBe(200);
        const importJob = await diffResp.json();
        console.log("----");
        console.log("Working import job:");
        console.log(importJob);
        console.log("----");

        // ### API INTERACTION ###
        const executeJobUri = newDeposit.id + '/importjobs';
        console.log("Now execute the import job...");
        console.log("POST " + executeJobUri);
        const executeImportJobReq = await request.post(executeJobUri, {
            data: importJob,
            headers: await getAuthHeaders()
        });

        let importJobResult = await executeImportJobReq.json();
        console.log(importJobResult);
        expect(importJobResult).toEqual(expect.objectContaining({
            type: 'ImportJobResult',
            originalImportJob: diffJobGeneratorUri, // <++ here
            status: 'waiting',
            archivalGroup: preservedDigitalObjectUri
        }));
        console.log("----");

        console.log("... and poll it until it is either complete or completeWithErrors...");
        await waitForStatus(importJobResult.id, /completed.*/, request);
        console.log("----");

        // Now we should have a preserved archival group in the repository:

        // ### API INTERACTION ###
        console.log("Now request the archival group URI we made earlier:");
        console.log("GET " + preservedDigitalObjectUri);
        const digitalObjectReq = await request.get(preservedDigitalObjectUri,
            {
                headers: await getAuthHeaders()
            }
        );

        expect(digitalObjectReq.ok()).toBeTruthy();
        const digitalObject = await digitalObjectReq.json();
        
        console.log(digitalObject);


     
    });

});








