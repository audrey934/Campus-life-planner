import {loadFromStorage,saveToStorage,announce,announceUrgent,saveSettings,loadSettings,applySavedTheme} from "./storage.js";
import { validateTitle, validateTag, validateDate, validateTime, detectDuplicateWords } from "./validators.js";
import { compileRegex, highlight } from "./search.js";

// STATE

let activities = [];
let deleteTargetId = null;
let currentFilter = "all";
let editId = null;


// DOM

const addBtn = document.getElementById("add-record-btn");
const modal = document.getElementById("form-modal");
const deleteModal = document.getElementById("delete-modal");

const form = document.getElementById("activity-form");
const cancelBtn = document.getElementById("cancel-btn");

// Table elements (replaced the two card containers)
const tableBody = document.getElementById("table-body");
const tableEmpty = document.getElementById("table-empty");

const searchInput = document.getElementById("search");
const filterButtons = document.querySelectorAll(".filter-btn");
const sortSelect = document.getElementById("sort-select");
const caseSensitiveToggle = document.getElementById("case-sensitive-toggle");

const errorBox = document.getElementById("form-errors");

const cancelDeleteBtn = document.getElementById("cancel-delete");
const confirmDeleteBtn = document.getElementById("confirm-delete");
const exportBtn = document.getElementById("export-btn");
const importBtn = document.getElementById("import-btn");
const importFile = document.getElementById("import-file");
const resetBtn = document.getElementById("resetbtn");

const timeUnitSelect = document.getElementById("time-unit");
const themeSelect = document.getElementById("theme-select");

// isEventsPage now checks for the table body instead of the old card containers
const isEventsPage = Boolean(tableBody);

// Export button

if (exportBtn) {
    exportBtn.addEventListener("click", () => {
        const data = loadFromStorage();
        const json = JSON.stringify(data, null, 2);

        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "campus-life-planner-export.json";
        a.click();

        URL.revokeObjectURL(url);

        announce(`Exported ${data.length} records.`);
    });
}


// import

if (importBtn) {
    importBtn.addEventListener("click", () => {
        const file = importFile.files[0];

        if (!file) {
            alert("Please choose a JSON file first.");
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            try {
                const parsed = JSON.parse(reader.result);

                if (!Array.isArray(parsed)) {
                    alert("Invalid file: expected a list of records.");
                    return;
                }

                const isValid = parsed.every(item =>
                    typeof item.id !== "undefined" &&
                    typeof item.title === "string" &&
                    typeof item.startDate === "string"
                );

                if (!isValid) {
                    alert("Invalid file: some records are missing required fields.");
                    return;
                }

                activities = parsed;
                saveToStorage(activities);
                render();

                announce(`Import successful. ${parsed.length} records loaded.`);

            } catch (err) {
                announceUrgent("Invalid JSON file. Please check the file and try again.");
            }
        };

        reader.readAsText(file);
    });
}


// Settings

if (timeUnitSelect) {
    const settings = loadSettings();

    timeUnitSelect.value = settings.timeUnit;
    themeSelect.value = settings.theme;

    applySavedTheme(settings.theme);

    timeUnitSelect.addEventListener("change", () => {
        const current = loadSettings();
        current.timeUnit = timeUnitSelect.value;
        saveSettings(current);
        announce(`Time unit set to ${timeUnitSelect.value}.`);
        render();
    });

    themeSelect.addEventListener("change", () => {
        const current = loadSettings();
        current.theme = themeSelect.value;
        saveSettings(current);
        applySavedTheme(themeSelect.value);
        announce(`Theme switched to ${themeSelect.value}.`);
    });  
}


applySavedTheme();
async function init() {
    const stored = localStorage.getItem("activities");

    if (!stored) {
        activities = [];
    } else {
        activities = JSON.parse(stored);
    }

    render();
}

window.addEventListener("DOMContentLoaded", () => {
    if (!isEventsPage) return;
    init();
});

if (resetBtn) {
    resetBtn.addEventListener("click", async () => {
        if (!confirm("Reset all data?")) return;

        localStorage.removeItem("activities");

        const res = await fetch("./seed.json");
        activities = await res.json();

        localStorage.setItem("activities", JSON.stringify(activities));

        render();
        announce("Reset done.");
    });
}

// Helper functions
function formatDuration(minutes) {
    const settings = loadSettings();

    if (settings.timeUnit === "hours") {
        const rawHours = minutes / 60;

        // round to 1 decimal, but keep it as NUMBER
        const rounded = Math.round(rawHours * 10) / 10;

        // remove .0 cleanly
        return Number.isInteger(rounded)
            ? `${rounded} hr`
            : `${rounded} hr`;
    }

    return `${minutes} min`;
}

function getTimeValue(a) {
    return new Date(`${a.startDate}T${a.startTime}`).getTime();
}

function formatTime(time) {
    if (!time) return "";
    const [h, m] = time.split(":").map(Number);

    const ampm = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;

    return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

function isValidDateTime(startDate, endDate, startTime, endTime) {
    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate || startDate}T${endTime}`);
    return end >= start;
}

function calculateDuration(startDate, endDate, startTime, endTime) {
    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate || startDate}T${endTime}`);
    return Math.round((end - start) / 60000);
}

function sync() {
    activities = loadFromStorage();
}


if (addBtn) {
    addBtn.addEventListener("click", () => openModal());
}

if (cancelBtn) {
    cancelBtn.addEventListener("click", closeModal);
}

function openModal(activity = null) {
    modal.classList.remove("hidden");

    if (activity) {
        document.getElementById("form-heading").textContent = "Edit Event/Class";

        form.title.value = activity.title;
        form.type.value = activity.type;
        form["start-date"].value = activity.startDate;
        form["end-date"].value = activity.endDate || "";
        form["start-time"].value = activity.startTime;
        form["end-time"].value = activity.endTime;
        form.location.value = activity.location || "";
        form.tags.value = activity.tags;

        editId = activity.id;
    } else {
        document.getElementById("form-heading").textContent = "Add Event/Class";
        form.reset();
        editId = null;
    }

    errorBox.textContent = "";
}

function closeModal() {
    modal.classList.add("hidden");
    form.reset();
    editId = null;
}

// Saving 
if (form) {
form.addEventListener("submit", (e) => {
    e.preventDefault();

    sync();
    const existingActivity = editId ? activities.find(a => a.id === editId) : null;
    const nowStamp = new Date().toISOString();

    const activity = {
        id: editId || Date.now(),
        title: form.title.value.trim(),
        type: form.type.value,
        startDate: form["start-date"].value,
        endDate: form["end-date"].value,
        startTime: form["start-time"].value,
        endTime: form["end-time"].value,
        duration: calculateDuration(
            form["start-date"].value,
            form["end-date"].value,
            form["start-time"].value,
            form["end-time"].value
        ),
        location: form.location.value.trim(),
        tags: form.tags.value.trim(),
        createdAt: existingActivity ? existingActivity.createdAt : nowStamp,
        updatedAt: nowStamp,
    };

    const errors = [];

    if (!validateTitle(activity.title)) {
        errors.push("Title cannot be empty or have leading/trailing spaces.");
    }

    // advanced regex check: catches accidental repeated words
    if (detectDuplicateWords(activity.title)) {
        errors.push("Title has the same word twice in a row. Please fix it.");
    }

    if (!validateDate(activity.startDate)) {
        errors.push("Start date must be in YYYY-MM-DD format.");
    }

    if (activity.endDate && !validateDate(activity.endDate)) {
        errors.push("End date must be in YYYY-MM-DD format.");
    }

    if (!validateTime(activity.startTime)) {
        errors.push("Start time must be in HH:MM format.");
    }

    if (!validateTime(activity.endTime)) {
        errors.push("End time must be in HH:MM format.");
    }

    if (activity.tags && !validateTag(activity.tags)) {
        errors.push("Tags must contain only letters, spaces, or hyphens.");
    }

    if (!isValidDateTime(
        activity.startDate,
        activity.endDate,
        activity.startTime,
        activity.endTime
    )) {
        errors.push("End date/time cannot be before start date/time.");
    }

    if (errors.length > 0) {
        errorBox.innerHTML = errors.map(e => `<p>${e}</p>`).join("");
        announceUrgent(`Form has ${errors.length} error(s). Please review.`);
        return;
    }

    errorBox.textContent = "";

    if (editId) {
        activities = activities.map(a =>
            a.id === editId ? activity : a
        );
    } else {
        activities.push(activity);
    }

    saveToStorage(activities);

    announce(
        editId
            ? `${activity.title} updated successfully.`
            : `${activity.title} added successfully.`
    );

    render();
    closeModal();
});
}

// ==========================
// DELETE + FILTER + RENDER
// ==========================

if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener("click", () => {
        deleteModal.classList.add("hidden");
    });
}

if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener("click", () => {
        sync();

        const deleted = activities.find(a => a.id === deleteTargetId);

        activities = activities.filter(a => a.id !== deleteTargetId);

        saveToStorage(activities);

        announce(deleted ? `${deleted.title} deleted.` : "Activity deleted.");

        render();
        deleteModal.classList.add("hidden");
    });
}

filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        filterButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        currentFilter = btn.textContent.toLowerCase();
        render();
    });
});

if (searchInput) searchInput.addEventListener("input", render);
if (caseSensitiveToggle) caseSensitiveToggle.addEventListener("change", render);
if (sortSelect) sortSelect.addEventListener("change", render);

// Rendering — now builds a table instead of separate card grids
function render() {
    if (!isEventsPage) return;

    if (!Array.isArray(activities)) activities = [];

    const searchValue = searchInput.value.trim();

    // if the checkbox is checked, search exactly as typed (no "i" flag)
    // otherwise stay case-insensitive like before
    const searchFlags = caseSensitiveToggle && caseSensitiveToggle.checked ? "" : "i";

    let regex = null;

    if (searchValue) {
        regex = compileRegex(searchValue, searchFlags);
    }

    let filtered = activities.filter(a => {
        const matchesSearch =
            !regex ||
            regex.test(a.title || "") ||
            regex.test(a.tags || "");

        const matchesType =
            currentFilter === "all" ||
            (currentFilter === "campus events" && a.type === "event") ||
            (currentFilter === "classes" && a.type === "class");

        return matchesSearch && matchesType;
    });

    filtered = filtered.filter(a => !isNaN(getTimeValue(a)));

    const sortValue = sortSelect.value;

    filtered.sort((a, b) => {
        switch (sortValue) {
            case "date-asc":    return getTimeValue(a) - getTimeValue(b);
            case "date-desc":   return getTimeValue(b) - getTimeValue(a);
            case "title-asc":   return a.title.localeCompare(b.title);
            case "title-desc":  return b.title.localeCompare(a.title);
            case "duration-asc":  return a.duration - b.duration;
            case "duration-desc": return b.duration - a.duration;
            default:            return getTimeValue(a) - getTimeValue(b);
        }
    });

    // Clear old rows
    tableBody.innerHTML = "";

    if (filtered.length === 0) {
        tableEmpty.classList.remove("hidden");
    } else {
        tableEmpty.classList.add("hidden");
        filtered.forEach(activity => {
            tableBody.appendChild(createRow(activity, regex));
        });
    }
}

// Build one table row per activity
function createRow(a, regex = null) {
    const tr = document.createElement("tr");

    const displayTitle = regex ? highlight(a.title, regex) : a.title;

    // format tags as #tag pills then highlight if needed
    const formattedTags = (a.tags || "")
        .split(/[,\s]+/)
        .filter(Boolean)
        .map(tag => `#${tag.replace(/^#/, "")}`)
        .join(" ");

    const displayTags = regex ? highlight(formattedTags, regex) : formattedTags;

    const typeBadge = a.type === "event"
        ? `<span class="card-type-badge event">Event</span>`
        : `<span class="card-type-badge class">Class</span>`;

    // show end date only when it's different from start date
    const dateDisplay = a.endDate && a.endDate !== a.startDate
        ? `${a.startDate} → ${a.endDate}`
        : a.startDate;

    tr.innerHTML = `
        <td data-label="Title" class="card-title">${displayTitle}</td>
        <td data-label="Type">${typeBadge}</td>
        <td data-label="Date">${dateDisplay}</td>
        <td data-label="Time">${formatTime(a.startTime)} – ${formatTime(a.endTime)}</td>
        <td data-label="Duration">${formatDuration(a.duration)}</td>
        <td data-label="Location">${a.location || "—"}</td>
        <td data-label="Tags"><span class="card-tag">${displayTags || "—"}</span></td>
        <td data-label="Actions" class="row-actions">
            <button class="edit-btn">Edit</button>
            <button class="delete-btn">Delete</button>
        </td>
    `;

    tr.querySelector(".edit-btn").addEventListener("click", () => openModal(a));

    tr.querySelector(".delete-btn").addEventListener("click", () => {
        deleteTargetId = a.id;
        deleteModal.classList.remove("hidden");
    });

    return tr;
}