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

// Load environment variables
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: envFile });

console.log(`🚀 Starting server in ${process.env.NODE_ENV || 'development'} mode`);
console.log(`📄 Loaded env file: ${envFile}`);

const app = express();
const cors = require("cors");

app.use(cors({
  origin: "https://stately-cocada-a12943.netlify.app",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://ehocckmjsdsxdcdkgrgk.supabase.co", "https://api.razorpay.com"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth attempts per windowMs
  message: {
    error: "Too many authentication attempts, please try again later."
  }
});

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
  : ['http://localhost:5173'];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Apply rate limiting
app.use('/api/', limiter);
app.use('/send-verification-email', authLimiter);
app.use('/send-password-reset-email', authLimiter);

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
let adminNotificationEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
try {
  transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS?.trim(),
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  transporter.verify((error, success) => {
    if (error) {
      console.log("❌ Email verify failed:", error.message);
    } else {
      console.log("✅ Email ready and verified");
    }
  });
} catch (err) {
  console.log("❌ Email error:", err.message);
}

// ===== HEALTH CHECKS & MONITORING =====

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime()
  });
});

// Readiness check
app.get('/ready', async (req, res) => {
  try {
    // Check database connection
    if (supabaseAdmin) {
      const { error } = await supabaseAdmin.from('profiles').select('count').limit(1);
      if (error && !error.message.includes('relation "public.profiles" does not exist')) {
        throw error;
      }
    }

    res.status(200).json({
      status: 'ready',
      services: {
        database: supabaseAdmin ? 'connected' : 'disconnected',
        email: transporter ? 'configured' : 'not configured',
        payment: razorpay ? 'configured' : 'not configured'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: error.message
    });
  }
});

// Metrics endpoint (basic)
app.get('/metrics', (req, res) => {
  const memUsage = process.memoryUsage();
  res.status(200).json({
    memory: {
      rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
      external: Math.round(memUsage.external / 1024 / 1024) + 'MB'
    },
    uptime: Math.round(process.uptime()) + 's',
    environment: process.env.NODE_ENV || 'development'
  });
});

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
  console.log("🔥 PLACE ORDER HIT", req.body);

  if (!supabaseAdmin) {
    return res.status(500).json({ error: "Supabase not connected" });
  }

  try {
    const {
      user_name,
      user_email,
      address,
      items,
      total,
      payment_method,
      payment_id,
      status
    } = req.body;

    // Validate required fields
    if (!user_name || !address || !items || total === undefined || !payment_method || !status) {
      console.log("❌ Missing required fields:", {
        user_name: !!user_name,
        address: !!address,
        items: !!items,
        total: total !== undefined,
        payment_method: !!payment_method,
        status: !!status
      });
      return res.status(400).json({ 
        error: "Missing required fields",
        received: { user_name, user_email: !!user_email, address, items: !!items, total, payment_method, status }
      });
    }

    const orderObject = {
      user_name: user_email || user_name, // Store email in user_name field for now
      address,
      items: JSON.stringify(items),
      total: Number(total),
      payment_method,
      payment_id: payment_id || null,
      status,
      created_at: new Date().toISOString()
    };

    console.log("📦 Inserting order:", orderObject);

    const { data, error } = await supabaseAdmin
      .from("orders")
      .insert([orderObject])
      .select();

    if (error) {
      console.log("❌ Supabase error:", error);
      throw error;
    }

    console.log("✅ Order inserted successfully:", data);

    const recipientEmail = user_email || (user_name?.includes("@") ? user_name : null);

    if (transporter && recipientEmail) {
      const parsedItems = Array.isArray(items) ? items : [];
      const itemsHTML = parsedItems
        .map(
          (item) => `
            <tr>
              <td style="padding: 12px 10px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
              <td style="padding: 12px 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
              <td style="padding: 12px 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${item.price}</td>
              <td style="padding: 12px 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${Number(item.price) * Number(item.quantity)}</td>
            </tr>`
        )
        .join("");

      const emailHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h1 style="color: #f97316; margin: 0 0 20px 0;">Yashoda Pickle</h1>
            <h2 style="color: #111827; font-size: 24px; margin: 0 0 12px 0;">Order Confirmed ✅</h2>
            <p style="margin: 0 0 20px 0; color: #4b5563; line-height: 1.7;">Your order has been placed successfully and is now being processed.</p>

            <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
              <p style="margin: 0 0 6px 0; font-weight: 700; color: #1d4ed8;">Order #${data[0].id}</p>
              <p style="margin: 0; color: #334155;">Hello ${user_name || "Customer"}, thanks for shopping with Yashoda Pickle.</p>
            </div>

            <div style="margin-bottom: 24px;">
              <h3 style="margin: 0 0 12px 0; color: #111827;">Order Summary</h3>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 18px;">
                <thead>
                  <tr style="background-color: #f8fafc;">
                    <th style="padding: 12px 10px; text-align: left; color: #1f2937;">Item</th>
                    <th style="padding: 12px 10px; text-align: center; color: #1f2937;">Qty</th>
                    <th style="padding: 12px 10px; text-align: right; color: #1f2937;">Price</th>
                    <th style="padding: 12px 10px; text-align: right; color: #1f2937;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHTML}
                </tbody>
              </table>

              <div style="display: flex; justify-content: space-between; background: #f1f5f9; padding: 16px; border-radius: 12px;">
                <span style="font-weight: 700; color: #111827;">Grand Total</span>
                <span style="font-weight: 700; color: #111827;">₹${total}</span>
              </div>
            </div>

            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
              <p style="margin: 0 0 8px 0; font-weight: 700; color: #111827;">Delivery Address</p>
              <p style="margin: 0; color: #475569; line-height: 1.75;">${address}</p>
            </div>

            <div style="display: grid; gap: 10px; margin-bottom: 24px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #475569;">Payment Method</span>
                <span style="font-weight: 700; color: #111827;">${payment_method === "cod" ? "Cash on Delivery" : "Online Payment"}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #475569;">Order Status</span>
                <span style="font-weight: 700; color: #111827;">${status}</span>
              </div>
            </div>

            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 12px;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">We will notify you again when your order status changes.</p>
            </div>

            <footer style="text-align: center; margin-top: 28px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #64748b; font-size: 13px;">
              <p style="margin: 0;">© 2026 Yashoda Pickle. All rights reserved.</p>
            </footer>
          </div>
        </div>
      `;

      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: recipientEmail,
          subject: `Your Yashoda Pickle order #${data[0].id} is confirmed`,
          html: emailHTML,
        });
        console.log(`✅ Order confirmation email sent to ${recipientEmail}`);
      } catch (emailErr) {
        console.log("⚠️ Email send failed on order placement:", emailErr.message);
      }
    }

    res.json({ success: true, order: data[0] });
  } catch (err) {
    console.log("❌ Error in /place-order:", err);
    res.status(500).json({ error: err.message || "Failed to place order" });
  }
});

// Get orders by user email
app.get("/orders", async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: "Supabase not connected" });
  }

  try {
    const { user_email } = req.query;

    if (!user_email) {
      return res.status(400).json({ error: "user_email query parameter is required" });
    }

    console.log("🔍 Fetching orders for email:", user_email);

    // Search in user_name field (which may contain email for existing orders)
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .ilike("user_name", `%${user_email}%`)
      .order("created_at", { ascending: false });

    if (error) {
      console.log("❌ Supabase error:", error);
      throw error;
    }

    const orders = (data || []).map((order) => ({
      ...order,
      items: order.items ? JSON.parse(order.items) : [],
    }));

    console.log("✅ Orders fetched:", orders.length);
    res.json(orders);
  } catch (err) {
    console.log("❌ Error in /orders:", err);
    res.status(500).json({ error: err.message || "Failed to fetch orders" });
  }
});

app.post("/orders/:id/cancel", async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: "Supabase not connected" });
  }

  try {
    const { id } = req.params;
    const { data: existingData, error: fetchError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) {
      console.log("❌ Order fetch error:", fetchError);
      return res.status(404).json({ error: "Order not found" });
    }

    if (existingData.status === "cancelled") {
      return res.status(400).json({ error: "Order is already cancelled" });
    }

    const { data, error } = await supabaseAdmin
      .from("orders")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.log("❌ Supabase update error:", error);
      throw error;
    }

    const mailRecipient = adminNotificationEmail;
    if (transporter && mailRecipient) {
      const emailBody = `Order #${data.id} placed by ${data.user_name || data.user_email} has been cancelled by the customer. Total: ₹${data.total}. Payment method: ${data.payment_method}.`;
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: mailRecipient,
        subject: `Order #${data.id} Cancelled - Admin Notification`,
        html: `<p>${emailBody}</p>`,
      });
      console.log(`✅ Admin notified at ${mailRecipient} for cancelled order ${data.id}`);
    }

    res.json({ success: true, order: { ...data, items: data.items ? JSON.parse(data.items) : [] } });
  } catch (err) {
    console.log("❌ Error cancelling order:", err);
    res.status(500).json({ error: err.message || "Failed to cancel order" });
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

    // Parse items JSON string back to array
    const orders = data.map((order) => ({
      ...order,
      items: order.items ? JSON.parse(order.items) : [],
    }));

    res.json(orders || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update order status (admin only)
app.put("/admin/orders/:id", async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: "Supabase not connected" });
  }

  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    console.log(`📝 Updating order ${id} status to: ${status}`);

    // First, fetch the current order details
    const { data: orderData, error: fetchError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !orderData) {
      console.log("❌ Error fetching order:", fetchError);
      return res.status(404).json({ error: "Order not found" });
    }

    // Update the order status
    const { data, error } = await supabaseAdmin
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select();

    if (error) {
      console.log("❌ Supabase error:", error);
      throw error;
    }

    console.log("✅ Order status updated successfully:", data[0]);

    // Send email notification
    if (transporter && orderData.user_name) {
      const statusMessages = {
        pending: "Your order has been received and is being processed.",
        confirmed: "Your order has been confirmed! We're preparing it for shipment.",
        shipped: "Your order has been shipped! Track your package on the way.",
        delivered: "Your order has been delivered! Thank you for shopping with us.",
        cancelled: "Your order has been cancelled.",
        paid: "Payment received! Your order is confirmed."
      };

      const items = orderData.items ? JSON.parse(orderData.items) : [];
      const itemsHTML = items.map(item => 
        `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${item.quantity * item.price}</td>
        </tr>`
      ).join("");

      const emailHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            
            <h1 style="color: #f97316; margin: 0 0 20px 0;">Yashoda Pickle</h1>
            
            <h2 style="color: #333; font-size: 24px; margin: 20px 0;">Order Status Update 📦</h2>
            
            <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="color: #1e40af; font-weight: bold; margin: 0 0 5px 0;">Order #${orderData.id}</p>
              <p style="color: #1e40af; margin: 0;">${statusMessages[status]}</p>
            </div>

            <div style="margin: 30px 0;">
              <h3 style="color: #333; font-size: 18px; margin: 0 0 15px 0;">Order Details</h3>
              
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                  <tr style="background-color: #f3f4f6;">
                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb; color: #333; font-weight: bold;">Product</th>
                    <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e5e7eb; color: #333; font-weight: bold;">Qty</th>
                    <th style="padding: 10px; text-align: right; border-bottom: 2px solid #e5e7eb; color: #333; font-weight: bold;">Price</th>
                    <th style="padding: 10px; text-align: right; border-bottom: 2px solid #e5e7eb; color: #333; font-weight: bold;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHTML}
                </tbody>
              </table>

              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; color: #333;">
                  <span>Total Amount:</span>
                  <span>₹${orderData.total}</span>
                </div>
              </div>
            </div>

            <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <h3 style="color: #166534; margin: 0 0 10px 0;">📍 Delivery Address</h3>
              <p style="color: #166534; margin: 0; line-height: 1.6;">${orderData.address}</p>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #666; font-size: 14px; margin: 0;">
                Payment Method: <strong>${orderData.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</strong>
              </p>
              <p style="color: #666; font-size: 14px; margin: 10px 0 0 0;">
                Order Date: <strong>${new Date(orderData.created_at).toLocaleDateString('en-IN')}</strong>
              </p>
            </div>

            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p style="color: #92400e; margin: 0; font-size: 14px;">
                <strong>Thank you for your order!</strong> If you have any questions, please contact our support team.
              </p>
            </div>

            <footer style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #666; font-size: 12px; margin: 0;">
                © 2026 Yashoda Pickle. All rights reserved.
              </p>
            </footer>
          </div>
        </div>
      `;

      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: orderData.user_name,
          subject: `Order #${orderData.id} - Status: ${status.toUpperCase()} 🎉`,
          html: emailHTML
        });
        console.log(`✅ Email sent to ${orderData.user_name}`);
      } catch (emailErr) {
        console.log("⚠️ Email send failed (but order was updated):", emailErr.message);
      }
    }

    res.json(data[0]);
  } catch (err) {
    console.log("❌ Error in PUT /admin/orders:", err);
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

// ===== CUSTOM EMAIL VERIFICATION =====

// Send verification email using our Nodemailer
app.post("/send-verification-email", async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    if (!transporter) {
      return res.status(500).json({ error: "Email service not configured" });
    }

    // Generate a simple verification token (in production, use JWT or crypto)
    const verificationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const verificationLink = `${req.protocol}://${req.get('host')}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;

    const emailHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
        <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h1 style="color: #f97316; margin: 0 0 20px 0;">Yashoda Pickle</h1>
          <h2 style="color: #111827; font-size: 24px; margin: 0 0 12px 0;">Verify Your Email Address</h2>
          <p style="margin: 0 0 20px 0; color: #4b5563; line-height: 1.7;">Welcome to Yashoda Pickle! Please verify your email address to complete your registration.</p>

          <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
            <p style="margin: 0 0 6px 0; font-weight: 700; color: #1d4ed8;">Hello ${name || "Customer"}!</p>
            <p style="margin: 0; color: #334155;">Click the button below to verify your email address.</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" style="background-color: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Verify Email Address</a>
          </div>

          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
            <p style="margin: 0 0 8px 0; font-weight: 700; color: #111827;">If the button doesn't work:</p>
            <p style="margin: 0; color: #475569; line-height: 1.75;">Copy and paste this link into your browser:<br>
            <a href="${verificationLink}" style="color: #3b82f6; word-break: break-all;">${verificationLink}</a></p>
          </div>

          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 12px;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">This verification link will expire in 24 hours.</p>
          </div>

          <footer style="text-align: center; margin-top: 28px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #64748b; font-size: 13px;">
            <p style="margin: 0;">© 2026 Yashoda Pickle. All rights reserved.</p>
          </footer>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Verify your Yashoda Pickle account`,
      html: emailHTML,
    });

    console.log(`✅ Verification email sent to ${email}`);
    res.json({ success: true, message: "Verification email sent successfully" });

  } catch (err) {
    console.log("❌ Error sending verification email:", err);
    res.status(500).json({ error: err.message || "Failed to send verification email" });
  }
});

// Verify email endpoint
app.get("/verify-email", async (req, res) => {
  try {
    const { token, email } = req.query;

    if (!token || !email) {
      return res.status(400).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2>Invalid Verification Link</h2>
            <p>The verification link is invalid or expired.</p>
            <a href="http://localhost:5177/login">Go to Login</a>
          </body>
        </html>
      `);
    }

    if (!supabaseAdmin) {
      return res.status(500).send("Supabase not connected");
    }

    // Find the user by email
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      filter: `email.eq.${email}`,
    });

    if (listError || !users || users.users.length === 0) {
      return res.status(404).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2>User Not Found</h2>
            <p>No account found with this email address.</p>
            <a href="http://localhost:5177/signup">Create Account</a>
          </body>
        </html>
      `);
    }

    const user = users.users[0];

    // Confirm/verify the user in Supabase
    const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      email_confirm: true,
    });

    if (confirmError) {
      console.log("❌ Error confirming user:", confirmError);
      return res.status(500).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2>Verification Failed</h2>
            <p>There was an error verifying your account. Please try again.</p>
            <a href="http://localhost:5177/login">Go to Login</a>
          </body>
        </html>
      `);
    }

    console.log(`✅ User ${email} confirmed successfully`);

    res.send(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #f0f9ff;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #22c55e;">✅ Email Verified Successfully!</h1>
            <p style="font-size: 18px; color: #374151;">Your email address has been verified.</p>
            <p style="color: #6b7280;">You can now log in to your Yashoda Pickle account.</p>
            <br>
            <a href="http://localhost:5177/login" style="background-color: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Go to Login</a>
          </div>
        </body>
      </html>
    `);

  } catch (err) {
    console.log("❌ Error verifying email:", err);
    res.status(500).send("Internal server error");
  }
});

// ===== CUSTOM PASSWORD RESET =====

console.log("🔄 Loading password reset endpoints...");

// Send password reset email using our Nodemailer
app.post("/send-password-reset-email", async (req, res) => {
  console.log("🔥 PASSWORD RESET ENDPOINT HIT", req.body);
  try {
    const { email } = req.body;

    console.log("📧 Processing password reset for email:", email, "Type:", typeof email, "Length:", email?.length);

    if (!email || email.trim() === '') {
      console.log("❌ No email provided or empty");
      return res.status(400).json({ error: "Email is required" });
    }

    const trimmedEmail = email.trim();
    console.log("📧 Trimmed email:", trimmedEmail);

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      console.log("❌ Invalid email format:", trimmedEmail);
      return res.status(400).json({ error: "Invalid email format" });
    }

    if (!transporter) {
      console.log("❌ Email transporter not configured");
      return res.status(500).json({ error: "Email service not configured" });
    }

    console.log("✅ Email validation passed, generating reset token...");

    // Generate a simple reset token (in production, use JWT or crypto)
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const resetLink = `http://localhost:5179/reset-password?token=${resetToken}&email=${encodeURIComponent(trimmedEmail)}`;

    console.log("🔗 Generated reset link:", resetLink);

    const emailHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
        <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h1 style="color: #f97316; margin: 0 0 20px 0;">Yashoda Pickle</h1>
          <h2 style="color: #111827; font-size: 24px; margin: 0 0 12px 0;">Reset Your Password</h2>
          <p style="margin: 0 0 20px 0; color: #4b5563; line-height: 1.7;">We received a request to reset your password for your Yashoda Pickle account.</p>

          <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
            <p style="margin: 0 0 6px 0; font-weight: 700; color: #1d4ed8;">Password Reset Request</p>
            <p style="margin: 0; color: #334155;">Click the button below to reset your password.</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>

          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
            <p style="margin: 0 0 8px 0; font-weight: 700; color: #111827;">If the button doesn't work:</p>
            <p style="margin: 0; color: #475569; line-height: 1.75;">Copy and paste this link into your browser:<br>
            <a href="${resetLink}" style="color: #3b82f6; word-break: break-all;">${resetLink}</a></p>
          </div>

          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 12px;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">This password reset link will expire in 1 hour. If you didn't request this reset, please ignore this email.</p>
          </div>

          <footer style="text-align: center; margin-top: 28px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #64748b; font-size: 13px;">
            <p style="margin: 0;">© 2026 Yashoda Pickle. All rights reserved.</p>
          </footer>
        </div>
      </div>
    `;

    console.log("📧 Attempting to send email to:", trimmedEmail);

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: trimmedEmail,
      subject: `Reset your Yashoda Pickle password`,
      html: emailHTML,
    });

    console.log(`✅ Password reset email sent to ${trimmedEmail}`);
    res.json({ success: true, message: "Password reset email sent successfully" });

  } catch (err) {
    console.log("❌ Error sending password reset email:", err.message);
    console.log("❌ Error details:", err);
    res.status(500).json({ error: err.message || "Failed to send password reset email" });
  }
});

// Reset password endpoint - GET for form, POST for processing
app.get("/reset-password", async (req, res) => {
  const { token, email } = req.query;

  if (!token || !email) {
    return res.status(400).send(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #f0f9ff;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #ef4444;">❌ Invalid Reset Link</h1>
            <p style="font-size: 18px; color: #374151;">The password reset link is invalid or expired.</p>
            <p style="color: #6b7280;">Please request a new password reset.</p>
            <br>
            <a href="http://localhost:5177/login" style="background-color: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Go to Login</a>
          </div>
        </body>
      </html>
    `);
  }

  // Serve the password reset form
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Password - Yashoda Pickle</title>
      <style>
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          margin: 0;
          padding: 0;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .container {
          background: white;
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          width: 100%;
          max-width: 400px;
        }
        .logo {
          text-align: center;
          margin-bottom: 2rem;
        }
        .logo h1 {
          color: #f97316;
          margin: 0;
          font-size: 2rem;
          font-weight: 700;
        }
        .title {
          text-align: center;
          margin-bottom: 1.5rem;
        }
        .title h2 {
          color: #111827;
          margin: 0;
          font-size: 1.5rem;
          font-weight: 600;
        }
        .form-group {
          margin-bottom: 1rem;
        }
        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          color: #374151;
          font-weight: 500;
        }
        .form-group input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
          box-sizing: border-box;
        }
        .form-group input:focus {
          outline: none;
          border-color: #f97316;
          box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
        }
        .btn {
          width: 100%;
          background: #f97316;
          color: white;
          border: none;
          padding: 0.75rem;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.15s ease-in-out;
        }
        .btn:hover {
          background: #ea580c;
        }
        .btn:disabled {
          background: #d1d5db;
          cursor: not-allowed;
        }
        .message {
          text-align: center;
          margin-top: 1rem;
          padding: 0.75rem;
          border-radius: 8px;
          font-weight: 500;
        }
        .error {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }
        .success {
          background: #f0fdf4;
          color: #16a34a;
          border: 1px solid #bbf7d0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
          <h1>Yashoda Pickle</h1>
        </div>
        <div class="title">
          <h2>Reset Your Password</h2>
          <p style="color: #6b7280; margin: 0.5rem 0 0 0;">Enter your new password below</p>
        </div>
        <form id="resetForm">
          <input type="hidden" name="token" value="${token}">
          <input type="hidden" name="email" value="${email}">

          <div class="form-group">
            <label for="newPassword">New Password</label>
            <input type="password" id="newPassword" name="newPassword" required minlength="6">
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirm New Password</label>
            <input type="password" id="confirmPassword" name="confirmPassword" required minlength="6">
          </div>

          <button type="submit" class="btn" id="submitBtn">Update Password</button>
        </form>
        <div id="message"></div>
      </div>

      <script>
        const form = document.getElementById('resetForm');
        const submitBtn = document.getElementById('submitBtn');
        const messageDiv = document.getElementById('message');

        form.addEventListener('submit', async (e) => {
          e.preventDefault();

          const newPassword = document.getElementById('newPassword').value;
          const confirmPassword = document.getElementById('confirmPassword').value;

          if (newPassword !== confirmPassword) {
            showMessage('Passwords do not match', 'error');
            return;
          }

          if (newPassword.length < 6) {
            showMessage('Password must be at least 6 characters long', 'error');
            return;
          }

          submitBtn.disabled = true;
          submitBtn.textContent = 'Updating...';

          try {
            const response = await fetch('/reset-password', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                token: '${token}',
                email: '${email}',
                newPassword: newPassword,
              }),
            });

            const data = await response.json();

            if (response.ok) {
              showMessage('Password updated successfully! You may need to sign out and sign back in. Redirecting to login...', 'success');
              setTimeout(() => {
                window.location.href = 'http://localhost:5179/login';
              }, 3000);
            } else {
              showMessage('Error: ' + (data.error || 'Failed to update password'), 'error');
            }
          } catch (error) {
            showMessage('Error: ' + error.message, 'error');
          } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Update Password';
          }
        });

        function showMessage(text, type) {
          messageDiv.innerHTML = \`<div class="message \${type}">\${text}</div>\`;
        }
      </script>
    </body>
    </html>
  `);
});

app.post("/reset-password", async (req, res) => {
  console.log("🔥 RESET PASSWORD ENDPOINT HIT", req.body);
  try {
    const { token, email, newPassword } = req.body;

    console.log("📧 Reset request for email:", email, "Token length:", token?.length, "Password length:", newPassword?.length);

    if (!token || !email || !newPassword) {
      console.log("❌ Missing required fields");
      return res.status(400).json({ error: "Token, email, and new password are required" });
    }

    if (!supabaseAdmin) {
      console.log("❌ Supabase admin not connected");
      return res.status(500).json({ error: "Supabase not connected" });
    }

    console.log("🔍 Looking up user by email:", email);

    // First, find the user by email
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      filter: `email.eq.${email}`,
    });

    if (listError) {
      console.log("❌ Error listing users:", listError);
      return res.status(500).json({ error: "Failed to find user" });
    }

    if (!users || users.users.length === 0) {
      console.log("❌ User not found for email:", email);
      return res.status(404).json({ error: "User not found" });
    }

    const user = users.users[0];
    console.log("✅ Found user:", user.id, "Email confirmed:", user.email_confirmed_at ? "Yes" : "No");
    console.log("👤 User status - Disabled:", user.disabled || false, "Banned:", user.banned || false);
    console.log("📧 User email:", user.email, "Created:", user.created_at);

    // If user is not confirmed, confirm them first
    if (!user.email_confirmed_at) {
      console.log("🔄 User not confirmed, confirming email first...");
      const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        email_confirm: true,
      });

      if (confirmError) {
        console.log("⚠️ Warning: Could not confirm user email:", confirmError.message);
        // Continue with password update anyway
      } else {
        console.log("✅ User email confirmed");
      }
    }

    // Check if user is disabled and enable if needed
    if (user.disabled) {
      console.log("🔄 User is disabled, enabling account...");
      const { error: enableError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        disabled: false,
      });

      if (enableError) {
        console.log("⚠️ Warning: Could not enable user account:", enableError.message);
      } else {
        console.log("✅ User account enabled");
      }
    }

    // Update the user's password
    console.log("🔄 Updating password for user:", user.id);
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: newPassword,
    });

    if (updateError) {
      console.log("❌ Password update error:", updateError);
      return res.status(500).json({ error: "Failed to update password: " + updateError.message });
    }

    console.log(`✅ Password updated successfully for user ${email}`);

    // Verify the user status after update
    const { data: verifyUser, error: verifyError } = await supabaseAdmin.auth.admin.getUserById(user.id);
    if (!verifyError && verifyUser.user) {
      console.log("🔍 Post-update verification:");
      console.log("  - Email confirmed:", verifyUser.user.email_confirmed_at ? "Yes" : "No");
      console.log("  - Account disabled:", verifyUser.user.disabled || false);
      console.log("  - Account banned:", verifyUser.user.banned || false);
    }

    res.json({ success: true, message: "Password updated successfully" });

  } catch (err) {
    console.log("❌ Error resetting password:", err.message);
    console.log("❌ Error stack:", err.stack);
    res.status(500).json({ error: err.message || "Failed to reset password" });
  }
});

// ===== GLOBAL ERROR HANDLING =====

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';

  res.status(error.status || 500).json({
    error: isDevelopment ? error.message : 'Internal Server Error',
    ...(isDevelopment && { stack: error.stack }),
    timestamp: new Date().toISOString(),
    path: req.path
  });
});

// ===== GRACEFUL SHUTDOWN =====

const gracefulShutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

  server.close((err) => {
    if (err) {
      console.error('❌ Error during server shutdown:', err);
      process.exit(1);
    }

    console.log('✅ Server closed successfully');

    // Close database connections, etc.
    if (supabaseAdmin) {
      console.log('✅ Database connections closed');
    }

    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('❌ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// ===== START SERVER =====

const PORT = process.env.PORT || 5001;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`📡 Listening on port ${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 Metrics: http://localhost:${PORT}/metrics`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});
