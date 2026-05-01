import { useState, useEffect } from "react";
import { api } from "./api";
import { supabase } from "./supabase";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  confirmed: "bg-blue-100 text-blue-800 border-blue-300",
  shipped: "bg-purple-100 text-purple-800 border-purple-300",
  delivered: "bg-green-100 text-green-800 border-green-300",
  cancelled: "bg-red-100 text-red-800 border-red-300",
  paid: "bg-green-100 text-green-800 border-green-300",
};

const statusSteps = ["pending", "confirmed", "shipped", "delivered"];

export default function OrderTracking() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const getUser = async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/orders?user_email=${encodeURIComponent(user?.email)}`
      );
      setOrders(response.data || []);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      alert("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIndex = (status) => statusSteps.indexOf(status);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg text-slate-600">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-soft">
      <h1 className="text-3xl font-semibold text-slate-900">Order Tracking</h1>
      <p className="mt-2 text-sm text-slate-500">View and track your orders</p>

      {orders.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-600">
          <p className="text-lg font-medium">No orders found</p>
          <p className="mt-2 text-sm">You haven't placed any orders yet</p>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-6"
            >
              {/* Order Header */}
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Order #{order.id}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {new Date(order.created_at).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-slate-900">
                    ₹{order.total}
                  </div>
                  <span
                    className={`mt-2 inline-block rounded-full border px-4 py-1 text-sm font-semibold capitalize ${
                      statusColors[order.status] || statusColors.pending
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="mt-6">
                <div className="flex justify-between">
                  {statusSteps.map((step, index) => (
                    <div key={step} className="flex flex-col items-center">
                      <div
                        className={`h-12 w-12 rounded-full flex items-center justify-center font-semibold ${
                          getStatusIndex(order.status) >= index
                            ? "bg-green-500 text-white"
                            : "bg-slate-300 text-slate-600"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <p className="mt-2 text-xs font-medium capitalize text-slate-700">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  {statusSteps.map((_, index) => (
                    <div
                      key={index}
                      className={`h-1 flex-1 rounded-full ${
                        getStatusIndex(order.status) > index
                          ? "bg-green-500"
                          : "bg-slate-300"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Order Details */}
              <div className="mt-6 border-t border-slate-300 pt-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-600">
                      Delivery Address
                    </p>
                    <p className="mt-1 text-slate-900">{order.address}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-600">
                      Payment Method
                    </p>
                    <p className="mt-1 capitalize text-slate-900">
                      {order.payment_method === "cod"
                        ? "Cash on Delivery"
                        : "Online Payment"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-600">
                      Items
                    </p>
                    <p className="mt-1 text-slate-900">
                      {order.items?.length || 0} items
                    </p>
                  </div>
                </div>

                {/* Items List */}
                {order.items && order.items.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold text-slate-900">Items</h3>
                    <div className="mt-3 space-y-2">
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between rounded-lg bg-white p-3"
                        >
                          <span className="text-slate-700">{item.name}</span>
                          <span className="text-slate-900">
                            {item.quantity}x ₹{item.price}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
