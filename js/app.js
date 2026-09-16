/* ============================================================
   BudgetViz – app.js
   Vanilla JS | localStorage | Chart.js | No frameworks
   ============================================================ */

'use strict';

// ─── Constants ───────────────────────────────────────────────
const STORAGE_KEY      = 'budgetviz_transactions';
const CATEGORIES_KEY   = 'budgetviz_categories';
const THEME_KEY        = 'budgetviz_theme';

const DEFAULT_CATEGORIES = [
  { name: 'Food',      emoji: '🍔' },
  { name: 'Transport', emoji: '🚗' },
  { name: 'Fun',       emoji: '🎮' },
];

// Chart.js color palette for categories (cycles if > palette length)
const CHART_COLORS = [
  '#f97316', // Food      – orange
  '#38bdf8', // Transport – sky
  '#a78bfa', // Fun       – violet
  '#22c55e', // custom 1  – green
  '#f43f5e', // custom 2  – rose
  '#facc15', // custom 3  – yellow
  '#14b8a6', // custom 4  – teal
  '#e879f9', // custom 5  – fuchsia
  '#fb923c', // custom 6  – amber
  '#60a5fa', // custom 7  – blue
];

// ─── State ───────────────────────────────────────────────────
let transactions = [];       // { id, name, amount, category, date }
let customCategories = [];   // { name, emoji }
let chart = null;            // Chart.js instance
let viewMonth = new Date();  // month currently shown in monthly summary

// ─── DOM References ──────────────────────────────────────────
const $ = id => document.getElementById(id);

const dom = {
  totalBalance:        $('totalBalance'),
  transactionCount:    $('transactionCount'),
  themeToggle:         $('themeToggle'),
  themeIcon:           document.querySelector('.theme-icon'),
  form:                $('transactionForm'),
  itemName:            $('itemName'),
  amount:              $('amount'),
  category:            $('category'),
  transactionDate:     $('transactionDate'),
  nameError:           $('nameError'),
  amountError:         $('amountError'),
  categoryError:       $('categoryError'),
  submitBtn:           $('submitBtn'),
  transactionList:     $('transactionList'),
  listEmpty:           $('listEmpty'),
  chartCanvas:         $('spendingChart'),
  chartEmpty:          $('chartEmpty'),
  chartLegend:         $('chartLegend'),
  filterCategory:      $('filterCategory'),
  clearAll:            $('clearAll'),
  toggleCustom:        $('toggleCustomCategory'),
  customCatGroup:      $('customCategoryGroup'),
  customCatInput:      $('customCategory'),
  addCustomCatBtn:     $('addCustomCategory'),
  customCatError:      $('customCategoryError'),
  currentMonthLabel:   $('currentMonthLabel'),
  prevMonth:           $('prevMonth'),
  nextMonth:           $('nextMonth'),
  monthlyStats:        $('monthlyStats'),
};

// ─── Utilities ───────────────────────────────────────────────
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function formatCurrency(num) {
  return 'Rp ' + Number(num).toLocaleString('id-ID');
}

function formatDate(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr + 'T00:00:00');
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getTodayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(date) {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/** Get all categories (built-in + custom) */
function allCategories() {
  return [...DEFAULT_CATEGORIES, ...customCategories];
}

/** Find category meta (emoji etc.) by name */
function getCategoryMeta(name) {
  return allCategories().find(c => c.name === name) || { name, emoji: '📌' };
}

/** Chart color for a given category name */
function colorForCategory(name) {
  const cats = allCategories();
  const idx = cats.findIndex(c => c.name === name);
  return CHART_COLORS[idx >= 0 ? idx % CHART_COLORS.length : CHART_COLORS.length - 1];
}

/** CSS class for category badge */
function categoryClass(name) {
  const builtIn = ['Food', 'Transport', 'Fun'];
  return builtIn.includes(name) ? `cat-${name}` : 'cat-custom';
}

function iconClass(name) {
  const builtIn = ['Food', 'Transport', 'Fun'];
  return builtIn.includes(name) ? `icon-${name}` : 'icon-custom';
}

// ─── Storage ─────────────────────────────────────────────────
function saveTransactions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function loadTransactions() {
  try {
    transactions = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    transactions = [];
  }
}

function saveCategories() {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(customCategories));
}

function loadCategories() {
  try {
    customCategories = JSON.parse(localStorage.getItem(CATEGORIES_KEY)) || [];
  } catch {
    customCategories = [];
  }
}

// ─── Theme ───────────────────────────────────────────────────
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  dom.themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
  localStorage.setItem(THEME_KEY, theme);

  // Update chart colors to match theme
  if (chart) {
    chart.options.plugins.legend.labels.color = theme === 'dark' ? '#e8eaf6' : '#1a1d2e';
    chart.update();
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

function loadTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'light';
  applyTheme(saved);
}

// ─── Category Select ─────────────────────────────────────────
function rebuildCategoryDropdowns() {
  // Main form select
  const sel = dom.category;
  const currentVal = sel.value;

  // Keep first placeholder option, remove the rest
  while (sel.options.length > 1) sel.remove(1);

  allCategories().forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.name;
    opt.textContent = `${cat.emoji} ${cat.name}`;
    sel.appendChild(opt);
  });

  // Restore selection if still valid
  if (currentVal) sel.value = currentVal;

  // Filter dropdown
  const flt = dom.filterCategory;
  const fltVal = flt.value;
  while (flt.options.length > 1) flt.remove(1);

  allCategories().forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.name;
    opt.textContent = `${cat.emoji} ${cat.name}`;
    flt.appendChild(opt);
  });

  if (fltVal) flt.value = fltVal;
}

// ─── Validation ──────────────────────────────────────────────
function clearErrors() {
  dom.nameError.textContent = '';
  dom.amountError.textContent = '';
  dom.categoryError.textContent = '';
  dom.itemName.classList.remove('error');
  dom.amount.classList.remove('error');
  dom.category.classList.remove('error');
}

function validateForm() {
  clearErrors();
  let valid = true;

  const name = dom.itemName.value.trim();
  const amt  = parseFloat(dom.amount.value);
  const cat  = dom.category.value;

  if (!name) {
    dom.nameError.textContent = 'Item name is required.';
    dom.itemName.classList.add('error');
    valid = false;
  }

  if (!dom.amount.value.trim() || isNaN(amt) || amt <= 0) {
    dom.amountError.textContent = 'Enter a valid amount greater than 0.';
    dom.amount.classList.add('error');
    valid = false;
  }

  if (!cat) {
    dom.categoryError.textContent = 'Please select a category.';
    dom.category.classList.add('error');
    valid = false;
  }

  return valid;
}

// ─── Add Transaction ─────────────────────────────────────────
function addTransaction(name, amount, category, date) {
  const tx = {
    id: generateId(),
    name,
    amount: parseFloat(amount),
    category,
    date: date || getTodayISO(),
  };
  transactions.unshift(tx); // newest first
  saveTransactions();
  render();
}

// ─── Delete Transaction ──────────────────────────────────────
function deleteTransaction(id) {
  transactions = transactions.filter(tx => tx.id !== id);
  saveTransactions();
  render();
}

// ─── Clear All ───────────────────────────────────────────────
function clearAll() {
  if (!transactions.length) return;
  if (!confirm('Delete all transactions? This cannot be undone.')) return;
  transactions = [];
  saveTransactions();
  render();
}

// ─── Render Balance ──────────────────────────────────────────
function renderBalance() {
  const total = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  dom.totalBalance.textContent = formatCurrency(total);
  dom.transactionCount.textContent =
    `${transactions.length} transaction${transactions.length !== 1 ? 's' : ''}`;
}

// ─── Render Chart ────────────────────────────────────────────
function renderChart() {
  // Aggregate by category
  const agg = {};
  transactions.forEach(tx => {
    agg[tx.category] = (agg[tx.category] || 0) + tx.amount;
  });

  const labels  = Object.keys(agg);
  const data    = Object.values(agg);
  const colors  = labels.map(colorForCategory);

  const hasData = labels.length > 0;
  dom.chartEmpty.style.display = hasData ? 'none' : 'flex';

  if (!hasData) {
    if (chart) { chart.destroy(); chart = null; }
    dom.chartLegend.innerHTML = '';
    return;
  }

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textColor = isDark ? '#e8eaf6' : '#1a1d2e';

  if (chart) {
    chart.data.labels  = labels;
    chart.data.datasets[0].data   = data;
    chart.data.datasets[0].backgroundColor = colors;
    chart.options.plugins.legend.labels.color = textColor;
    chart.update();
  } else {
    chart = new Chart(dom.chartCanvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: isDark ? '#1a1d2e' : '#ffffff',
          hoverOffset: 10,
        }],
      },
      options: {
        cutout: '60%',
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => {
                const val   = ctx.parsed;
                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                const pct   = ((val / total) * 100).toFixed(1);
                return ` ${formatCurrency(val)} (${pct}%)`;
              }
            }
          }
        },
        animation: { duration: 400 },
      }
    });
  }

  // Custom legend
  dom.chartLegend.innerHTML = labels.map((label, i) => {
    const meta = getCategoryMeta(label);
    const pct  = ((data[i] / data.reduce((a, b) => a + b, 0)) * 100).toFixed(1);
    return `
      <div class="legend-item">
        <span class="legend-dot" style="background:${colors[i]}"></span>
        <span>${meta.emoji} ${label} <strong>${pct}%</strong></span>
      </div>`;
  }).join('');
}

// ─── Render Transaction List ─────────────────────────────────
function renderList() {
  const filterVal = dom.filterCategory.value;
  const filtered  = filterVal === 'all'
    ? transactions
    : transactions.filter(tx => tx.category === filterVal);

  dom.listEmpty.style.display = filtered.length === 0 ? 'block' : 'none';
  dom.transactionList.innerHTML = '';

  filtered.forEach(tx => {
    const meta = getCategoryMeta(tx.category);
    const item = document.createElement('div');
    item.className = 'transaction-item';
    item.setAttribute('role', 'listitem');
    item.dataset.id = tx.id;
    item.innerHTML = `
      <div class="item-icon ${iconClass(tx.category)}" aria-hidden="true">${meta.emoji}</div>
      <div class="item-info">
        <div class="item-name" title="${tx.name}">${tx.name}</div>
        <div class="item-meta">
          <span class="item-category ${categoryClass(tx.category)}">${tx.category}</span>
          ${tx.date ? `<span class="item-date">${formatDate(tx.date)}</span>` : ''}
        </div>
      </div>
      <span class="item-amount">${formatCurrency(tx.amount)}</span>
      <button class="delete-btn" aria-label="Delete ${tx.name}" data-id="${tx.id}">✕</button>
    `;
    dom.transactionList.appendChild(item);
  });
}

// ─── Render Monthly Summary ───────────────────────────────────
function renderMonthlySummary() {
  dom.currentMonthLabel.textContent = monthLabel(viewMonth);

  const mk = monthKey(viewMonth);
  const monthTx = transactions.filter(tx => tx.date && tx.date.startsWith(mk));

  if (monthTx.length === 0) {
    dom.monthlyStats.innerHTML =
      `<p class="monthly-empty" style="grid-column:1/-1">No transactions for this month.</p>`;
    return;
  }

  const total = monthTx.reduce((s, tx) => s + tx.amount, 0);

  // Top category
  const agg = {};
  monthTx.forEach(tx => { agg[tx.category] = (agg[tx.category] || 0) + tx.amount; });
  const topCat = Object.entries(agg).sort((a, b) => b[1] - a[1])[0];
  const topMeta = getCategoryMeta(topCat[0]);

  dom.monthlyStats.innerHTML = `
    <div class="stat-item">
      <span class="stat-label">Total Spent</span>
      <span class="stat-value highlight">${formatCurrency(total)}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">Transactions</span>
      <span class="stat-value">${monthTx.length}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">Top Category</span>
      <span class="stat-value">${topMeta.emoji} ${topCat[0]}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">Avg per Tx</span>
      <span class="stat-value">${formatCurrency(Math.round(total / monthTx.length))}</span>
    </div>
  `;
}

// ─── Master Render ────────────────────────────────────────────
function render() {
  renderBalance();
  renderChart();
  renderList();
  renderMonthlySummary();
}

// ─── Form Submit ─────────────────────────────────────────────
dom.form.addEventListener('submit', e => {
  e.preventDefault();
  if (!validateForm()) return;

  const name  = dom.itemName.value.trim();
  const amt   = dom.amount.value.trim();
  const cat   = dom.category.value;
  const date  = dom.transactionDate.value || getTodayISO();

  addTransaction(name, amt, cat, date);

  // Reset form
  dom.form.reset();
  dom.transactionDate.value = getTodayISO();
  clearErrors();
});

// ─── Delete (event delegation) ───────────────────────────────
dom.transactionList.addEventListener('click', e => {
  const btn = e.target.closest('.delete-btn');
  if (btn) deleteTransaction(btn.dataset.id);
});

// ─── Clear All ───────────────────────────────────────────────
dom.clearAll.addEventListener('click', clearAll);

// ─── Filter Change ───────────────────────────────────────────
dom.filterCategory.addEventListener('change', renderList);

// ─── Theme Toggle ────────────────────────────────────────────
dom.themeToggle.addEventListener('click', toggleTheme);

// ─── Custom Category ─────────────────────────────────────────
dom.toggleCustom.addEventListener('click', () => {
  const hidden = dom.customCatGroup.classList.toggle('hidden');
  dom.toggleCustom.textContent = hidden ? '+ Add custom category' : '− Hide custom category';
  if (!hidden) dom.customCatInput.focus();
});

dom.addCustomCatBtn.addEventListener('click', () => {
  const raw  = dom.customCatInput.value.trim();
  const name = raw.charAt(0).toUpperCase() + raw.slice(1);

  dom.customCatError.textContent = '';

  if (!name) {
    dom.customCatError.textContent = 'Enter a category name.';
    return;
  }

  const exists = allCategories().some(c => c.name.toLowerCase() === name.toLowerCase());
  if (exists) {
    dom.customCatError.textContent = 'Category already exists.';
    return;
  }

  customCategories.push({ name, emoji: '📌' });
  saveCategories();
  rebuildCategoryDropdowns();

  dom.customCatInput.value = '';
  dom.category.value = name;
  dom.customCatError.textContent = '';

  // Collapse the panel
  dom.customCatGroup.classList.add('hidden');
  dom.toggleCustom.textContent = '+ Add custom category';
});

// Allow pressing Enter in custom category input
dom.customCatInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    dom.addCustomCatBtn.click();
  }
});

// ─── Monthly Navigation ──────────────────────────────────────
dom.prevMonth.addEventListener('click', () => {
  viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1);
  renderMonthlySummary();
});

dom.nextMonth.addEventListener('click', () => {
  const next = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1);
  // Don't navigate past current month
  const now = new Date();
  if (next.getFullYear() > now.getFullYear() ||
     (next.getFullYear() === now.getFullYear() && next.getMonth() > now.getMonth())) return;
  viewMonth = next;
  renderMonthlySummary();
});

// ─── Init ────────────────────────────────────────────────────
function init() {
  loadTheme();
  loadTransactions();
  loadCategories();
  rebuildCategoryDropdowns();

  // Set today as default date
  dom.transactionDate.value = getTodayISO();

  // Set viewMonth to current month
  const now = new Date();
  viewMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  render();
}

init();
