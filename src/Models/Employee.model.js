import mongoose from "mongoose";
import RecordTrackingSchema from "./RecordTracking.model.js";

const EmployeeSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true }, // uuid string
  name: { type: String, required: true },
  personalEmail: { type: String },
  dateOfBirth: { type: String }, // YYYY-MM-DD
  address: { type: String },
  designation: { type: String },
  experienceYears: { type: Number, default: 0 },
  bloodGroup: { type: String },
  perHoursCharge: { type: Number, default: 0 }, // normalized field name
  Em_category: { type: String },
  personalMobile: { type: String },
  companyEmail: { type: String },
  companyMobile: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  createdBy: { type: String },
  updatedBy: { type: String },
  recordTracking: { type: [RecordTrackingSchema], default: [] }
});

EmployeeSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model("Employee", EmployeeSchema);
