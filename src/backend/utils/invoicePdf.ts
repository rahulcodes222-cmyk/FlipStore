export interface InvoicePdfData {
  invoiceNumber: string;
  issuedAt?: string | Date;
  orderNumber: string;
  orderId?: string;
  customer?: { name?: string; email?: string; phone?: string };
  shippingAddress?: any;
  paymentMethod?: string;
  paymentStatus?: string;
  items?: any[];
  pricing?: any;
  placedAt?: string | Date;
}

function esc(text: string): string {
  return String(text ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/\r?\n/g, " ");
}

function fmtDate(d?: string | Date): string {
  if (!d) return "-";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return String(d);
  return dt.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function money(n: any): string {
  const v = Number(n || 0);
  return `Rs. ${v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function renderInvoicePdf(data: InvoicePdfData): Buffer {
  const lines: string[] = [];
  const addr = data.shippingAddress || {};
  const customer = data.customer || {};
  const pricing = data.pricing || {};
  const items = Array.isArray(data.items) ? data.items : [];

  lines.push("INVOICE");
  lines.push(`Invoice No: ${data.invoiceNumber || "-"}`);
  lines.push(`Order No: ${data.orderNumber || "-"}`);
  lines.push(`Issued: ${fmtDate(data.issuedAt || data.placedAt)}`);
  lines.push("");
  lines.push("Bill To:");
  if (customer.name) lines.push(String(customer.name));
  if (customer.email) lines.push(String(customer.email));
  if (customer.phone) lines.push(String(customer.phone));
  const addrLine1 = [addr.street, addr.locality].filter(Boolean).join(", ");
  const addrLine2 = [addr.city, addr.state, addr.pincode].filter(Boolean).join(", ");
  if (addr.name && addr.name !== customer.name) lines.push(String(addr.name));
  if (addrLine1) lines.push(addrLine1);
  if (addrLine2) lines.push(addrLine2);
  if (addr.phone && addr.phone !== customer.phone) lines.push(`Phone: ${addr.phone}`);
  lines.push("");
  lines.push(`Payment Method: ${String(data.paymentMethod || "-")}`);
  lines.push(`Payment Status: ${String(data.paymentStatus || "-")}`);
  lines.push("");
  lines.push("Items:");
  lines.push("------------------------------------------------------------");
  if (items.length === 0) {
    lines.push("No items");
  } else {
    items.forEach((it: any, idx: number) => {
      const title = String(it?.title || it?.name || "Item");
      const qty = Number(it?.quantity || 1);
      const price = Number(it?.price || 0);
      const total = price * qty;
      lines.push(`${idx + 1}. ${title}`);
      lines.push(`   Qty: ${qty}    Price: ${money(price)}    Total: ${money(total)}`);
    });
  }
  lines.push("------------------------------------------------------------");
  if (pricing.totalMrp != null) lines.push(`Subtotal (MRP): ${money(pricing.totalMrp)}`);
  if (pricing.discount != null) lines.push(`Discount: -${money(pricing.discount)}`);
  if (pricing.couponDiscount != null && Number(pricing.couponDiscount) > 0) lines.push(`Coupon Discount: -${money(pricing.couponDiscount)}`);
  if (pricing.deliveryCharges != null) lines.push(`Delivery Charges: ${money(pricing.deliveryCharges)}`);
  lines.push(`Total Amount: ${money(pricing.totalAmount)}`);
  lines.push("");
  lines.push("Thank you for your order.");

  // Simple single-page PDF builder
  const pageWidth = 595.28; // A4
  const pageHeight = 841.89;
  const left = 50;
  const top = 790;
  const fontSize = 10;
  const leading = 14;
  const maxLines = Math.floor((top - 50) / leading);
  const contentLines = lines.slice(0, maxLines);

  let textStream = "BT\n/F1 16 Tf\n";
  textStream += `${left} ${top} Td\n(${esc("Invoice")}) Tj\n`;
  textStream += "ET\nBT\n/F1 10 Tf\n";
  let y = top - 24;
  for (let i = 1; i < contentLines.length; i++) {
    const line = contentLines[i];
    textStream += `1 0 0 1 ${left} ${y.toFixed(2)} Tm\n(${esc(line)}) Tj\n`;
    y -= leading;
    if (y < 50) break;
  }
  textStream += "ET\n";

  const objects: string[] = [];
  objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  objects.push("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
  objects.push(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`);
  objects.push("4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n");
  objects.push(`5 0 obj\n<< /Length ${Buffer.byteLength(textStream, "utf8")} >>\nstream\n${textStream}endstream\nendobj\n`);

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += obj;
  }
  const xrefStart = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(pdf, "utf8");
}
