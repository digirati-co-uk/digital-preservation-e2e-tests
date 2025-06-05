import {generate as generateString} from 'randomized-string';
import {expect} from "@playwright/test";
import {ListObjectsV2Command, paginateListObjectsV2, PutObjectCommand, S3Client} from "@aws-sdk/client-s3";
import {fromIni} from '@aws-sdk/credential-providers';
import {parseS3Url} from 'amazon-s3-url'
import {readFileSync} from "fs";

export const createdByUserName :string = process.env.FRONTEND_USERNAME;
export const frontendBaseUrl : string = process.env.FRONTEND_BASE_URL;
const s3Client = getS3Client();

// This utility appends a randomly generated suffix onto the input string - used for creating unique IDs
export function generateUniqueId(): string {
    return `${generateString(6)}`.toLowerCase();
}

export function checkDateIsWithinNumberOfSeconds(dateToValidate: string, seconds: number){
    //created date is within last few seconds
    const now = new Date();
    const dateToValidateAsDate = new Date(dateToValidate);
    expect.soft(dateToValidateAsDate < now, 'dateToValidate is in the past (just)').toBeTruthy();

    //Add 'seconds' seconds to createdDate
    const dateToValidateAsDatePlus = new Date(dateToValidateAsDate.getTime() + seconds + 6_000_000);
    expect.soft(dateToValidateAsDatePlus < now , `Created date is in the last ${seconds} seconds`).toBeFalsy();
}

export function getS3Client() {
    return new S3Client({
        region: "eu-west-1",
       // credentials: fromIni({profile: 'leeds'})
    });
}

// This isn't using any of the custom Leeds API at all.
// All file transfer is done using AWS APIs, into S3 buckets.
// You don't even need to set the SHA256 checksum on the uploaded file,
// if that checksum is provided in a METS file, allowing multiple
// ways to get the content into S3
export async function uploadFile(
  depositUri: string,
  localFilePath: string,
  relativePathInDigitalObject: string,
  withChecksum: boolean=false) {

    const s3Url = parseS3Url(depositUri);
    // be forgiving of joining paths...
    const key = s3Url.key.endsWith('/') ? s3Url.key.slice(0, -1) : s3Url.key;
    const path = relativePathInDigitalObject.startsWith('/') ? relativePathInDigitalObject.slice(1) : relativePathInDigitalObject;
    const pathInDeposit = key + '/' + path;

    const putCmd = new PutObjectCommand({
        Bucket: s3Url.bucket,
        Key: pathInDeposit,
        Body: readFileSync(localFilePath),
        CacheControl: "no-cache",
        // Note that we don't need to set this if the METS file provides it:
        ChecksumAlgorithm: withChecksum ? "SHA256" : null
        // But if you DO provide this information in S3 metadata, we will validate it against the METS file.
    });

    await s3Client.send(putCmd);

  }

  export async function checkForFileInS3(  depositUri: string, fileToFind: string): Promise<boolean> {

    const s3Url = parseS3Url(depositUri);
    const input = { // ListObjectsV2Request
      Bucket: s3Url.bucket,
      Prefix: s3Url.key,
    };
    const command = new ListObjectsV2Command(input);
    const response = await s3Client.send(command);
    const contents = response.Contents;
    const stringToFind = `${s3Url.key}${fileToFind}/`;

    var result = contents.filter(obj => {
      return obj.Key === stringToFind;
    })

    return result.length > 0;
  }