// Various regex patterns used throughout the site to validate different inputs.

// Patterns
/**
 * A primitive replica of Google's ruleset of 32 words, 128 chars max per word. May be inaccurate
 * in complex situations, but this should get the job done. Do note that Google excludes conjunctions
 * like 'or' from the final word count, but we're not going to that extent, this is fine for our use cases. 
 * 
 * Explanation of the regex pattern:
 *
 * ^: Start of the string.
 * (?: ... ): Non-capturing group.
 * .{0,128}: Matches any character (including whitespace and special characters) between 0 and 128 times.
 * \s*: Matches zero or more whitespace characters.
 * {0,32}: Quantifier that matches between 0 and 32 occurrences of the previous group.
 * $: End of the string.
 */
const SearchBarRegexPattern = /^(?:.{0,128}\s*){0,32}$/; // This is a REGEX object, refrain from surrounding these in quotes, they usually fail when that's the case.

/**
 * Standard REGEX for the majority of supported emails.
 */
/// Most common emails conform to the following REGEX sequence
/// Note: This is a raw string to avoid the escaping back slash character, of course a double back slash solves this but it will make the regex confusing as a string literal
/// This REGEX conforms to the character limits imposed by the RFC 5321 standard
/// https://www.rfc-editor.org/rfc/rfc5321.txt

/// Breakdown of this REGEX:
/**
 - ^ matches the start of the string
 - [a-zA-Z0-9._%+-]+ matches one or more of the following characters: letters (upper and lowercase), digits, and the special characters ., _, %, +, and -
 - @ matches the @ symbol
 - [a-zA-Z0-9.-]+ matches one or more of the following characters: letters (upper and lowercase), digits, and the special characters . and -
 - \. matches a literal period (the \ is used to escape the special meaning of the . character in regex)
 - [a-zA-Z]{2,} matches two or more letters (upper or lowercase) at the end of the string
 - $ matches the end of the string
 - This regex limits the local part of the email address to a maximum of 64 characters, and the domain part (including the TLD) to a maximum of 255 characters. Note that these limits are somewhat arbitrary and some email servers may accept longer email addresses, but adhering to the RFC 5321 standard is a good practice for ensuring compatibility with most email systems.
 */
const EmailRegexPattern =
  /^[a-zA-Z0-9._%+-]{1,64}@[a-zA-Z0-9.-]{1,255}\.[a-zA-Z]{2,}$/;

/**
 * Explanation:
 *
 * ^: Asserts the start of the line.
 * \+?: Matches an optional plus sign (+).
 * [0-9]+: Matches one or more digits (0-9).
 * $: Asserts the end of the line.
 * This regex ensures that the phone number contains only digits, with an optional plus sign at the beginning. Here are some examples of valid phone numbers that would match this pattern:
 *
 * +1234567890
 * 987654321
 * 0123456789
 */
const PhoneNumberRegexPattern = /^\+?[0-9]+$/;

/**
 * Foncii platform standard for usernames.
 * 
 * Since we were tightly coupled with Instagram's username scheme, the Regex pattern depicted
 * is equivalent to theirs.
 * 
 * The provided regex pattern allows usernames that consist of letters 
 * (both uppercase and lowercase), digits, underscores (_), and dots (.) 
 * but ensures that there are no consecutive dots and that the username 
 * does not end with a dot.
 * 
 * Example: user.name_123
 * 
 * ^: Indicates the start of the string.
* (?!.*\.\.): Ensures there are no consecutive dots (..) anywhere in the string.
* (?!.*\.$): Ensures the string does not end with a dot.
* [^\W]: Matches any word character (letters, digits, or underscore) except for non-word characters (special characters and spaces).
* [\w.]{0,29}: Matches between 0 and 29 word characters, including word characters (letters, digits, underscore) and dots (.) within the string.
* $: Indicates the end of the string.
* In summary, this regex pattern enforces the following rules for the string it matches:

* It must not contain consecutive dots (..).
* It must not end with a dot.
* It must start with a word character (letter, digit, underscore).
* It can contain a combination of word characters and dots (up to a maximum of 29 characters in total).
 */
const FonciiUsernameRegexPattern = /^(?!.*\.\.)(?!.*\.$)[^\W][a-z0-9_.]{0,29}$/;

/**
 * Foncii platform standard for passwords.
 */
/// Breakdown of this REGEX:
/**
 This regular expression matches passwords that:
 
 - Have a minimum of 8 characters.
 - Have a maximum of 30 characters.
 - Contain at least one special character.
 - Only contain letters (uppercase or lowercase), numbers, and the specified special characters.
 
 - The pattern starts with the `^` character, which matches the beginning of the string, and ends with the `$` character, which matches the end of the string.
 
 - a positive lookahead assertion that requires:
    - the presence of at least one of the specified special characters in the password
    - the presence of a lowercase character
    - the presence of an uppercase character
 
 - The pattern specifies that there must be at least 8 characters in the string (`{8,30}`)
 */
const FonciiPasswordRegexPattern =
  /^(?=.*[!@#$%^&*()_+\-=[\]{};':"\|,.<>?])(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,30}$/;

/**
 * ^: Denotes the start of the string.
 * [A-Za-z]: Matches any uppercase or lowercase letter.
 * +: Requires one or more occurrences of the preceding pattern (i.e., one or more letters).
 * $: Denotes the end of the string.
 * - {1,50}: Specifies the length of the string, allowing names between 1 and 50 characters long.
 */
const PersonalNameRegexPattern = /^[A-Za-z]{1,50}$/;

/**
 * Source: https://uibakery.io/regex-library/url
 * Minimum of 1 char
 * Maximum of 256 chars
 */
const URLRegexPattern =
  /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/;

// Pattern Selector
export const RegexPatterns = {
  SearchBarRegex: SearchBarRegexPattern,
  EmailRegex: EmailRegexPattern,
  FonciiUsernameRegex: FonciiUsernameRegexPattern,
  FonciiPasswordRegex: FonciiPasswordRegexPattern,
  PersonalNameRegex: PersonalNameRegexPattern,
  URLRegexPattern: URLRegexPattern,
};

// Regex Matching Logic
/**
 * @param input -> The input to be validated against the pattern.
 * @param pattern -> The pattern to be used to validate the input.
 * @returns {boolean} -> True if the input matches the pattern, false otherwise.
 */
export function isInputValidAgainstPattern(
  input: string,
  pattern: RegExp
): boolean {
  return new RegExp(pattern).test(input);
}
