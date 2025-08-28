// import mongoose from "mongoose";
// import RecordTrackingSchema from "./RecordTracking.model.js";

// const EmployeeSchema = new mongoose.Schema({
//   employeeId: { type: String, required: true, unique: true }, // uuid string
//   name: { type: String, required: true },
//   personalEmail: { type: String },
//   dateOfBirth: { type: String }, // YYYY-MM-DD
//   address: { type: String },
//   designation: { type: String },
//   experienceYears: { type: Number, default: 0 },
//   bloodGroup: { type: String },
//   perHoursCharge: { type: Number, default: 0 }, // normalized field name
//   Em_category: { type: String },
//   personalMobile: { type: String },
//   companyEmail: { type: String },
//   companyMobile: { type: String },
//   createdAt: { type: Date, default: Date.now },
//   updatedAt: { type: Date, default: Date.now },
//   createdBy: { type: String },
//   updatedBy: { type: String },
//   recordTracking: { type: [RecordTrackingSchema], default: [] }
// });

// EmployeeSchema.pre("save", function (next) {
//   this.updatedAt = Date.now();
//   next();
// });

// export default mongoose.model("Employee", EmployeeSchema);
// Models/Employee.model.js
import mongoose from "mongoose";
import RecordTrackingSchema from "./RecordTracking.model.js";

const emailMatch = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneMatch = /^[0-9+\-\s()]{7,20}$/; // super simple

const EmployeeSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true }, // uuid
  name: { type: String, required: true, trim: true },

  personalEmail: {
    type: String,
    trim: true,
    lowercase: true,
    match: [emailMatch, "Invalid personal email"],
    unique: true,            // <- unique WHEN present (see index below)
    sparse: true             // <- allow null/empty duplicates
  },
  companyEmail: {
    type: String,
    trim: true,
    lowercase: true,
    match: [emailMatch, "Invalid company email"],
    unique: true,
    sparse: true
  },

  personalMobile: {
    type: String,
    trim: true,
    match: [phoneMatch, "Invalid mobile number"],
    unique: true,
    sparse: true
  },
  companyMobile: {
    type: String,
    trim: true,
    match: [phoneMatch, "Invalid company mobile"],
    unique: true,
    sparse: true
  },

  dateOfBirth: {
    type: String, // YYYY-MM-DD
    trim: true,
    match: [/^\d{4}-\d{2}-\d{2}$/, "DOB must be YYYY-MM-DD"]
  },
  address: { type: String, trim: true },

  designation: { type: String, trim: true },
  experienceYears: { type: Number, default: 0, min: 0, max: 80 },

  bloodGroup: {
    type: String,
    trim: true,
    enum: ["", "A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]
  },
  perHoursCharge: { type: Number, default: 0, min: 0 },

  Em_category: {
    type: String,
    trim: true,
    enum: ["", "FullTime", "PartTime", "Contract", "Intern"]
  },

  createdBy: { type: String },
  updatedBy: { type: String }
}, { timestamps: true });

// OPTIONAL: block duplicates by same name + DOB (both required to trigger)
EmployeeSchema.index(
  { name: 1, dateOfBirth: 1 },
  { unique: true, partialFilterExpression: { name: { $type: "string" }, dateOfBirth: { $type: "string" } } }
);

// keep updatedAt fresh on save
EmployeeSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model("Employee", EmployeeSchema);
