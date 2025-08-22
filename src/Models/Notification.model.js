import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
  notificationId: { type: String, required: true, unique: true }, // uuid
  to: { type: String, required: true },
  subject: { type: String },
  message: { type: String },
  module: { type: String },
  action: {
    type: String,
    enum: ["create", "update", "status_change", "delete", "other"],
    default: "create",
  },
  createdAt: { type: Date, default: Date.now },
  triggeredBy: { type: String },
  sent: { type: Boolean, default: false },
  meta: { type: mongoose.Schema.Types.Mixed }, // for storing attachments/links
});

export default mongoose.model("Notification", NotificationSchema);
