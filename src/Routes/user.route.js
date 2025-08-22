import express from "express";
import { authMiddleware } from "../Middleware/auth.js";
import { permit } from "../Middleware/role.js";
import {
  getAllUsers,
  getUserProfile,
  updateUserProfile,
  deleteUser,
} from "../Controllers/user.controller.js";

const router = express.Router();

// Get all users (Admin)
router.get("/", authMiddleware, permit("Admin"), getAllUsers);

// Get own profile or admin can fetch by userId
router.get("/profile/:id", authMiddleware, getUserProfile);

// Update profile (own or admin)
router.put("/profile/:id", authMiddleware, updateUserProfile);

// Delete user (Admin)
router.delete("/:id", authMiddleware, permit("Admin"), deleteUser);

export default router;
