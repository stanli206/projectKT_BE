import Employee from "../Models/Employee.model.js";
import User from "../Models/User.model.js";
import { v4 as uuidv4 } from "uuid";


export const createEmployee = async (req, res) => {
  try {
    const data = req.body;
    const employee = new Employee({
      ...data,
      employeeId: uuidv4(),
      createdBy: req.user?.userId
    });
    await employee.save();
    res.status(201).json(employee);
  } catch (err) {
    res.status(500).json({ message: err.message });
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
