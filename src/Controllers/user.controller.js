import User from "../Models/User.model.js";
import Notification from "../Models/Notification.model.js";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";


export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-passwordHash -__v");
    return res.json(users);
  } catch (err) {
    console.error("getAllUsers error:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const requester = req.user;

    if (requester.role !== "Admin" && requester.userId !== id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const user = await User.findOne({ userId: id }).select(
      "-passwordHash -__v"
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json(user);
  } catch (err) {
    console.error("getUserProfile error:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const requester = req.user;
    const updates = req.body;

    if (requester.role !== "Admin" && requester.userId !== id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const user = await User.findOne({ userId: id });
    if (!user) return res.status(404).json({ message: "User not found" });

    // if password changing
    if (updates.plainPassword) {
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(updates.plainPassword, salt);
      delete updates.plainPassword;
    }

    // only admin can change role
    if (updates.role && requester.role !== "Admin") {
      delete updates.role;
    }

    // apply other allowed updates
    const allowed = ["userName", "role", "updatedBy"];
    allowed.forEach((f) => {
      if (typeof updates[f] !== "undefined") user[f] = updates[f];
    });

    // record tracking entry
    const trackingEntry = {
      id: (user.recordTracking?.length || 0) + 1,
      module: "users",
      method: "update",
      userId: requester.userId,
      userName: requester.userName,
      modifiedAt: new Date(),
      changedFields: updates,
    };
    user.recordTracking = user.recordTracking || [];
    user.recordTracking.push(trackingEntry);

    await user.save();

    const toReturn = user.toObject();
    delete toReturn.passwordHash;
    return res.json(toReturn);
  } catch (err) {
    console.error("updateUserProfile error:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};


export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await User.findOneAndDelete({ userId: id });
    if (!deleted) return res.status(404).json({ message: "User not found" });

    // Don't let notification failure break delete
    try {
      const note = new Notification({
        notificationId: uuidv4(),
        to: process.env.ADMIN_EMAIL || "admin@example.com",
        subject: "User deleted",
        message: `User ${deleted.userName} (id: ${deleted.userId}) deleted by ${req.user.userName}`,
        module: "user",
        action: "delete", // enum updated to include "delete"
        triggeredBy: req.user.userId
      });
      await note.save();
    } catch (e) {
      console.warn("Notification failed after delete:", e.message);
    }

    return res.json({ message: "User deleted" });
  } catch (err) {
    console.error("deleteUser error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

