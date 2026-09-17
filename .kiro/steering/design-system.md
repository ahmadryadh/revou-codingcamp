# BudgetViz – Design System

**Style:** Soft & Friendly Pastel (Style C)
**Mode:** Light default, dark mode via `[data-theme="dark"]` on `<html>`

---

## Color Tokens

All colors are CSS custom properties on `:root`. Always reference via `var(--token-name)` — never hard-code hex values in rules.

### Backgrounds

| Token              | Light     | Dark      | Usage                                        |
|--------------------|-----------|-----------|----------------------------------------------|
| `--bg-page`        | `#f5f0ff` | `#1a1528` | Page body                                    |
| `--bg-card`        | `#ffffff` | `#241d38` | Card surfaces, sticky header                 |
| `--bg-input`       | `#faf8ff` | `#2e2547` | Inputs, stat blocks, transaction items       |
| `--bg-input-focus` | `#ffffff` | `#362c54` | Input background on focus                    |

### Category Tag Backgrounds

| Token                | Light     | Dark      |
|----------------------|-----------|-----------|
| `--bg-tag-food`      | `#fff1e6` | `#3d1f00` |
| `--bg-tag-transport` | `#e6f4ff` | `#003152` |
| `--bg-tag-fun`       | `#f0e6ff` | `#2d1566` |
| `--bg-tag-custom`    | `#e6fff4` | `#003322` |

### Text

| Token             | Light     | Dark      | Usage                              |
|-------------------|-----------|-----------|------------------------------------|
| `--txt-primary`   | `#2d2250` | `#ede9fe` | Headlines, item names              |
| `--txt-secondary` | `#7c6fa0` | `#c4b5fd` | Card titles, form labels           |
| `--txt-muted`     | `#a99cc8` | `#7c6fa0` | Placeholders, meta text, footer    |

### Category Tag Text

| Token                 | Light     | Dark      |
|-----------------------|-----------|-----------|
| `--txt-tag-food`      | `#c2440e` | `#fdba74` |
| `--txt-tag-transport` | `#0369a1` | `#7dd3fc` |
| `--txt-tag-fun`       | `#6d28d9` | `#c4b5fd` |
| `--txt-tag-custom`    | `#065f46` | `#6ee7b7` |

### Accent & Action

| Token           | Light     | Dark      | Usage                                   |
|-----------------|-----------|-----------|-----------------------------------------|
| `--accent`      | `#a78bfa` | `#a78bfa` | Primary buttons, focus rings, nav btns  |
| `--accent-dark` | `#7c3aed` | `#c4b5fd` | Button hover, amount text               |
| `--accent-light`| `#ede9fe` | `#2d1566` | Secondary button bg, theme toggle bg    |
| `--danger`      | `#f87171` | `#f87171` | Delete button, error borders            |
| `--danger-dark` | `#dc2626` | `#fca5a5` | Delete hover state                      |
| `--danger-bg`   | `#fff1f2` | `#3b1010` | Clear All button background             |

### Balance Card Gradient

```css
--balance-grad: linear-gradient(135deg, #c4b5fd 0%, #a78bfa 50%, #818cf8 100%);
```

Always apply to `.balance-card` — never flatten it to a solid color.

### Border & Shadow

| Token         | Light                                  | Dark                          |
|---------------|----------------------------------------|-------------------------------|
| `--border`    | `#ede8fb`                              | `#3b2f60`                     |
| `--shadow-sm` | `0 2px 8px rgba(167,139,250,0.10)`     | `0 2px 8px rgba(0,0,0,0.30)`  |
| `--shadow-md` | `0 4px 20px rgba(167,139,250,0.15)`    | `0 4px 20px rgba(0,0,0,0.35)` |
| `--shadow-lg` | `0 8px 32px rgba(167,139,250,0.20)`    | `0 8px 32px rgba(0,0,0,0.40)` |

---

## Border Radius

| Token      | Value   | Usage                                       |
|------------|---------|---------------------------------------------|
| `--r-sm`   | `8px`   | Small internal elements                     |
| `--r-md`   | `14px`  | Inputs, transaction items, stat blocks      |
| `--r-lg`   | `20px`  | Cards                                       |
| `--r-xl`   | `28px`  | Balance card                                |
| `--r-pill` | `999px` | All buttons, filter select, category tags   |

---

## Typography

**Font stack:** `'Segoe UI', system-ui, -apple-system, sans-serif`
**Base size:** `16px`

| Element         | Size      | Weight | Notes                                     |
|-----------------|-----------|--------|-------------------------------------------|
| Balance amount  | `2.6rem`  | 800    | Shrinks to `2rem` on mobile (≤580px)      |
| Page title      | `1.15rem` | 700    |                                           |
| Card title      | `1rem`    | 700    |                                           |
| Item name       | `0.92rem` | 700    |                                           |
| Item amount     | `0.9rem`  | 700    | Color: `--accent-dark`                    |
| Form label      | `0.78rem` | 700    | Uppercase, `letter-spacing: 0.5px`        |
| Tag / meta text | `0.7rem`  | 700    |                                           |
| Footer          | `0.75rem` | 400    |                                           |

---

## Component Reference

### Buttons

| Class           | Shape | Background       | Use case                   |
|-----------------|-------|------------------|----------------------------|
| `.btn-primary`  | pill  | `--accent`       | Form submit                |
| `.btn-secondary`| pill  | `--accent-light` | Add custom category        |
| `.btn-clear`    | pill  | `--danger-bg`    | Clear All                  |
| `.delete-btn`   | pill  | `--danger`       | Per-item delete            |
| `.btn-link`     | none  | transparent      | Toggle custom category form|

`.btn-primary` lifts `translateY(-2px)` on hover with an enhanced purple box-shadow.

### Cards

All standard cards share the `.card` base:

```css
background: var(--bg-card);
border: 1px solid var(--border);
border-radius: var(--r-lg);   /* 20px */
padding: 22px 20px;
box-shadow: var(--shadow-md);
```

The `.balance-card` overrides everything — it uses `--balance-grad`, `--r-xl`, no border, and `--shadow-lg`.

### Category Tags

Apply `.item-tag` plus a category modifier class:

```html
<span class="item-tag tag-Food">🍔 Food</span>
<span class="item-tag tag-Transport">🚗 Transport</span>
<span class="item-tag tag-Fun">🎮 Fun</span>
<span class="item-tag tag-custom">📌 Health</span>
```

The modifier maps to `--bg-tag-*` and `--txt-tag-*` tokens.

### Form Inputs

Default state: `--bg-input` background, `--border` border, `--r-md` radius.
Focus state: `--accent` border, `--bg-input-focus` background, `0 0 0 3px rgba(167,139,250,0.20)` ring.
Error state: `--danger` border, `0 0 0 3px rgba(248,113,113,0.18)` ring + `.error` class on the input.

### Animations

| Element           | Animation                                      |
|-------------------|------------------------------------------------|
| Transaction items | `fadeUp`: opacity 0→1 + translateY 6px→0, 0.2s |
| All interactions  | `transition: 0.2s ease` (`--ease`)             |
| Chart updates     | `400ms` duration via Chart.js options          |

---

## Layout

### Page Structure (top to bottom)

```
<header class="page-header">   sticky, centered title, theme toggle right
<main class="page-main">
  .balance-card                full width, gradient
  .card.monthly-card           full width
  .card.form-card              full width
  .bottom-row                  flex row, two equal halves
    .card.list-card            flex: 1 1 0
    .card.chart-card           flex: 1 1 0
<footer class="page-footer">
```

Max content width: `860px`, centered with `margin: 0 auto`.
Column gap on `.bottom-row`: `18px`.

### Breakpoints

| Width    | Change                                                       |
|----------|--------------------------------------------------------------|
| ≤ 580px  | `.bottom-row` stacks vertically; balance shrinks to `2rem`   |
| ≥ 580px  | Main padding `28px 24px`                                     |
| ≥ 860px  | Main padding `32px 32px`                                     |

Mobile styles are always the default — desktop overrides use `min-width` only.
