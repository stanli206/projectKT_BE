import nodemailer from "nodemailer";
import dotenv from "dotenv";
import Notification from "../Models/Notification.model.js";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

const port = Number(process.env.SMTP_PORT || 587);
const secure = port === 465; // 465 = SSL, 587 = STARTTLS

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // e.g., smtp.gmail.com
  port,
  secure, // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER, // full email (e.g., yourname@gmail.com)
    pass: process.env.SMTP_PASS, // 16-char app password (no spaces)
  },
  // Optional debug:
  // logger: true, debug: true
});

// Optional: verify at startup to catch config issues early
export async function verifyMailer() {
  try {
    await transporter.verify();
    console.log("SMTP connection OK");
  } catch (e) {
    console.error("SMTP verify failed:", e);
  }
}

export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_USER, // optionally: `"KT Timesheet" <your@gmail.com>`
      to,
      subject,
      text,
      html,
    });
    // ... save Notification (as you already do)
    return info;
  } catch (err) {
    console.error("sendEmail error:", err);
    throw err;
  }
};

// export const sendEmail = async ({ to, subject, text, html }) => {
//   try {
//     const info = await transporter.sendMail({
//       from: process.env.SMTP_USER,
//       to,
//       subject,
//       text,
//       html,
//     });

//     // store notification
//     try {
//       const note = new Notification({
//         notificationId: uuidv4(),
//         to,
//         subject,
//         message: text || html || "",
//         module: "email",
//         action: "create",
//         triggeredBy: null,
//       });
//       await note.save();
//     } catch (e) {
//       console.warn("Failed to save notification:", e.message);
//     }

//     return info;
//   } catch (err) {
//     console.error("sendEmail error:", err);
//     throw err;
//   }
// };
