
//MyInvoices.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import {
  ScrollText, Search, Trash2, Eye, Download, CheckSquare,
  Square, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  FileDown, SlidersHorizontal, X, CheckCircle, Clock, AlertCircle,
  Calendar,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { facturesAPI } from '@/lib/api';

type InvoiceItem = { qty: number; description: string; price: number };
type InvoiceStatus = "paid" | "pending" | "overdue";
type Invoice = {
  id: string;
  companyName: string;
  companyAddress: string;
  clientName: string;
  clientAddress: string;
  items: InvoiceItem[];
  totalHT: number;
  tva: number;
  totalTTC: number;
  date: string;
  status: InvoiceStatus;
  deletedAt?: string;
};
type SortField = "id" | "clientName" | "date" | "totalTTC" | "status";
type SortDir = "asc" | "desc";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}
function formatCurrency(n: number) {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " €";
}

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  paid:    { label: "Payée",      color: "text-emerald-700", bg: "bg-emerald-50", icon: <CheckCircle size={13} /> },
  pending: { label: "En attente", color: "text-amber-700",   bg: "bg-amber-50",   icon: <Clock size={13} /> },
  overdue: { label: "En retard",  color: "text-red-700",     bg: "bg-red-50",     icon: <AlertCircle size={13} /> },
};

const PAGE_SIZE = 8;
const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const DAYS_FR = ["Lu","Ma","Me","Je","Ve","Sa","Di"];

// ─── Calendar Picker ──────────────────────────────────────────────────────────

function CalendarPicker({
  startDate, endDate, onRangeChange, onClose,
}: {
  startDate: Date | null;
  endDate: Date | null;
  onRangeChange: (start: Date | null, end: Date | null) => void;
  onClose: () => void;
}) {
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [selecting, setSelecting] = useState<"start" | "end">("start");
  const [hovered, setHovered] = useState<Date | null>(null);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const firstDay = new Date(viewYear, viewMonth, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const isSame = (a: Date | null, b: Date | null) =>
    a && b && a.toDateString() === b.toDateString();

  const inRange = (d: Date) => {
    const s = startDate;
    const e = endDate ?? hovered;
    if (!s || !e) return false;
    const [lo, hi] = s <= e ? [s, e] : [e, s];
    return d > lo && d < hi;
  };

  const handleDay = (d: Date) => {
    if (selecting === "start" || !startDate) {
      onRangeChange(d, null);
      setSelecting("end");
    } else {
      if (d < startDate) { onRangeChange(d, startDate); }
      else               { onRangeChange(startDate, d); }
      setSelecting("start");
      onClose();
    }
  };

  const presets = [
    { label: "7 derniers jours", fn: () => { const s = new Date(); s.setDate(s.getDate()-6); onRangeChange(s, new Date()); onClose(); } },
    { label: "Ce mois",          fn: () => { const n = new Date(); onRangeChange(new Date(n.getFullYear(), n.getMonth(), 1), new Date(n.getFullYear(), n.getMonth()+1, 0)); onClose(); } },
    { label: "Mois dernier",     fn: () => { const n = new Date(); onRangeChange(new Date(n.getFullYear(), n.getMonth()-1, 1), new Date(n.getFullYear(), n.getMonth(), 0)); onClose(); } },
    { label: "Cette année",      fn: () => { const n = new Date(); onRangeChange(new Date(n.getFullYear(), 0, 1), new Date(n.getFullYear(), 11, 31)); onClose(); } },
  ];

  const cells: (Date | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(viewYear, viewMonth, i + 1)),
  ];

  return (
    <div className="absolute top-full mt-2 left-0 z-50 bg-white border border-gray-200 rounded-2xl shadow-2xl p-4 w-[320px] sm:w-90">
      <div className="flex flex-wrap gap-1.5 mb-3 pb-3 border-b border-gray-100">
        {presets.map((p) => (
          <button key={p.label} onClick={p.fn}
            className="text-xs px-2.5 py-1 rounded-lg bg-gray-50 hover:bg-emerald-50 hover:text-emerald-700 text-gray-600 transition font-medium">
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition"><ChevronLeft size={16} /></button>
        <span className="text-sm font-semibold text-gray-800">{MONTHS_FR[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition"><ChevronRight size={16} /></button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAYS_FR.map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const isStart = isSame(d, startDate);
          const isEnd   = isSame(d, endDate);
          const isIn    = inRange(d);
          const isToday = isSame(d, new Date());
          return (
            <button key={i} onClick={() => handleDay(d)}
              onMouseEnter={() => setHovered(d)} onMouseLeave={() => setHovered(null)}
              className={`relative h-8 w-full text-xs font-medium transition-all
                ${isStart || isEnd ? "bg-emerald-600 text-white rounded-lg z-10" : ""}
                ${isIn ? "bg-emerald-50 text-emerald-800 rounded-none" : ""}
                ${!isStart && !isEnd && !isIn ? "hover:bg-gray-100 text-gray-700 rounded-lg" : ""}
                ${isToday && !isStart && !isEnd ? "font-bold underline" : ""}
              `}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {startDate && endDate
            ? `${formatDate(startDate.toISOString())} → ${formatDate(endDate.toISOString())}`
            : startDate ? `Début : ${formatDate(startDate.toISOString())}`
            : "Sélectionnez une période"}
        </span>
        {(startDate || endDate) && (
          <button onClick={() => { onRangeChange(null, null); setSelecting("start"); }}
            className="text-xs text-red-500 hover:text-red-700 transition font-medium">
            Effacer
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color} ${cfg.bg}`}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

// ─── Invoice Modal ────────────────────────────────────────────────────────────

function InvoiceModal({ invoice, onClose, onStatusChange, onDownload }: {
  invoice: Invoice;
  onClose: () => void;
  onStatusChange: (id: string, status: InvoiceStatus) => void;
  onDownload: (inv: Invoice) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white w-full sm:rounded-2xl sm:max-w-2xl rounded-t-2xl shadow-2xl max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center pt-3 sm:hidden"><div className="w-10 h-1 bg-gray-200 rounded-full" /></div>
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-100">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Facture</p>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{invoice.id}</h2>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={invoice.status} />
            <button onClick={() => onDownload(invoice)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-500 hover:bg-blue-100 rounded-lg text-xs font-semibold transition">
              <Download size={13} />PDF
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl font-bold p-1">✕</button>
          </div>
        </div>
        <div className="p-5 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Émetteur</p>
              <p className="font-bold text-gray-900">{invoice.companyName}</p>
              <p className="text-sm text-gray-500">{invoice.companyAddress}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Client</p>
              <p className="font-bold text-gray-900">{invoice.clientName}</p>
              <p className="text-sm text-gray-500">{invoice.clientAddress}</p>
            </div>
          </div>
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
            <div className="flex justify-between text-sm text-gray-500"><span>TVA (20%)</span><span>{formatCurrency(invoice.tva)}</span></div>
            <div className="flex justify-between font-bold text-lg text-emerald-600 pt-2 border-t border-gray-200">
              <span>Total TTC</span><span>{formatCurrency(invoice.totalTTC)}</span>
            </div>
          </div>
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
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function MyInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<InvoiceStatus | "all">("all");
  const [filterClient, setFilterClient] = useState("all");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showCal, setShowCal] = useState(false);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<InvoiceStatus | "">("");
  const [toastMsg, setToastMsg] = useState("");
  const calRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const charger = async () => {
      const data = await facturesAPI.getAll();
      setInvoices(data);
    };
    charger();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (calRef.current && !calRef.current.contains(e.target as Node)) setShowCal(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const save = (updated: Invoice[]) => {
    setInvoices(updated);
    localStorage.setItem("invoices", JSON.stringify(updated));
  };

  // ── Envoyer en corbeille ──
  const moveToTrash = async (ids: string[]) => {
    for (const id of ids) {
      await facturesAPI.moveToTrash(id);
    }
    setInvoices(prev => prev.filter(i => !ids.includes(i.id)));
    setSelected(new Set());
    showToast(`${ids.length} facture${ids.length > 1 ? 's' : ''} déplacée${ids.length > 1 ? 's' : ''} dans la corbeille`);
  };

  const clients = ["all", ...Array.from(new Set(invoices.map((i) => i.clientName)))];

  // ── Filter ──
  const filtered = invoices.filter((inv) => {
    const matchSearch =
      inv.clientName.toLowerCase().includes(search.toLowerCase()) ||
      inv.id.toLowerCase().includes(search.toLowerCase()) ||
      inv.companyName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || inv.status === filterStatus;
    const matchClient = filterClient === "all" || inv.clientName === filterClient;
    let matchDate = true;
    if (startDate || endDate) {
      const d = new Date(inv.date);
      if (startDate) matchDate = matchDate && d >= startDate;
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59);
        matchDate = matchDate && d <= end;
      }
    }
    return matchSearch && matchStatus && matchClient && matchDate;
  });

  // ── Sort ──
  const sorted = [...filtered].sort((a, b) => {
    let va: string | number = a[sortField] ?? "";
    let vb: string | number = b[sortField] ?? "";
    if (sortField === "totalTTC") { va = a.totalTTC; vb = b.totalTTC; }
    if (sortField === "date")     { va = new Date(a.date).getTime(); vb = new Date(b.date).getTime(); }
    if (va < vb) return sortDir === "asc" ? -1 : 1;
    if (va > vb) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  // ── Pagination ──
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
    setPage(1);
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className="inline-flex flex-col ml-1 opacity-40">
      <ChevronUp size={10} className={sortField === field && sortDir === "asc" ? "opacity-100 text-emerald-600" : ""} />
      <ChevronDown size={10} className={sortField === field && sortDir === "desc" ? "opacity-100 text-emerald-600" : ""} />
    </span>
  );

  // ── Selection ──
  const toggleSelect = (id: string) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };
  const toggleAll = () => {
    setSelected(selected.size === paginated.length ? new Set() : new Set(paginated.map((i) => i.id)));
  };
  const allSelected = paginated.length > 0 && selected.size === paginated.length;

  // ── Bulk ──
  const handleBulkDelete = () => moveToTrash(Array.from(selected));
  const handleBulkStatus = async () => {
    if (!bulkStatus) return;
    for (const id of selected) {
      await facturesAPI.updateStatus(id, bulkStatus);
    }
    setInvoices(prev => prev.map(i => selected.has(i.id) ? { ...i, status: bulkStatus as InvoiceStatus } : i));
    setSelected(new Set());
    setBulkStatus('');
  };

  const handleStatusChange = async (id: string, status: InvoiceStatus) => {
    await facturesAPI.updateStatus(id, status);
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, status } : i));
    setSelectedInvoice(prev => prev ? { ...prev, status } : null);
  };

  // ── Download single invoice PDF ──
  const downloadInvoicePDF = (inv: Invoice) => {
    const doc = new jsPDF();
    doc.setFillColor(5, 150, 105);
    doc.rect(0, 0, 210, 32, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(inv.companyName || "Entreprise", 14, 14);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    if (inv.companyAddress) doc.text(inv.companyAddress, 14, 21);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("FACTURE", 196, 14, { align: "right" });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`N° ${inv.id}`, 196, 21, { align: "right" });
    doc.text(`Date : ${formatDate(inv.date)}`, 196, 27, { align: "right" });
    doc.setTextColor(80, 80, 80);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("FACTURÉ À", 14, 44);
    doc.setFont("helvetica", "normal");
    doc.text(inv.clientName    || "—", 14, 50);
    doc.text(inv.clientAddress || "—", 14, 56);
    const statusColors: Record<InvoiceStatus, [number, number, number]> = {
      paid:    [5, 150, 105],
      pending: [217, 119, 6],
      overdue: [220, 38, 38],
    };
    doc.setFillColor(...statusColors[inv.status]);
    doc.roundedRect(140, 40, 56, 10, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(STATUS_CONFIG[inv.status].label, 168, 47, { align: "center" });
    autoTable(doc, {
      startY: 68,
      head: [["Description", "Qté", "P.U. (€)", "Total (€)"]],
      body: inv.items.map((it) => [it.description, it.qty, it.price.toFixed(2), (it.qty * it.price).toFixed(2)]),
      headStyles: { fillColor: [5, 150, 105], fontStyle: "bold", fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [245, 250, 248] },
      columnStyles: { 1: { halign: "center" }, 2: { halign: "right" }, 3: { halign: "right", fontStyle: "bold" } },
    });
    const y = (doc as any).lastAutoTable.finalY + 8;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(120, y, 76, 30, 3, 3, "F");
    doc.setFontSize(9); doc.setTextColor(100, 100, 100); doc.setFont("helvetica", "normal");
    doc.text("Total HT :",  126, y + 8);  doc.text(`${inv.totalHT.toFixed(2)} €`,  192, y + 8,  { align: "right" });
    doc.text("TVA (20%) :", 126, y + 16); doc.text(`${inv.tva.toFixed(2)} €`,       192, y + 16, { align: "right" });
    doc.setFillColor(5, 150, 105); doc.rect(120, y + 20, 76, 11, "F");
    doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(10);
    doc.text("TOTAL TTC :", 126, y + 27); doc.text(`${inv.totalTTC.toFixed(2)} €`, 192, y + 27, { align: "right" });
    const pageH = doc.internal.pageSize.height;
    doc.setFillColor(5, 150, 105); doc.rect(0, pageH - 10, 210, 10, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(7); doc.setFont("helvetica", "normal");
    doc.text("Généré par FacturePro", 105, pageH - 4, { align: "center" });
    doc.save(`${inv.id}.pdf`);
  };

  // ── Export all PDF ──
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(5, 150, 105); doc.rect(0, 0, 210, 28, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(18); doc.setFont("helvetica", "bold");
    doc.text("FacturePro", 14, 13);
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    doc.text("Export des factures", 14, 21);
    doc.text(`Généré le ${new Date().toLocaleDateString("fr-FR")}`, 150, 21);
    doc.setTextColor(100, 100, 100); doc.setFontSize(9);
    let filterLine = `${sorted.length} facture(s)`;
    if (startDate && endDate) filterLine += ` · du ${formatDate(startDate.toISOString())} au ${formatDate(endDate.toISOString())}`;
    if (filterStatus !== "all") filterLine += ` · Statut : ${STATUS_CONFIG[filterStatus].label}`;
    if (filterClient !== "all") filterLine += ` · Client : ${filterClient}`;
    doc.text(filterLine, 14, 36);
    autoTable(doc, {
      startY: 42,
      head: [["Référence", "Client", "Date", "Total HT", "TVA", "Total TTC", "Statut"]],
      body: sorted.map((i) => [i.id, i.clientName, formatDate(i.date), i.totalHT.toFixed(2)+" €", i.tva.toFixed(2)+" €", i.totalTTC.toFixed(2)+" €", STATUS_CONFIG[i.status].label]),
      headStyles: { fillColor: [5, 150, 105], fontStyle: "bold", fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [245, 250, 248] },
      columnStyles: { 0: { fontStyle: "bold" }, 5: { fontStyle: "bold" } },
    });
    const finalY = (doc as any).lastAutoTable.finalY + 8;
    const totalTTC = sorted.reduce((s, i) => s + i.totalTTC, 0);
    const totalHT  = sorted.reduce((s, i) => s + i.totalHT, 0);
    const totalTVA = sorted.reduce((s, i) => s + i.tva, 0);
    doc.setFontSize(9); doc.setTextColor(100, 100, 100);
    doc.text(`Total HT : ${totalHT.toFixed(2)} €`, 120, finalY);
    doc.text(`TVA : ${totalTVA.toFixed(2)} €`, 120, finalY + 6);
    doc.setTextColor(5, 150, 105); doc.setFont("helvetica", "bold"); doc.setFontSize(11);
    doc.text(`Total TTC : ${totalTTC.toFixed(2)} €`, 120, finalY + 14);
    doc.save("factures.pdf");
  };

  const activeFilters = [filterStatus !== "all", filterClient !== "all", !!(startDate || endDate)].filter(Boolean).length;
  const calLabel = startDate && endDate
    ? `${formatDate(startDate.toISOString())} → ${formatDate(endDate.toISOString())}`
    : startDate ? `Depuis ${formatDate(startDate.toISOString())}`
    : "Toute période";

  return (
    <div className="space-y-6">

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-fade-in">
          <Trash2 size={15} className="text-red-400" />
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Mes factures</h1>
          <p className="text-sm text-gray-400 mt-0.5">{filtered.length} facture{filtered.length !== 1 ? "s" : ""} trouvée{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={exportPDF}
          className="flex items-center justify-center gap-2 bg-white border border-gray-200 hover:border-emerald-400 hover:text-emerald-600 text-gray-600 px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition w-full sm:w-auto">
          <FileDown size={16} />Export PDF
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Rechercher par client, référence..."
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition shrink-0 ${
              showFilters || activeFilters > 0
                ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
            }`}>
            <SlidersHorizontal size={15} />
            Filtres
            {activeFilters > 0 && (
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">{activeFilters}</span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-3 pt-3 border-t border-gray-100 items-start">
            <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value as InvoiceStatus | "all"); setPage(1); }}
              className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-gray-600">
              <option value="all">Tous les statuts</option>
              <option value="paid">Payée</option>
              <option value="pending">En attente</option>
              <option value="overdue">En retard</option>
            </select>
            <select value={filterClient} onChange={(e) => { setFilterClient(e.target.value); setPage(1); }}
              className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-gray-600">
              {clients.map((c) => (
                <option key={c} value={c}>{c === "all" ? "Tous les clients" : c}</option>
              ))}
            </select>
            <div className="relative" ref={calRef}>
              <button onClick={() => setShowCal(!showCal)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition font-medium ${
                  startDate || endDate
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}>
                <Calendar size={15} />
                <span className="max-w-50 truncate">{calLabel}</span>
                {(startDate || endDate) && (
                  <span onClick={(e) => { e.stopPropagation(); setStartDate(null); setEndDate(null); setPage(1); }}
                    className="ml-1 hover:text-red-500 transition"><X size={13} /></span>
                )}
              </button>
              {showCal && (
                <CalendarPicker
                  startDate={startDate} endDate={endDate}
                  onRangeChange={(s, e) => { setStartDate(s); setEndDate(e); setPage(1); }}
                  onClose={() => setShowCal(false)}
                />
              )}
            </div>
            {activeFilters > 0 && (
              <button onClick={() => { setFilterStatus("all"); setFilterClient("all"); setStartDate(null); setEndDate(null); setPage(1); }}
                className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 px-3 py-2.5 rounded-xl hover:bg-red-50 transition">
                <X size={14} />Réinitialiser
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-emerald-700">{selected.size} sélectionnée{selected.size > 1 ? "s" : ""}</span>
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value as InvoiceStatus | "")}
              className="text-sm border border-emerald-300 rounded-lg px-3 py-1.5 focus:outline-none bg-white text-gray-600">
              <option value="">Changer statut...</option>
              <option value="paid">Payée</option>
              <option value="pending">En attente</option>
              <option value="overdue">En retard</option>
            </select>
            {bulkStatus && (
              <button onClick={handleBulkStatus} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition">
                Appliquer
              </button>
            )}
            <button onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-100 transition">
              <Trash2 size={14} />Mettre à la corbeille
            </button>
            <button onClick={() => setSelected(new Set())} className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-600 transition"><X size={16} /></button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <ScrollText size={40} className="mb-4 opacity-30" />
            <p className="font-semibold text-gray-500">Aucune facture trouvée</p>
            <p className="text-sm mt-1">Modifiez vos filtres ou créez une nouvelle facture.</p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <th className="px-4 py-3">
                      <button onClick={toggleAll} className="text-gray-400 hover:text-emerald-600 transition">
                        {allSelected ? <CheckSquare size={16} className="text-emerald-600" /> : <Square size={16} />}
                      </button>
                    </th>
                    {([
                      { field: "id",         label: "Référence"   },
                      { field: "clientName", label: "Client"      },
                      { field: "date",       label: "Date"        },
                      { field: "totalTTC",   label: "Montant TTC" },
                      { field: "status",     label: "Statut"      },
                    ] as { field: SortField; label: string }[]).map(({ field, label }) => (
                      <th key={field} className="px-4 py-3 cursor-pointer hover:text-gray-700 select-none" onClick={() => handleSort(field)}>
                        <span className="inline-flex items-center">{label}<SortIcon field={field} /></span>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((inv) => (
                    <tr key={inv.id} className={`border-b border-gray-50 hover:bg-gray-50/70 transition ${selected.has(inv.id) ? "bg-emerald-50/40" : ""}`}>
                      <td className="px-4 py-3.5">
                        <button onClick={() => toggleSelect(inv.id)} className="text-gray-300 hover:text-emerald-600 transition">
                          {selected.has(inv.id) ? <CheckSquare size={16} className="text-emerald-600" /> : <Square size={16} />}
                        </button>
                      </td>
                      <td className="px-4 py-3.5"><span className="font-mono font-semibold text-gray-700">{inv.id}</span></td>
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-gray-900">{inv.clientName}</p>
                        <p className="text-xs text-gray-400">{inv.companyName}</p>
                      </td>
                      <td className="px-4 py-3.5 text-gray-500">{formatDate(inv.date)}</td>
                      <td className="px-4 py-3.5 font-bold text-gray-900">{formatCurrency(inv.totalTTC)}</td>
                      <td className="px-4 py-3.5"><StatusBadge status={inv.status} /></td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setSelectedInvoice(inv)} title="Voir"
                            className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:text-gray-800 transition">
                            <Eye size={15} />
                          </button>
                          <button onClick={() => downloadInvoicePDF(inv)} title="Télécharger PDF"
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-500 hover:text-blue-700 transition">
                            <Download size={15} />
                          </button>
                          <button onClick={() => moveToTrash([inv.id])} title="Mettre à la corbeille"
                            className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:text-red-700 transition">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="sm:hidden divide-y divide-gray-50">
              {paginated.map((inv) => (
                <div key={inv.id} className={`p-4 flex items-start gap-3 transition ${selected.has(inv.id) ? "bg-emerald-50/40" : "active:bg-gray-50"}`}>
                  <button onClick={() => toggleSelect(inv.id)} className="mt-1 text-gray-300 hover:text-emerald-600 transition shrink-0">
                    {selected.has(inv.id) ? <CheckSquare size={16} className="text-emerald-600" /> : <Square size={16} />}
                  </button>
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
                      <button onClick={() => downloadInvoicePDF(inv)} className="p-1.5 rounded-lg bg-blue-50 text-blue-500"><Download size={14} /></button>
                      <button onClick={() => moveToTrash([inv.id])} className="p-1.5 rounded-lg bg-red-50 text-red-500"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 sm:px-5 py-3 border-t border-gray-100 flex items-center justify-between gap-3 flex-wrap">
            <span className="text-xs text-gray-400">Page {page} sur {totalPages} · {sorted.length} résultat{sorted.length !== 1 ? "s" : ""}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(page - 1)} disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition">
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition ${p === page ? "bg-emerald-600 text-white" : "hover:bg-gray-100 text-gray-500"}`}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(page + 1)} disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedInvoice && (
        <InvoiceModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onStatusChange={handleStatusChange}
          onDownload={downloadInvoicePDF}
        />
      )}
    </div>
  );
}








