import Employee from "../Models/Employee.model.js";
import User from "../Models/User.model.js";
import { v4 as uuidv4 } from "uuid";

// export const createEmployee = async (req, res) => {
//   try {
//     const data = req.body;
//     const employee = new Employee({
//       ...data,
//       employeeId: uuidv4(),
//       createdBy: req.user?.userId
//     });
//     await employee.save();
//     res.status(201).json(employee);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };
// Controllers/employee.controller.js

export const createEmployee = async (req, res) => {
  try {
    const b = req.body || {};

    // normalize a bit
    const personalEmail = b.personalEmail?.trim().toLowerCase() || undefined;
    const companyEmail = b.companyEmail?.trim().toLowerCase() || undefined;
    const personalMobile = b.personalMobile?.trim() || undefined;
    const companyMobile = b.companyMobile?.trim() || undefined;
    const name = b.name?.trim();

    // pre-duplicate check (friendly message)
    const dup = await Employee.findOne({
      $or: [
        personalEmail ? { personalEmail } : null,
        companyEmail ? { companyEmail } : null,
        personalMobile ? { personalMobile } : null,
        companyMobile ? { companyMobile } : null,
        name && b.dateOfBirth ? { name, dateOfBirth: b.dateOfBirth } : null,
      ].filter(Boolean),
    });

    if (dup) {
      return res.status(409).json({
        message:
          "An employee with the same email, mobile number, or name and date of birth already exists.",
      });
    }

    const employee = await Employee.create({
      ...b,
      name,
      personalEmail,
      companyEmail,
      personalMobile,
      companyMobile,
      employeeId: uuidv4(),
      createdBy: req.user?.userId,
    });

    return res.status(201).json(employee);
  } catch (err) {
    // Handle unique index violation nicely
    if (err?.code === 11000) {
      // err.keyValue shows which field hit the duplicate
      const fields = Object.keys(err.keyValue || {}).join(", ");
      return res
        .status(409)
        .json({ message: `Duplicate value for: ${fields}` });
    }
    return res.status(500).json({ message: err.message });
  }
};

export const getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find();
    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getEmployeeById = async (req, res) => {
  try {
    const emp = await Employee.findOne({ employeeId: req.params.id });
    if (!emp) return res.status(404).json({ message: "Not found" });
    res.json(emp);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const emp = await Employee.findOneAndUpdate(
      { employeeId: req.params.id },
      { ...req.body, updatedBy: req.user?.userId, updatedAt: new Date() },
      { new: true }
    );
    if (!emp) return res.status(404).json({ message: "Not found" });
    res.json(emp);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    await Employee.findOneAndDelete({ employeeId: req.params.id });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Middleware/validateEmployee.js
export function validateEmployeeBody(req, res, next) {
  const b = req.body || {};
  const errs = [];

  const reqStr = (k, label = k) => {
    if (!b[k] || !String(b[k]).trim()) errs.push(`${label} is required`);
  };

  reqStr("name", "Name");

  // basic formats
  const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const phoneOk = (v) => /^[0-9+\-\s()]{7,20}$/.test(v);

  if (b.personalEmail && !emailOk(b.personalEmail))
    errs.push("Invalid personalEmail");
  if (b.companyEmail && !emailOk(b.companyEmail))
    errs.push("Invalid companyEmail");
  if (b.personalMobile && !phoneOk(b.personalMobile))
    errs.push("Invalid personalMobile");
  if (b.companyMobile && !phoneOk(b.companyMobile))
    errs.push("Invalid companyMobile");
  if (b.dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(b.dateOfBirth))
    errs.push("dateOfBirth must be YYYY-MM-DD");

  if (b.experienceYears != null && Number(b.experienceYears) < 0)
    errs.push("experienceYears cannot be negative");
  if (b.perHoursCharge != null && Number(b.perHoursCharge) < 0)
    errs.push("perHoursCharge cannot be negative");

  if (errs.length) return res.status(400).json({ message: errs.join(", ") });
  next();
}
