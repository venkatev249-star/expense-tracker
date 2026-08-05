// Chart instances
let categoryChart = null;
let trendsChart = null;

function renderCategoryChart(data) {
    const ctx = document.getElementById('chart-category').getContext('2d');

    if (categoryChart) {
        categoryChart.destroy();
    }

    if (!data || data.length === 0) {
        ctx.font = '14px Inter';
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.fillText('No expense data available', ctx.canvas.width / 2, ctx.canvas.height / 2);
        return;
    }

    const labels = data.map(item => item.category);
    const totals = data.map(item => item.total);

    const colors = [
        '#6366f1', '#10b981', '#f59e0b', '#ef4444', 
        '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
    ];

    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: totals,
                backgroundColor: colors.slice(0, labels.length),
                borderColor: '#111827',
                borderWidth: 2,
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: '#94a3b8',
                        font: { family: 'Inter', size: 12 },
                        padding: 15,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const val = context.raw || 0;
                            return ` $${val.toFixed(2)}`;
                        }
                    }
                }
            },
            cutout: '70%'
        }
    });
}

function renderTrendsChart(trendsData) {
    const ctx = document.getElementById('chart-trends').getContext('2d');

    if (trendsChart) {
        trendsChart.destroy();
    }

    const months = Object.keys(trendsData).sort();

    if (months.length === 0) {
        return;
    }

    const incomeSeries = months.map(m => trendsData[m].income || 0);
    const expenseSeries = months.map(m => trendsData[m].expense || 0);

    trendsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Income',
                    data: incomeSeries,
                    backgroundColor: '#10b981',
                    borderRadius: 4
                },
                {
                    label: 'Expense',
                    data: expenseSeries,
                    backgroundColor: '#ef4444',
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#94a3b8', font: { family: 'Inter' } }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: {
                        color: '#94a3b8',
                        font: { family: 'Inter' },
                        callback: function(value) { return '$' + value; }
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#94a3b8',
                        font: { family: 'Inter', size: 12 },
                        usePointStyle: true
                    }
                }
            }
        }
    });
}
