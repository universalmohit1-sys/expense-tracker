// Expense Tracker App - Full Feature Update
// Includes: Category Management, Person/Ledger Tracking, Income/Outgo Tracking
// GitHub Repository: https://github.com/universalmohit1-sys/expense-tracker

(function() {
  'use strict';

  // ==========================================
  // CATEGORY MANAGEMENT SYSTEM
  // ==========================================
  
  // Default built-in categories (protected - cannot be deleted)
  const DEFAULT_CATEGORIES = {
    food: { icon: '🍔', label: 'Food & Drinks', color: '#ff6b6b' },
    transport: { icon: '🚗', label: 'Transport', color: '#4ecdc4' },
    shopping: { icon: '🛍️', label: 'Shopping', color: '#45b7d1' },
    bills: { icon: '📄', label: 'Bills & Utilities', color: '#96ceb4' },
    entertainment: { icon: '🎬', label: 'Entertainment', color: '#feca57' },
    health: { icon: '💊', label: 'Health', color: '#ff9ff3' },
    education: { icon: '📚', label: 'Education', color: '#54a0ff' },
    other: { icon: '📦', label: 'Other', color: '#a0a0a0' }
  };

  // User-managed categories (can be added/edited/deleted)
  let userCategories = {};

  // Merge default categories with user categories
  function initCategories() {
    userCategories = { ...DEFAULT_CATEGORIES };
    // Load from localStorage if available
    try {
      const stored = localStorage.getItem('expenseTrackerCategories');
      if (stored) {
        const storedData = JSON.parse(stored);
        // Merge: keep defaults, override with user additions/edits
        userCategories = { ...DEFAULT_CATEGORIES, ...storedData };
      }
    } catch (e) {
      console.log('No saved categories, using defaults');
    }
  }

  // Save categories to localStorage
  function saveCategories() {
    try {
      localStorage.setItem('expenseTrackerCategories', JSON.stringify(userCategories));
    } catch (e) {
      console.error('Failed to save categories', e);
    }
  }

  // Add a new category
  function addCategory(name, icon, color) {
    const key = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    userCategories[key] = { icon, label: name, color, isCustom: true };
    saveCategories();
    return key;
  }

  // Edit a category (cannot edit defaults)
  function editCategory(key, newName, newIcon, newColor) {
    if (isDefaultCategory(key)) {
      showToast('Cannot edit default categories');
      return false;
    }
    if (userCategories[key]) {
      userCategories[key] = { label: newName || userCategories[key].label, icon: newIcon || userCategories[key].icon, color: newColor || userCategories[key].icon, isCustom: true };
      saveCategories();
      return true;
    }
    return false;
  }

  // Delete a category (cannot delete defaults)
  function deleteCategory(key) {
    if (isDefaultCategory(key)) {
      showToast('Cannot delete default categories');
      return false;
    }
    delete userCategories[key];
    saveCategories();
    // Reassign any expenses using this category to 'other'
    reassignExpensesOnDelete(key);
    return true;
  }

  function isDefaultCategory(key) {
    return Object.values(DEFAULT_CATEGORIES).some(cat => cat.icon === userCategories[key]?.icon || cat.label === userCategories[key]?.label);
  }

  // Reassign expenses when category deleted
  function reassignExpensesOnDelete(oldKey) {
    expenses.forEach(exp => {
      if (exp.category === oldKey && !isDefaultCategory(oldKey)) {
        exp.category = 'other';
      }
    });
    saveState();
    render();
  }

  // Get category info
  function getCategoryInfo(key) {
    return userCategories[key] || DEFAULT_CATEGORIES.other;
  }

  // Get all category keys
  function getAllCategoryKeys() {
    return Object.keys(userCategories);
  }

  // ==========================================
  // PERSON/LEDGER TRACKING SYSTEM
  // ==========================================

  // People system - tracks who money is owed to/by
  let people = []; // Array of person names/objects

  // Init people from localStorage
  function initPeople() {
    try {
      const stored = localStorage.getItem('expenseTrackerPeople');
      if (stored) {
        people = JSON.parse(stored);
        // Ensure all expenses have person fields
        expenses.forEach(exp => {
          if (!exp.fromPerson) exp.fromPerson = '';
          if (!exp.toPerson) exp.toPerson = '';
        });
      }
    } catch (e) {
      people = [];
    }
    // Save if changed
    savePeople();
  }

  // Save people to localStorage
  function savePeople() {
    try {
      localStorage.setItem('expenseTrackerPeople', JSON.stringify(people));
    } catch (e) {
      console.error('Failed to save people', e);
    }
  }

  // Add a person
  function addPerson(name) {
    const trimmed = name.trim();
    if (!trimmed || people.some(p => p.name.toLowerCase() === trimmed.toLowerCase())) {
      return false;
    }
    people.push({ name: trimmed, id: Date.now().toString(36) });
    savePeople();
    return true;
  }

  // Remove a person
  function removePerson(name) {
    people = people.filter(p => p.name !== name);
    // Clean up expenses referencing this person
    expenses.forEach(exp => {
      if (exp.fromPerson === name) exp.fromPerson = '';
      if (exp.toPerson === name) exp.toPerson = '';
    });
    savePeople();
    saveState();
    render();
  }

  // Get person by name
  function getPerson(name) {
    return people.find(p => p.name === name) || { name, id: '' };
  }

  // ==========================================
  // INCOME/OUTGO TRACKING
  // ==========================================

  let expenses = [];

  // Load state from localStorage
  function loadState() {
    initCategories();
    initPeople();
    
    try {
      const stored = localStorage.getItem('expenseTrackerData');
      if (stored) {
        const data = JSON.parse(stored);
        expenses = data.expenses || [];
        currentCurrency = data.currency || 'USD';
        monthlyBudget = data.budget || 0;
        
        // Migrate old data format to include new fields
        expenses.forEach(exp => {
          if (exp.type === undefined) exp.type = 'expense';
          if (exp.fromPerson === undefined) exp.fromPerson = '';
          if (exp.toPerson === undefined) exp.toPerson = '';
          if (!exp.icon) exp.icon = getCategoryInfo(exp.category)?.icon || '📦';
        });
      }
    } catch (e) {
      console.error('Failed to load state', e);
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
      console.error('Failed to save state', e);
      showToast('Failed to save. Storage may be full.');
    }
  }

  // ==========================================
  // CURRENCY & THEME
  // ==========================================

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

  let currentCurrency = 'USD';
  let monthlyBudget = 0;
  let editingId = null;
  let selectedCategory = '';

  // ==========================================
  // DOM ELEMENTS
  // ==========================================

  const DOM = {
    form: document.getElementById('expenseForm'),
    formTitle: document.getElementById('formTitle'),
    submitBtn: document.getElementById('submitBtn'),
    cancelEditBtn: document.getElementById('cancelEditBtn'),
    editIdInput: document.getElementById('editId'),
    amountInput: document.getElementById('amount'),
    categoryInput: document.getElementById('category'),
    descriptionInput: document.getElementById('description'),
    dateInput: document.getElementById('date'),
    paymentMethodInput: document.getElementById('paymentMethod'),
    currencySelect: document.getElementById('currencySelect'),
    currencySymbol: document.getElementById('currencySymbol'),
    themeToggle: document.getElementById('themeToggle'),
    searchInput: document.getElementById('searchInput'),
    filterCategory: document.getElementById('filterCategory'),
    filterTime: document.getElementById('filterTime'),
    sortBy: document.getElementById('sortBy'),
    expenseList: document.getElementById('expenseList'),
    emptyState: document.getElementById('emptyState'),
    totalAmount: document.getElementById('totalAmount'),
    totalMonth: document.getElementById('totalMonth'),
    transactionCount: document.getElementById('transactionCount'),
    avgPerDay: document.getElementById('avgPerDay'),
    budgetBar: document.getElementById('budgetBar'),
    budgetSpent: document.getElementById('budgetSpent'),
    budgetRemaining: document.getElementById('budgetRemaining'),
    editBudgetBtn: document.getElementById('editBudgetBtn'),
    categoryBreakdown: document.getElementById('categoryBreakdown'),
    exportBtn: document.getElementById('exportBtn'),
    clearAllBtn: document.getElementById('clearAllBtn'),
    toast: document.getElementById('toast'),
    categoryGrid: document.getElementById('categoryGrid'),
    // New elements for features
    addCategoryBtn: document.getElementById('addCategoryBtn'),
    managePeopleBtn: document.getElementById('managePeopleBtn'),
    peopleSidebar: document.getElementById('peopleSidebar'),
    peopleList: document.getElementById('peopleList'),
    addPersonBtn: document.getElementById('addPersonBtn'),
    personForm: document.getElementById('personForm'),
    personInput: document.getElementById('personInput'),
    typeToggle: document.getElementById('typeToggle'),
    incomeSection: document.getElementById('incomeSection'),
    expenseSection: document.getElementById('expenseSection'),
    netBalance: document.getElementById('netBalance')
  };

  // ==========================================
  // INITIALIZE
  // ==========================================

  function init() {
    loadState();
    setDefaultDate();
    render();
    attachEventListeners();
    updateCurrencyDisplay();
    updateTheme();
    renderPeopleSidebar();
  }

  // ==========================================
  // FORM HANDLING
  // ==========================================

  function handleSubmit(e) {
    e.preventDefault();

    const amount = parseFloat(DOM.amountInput.value);
    const category = DOM.categoryInput.value;
    const description = DOM.descriptionInput.value.trim();
    const date = DOM.dateInput.value;
    const paymentMethod = DOM.paymentMethodInput.value;
    const type = DOM.typeToggle ? DOM.typeToggle.value : 'expense';
    const fromPerson = DOM.fromPersonInput ? DOM.fromPersonInput.value : '';
    const toPerson = DOM.toPersonInput ? DOM.toPersonInput.value : '';

    // Validation
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

    // Get category info
    const catInfo = getCategoryInfo(category);

    // Create expense object
    const expense = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      amount,
      type,
      category,
      description: description || catInfo.label,
      date,
      paymentMethod,
      fromPerson,
      toPerson,
      icon: catInfo.icon,
      createdAt: new Date().toISOString()
    };

    if (editingId) {
      // Update existing
      const idx = expenses.findIndex(exp => exp.id === editingId);
      if (idx !== -1) {
        expenses[idx] = { ...expenses[idx], ...expense };
        showToast('Expense updated!');
      }
      editingId = null;
    } else {
      // Add new
      expenses.unshift(expense);
      showToast('Expense added!');
    }

    // Save and render
    saveState();
    render();
    resetForm();
  }

  // Reset form
  function resetForm() {
    DOM.form.reset();
    editingId = null;
    DOM.formTitle.textContent = 'Add Expense';
    DOM.submitBtn.textContent = 'Add Expense';
    DOM.cancelEditBtn.style.display = 'none';
    DOM.typeToggle.value = 'expense';
    DOM.fromPersonInput.value = '';
    DOM.toPersonInput.value = '';
    setDefaultDate();
    
    // Reset category selection
    document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('selected'));
    selectedCategory = '';
  }

  // ==========================================
  // EDIT EXPENSE
  // ==========================================

  function editExpense(id) {
    const exp = expenses.find(e => e.id === id);
    if (!exp) return;

    editingId = id;
    DOM.editIdInput.value = id;
    DOM.amountInput.value = exp.amount;
    DOM.categoryInput.value = exp.category;
    DOM.descriptionInput.value = exp.description;
    DOM.dateInput.value = exp.date;
    DOM.paymentMethodInput.value = exp.paymentMethod || 'cash';
    DOM.typeToggle.value = exp.type || 'expense';
    DOM.fromPersonInput.value = exp.fromPerson || '';
    DOM.toPersonInput.value = exp.toPerson || '';

    // Select category button
    document.querySelectorAll('.category-btn').forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.value === exp.category);
    });

    DOM.formTitle.textContent = 'Edit Expense';
    DOM.submitBtn.textContent = 'Update Expense';
    DOM.cancelEditBtn.style.display = 'block';

    // Scroll to form
    DOM.form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // ==========================================
  // DELETE EXPENSE
  // ==========================================

  function deleteExpense(id) {
    expenses = expenses.filter(exp => exp.id !== id);
    saveState();
    render();
    showToast('Expense deleted');
  }

  // ==========================================
  // FILTERS & SEARCH
  // ==========================================

  function getFilteredExpenses() {
    let filtered = [...expenses];

    // Search
    const searchTerm = DOM.searchInput ? DOM.searchInput.value.toLowerCase().trim() : '';
    if (searchTerm) {
      filtered = filtered.filter(exp =>
        exp.description.toLowerCase().includes(searchTerm) ||
        getCategoryInfo(exp.category).label.toLowerCase().includes(searchTerm) ||
        (exp.fromPerson && exp.fromPerson.toLowerCase().includes(searchTerm)) ||
        (exp.toPerson && exp.toPerson.toLowerCase().includes(searchTerm))
      );
    }

    // Category filter
    const catFilter = DOM.filterCategory ? DOM.filterCategory.value : 'all';
    if (catFilter !== 'all') {
      filtered = filtered.filter(exp => exp.category === catFilter);
    }

    // Time filter
    const timeFilter = DOM.filterTime ? DOM.filterTime.value : 'all';
    if (timeFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      filtered = filtered.filter(exp => {
        const expDate = new Date(exp.date + 'T00:00:00');
        switch (timeFilter) {
          case 'today': return expDate.getTime() === today.getTime();
          case 'week': return expDate >= new Date(today - 7 * 24 * 60 * 60 * 1000) && expDate <= today;
          case 'month': return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
          case 'lastmonth': {
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
            return expDate >= lastMonth && expDate <= lastMonthEnd;
          }
          default: return true;
        }
      });
    }

    // Sort
    const sortBy = DOM.sortBy ? DOM.sortBy.value : 'newest';
    switch (sortBy) {
      case 'newest': filtered.sort((a, b) => new Date(b.date) - new Date(a.date)); break;
      case 'oldest': filtered.sort((a, b) => new Date(a.date) - new Date(b.date)); break;
      case 'highest': filtered.sort((a, b) => b.amount - a.amount); break;
      case 'lowest': filtered.sort((a, b) => a.amount - b.amount); break;
    }

    return filtered;
  }

  // ==========================================
  // CATEGORY TOTALS & INCOME/OUTGO CALCULATIONS
  // ==========================================

  function getCategoryTotals() {
    const totals = {};
    expenses.forEach(exp => {
      if (!totals[exp.category]) totals[exp.category] = 0;
      totals[exp.category] += exp.amount;
    });
    return totals;
  }

  function getIncomeTotal() {
    return expenses.filter(exp => exp.type === 'income').reduce((sum, exp) => sum + exp.amount, 0);
  }

  function getExpenseTotal() {
    return expenses.filter(exp => exp.type === 'expense').reduce((sum, exp) => sum + exp.amount, 0);
  }

  function getNetBalance() {
    return getIncomeTotal() - getExpenseTotal();
  }

  function getThisMonthTotal() {
    const now = new Date();
    return expenses.filter(exp => {
      const d = new Date(exp.date + 'T00:00:00');
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).reduce((sum, exp) => sum + exp.amount, 0);
  }

  // ==========================================
  // PERSON BALANCE CALCULATIONS
  // ==========================================

  function getPersonBalances() {
    const balances = {};
    
    expenses.forEach(exp => {
      // If money was lent (person paid, others owe)
      if (exp.fromPerson) {
        if (!balances[exp.fromPerson]) balances[exp.fromPerson] = 0;
        balances[exp.fromPerson] += exp.amount;
      }
      // If money was borrowed (person received money)
      if (exp.toPerson) {
        if (!balances[exp.toPerson]) balances[exp.toPerson] = 0;
        balances[exp.toPerson] -= exp.amount;
      }
    });

    // Add people who are in the people list but have no transactions
    people.forEach(person => {
      if (!balances[person.name]) balances[person.name] = 0;
    });

    return balances;
  }

  // Format person balance as "Owed by" or "Owes"
  function formatPersonBalance(personName) {
    const balance = getPersonBalances()[personName] || 0;
    if (balance > 0) return `${personName} owes $${balance.toFixed(2)}`;
    if (balance < 0) return `${personName} is owed $${Math.abs(balance).toFixed(2)}`;
    return `${personName} - no transactions`;
  }

  // ==========================================
  // RENDER FUNCTIONS
  // ==========================================

  function render() {
    const filtered = getFilteredExpenses();
    const catTotals = getCategoryTotals();
    const grandTotal = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const income = getIncomeTotal();
    const expensesTotal = getExpenseTotal();
    const net = getNetBalance();
    const thisMonth = getThisMonthTotal();
    const personBalances = getPersonBalances();

    // Update summary
    DOM.totalAmount.textContent = formatCurrency(grandTotal);
    DOM.transactionCount.textContent = expenses.length;
    DOM.totalMonth.textContent = `This month: ${formatCurrency(thisMonth)}`;
    
    // Average per day
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const avg = thisMonth / daysInMonth;
    DOM.avgPerDay.textContent = `Avg/day: ${formatCurrency(avg)}`;

    // Budget update
    updateBudget(expensesTotal);

    // Net balance display
    if (DOM.netBalance) {
      DOM.netBalance.textContent = `Net Balance: ${net >= 0 ? '+' : ''}${formatCurrency(net)}`;
      DOM.netBalance.style.color = net >= 0 ? 'var(--success)' : 'var(--danger)';
    }

    // Category breakdown
    renderCategoryBreakdown(catTotals, grandTotal);

    // Show/hide empty state
    if (filtered.length === 0) {
      DOM.expenseList.innerHTML = '';
      DOM.emptyState.style.display = 'block';
      return;
    }
    DOM.emptyState.style.display = 'none';

    // Render expenses
    DOM.expenseList.innerHTML = filtered.map(exp => {
      const catInfo = getCategoryInfo(exp.category);
      const payment = exp.paymentMethod ? PAYMENT_METHODS[exp.paymentMethod] : '';
      const personInfo = exp.fromPerson || exp.toPerson ? `
        <div class="person-info">
          ${exp.fromPerson ? `💸 Paid by: ${exp.fromPerson}` : ''}
          ${exp.toPerson ? `💰 Received from: ${exp.toPerson}` : ''}
        </div>
      ` : '';

      return `
        <div class="expense-item" data-id="${exp.id}">
          <div class="expense-icon">${exp.icon}</div>
          <div class="expense-details">
            <div class="expense-description">${escapeHtml(exp.description)}</div>
            <div class="expense-meta">${catInfo.label} · ${formatDate(exp.date)} · ${payment}</div>
            ${personInfo}
          </div>
          <div class="expense-amount">${formatCurrency(exp.amount)}</div>
          <div class="expense-actions">
            <button class="expense-action-btn edit" data-id="${exp.id}" aria-label="Edit">✏️</button>
            <button class="expense-action-btn delete" data-id="${exp.id}" aria-label="Delete">✕</button>
          </div>
        </div>
      `;
    }).join('');

    // Render person balances sidebar if exists
    if (DOM.peopleList) {
      renderPersonBalances(personBalances);
    }
  }

  // Render person balances sidebar
  function renderPersonBalances(balances) {
    if (!DOM.peopleList) return;
    
    const entries = Object.entries(balances).filter(([, bal]) => bal !== 0);
    
    if (entries.length === 0) {
      DOM.peopleList.innerHTML = '<li>No person transactions yet</li>';
      return;
    }

    DOM.peopleList.innerHTML = entries.map(([name, balance]) => {
      const sign = balance > 0 ? 'owes' : 'is owed';
      const amount = Math.abs(balance).toFixed(2);
      return `<li>
        <strong>${name}</strong> ${sign} ${amount}
        <button class="btn btn-small" onclick="expenseTracker.removePerson('${name}')">Clean</button>
      </li>`;
    }).join('');
  }

  // Update budget display
  function updateBudget(spent) {
    if (DOM.budgetBar && DOM.budgetSpent && DOM.budgetRemaining) {
      if (monthlyBudget <= 0) {
        DOM.budgetBar.style.width = '0%';
        DOM.budgetBar.className = 'budget-bar';
        DOM.budgetSpent.textContent = 'No budget set';
        DOM.budgetRemaining.textContent = '';
        return;
      }

      const percentage = Math.min((spent / monthlyBudget) * 100, 100);
      const remaining = monthlyBudget - spent;

      DOM.budgetBar.style.width = percentage + '%';
      DOM.budgetBar.className = 'budget-bar';
      if (percentage > 100) DOM.budgetBar.classList.add('over');
      else if (percentage > 80) DOM.budgetBar.classList.add('warning');

      DOM.budgetSpent.textContent = `${formatCurrency(spent)} spent`;
      DOM.budgetRemaining.textContent = `${formatCurrency(remaining)} remaining`;
    }
  }

  // Render category breakdown
  function renderCategoryBreakdown(totals, grandTotal) {
    if (!DOM.categoryBreakdown) return;

    const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);

    if (entries.length === 0) {
      DOM.categoryBreakdown.innerHTML = '<p>No data yet</p>';
      return;
    }

    DOM.categoryBreakdown.innerHTML = entries.map(([category, amount]) => {
      const catInfo = getCategoryInfo(category);
      const percentage = grandTotal > 0 ? (amount / grandTotal) * 100 : 0;

      return `
        <div class="category-item">
          <div class="category-icon">${catInfo.icon}</div>
          <div class="category-info">
            <div class="category-name">
              <span>${catInfo.label}</span>
              <span class="category-amount">${formatCurrency(amount)} (${percentage.toFixed(1)}%)</span>
            </div>
            <div class="category-bar-container">
              <div class="category-bar" style="width: ${percentage}%; background: ${catInfo.color};"></div>
            </div>
          </div>
        </div>
      `;
    }).join('');
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

  // Escape HTML
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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

  // Show toast
  let toastTimeout;
  function showToast(message) {
    DOM.toast.textContent = message;
    DOM.toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      DOM.toast.classList.remove('show');
    }, 2500);
  }

  // ==========================================
  // CATEGORY MANAGEMENT UI
  // ==========================================

  // Add category form handler
  function handleAddCategory(e) {
    e.preventDefault();
    const name = document.getElementById('newCategoryName').value.trim();
    const icon = document.getElementById('newCategoryIcon').value;
    const color = document.getElementById('newCategoryColor').value;

    if (!name) {
      showToast('Category name required');
      return;
    }

    const key = addCategory(name, icon, color);
    showToast(`Category "${name}" added!`);
    
    // Close modal and re-render
    const modal = document.getElementById('addCategoryModal');
    if (modal) modal.close();
    render();
    renderCategoryBreakdown(getCategoryTotals(), grandTotal);
  }

  // ==========================================
  // PEOPLE MANAGEMENT UI
  // ==========================================

  // Render people sidebar
  function renderPeopleSidebar() {
    if (!DOM.peopleSidebar) return;
    
    if (people.length === 0) {
      DOM.peopleSidebar.innerHTML = '<p>No people yet. Add someone above.</p>';
      return;
    }

    DOM.peopleSidebar.innerHTML = people.map(person => `
      <div style="padding: 10px; border-bottom: 1px solid var(--border);">
        <span style="font-weight: 600; cursor: pointer;" onclick="expenseTracker.togglePersonDetail('${person.name}')">${person.name}</span>
        <span style="font-size: 0.7rem; color: var(--text-secondary);">(${getPersonBalanceDisplay(person.name)})</span>
      </div>
    `).join('');
  }

  // Get person balance display string
  function getPersonBalanceDisplay(personName) {
    const balance = getPersonBalances()[personName] || 0;
    if (balance > 0) return `${balance.toFixed(2)} owed`;
    if (balance < 0) return `${Math.abs(balance).toFixed(2)} received`;
    return 'no transactions';
  }

  // Toggle person detail modal
  function togglePersonDetail(personName) {
    const balance = getPersonBalances()[personName] || 0;
    const modalContent = `
      <h3>${personName} Balance</h3>
      <p><strong>${balance > 0 ? 'Owed by others: ' : 'Owed to others: '}</strong>${Math.abs(balance).toFixed(2)}</p>
      <button class="btn btn-secondary" onclick="expenseTracker.removePerson('${personName}')">Remove person & clean expenses</button>
    `;
    
    // Show in a simple alert or create modal
    alert(`${personName}\n\n${balance > 0 ? 'Total owed BY this person: $' : 'Total owed TO this person: $'}${Math.abs(balance).toFixed(2)}\n\nDetails:\n` + 
      expenses.filter(e => e.fromPerson === personName || e.toPerson === personName)
        .map(e => `${e.type === 'expense' ? 'Expense' : 'Income'}: $${e.amount} - ${e.description}`)
        .join('\n')
    );
  }

  // ==========================================
  // EVENT LISTENERS
  // ==========================================

  function attachEventListeners() {
    // Form submit
    DOM.form.addEventListener('submit', handleSubmit);

    // Cancel edit
    DOM.cancelEditBtn.addEventListener('click', resetForm);

    // Currency
    DOM.currencySelect.addEventListener('change', function() {
      currentCurrency = this.value;
      saveState();
      updateCurrencyDisplay();
      render();
    });

    // Theme
    DOM.themeToggle.addEventListener('click', toggleTheme);

    // Filters
    DOM.searchInput.addEventListener('input', render);
    DOM.filterCategory.addEventListener('change', render);
    DOM.filterTime.addEventListener('change', render);
    DOM.sortBy.addEventListener('change', render);

    // Budget
    DOM.editBudgetBtn.addEventListener('click', editBudget);

    // Export
    DOM.exportBtn.addEventListener('click', exportCSV);

    // Clear all
    DOM.clearAllBtn.addEventListener('click', clearAll);

    // Category grid clicks
    DOM.categoryGrid.addEventListener('click', function(e) {
      const btn = e.target.closest('.category-btn');
      if (btn) {
        selectCategory(btn.dataset.value);
      }
    });

    // Add category button
    if (DOM.addCategoryBtn) {
      DOM.addCategoryBtn.addEventListener('click', function() {
        showAddCategoryModal();
      });
    }

    // Manage people button
    if (DOM.managePeopleBtn) {
      DOM.managePeopleBtn.addEventListener('click', function() {
        showPeopleManagement();
      });
    }

    // Person form
    if (DOM.personForm) {
      DOM.personForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const name = DOM.personInput.value.trim();
        if (name) {
          addPerson(name);
          showToast(`Person "${name}" added!`);
          DOM.personInput.value = '';
          renderPeopleSidebar();
          render();
        }
      });
    }

    // Delegate edit/delete clicks
    DOM.expenseList.addEventListener('click', function(e) {
      const editBtn = e.target.closest('.expense-action-btn.edit');
      const deleteBtn = e.target.closest('.expense-action-btn.delete');

      if (editBtn) {
        editExpense(editBtn.dataset.id);
      } else if (deleteBtn) {
        deleteExpense(deleteBtn.dataset.id);
      }
    });
  }

  // ==========================================
  // BUDGET EDIT
  // ==========================================

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

  // ==========================================
  // CSV EXPORT
  // ==========================================

  function exportCSV() {
    if (expenses.length === 0) {
      showToast('No expenses to export');
      return;
    }

    const headers = ['Date', 'Type', 'Description', 'Category', 'Amount', 'Payment', 'From Person', 'To Person'];
    const rows = expenses.map(exp => [
      exp.date,
      exp.type,
      `"${exp.description.replace(/"/g, '""')}"`,
      getCategoryInfo(exp.category).label,
      exp.amount.toFixed(2),
      exp.paymentMethod || '',
      exp.fromPerson || '',
      exp.toPerson || ''
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exported!');
  }

  // ==========================================
  // CLEAR ALL
  // ==========================================

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

  // ==========================================
  // TOGGLE DARK MODE
  // ==========================================

  function toggleTheme() {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    localStorage.setItem('expenseTrackerTheme', isDark ? 'dark' : 'light');
    DOM.themeToggle.textContent = isDark ? '☀️' : '🌙';
  }

  // ==========================================
  // SELECT CATEGORY
  // ==========================================

  function selectCategory(value) {
    selectedCategory = value;
    DOM.categoryInput.value = value;
    document.querySelectorAll('.category-btn').forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.value === value);
    });
  }

  // ==========================================
  // SHOW MODALS
  // ==========================================

  function showAddCategoryModal() {
    // Create modal HTML
    const modalHTML = `
      <div id="addCategoryModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
        <div style="background: var(--card-bg); padding: 24px; border-radius: var(--radius); width: 90%; max-width: 400px;">
          <h3>Add New Category</h3>
          <form id="categoryForm">
            <div class="form-group">
              <label>Category Name</label>
              <input type="text" id="newCategoryName" required>
            </div>
            <div class="form-group">
              <label>Icon (emoji)</label>
              <input type="text" id="newCategoryIcon" value="📦" maxlength="5" placeholder="🍔">
            </div>
            <div class="form-group">
              <label>Color (hex)</label>
              <input type="color" id="newCategoryColor" value="#a0a0a0">
            </div>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary">Create Category</button>
              <button type="button" class="btn btn-secondary" onclick="document.getElementById('addCategoryModal').close()">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Handle form submit
    const modal = document.getElementById('addCategoryModal');
    modal.querySelector('form').addEventListener('submit', handleAddCategory);
    
    // Close on outside click
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        modal.close();
        document.body.removeChild(modal);
      }
    });
  }

  function showPeopleManagement() {
    const balances = getPersonBalances();
    let html = `
      <h3>People Management</h3>
      <p>Add people you've lent money to or borrowed from.</p>
      <form id="personAddForm">
        <input type="text" id="newPersonName" placeholder="Person name" required>
        <button type="submit" class="btn btn-primary">Add Person</button>
      </form>
      <h4>Current People</h4>
      <ul>`;

    people.forEach(person => {
      const balance = getPersonBalances()[person.name] || 0;
      html += `<li>
        ${person.name} 
        <span style="color: ${balance > 0 ? 'var(--danger)' : 'var(--success)'};">
          ${balance > 0 ? `Others owe: $${balance.toFixed(2)}` : `You are owed: $${Math.abs(balance).toFixed(2)}`}
        </span>
        <button class="btn btn-small" style="margin-left: 10px;" onclick="expenseTracker.removePerson('${person.name}')">Remove</button>
      </li>`;
    });

    html += `</ul><button class="btn btn-secondary" onclick="document.getElementById('personManagementModal').close()">Close</button>`;

    const modalHTML = `
      <div id="personManagementModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
        <div style="background: var(--card-bg); padding: 24px; border-radius: var(--radius); width: 90%; max-width: 400px;">
          ${html}
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Handle add person form
    const form = document.getElementById('personAddForm');
    if (form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('newPersonName').value.trim();
        if (name) {
          addPerson(name);
          showToast(`Person "${name}" added!`);
          document.getElementById('personManagementModal').close();
          document.body.removeChild(document.getElementById('personManagementModal'));
          renderPeopleSidebar();
          render();
        }
      });
    }

    // Close on outside click
    const modal = document.getElementById('personManagementModal');
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        modal.close();
        document.body.removeChild(modal);
      }
    });
  }

  // Start the app
  init();
})();