import mongoose from "mongoose";
import RecordTrackingSchema from "./RecordTracking.model.js";

const CustomerSchema = new mongoose.Schema({
  Customer_id: { type: String, required: true, unique: true }, // uuid
  Cust_name: { type: String, required: true },
  Cust_code: { type: String, required: true, unique: true }, // e.g., 0001
  Cust_address: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  createdBy: { type: String },
  updatedBy: { type: String },
  recordTracking: { type: [RecordTrackingSchema], default: [] }
});

CustomerSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model("Customer", CustomerSchema);
