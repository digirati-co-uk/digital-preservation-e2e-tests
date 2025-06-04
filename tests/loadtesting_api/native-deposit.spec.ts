import {expect, test} from '@playwright/test';
import {
    getS3Client,
    uploadFile,
    ensurePath,
    waitForStatus,
    getYMD,
    getSecondOfDay,
    getAuthHeaders,
    getFilesFromLocation,
    checkAmdSecExists,
    checkFileSecExists
} from '../helpers/common-utils';
import { assert } from 'console';
import { binary } from 'randomized-string/lib/types';
import { commonParams } from '@aws-sdk/client-s3/dist-types/endpoint/EndpointParameters';
import { Document, DOMParser } from '@xmldom/xmldom';

// Test we can read some files from the target directory
test.describe('Ensure we can see the files in the target dir',() => {

    const fileDir : string = process.env.FILES_SOURCE_DIR;

    test('Env location is set', async () => {
        
        expect(fileDir.length).toBeGreaterThan(0);
        const files = await getFilesFromLocation(fileDir);
        
        expect(files.length).toBeGreaterThan(0);
       
        //peek at files
        console.log(`dir: ${fileDir}`);
        files.forEach(i => console.log(i));

    });
  
});

// Scenario:
// A completely new archival group / package / book / etc.
// Someone has started working on it in Goobi, but it hasn't ever been saved to Preservation.
// Now it's time to commit it to Preservation.
// (later we'll make further changes to it).
// This TEST uses a local folder to upload a load of files from a folder to a deposit. 

// A Deposit is the mechanism to get files in and out of Preservation:
// https://github.com/uol-dlip/docs/blob/main/rfcs/003-preservation-api.md#deposit
test.describe('Create a NATIVE (our own METS) deposit and put some files in it', () => {

    let newDeposit = null;

    test('create-deposit', async ({request}) => {
        let sourceDir : string = process.env.FILES_SOURCE_DIR;
        sourceDir += sourceDir.endsWith("\\") ? "" : "\\"

        const files : string[] = await getFilesFromLocation(sourceDir);

        let baseURL =`${process.env.PRESERVATION_API_ENDPOINT!}`;

        // Set a very very long timeout so you can debug on breakpoints or whatnot.
        test.setTimeout(991000000);

        const parentContainer = `/native-tests/basic-1/${getYMD()}`;
        await ensurePath(parentContainer, request);

        // We want to have a new WORKING SPACE - a _Deposit_
        // So we ask for one:



        // ### API INTERACTION ###

        const secondOfDay = getSecondOfDay();
        let preservedDigitalObjectUri = `${baseURL}/repository${parentContainer}/ms-10315-${secondOfDay}`;
        const agName = "Native test " + secondOfDay;
        console.log("Create a new Deposit:");
        console.log("POST /deposits");
        var headers = await getAuthHeaders();
        const depositReq = await request.post('/deposits', {
            data: {
                type: "Deposit",
                template: "RootLevel",  // This is what tells the API it's one of ours
                archivalGroup: preservedDigitalObjectUri,
                archivalGroupName: agName,
                submissionText: "This is going to create a METS file and edit the METS as we go"
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
        
        const s3Client = getS3Client();
        console.log("Uploading " + files.length + " files to the S3 location provided by the Deposit:");
        console.log(newDeposit.files);
        for (const file of files) {
            await uploadFile(s3Client, newDeposit.files, sourceDir + file, "objects/" + file, true)
        }
        console.log("----");

        // Now we have uploaded our files.
        // But the above S3 helper doesn't know anything, it's just putting some files in a bucket.
        // The Preservation API isn't even aware of what's going on.

        // What happens of we just try to create an import job without doing anything?
        const diffJobGeneratorUri = newDeposit.id + '/importjobs/diff';
        // ### API INTERACTION ###
        console.log("Asking service to generate an import job from the deposit files (a diff)...");
        console.log("GET " + diffJobGeneratorUri);
        const diffResp = await request.get(diffJobGeneratorUri, {
            headers: await getAuthHeaders()
        });

        // WE EXPECT HTTP 422 Unprocessable - we haven't described the files in METS!
        expect(diffResp.status()).toBe(422);
        const unprocessableImportJob = await diffResp.json();
        console.log(unprocessableImportJob);
        console.log("----");

        // We could do this by hand - edit the METS file out of sight of the Preservation API.
        // But we can ask the Preservation API to help us.

        // We can do several things here. We can view the METS directly as XML
        // GET /deposits/aabbccdd/mets
        // We can POST a List of relative paths
        // POST /deposits/aabbccdd/mets  ... body is an array of strings, e.g., objects/my-file

        const metsUri = newDeposit.id + '/mets';
        const metsResp  = await request.get(metsUri,
            {
                headers: await getAuthHeaders()
            }
        );

        expect(metsResp.status()).toBe(200);
        const eTag = metsResp.headers()["etag"];

        // We can have a look at the filesystem that has resulted from our uploads
        // to the deposit:
        const fileSystemUri = newDeposit.id + '/filesystem';
        let fileSystemResp = await request.get(fileSystemUri, 
            {
                headers: await getAuthHeaders()
            }
        );
        expect(fileSystemResp.status()).toBe(200);
        let fileSystem = await fileSystemResp.json();
        console.log("----");
        console.log("filesystem:");
        console.log(fileSystem);
        console.log("----");
        console.log("files")
        console.log(fileSystem.directories.filter((i) => i.localPath == 'objects').files)
        console.log(`File count:  ${fileSystem.directories.filter((i) => i.localPath = 'objects')[0].files.length}, expected: ${files.length}`)
        // The above is not used in this test, it's just to demonstrate that you can inspect the filesystem
        // of the deposit via the API. (The UI app does not go via the API for this - it uses the same
        // library but interacts with the filesystem directly)

        // In this example, it's easy to navigate this filesystem:
        
        expect(fileSystem.directories[1].files.length).toEqual(files.length); // the four files mentioned above

        // but these aren't in the METS file; we can call an additional endpoint to add them,
        // using the information in the filesystem (most importantly, the hash or digest)
        console.log("posting to METS file:");


        //update files to include object 
        var locFiles = files.map((i) => `objects/${i}`);
  
        let defaultHeaders = await getAuthHeaders()
        let metsUpdateResp = await request.post(metsUri, {
           data: locFiles, // The list of file paths we defined earlier
           headers: {
            'If-Match': eTag,
             ... defaultHeaders
          }
        });
        expect(metsUpdateResp.status()).toBe(200);
        const itemsAffected = await metsUpdateResp.json();
               
        console.log("----");
        console.log(`itemsAffected : ${itemsAffected.items.length}`)
        console.log(itemsAffected);
        expect(itemsAffected.items.filter((i) => !i.isDir).length).toEqual(files.length);

        // now we can try to create an import job
        const secondDiffResp = await request.get(diffJobGeneratorUri,  { 
            headers: await getAuthHeaders()
        }
        );
        expect(secondDiffResp.status()).toBe(200);
        const importJob = await secondDiffResp.json();
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

        console.log(`################ Mets Checks ####################`);
       
        //get storage api url for mets file
        let metsXmlUri = digitalObject.binaries.find(x => x.name == "mets.xml").content;
        console.log(`mets origin ${metsXmlUri}`);

        //get file
        const metsReq = await request.get(metsXmlUri,
            {
                headers: await getAuthHeaders()
            });
        const metsAsString = await metsReq.text();

        console.log(metsAsString);

        console.log(`################ Mets Checks ####################`);
        //Parse as xml
        let metsXML : Document;
        metsXML = new DOMParser().parseFromString(metsAsString, 'text/xml');
       
        files.forEach(async file => {
           var loc = `objects/${file}`
           console.log(`checking file: ${loc}`);

           const AmdCheck = await checkAmdSecExists(metsXML, loc, true  );
           let SecCheck = await checkFileSecExists(metsXML, loc, AmdCheck);

           await expect(AmdCheck.length).not.toBe(0);
           await expect(SecCheck.length).not.toBe(0);
           console.log(`seems good : ${file},  AmdCheck: ${AmdCheck}, SecCheck: ${SecCheck}`);          
    });

    console.log(`################ Archival Group Checks ####################`);


       const archival_files =  digitalObject.storageMap.files;

       console.log(archival_files);

       //check mets file exists
       await expect(archival_files["mets.xml"]).not.toBeUndefined();


       files.forEach(async file => {
         const loc = `objects/${file}`
         console.log(`Looking for ${loc} : ${archival_files[loc]}`)
         await expect(loc).not.toBeUndefined();
       });
     
    });

    });








