import express from "express";
import { authMiddleware } from "../Middleware/auth.js";
import { permit } from "../Middleware/role.js";
import {
  createTimesheet,
  updateTimesheet,
  approveTimesheet,
  getTimesheets,
  deleteTimesheet,
} from "../Controllers/timesheet.controller.js";

const router = express.Router();

router.post("/", authMiddleware, permit("Employee", "Admin"), createTimesheet);
router.put(
  "/:id",
  authMiddleware,
  permit("Employee", "Admin", "Principal"),
  updateTimesheet
);
router.post(
  "/:id/approve",
  authMiddleware,
  permit("Principal", "Admin"),
  approveTimesheet
);
router.get("/", authMiddleware, getTimesheets);
router.delete("/:id", authMiddleware, permit("Admin"), deleteTimesheet);

export default router;
