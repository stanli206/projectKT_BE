import Employee from "../Models/Employee.model.js";
import Project from "../Models/Project.model.js";
import Timesheet from "../Models/Timesheet.model.js";

export const getDashboard = async (req, res) => {
  try {
    const totalEmployees = await Employee.countDocuments();
    const totalProjects = await Project.countDocuments();
    const timesheetsThisWeek = await Timesheet.countDocuments();

    const byStatus = {
      projects: {
        open: await Project.countDocuments({ status: "Open" }),
        inProgress: await Project.countDocuments({ status: "In-progress" }),
        done: await Project.countDocuments({ status: "Completed" })
      },
      timesheets: {
        submitted: await Timesheet.countDocuments({ status: "Submitted" }),
        approved: await Timesheet.countDocuments({ status: "Approved" }),
        rejected: await Timesheet.countDocuments({ status: "Rejected" })
      }
    };

    res.json({ overview: { totalEmployees, totalProjects, timesheetsThisWeek }, byStatus });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
