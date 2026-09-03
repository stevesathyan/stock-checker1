import sqlite3

conn = sqlite3.connect("database.db")

cursor = conn.cursor()

# Parts Table
cursor.execute("""
CREATE TABLE IF NOT EXISTS parts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    part_number TEXT UNIQUE NOT NULL,
    brand TEXT,
    stock INTEGER NOT NULL DEFAULT 0,
    purchase_price REAL,
    selling_price REAL
)
""")

# Purchases Table
cursor.execute("""
CREATE TABLE IF NOT EXISTS purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    part_number TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_cost REAL NOT NULL
)
""")

# Sales Table
cursor.execute("""
CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    part_number TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    selling_price REAL NOT NULL
)
""")

conn.commit()
conn.close()

print("Database created.")