from json_storage import reset_to_default

def seed_data():
    reset_to_default()
    print("Database-free JSON storage seeded with initial sample transactions and budgets!")

if __name__ == "__main__":
    seed_data()
