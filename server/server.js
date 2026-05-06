const express = require("express");
const Razorpay = require("razorpay");
const cors = require("cors");
const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");
const nodemailer = require("nodemailer");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const morgan = require("morgan");

dotenv.config();

const app = express();

/* ===================== ✅ CORS (FIXED) ===================== */

const allowedOrigin = "https://stately-cocada-a12943.netlify.app";

app.use(cors({
  origin: allowedOrigin,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));

// 🔥 DO NOT USE app.options("*")

/* ===================== ✅ BASIC MIDDLEWARE ===================== */

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(compression());
app.use(morgan("dev"));

/* ===================== ✅ HELMET FIX ===================== */

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

/* ===================== ✅ RATE LIMIT ===================== */

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skip: (req) => req.method === "OPTIONS" // 🔥 important
});

app.use("/api", limiter);
app.use("/send-password-reset-email", authLimiter);

/* ===================== SERVICES ===================== */

// Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Supabase
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Email
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* ===================== TEST ROUTES ===================== */

app.get("/", (req, res) => {
  res.send("API Running ✅");
});

app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

/* ===================== EMAIL VERIFICATION ===================== */

app.post("/send-verification-email", async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email required" });
    }

    const verificationLink = "https://stately-cocada-a12943.netlify.app/verify-email";

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verify Your Email",
      html: `
        <h2>Welcome ${name || 'User'}!</h2>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${verificationLink}?email=${encodeURIComponent(email)}" style="display: inline-block; margin-top: 10px; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
          Verify Email
        </a>
      `
    });

    res.json({ success: true });

  } catch (err) {
    console.log("❌ Email Error:", err);
    res.status(500).json({ error: "Email failed" });
  }
});

/* ===================== PASSWORD RESET ===================== */

app.post("/send-password-reset-email", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email required" });
    }

    const resetLink = "https://stately-cocada-a12943.netlify.app/reset-password";

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Reset Password",
      html: `<a href="${resetLink}">Reset Password</a>`
    });

    res.json({ success: true });

  } catch (err) {
    console.log("❌ Email Error:", err);
    res.status(500).json({ error: "Email failed" });
  }
});

/* ===================== PASSWORD UPDATE ===================== */

app.post("/reset-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ error: "Email and password required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ error: "Service unavailable" });
    }

    // Get all users to find the one with matching email
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers({ limit: 1000 });

    if (listError) {
      console.log("❌ Error listing users:", listError);
      return res.status(400).json({ error: "Could not verify user" });
    }

    // Find user by email
    const user = users?.users?.find(u => u.email === email);

    if (!user) {
      console.log("❌ User not found:", email);
      return res.status(404).json({ error: "User not found" });
    }

    // Update user password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.log("❌ Password update error:", updateError);
      return res.status(400).json({ error: updateError.message });
    }

    res.json({ success: true, message: "Password updated successfully" });

  } catch (err) {
    console.log("❌ Reset password error:", err);
    res.status(500).json({ error: "Failed to update password" });
  }
});

/* ===================== ERROR HANDLER ===================== */

app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);

  res.status(500).json({
    error: err.message || "Server error"
  });
});

/* ===================== START ===================== */

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});