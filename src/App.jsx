import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./layout/Layout";

import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Purchases from "./pages/Purchases";
import Sales from "./pages/Sales";
import Suppliers from "./pages/Suppliers";
import Excel from "./pages/Excel";
import Reports from "./pages/Reports";
import Vehicles from "./pages/Vehicles";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/excel" element={<Excel />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/vehicles" element={<Vehicles />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
