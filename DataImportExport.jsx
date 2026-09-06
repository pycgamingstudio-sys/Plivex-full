import { useState, useRef } from "react";
import { Upload, Download, FileUp, X, Check, ArrowRight } from "lucide-react";
import { KEYS, loadList, saveList, genId } from "@/lib/stores";
import { inputCls, btnGhost } from "@/lib/ui";
import { btnAccent } from "@/lib/dashboardData";

const TARGETS = {
  clients: { label: "Clients", key: KEYS.clients, fields: ["name", "company", "email", "phone", "gstin", "address"] },
  stock: { label: "Stock / Products", key: KEYS.stock, fields: ["name", "sku", "quantity", "unit", "price", "lowStock"] },
  invoices: { label: "Invoices", key: KEYS.history, fields: ["number", "clientName", "total", "issueDate", "currency"] },
};

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return { headers: [], rows: [] };
  const split = (line) => {
    const out = []; let cur = ""; let q = false;
    for (let i = 0; i < line.length; i++) { const ch = line[i]; if (ch === '"') { q = !q; } else if (ch === "," && !q) { out.push(cur); cur = ""; } else { cur += ch; } }
    out.push(cur); return out.map((s) => s.trim());
  };
  const headers = split(lines[0]);
  const rows = lines.slice(1).map(split);
  return { headers, rows };
}

export default function DataImportExport() {
  const [target, setTarget] = useState("clients");
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [fileName, setFileName] = useState("");
  const [done, setDone] = useState(null);
  const fileRef = useRef(null);

  const onFile = (file) => {
    setDone(null);
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      if (file.name.endsWith(".json")) {
        try {
          const arr = JSON.parse(text);
          if (Array.isArray(arr) && arr.length) {
            const hs = Object.keys(arr[0]);
            setHeaders(hs);
            setRows(arr.map((o) => hs.map((h) => String(o[h] ?? ""))));
            setMapping({});
            return;
          }
        } catch { /* fall through to CSV */ }
      }
      const { headers: hs, rows: rs } = parseCSV(text);
      setHeaders(hs);
      setRows(rs);
      setMapping({});
    };
    reader.readAsText(file);
  };

  const fields = TARGETS[target].fields;
  const autoMap = () => {
    const m = {};
    headers.forEach((h, i) => {
      const norm = h.toLowerCase().replace(/[^a-z]/g, "");
      const match = fields.find((f) => norm.includes(f.toLowerCase().replace(/[^a-z]/g, "")) || f.toLowerCase().includes(norm));
      if (match) m[i] = match;
    });
    setMapping(m);
  };

  const reset = () => { setHeaders([]); setRows([]); setMapping({}); setFileName(""); if (fileRef.current) fileRef.current.value = ""; };

  const doImport = () => {
    const cfg = TARGETS[target];
    const existing = loadList(cfg.key);
    const mapped = rows.map((r) => {
      const obj = {};
      Object.entries(mapping).forEach(([idx, field]) => { if (field) obj[field] = r[Number(idx)]; });
      if (target === "stock") { obj.quantity = Number(obj.quantity) || 0; obj.price = Number(obj.price) || 0; obj.lowStock = Number(obj.lowStock) || 5; }
      if (target === "invoices") { obj.total = Number(obj.total) || 0; }
      obj.id = genId(target.slice(0, 3));
      return obj;
    }).filter((o) => o.name || o.clientName || o.number);
    saveList(cfg.key, [...mapped, ...existing]);
    setDone(`${mapped.length} record${mapped.length !== 1 ? "s" : ""} imported into ${cfg.label}.`);
    reset();
  };

  const exportAll = () => {
    const payload = {};
    Object.entries(KEYS).forEach(([k, key]) => {
      if (typeof key === "string") { try { payload[k] = JSON.parse(localStorage.getItem(key) || "[]"); } catch { payload[k] = []; } }
    });
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Data Import & Export</h2>
          <p className="text-xs text-slate-500">Manage your workspace data via CSV or JSON files.</p>
        </div>
        <button onClick={exportAll} className={btnGhost}>
          <Download className="mr-2 h-4 w-4" /> Export All Data
        </button>
      </div>

      {done && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs font-medium text-emerald-700">
          <Check className="h-4 w-4" /> {done}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Import Target</label>
            <select value={target} onChange={(e) => { setTarget(e.target.value); reset(); }} className={inputCls}>
              {Object.entries(TARGETS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select File (CSV or JSON)</label>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.json"
              onChange={(e) => onFile(e.target.files?.[0])}
              className={inputCls}
            />
          </div>
        </div>

        {headers.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800">Map Columns ({rows.length} rows detected)</h3>
              <button onClick={autoMap} className="text-xs font-semibold text-violet-600 hover:underline">
                Auto-map columns
              </button>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {headers.map((h, i) => (
                <div key={i} className="flex items-center justify-between gap-2 rounded-lg border p-2 text-xs">
                  <span className="font-medium text-slate-600 truncate max-w-[100px]">{h}</span>
                  <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
                  <select
                    value={mapping[i] || ""}
                    onChange={(e) => setMapping({ ...mapping, [i]: e.target.value })}
                    className="rounded border border-slate-200 p-1 text-xs"
                  >
                    <option value="">-- Ignore --</option>
                    {fields.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={reset} className={btnGhost}>Cancel</button>
              <button onClick={doImport} className={btnAccent}>Import Records</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
      }
