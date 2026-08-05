document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    setupNavigation();
    setupModals();
    setupForms();
    setupFilters();
    setupSeedButton();

    // Default Today date in transaction modal
    const dateInput = document.getElementById('trans-date');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }

    // Initial Load
    loadSummaryData();
    loadTransactions();
    loadBudgets();
}

// ----------------------------------------------------
// Navigation Tab Switcher
// ----------------------------------------------------
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const tabName = item.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-view').forEach(el => el.classList.remove('active'));

    const selectedNav = document.querySelector(`.nav-item[data-tab="${tabName}"]`);
    const selectedView = document.getElementById(`view-${tabName}`);

    if (selectedNav && selectedView) {
        selectedNav.classList.add('active');
        selectedView.classList.add('active');
    }

    // Update Header Text based on active tab
    const titleEl = document.getElementById('page-title');
    const subTitleEl = document.getElementById('page-subtitle');

    if (tabName === 'dashboard') {
        titleEl.textContent = 'Financial Dashboard';
        subTitleEl.textContent = 'Track your net worth, expenses, and savings in real time.';
    } else if (tabName === 'transactions') {
        titleEl.textContent = 'Transaction History';
        subTitleEl.textContent = 'View, filter, and manage all your income and expenses.';
    } else if (tabName === 'budgets') {
        titleEl.textContent = 'Budgets & Goals';
        subTitleEl.textContent = 'Monitor monthly spending limits and budget health.';
    }
}

// ----------------------------------------------------
// Modals & UI Dialogs
// ----------------------------------------------------
function setupModals() {
    const transModal = document.getElementById('modal-transaction');
    const budgetModal = document.getElementById('modal-budget');

    document.getElementById('btn-open-modal')?.addEventListener('click', () => {
        transModal.classList.add('open');
    });

    document.getElementById('btn-close-modal')?.addEventListener('click', () => {
        transModal.classList.remove('open');
    });

    document.getElementById('btn-cancel-modal')?.addEventListener('click', () => {
        transModal.classList.remove('open');
    });

    document.getElementById('btn-open-budget-modal')?.addEventListener('click', () => {
        budgetModal.classList.add('open');
    });

    document.getElementById('btn-close-budget-modal')?.addEventListener('click', () => {
        budgetModal.classList.remove('open');
    });

    document.getElementById('btn-cancel-budget-modal')?.addEventListener('click', () => {
        budgetModal.classList.remove('open');
    });
}

// ----------------------------------------------------
// Data Fetching Functions
// ----------------------------------------------------
async function loadSummaryData() {
    try {
        const response = await fetch('/api/summary');
        const result = await response.json();

        if (result.status === 'success') {
            const data = result.data;
            document.getElementById('val-net-balance').textContent = formatCurrency(data.net_balance);
            document.getElementById('val-total-income').textContent = formatCurrency(data.total_income);
            document.getElementById('val-total-expense').textContent = formatCurrency(data.total_expense);
            
            const savingsBadge = document.getElementById('val-savings-rate');
            savingsBadge.textContent = `${data.savings_rate}% Savings Rate`;
            
            if (data.savings_rate < 0) {
                savingsBadge.className = 'trend-badge negative';
            } else {
                savingsBadge.className = 'trend-badge positive';
            }

            // Render Charts
            renderCategoryChart(data.expenses_by_category);
            renderTrendsChart(data.monthly_trends);
        }
    } catch (err) {
        console.error('Failed to load summary analytics:', err);
    }
}

async function loadTransactions() {
    try {
        const typeVal = document.getElementById('filter-type')?.value || 'all';
        const catVal = document.getElementById('filter-category')?.value || 'all';
        const searchVal = document.getElementById('filter-search')?.value || '';

        const queryParams = new URLSearchParams({
            type: typeVal,
            category: catVal,
            search: searchVal
        });

        const response = await fetch(`/api/transactions?${queryParams.toString()}`);
        const result = await response.json();

        if (result.status === 'success') {
            renderTransactionsTables(result.data);
        }
    } catch (err) {
        console.error('Failed to load transactions:', err);
    }
}

async function loadBudgets() {
    try {
        const response = await fetch('/api/budgets');
        const result = await response.json();

        if (result.status === 'success') {
            renderBudgetsGrid(result.data);
        }
    } catch (err) {
        console.error('Failed to load budgets:', err);
    }
}

// ----------------------------------------------------
// UI Renderers
// ----------------------------------------------------
function renderTransactionsTables(transactions) {
    const recentTable = document.getElementById('recent-transactions-list');
    const allTable = document.getElementById('all-transactions-list');

    if (!transactions || transactions.length === 0) {
        const emptyRow = `<tr><td colspan="7" class="text-center py-4 text-muted">No transactions found</td></tr>`;
        if (recentTable) recentTable.innerHTML = emptyRow;
        if (allTable) allTable.innerHTML = emptyRow;
        return;
    }

    // Render Recent 5 for Dashboard
    const recentItems = transactions.slice(0, 5);
    recentTable.innerHTML = recentItems.map(t => `
        <tr>
            <td style="font-weight: 500;">${escapeHtml(t.title)}</td>
            <td><span class="type-badge ${t.type}">${t.category}</span></td>
            <td class="text-muted">${t.date}</td>
            <td><span class="type-badge ${t.type}">${t.type}</span></td>
            <td class="text-right ${t.type === 'income' ? 'amount-income' : 'amount-expense'}">
                ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}
            </td>
        </tr>
    `).join('');

    // Render All for Transactions View
    allTable.innerHTML = transactions.map(t => `
        <tr>
            <td class="text-muted">${t.date}</td>
            <td style="font-weight: 500;">${escapeHtml(t.title)}</td>
            <td>${escapeHtml(t.category)}</td>
            <td><span class="type-badge ${t.type}">${t.type}</span></td>
            <td class="text-muted">${escapeHtml(t.description || '-')}</td>
            <td class="text-right ${t.type === 'income' ? 'amount-income' : 'amount-expense'}">
                ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}
            </td>
            <td class="text-center">
                <button class="btn-icon-danger" onclick="deleteTransactionItem(${t.id})" title="Delete Transaction">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function renderBudgetsGrid(budgets) {
    const container = document.getElementById('budgets-container');

    if (!budgets || budgets.length === 0) {
        container.innerHTML = `<div class="text-center py-4 w-full">No budget limits configured.</div>`;
        return;
    }

    container.innerHTML = budgets.map(b => {
        let fillClass = '';
        if (b.percentage >= 100) fillClass = 'danger';
        else if (b.percentage >= 80) fillClass = 'warning';

        return `
            <div class="budget-item-card">
                <div class="budget-item-header">
                    <span class="budget-category-title">${escapeHtml(b.category)}</span>
                    <span class="trend-badge ${b.is_over_budget ? 'negative' : 'positive'}">
                        ${b.is_over_budget ? 'Over Limit' : `${b.percentage}% Used`}
                    </span>
                </div>
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill ${fillClass}" style="width: ${Math.min(100, b.percentage)}%;"></div>
                </div>
                <div class="budget-details">
                    <span>Spent: <strong>${formatCurrency(b.spent)}</strong></span>
                    <span>Limit: <strong>${formatCurrency(b.monthly_limit)}</strong></span>
                </div>
            </div>
        `;
    }).join('');
}

// ----------------------------------------------------
// Form Handlers & Actions
// ----------------------------------------------------
function setupForms() {
    // Add Transaction Form
    const transForm = document.getElementById('form-add-transaction');
    transForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const payload = {
            title: document.getElementById('trans-title').value,
            type: document.getElementById('trans-type').value,
            amount: parseFloat(document.getElementById('trans-amount').value),
            category: document.getElementById('trans-category').value,
            date: document.getElementById('trans-date').value,
            description: document.getElementById('trans-description').value
        };

        try {
            const response = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (result.status === 'success') {
                document.getElementById('modal-transaction').classList.remove('open');
                transForm.reset();
                // Refresh views
                loadSummaryData();
                loadTransactions();
                loadBudgets();
            } else {
                alert('Error adding transaction: ' + result.message);
            }
        } catch (err) {
            console.error('Failed to save transaction:', err);
        }
    });

    // Set Budget Form
    const budgetForm = document.getElementById('form-set-budget');
    budgetForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const payload = {
            category: document.getElementById('budget-category').value,
            monthly_limit: parseFloat(document.getElementById('budget-limit').value)
        };

        try {
            const response = await fetch('/api/budgets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (result.status === 'success') {
                document.getElementById('modal-budget').classList.remove('open');
                budgetForm.reset();
                loadBudgets();
            }
        } catch (err) {
            console.error('Failed to update budget:', err);
        }
    });
}

function setupFilters() {
    const typeSelect = document.getElementById('filter-type');
    const catSelect = document.getElementById('filter-category');
    const searchInput = document.getElementById('filter-search');

    typeSelect?.addEventListener('change', loadTransactions);
    catSelect?.addEventListener('change', loadTransactions);
    
    let debounceTimer;
    searchInput?.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(loadTransactions, 300);
    });
}

function setupSeedButton() {
    document.getElementById('btn-seed-data')?.addEventListener('click', async () => {
        if (confirm('This will seed demo financial data. Continue?')) {
            try {
                const response = await fetch('/api/seed', { method: 'POST' });
                const result = await response.json();
                if (result.status === 'success') {
                    loadSummaryData();
                    loadTransactions();
                    loadBudgets();
                }
            } catch (err) {
                console.error('Failed to seed database:', err);
            }
        }
    });
}

async function deleteTransactionItem(id) {
    if (confirm('Are you sure you want to delete this transaction record?')) {
        try {
            const response = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
            const result = await response.json();
            if (result.status === 'success') {
                loadSummaryData();
                loadTransactions();
                loadBudgets();
            }
        } catch (err) {
            console.error('Failed to delete transaction:', err);
        }
    }
}

// Helper Utilities
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, (m) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    })[m]);
}
