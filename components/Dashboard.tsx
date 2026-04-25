// //dashboard
// "use client";

// import { useState, useEffect } from "react";
// import { facturesAPI } from '@/lib/api';
// import {
//   FileText, Plus, TrendingUp, Clock, CheckCircle,
//   AlertCircle, Search, Eye, Trash2, Download,
//   ArrowUpRight, Users, Pencil,
// } from "lucide-react";
// import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

// type InvoiceItem = { qty: number; description: string; price: number; unit?: "piece" | "kg" | "litre" };
// type InvoiceStatus = "paid" | "pending" | "overdue";
// type Invoice = {
//   id: string;
//   companyName: string;
//   companyAddress: string;
//   companyEmail?: string;
//   companyPhone?: string;
//   clientName: string;
//   clientAddress: string;
//   clientEmail?: string;
//   clientPhone?: string;
//   invoiceNumber?: string;
//   invoiceDate?: string;
//   dueDate?: string;
//   currency?: string;
//   tvaRate?: number;
//   paymentMethod?: string;
//   notes?: string;
//   discount?: number;
//   items: InvoiceItem[];
//   totalHT: number;
//   tva: number;
//   totalTTC: number;
//   date: string;
//   status: InvoiceStatus;
// };

// function generateId() {
//   return "INV-" + Math.random().toString(36).substring(2, 7).toUpperCase();
// }
// function formatDate(iso: string) {
//   return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
// }
// function formatCurrency(n: number) {
//   return n.toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " €";
// }

// const STATUS_CONFIG: Record<InvoiceStatus, { label: string; color: string; bg: string; hex: string; icon: React.ReactNode }> = {
//   paid:    { label: "Payées",     color: "text-emerald-700", bg: "bg-emerald-50", hex: "#059669", icon: <CheckCircle size={13} /> },
//   pending: { label: "En attente", color: "text-amber-700",   bg: "bg-amber-50",   hex: "#d97706", icon: <Clock size={13} /> },
//   overdue: { label: "En retard",  color: "text-red-700",     bg: "bg-red-50",     hex: "#dc2626", icon: <AlertCircle size={13} /> },
// };

// const SEED_INVOICES: Invoice[] = [
//   {
//     id: "INV-A1B2C", companyName: "Acme Studio", companyAddress: "12 rue de la Paix, Paris",
//     clientName: "Dupont & Associés", clientAddress: "45 avenue Montaigne, Paris",
//     items: [{ qty: 3, description: "Design UI/UX", price: 850 }, { qty: 1, description: "Intégration web", price: 1200 }],
//     totalHT: 3750, tva: 750, totalTTC: 4500, date: "2025-03-10T10:00:00.000Z", status: "paid",
//   },
//   {
//     id: "INV-D3E4F", companyName: "Acme Studio", companyAddress: "12 rue de la Paix, Paris",
//     clientName: "Martin SAS", clientAddress: "8 rue Victor Hugo, Lyon",
//     items: [{ qty: 5, description: "Développement backend", price: 600 }],
//     totalHT: 3000, tva: 600, totalTTC: 3600, date: "2025-03-18T09:30:00.000Z", status: "pending",
//   },
//   {
//     id: "INV-G5H6I", companyName: "Acme Studio", companyAddress: "12 rue de la Paix, Paris",
//     clientName: "Leclerc Tech", clientAddress: "22 bd de la République, Bordeaux",
//     items: [{ qty: 2, description: "Audit de sécurité", price: 1100 }, { qty: 1, description: "Rapport", price: 500 }],
//     totalHT: 2700, tva: 540, totalTTC: 3240, date: "2025-02-20T14:00:00.000Z", status: "overdue",
//   },
// ];

// function StatCard({ icon, label, value, sub, accent }: { icon: React.ReactNode; label: string; value: string; sub?: string; accent: string }) {
//   return (
//     <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow flex items-start gap-3 sm:gap-4">
//       <div className={`p-2.5 sm:p-3 rounded-xl shrink-0 ${accent}`}>{icon}</div>
//       <div className="flex-1 min-w-0">
//         <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1 leading-tight">{label}</p>
//         <p className="text-lg sm:text-2xl font-bold text-gray-900 leading-none">{value}</p>
//         {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
//       </div>
//     </div>
//   );
// }

// function StatusBadge({ status }: { status: InvoiceStatus }) {
//   const cfg = STATUS_CONFIG[status];
//   return (
//     <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color} ${cfg.bg}`}>
//       {cfg.icon}{cfg.label}
//     </span>
//   );
// }

// function StatusChart({ invoices }: { invoices: Invoice[] }) {
//   const data = (["paid", "pending", "overdue"] as InvoiceStatus[])
//     .map((s) => ({ name: STATUS_CONFIG[s].label, value: invoices.filter((i) => i.status === s).length, color: STATUS_CONFIG[s].hex }))
//     .filter((d) => d.value > 0);
//   const total = data.reduce((s, d) => s + d.value, 0);
//   return (
//     <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
//       <h2 className="font-bold text-gray-900 text-lg mb-5">Répartition des statuts</h2>
//       {total === 0 ? (
//         <p className="text-sm text-gray-400 text-center py-8">Aucune facture à afficher.</p>
//       ) : (
//         <div className="flex flex-col sm:flex-row items-center gap-6">
//           <div className="w-44 h-44 shrink-0 relative">
//             <ResponsiveContainer width="100%" height="100%">
//               <PieChart>
//                 <Pie data={data} cx="50%" cy="50%" innerRadius={48} outerRadius={70} paddingAngle={3} dataKey="value" strokeWidth={0}>
//                   {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
//                 </Pie>
//                 <Tooltip content={(props) => {
//                   if (!props?.active || !props?.payload?.length) return null;
//                   const { name, value } = props.payload[0];
//                   return (
//                     <div style={{ borderRadius: "12px", border: "1px solid #f3f4f6", fontSize: "12px", background: "#fff", padding: "8px 12px" }}>
//                       <p className="font-semibold text-gray-700">{String(name)}</p>
//                       <p className="text-gray-500">{String(value)} facture(s)</p>
//                     </div>
//                   );
//                 }} />
//               </PieChart>
//             </ResponsiveContainer>
//             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
//               <span className="text-2xl font-bold text-gray-900">{total}</span>
//               <span className="text-xs text-gray-400">factures</span>
//             </div>
//           </div>
//           <div className="flex-1 w-full space-y-3">
//             {data.map((entry) => {
//               const pct = Math.round((entry.value / total) * 100);
//               return (
//                 <div key={entry.name}>
//                   <div className="flex items-center justify-between mb-1.5">
//                     <div className="flex items-center gap-2">
//                       <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
//                       <span className="text-sm font-medium text-gray-700">{entry.name}</span>
//                     </div>
//                     <span className="text-sm font-bold text-gray-900">{entry.value} <span className="text-xs font-normal text-gray-400">({pct}%)</span></span>
//                   </div>
//                   <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
//                     <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: entry.color }} />
//                   </div>
//                 </div>
//               );
//             })}
//             <div className="pt-2 border-t border-gray-100 flex justify-between text-xs text-gray-400">
//               <span>Total</span>
//               <span className="font-semibold text-gray-600">{total} facture{total > 1 ? "s" : ""}</span>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// // ─── Modal avec bouton Modifier ───────────────────────────────────────────────
// function InvoiceModal({ invoice, onClose, onStatusChange, onEdit }: {
//   invoice: Invoice;
//   onClose: () => void;
//   onStatusChange: (id: string, status: InvoiceStatus) => void;
//   onEdit: (invoice: Invoice) => void;
// }) {
//   return (
//     <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
//       <div className="bg-white w-full sm:rounded-2xl sm:max-w-2xl rounded-t-2xl shadow-2xl max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>

//         <div className="flex justify-center pt-3 sm:hidden">
//           <div className="w-10 h-1 bg-gray-200 rounded-full" />
//         </div>

//         <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-100">
//           <div>
//             <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Facture</p>
//             <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{invoice.id}</h2>
//           </div>
//           <div className="flex items-center gap-3">
//             <StatusBadge status={invoice.status} />
//             <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl font-bold p-1">✕</button>
//           </div>
//         </div>

//         <div className="p-5 sm:p-6 space-y-6">

//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//             <div>
//               <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Émetteur</p>
//               <p className="font-bold text-gray-900">{invoice.companyName}</p>
//               <p className="text-sm text-gray-500">{invoice.companyAddress}</p>
//               {invoice.companyEmail && <p className="text-sm text-gray-400">{invoice.companyEmail}</p>}
//               {invoice.companyPhone && <p className="text-sm text-gray-400">{invoice.companyPhone}</p>}
//             </div>
//             <div>
//               <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Client</p>
//               <p className="font-bold text-gray-900">{invoice.clientName}</p>
//               <p className="text-sm text-gray-500">{invoice.clientAddress}</p>
//               {invoice.clientEmail && <p className="text-sm text-gray-400">{invoice.clientEmail}</p>}
//               {invoice.clientPhone && <p className="text-sm text-gray-400">{invoice.clientPhone}</p>}
//             </div>
//           </div>

//           {(invoice.invoiceDate || invoice.dueDate) && (
//             <div className="grid grid-cols-2 gap-4">
//               {invoice.invoiceDate && (
//                 <div>
//                   <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Date de facture</p>
//                   <p className="text-sm font-medium text-gray-700">{new Date(invoice.invoiceDate).toLocaleDateString("fr-FR")}</p>
//                 </div>
//               )}
//               {invoice.dueDate && (
//                 <div>
//                   <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Échéance</p>
//                   <p className="text-sm font-medium text-gray-700">{new Date(invoice.dueDate).toLocaleDateString("fr-FR")}</p>
//                 </div>
//               )}
//             </div>
//           )}

//           <div className="overflow-x-auto">
//             <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Détail des prestations</p>
//             <table className="w-full text-sm min-w-100">
//               <thead>
//                 <tr className="border-b border-gray-100 text-left text-gray-400 text-xs uppercase">
//                   <th className="pb-2">Qté</th>
//                   <th className="pb-2">Description</th>
//                   <th className="pb-2 text-right">P.U.</th>
//                   <th className="pb-2 text-right">Total</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {invoice.items.map((item, i) => (
//                   <tr key={i} className="border-b border-gray-50">
//                     <td className="py-2.5 text-gray-500">{item.qty}</td>
//                     <td className="py-2.5 text-gray-800">{item.description}</td>
//                     <td className="py-2.5 text-right text-gray-500">{formatCurrency(item.price)}</td>
//                     <td className="py-2.5 text-right font-medium text-gray-900">{formatCurrency(item.qty * item.price)}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>

//           <div className="bg-gray-50 rounded-xl p-4 space-y-2">
//             <div className="flex justify-between text-sm text-gray-500"><span>Total HT</span><span>{formatCurrency(invoice.totalHT)}</span></div>
//             <div className="flex justify-between text-sm text-gray-500"><span>TVA ({invoice.tvaRate ?? 20}%)</span><span>{formatCurrency(invoice.tva)}</span></div>
//             <div className="flex justify-between font-bold text-lg text-emerald-600 pt-2 border-t border-gray-200">
//               <span>Total TTC</span><span>{formatCurrency(invoice.totalTTC)}</span>
//             </div>
//           </div>

//           {invoice.notes && (
//             <div className="bg-gray-50 rounded-xl p-4">
//               <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Notes</p>
//               <p className="text-sm text-gray-600 whitespace-pre-line">{invoice.notes}</p>
//             </div>
//           )}

//           <div>
//             <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Changer le statut</p>
//             <div className="flex gap-2">
//               {(["paid", "pending", "overdue"] as InvoiceStatus[]).map((s) => (
//                 <button key={s} onClick={() => onStatusChange(invoice.id, s)}
//                   className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition ${
//                     invoice.status === s ? "bg-emerald-600 text-white border-emerald-600" : "border-gray-200 text-gray-500 hover:border-gray-300"
//                   }`}>
//                   {STATUS_CONFIG[s].label}
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* ── Bouton Modifier ── */}
//           <button
//             onClick={() => { onClose(); onEdit(invoice); }}
//             className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white py-3.5 rounded-xl font-bold text-sm transition shadow-sm"
//           >
//             <Pencil size={16} />
//             Modifier cette facture
//           </button>

//         </div>
//       </div>
//     </div>
//   );
// }

// // ─── Main Dashboard ───────────────────────────────────────────────────────────
// export default function Dashboard({
//   onCreateNew,
//   onEditInvoice,
// }: {
//   onCreateNew?: () => void;
//   onEditInvoice?: (invoice: Invoice) => void;
// }) {
//   const [invoices, setInvoices] = useState<Invoice[]>([]);
//   const [search, setSearch] = useState("");
//   const [filterStatus, setFilterStatus] = useState<InvoiceStatus | "all">("all");
//   const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

//   useEffect(() => {
//     const charger = async () => {
//       const data = await facturesAPI.getAll();
//       setInvoices(data);
//     };
//     charger();
//   }, []);

//   const totalRevenue  = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.totalTTC, 0);
//   const pendingAmount = invoices.filter((i) => i.status === "pending").reduce((s, i) => s + i.totalTTC, 0);
//   const overdueCount  = invoices.filter((i) => i.status === "overdue").length;
//   const uniqueClients = new Set(invoices.map((i) => i.clientName)).size;

//   const filtered = invoices.filter((inv) => {
//     const matchSearch = inv.clientName.toLowerCase().includes(search.toLowerCase()) || inv.id.toLowerCase().includes(search.toLowerCase());
//     const matchStatus = filterStatus === "all" || inv.status === filterStatus;
//     return matchSearch && matchStatus;
//   });

//   const moveToTrash = async (id: string) => {
//     await facturesAPI.moveToTrash(id);
//     setInvoices(prev => prev.filter(i => i.id !== id));
//     if (selectedInvoice?.id === id) setSelectedInvoice(null);
//   };

//   const handleStatusChange = async (id: string, status: InvoiceStatus) => {
//     await facturesAPI.updateStatus(id, status);
//     setInvoices(prev => prev.map(i => i.id === id ? { ...i, status } : i));
//     setSelectedInvoice(prev => prev ? { ...prev, status } : null);
//   };

//   return (
//     <div className="space-y-6 sm:space-y-8">

//       {/* Header */}
//       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//         <div>
//           <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Tableau de bord</h1>
//           <p className="text-sm text-gray-400 mt-0.5">
//             {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
//           </p>
//         </div>
//         <button onClick={onCreateNew}
//           className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition w-full sm:w-auto">
//           <Plus size={16} />Nouvelle facture
//         </button>
//       </div>

//       {/* Stats */}
//       <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
//         <StatCard icon={<TrendingUp size={18} className="text-emerald-700" />} label="Revenus" value={formatCurrency(totalRevenue)} sub="Factures payées" accent="bg-emerald-50" />
//         <StatCard icon={<Clock size={18} className="text-amber-600" />} label="En attente" value={formatCurrency(pendingAmount)} sub={`${invoices.filter((i) => i.status === "pending").length} facture(s)`} accent="bg-amber-50" />
//         <StatCard icon={<AlertCircle size={18} className="text-red-600" />} label="En retard" value={String(overdueCount)} sub="Impayée(s)" accent="bg-red-50" />
//         <StatCard icon={<Users size={18} className="text-blue-600" />} label="Clients" value={String(uniqueClients)} sub="Uniques" accent="bg-blue-50" />
//       </div>

//       {/* Status chart */}
//       <StatusChart invoices={invoices} />

//       {/* Table */}
//       <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
//         <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 sm:p-5 border-b border-gray-100">
//           <h2 className="font-bold text-gray-900 text-lg">Factures récentes</h2>
//           <div className="flex items-center gap-2">
//             <div className="relative flex-1 sm:w-56">
//               <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
//               <input type="text" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)}
//                 className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
//             </div>
//             <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as InvoiceStatus | "all")}
//               className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-gray-600 shrink-0">
//               <option value="all">Tous</option>
//               <option value="paid">Payée</option>
//               <option value="pending">En attente</option>
//               <option value="overdue">En retard</option>
//             </select>
//           </div>
//         </div>

//         {filtered.length === 0 ? (
//           <div className="flex flex-col items-center justify-center py-16 text-gray-400">
//             <FileText size={40} className="mb-4 opacity-30" />
//             <p className="font-semibold text-gray-500">Aucune facture trouvée</p>
//             <p className="text-sm mt-1">Créez votre première facture.</p>
//           </div>
//         ) : (
//           <>
//             {/* Desktop */}
//             <div className="hidden sm:block overflow-x-auto">
//               <table className="w-full text-sm">
//                 <thead>
//                   <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
//                     <th className="px-5 py-3">Référence</th>
//                     <th className="px-5 py-3">Client</th>
//                     <th className="px-5 py-3">Date</th>
//                     <th className="px-5 py-3">Montant TTC</th>
//                     <th className="px-5 py-3">Statut</th>
//                     <th className="px-5 py-3 text-right">Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {filtered.map((inv) => (
//                     <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50/70 transition">
//                       <td className="px-5 py-4"><span className="font-mono font-semibold text-gray-700">{inv.id}</span></td>
//                       <td className="px-5 py-4">
//                         <p className="font-medium text-gray-900">{inv.clientName}</p>
//                         <p className="text-xs text-gray-400">{inv.companyName}</p>
//                       </td>
//                       <td className="px-5 py-4 text-gray-500">{formatDate(inv.date)}</td>
//                       <td className="px-5 py-4 font-bold text-gray-900">{formatCurrency(inv.totalTTC)}</td>
//                       <td className="px-5 py-4"><StatusBadge status={inv.status} /></td>
//                       <td className="px-5 py-4 text-right">
//                         <div className="flex items-center justify-end gap-1">
//                           <button onClick={() => setSelectedInvoice(inv)} title="Voir" className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:text-gray-800 transition">
//                             <Eye size={15} />
//                           </button>
//                           <button title="Télécharger" className="p-1.5 rounded-lg bg-blue-50 text-blue-500 hover:text-blue-700 transition">
//                             <Download size={15} />
//                           </button>
//                           <button onClick={() => moveToTrash(inv.id)} title="Corbeille" className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:text-red-700 transition">
//                             <Trash2 size={15} />
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>

//             {/* Mobile */}
//             <div className="sm:hidden divide-y divide-gray-50">
//               {filtered.map((inv) => (
//                 <div key={inv.id} className="p-4 flex items-start justify-between gap-3 active:bg-gray-50 transition">
//                   <div className="flex-1 min-w-0" onClick={() => setSelectedInvoice(inv)}>
//                     <div className="flex items-center gap-2 mb-1 flex-wrap">
//                       <span className="font-mono text-xs font-semibold text-gray-500">{inv.id}</span>
//                       <StatusBadge status={inv.status} />
//                     </div>
//                     <p className="font-semibold text-gray-900 truncate">{inv.clientName}</p>
//                     <p className="text-xs text-gray-400 mt-0.5">{formatDate(inv.date)}</p>
//                   </div>
//                   <div className="text-right shrink-0">
//                     <p className="font-bold text-gray-900 text-sm">{formatCurrency(inv.totalTTC)}</p>
//                     <div className="flex items-center gap-1 mt-2 justify-end">
//                       <button onClick={() => setSelectedInvoice(inv)} className="p-1.5 rounded-lg bg-gray-100 text-gray-500"><Eye size={14} /></button>
//                       <button className="p-1.5 rounded-lg bg-blue-50 text-blue-500"><Download size={14} /></button>
//                       <button onClick={() => moveToTrash(inv.id)} className="p-1.5 rounded-lg bg-red-50 text-red-500"><Trash2 size={14} /></button>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </>
//         )}

//         <div className="px-4 sm:px-5 py-3 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400">
//           <span>{filtered.length} résultat{filtered.length !== 1 ? "s" : ""}</span>
//           <button className="flex items-center gap-1 hover:text-emerald-600 transition font-medium">
//             Voir tout <ArrowUpRight size={12} />
//           </button>
//         </div>
//       </div>

//       {/* Modal */}
//       {selectedInvoice && (
//         <InvoiceModal
//           invoice={selectedInvoice}
//           onClose={() => setSelectedInvoice(null)}
//           onStatusChange={handleStatusChange}
//           onEdit={(inv) => {
//             setSelectedInvoice(null);
//             onEditInvoice?.(inv);
//           }}
//         />
//       )}
//     </div>
//   );
// }









"use client";

import { useState, useEffect } from "react";
import { facturesAPI } from '@/lib/api';
import {
  FileText, Plus, TrendingUp, Clock, CheckCircle,
  AlertCircle, Search, Eye, Trash2, Download,
  ArrowUpRight, Users, Pencil,
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { Invoice, InvoiceStatus } from "@/types/invoice"; // ← import partagé, types locaux supprimés

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}
function formatCurrency(n: number) {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " €";
}

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; color: string; bg: string; hex: string; icon: React.ReactNode }> = {
  paid:    { label: "Payées",     color: "text-emerald-700", bg: "bg-emerald-50", hex: "#059669", icon: <CheckCircle size={13} /> },
  pending: { label: "En attente", color: "text-amber-700",   bg: "bg-amber-50",   hex: "#d97706", icon: <Clock size={13} /> },
  overdue: { label: "En retard",  color: "text-red-700",     bg: "bg-red-50",     hex: "#dc2626", icon: <AlertCircle size={13} /> },
};

function StatCard({ icon, label, value, sub, accent }: { icon: React.ReactNode; label: string; value: string; sub?: string; accent: string }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow flex items-start gap-3 sm:gap-4">
      <div className={`p-2.5 sm:p-3 rounded-xl shrink-0 ${accent}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1 leading-tight">{label}</p>
        <p className="text-lg sm:text-2xl font-bold text-gray-900 leading-none">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color} ${cfg.bg}`}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

function StatusChart({ invoices }: { invoices: Invoice[] }) {
  const data = (["paid", "pending", "overdue"] as InvoiceStatus[])
    .map((s) => ({ name: STATUS_CONFIG[s].label, value: invoices.filter((i) => i.status === s).length, color: STATUS_CONFIG[s].hex }))
    .filter((d) => d.value > 0);
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
      <h2 className="font-bold text-gray-900 text-lg mb-5">Répartition des statuts</h2>
      {total === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Aucune facture à afficher.</p>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="w-44 h-44 shrink-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={48} outerRadius={70} paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={(props) => {
                  if (!props?.active || !props?.payload?.length) return null;
                  const { name, value } = props.payload[0];
                  return (
                    <div style={{ borderRadius: "12px", border: "1px solid #f3f4f6", fontSize: "12px", background: "#fff", padding: "8px 12px" }}>
                      <p className="font-semibold text-gray-700">{String(name)}</p>
                      <p className="text-gray-500">{String(value)} facture(s)</p>
                    </div>
                  );
                }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-gray-900">{total}</span>
              <span className="text-xs text-gray-400">factures</span>
            </div>
          </div>
          <div className="flex-1 w-full space-y-3">
            {data.map((entry) => {
              const pct = Math.round((entry.value / total) * 100);
              return (
                <div key={entry.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                      <span className="text-sm font-medium text-gray-700">{entry.name}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{entry.value} <span className="text-xs font-normal text-gray-400">({pct}%)</span></span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: entry.color }} />
                  </div>
                </div>
              );
            })}
            <div className="pt-2 border-t border-gray-100 flex justify-between text-xs text-gray-400">
              <span>Total</span>
              <span className="font-semibold text-gray-600">{total} facture{total > 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InvoiceModal({ invoice, onClose, onStatusChange, onEdit }: {
  invoice: Invoice;
  onClose: () => void;
  onStatusChange: (id: string, status: InvoiceStatus) => void;
  onEdit: (invoice: Invoice) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white w-full sm:rounded-2xl sm:max-w-2xl rounded-t-2xl shadow-2xl max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>

        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-100">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Facture</p>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{invoice.id}</h2>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={invoice.status} />
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl font-bold p-1">✕</button>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-6">

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Émetteur</p>
              <p className="font-bold text-gray-900">{invoice.companyName}</p>
              <p className="text-sm text-gray-500">{invoice.companyAddress}</p>
              {invoice.companyEmail && <p className="text-sm text-gray-400">{invoice.companyEmail}</p>}
              {invoice.companyPhone && <p className="text-sm text-gray-400">{invoice.companyPhone}</p>}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Client</p>
              <p className="font-bold text-gray-900">{invoice.clientName}</p>
              <p className="text-sm text-gray-500">{invoice.clientAddress}</p>
              {invoice.clientEmail && <p className="text-sm text-gray-400">{invoice.clientEmail}</p>}
              {invoice.clientPhone && <p className="text-sm text-gray-400">{invoice.clientPhone}</p>}
            </div>
          </div>

          {(invoice.invoiceDate || invoice.dueDate) && (
            <div className="grid grid-cols-2 gap-4">
              {invoice.invoiceDate && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Date de facture</p>
                  <p className="text-sm font-medium text-gray-700">{new Date(invoice.invoiceDate).toLocaleDateString("fr-FR")}</p>
                </div>
              )}
              {invoice.dueDate && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Échéance</p>
                  <p className="text-sm font-medium text-gray-700">{new Date(invoice.dueDate).toLocaleDateString("fr-FR")}</p>
                </div>
              )}
            </div>
          )}

          <div className="overflow-x-auto">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Détail des prestations</p>
            <table className="w-full text-sm min-w-100">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-400 text-xs uppercase">
                  <th className="pb-2">Qté</th>
                  <th className="pb-2">Description</th>
                  <th className="pb-2 text-right">P.U.</th>
                  <th className="pb-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-2.5 text-gray-500">{item.qty}</td>
                    <td className="py-2.5 text-gray-800">{item.description}</td>
                    <td className="py-2.5 text-right text-gray-500">{formatCurrency(item.price)}</td>
                    <td className="py-2.5 text-right font-medium text-gray-900">{formatCurrency(item.qty * item.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-500"><span>Total HT</span><span>{formatCurrency(invoice.totalHT)}</span></div>
            <div className="flex justify-between text-sm text-gray-500"><span>TVA ({invoice.tvaRate ?? 20}%)</span><span>{formatCurrency(invoice.tva)}</span></div>
            <div className="flex justify-between font-bold text-lg text-emerald-600 pt-2 border-t border-gray-200">
              <span>Total TTC</span><span>{formatCurrency(invoice.totalTTC)}</span>
            </div>
          </div>

          {invoice.notes && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Notes</p>
              <p className="text-sm text-gray-600 whitespace-pre-line">{invoice.notes}</p>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Changer le statut</p>
            <div className="flex gap-2">
              {(["paid", "pending", "overdue"] as InvoiceStatus[]).map((s) => (
                <button key={s} onClick={() => onStatusChange(invoice.id, s)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition ${
                    invoice.status === s ? "bg-emerald-600 text-white border-emerald-600" : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}>
                  {STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => { onClose(); onEdit(invoice); }}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white py-3.5 rounded-xl font-bold text-sm transition shadow-sm"
          >
            <Pencil size={16} />
            Modifier cette facture
          </button>

        </div>
      </div>
    </div>
  );
}

export default function Dashboard({
  onCreateNew,
  onEditInvoice,
}: {
  onCreateNew?: () => void;
  onEditInvoice?: (invoice: Invoice) => void;
}) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<InvoiceStatus | "all">("all");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    const charger = async () => {
      const data = await facturesAPI.getAll();
      setInvoices(data);
    };
    charger();
  }, []);

  const totalRevenue  = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.totalTTC, 0);
  const pendingAmount = invoices.filter((i) => i.status === "pending").reduce((s, i) => s + i.totalTTC, 0);
  const overdueCount  = invoices.filter((i) => i.status === "overdue").length;
  const uniqueClients = new Set(invoices.map((i) => i.clientName)).size;

  const filtered = invoices.filter((inv) => {
    const matchSearch = inv.clientName.toLowerCase().includes(search.toLowerCase()) || inv.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || inv.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const moveToTrash = async (id: string) => {
    await facturesAPI.moveToTrash(id);
    setInvoices(prev => prev.filter(i => i.id !== id));
    if (selectedInvoice?.id === id) setSelectedInvoice(null);
  };

  const handleStatusChange = async (id: string, status: InvoiceStatus) => {
    await facturesAPI.updateStatus(id, status);
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, status } : i));
    setSelectedInvoice(prev => prev ? { ...prev, status } : null);
  };

  return (
    <div className="space-y-6 sm:space-y-8">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <button onClick={onCreateNew}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition w-full sm:w-auto">
          <Plus size={16} />Nouvelle facture
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={<TrendingUp size={18} className="text-emerald-700" />} label="Revenus" value={formatCurrency(totalRevenue)} sub="Factures payées" accent="bg-emerald-50" />
        <StatCard icon={<Clock size={18} className="text-amber-600" />} label="En attente" value={formatCurrency(pendingAmount)} sub={`${invoices.filter((i) => i.status === "pending").length} facture(s)`} accent="bg-amber-50" />
        <StatCard icon={<AlertCircle size={18} className="text-red-600" />} label="En retard" value={String(overdueCount)} sub="Impayée(s)" accent="bg-red-50" />
        <StatCard icon={<Users size={18} className="text-blue-600" />} label="Clients" value={String(uniqueClients)} sub="Uniques" accent="bg-blue-50" />
      </div>

      <StatusChart invoices={invoices} />

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 sm:p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-lg">Factures récentes</h2>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-56">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
            </div>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as InvoiceStatus | "all")}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-gray-600 shrink-0">
              <option value="all">Tous</option>
              <option value="paid">Payée</option>
              <option value="pending">En attente</option>
              <option value="overdue">En retard</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <FileText size={40} className="mb-4 opacity-30" />
            <p className="font-semibold text-gray-500">Aucune facture trouvée</p>
            <p className="text-sm mt-1">Créez votre première facture.</p>
          </div>
        ) : (
          <>
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <th className="px-5 py-3">Référence</th>
                    <th className="px-5 py-3">Client</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Montant TTC</th>
                    <th className="px-5 py-3">Statut</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inv) => (
                    <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50/70 transition">
                      <td className="px-5 py-4"><span className="font-mono font-semibold text-gray-700">{inv.id}</span></td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-900">{inv.clientName}</p>
                        <p className="text-xs text-gray-400">{inv.companyName}</p>
                      </td>
                      <td className="px-5 py-4 text-gray-500">{formatDate(inv.date)}</td>
                      <td className="px-5 py-4 font-bold text-gray-900">{formatCurrency(inv.totalTTC)}</td>
                      <td className="px-5 py-4"><StatusBadge status={inv.status} /></td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setSelectedInvoice(inv)} title="Voir" className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:text-gray-800 transition">
                            <Eye size={15} />
                          </button>
                          <button title="Télécharger" className="p-1.5 rounded-lg bg-blue-50 text-blue-500 hover:text-blue-700 transition">
                            <Download size={15} />
                          </button>
                          <button onClick={() => moveToTrash(inv.id)} title="Corbeille" className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:text-red-700 transition">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="sm:hidden divide-y divide-gray-50">
              {filtered.map((inv) => (
                <div key={inv.id} className="p-4 flex items-start justify-between gap-3 active:bg-gray-50 transition">
                  <div className="flex-1 min-w-0" onClick={() => setSelectedInvoice(inv)}>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-xs font-semibold text-gray-500">{inv.id}</span>
                      <StatusBadge status={inv.status} />
                    </div>
                    <p className="font-semibold text-gray-900 truncate">{inv.clientName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(inv.date)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-gray-900 text-sm">{formatCurrency(inv.totalTTC)}</p>
                    <div className="flex items-center gap-1 mt-2 justify-end">
                      <button onClick={() => setSelectedInvoice(inv)} className="p-1.5 rounded-lg bg-gray-100 text-gray-500"><Eye size={14} /></button>
                      <button className="p-1.5 rounded-lg bg-blue-50 text-blue-500"><Download size={14} /></button>
                      <button onClick={() => moveToTrash(inv.id)} className="p-1.5 rounded-lg bg-red-50 text-red-500"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="px-4 sm:px-5 py-3 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400">
          <span>{filtered.length} résultat{filtered.length !== 1 ? "s" : ""}</span>
          <button className="flex items-center gap-1 hover:text-emerald-600 transition font-medium">
            Voir tout <ArrowUpRight size={12} />
          </button>
        </div>
      </div>

      {selectedInvoice && (
        <InvoiceModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onStatusChange={handleStatusChange}
          onEdit={(inv) => {
            setSelectedInvoice(null);
            onEditInvoice?.(inv);
          }}
        />
      )}
    </div>
  );
}



