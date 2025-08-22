import User from "../Models/User.model.js";
import Employee from "../Models/Employee.model.js";
import Notification from "../Models/Notification.model.js";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { sendEmail } from "../utils/emailService.js";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";

/**
 * Admin creates a user tied to an employeeId.
 * - Checks user count limit (200)
 * - Hashes password
 * - Sends welcome email and creates Notification record
 */
export const registerByAdmin = async (req, res) => {
  try {
    const {
      userName,
      employeeId, // should be an existing Employee.employeeId
      role = "Employee",
      plainPassword,
    } = req.body;

    if (!userName || !employeeId || !plainPassword) {
      return res.status(400).json({
        message: "userName, employeeId and plainPassword are required",
      });
    }

    // limit check: if users >= 200 -> do not allow create and notify admin
    const userCount = await User.countDocuments();
    if (userCount >= 200) {
      // create notification to admin
      const note = new Notification({
        notificationId: uuidv4(),
        to: ADMIN_EMAIL,
        subject: "User creation blocked: limit reached",
        message: `Attempted to create user ${userName} but user limit (200) reached.`,
        module: "user",
        action: "create",
        triggeredBy: req.user?.userId,
      });
      await note.save();

      // send admin email (best-effort)
      try {
        await sendEmail({
          to: ADMIN_EMAIL,
          subject: "User creation blocked: limit reached",
          text: `User creation attempted for ${userName} but user limit (200) reached.`,
        });
      } catch (e) {
        console.warn("Failed to send admin email:", e.message);
      }

      return res.status(403).json({
        message: "User creation not allowed: limit reached. Admin notified.",
      });
    }

    // validate employee exists
    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return res
        .status(404)
        .json({ message: "Employee not found for provided employeeId" });
    }

    // check duplicate username
    const existing = await User.findOne({ userName });
    if (existing) {
      return res.status(409).json({ message: "userName already exists" });
    }

    // hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(plainPassword, salt);

    const newUser = new User({
      userId: uuidv4(),
      userName,
      employeeId,
      role,
      passwordHash,
      createdBy: req.user?.userId,
      recordTracking: [
        {
          id: 1,
          module: "users",
          method: "create",
          userId: req.user?.userId,
          userName: req.user?.userName,
          modifiedAt: new Date(),
          changedFields: { userName, employeeId, role },
        },
      ],
    });

    await newUser.save();

    // send welcome email
    try {
      await sendEmail({
        to: employee.personalEmail || ADMIN_EMAIL,
        subject: "Welcome to System",
        text: `Hello ${userName},\n\nYour account has been created.\nUsername: ${userName}\nPlease change your password after first login.`,
      });
    } catch (err) {
      console.warn("Welcome email failed:", err.message);
    }

    // create notification record
    const notification = new Notification({
      notificationId: uuidv4(),
      to: employee.personalEmail || ADMIN_EMAIL,
      subject: "Welcome to system",
      message: `Account created for ${userName}`,
      module: "user",
      action: "create",
      triggeredBy: req.user?.userId,
    });
    await notification.save();

    // return created user (omit passwordHash)
    const userToReturn = newUser.toObject();
    delete userToReturn.passwordHash;

    return res.status(201).json(userToReturn);
  } catch (err) {
    console.error("registerByAdmin error:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

/**
 * Login: username + password -> JWT
 */
export const login = async (req, res) => {
  try {
    const { userName, password } = req.body;
    if (!userName || !password) {
      return res
        .status(400)
        .json({ message: "userName and password required" });
    }

    const user = await User.findOne({ userName });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    // build payload
    const payload = {
      userId: user.userId,
      userName: user.userName,
      role: user.role,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // update lastLogin
    user.lastLogin = new Date();
    await user.save();

    return res.json({
      token,
      user: { userId: user.userId, userName: user.userName, role: user.role },
    });
  } catch (err) {
    console.error("login error:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};
