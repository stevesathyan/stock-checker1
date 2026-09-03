import { useState } from "react";
import { Upload, Download, FileSpreadsheet } from "lucide-react";

export default function Excel() {

  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  async function importExcel() {
    if (!file) {
      setMessage("Please select an Excel file first.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/import-excel", {
        method: "POST",
        body: formData
      });

      const data = await response.json();
      setMessage(data.message || "Import completed.");

    } catch (error) {
      console.error("Import error:", error);
      setMessage("Import failed. Check browser console.");
    }
  }

  function exportExcel() {
    window.open("/api/export-excel", "_blank");
  }

  return (

    <div>

      <h1 className="text-6xl font-bold">
        Excel
      </h1>

      <p className="text-gray-400 mt-3 mb-10 text-xl">
        Import and export inventory spreadsheets.
      </p>

      <div className="grid lg:grid-cols-2 gap-8">

        <div
          className="
          bg-white/5
          border
          border-white/10
          rounded-3xl
          p-8
          "
        >

          <div className="flex items-center gap-3 mb-6">

            <Upload size={24} />

            <h2 className="text-2xl font-semibold">
              Import Inventory
            </h2>

          </div>

          <label
            className="
            flex
            items-center
            justify-center
            gap-3
            cursor-pointer
            w-full
            p-6
            rounded-2xl
            border-2
            border-dashed
            border-white/20
            "
          >

            <FileSpreadsheet size={24} />

            <span>
              {
                file
                  ? file.name
                  : "Choose Excel File"
              }
            </span>

            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />

          </label>

          <button
            onClick={importExcel}
            className="
            mt-6
            px-8
            py-4
            rounded-2xl
            bg-gradient-to-r
            from-blue-600
            to-cyan-500
            font-semibold
            "
          >
            Import Excel
          </button>

          {message && (

            <div
              className="
              mt-6
              p-4
              rounded-xl
              bg-white/5
              "
            >
              {message}
            </div>

          )}

        </div>

        <div
          className="
          bg-white/5
          border
          border-white/10
          rounded-3xl
          p-8
          "
        >

          <div className="flex items-center gap-3 mb-6">

            <Download size={24} />

            <h2 className="text-2xl font-semibold">
              Export Inventory
            </h2>

          </div>

          <button
            onClick={exportExcel}
            className="
            px-8
            py-4
            rounded-2xl
            bg-gradient-to-r
            from-green-600
            to-emerald-500
            font-semibold
            "
          >
            Export Excel
          </button>

        </div>

      </div>

    </div>

  );

}
