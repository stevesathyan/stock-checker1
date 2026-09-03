import { useState, useEffect } from "react";

export default function Vehicles() {
  const [parts, setParts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  useEffect(() => {
    fetchPartsData();
  }, []);

  async function fetchPartsData() {
    try {
      // FIXED: Routed via internal Vite /api proxy
      const res = await fetch("/api/parts");
      const data = await res.json();
      setParts(data);
    } catch (err) {
      console.error("Error reading database component compatibilities:", err);
    }
  }

  // 1. Group parts collection dynamically to extract a unified list of models
  const vehicleMetrics = {};
  parts.forEach((part) => {
    const model = part.vehicle_model || "General";
    if (!vehicleMetrics[model]) {
      vehicleMetrics[model] = 0;
    }
    vehicleMetrics[model] += 1; // Count unique part profiles linked to this machine
  });

  // Convert map object into clean iterative lists
  const vehicleCardsList = Object.keys(vehicleMetrics).map((modelName) => ({
    name: modelName,
    count: vehicleMetrics[modelName]
  }));

  // 2. Compute live cross-reference search matches across parameters
  const filteredDataRows = parts.filter((part) => {
    const matchesSearch = 
      String(part.vehicle_model || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(part.part_number || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(part.brand || "").toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesCardSelection = selectedVehicle 
      ? String(part.vehicle_model || "General").toLowerCase() === selectedVehicle.toLowerCase()
      : true;

    return matchesSearch && matchesCardSelection;
  });

  return (
    <div>
      <h1 className="text-6xl font-bold text-white">Vehicles</h1>
      <p className="text-gray-400 mt-3 mb-10 text-xl">
        Browse compatible vehicles and parts.
      </p>

      {/* Dynamic Search Bar */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl mb-8 flex gap-4 items-center">
        <input
          placeholder="Search machine models, hardware brands, or reference sku numbers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none text-white focus:border-blue-500/50 transition-all"
        />
        {selectedVehicle && (
          <button 
            onClick={() => setSelectedVehicle(null)}
            className="bg-rose-600/20 text-rose-400 border border-rose-500/30 px-5 py-4 rounded-2xl font-medium cursor-pointer hover:bg-rose-600 hover:text-white transition-all whitespace-nowrap"
          >
            Clear Card Filter: {selectedVehicle}
          </button>
        )}
      </div>

      {/* Dynamic Active Vehicle Grid Selection Panels */}
      <div className="grid grid-cols-3 gap-6">
        {vehicleCardsList.map((car, idx) => (
          <div key={idx} onClick={() => setSelectedVehicle(car.name === selectedVehicle ? null : car.name)}>
            <VehicleCard
              vehicle={car.name}
              parts={`${car.count} ${car.count === 1 ? 'Part' : 'Parts'} Configured`}
              isActive={selectedVehicle === car.name}
            />
          </div>
        ))}
        {vehicleCardsList.length === 0 && (
          <div className="col-span-3 text-center p-6 text-gray-500 border border-dashed border-white/10 rounded-3xl">
            Assign your components to vehicle metrics inside your Procurement logs to display summary counts.
          </div>
        )}
      </div>

      {/* Living Cross-Reference Mapping Table */}
      <div className="mt-10 bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
        <div className="p-6 border-b border-white/10 bg-white/5 flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-white">Vehicle Compatibility Matrices</h2>
          <span className="text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full">
            {filteredDataRows.length} mappings isolated
          </span>
        </div>

        <table className="w-full">
          <thead>
            <tr className="text-left text-gray-400 border-b border-white/10 bg-white/5">
              <th className="p-6">Target Vehicle/Model</th>
              <th>Part Reference SKU</th>
              <th>Manufacturer Brand</th>
              <th className="p-6">Current Stock Volume</th>
            </tr>
          </thead>
          <tbody>
            {filteredDataRows.map((part) => (
              <tr key={part.id} className="border-t border-white/5 hover:bg-white/5 transition text-white">
                <td className="p-6 font-semibold text-zinc-300">{part.vehicle_model || "General / Universal"}</td>
                <td className="font-mono text-cyan-400">{part.part_number}</td>
                <td>{part.brand || "—"}</td>
                <td className="p-6">
                  <span className={`font-semibold ${part.stock === 0 ? "text-rose-400" : part.stock < 6 ? "text-amber-400" : "text-emerald-400"}`}>
                    {part.stock} units
                  </span>
                </td>
              </tr>
            ))}
            {filteredDataRows.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center p-10 text-gray-500">
                  No matching parts compatibility rows recorded in database index.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function VehicleCard({ vehicle, parts, isActive }) {
  return (
    <div
      className={`
      border rounded-3xl p-6 backdrop-blur-xl transition-all duration-300 cursor-pointer select-none
      ${isActive 
        ? "bg-blue-600/20 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.2)] scale-[0.98]" 
        : "bg-white/5 border-white/10 hover:border-blue-500/30 hover:-translate-y-1"}
      `}
    >
      <div className="text-2xl font-semibold text-white">{vehicle}</div>
      <div className="text-gray-400 mt-2 text-sm">{parts}</div>
    </div>
  );
}
