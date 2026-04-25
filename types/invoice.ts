// // types/invoice.ts
// export type InvoiceStatus = "paid" | "pending" | "overdue";

// export type InvoiceItem = {
//   qty: number;
//   description: string;
//   price: number;
//   unit?: "piece" | "kg" | "litre"; // optionnel partout
// };

// export type Invoice = {
//   id: string;
//   companyName: string; companyAddress: string; companyEmail?: string; companyPhone?: string;
//   clientName: string;  clientAddress: string;  clientEmail?: string;  clientPhone?: string;
//   invoiceNumber?: string; invoiceDate?: string; dueDate?: string;
//   currency?: string; tvaRate?: number; paymentMethod?: string; notes?: string; discount?: number;
//   items: InvoiceItem[];
//   totalHT: number; tva: number; totalTTC: number;
//   date: string; status: InvoiceStatus;
// };





// types/invoice.ts
export type InvoiceStatus = "paid" | "pending" | "overdue";
export type PaymentMethod = "virement" | "cheque" | "especes" | "carte";
export type Currency = "EUR" | "USD" | "GBP" | "MGA";

export type InvoiceItem = {
  qty: number;
  description: string;
  price: number;
  unit: "piece" | "kg" | "litre";
};

export type Invoice = {
  id: string;
  companyName: string;
  companyAddress: string;
  companyEmail?: string;
  companyPhone?: string;
  clientName: string;
  clientAddress: string;
  clientEmail?: string;
  clientPhone?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  currency?: string;
  tvaRate?: number;
  paymentMethod?: string;
  notes?: string;
  discount?: number;
  items: InvoiceItem[];
  totalHT: number;
  tva: number;
  totalTTC: number;
  date: string;
  status: InvoiceStatus;
};
