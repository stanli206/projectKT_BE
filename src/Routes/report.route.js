import express from "express";
import { authMiddleware } from "../Middleware/auth.js";
import { permit } from "../Middleware/role.js";
import {
  reportByEmployee,
  reportByProject,
  monthlyReport
} from "../Controllers/report.controller.js";

const router = express.Router();

router.get("/employee", authMiddleware, permit("Admin", "Principal"), reportByEmployee);
router.get("/project", authMiddleware, permit("Admin", "Principal"), reportByProject);
router.get("/monthly", authMiddleware, permit("Admin", "Principal"), monthlyReport);

export default router;
