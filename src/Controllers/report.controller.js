import Project from "../Models/Project.model.js";
import Timesheet from "../Models/Timesheet.model.js";

export const reportByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.query;
    const timesheets = await Timesheet.find({ employeeId });
    const projects = await Project.find({ "assignedEmployeeIds.employeeId": employeeId });
    res.json({ projectsCount: projects.length, timesheetsCount: timesheets.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const reportByProject = async (req, res) => {
  try {
    const { projectId } = req.query;
    const project = await Project.findOne({ projectId });
    res.json({ employees: project.assignedEmployeeIds.length, totalCost: project.totalCost });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const monthlyReport = async (req, res) => {
  try {
    const { month } = req.query;
    const regex = new RegExp(`^${month}`);
    const list = await Timesheet.find({ date: regex });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
