import jsPDF from "jspdf";

export interface ReceiptBooking {
  id: string;
  guest_name?: string | null;
  guest_phone?: string | null;
  guest_email?: string | null;
  check_in?: string | null;
  check_out?: string | null;
  guests?: number | null;
  rooms?: number | null;
  subtotal?: number | null;
  taxes?: number | null;
  service_fee?: number | null;
  total?: number | null;
  payment_method?: string | null;
  payment_reference?: string | null;
  checked_in_at?: string | null;
  checked_out_at?: string | null;
  room_number?: string | null;
}

const money = (n: any) => `$${Number(n || 0).toFixed(2)}`;

/** Builds and downloads a front-desk PDF receipt for a hotel stay. */
export function downloadReceiptPdf(b: ReceiptBooking, hotelName = "Hotel") {
  const doc = new jsPDF({ unit: "pt", format: "a5" });
  const W = doc.internal.pageSize.getWidth();
  let y = 44;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(hotelName, W / 2, y, { align: "center" });
  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Payment receipt", W / 2, y, { align: "center" });
  y += 14;
  doc.setFontSize(8);
  doc.text(`Receipt #${b.id.slice(0, 8).toUpperCase()}  ·  ${new Date().toLocaleString()}`, W / 2, y, { align: "center" });
  y += 16;
  doc.setDrawColor(200);
  doc.line(32, y, W - 32, y);
  y += 18;

  const row = (label: string, value: string, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 11 : 10);
    doc.text(label, 32, y);
    doc.text(value, W - 32, y, { align: "right" });
    y += bold ? 18 : 15;
  };

  row("Guest", b.guest_name || "—");
  if (b.guest_phone) row("Phone", b.guest_phone);
  if (b.room_number) row("Room number", b.room_number);
  row("Stay", `${b.check_in || "—"}  ->  ${b.check_out || "—"}`);
  row("Guests / rooms", `${b.guests ?? 1} / ${b.rooms ?? 1}`);
  row("Checked in", b.checked_in_at ? new Date(b.checked_in_at).toLocaleString() : "—");
  row("Checked out", b.checked_out_at ? new Date(b.checked_out_at).toLocaleString() : "—");

  y += 6;
  doc.line(32, y, W - 32, y);
  y += 18;

  row("Subtotal", money(b.subtotal));
  row("Taxes", money(b.taxes));
  row("Service fee", money(b.service_fee));
  y += 2;
  doc.line(32, y, W - 32, y);
  y += 18;
  row("Total", money(b.total), true);
  row("Payment method", String(b.payment_method || "—").replace(/_/g, " "));
  if (b.payment_reference) row("Reference", b.payment_reference);

  y += 12;
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text("Thank you for staying with us.", W / 2, y, { align: "center" });

  doc.save(`receipt-${b.id.slice(0, 8)}.pdf`);
}
