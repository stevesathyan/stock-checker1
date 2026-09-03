import { useState, useEffect } from "react";

export default function Sales() {
  const today = new Date().toISOString().split("T")[0];

  const [date, setDate] = useState(today);
  const [invoice, setInvoice] = useState("");
  const [customer, setCustomer] = useState("");
  const [partNumber, setPartNumber] = useState("");
  const [quantity, setQuantity] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [message, setMessage] = useState("");
  const [salesHistory, setSalesHistory] = useState([]); // Dynamic state tracking

  const total = (Number(quantity) || 0) * (Number(sellingPrice) || 0);

  // Hook to pull previous transactions on component mount
  useEffect(() => {
    loadSalesHistory();
  }, []);

  async function loadSalesHistory() {
    try {
      // FIXED: Routed via internal Vite /api proxy
      const response = await fetch("/api/sales");
      const data = await response.json();
      setSalesHistory(data);
    } catch (error) {
      console.error("Error reading sales database files:", error);
    }
  }

  async function recordSale() {
    if (!partNumber.trim()) {
      setMessage("Part Number is required.");
      return;
    }
    if (!quantity || Number(quantity) <= 0) {
      setMessage("Quantity must be greater than 0.");
      return;
    }
    if (!sellingPrice || Number(sellingPrice) < 0) {
      setMessage("Invalid Selling Price.");
      return;
    }

    try {
      // FIXED: Routed via internal Vite /api proxy
      const response = await fetch("/api/sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          invoice_number: invoice,
          customer_name: customer,
          part_number: partNumber,
          quantity: Number(quantity),
          selling_price: Number(sellingPrice),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage("Sale Recorded Successfully.");
        setInvoice("");
        setCustomer("");
        setPartNumber("");
        setQuantity("");
        setSellingPrice("");
        
        // Refresh transaction list interface dynamically on post execution
        loadSalesHistory();
      } else {
        setMessage(data.message || "Failed to Record Sale.");
      }
    } catch (error) {
      console.error(error);
      setMessage("Failed to Record Sale.");
    }
  }

  return (
    <div>
      <h1 className="text-6xl font-bold text-white">Sales</h1>
      <p className="text-gray-400 mt-3 mb-10 text-xl">
        Record outgoing sales and customer transactions.
      </p>

      {/* Sales Form */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl mb-10">
        <h2 className="text-2xl font-semibold mb-6 text-white">Record Sale</h2>

        <div className="grid grid-cols-2 gap-6">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none text-white focus:border-blue-500/50 transition-all"
          />

          <input
            placeholder="Invoice Number (Optional)"
            value={invoice}
            onChange={(e) => setInvoice(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none text-white focus:border-blue-500/50 transition-all"
          />

          <input
            placeholder="Customer Name"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none text-white focus:border-blue-500/50 transition-all"
          />

          <input
            placeholder="Part Number"
            value={partNumber}
            onChange={(e) => setPartNumber(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none text-white focus:border-blue-500/50 transition-all"
          />

          <input
            type="number"
            min="1"
            step="1"
            placeholder="Quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none text-white focus:border-blue-500/50 transition-all"
          />

          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Selling Price"
            value={sellingPrice}
            onChange={(e) => setSellingPrice(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none text-white focus:border-blue-500/50 transition-all"
          />
        </div>

        {/* Revenue */}
        <div className="mt-6 bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="text-gray-400 text-sm">Estimated Revenue</div>
          <div className="text-3xl font-bold mt-2">₹{total.toLocaleString('en-IN')}</div>
        </div>

        <button
          onClick={recordSale}
          className="mt-6 px-8 py-4 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-500 font-semibold hover:scale-105 transition-all text-white cursor-pointer"
        >
          Record Sale
        </button>

        {message && (
          <div className={`mt-4 font-medium ${message.includes("Successfully") ? "text-emerald-400" : "text-rose-400"}`}>
            {message}
          </div>
        )}
      </div>

      {/* Recent Sales Data Table */}
      <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
        <div className="p-6 border-b border-white/10 bg-white/5">
          <h2 className="text-2xl font-semibold text-white">Recent Sales</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-left text-gray-400 border-b border-white/10 bg-white/5">
              <th className="p-6">Date</th>
              <th>Invoice</th>
              <th>Customer</th>
              <th>Part Number</th>
              <th>Qty</th>
              <th>Price</th>
              <th className="p-6">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {salesHistory.map((sale) => {
              const saleQty = sale.quantity || 0;
              const salePrice = sale.selling_price || 0;
              return (
                <tr key={sale.id} className="border-t border-white/5 hover:bg-white/5 transition text-white">
                  <td className="p-6">{sale.date}</td>
                  <td className="font-mono text-gray-400">{sale.invoice_number || "—"}</td>
                  <td>{sale.customer_name || "Walk-in Customer"}</td>
                  <td className="font-mono text-cyan-400">{sale.part_number}</td>
                  <td>{saleQty} pcs</td>
                  <td>₹{salePrice.toLocaleString('en-IN')}</td>
                  <td className="p-6 font-bold text-emerald-400">₹{(saleQty * salePrice).toLocaleString('en-IN')}</td>
                </tr>
              );
            })}
            {salesHistory.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center p-10 text-gray-500">
                  No outgoing sales transactions logged yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
