import mongoose from "mongoose";
import SupportTicketModel from "@/backend/models/SupportTicket";
import { VendorModel } from "@/backend/models";

function toDto(doc: any) {
  return {
    id: String(doc?._id || doc?.id || ""),
    sellerId: String(doc?.sellerId?._id || doc?.sellerId || ""),
    sellerName: String(doc?.sellerName || ""),
    sellerEmail: doc?.sellerEmail ? String(doc.sellerEmail) : undefined,
    storeName: doc?.storeName ? String(doc.storeName) : undefined,
    subject: String(doc?.subject || ""),
    message: String(doc?.message || ""),
    status: String(doc?.status || "OPEN"),
    priority: String(doc?.priority || "MEDIUM"),
    createdAt: doc?.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: doc?.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString(),
  };
}

export async function createSellerSupportTicket(params: {
  sellerId: string;
  sellerName?: string;
  sellerEmail?: string;
  subject: string;
  message: string;
  priority?: "LOW" | "MEDIUM" | "HIGH";
}) {
  if (!mongoose.isValidObjectId(params.sellerId)) throw new Error("Invalid seller.");
  const subject = String(params.subject || "").trim();
  const message = String(params.message || "").trim();
  if (subject.length < 3) throw new Error("Subject must be at least 3 characters.");
  if (message.length < 10) throw new Error("Message must be at least 10 characters.");

  let storeName: string | undefined;
  try {
    const vendor: any = await VendorModel.findOne({ userId: params.sellerId }).select("businessName storeName").lean().exec();
    storeName = String(vendor?.businessName || vendor?.storeName || "").trim() || undefined;
  } catch {}

  const created = await SupportTicketModel.create({
    sellerId: new mongoose.Types.ObjectId(params.sellerId),
    sellerName: String(params.sellerName || "Seller").trim() || "Seller",
    sellerEmail: params.sellerEmail ? String(params.sellerEmail).trim() : undefined,
    storeName,
    subject,
    message,
    priority: params.priority || "MEDIUM",
    status: "OPEN",
  } as any);

  return toDto(typeof (created as any)?.toObject === "function" ? (created as any).toObject() : created);
}

export async function listSellerSupportTickets(sellerId: string) {
  if (!mongoose.isValidObjectId(sellerId)) return [];
  const docs = await SupportTicketModel.find({ sellerId }).sort({ createdAt: -1 }).limit(100).lean().exec();
  return docs.map(toDto);
}

export async function listAdminSupportTickets(params?: { status?: string; search?: string }) {
  const filter: Record<string, any> = {};
  if (params?.status && ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].includes(String(params.status).toUpperCase())) {
    filter.status = String(params.status).toUpperCase();
  }
  const search = String(params?.search || "").trim();
  if (search) {
    const esc = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(esc, "i");
    filter.$or = [{ subject: re }, { message: re }, { sellerName: re }, { sellerEmail: re }, { storeName: re }];
  }
  const docs = await SupportTicketModel.find(filter).sort({ createdAt: -1 }).limit(300).lean().exec();
  return docs.map(toDto);
}

export async function updateAdminSupportTicketStatus(id: string, status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED") {
  if (!mongoose.isValidObjectId(id)) throw new Error("Invalid ticket id.");
  const doc = await SupportTicketModel.findByIdAndUpdate(id, { $set: { status } }, { new: true }).lean().exec();
  if (!doc) throw new Error("Ticket not found.");
  return toDto(doc);
}
