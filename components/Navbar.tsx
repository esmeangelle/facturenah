"use client";

import { useState, useEffect } from "react";
import {
  LayoutDashboard, ScrollText, LogOut,
  X, Menu, SmilePlus, Trash2,
} from "lucide-react";
import Dashboard from "@/components/Dashboard";
import CreateInvoice from "@/components/CreateInvoice";
import MyInvoices from "@/components/MyInvoices";
import TrashPage from "@/components/Trash";
import { motion, AnimatePresence } from "framer-motion";
import { logout, getUser } from "@/lib/auth";

type InvoiceStatus = "paid" | "pending" | "overdue";
type InvoiceItem = { qty: number; description: string; price: number; unit?: "piece" | "kg" | "litre" };
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

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState("dashboard");
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [user, setUser] = useState<{ prenom: string; nom: string; email: string } | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  const menuItems = [
    { label: "Tableau de bord",   icon: <LayoutDashboard size={17} />, key: "dashboard" },
    { label: "Créer une facture", icon: <SmilePlus size={17} />,       key: "create"    },
    { label: "Mes factures",      icon: <ScrollText size={17} />,      key: "invoices"  },
    { label: "Corbeille",         icon: <Trash2 size={17} />,          key: "trash"     },
    { label: "Déconnexion",       icon: <LogOut size={17} />,          key: "logout"    },
  ];

  const navigate = (key: string) => {
    if (key === "logout") { logout(); return; }
    if (key !== "create") setEditInvoice(null);
    setPage(key);
    setOpen(false);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditInvoice(invoice);
    setPage("create");
    setOpen(false);
  };

  // ← Après sauvegarde, on redirige vers Mes factures
  const handleSaved = () => {
    setEditInvoice(null);
    setPage("invoices");
  };

  const renderPage = () => {
    if (page === "dashboard") return (
      <Dashboard
        onCreateNew={() => navigate("create")}
        onEditInvoice={handleEditInvoice}
      />
    );
    if (page === "create") return (
      <CreateInvoice
        editInvoice={editInvoice}
        onSaved={handleSaved}  
      />
    );
    if (page === "invoices") return <MyInvoices />;
    if (page === "trash")    return <TrashPage />;
  };

  const initiales = user ? `${user.prenom[0]}${user.nom[0]}`.toUpperCase() : "U";
  const nomComplet = user ? `${user.prenom} ${user.nom}` : "...";

  return (
    <>
      {/* NAVBAR FIXE */}
      <nav className="fixed top-0 w-full z-50 border-b border-gray-100 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-1 flex justify-between items-center">

          <button onClick={() => navigate("dashboard")} className="flex items-center group">
            <img
              src="/logo.jpeg"
              alt="Facturenah"
              className="h-18 w-auto object-contain"
              style={{ mixBlendMode: "multiply" }}
            />
          </button>

          {/* Desktop menu */}
          <div className="hidden xl:flex items-center gap-1">
            {menuItems.map((item) => {
              const isActive = page === item.key;
              const isLogout = item.key === "logout";
              const isTrash  = item.key === "trash";
              return (
                <button
                  key={item.key}
                  onClick={() => navigate(item.key)}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isLogout
                      ? "text-red-500 hover:bg-red-50 ml-2"
                      : isTrash && !isActive
                      ? "text-gray-500 hover:text-red-500 hover:bg-red-50"
                      : isActive
                      ? isTrash ? "text-red-600 bg-red-50" : "text-emerald-600 bg-emerald-50"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {item.icon}
                  {item.label}
                  {isActive && !isLogout && (
                    <motion.span
                      layoutId="nav-pill"
                      className={`absolute inset-0 rounded-xl -z-10 ${isTrash ? "bg-red-50" : "bg-emerald-50"}`}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}

            <div className="flex items-center gap-2.5 ml-3 pl-3 border-l border-gray-200">
              <div className="w-8 h-8 rounded-full bg-linear-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {initiales}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 leading-tight truncate">{nomComplet}</p>
                <p className="text-xs text-gray-400 truncate">{user ? user.email : ""}</p>
              </div>
            </div>
          </div>

          {/* Burger */}
          <button className="xl:hidden p-2 rounded-xl hover:bg-gray-100 transition text-gray-600" onClick={() => setOpen(true)}>
            <Menu size={24} />
          </button>
        </div>
      </nav>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 flex flex-col"
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              drag="x" dragConstraints={{ left: 0, right: 1000 }} dragElastic={0.2}
              onDragEnd={(_, info) => { if (info.offset.x > 50) setOpen(false); }}
            >
              <div className="flex items-center justify-between px-5 py-2 border-b border-gray-100">
                <button onClick={() => navigate("dashboard")}>
                  <img src="/logo.jpeg" alt="Facturenah" className="h-18 w-auto object-contain" style={{ mixBlendMode: "multiply" }} />
                </button>
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-400">
                  <X size={20} />
                </button>
              </div>

              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                  const isActive = page === item.key;
                  const isLogout = item.key === "logout";
                  const isTrash  = item.key === "trash";
                  return (
                    <button key={item.key} onClick={() => navigate(item.key)}
                      className={`relative flex items-center gap-3 px-4 py-3.5 w-full rounded-xl text-sm font-medium transition-all ${
                        isLogout
                          ? "text-red-500 hover:bg-red-50 mt-2"
                          : isTrash && !isActive
                          ? "text-gray-600 hover:text-red-500 hover:bg-red-50"
                          : isActive
                          ? isTrash ? "text-red-600 bg-red-50" : "text-emerald-600 bg-emerald-50"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}>
                      {item.icon}
                      <span>{item.label}</span>
                      {isActive && !isLogout && (
                        <motion.span
                          layoutId="drawer-pill"
                          className={`absolute inset-0 rounded-xl -z-10 ${isTrash ? "bg-red-50" : "bg-emerald-50"}`}
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                    </button>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-gray-100">
                <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gray-50">
                  <div className="w-9 h-9 rounded-full bg-linear-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {initiales}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{nomComplet}</p>
                    <p className="text-xs text-gray-400 truncate">{user ? user.email : ""}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* CONTENU PAGE */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 mt-20">
        {renderPage()}
      </div>
    </>
  );
}
