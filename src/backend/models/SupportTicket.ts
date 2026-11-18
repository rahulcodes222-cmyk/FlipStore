import mongoose, { Schema, Model, Document } from "mongoose";

export interface ISupportTicketDocument extends Document {
  sellerId: mongoose.Types.ObjectId;
  sellerName: string;
  sellerEmail?: string;
  storeName?: string;
  subject: string;
  message: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH";
  createdAt: Date;
  updatedAt: Date;
}

const supportTicketSchema = new Schema<ISupportTicketDocument>(
  {
    sellerId: { type: Schema.Types.ObjectId as any, ref: "User", required: true, index: true },
    sellerName: { type: String, required: true, trim: true },
    sellerEmail: { type: String, trim: true },
    storeName: { type: String, trim: true },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    status: {
      type: String,
      enum: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"],
      default: "OPEN",
      index: true,
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      default: "MEDIUM",
      index: true,
    },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

supportTicketSchema.index({ createdAt: -1 });
supportTicketSchema.index({ sellerId: 1, createdAt: -1 });

const SupportTicketModel: Model<ISupportTicketDocument> =
  (mongoose.models.SupportTicket as Model<ISupportTicketDocument> | undefined) ||
  mongoose.model<ISupportTicketDocument>("SupportTicket", supportTicketSchema);

export default SupportTicketModel;
export { SupportTicketModel };
