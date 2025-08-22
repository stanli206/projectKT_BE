import express from "express";
import { login, registerByAdmin } from "../Controllers/auth.controller.js";
import { authMiddleware } from "../Middleware/auth.js";
import { permit } from "../Middleware/role.js";

const router = express.Router();

// Admin creates user (register). Protected: Admin only
router.post("/register", authMiddleware, permit("Admin"), registerByAdmin);

// Public login
router.post("/login", login);

export default router;
