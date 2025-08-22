import express from "express";
import { authMiddleware } from "../Middleware/auth.js";
import { permit } from "../Middleware/role.js";
import {
  createProject,
  updateProject,
  listProjects,
  deleteProject,
} from "../Controllers/project.controller.js";

const router = express.Router();

// Create project (Admin or Principal)
router.post("/", authMiddleware, permit("Admin", "Principal"), createProject);
router.put("/:id", authMiddleware, permit("Admin", "Principal"), updateProject);
router.get("/", authMiddleware, listProjects);
router.delete(
  "/:id",
  authMiddleware,
  permit("Admin", "Principal"),
  deleteProject
);
export default router;