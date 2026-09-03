import { useEffect, useState } from "react";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    total_parts: 0,
    total_units: 0,
    low_stock: 0,
    inventory_value: 0,
  });

  const [recentSale, setRecentSale] = useState(null);
  const [recentPurchase, setRecentPurchase] = useState(null);
  const [lowStockPart, setLowStockPart] = useState(null);

  const [stockValue, setStockValue] = useState(0);
  const [monthlySales, setMonthlySales] = useState(0);
  const [activeSuppliers, setActiveSuppliers] = useState(0);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => setStats(data))
      .catch((err) => console.error("Error loading dashboard data:", err));

    fetch("/api/sales")
      .then((res) => res.json())
      .then((sales) => {
        setRecentSale(sales[0] || null);

        const now = new Date();
        const thisMonthTotal = sales
          .filter((s) => {
            const d = new Date(s.date);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          })
          .reduce((sum, s) => sum + (s.quantity || 0) * (s.selling_price || 0), 0);
        setMonthlySales(thisMonthTotal);
      })
      .catch((err) => console.error("Error loading sales data:", err));

    fetch("/api/purchases")
      .then((res) => res.json())
      .then((purchases) => setRecentPurchase(purchases[0] || null))
      .catch((err) => console.error("Error loading purchase data:", err));

    fetch("/api/parts")
      .then((res) => res.json())
      .then((parts) => {
        const lowStock = parts.find((p) => p.stock > 0 && p.stock <= 2);
        setLowStockPart(lowStock || null);

        const totalStockValue = parts.reduce(
          (sum, p) => sum + (p.stock || 0) * (p.selling_price || 0),
          0
        );
        setStockValue(totalStockValue);
      })
      .catch((err) => console.error("Error loading parts data:", err));

    fetch("/api/suppliers")
      .then((res) => res.json())
      .then((suppliers) => setActiveSuppliers(suppliers.length))
      .catch((err) => console.error("Error loading suppliers data:", err));
  }, []);

  return (
    <div>
      {/* Greeting */}
      <div className="mb-10">
        <h1 className="text-6xl font-bold">
          {getGreeting()}, Steve
        </h1>
        <p className="text-gray-400 mt-3 text-lg">
          Here's what's happening in your inventory today.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-6">
        <StatCard title="Parts" value={stats.total_parts} change="Live" />
        <StatCard title="Units" value={stats.total_units} change="Live" />
        <StatCard title="Low Stock" value={stats.low_stock} change="Attention" />
        <StatCard
          title="Inventory Value"
          value={`₹${(stats.inventory_value || 0).toLocaleString('en-IN')}`}
          change="Live"
        />
      </div>

      {/* Activity Section */}
      <div className="grid grid-cols-3 gap-6 mt-10">
        <ActivityCard
          title="Recent Sale"
          part={recentSale ? recentSale.part_number : "—"}
          qty={recentSale ? recentSale.quantity : "No sales yet"}
          color="red"
        />
        <ActivityCard
          title="Latest Purchase"
          part={recentPurchase ? recentPurchase.part_number : "—"}
          qty={recentPurchase ? recentPurchase.quantity : "No purchases yet"}
          color="green"
        />
        <ActivityCard
          title="Low Stock Alert"
          part={lowStockPart ? lowStockPart.part_number : "—"}
          qty={lowStockPart ? lowStockPart.stock : "None low"}
          color="yellow"
        />
      </div>

      {/* Secondary KPI Row */}
      <div className="grid grid-cols-3 gap-6 mt-10">
        <MiniCard title="Potential Sale Value" value={`₹${stockValue.toLocaleString('en-IN')}`} />
        <MiniCard title="Sales This Month" value={`₹${monthlySales.toLocaleString('en-IN')}`} />
        <MiniCard title="Active Suppliers" value={activeSuppliers} />
      </div>

    </div>
  );
}

function StatCard({ title, value, change }) {
  return (
    <div
      className="
      bg-white/5
      backdrop-blur-xl
      border
      border-white/10
      rounded-3xl
      p-6
      shadow-[0_0_40px_rgba(59,130,246,0.05)]
      hover:border-blue-500/40
      hover:shadow-[0_0_50px_rgba(59,130,246,0.15)]
      hover:-translate-y-1
      transition-all
      duration-300
      "
    >
      <div className="text-gray-400 text-sm uppercase tracking-wider">{title}</div>
      <div className="text-5xl font-bold mt-4">{value}</div>
      <div className="text-green-400 text-sm mt-4">{change}</div>
    </div>
  );
}

function ActivityCard({ title, part, qty, color }) {
  const colors = {
    red: "text-red-400",
    green: "text-green-400",
    yellow: "text-yellow-400"
  };
  return (
    <div
      className="
      bg-white/5
      backdrop-blur-xl
      border
      border-white/10
      rounded-3xl
      p-6
      hover:border-blue-500/30
      hover:-translate-y-1
      transition-all
      duration-300
      "
    >
      <div className="text-gray-400 text-sm uppercase tracking-wider">{title}</div>
      <div className="text-4xl font-bold mt-5">{part}</div>
      <div className={`${colors[color]} mt-5 text-lg`}>
        {typeof qty === "number" ? `Qty: ${qty}` : qty}
      </div>
    </div>
  );
}

function MiniCard({ title, value }) {
  return (
    <div
      className="
      bg-white/5
      backdrop-blur-xl
      border
      border-white/10
      rounded-3xl
      p-6
      hover:border-blue-500/30
      transition-all
      duration-300
      "
    >
      <div className="text-gray-400 text-sm uppercase tracking-wider">{title}</div>
      <div className="text-3xl font-bold mt-4">{value}</div>
    </div>
  );
}
