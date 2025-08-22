import mongoose from "mongoose";

const RecordTrackingSchema = new mongoose.Schema({
  id: { type: Number },
  module: { type: String, required: true },
  method: { type: String, enum: ["create", "update", "delete", "other"], default: "update" },
  userId: { type: String },
  userName: { type: String },
  modifiedAt: { type: Date, default: Date.now },
  changedFields: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { _id: false });

export default RecordTrackingSchema;
