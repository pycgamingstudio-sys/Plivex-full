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