import express from "express";
import { authMiddleware } from "../Middleware/auth.js";
import { permit } from "../Middleware/role.js";
import {
  reportByEmployees,
  reportByProjects,
  reportCustomRange,
  reportMonthly,
} from "../Controllers/report.controller.js";

const router = express.Router();

router.get(
  "/by-employees",
  authMiddleware,
  permit("Admin", "Principal"),
  reportByEmployees
);
router.get(
  "/by-projects",
  authMiddleware,
  permit("Admin", "Principal"),
  reportByProjects
);
router.get(
  "/monthly",
  authMiddleware,
  permit("Admin", "Principal"),
  reportMonthly
);
router.get(
  "/custom",
  authMiddleware,
  permit("Admin", "Principal"),
  reportCustomRange
);

export default router;
