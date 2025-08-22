import express from "express";
import { authMiddleware } from "../Middleware/auth.js";
import { permit } from "../Middleware/role.js";
import {
  createTimesheet,
  updateTimesheet,
  approveTimesheet,
  getTimesheets,
} from "../Controllers/timesheet.controller.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  permit("Employee", "Principal", "Admin"),
  createTimesheet
);
router.put("/:id", authMiddleware, updateTimesheet);
router.post(
  "/:id/approve",
  authMiddleware,
  permit("Principal", "Admin"),
  approveTimesheet
);
router.get("/", authMiddleware, getTimesheets);

export default router;
