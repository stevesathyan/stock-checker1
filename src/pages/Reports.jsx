import { useEffect, useState } from "react";

export default function Reports() {
  // Setup data hooks to capture backend arrays
  const [dashboardStats, setDashboardStats] = useState({
    total_parts: 0,
    total_units: 0,
    low_stock: 0,
    inventory_value: 0
  });
  const [lowStockItems, setLowStockItems] = useState([]);
  const [recentMovements, setRecentMovements] = useState([]);
  const [topSellingParts, setTopSellingParts] = useState([]);

  useEffect(() => {
    // 1. Pull Core Analytics Totals
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((data) => setDashboardStats(data))
      .catch((err) => console.error("Error loading report totals:", err));

    // 2. Fetch Parts to isolate real critical stock flags dynamically
    fetch("/api/parts")
      .then((res) => res.json())
      .then((parts) => {
        const warnings = parts
          .filter((part) => part.stock <= 2)
          .map((part) => `${part.part_number} (${part.brand || "Generic"}) — ${part.stock === 0 ? "Out Of Stock" : `${part.stock} left`}`);
        setLowStockItems(warnings.slice(0, 5)); // Keep top 5 critical alerts
      })
      .catch((err) => console.error("Error tracking alert reports:", err));

    // 3. Compile Recent Stock Movements (Combine latest purchases and sales)
    Promise.all([
      fetch("/api/purchases").then((res) => res.json()),
      fetch("/api/sales").then((res) => res.json())
    ])
      .then(([purchases, sales]) => {
        // Tag and merge arrays
        const purchaseLogs = purchases.map((p) => ({ ...p, type: "PURCHASE", timestamp: p.id }));
        const saleLogs = sales.map((s) => ({ ...s, type: "SALE", timestamp: s.id }));
        
        const combined = [...purchaseLogs, ...saleLogs]
          .sort((a, b) => b.timestamp - a.timestamp) // Show newest operations first
          .slice(0, 5)
          .map((item) => {
            const prefix = item.type === "PURCHASE" ? "➕ Added" : "➖ Removed";
            return `${prefix} ${item.quantity} units of ${item.part_number} (${item.date})`;
          });
          
        setRecentMovements(combined);

        // 4. Calculate Top Selling Parts based on quantity volume in Sales logs
        const salesVolume = {};
        sales.forEach((sale) => {
          salesVolume[sale.part_number] = (salesVolume[sale.part_number] || 0) + sale.quantity;
        });

        const sortedParts = Object.keys(salesVolume)
          .sort((a, b) => salesVolume[b] - salesVolume[a])
          .slice(0, 5)
          .map((partNum) => `${partNum} (${salesVolume[partNum]} total units sold)`);

        setTopSellingParts(sortedParts);
      })
      .catch((err) => console.error("Error generating dynamic report insights:", err));
  }, []);

  return (
    <div>
      <h1 className="text-6xl font-bold text-white">Reports</h1>
      <p className="text-gray-400 mt-3 mb-10 text-xl">
        Monitor stock levels and inventory performance.
      </p>

      {/* KPI row linked to active stats */}
      <div className="grid grid-cols-4 gap-6 mb-10">
        <StatCard title="Total Parts" value={dashboardStats.total_parts} />
        <StatCard title="Units In Stock" value={dashboardStats.total_units} />
        <StatCard title="Inventory Value" value={`₹${(dashboardStats.inventory_value || 0).toLocaleString('en-IN')}`} />
        <StatCard title="Low Stock" value={dashboardStats.low_stock} flag={dashboardStats.low_stock > 0} />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <ReportBox
          title="Low Stock Alert"
          items={lowStockItems}
          fallback="All parts have healthy quantities in stock."
          colorClass="text-rose-400"
        />

        <ReportBox
          title="Recent Stock Movement"
          items={recentMovements}
          fallback="No recent inventory movements found."
        />
      </div>

      <div className="mt-6">
        <ReportBox
          title="Top Moving / High-Demand Parts"
          items={topSellingParts}
          fallback="Log your first customer transactions to populate sales performance."
          colorClass="text-cyan-400 font-mono"
        />
      </div>
    </div>
  );
}

function StatCard({ title, value, flag }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
      <div className="text-gray-400 text-sm font-medium tracking-wide uppercase">{title}</div>
      <div className={`text-4xl font-bold mt-3 ${flag ? "text-amber-400" : "text-white"}`}>{value}</div>
    </div>
  );
}

function ReportBox({ title, items, fallback, colorClass }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
      <h2 className="text-2xl font-semibold mb-5 text-white">{title}</h2>
      <div className="space-y-3">
        {items.length > 0 ? (
          items.map((item, index) => (
            <div key={index} className={`p-3 bg-white/[0.02] border border-white/5 rounded-xl ${colorClass || "text-gray-300"}`}>
              {item}
            </div>
          ))
        ) : (
          <div className="text-gray-500 italic text-sm p-2">{fallback}</div>
        )}
      </div>
    </div>
  );
}
