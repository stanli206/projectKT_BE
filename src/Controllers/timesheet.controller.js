import Timesheet from "../Models/Timesheet.model.js";
import Project from "../Models/Project.model.js";
import { v4 as uuidv4 } from "uuid";

export const createTimesheet = async (req, res) => {
  try {
    const { projectId, date, hours } = req.body;

    // check project status
    const project = await Project.findOne({ projectId });
    if (!project || project.status === "Completed") {
      return res
        .status(400)
        .json({ message: "Project closed, cannot add timesheet" });
    }

    if (hours > 24)
      return res
        .status(400)
        .json({ message: "Cannot log more than 24 hours/day" });

    const ts = new Timesheet({
      timesheetId: uuidv4(),
      projectId,
      Project_name: project.job_name,
      Project_code: project.Pro_code.code,
      employeeId: req.user.userId,
      date,
      hours,
      status: "Submitted",
      createdBy: req.user.userId,
    });
    await ts.save();
    res.status(201).json(ts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const updateTimesheet = async (req, res) => {
  try {
    const { id } = req.params;
    const ts = await Timesheet.findOne({ timesheetId: id });
    if (!ts) return res.status(404).json({ message: "Not found" });

    // allow if Admin OR owner employee
    const isOwner = ts.employeeId === req.user.userId;
    const isAdmin = req.user.role === "Admin";
    const isPrincipal = req.user.role === "Principal";
    if (!isOwner && !isAdmin && !isPrincipal) {
      return res.status(403).json({ message: "Not allowed" });
    }

    // (optional) block editing Approved unless Admin
    if (ts.status === "Approved" && !isAdmin) {
      return res
        .status(400)
        .json({ message: "Approved entries cannot be edited" });
    }

    const updated = await Timesheet.findOneAndUpdate(
      { timesheetId: id },
      { ...req.body, updatedBy: req.user.userId },
      { new: true }
    );
    return res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const approveTimesheet = async (req, res) => {
  try {
    const ts = await Timesheet.findOneAndUpdate(
      { timesheetId: req.params.id },
      { status: req.body.status || "Approved", updatedBy: req.user.userId },
      { new: true }
    );
    res.json(ts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getTimesheets = async (req, res) => {
  try {
    const list = await Timesheet.find();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteTimesheet = async (req, res) => {
  try {
    const { id } = req.params; // timesheetId
    const deleted = await Timesheet.findOneAndDelete({ timesheetId: id });
    if (!deleted)
      return res.status(404).json({ message: "Timesheet not found" });
    // 200 ok with small payload (or 204 no-content if you prefer)
    return res.json({
      success: true,
      message: "Timesheet deleted",
      timesheetId: id,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
