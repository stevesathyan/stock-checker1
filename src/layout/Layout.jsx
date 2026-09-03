import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Receipt,
  Truck,
  FileSpreadsheet,
  BarChart3,
  Car
} from "lucide-react";

export default function Layout() {

  const items = [
    { text: "Dashboard", path: "/", icon: LayoutDashboard },
    { text: "Inventory", path: "/inventory", icon: Package },
    { text: "Purchases", path: "/purchases", icon: ShoppingCart },
    { text: "Sales", path: "/sales", icon: Receipt },
    { text: "Suppliers", path: "/suppliers", icon: Truck },
    { text: "Vehicles", path: "/vehicles", icon: Car },
    { text: "Excel", path: "/excel", icon: FileSpreadsheet },
    { text: "Reports", path: "/reports", icon: BarChart3 }
  ];

  return (
    <div className="h-screen flex bg-[#0B0F14] text-white overflow-hidden">

      <aside className="w-64 bg-white/5 backdrop-blur-xl border-r border-white/10 p-6">

        <div className="mb-10">
          <h1 className="text-5xl font-extrabold tracking-tight">
            AutoHub
          </h1>
          <p className="text-gray-400 mt-2">
            Premium Parts Management
          </p>
        </div>

        <div className="space-y-3">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-3 p-4 rounded-2xl transition-all duration-300 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.45)]"
                      : "hover:bg-white/5 hover:translate-x-2 hover:scale-[1.02]"
                  }`
                }
              >
                <Icon size={20} />
                <span className="font-medium">{item.text}</span>
              </NavLink>
            );
          })}
        </div>

      </aside>

      <main
        className="
        relative
        flex-1
        overflow-auto
        p-10
        bg-gradient-to-br
        from-[#0B0F14]
        via-[#0F172A]
        to-[#0B0F14]
        "
      >
        <div
          className="
          absolute
          top-20
          left-80
          w-96
          h-96
          bg-blue-500/10
          rounded-full
          blur-[180px]
          pointer-events-none
          "
        />
        <div
          className="
          absolute
          bottom-20
          right-20
          w-80
          h-80
          bg-cyan-500/10
          rounded-full
          blur-[180px]
          pointer-events-none
          "
        />
        <Outlet />
      </main>

    </div>
  );
}
