import mongoose from "mongoose";
import RecordTrackingSchema from "./RecordTracking.model.js";

const AssignedEmployeeSchema = new mongoose.Schema(
  {
    employeeId: { type: String }, // uuid
    employeeName: { type: String },
    perHour: { type: Number, default: 0 },
    empHours: { type: Number, default: 0 },
    empAmount: { type: Number, default: 0 },
  },
  { _id: false }
);

const ProjectSchema = new mongoose.Schema({
  projectId: { type: String, required: true, unique: true }, // uuid
  job_name: { type: String, required: true },
  Pro_code: { type: mongoose.Schema.Types.Mixed, default: {} }, // store JSON as described
  managerId: { type: String }, // userId or employeeId
  assignedEmployeeIds: { type: [AssignedEmployeeSchema], default: [] },
  totalCost: { type: Number, default: 0 },
  totalHours: { type: Number, default: 0 },
  perHourCost: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["Open", "In-progress", "Completed"],
    default: "Open",
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  createdBy: { type: String },
  updatedBy: { type: String },
  recordTracking: { type: [RecordTrackingSchema], default: [] },
});

// once project completed employees cannot add timesheet — enforce in timesheet logic/controllers
ProjectSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model("Project", ProjectSchema);
