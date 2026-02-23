const path = require("path");
const express = require("express");
const nodemailer = require("nodemailer");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

const REQUIRED_ENV = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS"];
const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  // Keep process running so UI can load, but RSVP API will fail with clear message.
  console.warn(`Missing environment vars: ${missingEnv.join(", ")}`);
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 465),
  secure: String(process.env.SMTP_PORT || "465") === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const TO_EMAILS = [
  "sruthipai@gmail.com",
  "rajeeshrshenoy87@gmail.com"
];

app.use(express.json());
app.use(express.static(__dirname));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/rsvp", async (req, res) => {
  const { name, email, attendance, message } = req.body || {};

  if (!name || !email || !attendance) {
    return res.status(400).json({ error: "Name, email, and attendance are required." });
  }

  if (missingEnv.length > 0) {
    return res.status(500).json({
      error: `Server email setup missing: ${missingEnv.join(", ")}`
    });
  }

  const safeMessage = message && message.trim() ? message.trim() : "No message provided.";
  const submittedAt = new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });

  const subject = `RSVP: ${name} (${attendance})`;
  const html = `
    <h2>New Birthday RSVP</h2>
    <p><strong>Guest Name:</strong> ${escapeHtml(name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Attendance:</strong> ${escapeHtml(attendance)}</p>
    <p><strong>Message:</strong> ${escapeHtml(safeMessage)}</p>
    <p><strong>Submitted:</strong> ${escapeHtml(submittedAt)}</p>
  `;

  const text = [
    "New Birthday RSVP",
    `Guest Name: ${name}`,
    `Email: ${email}`,
    `Attendance: ${attendance}`,
    `Message: ${safeMessage}`,
    `Submitted: ${submittedAt}`
  ].join("\n");

  try {
    await transporter.sendMail({
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: TO_EMAILS.join(","),
      replyTo: email,
      subject,
      text,
      html
    });

    return res.json({ ok: true });
  } catch (error) {
    console.error("Failed to send RSVP email:", error);
    return res.status(500).json({ error: "Failed to send RSVP email." });
  }
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Invite app running at http://localhost:${PORT}`);
});

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
