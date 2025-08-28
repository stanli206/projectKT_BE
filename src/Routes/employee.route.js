import express from "express";
import { authMiddleware } from "../Middleware/auth.js";
import { permit } from "../Middleware/role.js";
import {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
} from "../Controllers/employee.controller.js";
import { validateEmployeeBody } from "../Controllers/employee.controller.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  permit("Admin"),
  validateEmployeeBody,
  createEmployee
);
router.get("/", authMiddleware, permit("Admin", "Principal"), getAllEmployees);
router.get("/:id", authMiddleware, getEmployeeById);
router.put("/:id", authMiddleware, updateEmployee);
router.delete("/:id", authMiddleware, permit("Admin"), deleteEmployee);

export default router;
