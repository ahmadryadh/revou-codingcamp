/* ============================================================
   BudgetViz – app.js
   Vanilla JS | localStorage | Chart.js | No frameworks
   ============================================================ */

'use strict';

// ─── Constants ───────────────────────────────────────────────
const STORAGE_KEY    = 'budgetviz_transactions';
const CATEGORIES_KEY = 'budgetviz_categories';
const THEME_KEY      = 'budgetviz_theme';

const DEFAULT_CATEGORIES = [
  { name: 'Food',      emoji: '🍔' },
  { name: 'Transport', emoji: '🚗' },
  { name: 'Fun',       emoji: '🎮' },
];

// Pastel-friendly chart colors aligned with CSS tag palette
const CHART_COLORS = [
  '#fb923c', // Food      – soft orange
  '#60a5fa', // Transport – soft blue
  '#c084fc', // Fun       – soft purple
  '#34d399', // custom 1  – mint
  '#f472b6', // custom 2  – pink
  '#facc15', // custom 3  – yellow
  '#2dd4bf', // custom 4  – teal
  '#a78bfa', // custom 5  – lavender
  '#f97316', // custom 6  – amber
  '#818cf8', // custom 7  – indigo
];

// ─── State ───────────────────────────────────────────────────
let transactions    = [];  // { id, name, amount, category, date }
let customCategories = []; // { name, emoji }
let chart           = null;
let viewMonth       = new Date();

// ─── DOM References ──────────────────────────────────────────
const $ = id => document.getElementById(id);

const dom = {
  // Balance
  totalBalance:      $('totalBalance'),
  transactionCount:  $('transactionCount'),

  // Theme
  themeToggle:       $('themeToggle'),
  themeIcon:         document.querySelector('.theme-icon'),

  // Form
  form:              $('transactionForm'),
  itemName:          $('itemName'),
  amount:            $('amount'),
  category:          $('category'),
  transactionDate:   $('transactionDate'),
  nameError:         $('nameError'),
  amountError:       $('amountError'),
  categoryError:     $('categoryError'),

  // Custom category
  toggleCustom:      $('toggleCustomCategory'),
  customCatGroup:    $('customCategoryGroup'),
  customCatInput:    $('customCategory'),
  addCustomCatBtn:   $('addCustomCategory'),
  customCatError:    $('customCategoryError'),

  // List
  transactionList:   $('transactionList'),
  listEmpty:         $('listEmpty'),
  filterCategory:    $('filterCategory'),
  clearAll:          $('clearAll'),

  // Chart
  chartCanvas:       $('spendingChart'),
  chartEmpty:        $('chartEmpty'),
  chartLegend:       $('chartLegend'),

  // Monthly summary
  currentMonthLabel: $('currentMonthLabel'),
  prevMonth:         $('prevMonth'),
  nextMonth:         $('nextMonth'),
  monthlyStats:      $('monthlyStats'),
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
  return new Date().toISOString().slice(0, 10);
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(date) {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function allCategories() {
  return [...DEFAULT_CATEGORIES, ...customCategories];
}

function getCategoryMeta(name) {
  return allCategories().find(c => c.name === name) || { name, emoji: '📌' };
}

function colorForCategory(name) {
  const cats = allCategories();
  const idx  = cats.findIndex(c => c.name === name);
  return CHART_COLORS[idx >= 0 ? idx % CHART_COLORS.length : CHART_COLORS.length - 1];
}

/** CSS tag class: tag-Food, tag-Transport, tag-Fun, or tag-custom */
function tagClass(name) {
  const builtIn = ['Food', 'Transport', 'Fun'];
  return builtIn.includes(name) ? `tag-${name}` : 'tag-custom';
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
  if (chart) {
    const color = theme === 'dark' ? '#c4b5fd' : '#7c6fa0';
    chart.options.plugins.legend.labels.color = color;
    chart.update();
  }
}

function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme') || 'light';
  applyTheme(cur === 'dark' ? 'light' : 'dark');
}

function loadTheme() {
  applyTheme(localStorage.getItem(THEME_KEY) || 'light');
}

// ─── Category Dropdowns ──────────────────────────────────────
function rebuildCategoryDropdowns() {
  // ── Main form select ──
  const sel = dom.category;
  const selVal = sel.value;
  while (sel.options.length > 1) sel.remove(1);
  allCategories().forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.name;
    opt.textContent = `${cat.emoji} ${cat.name}`;
    sel.appendChild(opt);
  });
  if (selVal) sel.value = selVal;

  // ── Filter select ──
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
  ['nameError', 'amountError', 'categoryError'].forEach(id => { $(id).textContent = ''; });
  ['itemName', 'amount', 'category'].forEach(id => { $(id).classList.remove('error'); });
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

// ─── Transactions CRUD ───────────────────────────────────────
function addTransaction(name, amount, category, date) {
  transactions.unshift({
    id: generateId(),
    name,
    amount: parseFloat(amount),
    category,
    date: date || getTodayISO(),
  });
  saveTransactions();
  render();
}

function deleteTransaction(id) {
  transactions = transactions.filter(tx => tx.id !== id);
  saveTransactions();
  render();
}

function clearAll() {
  if (!transactions.length) return;
  if (!confirm('Delete all transactions? This cannot be undone.')) return;
  transactions = [];
  saveTransactions();
  render();
}

// ─── Render: Balance ─────────────────────────────────────────
function renderBalance() {
  const total = transactions.reduce((s, tx) => s + tx.amount, 0);
  dom.totalBalance.textContent = formatCurrency(total);
  dom.transactionCount.textContent =
    `${transactions.length} transaction${transactions.length !== 1 ? 's' : ''}`;
}

// ─── Render: Chart (Pie) ──────────────────────────────────────
function renderChart() {
  const agg = {};
  transactions.forEach(tx => {
    agg[tx.category] = (agg[tx.category] || 0) + tx.amount;
  });

  const labels = Object.keys(agg);
  const data   = Object.values(agg);
  const colors = labels.map(colorForCategory);
  const hasData = labels.length > 0;

  dom.chartEmpty.style.display = hasData ? 'none' : 'flex';

  if (!hasData) {
    if (chart) { chart.destroy(); chart = null; }
    dom.chartLegend.innerHTML = '';
    return;
  }

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textColor = isDark ? '#c4b5fd' : '#7c6fa0';

  if (chart) {
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.data.datasets[0].backgroundColor = colors;
    chart.data.datasets[0].borderColor = isDark ? '#241d38' : '#ffffff';
    chart.options.plugins.legend.labels.color = textColor;
    chart.update();
  } else {
    chart = new Chart(dom.chartCanvas, {
      type: 'pie',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderWidth: 3,
          borderColor: isDark ? '#241d38' : '#ffffff',
          hoverOffset: 12,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: ctx => {
                const val   = ctx.parsed;
                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                const pct   = ((val / total) * 100).toFixed(1);
                return ` ${formatCurrency(val)} (${pct}%)`;
              },
            },
          },
        },
        animation: { duration: 400 },
      },
    });
  }

  // Custom legend below chart
  const total = data.reduce((a, b) => a + b, 0);
  dom.chartLegend.innerHTML = labels.map((label, i) => {
    const meta = getCategoryMeta(label);
    const pct  = ((data[i] / total) * 100).toFixed(1);
    return `
      <div class="legend-item">
        <span class="legend-dot" style="background:${colors[i]}"></span>
        <span>${meta.emoji} ${label} <strong>${pct}%</strong></span>
      </div>`;
  }).join('');
}

// ─── Render: Transaction List ─────────────────────────────────
function renderList() {
  const filterVal = dom.filterCategory.value;
  const filtered  = filterVal === 'all'
    ? transactions
    : transactions.filter(tx => tx.category === filterVal);

  dom.listEmpty.style.display  = filtered.length === 0 ? 'block' : 'none';
  dom.transactionList.innerHTML = '';

  filtered.forEach(tx => {
    const meta = getCategoryMeta(tx.category);
    const item = document.createElement('div');
    item.className = 'transaction-item';
    item.setAttribute('role', 'listitem');
    item.dataset.id = tx.id;
    item.innerHTML = `
      <div class="item-info">
        <div class="item-name" title="${tx.name}">${tx.name}</div>
        <div class="item-amount-main">${formatCurrency(tx.amount)}</div>
        <div class="item-meta">
          <span class="item-tag ${tagClass(tx.category)}">${meta.emoji} ${tx.category}</span>
          ${tx.date ? `<span class="item-date">${formatDate(tx.date)}</span>` : ''}
        </div>
      </div>
      <button class="delete-btn" aria-label="Delete ${tx.name}" data-id="${tx.id}">Delete</button>
    `;
    dom.transactionList.appendChild(item);
  });
}

// ─── Render: Monthly Summary ──────────────────────────────────
function renderMonthlySummary() {
  dom.currentMonthLabel.textContent = monthLabel(viewMonth);

  const mk      = monthKey(viewMonth);
  const monthTx = transactions.filter(tx => tx.date && tx.date.startsWith(mk));

  if (monthTx.length === 0) {
    dom.monthlyStats.innerHTML =
      `<p class="monthly-empty">No transactions for this month.</p>`;
    return;
  }

  const total = monthTx.reduce((s, tx) => s + tx.amount, 0);

  const agg = {};
  monthTx.forEach(tx => { agg[tx.category] = (agg[tx.category] || 0) + tx.amount; });
  const topCat  = Object.entries(agg).sort((a, b) => b[1] - a[1])[0];
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

// ─── Event Listeners ─────────────────────────────────────────

// Form submit
dom.form.addEventListener('submit', e => {
  e.preventDefault();
  if (!validateForm()) return;

  addTransaction(
    dom.itemName.value.trim(),
    dom.amount.value.trim(),
    dom.category.value,
    dom.transactionDate.value || getTodayISO(),
  );

  dom.form.reset();
  dom.transactionDate.value = getTodayISO();
  clearErrors();
});

// Delete — event delegation
dom.transactionList.addEventListener('click', e => {
  const btn = e.target.closest('.delete-btn');
  if (btn) deleteTransaction(btn.dataset.id);
});

// Clear all
dom.clearAll.addEventListener('click', clearAll);

// Filter
dom.filterCategory.addEventListener('change', renderList);

// Theme
dom.themeToggle.addEventListener('click', toggleTheme);

// Custom category toggle
dom.toggleCustom.addEventListener('click', () => {
  const hidden = dom.customCatGroup.classList.toggle('hidden');
  dom.toggleCustom.textContent = hidden
    ? '+ Add custom category'
    : '− Hide custom category';
  if (!hidden) dom.customCatInput.focus();
});

// Add custom category
dom.addCustomCatBtn.addEventListener('click', () => {
  const raw  = dom.customCatInput.value.trim();
  const name = raw.charAt(0).toUpperCase() + raw.slice(1);

  dom.customCatError.textContent = '';

  if (!name) {
    dom.customCatError.textContent = 'Enter a category name.';
    return;
  }
  if (allCategories().some(c => c.name.toLowerCase() === name.toLowerCase())) {
    dom.customCatError.textContent = 'Category already exists.';
    return;
  }

  customCategories.push({ name, emoji: '📌' });
  saveCategories();
  rebuildCategoryDropdowns();

  dom.customCatInput.value     = '';
  dom.category.value           = name;
  dom.customCatError.textContent = '';
  dom.customCatGroup.classList.add('hidden');
  dom.toggleCustom.textContent = '+ Add custom category';
});

dom.customCatInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); dom.addCustomCatBtn.click(); }
});

// Monthly navigation
dom.prevMonth.addEventListener('click', () => {
  viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1);
  renderMonthlySummary();
});

dom.nextMonth.addEventListener('click', () => {
  const next = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1);
  const now  = new Date();
  if (
    next.getFullYear() > now.getFullYear() ||
    (next.getFullYear() === now.getFullYear() && next.getMonth() > now.getMonth())
  ) return;
  viewMonth = next;
  renderMonthlySummary();
});

// ─── Init ─────────────────────────────────────────────────────
function init() {
  loadTheme();
  loadTransactions();
  loadCategories();
  rebuildCategoryDropdowns();
  dom.transactionDate.value = getTodayISO();
  const now = new Date();
  viewMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  render();
}

init();
