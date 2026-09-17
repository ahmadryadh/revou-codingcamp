# BudgetViz – Code Conventions

## JavaScript

### General Rules

- Always `'use strict';` at the top of `app.js`.
- ES6+ syntax only: `const`/`let`, arrow functions, template literals, destructuring.
- No `var`. No `document.write`. No inline `onclick` attributes.
- All DOM manipulation goes through the central `dom` object — never query the DOM ad-hoc inside render functions.

### Naming

| Thing               | Convention          | Example                    |
|---------------------|---------------------|----------------------------|
| Variables/functions | camelCase           | `renderList`, `viewMonth`  |
| Constants           | SCREAMING_SNAKE     | `STORAGE_KEY`              |
| DOM ref object      | `dom.propName`      | `dom.transactionList`      |
| CSS classes (in JS) | string literals     | `'tag-Food'`, `'hidden'`   |

### DOM Access Pattern

All element references live in the `dom` object at module scope, resolved once at startup via `const $ = id => document.getElementById(id)`. Never call `document.getElementById` or `querySelector` inside render loops.

### State

Three module-level state variables:

```js
let transactions    = [];  // source of truth for all spending data
let customCategories = []; // user-defined categories, persisted separately
let chart           = null; // Chart.js instance, null when no data
```

`viewMonth` (a `Date`) tracks the currently displayed month in the monthly summary.

### Render Pipeline

Any data change must call the master `render()` function, which calls all four sub-renderers in order:

```
render()
  ├── renderBalance()
  ├── renderChart()
  ├── renderList()
  └── renderMonthlySummary()
```

Never call sub-renderers in isolation after a data mutation — always call `render()` so the whole UI stays in sync.

Exception: `renderMonthlySummary()` is called directly when the user navigates months, because no data changed.

### Event Listeners

- Register all listeners after the `dom` object is defined.
- Use **event delegation** on `dom.transactionList` for delete buttons — never attach per-item listeners.
- Form submission: always `e.preventDefault()` and run `validateForm()` before touching state.

### Storage

- `saveTransactions()` and `saveCategories()` are the only functions that write to `localStorage`.
- Always wrap `JSON.parse` calls in try/catch and default to `[]` on failure.

### Error Handling

- Validation errors are shown via `field-error` spans; add the `.error` class to the input.
- Always call `clearErrors()` before re-validating.
- Never use `alert()` except for the destructive "Clear All" confirmation `confirm()`.

## HTML

- One `<section>` per logical UI block, each with an `aria-label`.
- All interactive elements have either a visible text label or an `aria-label`.
- IDs match the keys in the `dom` object exactly.
- No inline styles in HTML — all styling via CSS classes.

## CSS

See `design-system.md` for the design token reference. Conventions:

- All spacing, color, and radius values use CSS custom properties — never hard-code hex or px values directly in rules.
- Add new components at the bottom of the file under a clearly named section comment (`/* ── New Section ── */`).
- Mobile styles are the default; tablet/desktop overrides go in `@media (min-width: ...)` blocks at the end.
- The `.hidden` utility class (`display: none !important`) is the only JS-toggled visibility mechanism.
