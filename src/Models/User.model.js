import mongoose from "mongoose";
import RecordTrackingSchema from "./RecordTracking.model.js";

const UserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true }, // uuid
  userName: { type: String, required: true },
  employeeId: { type: String }, // link to employee.employeeId
  role: {
    type: String,
    enum: ["Admin", "Principal", "Employee"],
    default: "Employee",
  },
  passwordHash: { type: String, required: true },
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  createdBy: { type: String },
  updatedBy: { type: String },
  recordTracking: { type: [RecordTrackingSchema], default: [] },
});

UserSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model("User", UserSchema);
