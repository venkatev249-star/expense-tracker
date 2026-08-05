import csv
import io
from flask import Flask, render_template, request, jsonify, Response
from json_storage import (
    JSONTransactionManager, 
    JSONAnalyticsManager, 
    JSONBudgetManager, 
    reset_to_default,
    load_data
)

app = Flask(__name__)

# Ensure data file exists on startup
load_data()

@app.route('/')
def index():
    return render_template('index.html')
@app.route('/api/summary', methods=['GET'])
def get_summary():
    try:
        summary = JSONAnalyticsManager.get_summary()
        return jsonify({'status': 'success', 'data': summary}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    try:
        type_filter = request.args.get('type')
        category_filter = request.args.get('category')
        search_query = request.args.get('search')
        
        transactions = JSONTransactionManager.get_all(type_filter, category_filter, search_query)
        return jsonify({'status': 'success', 'data': transactions}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/transactions', methods=['POST'])
def add_transaction():
    try:
        data = request.json
        if not data:
            return jsonify({'status': 'error', 'message': 'No JSON input provided'}), 400

        title = data.get('title')
        amount = data.get('amount')
        trans_type = data.get('type')
        category = data.get('category')
        date = data.get('date')
        description = data.get('description', '')

        if not all([title, amount, trans_type, category, date]):
            return jsonify({'status': 'error', 'message': 'Missing required fields'}), 400

        new_id = JSONTransactionManager.add(title, amount, trans_type, category, date, description)
        return jsonify({'status': 'success', 'id': new_id, 'message': 'Transaction added successfully'}), 201
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/transactions/<int:trans_id>', methods=['DELETE'])
def delete_transaction(trans_id):
    try:
        success = JSONTransactionManager.delete(trans_id)
        if success:
            return jsonify({'status': 'success', 'message': 'Transaction deleted'}), 200
        else:
            return jsonify({'status': 'error', 'message': 'Transaction not found'}), 404
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/budgets', methods=['GET'])
def get_budgets():
    try:
        budgets = JSONBudgetManager.get_budgets_with_spending()
        return jsonify({'status': 'success', 'data': budgets}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/budgets', methods=['POST'])
def set_budget():
    try:
        data = request.json
        category = data.get('category')
        monthly_limit = data.get('monthly_limit')

        if not category or monthly_limit is None:
            return jsonify({'status': 'error', 'message': 'Category and limit are required'}), 400

        JSONBudgetManager.set_budget(category, monthly_limit)
        return jsonify({'status': 'success', 'message': 'Budget updated'}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/export-csv', methods=['GET'])
def export_csv():
    try:
        transactions = JSONTransactionManager.get_all()
        
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(['ID', 'Title', 'Amount ($)', 'Type', 'Category', 'Date', 'Description'])
        
        for t in transactions:
            writer.writerow([t['id'], t['title'], t['amount'], t['type'], t['category'], t['date'], t.get('description', '')])
        
        output.seek(0)
        return Response(
            output.getvalue(),
            mimetype='text/csv',
            headers={'Content-Disposition': 'attachment; filename=financial_transactions.csv'}
        )
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/seed', methods=['POST'])
def seed_api():
    try:
        reset_to_default()
        return jsonify({'status': 'success', 'message': 'Sample data reset successfully'}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    print("Starting Database-Free Personal Finance Tracker...")
    app.run(debug=True, port=5000)
