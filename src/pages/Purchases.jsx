import { useState, useEffect } from "react";

export default function Purchases() {
  const today = new Date().toISOString().split("T")[0];

  const [date, setDate] = useState(today);
  const [partNumber, setPartNumber] = useState("");
  const [brand, setBrand] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");

  const [message, setMessage] = useState("");
  const [purchaseHistory, setPurchaseHistory] = useState([]); // Added state to track transaction lists

  const total = (Number(quantity) || 0) * (Number(unitCost) || 0);

  // Hook to pull previous purchase logs on load
  useEffect(() => {
    loadPurchaseHistory();
  }, []);

  async function loadPurchaseHistory() {
    try {
      // FIXED: Routed via internal Vite /api proxy
      const response = await fetch("/api/purchases");
      const data = await response.json();
      setPurchaseHistory(data);
    } catch (error) {
      console.error("Error loading purchase logs:", error);
    }
  }

  async function savePurchase() {
    if (!partNumber.trim()) {
      setMessage("Part Number is required");
      return;
    }

    if (!quantity || Number(quantity) <= 0) {
      setMessage("Quantity must be greater than 0");
      return;
    }

    if (!unitCost || Number(unitCost) < 0) {
      setMessage("Invalid Unit Cost");
      return;
    }

    try {
      // FIXED: Routed via internal Vite /api proxy
      const response = await fetch("/api/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          date,
          part_number: partNumber,
          brand,
          quantity: Number(quantity),
          unit_cost: Number(unitCost)
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage("Purchase Saved Successfully");
        setPartNumber("");
        setBrand("");
        setQuantity("");
        setUnitCost("");
        
        // Refresh the table history immediately on submission success
        loadPurchaseHistory();
      } else {
        setMessage("Failed to Save Purchase");
      }
    } catch (error) {
      console.error(error);
      setMessage("Failed to Save Purchase");
    }
  }

  return (
    <div>
      <h1 className="text-6xl font-bold">Purchases</h1>
      <p className="text-gray-400 mt-3 mb-10 text-xl">
        Record incoming inventory purchases.
      </p>

      <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl mb-10">
        <h2 className="text-2xl font-semibold mb-6">Add Purchase</h2>

        <div className="grid grid-cols-2 gap-6">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none text-white focus:border-blue-500/50 transition-all"
          />

          <input
            placeholder="Brand (Optional)"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
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
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Quantity"
            className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none text-white focus:border-blue-500/50 transition-all"
          />

          <input
            type="number"
            min="0"
            step="0.01"
            value={unitCost}
            onChange={(e) => setUnitCost(e.target.value)}
            placeholder="Unit Cost"
            className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none text-white focus:border-blue-500/50 transition-all"
          />
        </div>

        <div className="mt-6 bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="text-gray-400 text-sm">Estimated Total Cost</div>
          <div className="text-3xl font-bold mt-2">₹{total.toLocaleString('en-IN')}</div>
        </div>

        <button
          onClick={savePurchase}
          className="mt-6 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 font-semibold hover:scale-105 transition-all text-white cursor-pointer"
        >
          Save Purchase
        </button>

        {message && (
          <div className={`mt-4 font-medium ${message.includes("Successfully") ? "text-emerald-400" : "text-rose-400"}`}>
            {message}
          </div>
        )}
      </div>

      {/* Added Historical Log Table UI Component */}
      <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
        <div className="p-6 border-b border-white/10 bg-white/5">
          <h2 className="text-2xl font-semibold text-white">Purchase Logs</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-left text-gray-400 border-b border-white/10 bg-white/5">
              <th className="p-5">ID</th>
              <th>Date</th>
              <th>Part Number</th>
              <th>Quantity</th>
              <th>Unit Cost</th>
              <th className="p-5">Type / Adjustment Reason</th>
            </tr>
          </thead>
          <tbody>
            {purchaseHistory.map((item) => (
              <tr key={item.id} className="border-t border-white/5 hover:bg-white/5 transition text-white">
                <td className="p-5 text-gray-500">#{item.id}</td>
                <td>{item.date}</td>
                <td className="font-mono text-cyan-400">{item.part_number}</td>
                <td>{item.quantity} units</td>
                <td>₹{(item.unit_cost || 0).toLocaleString('en-IN')}</td>
                <td className="p-5">
                  {item.is_adjustment ? (
                    <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-semibold">
                      Adj: {item.reason || "No reason given"}
                    </span>
                  ) : (
                    <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-semibold">
                      Standard Procurement
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {purchaseHistory.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center p-10 text-gray-500">
                  No purchases recorded in the database yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
