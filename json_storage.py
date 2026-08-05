import json
import os
from datetime import datetime

DATA_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "finance_data.json")

DEFAULT_DATA = {
    "transactions": [
        {
            "id": 1,
            "title": "Software Engineer Salary",
            "amount": 4500.0,
            "type": "income",
            "category": "Salary",
            "date": "2026-08-01",
            "description": "Monthly payroll salary"
        },
        {
            "id": 2,
            "title": "Apartment Rent",
            "amount": 1200.0,
            "type": "expense",
            "category": "Housing & Rent",
            "date": "2026-08-02",
            "description": "Monthly rent payment"
        },
        {
            "id": 3,
            "title": "Whole Foods Market",
            "amount": 145.50,
            "type": "expense",
            "category": "Food & Dining",
            "date": "2026-08-03",
            "description": "Weekly groceries"
        },
        {
            "id": 4,
            "title": "Freelance Web Design",
            "amount": 850.0,
            "type": "income",
            "category": "Freelance",
            "date": "2026-07-25",
            "description": "Client website design"
        },
        {
            "id": 5,
            "title": "Electricity Bill",
            "amount": 125.80,
            "type": "expense",
            "category": "Utilities",
            "date": "2026-07-28",
            "description": "Utility bill payment"
        },
        {
            "id": 6,
            "title": "Amazon Electronics",
            "amount": 189.99,
            "type": "expense",
            "category": "Shopping",
            "date": "2026-07-22",
            "description": "Headphones"
        }
    ],
    "budgets": [
        {"id": 1, "category": "Food & Dining", "monthly_limit": 600.0},
        {"id": 2, "category": "Housing & Rent", "monthly_limit": 1200.0},
        {"id": 3, "category": "Shopping", "monthly_limit": 300.0},
        {"id": 4, "category": "Entertainment", "monthly_limit": 200.0},
        {"id": 5, "category": "Transportation", "monthly_limit": 250.0},
        {"id": 6, "category": "Utilities", "monthly_limit": 180.0}
    ]
}

def load_data():
    if not os.path.exists(DATA_FILE):
        save_data(DEFAULT_DATA)
        return DEFAULT_DATA
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        save_data(DEFAULT_DATA)
        return DEFAULT_DATA

def save_data(data):
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4)

class JSONTransactionManager:
    @staticmethod
    def get_all(type_filter=None, category_filter=None, search_query=None):
        data = load_data()
        transactions = data.get("transactions", [])

        if type_filter and type_filter != "all":
            transactions = [t for t in transactions if t.get("type") == type_filter]

        if category_filter and category_filter != "all":
            transactions = [t for t in transactions if t.get("category") == category_filter]

        if search_query:
            query = search_query.lower()
            transactions = [
                t for t in transactions 
                if query in t.get("title", "").lower() or query in t.get("description", "").lower()
            ]

        # Sort by date descending
        transactions.sort(key=lambda x: x.get("date", ""), reverse=True)
        return transactions

    @staticmethod
    def add(title, amount, trans_type, category, date, description=""):
        data = load_data()
        transactions = data.get("transactions", [])
        
        new_id = max([t.get("id", 0) for t in transactions], default=0) + 1
        new_trans = {
            "id": new_id,
            "title": title,
            "amount": float(amount),
            "type": trans_type,
            "category": category,
            "date": date,
            "description": description
        }
        transactions.append(new_trans)
        data["transactions"] = transactions
        save_data(data)
        return new_id

    @staticmethod
    def delete(transaction_id):
        data = load_data()
        transactions = data.get("transactions", [])
        initial_len = len(transactions)
        transactions = [t for t in transactions if t.get("id") != transaction_id]
        if len(transactions) < initial_len:
            data["transactions"] = transactions
            save_data(data)
            return True
        return False

class JSONAnalyticsManager:
    @staticmethod
    def get_summary():
        data = load_data()
        transactions = data.get("transactions", [])

        total_income = sum(t["amount"] for t in transactions if t.get("type") == "income")
        total_expense = sum(t["amount"] for t in transactions if t.get("type") == "expense")
        net_balance = total_income - total_expense
        savings_rate = round(((total_income - total_expense) / total_income * 100), 1) if total_income > 0 else 0.0

        # Category Breakdown
        cat_totals = {}
        for t in transactions:
            if t.get("type") == "expense":
                cat = t.get("category", "Other")
                cat_totals[cat] = cat_totals.get(cat, 0.0) + t.get("amount", 0.0)

        expenses_by_category = [
            {"category": k, "total": round(v, 2)} 
            for k, v in sorted(cat_totals.items(), key=lambda x: x[1], reverse=True)
        ]

        # Monthly Trends
        monthly_trends = {}
        for t in transactions:
            date_str = t.get("date", "")
            if len(date_str) >= 7:
                m = date_str[:7]
                if m not in monthly_trends:
                    monthly_trends[m] = {"income": 0.0, "expense": 0.0}
                t_type = t.get("type", "expense")
                if t_type in monthly_trends[m]:
                    monthly_trends[m][t_type] += t.get("amount", 0.0)

        return {
            "total_income": round(total_income, 2),
            "total_expense": round(total_expense, 2),
            "net_balance": round(net_balance, 2),
            "savings_rate": savings_rate,
            "expenses_by_category": expenses_by_category,
            "monthly_trends": monthly_trends
        }

class JSONBudgetManager:
    @staticmethod
    def get_budgets_with_spending():
        data = load_data()
        budgets = data.get("budgets", [])
        transactions = data.get("transactions", [])
        
        current_month = datetime.now().strftime("%Y-%m")

        results = []
        for b in budgets:
            cat = b.get("category")
            limit = b.get("monthly_limit", 0.0)
            
            # Sum spent in current month for this category
            spent = sum(
                t.get("amount", 0.0) for t in transactions
                if t.get("type") == "expense" and t.get("category") == cat and t.get("date", "").startswith(current_month)
            )
            
            percentage = round((spent / limit * 100), 1) if limit > 0 else 0.0
            results.append({
                "id": b.get("id"),
                "category": cat,
                "monthly_limit": limit,
                "spent": round(spent, 2),
                "remaining": max(0.0, round(limit - spent, 2)),
                "percentage": percentage,
                "is_over_budget": spent > limit
            })
        return results

    @staticmethod
    def set_budget(category, monthly_limit):
        data = load_data()
        budgets = data.get("budgets", [])
        
        updated = False
        for b in budgets:
            if b.get("category") == category:
                b["monthly_limit"] = float(monthly_limit)
                updated = True
                break
        
        if not updated:
            new_id = max([b.get("id", 0) for b in budgets], default=0) + 1
            budgets.append({
                "id": new_id,
                "category": category,
                "monthly_limit": float(monthly_limit)
            })
        
        data["budgets"] = budgets
        save_data(data)
        return True

def reset_to_default():
    save_data(DEFAULT_DATA)
