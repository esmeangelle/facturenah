//CreateInvoice.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Plus, Trash2, FileText, Download, Save,
  Building2, User, Hash, Calendar, AlertCircle,
  CheckCircle, ChevronDown, ChevronUp, Loader2, X,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { facturesAPI } from '@/lib/api';

type InvoiceItem = {
  qty: number;
  description: string;
  price: number;
  unit: "piece" | "kg" | "litre";
};

type PaymentMethod = "virement" | "cheque" | "especes" | "carte";
type Currency = "EUR" | "USD" | "GBP" | "MGA";

type InvoiceStatus = "paid" | "pending" | "overdue";
type Invoice = {
  id: string;
  companyName: string; companyAddress: string; companyEmail?: string; companyPhone?: string;
  clientName: string;  clientAddress: string;  clientEmail?: string;  clientPhone?: string;
  invoiceNumber?: string; invoiceDate?: string; dueDate?: string;
  currency?: string; tvaRate?: number; paymentMethod?: string; notes?: string; discount?: number;
  items: InvoiceItem[];
  totalHT: number; tva: number; totalTTC: number;
  date: string; status: InvoiceStatus;
};

const CURRENCIES: Record<Currency, string> = { EUR: "€", USD: "$", GBP: "£", MGA: "Ar" };
const TVA_RATES = [0, 5.5, 10, 20];

const UNITS: Record<InvoiceItem["unit"], { label: string; short: string }> = {
  piece:  { label: "Pièce",  short: "pce" },
  kg:     { label: "Kg",     short: "kg"  },
  litre:  { label: "Litre",  short: "L"   },
};

// ── Toast ──────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white text-sm font-medium
      ${type === "success" ? "bg-emerald-600" : "bg-red-600"}`} style={{ minWidth: 280 }}>
      {type === "success" ? <CheckCircle size={20} className="shrink-0" /> : <AlertCircle size={20} className="shrink-0" />}
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-70 transition"><X size={16} /></button>
    </div>
  );
}

function FieldError({ msg }: { msg: string }) {
  return (
    <p className="flex items-center gap-1 text-xs text-red-600 mt-1">
      <AlertCircle size={11} />{msg}
    </p>
  );
}

// ── Modale de confirmation ─────────────────────────────────────────────────
function ConfirmModal({ invoiceNumber, isEdit, countdown, onGoNow, onStay }: {
  invoiceNumber: string; isEdit: boolean; countdown: number;
  onGoNow: () => void; onStay: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center space-y-5">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
            <CheckCircle size={36} className="text-emerald-600" strokeWidth={2} />
          </div>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            {isEdit ? "Facture mise à jour !" : "Facture sauvegardée !"}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            <span className="font-semibold text-gray-700">{invoiceNumber}</span>
            {isEdit ? " a été modifiée avec succès." : " a été créée avec succès."}
          </p>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${((4 - countdown) / 4) * 100}%` }}
          />
        </div>
        <p className="text-xs text-gray-400">
          Retour à mes factures dans <strong className="text-gray-600">{countdown}s</strong>…
        </p>
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <button onClick={onGoNow}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-sm font-semibold transition shadow-sm">
            Voir mes factures
          </button>
          <button onClick={onStay}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-semibold transition">
            Rester ici
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Composant principal ────────────────────────────────────────────────────
export default function CreateInvoice({
  editInvoice,
  onSaved,  // ← appelé par Navbar via CreateInvoiceWrapper pour changer de page
}: {
  editInvoice?: Invoice | null;
  onSaved?: () => void;
}) {

  const [items, setItems] = useState<InvoiceItem[]>([
    { qty: 1, description: "", price: 0, unit: "piece" },
  ]);

  const [clientName, setClientName]         = useState("");
  const [clientAddress, setClientAddress]   = useState("");
  const [clientEmail, setClientEmail]       = useState("");
  const [clientPhone, setClientPhone]       = useState("");
  const [companyName, setCompanyName]       = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyEmail, setCompanyEmail]     = useState("");
  const [companyPhone, setCompanyPhone]     = useState("");

  const [invoiceNumber, setInvoiceNumber] = useState(
    "FAC-" + new Date().getFullYear() + "-" + String(Math.floor(Math.random() * 900) + 100)
  );
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().split("T")[0];
  });
  const [tvaRate, setTvaRate]             = useState<number>(20);
  const [currency, setCurrency]           = useState<Currency>("EUR");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("virement");
  const [notes, setNotes]                 = useState("");
  const [discount, setDiscount]           = useState<number>(0);

  const [submitted, setSubmitted]     = useState(false);
  const [isSaving, setIsSaving]       = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [countdown, setCountdown]               = useState(4);
  const [toast, setToast]                       = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Countdown → appelle onSaved() qui déclenche navigate("dashboard") dans Navbar
  useEffect(() => {
    if (!showConfirmModal) return;
    if (countdown <= 0) {
      setShowConfirmModal(false);
      onSaved?.();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [showConfirmModal, countdown, onSaved]);

  useEffect(() => {
    if (!editInvoice) return;
    setCompanyName(editInvoice.companyName ?? "");
    setCompanyAddress(editInvoice.companyAddress ?? "");
    setCompanyEmail(editInvoice.companyEmail ?? "");
    setCompanyPhone(editInvoice.companyPhone ?? "");
    setClientName(editInvoice.clientName ?? "");
    setClientAddress(editInvoice.clientAddress ?? "");
    setClientEmail(editInvoice.clientEmail ?? "");
    setClientPhone(editInvoice.clientPhone ?? "");
    setInvoiceNumber(editInvoice.invoiceNumber ?? editInvoice.id ?? "");
    setInvoiceDate(editInvoice.invoiceDate ?? new Date().toISOString().split("T")[0]);
    setDueDate(editInvoice.dueDate ?? "");
    setTvaRate(editInvoice.tvaRate ?? 20);
    setCurrency((editInvoice.currency as Currency) ?? "EUR");
    setPaymentMethod((editInvoice.paymentMethod as PaymentMethod) ?? "virement");
    setNotes(editInvoice.notes ?? "");
    setDiscount(editInvoice.discount ?? 0);
    const normalizedItems: InvoiceItem[] = (editInvoice.items ?? []).map((it) => ({
      qty: it.qty, description: it.description, price: it.price, unit: it.unit ?? "piece",
    }));
    setItems(normalizedItems.length > 0 ? normalizedItems : [{ qty: 1, description: "", price: 0, unit: "piece" }]);
    setSubmitted(false);
  }, [editInvoice]);

  const sym         = CURRENCIES[currency];
  const subtotal    = items.reduce((s, i) => s + i.qty * i.price, 0);
  const discountAmt = subtotal * (discount / 100);
  const totalHT     = subtotal - discountAmt;
  const tva         = totalHT * (tvaRate / 100);
  const totalTTC    = totalHT + tva;
  const totalWeight = items.filter((i) => i.unit === "kg").reduce((s, i) => s + i.qty, 0);
  const totalLitre  = items.filter((i) => i.unit === "litre").reduce((s, i) => s + i.qty, 0);

  const fmt = (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " " + sym;

  const addItem    = () => setItems([...items, { qty: 1, description: "", price: 0, unit: "piece" }]);
  const removeItem = (i: number) => items.length > 1 && setItems(items.filter((_, idx) => idx !== i));
  const updateItem = <K extends keyof InvoiceItem>(i: number, field: K, value: InvoiceItem[K]) => {
    const next = [...items]; next[i][field] = value; setItems(next);
  };

  const errors = {
    companyName:    submitted && !companyName.trim()    ? "Nom de l'entreprise requis" : "",
    companyAddress: submitted && !companyAddress.trim() ? "Adresse requise"            : "",
    clientName:     submitted && !clientName.trim()     ? "Nom du client requis"       : "",
    clientAddress:  submitted && !clientAddress.trim()  ? "Adresse client requise"     : "",
    invoiceDate:    submitted && !invoiceDate            ? "Date de facture requise"    : "",
    dueDate:        submitted && !dueDate                ? "Date d'échéance requise"    : "",
    items: submitted && items.some((it) => !it.description.trim())
      ? "Toutes les lignes doivent avoir une description" : "",
  };
  const isValid = !Object.values(errors).some(Boolean);

  const handleSave = async () => {
    setSubmitted(true);
    if (!isValid) {
      setToast({ message: "Veuillez corriger les erreurs avant de sauvegarder.", type: "error" });
      return;
    }
    setIsSaving(true);
    const invoice = {
      companyName, companyAddress, companyEmail, companyPhone,
      clientName, clientAddress, clientEmail, clientPhone,
      invoiceNumber, invoiceDate, dueDate,
      items, totalHT, tva, tvaRate, totalTTC, discount,
      currency, paymentMethod, notes,
      status: editInvoice?.status || 'pending',
    };
    try {
      if (editInvoice) {
        await facturesAPI.update(editInvoice.id, invoice);
      } else {
        await facturesAPI.create(invoice);
      }
      setCountdown(4);
      setShowConfirmModal(true);
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
      setToast({ message: "Une erreur est survenue lors de la sauvegarde.", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  // Bouton "Aller au tableau de bord" → appelle onSaved() immédiatement
  const handleGoNow = () => {
    setShowConfirmModal(false);
    onSaved?.();
  };

  // Bouton "Rester ici" → ferme la modale et stoppe le countdown
  const handleStay = () => {
    setShowConfirmModal(false);
    setCountdown(4);
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(220, 38, 38);
    doc.rect(0, 0, 210, 32, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold"); doc.setFontSize(20);
    doc.text(companyName || "Votre entreprise", 14, 14);
    doc.setFontSize(9); doc.setFont("helvetica", "normal");
    if (companyAddress) doc.text(companyAddress, 14, 21);
    if (companyEmail)   doc.text(companyEmail, 14, 27);
    doc.setFontSize(22); doc.setFont("helvetica", "bold");
    doc.text("FACTURE", 196, 14, { align: "right" });
    doc.setFontSize(9); doc.setFont("helvetica", "normal");
    doc.text(`N° ${invoiceNumber}`, 196, 21, { align: "right" });
    doc.text(`Date : ${new Date(invoiceDate).toLocaleDateString("fr-FR")}`, 196, 27, { align: "right" });
    doc.setTextColor(80, 80, 80); doc.setFontSize(9);
    doc.setFont("helvetica", "bold"); doc.text("FACTURÉ À", 14, 44);
    doc.setFont("helvetica", "normal");
    doc.text(clientName    || "—", 14, 50);
    doc.text(clientAddress || "—", 14, 56);
    if (clientEmail) doc.text(clientEmail, 14, 62);
    if (clientPhone) doc.text(clientPhone, 14, 68);
    doc.setFont("helvetica", "bold"); doc.text("ÉCHÉANCE", 140, 44);
    doc.setFont("helvetica", "normal");
    doc.text(dueDate ? new Date(dueDate).toLocaleDateString("fr-FR") : "—", 140, 50);
    doc.text(`Paiement : ${paymentMethod}`, 140, 56);
    autoTable(doc, {
      startY: 76,
      head: [["Description", "Unité", "Qté", `P.U. (${sym})`, `Total (${sym})`]],
      body: items.map((it) => [
        it.description, UNITS[it.unit].label,
        `${it.qty} ${UNITS[it.unit].short}`,
        it.price.toFixed(2), (it.qty * it.price).toFixed(2),
      ]),
      headStyles: { fillColor: [220, 38, 38], fontStyle: "bold", fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: { 1: { halign: "center" }, 2: { halign: "center" }, 3: { halign: "right" }, 4: { halign: "right", fontStyle: "bold" } },
    });
    const y = (doc as any).lastAutoTable.finalY + 8;
    if (totalWeight > 0 || totalLitre > 0) {
      doc.setFontSize(8); doc.setTextColor(100, 100, 100);
      let sumLine = "";
      if (totalWeight > 0) sumLine += `Poids total : ${totalWeight.toFixed(2)} kg   `;
      if (totalLitre > 0)  sumLine += `Volume total : ${totalLitre.toFixed(2)} L`;
      doc.text(sumLine.trim(), 14, y + 4);
    }
    doc.setFillColor(248, 248, 248);
    doc.roundedRect(120, y, 76, discount > 0 ? 36 : 28, 3, 3, "F");
    doc.setFontSize(9); doc.setTextColor(100, 100, 100);
    let row = y + 8;
    doc.text("Sous-total :", 126, row);
    doc.text(`${subtotal.toFixed(2)} ${sym}`, 192, row, { align: "right" });
    if (discount > 0) {
      row += 7; doc.setTextColor(220, 38, 38);
      doc.text(`Remise (${discount}%) :`, 126, row);
      doc.text(`-${discountAmt.toFixed(2)} ${sym}`, 192, row, { align: "right" });
      doc.setTextColor(100, 100, 100);
    }
    row += 7;
    doc.text(`TVA (${tvaRate}%) :`, 126, row);
    doc.text(`${tva.toFixed(2)} ${sym}`, 192, row, { align: "right" });
    row += 9;
    doc.setFillColor(5, 150, 105); doc.rect(120, row - 5, 76, 10, "F");
    doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(10);
    doc.text("TOTAL TTC :", 126, row + 2);
    doc.text(`${totalTTC.toFixed(2)} ${sym}`, 192, row + 2, { align: "right" });
    if (notes) {
      doc.setTextColor(100, 100, 100); doc.setFont("helvetica", "normal"); doc.setFontSize(8);
      doc.text("Notes :", 14, y + 14);
      doc.text(notes, 14, y + 20, { maxWidth: 100 });
    }
    const pageH = doc.internal.pageSize.height;
    doc.setFillColor(15, 15, 15); doc.rect(0, pageH - 10, 210, 10, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(7);
    doc.text("Généré par FacturePro", 105, pageH - 4, { align: "center" });
    doc.save(`${invoiceNumber}.pdf`);
  };

  const inputCls = (err?: string) =>
    `w-full border ${err ? "border-red-400 bg-red-50" : "border-gray-200"
    } rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition bg-white text-gray-900`;

  const unitLabel  = (item: InvoiceItem) => item.unit === "kg" ? "Poids (kg)" : item.unit === "litre" ? "Volume (L)" : "Quantité";
  const priceLabel = (item: InvoiceItem) => item.unit === "kg" ? `Prix / kg (${sym})` : item.unit === "litre" ? `Prix / L (${sym})` : `Prix unit. (${sym})`;

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {showConfirmModal && (
        <ConfirmModal
          invoiceNumber={invoiceNumber}
          isEdit={!!editInvoice}
          countdown={countdown}
          onGoNow={handleGoNow}
          onStay={handleStay}
        />
      )}

      <div className="space-y-6 sm:space-y-8">

        {/* ── Header ── */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-sm shrink-0">
            <FileText size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              {editInvoice ? `Modifier la facture ${editInvoice.id}` : "Créer une facture"}
            </h2>
            <p className="text-sm text-gray-400">
              {editInvoice ? "Modifiez les informations ci-dessous" : "Remplissez les informations ci-dessous"}
            </p>
          </div>
        </div>

        {/* ── Informations facture ── */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Hash size={16} className="text-red-600" />Informations de la facture
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">N° Facture</label>
              <input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)}
                className={`${inputCls()} border-l-4 border-l-red-600`} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Date de facture</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)}
                  className={`${inputCls(errors.invoiceDate)} pl-9`} />
              </div>
              {errors.invoiceDate && <FieldError msg={errors.invoiceDate} />}
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Date d'échéance</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                  className={`${inputCls(errors.dueDate)} pl-9`} />
              </div>
              {errors.dueDate && <FieldError msg={errors.dueDate} />}
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Devise</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} className={inputCls()}>
                {Object.entries(CURRENCIES).map(([k, v]) => <option key={k} value={k}>{k} ({v})</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* ── Émetteur + Client ── */}
        <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Building2 size={16} className="text-red-600" />Émetteur
            </h3>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Nom entreprise *</label>
              <input placeholder="Acme Studio" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                className={inputCls(errors.companyName)} />
              {errors.companyName && <FieldError msg={errors.companyName} />}
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Adresse *</label>
              <textarea placeholder="12 rue de la Paix, Antananarivo" value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)} rows={2}
                className={`${inputCls(errors.companyAddress)} resize-none`} />
              {errors.companyAddress && <FieldError msg={errors.companyAddress} />}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Email</label>
                <input type="email" placeholder="contact@entreprise.mg" value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)} className={inputCls()} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Téléphone</label>
                <input type="tel" placeholder="+261 34 00 000 00" value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)} className={inputCls()} />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <User size={16} className="text-red-600" />Client
            </h3>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Nom / Entreprise *</label>
              <input placeholder="Nom du client" value={clientName} onChange={(e) => setClientName(e.target.value)}
                className={inputCls(errors.clientName)} />
              {errors.clientName && <FieldError msg={errors.clientName} />}
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Adresse *</label>
              <textarea placeholder="Adresse du client" value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)} rows={2}
                className={`${inputCls(errors.clientAddress)} resize-none`} />
              {errors.clientAddress && <FieldError msg={errors.clientAddress} />}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Email</label>
                <input type="email" placeholder="client@email.mg" value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)} className={inputCls()} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Téléphone</label>
                <input type="tel" placeholder="+261 34 00 000 00" value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)} className={inputCls()} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Produits / Services ── */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-gray-900">Produits / Services</h3>
              <p className="text-xs text-gray-400 mt-0.5">Sélectionnez l'unité adaptée à chaque article</p>
            </div>
            <button onClick={addItem}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition shadow-sm">
              <Plus size={15} />Ajouter une ligne
            </button>
          </div>

          {errors.items && (
            <p className="text-xs text-red-600 flex items-center gap-1 mb-4"><AlertCircle size={11} />{errors.items}</p>
          )}

          <div className="hidden sm:grid grid-cols-12 gap-3 text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
            <span className="col-span-2">Unité</span>
            <span className="col-span-4">Description</span>
            <span className="col-span-2">Quantité</span>
            <span className="col-span-2">Prix unitaire</span>
            <span className="col-span-1 text-right">Total</span>
            <span className="col-span-1" />
          </div>

          <div className="space-y-2">
            {items.map((item, idx) => {
              const lineTotal = item.qty * item.price;
              return (
                <div key={idx}>
                  <div className="hidden sm:grid grid-cols-12 gap-3 items-center bg-gray-50 rounded-xl px-3 py-3 border border-gray-100 hover:border-gray-200 transition">
                    <div className="col-span-2">
                      <select value={item.unit} onChange={(e) => updateItem(idx, "unit", e.target.value as InvoiceItem["unit"])}
                        className="w-full border border-gray-200 bg-white rounded-lg px-2 py-1.5 text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer">
                        {Object.entries(UNITS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </div>
                    <input
                      placeholder={item.unit === "kg" ? "Ex : Riz blanc, Sucre, Farine..." : item.unit === "litre" ? "Ex : Huile, Eau, Lait..." : "Description du produit ou service"}
                      value={item.description} onChange={(e) => updateItem(idx, "description", e.target.value)}
                      className={`col-span-4 border ${submitted && !item.description.trim() ? "border-red-400 bg-red-50" : "border-gray-200 bg-white"} rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30`}
                    />
                    <div className="col-span-2 relative">
                      <input type="number" min={0.01} step={item.unit === "piece" ? 1 : 0.1} value={item.qty}
                        onChange={(e) => updateItem(idx, "qty", Number(e.target.value))}
                        className="w-full border border-gray-200 bg-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 pr-8" />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">{UNITS[item.unit].short}</span>
                    </div>
                    <div className="col-span-2 relative">
                      <input type="number" min={0} step={0.01} value={item.price}
                        onChange={(e) => updateItem(idx, "price", Number(e.target.value))}
                        className="w-full border border-gray-200 bg-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 pr-7" />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">{sym}</span>
                    </div>
                    <div className="col-span-1 text-right">
                      <p className="text-sm font-bold text-gray-900">{fmt(lineTotal)}</p>
                    </div>
                    <button onClick={() => removeItem(idx)} disabled={items.length === 1}
                      className="col-span-1 flex justify-center text-gray-300 hover:text-red-600 disabled:opacity-20 disabled:cursor-not-allowed transition p-1">
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="sm:hidden bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Ligne {idx + 1}</span>
                      <button onClick={() => removeItem(idx)} disabled={items.length === 1}
                        className="text-gray-300 hover:text-red-600 disabled:opacity-20 transition p-1"><Trash2 size={15} /></button>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Unité</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(Object.entries(UNITS) as [InvoiceItem["unit"], typeof UNITS[InvoiceItem["unit"]]][]).map(([k, v]) => (
                          <button key={k} onClick={() => updateItem(idx, "unit", k)}
                            className={`py-2 rounded-lg text-sm font-semibold border transition ${item.unit === k ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"}`}>
                            {v.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Description</label>
                      <input placeholder={item.unit === "kg" ? "Ex : Riz blanc, Sucre..." : item.unit === "litre" ? "Ex : Huile, Eau, Lait..." : "Description du produit..."}
                        value={item.description} onChange={(e) => updateItem(idx, "description", e.target.value)}
                        className={`w-full border ${submitted && !item.description.trim() ? "border-red-400 bg-red-50" : "border-gray-200 bg-white"} rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30`} />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">{unitLabel(item)}</label>
                        <div className="relative">
                          <input type="number" min={0.01} step={item.unit === "piece" ? 1 : 0.1} value={item.qty}
                            onChange={(e) => updateItem(idx, "qty", Number(e.target.value))}
                            className="w-full border border-gray-200 bg-white rounded-lg px-2 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500/30 pr-6" />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">{UNITS[item.unit].short}</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">{priceLabel(item)}</label>
                        <input type="number" min={0} step={0.01} value={item.price}
                          onChange={(e) => updateItem(idx, "price", Number(e.target.value))}
                          className="w-full border border-gray-200 bg-white rounded-lg px-2 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Total</label>
                        <div className="bg-white border border-gray-200 rounded-lg px-2 py-2.5 text-sm font-bold text-emerald-600 text-center">{fmt(lineTotal)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {(totalWeight > 0 || totalLitre > 0) && (
            <div className="mt-4 flex flex-wrap gap-3">
              {totalWeight > 0 && (
                <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-4 py-2.5 text-sm text-gray-600">
                  <span className="font-medium">Poids total :</span>
                  <span className="font-bold text-gray-900">{totalWeight.toFixed(2)} kg</span>
                </div>
              )}
              {totalLitre > 0 && (
                <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-4 py-2.5 text-sm text-gray-600">
                  <span className="font-medium">Volume total :</span>
                  <span className="font-bold text-gray-900">{totalLitre.toFixed(2)} L</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Totaux + Options ── */}
        <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-900">Options de paiement</h3>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Mode de paiement</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} className={inputCls()}>
                <option value="virement">Virement bancaire</option>
                <option value="cheque">Chèque</option>
                <option value="especes">Espèces</option>
                <option value="carte">Carte bancaire</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">TVA</label>
              <select value={tvaRate} onChange={(e) => setTvaRate(Number(e.target.value))} className={inputCls()}>
                {TVA_RATES.map((r) => <option key={r} value={r}>{r === 0 ? "Exonéré (0%)" : `${r}%`}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Remise globale</label>
              <div className="relative">
                <input type="number" min={0} max={100} value={discount}
                  onChange={(e) => setDiscount(Math.min(100, Math.max(0, Number(e.target.value))))}
                  className={`${inputCls()} pr-7`} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Notes / Conditions</label>
              <textarea placeholder="Conditions de paiement, IBAN pour virement..." value={notes}
                onChange={(e) => setNotes(e.target.value)} rows={4} className={`${inputCls()} resize-none`} />
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col">
            <h3 className="font-semibold text-gray-900 mb-4">Résumé des totaux</h3>
            <div className="space-y-3 flex-1">
              <div className="flex justify-between text-sm text-gray-600"><span>Sous-total</span><span>{fmt(subtotal)}</span></div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-red-600"><span>Remise ({discount}%)</span><span>−{fmt(discountAmt)}</span></div>
              )}
              <div className="flex justify-between text-sm text-gray-600"><span>Total HT</span><span>{fmt(totalHT)}</span></div>
              <div className="flex justify-between text-sm text-gray-600"><span>TVA ({tvaRate}%)</span><span>{fmt(tva)}</span></div>
              <div className="h-px bg-gray-100" />
              <div className="flex justify-between font-bold text-lg text-emerald-600"><span>Total TTC</span><span>{fmt(totalTTC)}</span></div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400 space-y-1.5">
              <div className="flex justify-between"><span>Mode de paiement</span><span className="capitalize font-medium text-gray-700">{paymentMethod}</span></div>
              <div className="flex justify-between"><span>Échéance</span><span className="font-medium text-gray-700">{dueDate ? new Date(dueDate).toLocaleDateString("fr-FR") : "—"}</span></div>
              {totalWeight > 0 && <div className="flex justify-between"><span>Poids total</span><span className="font-medium text-gray-700">{totalWeight.toFixed(2)} kg</span></div>}
              {totalLitre > 0  && <div className="flex justify-between"><span>Volume total</span><span className="font-medium text-gray-700">{totalLitre.toFixed(2)} L</span></div>}
            </div>
          </div>
        </div>

        {/* ── Aperçu ── */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <button onClick={() => setShowPreview(!showPreview)}
            className="w-full flex items-center justify-between p-5 sm:p-6 hover:bg-gray-50 transition">
            <div>
              <h3 className="font-semibold text-gray-900 text-left">Aperçu de la facture</h3>
              <p className="text-xs text-gray-400 mt-0.5 text-left">Vérifiez votre facture avant de sauvegarder</p>
            </div>
            {showPreview ? <ChevronUp size={18} className="text-gray-400 shrink-0" /> : <ChevronDown size={18} className="text-gray-400 shrink-0" />}
          </button>
          {showPreview && (
            <div className="px-5 sm:px-8 pb-8 border-t border-gray-100">
              <div className="max-w-2xl mx-auto pt-6">
                <div className="flex flex-col sm:flex-row justify-between gap-4 mb-8">
                  <div>
                    <p className="font-bold text-red-600 text-xl">{companyName || "Votre entreprise"}</p>
                    <p className="text-sm text-gray-500 mt-1 whitespace-pre-line">{companyAddress}</p>
                    {companyEmail && <p className="text-sm text-gray-400">{companyEmail}</p>}
                    {companyPhone && <p className="text-sm text-gray-400">{companyPhone}</p>}
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="font-bold text-gray-900 text-lg">FACTURE</p>
                    <p className="text-sm text-gray-500">N° {invoiceNumber}</p>
                    <p className="text-sm text-gray-400">{invoiceDate ? new Date(invoiceDate).toLocaleDateString("fr-FR") : "—"}</p>
                    {dueDate && <p className="text-xs text-gray-400 mt-1">Échéance : {new Date(dueDate).toLocaleDateString("fr-FR")}</p>}
                  </div>
                </div>
                <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Facturé à</p>
                  <p className="font-semibold text-gray-900">{clientName || "—"}</p>
                  <p className="text-sm text-gray-500 whitespace-pre-line">{clientAddress}</p>
                  {clientEmail && <p className="text-sm text-gray-400">{clientEmail}</p>}
                  {clientPhone && <p className="text-sm text-gray-400">{clientPhone}</p>}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm mb-4 min-w-105">
                    <thead>
                      <tr className="bg-red-600 text-white text-xs">
                        <th className="py-2.5 px-3 text-left font-semibold rounded-tl-lg">Description</th>
                        <th className="py-2.5 px-3 text-center font-semibold">Unité</th>
                        <th className="py-2.5 px-3 text-center font-semibold">Qté</th>
                        <th className="py-2.5 px-3 text-right font-semibold">P.U.</th>
                        <th className="py-2.5 px-3 text-right font-semibold rounded-tr-lg">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, i) => (
                        <tr key={i} className={`border-b border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                          <td className="py-2.5 px-3 text-gray-800">{item.description || <span className="text-gray-300 italic">—</span>}</td>
                          <td className="py-2.5 px-3 text-center text-xs text-gray-500 font-medium">{UNITS[item.unit].label}</td>
                          <td className="py-2.5 px-3 text-center text-gray-600">{item.qty} {UNITS[item.unit].short}</td>
                          <td className="py-2.5 px-3 text-right text-gray-600">{fmt(item.price)}</td>
                          <td className="py-2.5 px-3 text-right font-semibold text-gray-900">{fmt(item.qty * item.price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {(totalWeight > 0 || totalLitre > 0) && (
                  <div className="flex flex-wrap gap-3 mb-4 text-xs text-gray-500">
                    {totalWeight > 0 && <span>Poids total : <strong className="text-gray-900">{totalWeight.toFixed(2)} kg</strong></span>}
                    {totalLitre > 0  && <span>Volume total : <strong className="text-gray-900">{totalLitre.toFixed(2)} L</strong></span>}
                  </div>
                )}
                <div className="flex flex-col sm:flex-row justify-between gap-6">
                  {notes && (
                    <div className="flex-1 text-xs text-gray-400 bg-gray-50 rounded-xl p-3">
                      <p className="font-semibold text-gray-500 mb-1">Notes</p>
                      <p className="whitespace-pre-line">{notes}</p>
                    </div>
                  )}
                  <div className="sm:w-56 space-y-2 text-sm">
                    <div className="flex justify-between text-gray-500"><span>Sous-total</span><span>{fmt(subtotal)}</span></div>
                    {discount > 0 && <div className="flex justify-between text-red-600"><span>Remise ({discount}%)</span><span>−{fmt(discountAmt)}</span></div>}
                    <div className="flex justify-between text-gray-500"><span>TVA {tvaRate}%</span><span>{fmt(tva)}</span></div>
                    <div className="flex justify-between font-bold text-white text-base bg-gray-900 rounded-lg px-3 py-2 mt-1">
                      <span>Total TTC</span><span>{fmt(totalTTC)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Actions ── */}
        <div className="flex flex-col sm:flex-row gap-3 pb-4">
          <button onClick={handleSave} disabled={isSaving}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold text-sm shadow-sm transition w-full sm:w-auto">
            {isSaving
              ? <><Loader2 size={17} className="animate-spin" />Sauvegarde en cours…</>
              : <><Save size={17} />{editInvoice ? "Mettre à jour" : "Sauvegarder"}</>
            }
          </button>
          <button onClick={handleDownloadPDF}
            className="flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-semibold text-sm shadow-sm transition w-full sm:w-auto">
            <Download size={17} />Télécharger PDF
          </button>
        </div>

      </div>
    </>
  );
}
