from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
import sqlite3
import os
import pandas as pd
import io

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE = os.path.join(BASE_DIR, "database.db")

def get_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def upgrade_database():
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()

    # Original schema alterations
    try:
        cursor.execute("ALTER TABLE purchases ADD COLUMN is_adjustment INTEGER DEFAULT 0")
    except Exception:
        pass

    try:
        cursor.execute("ALTER TABLE purchases ADD COLUMN reason TEXT")
    except Exception:
        pass

    try:
        cursor.execute("ALTER TABLE sales ADD COLUMN is_adjustment INTEGER DEFAULT 0")
    except Exception:
        pass

    try:
        cursor.execute("ALTER TABLE sales ADD COLUMN reason TEXT")
    except Exception:
        pass

    # Page expansion updates (Invoices, Customers, and Machine variants)
    try:
        cursor.execute("ALTER TABLE sales ADD COLUMN invoice_number TEXT")
    except Exception:
        pass

    try:
        cursor.execute("ALTER TABLE sales ADD COLUMN customer_name TEXT")
    except Exception:
        pass

    try:
        cursor.execute("ALTER TABLE parts ADD COLUMN vehicle_model TEXT DEFAULT 'General'")
    except Exception:
        pass

    conn.commit()
    conn.close()

def init_supplier_table():
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS suppliers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            contact_person TEXT,
            phone TEXT,
            email TEXT,
            gst_number TEXT,
            brands_supplied TEXT,
            address TEXT
        )
    """)
    conn.commit()
    conn.close()

# Run database setup structures automatically on spin-up
upgrade_database()
init_supplier_table()


@app.route("/parts")
def get_parts():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM parts ORDER BY part_number")
    parts = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(parts)


@app.route("/purchase", methods=["POST"])
def add_purchase():
    data = request.json
    print("PURCHASE DATA:", data)

    part_number = data["part_number"]
    brand = data.get("brand", "")
    quantity = int(data["quantity"])
    unit_cost = float(data["unit_cost"])
    date = data["date"]
    vehicle_model = data.get("vehicle_model", "General")

    is_adjustment = 1 if data.get("is_adjustment") else 0
    reason = data.get("reason", "")

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO purchases (date, part_number, quantity, unit_cost, is_adjustment, reason)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (date, part_number, quantity, unit_cost, is_adjustment, reason))

    cursor.execute("SELECT part_number FROM parts WHERE part_number = ?", (part_number,))
    part = cursor.fetchone()

    if part:
        cursor.execute("""
            UPDATE parts
            SET stock = stock + ?, vehicle_model = ?
            WHERE part_number = ?
        """, (quantity, vehicle_model, part_number))
    else:
        cursor.execute("""
            INSERT INTO parts (part_number, brand, stock, purchase_price, vehicle_model)
            VALUES (?, ?, ?, ?, ?)
        """, (part_number, brand, quantity, unit_cost, vehicle_model))

    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Purchase saved"})


@app.route("/sale", methods=["POST"])
def add_sale():
    data = request.json
    part_number = data["part_number"]
    quantity = int(data["quantity"])
    selling_price = float(data["selling_price"])
    date = data["date"]
    invoice_number = data.get("invoice_number", "")
    customer_name = data.get("customer_name", "")

    is_adjustment = 1 if data.get("is_adjustment") else 0
    reason = data.get("reason", "")

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT stock FROM parts WHERE part_number = ?", (part_number,))
    part = cursor.fetchone()

    if not part:
        conn.close()
        return jsonify({"success": False, "message": "Part not found"})

    current_stock = part["stock"]
    if quantity > current_stock:
        conn.close()
        return jsonify({"success": False, "message": "Insufficient stock"})

    cursor.execute("""
        INSERT INTO sales (date, part_number, quantity, selling_price, is_adjustment, reason, invoice_number, customer_name)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (date, part_number, quantity, selling_price, is_adjustment, reason, invoice_number, customer_name))

    cursor.execute("UPDATE parts SET stock = stock - ? WHERE part_number = ?", (quantity, part_number))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Sale recorded"})


@app.route("/purchases")
def get_purchases():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM purchases ORDER BY id DESC")
    purchases = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(purchases)


@app.route("/sales")
def get_sales():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM sales ORDER BY id DESC")
    sales = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(sales)


@app.route("/dashboard")
def dashboard():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM parts")
    total_parts = cursor.fetchone()[0]

    cursor.execute("SELECT SUM(stock) FROM parts")
    total_units_raw = cursor.fetchone()[0]
    total_units = total_units_raw if total_units_raw is not None else 0

    cursor.execute("SELECT COUNT(*) FROM parts WHERE stock > 0 AND stock <= 2")
    low_stock = cursor.fetchone()[0]

    cursor.execute("SELECT SUM(COALESCE(stock,0) * COALESCE(purchase_price,0)) FROM parts")
    inventory_value_raw = cursor.fetchone()[0]
    inventory_value = inventory_value_raw if inventory_value_raw is not None else 0

    conn.close()
    return jsonify({
        "total_parts": total_parts,
        "total_units": total_units,
        "low_stock": low_stock,
        "inventory_value": round(inventory_value, 2)
    })


# FIXED: Accepts part_name (part_number text key string) to handle row edit lookups seamlessly
@app.route("/parts/<string:part_name>", methods=["PUT"])
def update_part(part_name):
    data = request.json
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE parts
        SET part_number = ?, 
            brand = ?, 
            stock = ?, 
            purchase_price = ?, 
            selling_price = ?, 
            vehicle_model = ?
        WHERE part_number = ?
    """, (
        data.get("part_number"), data.get("brand"), data.get("stock"),
        data.get("purchase_price"), data.get("selling_price"),
        data.get("vehicle_model", "General"), part_name
    ))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Part updated"})


@app.route("/parts/<string:part_name>", methods=["DELETE"])
def delete_part(part_name):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM parts WHERE part_number = ?", (part_name,))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Part deleted"})


@app.route("/supplier", methods=["POST"])
def add_supplier():
    data = request.json
    name = data.get("name", "").strip()
    if not name:
        return jsonify({"success": False, "message": "Supplier Name is required."}), 400

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO suppliers (name, contact_person, phone, email, gst_number, brands_supplied, address)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (name, data.get("contact_person", ""), data.get("phone", ""), data.get("email", ""), data.get("gst_number", ""), data.get("brands_supplied", ""), data.get("address", "")))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Supplier Saved Successfully."})


@app.route("/suppliers")
def get_suppliers():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM suppliers ORDER BY name ASC")
    suppliers = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(suppliers)


@app.route("/import-excel", methods=["POST"])
def import_excel():
    if "file" not in request.files:
        return jsonify({"success": False, "message": "No file provided"}), 400
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"success": False, "message": "No file selected"}), 400

    try:
        df = pd.read_excel(file)
        conn = get_connection()
        cursor = conn.cursor()
        for _, row in df.iterrows():
            part_number = str(row.get("part_number", "")).strip()
            brand = str(row.get("brand", "")).strip()
            stock = int(row.get("stock", 0))
            purchase_price = float(row.get("purchase_price", 0.0))
            vehicle_model = str(row.get("vehicle_model", "General")).strip()

            if not part_number:
                continue
            cursor.execute("SELECT part_number FROM parts WHERE part_number = ?", (part_number,))
            if cursor.fetchone():
                cursor.execute("UPDATE parts SET stock = ?, brand = ?, purchase_price = ?, vehicle_model = ? WHERE part_number = ?", (stock, brand, purchase_price, vehicle_model, part_number))
            else:
                cursor.execute("INSERT INTO parts (part_number, brand, stock, purchase_price, vehicle_model) VALUES (?, ?, ?, ?, ?)", (part_number, brand, stock, purchase_price, vehicle_model))
        conn.commit()
        conn.close()
        return jsonify({"success": True, "message": "Excel data successfully imported!"})
    except Exception as e:
        return jsonify({"success": False, "message": f"Processing error: {str(e)}"}), 500


@app.route("/export-excel")
def export_excel():
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT part_number, brand, stock, purchase_price, vehicle_model FROM parts")
        parts_list = [dict(row) for row in cursor.fetchall()]
        conn.close()

        df = pd.DataFrame(parts_list)
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            df.to_excel(writer, index=False, sheet_name="Inventory")
        output.seek(0)

        return send_file(
            output,
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            as_attachment=True,
            download_name="inventory_export.xlsx"
        )
    except Exception as e:
        return jsonify({"success": False, "message": f"Export failed: {str(e)}"}), 500


if __name__ == "__main__":
    print("APP STARTED — STABLE RE-LINKED ENGINE WORKING")
    app.run(debug=True)