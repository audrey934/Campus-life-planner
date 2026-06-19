
const KEY = "activities";

// Save activities into browser storage
export function saveToStorage(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
}

// Get activities from storage
export function loadFromStorage() {
    const stored = localStorage.getItem(KEY);

    // If nothing is saved yet, return an empty list
    if (!stored) return [];

    try {
        return JSON.parse(stored);
    } catch (err) {
        console.error("Could not read saved activities:", err);
        return [];
    }
}

// Remove everything from storage
export function clearStorage() {
    localStorage.removeItem(KEY);
}


// Helper used  to load default data from file

export async function loadSeed() {
    const res = await fetch("./seed.json");
    return await res.json();
}

// Used for screen readers feedback
export function announce(message) {
    const region = document.getElementById("status-region");

    if (!region) return;

    region.setAttribute("aria-live", "polite");
    region.textContent = message;
}

export function announceUrgent(message) {
    const region = document.getElementById("status-region");

    if (!region) return;

    region.setAttribute("aria-live", "assertive");
    region.textContent = message;
}


// Settings Theme + preferences stored locally


const SETTINGS_KEY = "campus-settings";

// Default settings if nothing is saved yet
const defaultSettings = {
    timeUnit: "minutes",
    theme: "light"
};

// Save user preferences
export function saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// Load user preferences 
export function loadSettings() {
    const stored = localStorage.getItem(SETTINGS_KEY);

    if (!stored) return defaultSettings;

    try {
        return JSON.parse(stored);
    } catch (err) {
        console.error("Settings data is corrupted:", err);
        return defaultSettings;
    }
}

// Apply saved theme to the page (light / dark)
export function applySavedTheme() {
    const { theme } = loadSettings();

    document.body.classList.toggle("dark-theme", theme === "dark");
}