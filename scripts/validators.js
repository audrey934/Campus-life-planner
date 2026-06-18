//Title validation
// Must not start or end with a space, and must not be empty
export function validateTitle(value) {
    return /^\S(?:.*\S)?$/.test(value);
}

// Date Validation (Format: YYYY-MM-DD)
export function validateDate(value) {
    return /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(value);
}

// Time (Format: HH:MM (24-hour))
export function validateTime(value) {
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

// Tags
// Letters and numbers only, separated by spaces or hyphens
export function validateTag(value) {
    return /^[A-Za-z0-9]+(?:[ -][A-Za-z0-9]+)*$/.test(value);
}

// Numbers
// Whole number or up to 2 decimal places, no negatives
export function validateNumber(value) {
    return /^(0|[1-9]\d*)(\.\d{1,2})?$/.test(value);
}

// Advanced regex to detect duplicate words using back-reference
export function detectDuplicateWords(value) {
    return /\b(\w+)\s+\1\b/i.test(value);
}

// Safe regex compiler

export function compileRegex(input, flags = "i") {
    if (!input || typeof input !== "string") return null;
    try {
        return new RegExp(input.trim(), flags);
    } catch (e) {
        return null;
    }
}

// Pattern matcher
// Returns true if text matches the regex, or true if no regex is given
export function matchesPattern(text, regex) {
    if (!regex) return true;
    return regex.test(text || "");
}

// Highlight
export function highlight(text, regex) {
    if (!regex) return text;
    return (text || "").replace(regex, match => `<mark>${match}</mark>`);
}