import { useEffect, useState } from "react";
import axios from "axios";
import { supabase } from "./supabase";
import { useNavigate } from "react-router-dom";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  confirmed: "bg-blue-100 text-blue-800 border-blue-300",
  shipped: "bg-purple-100 text-purple-800 border-purple-300",
  delivered: "bg-green-100 text-green-800 border-green-300",
  cancelled: "bg-red-100 text-red-800 border-red-300",
  paid: "bg-green-100 text-green-800 border-green-300",
};

const statusSteps = ["pending", "confirmed", "shipped", "delivered"];

export default function Profile() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersMessage, setOrdersMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    loadUser();
  }, []);

  const fetchOrders = async (userEmail) => {
    if (!userEmail) return;
    setOrdersLoading(true);
    setOrdersMessage("");

    try {
      const response = await axios.get(
        `http://localhost:5000/orders?user_email=${encodeURIComponent(userEmail)}`
      );
      const orderData = response.data || [];
      setOrders(orderData.map((order) => ({
        ...order,
        items: order.items || [],
      })));
    } catch (error) {
      console.error("Failed to load order history:", error);
      setOrdersMessage("Unable to load order history. Please try again later.");
    } finally {
      setOrdersLoading(false);
    }
  };

  const loadUser = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (!data.user) {
      navigate("/login");
      return;
    }

    setUser(data.user);
    setEmail(data.user.email || "");
    setName(data.user.user_metadata?.full_name || data.user.user_metadata?.name || "");
    setPhone(data.user.user_metadata?.phone || "");
    setLoading(false);
    fetchOrders(data.user.email);
  };

  const handleUpdateProfile = async () => {
    setMessage("");
    setLoading(true);

    const updates = {
      email,
      data: {
        full_name: name,
        phone,
      },
    };

    if (newPassword) {
      updates.password = newPassword;
    }

    const { error } = await supabase.auth.updateUser(updates);

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Profile updated successfully.");
      setNewPassword("");
      await loadUser();
    }

    setLoading(false);
  };

  const getStatusIndex = (status) => statusSteps.indexOf(status);

  const cancelOrder = async (orderId) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;

    setOrdersMessage("");
    try {
      const response = await axios.post(`http://localhost:5000/orders/${orderId}/cancel`);
      const updatedOrder = response.data.order;
      setOrders((prev) => prev.map((order) => (order.id === orderId ? updatedOrder : order)));
      setOrdersMessage("Order cancelled. Admin has been notified.");
    } catch (error) {
      console.error("Failed to cancel order:", error);
      setOrdersMessage(
        error.response?.data?.error || error.message || "Unable to cancel order."
      );
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-soft">
          <p className="text-lg font-medium text-slate-700">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-soft">
      <div className="mb-8 flex flex-col gap-3">
        <h1 className="text-3xl font-semibold text-slate-900">My Profile</h1>
        <p className="text-sm text-slate-500">
          Manage your account information, email, password, and contact details.
        </p>
      </div>

      {message && (
        <div className="mb-6 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
          {message}
        </div>
      )}

      <div className="grid gap-6">
        <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-xl font-semibold text-slate-900">Account details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-700">
              <span>Full Name</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
              />
            </label>

            <label className="space-y-2 text-sm text-slate-700">
              <span>Email</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                type="email"
              />
            </label>

            <label className="space-y-2 text-sm text-slate-700">
              <span>Phone</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number"
                type="tel"
              />
            </label>

            <label className="space-y-2 text-sm text-slate-700">
              <span>New password</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Leave blank to keep current password"
                type="password"
              />
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Profile actions</h3>
            <p className="text-sm text-slate-500">Save your updated information to keep your account current.</p>
          </div>
          <button
            onClick={handleUpdateProfile}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Saving..." : "Save changes"}
          </button>
        </div>

        <div className="mt-10 rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Order history</h2>
              <p className="text-sm text-slate-500">Track your past orders and cancel eligible orders from your profile.</p>
            </div>
            {ordersLoading && (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-700">
                Loading orders...
              </span>
            )}
          </div>

          {ordersMessage && (
            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {ordersMessage}
            </div>
          )}

          {orders.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
              <p className="text-lg font-medium">No orders found yet.</p>
              <p className="mt-2 text-sm">Once you place an order, it will appear here.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => {
                const canCancel = !["cancelled", "delivered", "shipped"].includes(order.status);
                return (
                  <div key={order.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-slate-900">Order #{order.id}</h3>
                        <p className="mt-1 text-sm text-slate-500">{new Date(order.created_at).toLocaleString()}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`rounded-full border px-4 py-1 text-sm font-semibold capitalize ${
                          order.status === "cancelled"
                            ? "border-red-200 bg-red-50 text-red-700"
                            : order.status === "delivered"
                            ? "border-green-200 bg-green-50 text-green-700"
                            : "border-blue-200 bg-blue-50 text-blue-700"
                        }`}>
                          {order.status}
                        </span>
                        <span className="text-sm font-semibold text-slate-900">₹{order.total}</span>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-600">Payment</p>
                        <p className="mt-1 text-slate-900 capitalize">{order.payment_method === "cod" ? "Cash on Delivery" : "Online Payment"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-600">Address</p>
                        <p className="mt-1 text-slate-900">{order.address}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-600">Items</p>
                        <p className="mt-1 text-slate-900">{order.items?.length || 0} items</p>
                      </div>
                    </div>

                    <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                          <span>Order status timeline</span>
                          <span className="capitalize text-slate-900">{order.status}</span>
                        </div>
                        <div className="space-y-3">
                          {statusSteps.map((step, index) => (
                            <div key={step} className="flex items-center gap-4">
                              <div
                                className={`flex h-10 w-10 items-center justify-center rounded-full border ${
                                  getStatusIndex(order.status) >= index
                                    ? "border-green-500 bg-green-500 text-white"
                                    : "border-slate-300 bg-white text-slate-500"
                                }`}
                              >
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-semibold capitalize text-slate-900">{step}</p>
                                <div className="h-2 rounded-full bg-slate-200">
                                  <div
                                    className={`h-2 rounded-full ${
                                      getStatusIndex(order.status) > index ? "bg-green-500" : "bg-slate-200"
                                    }`}
                                    style={{ width: getStatusIndex(order.status) > index ? "100%" : "0%" }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {order.items?.length > 0 && (
                      <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
                        <div className="grid grid-cols-3 gap-4 border-b border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 sm:grid-cols-4">
                          <div>Item</div>
                          <div className="text-center">Qty</div>
                          <div className="text-right">Price</div>
                          <div className="text-right">Total</div>
                        </div>
                        <div className="space-y-2 p-4">
                          {order.items.map((item, index) => (
                            <div key={index} className="grid grid-cols-3 gap-4 text-sm text-slate-800 sm:grid-cols-4">
                              <div>{item.name}</div>
                              <div className="text-center">{item.quantity}</div>
                              <div className="text-right">₹{item.price}</div>
                              <div className="text-right">₹{item.quantity * item.price}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm text-slate-600">
                        <p>Order placed by <strong>{order.user_name || order.user_email || user.email}</strong></p>
                      </div>
                      <button
                        onClick={() => cancelOrder(order.id)}
                        disabled={!canCancel}
                        className="inline-flex items-center justify-center rounded-full bg-red-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                      >
                        {canCancel ? "Cancel order" : "Cannot cancel"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
