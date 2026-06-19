// Build a regex safely from user input. Returns null instead of throwing
// if the pattern is invalid, so a bad search string can't crash the page.
export function compileRegex(input, flags = "i") {
    if (!input || typeof input !== "string") {
        return null;
    }

    try {
        return new RegExp(input.trim(), flags);
    } catch {
        return null;
    }
}

// Wraps every match in <mark> so it's visibly highlighted
export function highlight(text, regex) {
    if (!regex) return text;

    return (text || "").replace(
        regex,
        match => `<mark>${match}</mark>`
    );
}

// Checks whether text matches a pattern. No regex means "match everything"
export function matchesPattern(text, regex) {
    if (!regex) return true;
    return regex.test(text || "");
}