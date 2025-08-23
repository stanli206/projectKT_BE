import Project from "../Models/Project.model.js";
import Customer from "../Models/Customer.model.js";
import { makeProjectCode } from "../utils/projectCode.js";
import { v4 as uuidv4 } from "uuid";


export const createProject = async (req, res) => {
  try {
    const {
      job_name,
      customerIdOrCode,
      managerId,
      assignedEmployeeIds = [],
    } = req.body;

    const customer = await Customer.findOne({
      $or: [{ Customer_id: customerIdOrCode }, { Cust_code: customerIdOrCode }],
    });
    if (!customer)
      return res.status(404).json({ message: "Customer not found" });

    const existingCount = await Project.countDocuments({
      "Pro_code.customerCode": customer.Cust_code,
    });
    const serial = existingCount + 1;
    const suffix = String.fromCharCode(64 + (serial % 26 || 26));
    const proCodeObj = makeProjectCode({
      customerCode: customer.Cust_code,
      serial,
      suffix,
    });

    let totalHours = 0;
    let totalCost = 0;
    assignedEmployeeIds.forEach((a) => {
      const empHours = Number(a.empHours || 0);
      const perHour = Number(a.perHour || 0);
      totalHours += empHours;
      totalCost += empHours * perHour;
    });

    const project = new Project({
      projectId: uuidv4(),
      job_name,
      Pro_code: proCodeObj,
      managerId,
      assignedEmployeeIds,
      totalCost,
      totalHours,
      perHourCost: totalHours ? totalCost / totalHours : 0,
      createdBy: req.user?.userId,
      recordTracking: [
        {
          id: 1,
          module: "project",
          method: "create",
          userId: req.user?.userId,
          userName: req.user?.userName,
          modifiedAt: new Date(),
          changedFields: { job_name, managerId },
        },
      ],
    });

    await project.save();
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const project = await Project.findOne({ projectId: id });
    if (!project) return res.status(404).json({ message: "Project not found" });

    // Increment serial if major fields change (job_name, status, assignedEmployees)
    const existingSerial = project.Pro_code.serial || 1;
    const newSerial = existingSerial + 1;
    const suffix = String.fromCharCode(64 + (newSerial % 26 || 26));
    const proCodeObj = makeProjectCode({
      customerCode: project.Pro_code.customerCode,
      serial: newSerial,
      suffix,
    });
    proCodeObj.updatedAt = new Date().toISOString();

    // recalc totals if employees updated
    let totalHours = project.totalHours;
    let totalCost = project.totalCost;
    if (updates.assignedEmployeeIds) {
      totalHours = 0;
      totalCost = 0;
      updates.assignedEmployeeIds.forEach((a) => {
        const empHours = Number(a.empHours || 0);
        const perHour = Number(a.perHour || 0);
        totalHours += empHours;
        totalCost += empHours * perHour;
      });
    }

    const updatedProject = await Project.findOneAndUpdate(
      { projectId: id },
      {
        ...updates,
        Pro_code: proCodeObj,
        totalCost,
        totalHours,
        perHourCost: totalHours ? totalCost / totalHours : 0,
        updatedBy: req.user?.userId,
        updatedAt: new Date(),
        $push: {
          recordTracking: {
            id: (project.recordTracking?.length || 0) + 1,
            module: "project",
            method: "update",
            userId: req.user?.userId,
            userName: req.user?.userName,
            modifiedAt: new Date(),
            changedFields: updates,
          },
        },
      },
      { new: true }
    );

    res.json({ message: "Project updated", updatedProject });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const listProjects = async (req, res) => {
  try {
    const projects = await Project.find();
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findOneAndDelete({ projectId: id });
    if (!project) return res.status(404).json({ message: "Project not found" });

    res.json({ message: `Project ${id} deleted successfully` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
