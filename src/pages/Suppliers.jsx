import { useState, useEffect } from "react";

export default function Suppliers() {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [gst, setGst] = useState("");
  const [brands, setBrands] = useState("");
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");
  const [suppliersList, setSuppliersList] = useState([]); // Added reactive data state

  // Hook to pull dynamic directories immediately on component mount
  useEffect(() => {
    loadSuppliers();
  }, []);

  async function loadSuppliers() {
    try {
      // FIXED: Routed via internal Vite /api proxy
      const response = await fetch("/api/suppliers");
      const data = await response.json();
      setSuppliersList(data);
    } catch (error) {
      console.error("Error connecting to supplier directory API:", error);
    }
  }

  async function saveSupplier() {
    if (!name.trim()) {
      setMessage("Supplier Name is required.");
      return;
    }

    try {
      // FIXED: Routed via internal Vite /api proxy
      const response = await fetch("/api/supplier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          contact_person: contact,
          phone,
          email,
          gst_number: gst,
          brands_supplied: brands,
          address,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage("Supplier Saved Successfully.");
        setName("");
        setContact("");
        setPhone("");
        setEmail("");
        setGst("");
        setBrands("");
        setAddress("");
        
        // Refresh the database table view immediately
        loadSuppliers();
      } else {
        setMessage(data.message || "Failed to Save Supplier.");
      }
    } catch (error) {
      console.error(error);
      setMessage("Failed to Save Supplier.");
    }
  }

  return (
    <div>
      <h1 className="text-6xl font-bold text-white">Suppliers</h1>
      <p className="text-gray-400 mt-3 mb-10 text-xl">
        Manage supplier information and contacts.
      </p>

      {/* Add Supplier Form Card */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl mb-10">
        <h2 className="text-2xl font-semibold mb-6 text-white">Add Supplier</h2>

        <div className="grid grid-cols-2 gap-6">
          <input
            placeholder="Supplier Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none text-white focus:border-purple-500/40 transition-all"
          />

          <input
            placeholder="Contact Person"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none text-white focus:border-purple-500/40 transition-all"
          />

          <input
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none text-white focus:border-purple-500/40 transition-all"
          />

          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none text-white focus:border-purple-500/40 transition-all"
          />

          <input
            placeholder="GST Number"
            value={gst}
            onChange={(e) => setGst(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none text-white focus:border-purple-500/40 transition-all"
          />

          <input
            placeholder="Brands Supplied"
            value={brands}
            onChange={(e) => setBrands(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none text-white focus:border-purple-500/40 transition-all"
          />
        </div>

        <textarea
          placeholder="Address"
          rows="4"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full mt-6 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none text-white focus:border-purple-500/40 transition-all"
        />

        <button
          onClick={saveSupplier}
          className="mt-6 px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-500 font-semibold hover:scale-105 transition-all text-white cursor-pointer"
        >
          Save Supplier
        </button>

        {message && (
          <div className={`mt-4 font-medium ${message.includes("Successfully") ? "text-emerald-400" : "text-rose-400"}`}>
            {message}
          </div>
        )}
      </div>

      {/* Supplier Directory Living Grid Layout */}
      <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
        <div className="p-6 border-b border-white/10 bg-white/5">
          <h2 className="text-2xl font-semibold text-white">Supplier Directory</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-left text-gray-400 border-b border-white/10 bg-white/5">
              <th className="p-6">Supplier</th>
              <th>Contact Person</th>
              <th>Phone</th>
              <th>Email</th>
              <th>GST Number</th>
              <th className="p-6">Brands</th>
            </tr>
          </thead>
          <tbody>
            {suppliersList.map((sup) => (
              <tr key={sup.id} className="border-t border-white/5 hover:bg-white/5 transition text-white">
                <td className="p-6 font-semibold text-purple-400">{sup.name}</td>
                <td>{sup.contact_person || "—"}</td>
                <td>{sup.phone || "—"}</td>
                <td className="text-gray-400">{sup.email || "—"}</td>
                <td className="font-mono text-xs text-gray-400">{sup.gst_number || "—"}</td>
                <td className="p-6">
                  {sup.brands_supplied ? (
                    <span className="bg-purple-500/10 text-purple-300 border border-purple-500/20 px-3 py-1 rounded-full text-xs font-medium">
                      {sup.brands_supplied}
                    </span>
                  ) : (
                    <span className="text-gray-600 italic text-xs">Unspecified</span>
                  )}
                </td>
              </tr>
            ))}
            {suppliersList.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center p-10 text-gray-500">
                  No partners found in directory database. Log your primary provider above!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
