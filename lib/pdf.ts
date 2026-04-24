import jsPDF from "jspdf";

export function generateInvoicePDF(invoice: any) {

  const doc = new jsPDF();

  doc.text("Facture", 20, 20);

  doc.text(`Client: ${invoice.client}`, 20, 40);

  doc.text(`Montant: ${invoice.amount} €`, 20, 50);

  doc.save("facture.pdf");
}