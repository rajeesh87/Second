const nodemailer = require("nodemailer");

const TO_EMAILS = ["sruthipai@gmail.com", "rajeeshrshenoy87@gmail.com"];

module.exports = async (req, res) => {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const requiredEnv = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS"];
  const missingEnv = requiredEnv.filter((key) => !process.env[key]);
  if (missingEnv.length > 0) {
    return res.status(500).json({
      error: `Server email setup missing: ${missingEnv.join(", ")}`
    });
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    return res.status(400).json({ error: "Invalid JSON payload." });
  }

  const { name, email, attendance, message } = body || {};
  if (!name || !email || !attendance) {
    return res.status(400).json({ error: "Name, email, and attendance are required." });
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

  const safeMessage = message && message.trim() ? message.trim() : "No message provided.";
  const submittedAt = new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });

  const subject = `RSVP: ${name} (${attendance})`;
  const text = [
    "New Birthday RSVP",
    `Guest Name: ${name}`,
    `Email: ${email}`,
    `Attendance: ${attendance}`,
    `Message: ${safeMessage}`,
    `Submitted: ${submittedAt}`
  ].join("\\n");

  const html = `
    <h2>New Birthday RSVP</h2>
    <p><strong>Guest Name:</strong> ${escapeHtml(name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Attendance:</strong> ${escapeHtml(attendance)}</p>
    <p><strong>Message:</strong> ${escapeHtml(safeMessage)}</p>
    <p><strong>Submitted:</strong> ${escapeHtml(submittedAt)}</p>
  `;

  try {
    await transporter.sendMail({
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: TO_EMAILS.join(","),
      replyTo: email,
      subject,
      text,
      html
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Failed to send RSVP email:", error);
    return res.status(500).json({ error: "Failed to send RSVP email." });
  }
};

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  if (typeof req.body === "string" && req.body.trim() !== "") {
    return JSON.parse(req.body);
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) {
    return {};
  }

  return JSON.parse(raw);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
