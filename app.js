// Expense Tracker App - Enhanced Version
(function() {
  'use strict';

  // Category configuration
  const CATEGORIES = {
    food: { icon: '🍔', label: 'Food & Drinks', color: '#ff6b6b' },
    transport: { icon: '🚗', label: 'Transport', color: '#4ecdc4' },
    shopping: { icon: '🛍️', label: 'Shopping', color: '#45b7d1' },
    bills: { icon: '📄', label: 'Bills & Utilities', color: '#96ceb4' },
    entertainment: { icon: '🎬', label: 'Entertainment', color: '#feca57' },
    health: { icon: '💊', label: 'Health', color: '#ff9ff3' },
    education: { icon: '📚', label: 'Education', color: '#54a0ff' },
    other: { icon: '📦', label: 'Other', color: '#a0a0a0' }
  };

  const PAYMENT_METHODS = {
    cash: '💵 Cash',
    card: '💳 Card',
    upi: '📱 UPI',
    bank: '🏦 Bank Transfer',
    other: '📦 Other'
  };

  const CURRENCIES = {
    USD: { symbol: '$', locale: 'en-US' },
    EUR: { symbol: '€', locale: 'de-DE' },
    GBP: { symbol: '£', locale: 'en-GB' },
    INR: { symbol: '₹', locale: 'en-IN' },
    JPY: { symbol: '¥', locale: 'ja-JP' },
    CAD: { symbol: 'C$', locale: 'en-CA' },
    AUD: { symbol: 'A$', locale: 'en-AU' },
    CNY: { symbol: '¥', locale: 'zh-CN' },
    BRL: { symbol: 'R$', locale: 'pt-BR' },
    KRW: { symbol: '₩', locale: 'ko-KR' }
  };

  // State
  let expenses = [];
  let currentCurrency = 'USD';
  let monthlyBudget = 0;
  let editingId = null;
  let selectedCategory = '';

  // DOM Elements
  const form = document.getElementById('expenseForm');
  const formTitle = document.getElementById('formTitle');
  const submitBtn = document.getElementById('submitBtn');
  const cancelEditBtn = document.getElementById('cancelEditBtn');
  const editIdInput = document.getElementById('editId');
  const amountInput = document.getElementById('amount');
  const categoryInput = document.getElementById('category');
  const descriptionInput = document.getElementById('description');
  const dateInput = document.getElementById('date');
  const paymentMethodInput = document.getElementById('paymentMethod');
  const currencySelect = document.getElementById('currencySelect');
  const currencySymbol = document.getElementById('currencySymbol');
  const themeToggle = document.getElementById('themeToggle');
  const searchInput = document.getElementById('searchInput');
  const filterCategory = document.getElementById('filterCategory');
  const filterTime = document.getElementById('filterTime');
  const sortBy = document.getElementById('sortBy');
  const expenseList = document.getElementById('expenseList');
  const emptyState = document.getElementById('emptyState');
  const totalAmount = document.getElementById('totalAmount');
  const totalMonth = document.getElementById('totalMonth');
  const transactionCount = document.getElementById('transactionCount');
  const avgPerDay = document.getElementById('avgPerDay');
  const budgetBar = document.getElementById('budgetBar');
  const budgetSpent = document.getElementById('budgetSpent');
  const budgetRemaining = document.getElementById('budgetRemaining');
  const editBudgetBtn = document.getElementById('editBudgetBtn');
  const categoryBreakdown = document.getElementById('categoryBreakdown');
  const exportBtn = document.getElementById('exportBtn');
  const clearAllBtn = document.getElementById('clearAllBtn');
  const toast = document.getElementById('toast');
  const categoryGrid = document.getElementById('categoryGrid');

  // Initialize
  function init() {
    loadState();
    setDefaultDate();
    render();
    attachEventListeners();
    updateCurrencyDisplay();
    updateTheme();
  }

  // Load state from localStorage
  function loadState() {
    try {
      const stored = localStorage.getItem('expenseTrackerData');
      if (stored) {
        const data = JSON.parse(stored);
        expenses = data.expenses || [];
        currentCurrency = data.currency || 'USD';
        monthlyBudget = data.budget || 0;
      }
    } catch (e) {
      console.error('Failed to load state:', e);
      expenses = [];
    }
    currencySelect.value = currentCurrency;
  }

  // Save state to localStorage
  function saveState() {
    try {
      localStorage.setItem('expenseTrackerData', JSON.stringify({
        expenses,
        currency: currentCurrency,
        budget: monthlyBudget
      }));
    } catch (e) {
      console.error('Failed to save state:', e);
      showToast('Failed to save. Storage may be full.');
    }
  }

  // Set default date to today
  function setDefaultDate() {
    const today = new Date();
    dateInput.value = today.toISOString().split('T')[0];
  }

  // Format currency
  function formatCurrency(amount) {
    const config = CURRENCIES[currentCurrency];
    try {
      return new Intl.NumberFormat(config.locale, {
        style: 'currency',
        currency: currentCurrency,
        minimumFractionDigits: 2
      }).format(amount);
    } catch (e) {
      return config.symbol + parseFloat(amount).toFixed(2);
    }
  }

  // Format date
  function formatDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.getTime() === today.getTime()) return 'Today';
    if (date.getTime() === yesterday.getTime()) return 'Yesterday';

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  }

  // Show toast notification
  let toastTimeout;
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 2500);
  }

  // Update currency display
  function updateCurrencyDisplay() {
    const config = CURRENCIES[currentCurrency];
    currencySymbol.textContent = config.symbol;
  }

  // Update theme
  function updateTheme() {
    const isDark = localStorage.getItem('expenseTrackerTheme') === 'dark';
    document.body.classList.toggle('dark', isDark);
    themeToggle.textContent = isDark ? '☀️' : '🌙';
  }

  // Toggle theme
  function toggleTheme() {
    const isDark = document.body.classList.toggle('dark');
    localStorage.setItem('expenseTrackerTheme', isDark ? 'dark' : 'light');
    themeToggle.textContent = isDark ? '☀️' : '🌙';
  }

  // Select category
  function selectCategory(value) {
    selectedCategory = value;
    categoryInput.value = value;
    document.querySelectorAll('.category-btn').forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.value === value);
    });
  }

  // Add or update expense
  function handleSubmit(e) {
    e.preventDefault();

    const amount = parseFloat(amountInput.value);
    const category = categoryInput.value;
    const description = descriptionInput.value.trim() || CATEGORIES[category].label;
    const date = dateInput.value;
    const paymentMethod = paymentMethodInput.value;

    if (!amount || amount <= 0) {
      showToast('Please enter a valid amount');
      return;
    }

    if (!category) {
      showToast('Please select a category');
      return;
    }

    if (!date) {
      showToast('Please select a date');
      return;
    }

    if (editingId) {
      // Update existing expense
      const index = expenses.findIndex(exp => exp.id === editingId);
      if (index !== -1) {
        expenses[index] = {
          ...expenses[index],
          amount,
          category,
          description,
          date,
          paymentMethod
        };
        showToast('Expense updated!');
      }
      resetForm();
    } else {
      // Add new expense
      const expense = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        amount,
        category,
        description,
        date,
        paymentMethod,
        createdAt: new Date().toISOString()
      };
      expenses.unshift(expense);
      showToast('Expense added!');
    }

    saveState();
    render();
    resetForm();
  }

  // Reset form
  function resetForm() {
    form.reset();
    editingId = null;
    selectedCategory = '';
    editIdInput.value = '';
    formTitle.textContent = 'Add Expense';
    submitBtn.textContent = 'Add Expense';
    cancelEditBtn.style.display = 'none';
    setDefaultDate();
    document.querySelectorAll('.category-btn').forEach(btn => {
      btn.classList.remove('selected');
    });
  }

  // Edit expense
  function editExpense(id) {
    const expense = expenses.find(exp => exp.id === id);
    if (!expense) return;

    editingId = id;
    editIdInput.value = id;
    amountInput.value = expense.amount;
    selectCategory(expense.category);
    descriptionInput.value = expense.description;
    dateInput.value = expense.date;
    paymentMethodInput.value = expense.paymentMethod || 'cash';

    formTitle.textContent = 'Edit Expense';
    submitBtn.textContent = 'Update Expense';
    cancelEditBtn.style.display = 'block';

    // Scroll to form
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // Delete expense
  function deleteExpense(id) {
    expenses = expenses.filter(exp => exp.id !== id);
    saveState();
    render();
    showToast('Expense deleted');
  }

  // Get filtered expenses
  function getFilteredExpenses() {
    let filtered = [...expenses];

    // Search filter
    const searchTerm = searchInput.value.toLowerCase().trim();
    if (searchTerm) {
      filtered = filtered.filter(exp =>
        exp.description.toLowerCase().includes(searchTerm) ||
        CATEGORIES[exp.category].label.toLowerCase().includes(searchTerm)
      );
    }

    // Category filter
    const categoryFilter = filterCategory.value;
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(exp => exp.category === categoryFilter);
    }

    // Time filter
    const timeFilter = filterTime.value;
    if (timeFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      switch (timeFilter) {
        case 'today':
          filtered = filtered.filter(exp => {
            const d = new Date(exp.date + 'T00:00:00');
            return d.getTime() === today.getTime();
          });
          break;
        case 'week':
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          filtered = filtered.filter(exp => {
            const d = new Date(exp.date + 'T00:00:00');
            return d >= weekAgo && d <= today;
          });
          break;
        case 'month':
          filtered = filtered.filter(exp => {
            const d = new Date(exp.date + 'T00:00:00');
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          });
          break;
        case 'lastmonth':
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
          filtered = filtered.filter(exp => {
            const d = new Date(exp.date + 'T00:00:00');
            return d >= lastMonth && d <= lastMonthEnd;
          });
          break;
      }
    }

    // Sort
    const sortValue = sortBy.value;
    switch (sortValue) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case 'highest':
        filtered.sort((a, b) => b.amount - a.amount);
        break;
      case 'lowest':
        filtered.sort((a, b) => a.amount - b.amount);
        break;
    }

    return filtered;
  }

  // Calculate category totals
  function getCategoryTotals() {
    const totals = {};
    expenses.forEach(exp => {
      if (!totals[exp.category]) {
        totals[exp.category] = 0;
      }
      totals[exp.category] += exp.amount;
    });
    return totals;
  }

  // Render the app
  function render() {
    const filtered = getFilteredExpenses();
    const categoryTotals = getCategoryTotals();
    const grandTotal = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Update summary
    totalAmount.textContent = formatCurrency(grandTotal);
    transactionCount.textContent = expenses.length;

    // This month total
    const now = new Date();
    const monthTotal = expenses
      .filter(exp => {
        const d = new Date(exp.date + 'T00:00:00');
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, exp) => sum + exp.amount, 0);
    totalMonth.textContent = 'This month: ' + formatCurrency(monthTotal);

    // Average per day
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const avg = monthTotal / daysInMonth;
    avgPerDay.textContent = 'Avg/day: ' + formatCurrency(avg);

    // Update budget
    updateBudget(monthTotal);

    // Update category breakdown
    renderCategoryBreakdown(categoryTotals, grandTotal);

    // Show/hide empty state
    if (filtered.length === 0) {
      expenseList.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';

    // Render expense items
    expenseList.innerHTML = filtered.map(expense => {
      const cat = CATEGORIES[expense.category] || CATEGORIES.other;
      const payment = PAYMENT_METHODS[expense.paymentMethod] || '';

      return `
        <div class="expense-item" data-id="${expense.id}">
          <div class="expense-icon">${cat.icon}</div>
          <div class="expense-details">
            <div class="expense-description">${escapeHtml(expense.description)}</div>
            <div class="expense-meta">${cat.label} · ${formatDate(expense.date)} · ${payment}</div>
          </div>
          <div class="expense-amount">${formatCurrency(expense.amount)}</div>
          <div class="expense-actions">
            <button class="expense-action-btn edit" data-id="${expense.id}" aria-label="Edit">✏️</button>
            <button class="expense-action-btn delete" data-id="${expense.id}" aria-label="Delete">✕</button>
          </div>
        </div>
      `;
    }).join('');
  }

  // Update budget display
  function updateBudget(spent) {
    if (monthlyBudget <= 0) {
      budgetBar.style.width = '0%';
      budgetBar.className = 'budget-bar';
      budgetSpent.textContent = 'No budget set';
      budgetRemaining.textContent = '';
      return;
    }

    const percentage = Math.min((spent / monthlyBudget) * 100, 100);
    const remaining = monthlyBudget - spent;

    budgetBar.style.width = percentage + '%';
    budgetBar.className = 'budget-bar';
    if (percentage > 100) {
      budgetBar.classList.add('over');
    } else if (percentage > 80) {
      budgetBar.classList.add('warning');
    }

    budgetSpent.textContent = formatCurrency(spent) + ' spent';
    budgetRemaining.textContent = remaining >= 0
      ? formatCurrency(remaining) + ' remaining'
      : formatCurrency(Math.abs(remaining)) + ' over budget';
  }

  // Render category breakdown
  function renderCategoryBreakdown(totals, grandTotal) {
    const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);

    if (entries.length === 0) {
      categoryBreakdown.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.85rem;">No data yet</p>';
      return;
    }

    categoryBreakdown.innerHTML = entries.map(([category, amount]) => {
      const cat = CATEGORIES[category] || CATEGORIES.other;
      const percentage = grandTotal > 0 ? (amount / grandTotal) * 100 : 0;

      return `
        <div class="category-item">
          <div class="category-icon">${cat.icon}</div>
          <div class="category-info">
            <div class="category-name">
              <span>${cat.label}</span>
              <span class="category-amount">${formatCurrency(amount)} (${percentage.toFixed(1)}%)</span>
            </div>
            <div class="category-bar-container">
              <div class="category-bar" style="width: ${percentage}%; background: ${cat.color};"></div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Export to CSV
  function exportCSV() {
    if (expenses.length === 0) {
      showToast('No expenses to export');
      return;
    }

    const headers = ['Date', 'Description', 'Category', 'Amount', 'Payment Method'];
    const rows = expenses.map(exp => [
      exp.date,
      `"${exp.description.replace(/"/g, '""')}"`,
      CATEGORIES[exp.category]?.label || exp.category,
      exp.amount.toFixed(2),
      PAYMENT_METHODS[exp.paymentMethod] || exp.paymentMethod
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expenses_' + new Date().toISOString().split('T')[0] + '.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exported!');
  }

  // Clear all expenses
  function clearAll() {
    if (expenses.length === 0) {
      showToast('No expenses to clear');
      return;
    }
    if (confirm('Are you sure you want to delete ALL expenses? This cannot be undone.')) {
      expenses = [];
      saveState();
      render();
      showToast('All expenses cleared');
    }
  }

  // Edit budget
  function editBudget() {
    const current = monthlyBudget > 0 ? monthlyBudget : '';
    const input = prompt('Enter monthly budget amount:', current);
    if (input === null) return;

    const value = parseFloat(input);
    if (isNaN(value) || value < 0) {
      showToast('Please enter a valid amount');
      return;
    }

    monthlyBudget = value;
    saveState();
    render();
    showToast(monthlyBudget > 0 ? 'Budget updated!' : 'Budget cleared');
  }

  // Escape HTML
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Attach event listeners
  function attachEventListeners() {
    form.addEventListener('submit', handleSubmit);
    cancelEditBtn.addEventListener('click', resetForm);

    // Category buttons
    categoryGrid.addEventListener('click', function(e) {
      const btn = e.target.closest('.category-btn');
      if (btn) {
        selectCategory(btn.dataset.value);
      }
    });

    // Currency
    currencySelect.addEventListener('change', function() {
      currentCurrency = this.value;
      saveState();
      updateCurrencyDisplay();
      render();
    });

    // Theme
    themeToggle.addEventListener('click', toggleTheme);

    // Filters
    searchInput.addEventListener('input', render);
    filterCategory.addEventListener('change', render);
    filterTime.addEventListener('change', render);
    sortBy.addEventListener('change', render);

    // Budget
    editBudgetBtn.addEventListener('click', editBudget);

    // Export & Clear
    exportBtn.addEventListener('click', exportCSV);
    clearAllBtn.addEventListener('click', clearAll);

    // Delegate edit/delete clicks
    expenseList.addEventListener('click', function(e) {
      const editBtn = e.target.closest('.expense-action-btn.edit');
      const deleteBtn = e.target.closest('.expense-action-btn.delete');

      if (editBtn) {
        editExpense(editBtn.dataset.id);
      } else if (deleteBtn) {
        deleteExpense(deleteBtn.dataset.id);
      }
    });
  }

  // Start the app
  init();
})();
