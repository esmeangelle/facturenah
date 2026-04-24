"use client";

import { useState, useEffect } from "react";
import {
  Trash2, RotateCcw, CheckSquare, Square,
  CheckCircle, Clock, AlertCircle, X, Trash,
} from "lucide-react";
import { facturesAPI } from "@/lib/api";

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

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color} ${cfg.bg}`}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

export default function TrashPage() {
  const [trashed, setTrashed]       = useState<Invoice[]>([]);
  const [selected, setSelected]     = useState<Set<string>>(new Set());
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const [confirmIds, setConfirmIds] = useState<string[] | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur]         = useState("");

  // ── Charger la corbeille depuis l'API
  useEffect(() => {
    const charger = async () => {
      try {
        const data = await facturesAPI.getTrash();
        setTrashed(data);
      } catch {
        setErreur("Impossible de charger la corbeille");
      } finally {
        setChargement(false);
      }
    };
    charger();
  }, []);

  // ── Restaurer
  const restore = async (ids: string[]) => {
    try {
      for (const id of ids) {
        await facturesAPI.restore(id);
      }
      setTrashed(prev => prev.filter(i => !ids.includes(i.id)));
      setSelected(new Set());
    } catch {
      setErreur("Erreur lors de la restauration");
    }
  };

  // ── Supprimer définitivement
  const deletePermanently = async (ids: string[]) => {
    try {
      for (const id of ids) {
        await facturesAPI.deletePermanent(id);
      }
      setTrashed(prev => prev.filter(i => !ids.includes(i.id)));
      setSelected(new Set());
      setConfirmIds(null);
    } catch {
      setErreur("Erreur lors de la suppression");
    }
  };

  // ── Vider la corbeille
  const emptyTrash = async () => {
    try {
      for (const inv of trashed) {
        await facturesAPI.deletePermanent(inv.id);
      }
      setTrashed([]);
      setSelected(new Set());
      setConfirmEmpty(false);
    } catch {
      setErreur("Erreur lors du vidage");
    }
  };

  // ── Sélection
  const toggleSelect = (id: string) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };
  const toggleAll = () => {
    setSelected(selected.size === trashed.length ? new Set() : new Set(trashed.map(i => i.id)));
  };
  const allSelected = trashed.length > 0 && selected.size === trashed.length;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Trash2 size={22} className="text-red-500" />
            Corbeille
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {trashed.length} facture{trashed.length !== 1 ? "s" : ""} supprimée{trashed.length !== 1 ? "s" : ""}
          </p>
        </div>
        {trashed.length > 0 && (
          <button
            onClick={() => setConfirmEmpty(true)}
            className="flex items-center justify-center gap-2 bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 px-4 py-2.5 rounded-xl font-semibold text-sm transition w-full sm:w-auto"
          >
            <Trash size={16} />Vider la corbeille
          </button>
        )}
      </div>

      {/* Erreur */}
      {erreur && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
          <AlertCircle size={16} />
          {erreur}
          <button onClick={() => setErreur("")} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-gray-700">
            {selected.size} sélectionnée{selected.size > 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <button
              onClick={() => restore(Array.from(selected))}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-semibold hover:bg-emerald-100 transition"
            >
              <RotateCcw size={14} />Restaurer
            </button>
            <button
              onClick={() => setConfirmIds(Array.from(selected))}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-100 transition"
            >
              <Trash2 size={14} />Supprimer définitivement
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Chargement */}
        {chargement ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin mb-4" />
            <p className="text-sm">Chargement...</p>
          </div>
        ) : trashed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <Trash2 size={28} className="opacity-40" />
            </div>
            <p className="font-semibold text-gray-500">La corbeille est vide</p>
            <p className="text-sm mt-1">Les factures supprimées apparaîtront ici.</p>
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
                        {allSelected
                          ? <CheckSquare size={16} className="text-emerald-600" />
                          : <Square size={16} />}
                      </button>
                    </th>
                    <th className="px-4 py-3">Référence</th>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Date facture</th>
                    <th className="px-4 py-3">Montant TTC</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3">Supprimée le</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {trashed.map((inv) => (
                    <tr
                      key={inv.id}
                      className={`border-b border-gray-50 hover:bg-gray-50/70 transition ${selected.has(inv.id) ? "bg-red-50/30" : ""}`}
                    >
                      <td className="px-4 py-3.5">
                        <button onClick={() => toggleSelect(inv.id)} className="text-gray-300 hover:text-emerald-600 transition">
                          {selected.has(inv.id)
                            ? <CheckSquare size={16} className="text-emerald-600" />
                            : <Square size={16} />}
                        </button>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-mono font-semibold text-gray-400 line-through">{inv.id}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-gray-500">{inv.clientName}</p>
                        <p className="text-xs text-gray-400">{inv.companyName}</p>
                      </td>
                      <td className="px-4 py-3.5 text-gray-400">{formatDate(inv.date)}</td>
                      <td className="px-4 py-3.5 font-bold text-gray-400">{formatCurrency(inv.totalTTC)}</td>
                      <td className="px-4 py-3.5 opacity-60"><StatusBadge status={inv.status} /></td>
                      <td className="px-4 py-3.5 text-xs text-red-400 font-medium">
                        {inv.deletedAt ? formatDate(inv.deletedAt) : "—"}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => restore([inv.id])}
                            title="Restaurer"
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition"
                          >
                            <RotateCcw size={15} />
                          </button>
                          <button
                            onClick={() => setConfirmIds([inv.id])}
                            title="Supprimer définitivement"
                            className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition"
                          >
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
              {trashed.map((inv) => (
                <div
                  key={inv.id}
                  className={`p-4 flex items-start gap-3 transition ${selected.has(inv.id) ? "bg-red-50/30" : ""}`}
                >
                  <button onClick={() => toggleSelect(inv.id)} className="mt-1 text-gray-300 hover:text-emerald-600 transition shrink-0">
                    {selected.has(inv.id)
                      ? <CheckSquare size={16} className="text-emerald-600" />
                      : <Square size={16} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-xs font-semibold text-gray-400 line-through">{inv.id}</span>
                      <span className="opacity-60"><StatusBadge status={inv.status} /></span>
                    </div>
                    <p className="font-semibold text-gray-500 truncate">{inv.clientName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(inv.date)}</p>
                    {inv.deletedAt && (
                      <p className="text-xs text-red-400 font-medium mt-0.5">
                        Supprimée le {formatDate(inv.deletedAt)}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-gray-400 text-sm">{formatCurrency(inv.totalTTC)}</p>
                    <div className="flex items-center gap-1 mt-2 justify-end">
                      <button onClick={() => restore([inv.id])} className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                        <RotateCcw size={14} />
                      </button>
                      <button onClick={() => setConfirmIds([inv.id])} className="p-1.5 rounded-lg bg-red-50 text-red-500">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal — Supprimer définitivement */}
      {confirmIds && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mb-4 mx-auto">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
              Supprimer définitivement ?
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              {confirmIds.length > 1
                ? `Ces ${confirmIds.length} factures seront supprimées définitivement.`
                : "Cette facture sera supprimée définitivement."}
              {" "}Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmIds(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
              >
                Annuler
              </button>
              <button
                onClick={() => deletePermanently(confirmIds)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Vider la corbeille */}
      {confirmEmpty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mb-4 mx-auto">
              <Trash size={22} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
              Vider la corbeille ?
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Les {trashed.length} facture{trashed.length > 1 ? "s" : ""} seront supprimées définitivement. Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmEmpty(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
              >
                Annuler
              </button>
              <button
                onClick={emptyTrash}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition"
              >
                Vider
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}





