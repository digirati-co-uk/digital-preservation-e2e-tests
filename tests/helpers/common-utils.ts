import {APIRequestContext, expect} from '@playwright/test';
import {ListObjectsV2Command, paginateListObjectsV2, PutObjectCommand, CopyObjectCommand, S3Client} from "@aws-sdk/client-s3";
import {fromIni} from '@aws-sdk/credential-providers';
import {parseS3Url} from 'amazon-s3-url'
import {readFileSync, readdirSync} from "fs";
import {
    AuthenticationResult,
    AuthorizationCodeRequest,
    ClientCredentialRequest,
    ConfidentialClientApplication
  } from "@azure/msal-node";
import { Document, Element } from '@xmldom/xmldom';


export function getS3Client() {
    return new S3Client({
        region: "eu-west-1",
        credentials: fromIni({profile: 'leeds'})
    });
}

// This isn't using any of the custom Leeds API at all.
// All file transfer is done using AWS APIs, into S3 buckets.
// You don't even need to set the SHA256 checksum on the uploaded file,
// if that checksum is provided in a METS file, allowing multiple
// ways to get the content into S3
export async function uploadFile(
    s3: S3Client,
    depositUri: string,
    localFilePath: string,
    relativePathInDigitalObject: string,
    withChecksum: boolean=false) {

    const s3Url = parseS3Url(depositUri);

    // be forgiving of joining paths...
    const key = s3Url.key.endsWith('/') ? s3Url.key.slice(0,-1) : s3Url.key;
    const path = relativePathInDigitalObject.startsWith('/') ? relativePathInDigitalObject.slice(1) : relativePathInDigitalObject;
    const pathInDeposit = key + '/' + path;
 


    console.log(`#s3: ${s3} #depositUri: ${depositUri}  #localFilePath: ${localFilePath} `);
    console.log(`#path: ${path}`);

    const putCmd = new PutObjectCommand({
        Bucket: s3Url.bucket,
        Key: pathInDeposit,
        Body: readFileSync(localFilePath),
        CacheControl: "no-cache",
        // Note that we don't need to set this if the METS file provides it:
        ChecksumAlgorithm: withChecksum ? "SHA256" : null
        // But if you DO provide this information in S3 metadata, we will validate it against the METS file.
    });

    console.log("Uploading to S3: " + pathInDeposit);
    await s3.send(putCmd);
}


export async function copyS3File(
    s3: S3Client,
    copySource: string,
    destBucket: string,
    destKey: string) {

    const copyCmd = new CopyObjectCommand({
        Bucket: destBucket,
        Key: destKey,
        CopySource: copySource,
    });
    await s3.send(copyCmd);
}

export async function listKeys(s3: S3Client, parentKey: string){

    const s3Url = parseS3Url(parentKey);
    var opts = {
        Bucket: s3Url.bucket,
        Prefix: s3Url.key
    }

    const files = [];
    for await (const data of paginateListObjectsV2({ client: s3 }, opts)) {
        files.push(...(data.Contents ?? []));
    }
    for(const f of files){
        console.log(f);
    }
    return files;
}

// This is purely for demo purposes and would be no part of a real application!!
// Its purpose is to produce a short string with very small likelihood of collisions.
export function getShortTimestamp(){
    const date = new Date();
    const dayOfYear = (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(date.getFullYear(), 0, 0)) / 24 / 60 / 60 / 1000;
    const secondOfDay = date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
    return `-${String(dayOfYear).padStart(3, '0')}-${String(secondOfDay).padStart(5, '0')}`
}

export function getSecondOfDay(){
    const date = new Date();
    const secondOfDay = date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
    return String(secondOfDay).padStart(5, '0');
}

export function getYMD(){
    const date = new Date();
    return date.toISOString().split('T')[0]
}

export async function ensurePath(path: string, request: APIRequestContext) {
    const parts = path.split('/');
    let buildPath = "/repository";
    for (const part of parts) {
        if(part){
            buildPath += '/' + part;
            const resourceResp = await request.get(buildPath, {
                headers: await getAuthHeaders()
            });
            if(resourceResp.status() == 404){
                // This is always a container, you can't create other kinds of resource outside of a deposit
                const containerResp = await request.put(buildPath, {
                    headers: await getAuthHeaders()
                });
            // ignore other status codes for now
            }
        console.log(`status: ${resourceResp.status()} for path: ${buildPath} `);
    }
 }
}

export async function waitForStatus(uri: string, status: any, request: APIRequestContext){
      await expect.poll(async () => {
        console.log(`polling object: ${uri}`);
        const resp = await request.get(uri,{
            headers: await getAuthHeaders()
        });
        const respObj = await resp.json();
        console.log("status: " + respObj.status);
        return respObj.status;
    }, {
        intervals: [2000], // every 2 seconds
        timeout: 60000 // allow 1 minute to complete
    }).toMatch(status);
}

export async function getAuthHeaders()
{
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
 
        let headers = {
            'Authorization': `Bearer ${response.accessToken}`,
            'X-Client-Identity': 'Playwright-tests',
            'Accept': 'application/json',
        };
       
        return headers;
}

export async function getFilesFromLocation(fileDir: string)
{
    const fileNames = await readdirSync(fileDir);
    return fileNames;
}


export  async function checkAmdSecExists(metsXML: Document, itemToFind: string, shouldBePresent: boolean) :Promise<string>{
    const amdSecValues = metsXML.getElementsByTagName('mets:amdSec');
    const itemToFindElement = amdSecValues.filter(item => (item.getElementsByTagName('premis:originalName'))[0].textContent.trim() === itemToFind.trim());
    if (shouldBePresent) {
      expect(itemToFindElement).toHaveLength(1);
      return itemToFindElement[0].getAttribute('ID');
    }else{
      expect(itemToFindElement).toHaveLength(0);
      return '';
    }
  }

 export async function checkFileSecExists(metsXML: Document, itemToFind: string, admId: string) : Promise<string>{
    const fileSecValues = metsXML.getElementsByTagName('mets:fileSec')[0];
    const files = fileSecValues.getElementsByTagName('mets:file');

    const itemToFindElement = files.filter(item => item.getAttribute('ADMID').trim() === admId.trim());
    const fileLocations = itemToFindElement[0].getElementsByTagName('mets:FLocat');
    const itemToFindFLocatElement = fileLocations.filter(item => item.getAttribute('xlink:href').trim() === itemToFind.trim());
    expect(itemToFindFLocatElement).toHaveLength(1);
    return itemToFindElement[0].getAttribute('ID');
  }