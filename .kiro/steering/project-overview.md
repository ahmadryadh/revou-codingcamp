# BudgetViz – Project Overview

## What This Project Is

BudgetViz is a mobile-friendly, client-side expense and budget visualizer built for the RevoU Coding Camp. It runs entirely in the browser with no backend, no build step, and no framework dependencies.

## Tech Stack

| Layer     | Technology                                         |
|-----------|----------------------------------------------------|
| Structure | HTML5 (semantic, ARIA-labelled)                    |
| Style     | Vanilla CSS (custom properties, mobile-first)      |
| Logic     | Vanilla JavaScript (ES6+, strict mode)             |
| Chart     | Chart.js 4.4.0 via CDN                             |
| Storage   | Browser `localStorage` only                        |

## File Structure Rules

```
revou-codingcamp/
├── index.html        ← single page, all markup lives here
├── css/
│   └── style.css     ← ONE file only, no additional stylesheets
└── js/
    └── app.js        ← ONE file only, no modules or bundlers
```

- Never add a second CSS or JS file.
- Never introduce a framework (React, Vue, Alpine, etc.).
- Never add a build step or package.json.
- Chart.js is the only permitted external library.

## localStorage Keys

| Key                        | Contents                               |
|----------------------------|----------------------------------------|
| `budgetviz_transactions`   | JSON array of transaction objects      |
| `budgetviz_categories`     | JSON array of custom category objects  |
| `budgetviz_theme`          | `"light"` or `"dark"`                 |

## Transaction Object Shape

```js
{
  id:       string,   // generateId() — timestamp+random base-36
  name:     string,   // 1–60 chars
  amount:   number,   // positive float, stored in Rp
  category: string,   // built-in or custom category name
  date:     string,   // ISO 8601 date: "YYYY-MM-DD"
}
```

## Custom Category Object Shape

```js
{
  name:  string,  // 1–30 chars, title-cased
  emoji: string,  // always "📌" for user-created categories
}
```

## Built-in Categories

| Name      | Emoji | Chart Color |
|-----------|-------|-------------|
| Food      | 🍔    | `#fb923c`   |
| Transport | 🚗    | `#60a5fa`   |
| Fun       | 🎮    | `#c084fc`   |

Custom categories cycle through the remaining `CHART_COLORS` palette starting at index 3.

## Currency & Locale

- All amounts are in **Indonesian Rupiah (Rp)**.
- Format: `'Rp ' + Number(n).toLocaleString('id-ID')` — produces `Rp 25.000`.
- Dates are formatted with `toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' })`.
