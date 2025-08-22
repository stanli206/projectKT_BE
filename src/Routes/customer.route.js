import express from "express";
import { authMiddleware } from "../Middleware/auth.js";
import { permit } from "../Middleware/role.js";
import {
  createCustomer,
  getAllCustomers,
  updateCustomer,
  deleteCustomer
} from "../Controllers/customer.controller.js";

const router = express.Router();

router.post("/", authMiddleware, permit("Admin"), createCustomer);
router.get("/", authMiddleware, permit("Admin", "Principal"), getAllCustomers);
router.put("/:id", authMiddleware, permit("Admin"), updateCustomer);
router.delete("/:id", authMiddleware, permit("Admin"), deleteCustomer);

export default router;
