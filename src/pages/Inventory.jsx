import { useEffect, useState } from "react";

export default function Inventory() {
  const [parts, setParts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("All");
  const [message, setMessage] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);

  useEffect(() => {
    loadParts();
  }, []);

  async function loadParts() {
    try {
      const response = await fetch("/api/parts");
      const data = await response.json();
      setParts(data);
    } catch (error) {
      console.error("Error loading parts:", error);
    }
  }

  function startEdit(part) {
    setEditingId(part.id);
    setEditForm({ ...part });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(null);
  }

  async function saveEdit() {
    try {
      const response = await fetch(`/api/parts/${encodeURIComponent(editForm.part_number)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await response.json();

      if (data.success) {
        setMessage("Part updated successfully.");
        cancelEdit();
        loadParts();
      } else {
        setMessage(data.message || "Failed to update part.");
      }
    } catch (error) {
      console.error(error);
      setMessage("Failed to update part.");
    }
  }

  async function deletePart(part) {
    if (!window.confirm(`Delete part ${part.part_number}? This cannot be undone.`)) {
      return;
    }
    try {
      const response = await fetch(`/api/parts/${encodeURIComponent(part.part_number)}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (data.success) {
        setMessage("Part deleted.");
        loadParts();
      } else {
        setMessage(data.message || "Failed to delete part.");
      }
    } catch (error) {
      console.error(error);
      setMessage("Failed to delete part.");
    }
  }

  const vehicleModels = [
    "All",
    ...Array.from(new Set(parts.map((p) => p.vehicle_model || "General"))),
  ];

  const filteredParts = parts.filter((part) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      String(part.part_number || "").toLowerCase().includes(q) ||
      String(part.brand || "").toLowerCase().includes(q);
    const matchesVehicle =
      vehicleFilter === "All" || (part.vehicle_model || "General") === vehicleFilter;
    return matchesSearch && matchesVehicle;
  });

  return (
    <div>
      <h1 className="text-6xl font-bold text-white">Inventory</h1>
      <p className="text-gray-400 mt-3 mb-10 text-xl">
        Manage and monitor all parts in stock.
      </p>

      {/* Search & Filters */}
      <div className="flex gap-4 mb-8">
        <input
          type="text"
          placeholder="Search part number or brand..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-96 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl outline-none text-white focus:border-blue-500/50 transition-all"
        />

        <select
          value={vehicleFilter}
          onChange={(e) => setVehicleFilter(e.target.value)}
          className="px-5 py-3 rounded-2xl bg-[#151D2B] border border-white/10 text-white outline-none cursor-pointer"
        >
          {vehicleModels.map((model) => (
            <option key={model} value={model}>
              {model === "All" ? "All Vehicles" : model}
            </option>
          ))}
        </select>
      </div>

      {message && (
        <div className={`mb-6 font-medium ${message.includes("success") || message.includes("deleted") ? "text-emerald-400" : "text-rose-400"}`}>
          {message}
        </div>
      )}

      {/* Table */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-gray-400 text-left">
              <th className="p-5">Part Number</th>
              <th className="p-5">Brand</th>
              <th className="p-5">Vehicle</th>
              <th className="p-5">Stock</th>
              <th className="p-5">Purchase Price</th>
              <th className="p-5">Selling Price</th>
              <th className="p-5">Status</th>
              <th className="p-5">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredParts.map((part) => {
              const isEditing = editingId === part.id;
              return (
                <tr
                  key={part.id}
                  className="border-b border-white/5 hover:bg-white/5 transition text-white"
                >
                  <td className="p-5 font-mono text-cyan-400">{part.part_number}</td>

                  <td className="p-5">
                    {isEditing ? (
                      <input
                        value={editForm.brand || ""}
                        onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none text-white w-32"
                      />
                    ) : (
                      part.brand || "—"
                    )}
                  </td>

                  <td className="p-5">
                    {isEditing ? (
                      <input
                        value={editForm.vehicle_model || ""}
                        onChange={(e) => setEditForm({ ...editForm, vehicle_model: e.target.value })}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none text-white w-32"
                      />
                    ) : (
                      part.vehicle_model || "General"
                    )}
                  </td>

                  <td className="p-5">
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        value={editForm.stock ?? 0}
                        onChange={(e) => setEditForm({ ...editForm, stock: Number(e.target.value) })}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none text-white w-24"
                      />
                    ) : (
                      part.stock
                    )}
                  </td>

                  <td className="p-5">
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editForm.purchase_price ?? ""}
                        onChange={(e) => setEditForm({ ...editForm, purchase_price: Number(e.target.value) })}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none text-white w-28"
                      />
                    ) : (
                      `₹${(part.purchase_price || 0).toLocaleString("en-IN")}`
                    )}
                  </td>

                  <td className="p-5">
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editForm.selling_price ?? ""}
                        onChange={(e) => setEditForm({ ...editForm, selling_price: Number(e.target.value) })}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none text-white w-28"
                      />
                    ) : (
                      `₹${(part.selling_price || 0).toLocaleString("en-IN")}`
                    )}
                  </td>

                  <td className="p-5">
                    <StatusBadge stock={part.stock} />
                  </td>

                  <td className="p-5">
                    {isEditing ? (
                      <div className="flex gap-2">
                        <button
                          onClick={saveEdit}
                          className="px-3 py-2 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white transition"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-3 py-2 rounded-lg bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(part)}
                          className="px-3 py-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600 hover:text-white transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deletePart(part)}
                          className="px-3 py-2 rounded-lg bg-rose-600/20 text-rose-400 border border-rose-500/30 hover:bg-rose-600 hover:text-white transition"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}

            {filteredParts.length === 0 && (
              <tr>
                <td colSpan="8" className="text-center p-10 text-gray-500">
                  No parts match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ stock }) {
  if (stock === 0) {
    return (
      <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-1 rounded-full text-xs font-semibold">
        Out of Stock
      </span>
    );
  }
  if (stock <= 2) {
    return (
      <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-semibold">
        Low Stock
      </span>
    );
  }
  return (
    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-semibold">
      In Stock
    </span>
  );
}
