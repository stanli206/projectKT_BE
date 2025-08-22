import nodemailer from "nodemailer";
import dotenv from "dotenv";
import Notification from "../Models/Notification.model.js";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * sendEmail({ to, subject, text, html })
 * - returns nodemailer info
 * - also creates Notification record (best-effort)
 */
export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject,
      text,
      html
    });

    // store notification
    try {
      const note = new Notification({
        notificationId: uuidv4(),
        to,
        subject,
        message: text || html || "",
        module: "email",
        action: "create",
        triggeredBy: null
      });
      await note.save();
    } catch (e) {
      console.warn("Failed to save notification:", e.message);
    }

    return info;
  } catch (err) {
    console.error("sendEmail error:", err);
    throw err;
  }
};
