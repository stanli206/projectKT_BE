import express from "express";
import dotenv from "dotenv";
import connectDB from "./src/dbConfig/db.Config.js";
import authRoutes from "./src/Routes/auth.route.js";
import userRoutes from "./src/Routes/user.route.js";
import projectRoutes from "./src/Routes/project.route.js";
import User from "./src/Models/User.model.js";
import employeeRoutes from "./src/Routes/employee.route.js";
import customerRoutes from "./src/Routes/customer.route.js";
import timesheetRoutes from "./src/Routes/timesheet.route.js";
import dashboardRoutes from "./src/Routes/dashboard.route.js";
import reportRoutes from "./src/Routes/report.route.js";
import cors from "cors";

import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

dotenv.config();
const app = express();
app.use(
  cors({
    origin:
      "http://localhost:5173" || "https://emptimesheetmanagement.netlify.app",
    method: "GET,POST,PUT,DELETE",
    credentials: true,
  })
);

app.use(express.json());

const seedAdmin = async () => {
  const exists = await User.findOne({ role: "Admin" });
  if (!exists) {
    const hash = await bcrypt.hash("admin123", 10);
    await User.create({
      userId: uuidv4(),
      userName: "admin",
      role: "Admin",
      passwordHash: hash,
    });
    console.log("Admin created: userName=admin password=admin123");
  }
};
seedAdmin();
connectDB();
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/timesheets", timesheetRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);

const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
