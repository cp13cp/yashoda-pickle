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

// Load env
dotenv.config();

const app = express();

/* ================= CORS FIX ================= */

const allowedOrigins = [
  "https://stately-cocada-a12943.netlify.app",
  "http://localhost:5173"
];

app.use(cors({
  origin: function (origin, callback) {
    console.log("🌍 Incoming Origin:", origin);

    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("❌ Blocked by CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));

app.options("*", cors());

/* ================= SECURITY ================= */

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: [
        "'self'",
        "https://ehocckmjsdsxdcdkgrgk.supabase.co",
        "https://api.razorpay.com",
        "https://yashoda-pickle-1.onrender.com"
      ]
    }
  }
}));

/* ================= MIDDLEWARE ================= */

app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev"));

/* ================= RATE LIMIT ================= */

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

app.use(limiter);

/* ================= TEST ROUTE ================= */

app.get("/", (req, res) => {
  res.send("API Working ✅");
});