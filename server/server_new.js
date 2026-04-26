const express = require("express");
const Razorpay = require("razorpay");
const cors = require("cors");
const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");
const nodemailer = require("nodemailer");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Supabase
let supabaseAdmin = null;
try {
  supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  console.log("✅ Supabase connected");
} catch (err) {
  console.log("❌ Supabase error:", err.message);
}

// Email
let transporter = null;
try {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  console.log("✅ Email ready");
} catch (err) {
  console.log("❌ Email error:", err.message);
}

// ===== ROUTES =====

// Create Razorpay Order
app.post("/create-order", async (req, res) => {
  try {
    const { amount } = req.body;

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: "order_rcptid_11"
    });

    res.json(order);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Razorpay error" });
  }
});

// Place Order
app.post("/place-order", async (req, res) => {
  console.log("🔥 PLACE ORDER HIT");

  if (!supabaseAdmin) {
    return res.status(500).json({ error: "Supabase not connected" });
  }

  try {
    const {
      user_name,
      address,
      items,
      total,
      payment_method,
      payment_id,
      status
    } = req.body;

    const { data, error } = await supabaseAdmin
      .from("orders")
      .insert([
        {
          user_name,
          address,
          items: JSON.stringify(items || []),
          total,
          payment_method,
          payment_id,
          status,
          created_at: new Date().toISOString()
        }
      ])
      .select();

    if (error) throw error;

    // Send Email (optional)
    if (transporter) {
      transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: "Order Confirmation",
        html: `<h2>Order placed by ${user_name}</h2>
               <p>Total: &#8377;${total}</p>`
      });
    }

    res.json({ success: true, order: data[0] });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});

// ===== ADMIN ROUTES =====

// Get all users (admin only)
app.get("/admin/users", async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: "Supabase not connected" });
  }

  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ limit: 100 });
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const users = (data?.users || []).map((user) => ({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.email,
      created_at: user.created_at,
    }));

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all orders (admin only)
app.get("/admin/orders", async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: "Supabase not connected" });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new product (admin only)
app.post("/admin/products", async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: "Supabase not connected" });
  }

  try {
    const product = req.body;
    const { data, error } = await supabaseAdmin.from("pickle").insert([product]).select();
    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update product (admin only)
app.put("/admin/products/:id", async (req, res) => {
  console.log("🔄 PUT /admin/products/:id called with id:", req.params.id);
  console.log("📦 Update data:", req.body);

  if (!supabaseAdmin) {
    console.log("❌ Supabase not connected");
    return res.status(500).json({ error: "Supabase not connected" });
  }

  try {
    const { id } = req.params;
    const updates = req.body;
    console.log("🔍 Updating product", id, "with data:", updates);

    const { data, error } = await supabaseAdmin
      .from("pickle")
      .update(updates)
      .eq("id", id)
      .select();

    if (error) {
      console.log("❌ Supabase error:", error);
      throw error;
    }

    console.log("✅ Product updated successfully:", data[0]);
    res.json(data[0]);
  } catch (err) {
    console.log("❌ Error in PUT route:", err);
    res.status(500).json({ error: err.message });
  }
});

// Delete product (admin only)
app.delete("/admin/products/:id", async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: "Supabase not connected" });
  }

  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin.from("pickle").delete().eq("id", id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== SAFE ERROR HANDLING (NO EXIT) =====

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err);
});

// ===== START SERVER =====

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});
setInterval(() => {
  console.log("🟢 Server alive...");
}, 10000);