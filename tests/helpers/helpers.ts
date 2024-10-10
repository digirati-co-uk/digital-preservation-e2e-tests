import {generate as generateString} from 'randomized-string';
import {expect} from "@playwright/test";

// This utility appends a randomly generated suffix onto the input string - used for creating unique IDs
export function generateUniqueId(): string {
    return `${generateString(6)}`
}

export function checkDateIsApproximatelyNow(dateToValidate: string){
    //created date is within last few seconds
    const now = new Date();
    const dateToValidateAsDate = new Date(dateToValidate);
    expect(dateToValidateAsDate < now, 'dateToValidate is in the past (just)').toBeTruthy();

    //Add 5 seconds to createdDate
    const dateToValidateAsDatePlus = new Date(dateToValidateAsDate.getTime() + 5000);
    expect(dateToValidateAsDatePlus < now , 'Created date is in the last 5 seconds').toBeFalsy();
}

// export function getJSONBody(){
//     let body = await spaces.body();
//     let jsonBody = JSON.parse(body.toString('utf-8'));
// }