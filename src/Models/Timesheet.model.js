import mongoose from "mongoose";
import RecordTrackingSchema from "./RecordTracking.model.js";

const TimesheetSchema = new mongoose.Schema({
  timesheetId: { type: String, required: true, unique: true }, // uuid
  projectId: { type: String, required: true },
  Project_name: { type: String },
  Project_code: { type: String },
  employeeId: { type: String, required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  hours: { type: Number, default: 0 },
  weekStart: { type: String }, // YYYY-MM-DD
  status: { type: String, enum: ["Open", "InProgress", "Submitted", "Approved", "Rejected"], default: "Open" },
  totalWeekHours: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  createdBy: { type: String },
  updatedBy: { type: String },
  recordTracking: { type: [RecordTrackingSchema], default: [] }
});

TimesheetSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model("Timesheet", TimesheetSchema);
