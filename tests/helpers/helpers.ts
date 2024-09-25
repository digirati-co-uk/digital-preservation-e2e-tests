import {generate as generateString} from 'randomized-string';

// This utility appends a randomly generated suffix onto the input string - used for creating unique IDs
export function generateUniqueId(): string {
    return `${generateString(6)}`
}