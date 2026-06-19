
import { loadFromStorage, announce, announceUrgent, loadSettings, applySavedTheme } from "./storage.js";
let activities = [];

//DOM 
const totalEventsEl = document.getElementById("total-events");
const campusEventsEl = document.getElementById("campus-events-count");
const classesEl = document.getElementById("classes-count");
const weeklyEl = document.getElementById("weekly-events");
const todayEl = document.getElementById("today-events");
const capStatusEl = document.getElementById("cap-status");
const totalDurationEl = document.getElementById("total-duration");
const topTagEl = document.getElementById("top-tag");
const trendChartEl = document.getElementById("trend-chart");

const happeningNow = document.querySelector("#happening-now .dashboard-cards");
const upcoming = document.querySelector("#upcoming-events .dashboard-cards");

//Helper Functions
function sync() {
    activities = loadFromStorage();
}

function getStartTime(activity) {
    return new Date(
        `${activity.startDate}T${activity.startTime}`
    ).getTime();
}

function formatTime(timeStr) {
    if (!timeStr) return "";

    const [hour, minute] = timeStr.split(":").map(Number);

    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;

    return `${displayHour}:${minute
        .toString()
        .padStart(2, "0")} ${period}`;
}

function formatDuration(minutes) {
    if (!minutes) return "—";

    const settings = loadSettings();

    if (settings.timeUnit === "hours") {
        const hours = (minutes / 60).toFixed(1);
        return `${hours} hr`;
    }

    return `${minutes} min`;
}

function isToday(activity) {
    const today = new Date().toISOString().split("T")[0];
    return activity.startDate === today;
}

function isThisWeek(activity) {
    const now = new Date();

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());

    return new Date(activity.startDate) >= startOfWeek;
}
// adds up the duration of every activity happening this week
function getWeeklyTotalMinutes() {
    return activities
        .filter(isThisWeek)
        .reduce((sum, a) => sum + (a.duration || 0), 0);
}

// compares the weekly total against the cap and announces it to screen readers
function updateCapStatus() {
    if (!capStatusEl) return;

    const settings = loadSettings();
    const cap = settings.weeklyCap || 0;
    const used = getWeeklyTotalMinutes();
    const remaining = cap - used;

    if (remaining >= 0) {
        capStatusEl.textContent = `${remaining} min left`;
        announce(`You have ${remaining} minutes left this week before reaching your cap.`);
    } else {
        capStatusEl.textContent = `${Math.abs(remaining)} min over`;
        announceUrgent(`You are ${Math.abs(remaining)} minutes over your weekly cap.`);
    }
}

function isHappeningNow(activity) {
    const now = Date.now();

    const start = new Date(
        `${activity.startDate}T${activity.startTime}`
    ).getTime();

    const endDate = activity.endDate || activity.startDate;

    const end = new Date(
        `${endDate}T${activity.endTime}`
    ).getTime();

    return now >= start && now <= end;
}

//Stats
function updateStats() {
    totalEventsEl.textContent = activities.length;

    campusEventsEl.textContent =
        activities.filter(a => a.type === "event").length;

    classesEl.textContent =
        activities.filter(a => a.type === "class").length;

    todayEl.textContent =
        activities.filter(isToday).length;

    weeklyEl.textContent =
        activities.filter(isThisWeek).length;

    // add up every activity's duration for a rough "total time tracked" stat
    const totalMinutes = activities.reduce((sum, a) => sum + (a.duration || 0), 0);
    totalDurationEl.textContent = formatDuration(totalMinutes);

    topTagEl.textContent = getTopTag();
}

// looks through every activity's tags and returns whichever tag shows up most
function getTopTag() {
    const counts = {};

    activities.forEach(a => {
        if (!a.tags) return;

        a.tags.split(/[,\s]+/).filter(Boolean).forEach(tag => {
            counts[tag] = (counts[tag] || 0) + 1;
        });
    });

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);

    return sorted.length ? sorted[0][0] : "—";
}

// draws a simple bar for each of the last 7 days showing how many activities started that day
function renderTrendChart() {
    if (!trendChartEl) return;

    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().split("T")[0]);
    }

    const counts = days.map(day =>
        activities.filter(a => a.startDate === day).length
    );

    const max = Math.max(...counts, 1);

    trendChartEl.innerHTML = days.map((day, i) => {
        const heightPercent = (counts[i] / max) * 100;
        const label = day.slice(5); // just show MM-DD

        return `
            <div class="trend-bar-wrap">
                <div class="trend-bar" style="height:${heightPercent}%"></div>
                <span class="trend-label">${label}</span>
            </div>
        `;
    }).join("");
}

function createCard(activity) {
    const div = document.createElement("div");
    div.classList.add("card");
    const formattedTags = activity.tags
    ? activity.tags
        .split(/[,\s]+/)
        .filter(Boolean)
        .map(tag => `#${tag}`)
        .join(" ")
    : "";
    
    div.innerHTML = `
        <span class="card-type-badge ${activity.type}">${activity.type === "event" ? "Event" : "Class"}</span>
        <h3 class="card-title">${activity.title}</h3>
        <p class="card-meta"><strong>Date:</strong> ${activity.startDate}${activity.endDate && activity.endDate !== activity.startDate ? " → " + activity.endDate : ""}</p>
        <p class="card-meta"><strong>Time:</strong> ${formatTime(activity.startTime)} – ${formatTime(activity.endTime)}</p>
        <p class="card-meta"><strong>Duration:</strong> ${formatDuration(activity.duration)}</p>
        <p class="card-meta"><strong>Location:</strong> ${activity.location || "Not specified"}</p>
        ${formattedTags ? `<span class="card-tag">${formattedTags}</span>` : ""}
    `;

    return div;
}

function renderHappeningNow() {
    const current = activities.filter(isHappeningNow);

    happeningNow.innerHTML = "";

    if (current.length === 0) {
        happeningNow.innerHTML = `
            <div class="empty-state">
                No activities currently happening.
            </div>
        `;
        return;
    }

    current.forEach(activity => {
        happeningNow.appendChild(createCard(activity));
    });
}

//Upcoming(shows next 3 events happening after)
function renderUpcoming() {
    const now = Date.now();

    const upcomingActivities = activities
        .filter(activity => getStartTime(activity) > now)
        .sort(
            (a, b) =>
                getStartTime(a) - getStartTime(b)
        )
        .slice(0, 3);

    upcoming.innerHTML = "";

    if (upcomingActivities.length === 0) {
        upcoming.innerHTML = `
            <div class="empty-state">
                No upcoming activities.
            </div>
        `;
        return;
    }

    upcomingActivities.forEach(activity => {
        upcoming.appendChild(createCard(activity));
    });
}

// init app: load data from storage or seed file, then show everything on screen
async function init() {
    const stored = localStorage.getItem("activities");
    if (!stored) {
        // use a relative path so this still works once deployed on GitHub Pages
        const res = await fetch("./seed.json")
        activities = await res.json();
        localStorage.setItem("activities", JSON.stringify(activities));
    } else {
        activities = JSON.parse(stored);
    }

    initDashboard();
}

function initDashboard() {
    sync();

    updateStats();
    renderTrendChart();
    renderHappeningNow();
    renderUpcoming();

    announce(`Dashboard updated. ${activities.length} total activities.`);

    // cap status goes last so it's the most recent thing a screen reader announces
    updateCapStatus();
}
applySavedTheme();
document.addEventListener("DOMContentLoaded", init);


