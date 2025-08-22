import express from "express";
import { authMiddleware } from "../Middleware/auth.js";
import { getDashboard } from "../Controllers/dashboard.controller.js";

const router = express.Router();

router.get("/", authMiddleware, getDashboard);

export default router;
