# Campus Life Planner

Live Site: [audrey934.github.io/Campus-life-planner](https://audrey934.github.io/Campus-life-planner/)


---

## What This Is

Campus Life Planner is a web app built for the ALU Building Responsive UI summative. Campus life has a lot going on at once: classes, events, workshops, sports, and more. Instead of keeping track of everything in your head or scattered across note-taking apps, this gives you one place to log it all, see what's coming up, and keep an eye on how much time you're actually spending on activities each week.

You can add any activity as either a Campus Event or a Class, fill in the dates, times, location, and tags, and it all saves to your browser automatically. The dashboard gives you a live overview — what's happening right now, what's coming up next, and a 7-day bar chart showing how busy the week has been. There's also a weekly cap feature: you set a limit in hours, and the dashboard tells you how much time you have left — or how far over you've gone.

The app works fully offline, supports light and dark mode, and was built with accessibility in mind from the start, with keyboard navigation, screen reader announcements, proper semantic HTML, visible focus styles, and a skip link on every page.

---

## Chosen Theme

**Campus Life Planner** — the events/tasks/duration theme from the assignment options.

---

## Pages

| Page | File | What it does |
|------|------|-------------|
| Dashboard | `index.html` | Stats, happening-now cards, upcoming activities, trend chart |
| Events & Classes | `events.html` | The main table: add, edit, delete, search, filter, sort |
| About & Settings | `about.html` | App info, contact, settings (theme, time unit, weekly cap), import/export |
| Test Suite | `tests.html` | Open in browser to run all validator assertions |

---

## Features

- Add, edit, and delete activities with a modal form
- Two types: Campus Event and Class — each gets a colour-coded badge
- One unified table on the Events page; filter buttons narrow it to Events only or Classes only
- Live regex search across titles and tags as you type
- Case-sensitive toggle on the search box
- Matched text highlighted with `<mark>` inline
- Sort by date, title (A–Z / Z–A), or duration (shortest/longest)
- Dashboard stats: total activities, events count, classes count, today's count, this week's count, total time tracked, top tag, weekly cap status
- 7-day bar chart built with pure JS and CSS — no libraries
- The " Happening Now section shows any activity currently in progress
- Upcoming section shows the next 3 activities sorted by start time
- Weekly activity cap: set a limit in hours from the Settings page; dashboard shows how much is left or how much you're over, and announces it to screen readers
- Duration display toggle: switch between showing minutes or hours globally
- Light and dark themes both persisted in localStorage
- Full localStorage persistence — data survives page refresh and browser close
- JSON export (downloads your full activity list as a file)
- JSON import (validates structure before loading)
- Reset button clears all data and reloads the seed records
- Skip-to-content link on every page
- All state changes announced to screen readers via aria-live regions

---

## File Structure

```
Campus-life-planner/
├── index.html          # Dashboard
├── events.html         # Events & Classes table
├── about.html          # About, Settings, Data Management
├── tests.html          # Validator test suite
├── seed.json           # 12 seed records loaded on first visit
├── styles/
│   └── style.css       # All styles, mobile-first, 3 breakpoints
├── scripts/
│   ├── storage.js      # localStorage helpers, settings, ARIA announce
│   ├── validators.js   # All regex validation functions
│   ├── search.js       # compileRegex, highlight, matchesPattern
│   ├── ui.js           # Events page logic — rendering, form, sort, filter, search
│   ├── dashboard.js    # Dashboard logic — stats, chart, happening-now, upcoming
│   └── nav.js          # Active nav link highlighting
└── assets/
```

### What each script does

**`storage.js`** handles everything that touches localStorage. It exports `saveToStorage`, `loadFromStorage`, `saveSettings`, `loadSettings`, `applySavedTheme`, and the two ARIA helpers `announce` and `announceUrgent`. Every other module imports from here instead of touching localStorage directly.

**`validators.js`** is purely about checking inputs. Six exported functions — one per validation rule — plus the safe regex compiler and highlight helper used by the test suite.

**`search.js`** handles search. It exports `compileRegex`, `highlight`, and `matchesPattern`. `ui.js` imports from here; `tests.html` imports the same functions from `validators.js`. The two files have separate copies so the responsibilities stay clean.

**`ui.js`** runs the Events and About pages. It manages the `activities` array in memory, handles the form, wires up all event listeners, runs all validation on submit, and re-renders the table on every state change.

**`dashboard.js`** is read-only — it just reads from localStorage on load and renders the stats, chart, and cards. It doesn't touch the form or handle any user input beyond the initial load.

**`nav.js`** runs on all three pages. It checks `window.location.pathname` and adds `active-page` to whichever nav link matches.

---

## Data Model

```json
{
  "id": 1749290400000,
  "title": "Orientation Week Opening",
  "type": "event",
  "startDate": "2026-06-24",
  "endDate": "2026-06-24",
  "startTime": "09:00",
  "endTime": "12:00",
  "duration": 180,
  "location": "Main Auditorium",
  "tags": "ALU orientation",
  "createdAt": "2026-06-10T08:00:00.000Z",
  "updatedAt": "2026-06-10T08:00:00.000Z"
}
```

`duration` is always stored in minutes — the time unit setting only changes how it displays. The weekly cap is also stored in minutes internally; the Settings page converts to/from hours for the user.

---

## Regex Catalog

### Validation — `validators.js`

#### 1. Title — no leading or trailing whitespace
```
/^\S(?:.*\S)?$/
```
`^\S` means the first character must not be a space. `(?:.*\S)?` means if there are more characters, the last one also cannot be a space. The `?` makes the whole group optional so a single character passes.

| Input | Result |
|-------|--------|
| `"Orientation Week"` | pass |
| `" Orientation"` | fail — leading space |
| `"Orientation "` | fail — trailing space |
| `""` | fail — empty |
| `"   "` | fail — only spaces |

---

#### 2. Date — YYYY-MM-DD format
```
/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/
```
Validates the format and catches impossible months (00, 13+) and days (00, 32+). Doesn't catch February 30 — that would need extra JS logic beyond regex.

| Input | Result |
|-------|--------|
| `"2026-06-19"` | pass |
| `"2026-13-01"` | fail: month 13 |
| `"2026-01-32"` | fail: day 32 |
| `"19-06-2026"` | fail: wrong format |

---

#### 3. Time — 24-hour HH:MM
```
/^([01]\d|2[0-3]):[0-5]\d$/
```
Hours 00–23, minutes 00–59. Rejects anything with AM/PM or missing leading zeros.

| Input | Result |
|-------|--------|
| `"09:00"` | pass |
| `"23:59"` | pass |
| `"24:00"` | fail |
| `"2:30 PM"` | fail |

---

#### 4. Tags — letters and numbers, spaces or hyphens only
```
/^[A-Za-z0-9]+(?:[ -][A-Za-z0-9]+)*$/
```
Each word is alphanumeric. Words can be joined by a single space or hyphen. No special characters, no double spaces, no leading/trailing hyphens.

| Input | Result |
|-------|--------|
| `"sports football"` | pass |
| `"team-building"` | pass |
| `"CS101"` | pass |
| `"exam!"` | fail |
| `"-sports"` | fail |

---

#### 5. Numbers — non-negative, max 2 decimal places
```
/^(0|[1-9]\d*)(\.\d{1,2})?$/
```
Allows `0`, whole numbers without leading zeros, and decimals up to 2 places.

| Input | Result |
|-------|--------|
| `"60"` | pass |
| `"1.5"` | pass |
| `"01"` | fail leading zero |
| `"1.234"` | fail:3 decimal places |
| `"-5"` | fail:negative |

---

#### 6. Duplicate word detection — back-reference (advanced)
```
/\b(\w+)\s+\1\b/i
```
This one uses a back-reference. `(\w+)` captures a word, then `\1` checks if the exact same word appears right after it separated by whitespace. The `i` flag makes it case-insensitive so `"The the"` also fires. Used on the title field to catch typos like `"Game Game Night"`.

| Input | Result |
|-------|--------|
| `"please review review"` | detected: blocked |
| `"Exam Exam schedule"` | detected:blocked |
| `"Career Fair Today"` | not detected:allowed |

---

### Search — `search.js`

The search box on the Events page takes any regex pattern. `compileRegex` wraps `new RegExp(input, flags)` in a try/catch — if the pattern is invalid it returns `null` and the search just shows everything instead of crashing.

**Example patterns to try:**

| Pattern | Finds |
|---------|-------|
| `exam` | Anything with "exam" in title or tags |
| `^Data` | Titles that start with "Data" |
| `sports\|football` | Either word in title or tags |
| `\b\d{2}:\d{2}\b` | Titles containing a time token like `14:30` |
| `[A-Z]{3,}` | Titles with 3 or more consecutive capitals |
| `(career\|workshop)` | Career or workshop entries |

---

## Keyboard Map

| Action | How |
|--------|-----|
| Move between elements | `Tab` / `Shift+Tab` |
| Activate button or link | `Enter` |
| Toggle case-sensitive search | `Space` on the checkbox |
| Jump past nav to content | `Tab` to skip link → `Enter` |
| Search | Tab to search box → type |
| Change sort | Tab to sort dropdown → `↑↓` |
| Switch filter | Tab to filter button → `Enter` |
| Open add form | Tab to "+ Add Event/Class" → `Enter` |
| Submit form | Tab through fields → `Enter` on Save |
| Close form | Tab to Cancel → `Enter` |
| Edit a record | Tab to Edit button → `Enter` |
| Delete a record | Tab to Delete → `Enter` → Tab to Yes → `Enter` |
| Change time unit | Tab to Time Unit select → `↑↓` |
| Change theme | Tab to Theme select → `↑↓` |
| Set weekly cap | Tab to cap input → type hours → `Tab` away to save |
| Export data | Tab to Export JSON → `Enter` |
| Import data | Tab to file input → `Enter` → select file → Tab to Import JSON → `Enter` |
| Reset all data | Tab to Reset → `Enter` → confirm dialog |

---

## Accessibility Notes

**Landmarks and headings** — every page uses `<header>`, `<nav>`, `<main>`, and `<footer>`. Headings go `h1` → `h2` → `h3` without skipping levels. Dashboard stat cards use `<article>`.

**Skip link** — the very first focusable element on every page is a skip link pointing to `#main-content`. It sits offscreen at `top: -40px` until focused, then slides into view via `transition: top 0.3s ease`.

**Labels** — every input and select has a `<label>` tied to it by matching `id` and `for` attributes. Nothing is labelled by placeholder text alone.

**ARIA live regions** — two levels of announcement:
- `aria-live="polite"` / `role="status"` — for confirmations: saved, deleted, exported, imported, settings changed, cap updated
- `aria-live="assertive"` — for errors and urgent alerts: form validation errors (`role="alert"` on `#form-errors`), weekly cap exceeded

**Focus styles** — `:focus` globally applies `outline: 3px solid #4A0E8F; outline-offset: 2px`. Never removed.

**Modals** — use `display: none` via the `hidden` class when closed, which removes them from the tab order completely so you can't accidentally tab into a hidden modal.

**Color contrast** — primary purple `#4A0E8F` on white passes WCAG AA at normal text sizes.

---

## Responsive Design

Written mobile-first. Three breakpoints:

| Breakpoint | Change |
|------------|--------|
| Base (all screens) | Single column, stacked layout, table rows become labeled cards on very small screens |
| `max-width: 480px` | Table header hidden; each row becomes a block card with `data-label` prefixes via CSS `::before` |
| `min-width: 768px` | Stats grid goes 2-column; form rows go side by side |
| `min-width: 1024px` | Stats grid goes 3-column; main content caps at 1100px and centres |

Animations and transitions used:
- Skip link slide-in on focus
- Nav link hover highlight
- Card hover lift (`transform: translateY(-4px)`)
- Trend bar height change (`transition: height 0.3s ease`)
- Table row background on hover

---

## How to Run Tests

No build tools needed. Just open `tests.html` in a browser.


### Test groups

| Group | What's tested |
|-------|--------------|
| `validateTitle` | Normal titles pass; leading space, trailing space, empty string, whitespace-only all fail |
| `validateNumber` | Integers and decimals pass; leading zeros, 3+ decimal places, letters, negatives fail |
| `validateDate` | Valid YYYY-MM-DD passes; bad months, bad days, wrong format fail |
| `validateTime` | 00:00–23:59 passes; 24:00, missing zeros, AM/PM format fail |
| `validateTag` | Letters, numbers, spaces, hyphens pass; special characters and leading hyphens fail |
| `detectDuplicateWords` | Repeated adjacent words detected; normal sentences pass |
| `compileRegex` | Valid patterns return a RegExp; invalid patterns, empty strings, and non-strings return null |
| `matchesPattern` | Returns true on match, false on no match, true when no regex given |
| `highlight` | Wraps matches in mark tags; returns original text when no regex; handles empty input safely |

---

## Import / Export

**Export** — click Export JSON on the About page. Downloads your current activities as `campus-life-planner-export.json`.

**Import**
1. Click the file input on the About page and select a `.json` file
2. Click Import JSON
3. The app checks: is it valid JSON? is it an array? does every record have `id`, `title`, and `startDate`?
4. If it passes, the records replace what's currently in the app and the table re-renders

**Reset** — click Reset on the About page. After confirming, localStorage is cleared and the page redirects to Events where the seed data loads fresh.

---

## Settings

All on the About page, all persisted to localStorage under the key `campus-settings`.

| Setting | Options | What it does |
|---------|---------|-------------|
| Time Unit | Minutes / Hours | Changes how duration shows everywhere — table, dashboard, cards |
| Theme | Light / Dark | Toggles `dark-theme` on `<body>` |
| Weekly Activity Cap | Number in hours (e.g. 10) | Stored as minutes; dashboard shows remaining or overage |

---

## Seed Data

`seed.json` has 12 records that cover a good range of edge cases:

| Record | What it tests |
|--------|--------------|
| Orientation Week Opening | Long event (3 hrs), same start and end date |
| Typing Tech Workshop | Class with an empty end date field |
| Self Directed Learning | Past date — shows up in the trend chart history |
| Game Night | Evening hours, social tag |
| Kwibuka Memorial Event | Multi-day span — end date different from start date |
| Data Structures Lecture | Three-word tag string |
| Campus Football Match | Short two-word tag pair |
| Career Guidance Workshop | 2.5 hrs — non-round duration |
| Database Systems Class | Three tags, morning class |
| Cultural Night Rehearsal | Three tags, evening time |
| Quick Library Card Pickup | 15 minutes — shortest duration edge case |
| Student's Council All-Day Retreat | 8 hours — longest duration edge case |

---
*Campus Life Planner*  
*Audrey Noella Hategekimana · [a.hategekim@alustudent.com](mailto:a.hategekim@alustudent.com) · [github.com/audrey934](https://github.com/audrey934)*
