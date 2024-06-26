// Dependencies
// Cryptography
import * as crypto from 'crypto';

/**
 * Hashing algorithm for enciphering some string input.
 * Reference: https://en.wikipedia.org/wiki/SHA-2
 * 
 * @param input -> Some string to hash
 * 
 * @returns -> A hashed hex string with a deterministic value
 * provided by the input hex string
 */
export function sha256Hash(input: string): string {
    const hash = crypto.createHash('sha256');
    hash.update(input);

    return hash.digest('hex');
}
