import { useState, useCallback } from 'react';
import { Users, Plus, Trash2, Edit2, MoreVertical, TrendingUp, Phone, Mail, MapPin, X } from 'lucide-react';
import { KEYS, loadList, saveList, genId } from '@/lib/stores';
import { usePaywall } from '@/lib/paywall';
import { inputCls, btnPrimary, btnGhost } from '@/lib/ui';
import { useNavigate } from 'react-router-dom';

const leadStages = ['New Lead', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];
const leadStageColors = {
  'New Lead': 'bg-blue-100 text-blue-700',
  'Contacted': 'bg-cyan-100 text-cyan-700',
  'Qualified': 'bg-indigo-100 text-indigo-700',
  'Proposal': 'bg-purple-100 text-purple-700',
  'Negotiation': 'bg-yellow-100 text-yellow-700',
  'Won': 'bg-emerald-100 text-emerald-700',
  'Lost': 'bg-red-100 text-red-700',
};

export default function CrmTab() {
  const navigate = useNavigate();
  const { requestAction } = usePaywall();
  const [clients, setClients] = useState(() => loadList(KEYS.clients));
  const [leads, setLeads] = useState(() => loadList(KEYS.leads));
  const [tab, setTab] = useState('clients');
  const [clientModal, setClientModal] = useState(null);
  const [leadModal, setLeadModal] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const persistClients = (n) => { setClients(n); saveList(KEYS.clients, n); };
  const persistLeads = (n) => { setLeads(n); saveList(KEYS.leads, n); };
  const saveClient = (entry) => { if (!entry.name.trim()) return; if (!requestAction()) return; const n = clientModal.id ? clients.map((c) => (c.id === clientModal.id ? { ...entry, id: clientModal.id } : c)) : [{ ...entry, id: genId('cli') }, ...clients]; persistClients(n); setClientModal(null); };
  const saveLead = (entry) => { if (!entry.name.trim()) return; if (!requestAction()) return; persistLeads([{ ...entry, id: genId('lead'), stage: 'New Lead', value: Number(entry.value) || 0 }, ...leads]); setLeadModal(null); };
  const moveLead = (id, stage) => persistLeads(leads.map((l) => (l.id === id ? { ...l, stage } : l)));\n  const invoiceFor = (c) => { localStorage.setItem(KEYS.pendingClient, JSON.stringify({ name: c.name, company: c.company, email: c.email, phone: c.phone, gstin: c.gstin, address: c.address })); navigate('/invoice-builder'); };
  const removeClient = (id) => persistClients(clients.filter((c) => c.id !== id));
  const removeLead = (id) => persistLeads(leads.filter((l) => l.id !== id));

  const filteredClients = clients.filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || (c.company && c.company.toLowerCase().includes(searchTerm.toLowerCase())));
  const filteredLeads = leads.filter((l) => l.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <input type="text" placeholder={tab === 'clients' ? 'Search clients...' : 'Search leads...'} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={inputCls} />
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border bg-card p-1">
          <button onClick={() => setTab('clients')} className={`rounded-md px-3 py-2 text-sm font-semibold transition ${tab === 'clients' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Clients</button>
          <button onClick={() => setTab('leads')} className={`rounded-md px-3 py-2 text-sm font-semibold transition ${tab === 'leads' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Leads</button>
        </div>
        <button onClick={() => tab === 'clients' ? setClientModal({}) : setLeadModal({})} className={btnPrimary}><Plus className="h-4 w-4" />{tab === 'clients' ? 'Add client' : 'Add lead'}</button>
      </div>

      {tab === 'clients' && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredClients.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">No clients yet. Add your first client to get started.</div>
          ) : (
            filteredClients.map((c) => (
              <div key={c.id} className="rounded-xl border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-foreground">{c.name}</p>
                    {c.company && <p className="text-xs text-muted-foreground">{c.company}</p>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setClientModal(c)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary"><Edit2 className="h-4 w-4" /></button>
                    <button onClick={() => removeClient(c.id)} className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                {c.phone && <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground"><Phone className="h-3 w-3" />{c.phone}</div>}
                {c.email && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Mail className="h-3 w-3" />{c.email}</div>}
                {c.address && <div className="mt-1 flex items-start gap-2 text-xs text-muted-foreground"><MapPin className="mt-0.5 h-3 w-3 shrink-0" /><span className="line-clamp-2">{c.address}</span></div>}
                <button onClick={() => invoiceFor(c)} className="mt-3 w-full rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90">Create invoice</button>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'leads' && (
        <div className="space-y-3">
          {filteredLeads.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">No leads yet. Add your first lead to track the pipeline.</div>
          ) : (
            <div className="space-y-2">
              {filteredLeads.map((lead) => (
                <div key={lead.id} className="rounded-xl border bg-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground">{lead.name}</p>
                      <p className="text-xs text-muted-foreground">₹{Number(lead.value || 0).toLocaleString('en-IN')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select value={lead.stage} onChange={(e) => moveLead(lead.id, e.target.value)} className={`rounded-md px-2.5 py-1 text-xs font-semibold ${leadStageColors[lead.stage] || 'bg-slate-100 text-slate-600'}`}>
                        {leadStages.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button onClick={() => removeLead(lead.id)} className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {clientModal !== null && <ClientModal value={clientModal} onClose={() => setClientModal(null)} onSave={saveClient} />}
      {leadModal !== null && <LeadModal onClose={() => setLeadModal(null)} onSave={saveLead} />}
    </div>
  );
}

function ClientModal({ value, onClose, onSave }) {
  const [form, setForm] = useState(value);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-[480px] rounded-2xl border bg-card p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{value.id ? 'Edit client' : 'Add client'}</h3>
          <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-muted-foreground">Name (required)<input className={inputCls} value={form.name || ''} onChange={(e) => set('name', e.target.value)} placeholder="Client name" /></label>
          <label className="block text-xs font-semibold text-muted-foreground">Company<input className={inputCls} value={form.company || ''} onChange={(e) => set('company', e.target.value)} placeholder="Company name" /></label>
          <label className="block text-xs font-semibold text-muted-foreground">Email<input type="email" className={inputCls} value={form.email || ''} onChange={(e) => set('email', e.target.value)} placeholder="email@example.com" /></label>
          <label className="block text-xs font-semibold text-muted-foreground">Phone<input className={inputCls} value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} placeholder="+91 98765 43210" /></label>
          <label className="block text-xs font-semibold text-muted-foreground">GSTIN<input className={inputCls} value={form.gstin || ''} onChange={(e) => set('gstin', e.target.value)} placeholder="27AABCT1234F1Z0" /></label>
          <label className="block text-xs font-semibold text-muted-foreground">Address<textarea className={`${inputCls} min-h-[64px]`} value={form.address || ''} onChange={(e) => set('address', e.target.value)} placeholder="Full address" /></label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className={btnGhost}>Cancel</button>
          <button onClick={() => onSave(form)} className={btnPrimary}>Save client</button>
        </div>
      </div>
    </div>
  );
}

function LeadModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: '', value: '' });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-[480px] rounded-2xl border bg-card p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Add lead</h3>
          <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-muted-foreground">Lead name (required)<input className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Lead name" /></label>
          <label className="block text-xs font-semibold text-muted-foreground">Expected value (₹)<input type="number" className={inputCls} value={form.value} onChange={(e) => set('value', e.target.value)} placeholder="50000" /></label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className={btnGhost}>Cancel</button>
          <button onClick={() => onSave(form)} className={btnPrimary}>Add lead</button>
        </div>
      </div>
    </div>
  );
}
