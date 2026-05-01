import { useState, useEffect } from "react";
import { api } from "./api";
import { supabase } from "./supabase";

export default function Checkout({ cart = [], setCart }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("online");
  const [user, setUser] = useState(null);

  useEffect(() => {
    getUser();
  }, []);

  const getUser = async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
    if (data.user?.user_metadata?.name) {
      setName(data.user.user_metadata.name);
    }
  };

  const totalPrice = cart.reduce((acc, item) => acc + Number(item.price) * item.quantity, 0);

  const handlePayment = async () => {
    if (!name || !address) {
      alert("Please fill all details");
      return;
    }

    if (cart.length === 0) {
      alert("Cart is empty");
      return;
    }

    if (paymentMethod === "cod") {
      // Handle Cash on Delivery
      await placeOrder("cod");
    } else {
      // Handle Online Payment
      try {
        const { data } = await api.post("/create-order", {
          amount: totalPrice,
        });

        const options = {
          key: "rzp_live_SgsseL3ELLbhT6",
          amount: data.amount,
          currency: "INR",
          name: "Yashoda Pickle",
          description: "Order Payment",
          order_id: data.id,
          handler: async function (response) {
            alert("Payment Successful!");
            console.log("Payment:", response);
            await placeOrder("online", response.razorpay_payment_id);
          },
          prefill: {
            name: name,
          },
          theme: {
            color: "#4338ca",
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch (error) {
        console.log(error);
        alert("Payment failed");
      }
    }
  };

  const placeOrder = async (method, paymentId = null) => {
    try {
      const orderData = {
        user_name: name || user?.email,
        user_email: user?.email,
        address: address,
        items: cart,
        total: totalPrice,
        payment_method: method,
        payment_id: paymentId,
        status: method === "cod" ? "pending" : "paid",
      };

      console.log("📦 Sending order data:", orderData);

      const response = await api.post("/place-order", orderData);
      if (response.status === 200) {
        alert("Order placed successfully!");
        setCart([]);
      }
    } catch (error) {
      console.error("❌ Order placement failed:", error);
      const errorMessage = error.response?.data?.error || error.message || "Failed to place order";
      alert(`Error: ${errorMessage}`);
    }
  };

  return (
    <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-soft">
      <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Checkout</h1>
          <p className="mt-2 text-sm text-slate-500">Review your order and complete the payment.</p>

          {cart.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-600">
              Cart is empty
            </div>
          ) : (
            <div className="mt-8 space-y-4">
              {cart.map((item, index) => (
                <div key={index} className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <img src={item.image} alt={item.name} className="h-20 w-20 rounded-2xl object-cover" />
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{item.name}</h3>
                    <p className="mt-1 text-sm text-slate-600">₹{item.price}</p>
                  </div>
                </div>
              ))}
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">Order total</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">₹{totalPrice}</p>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-xl font-semibold text-slate-900">Shipping details</h2>
          <p className="mt-2 text-sm text-slate-600">Enter your name and delivery address.</p>

          <div className="mt-6 space-y-4">
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <textarea
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
              placeholder="Delivery address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={5}
            />

            <div>
              <h3 className="text-lg font-semibold text-slate-900">Payment Method</h3>
              <div className="mt-2 space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="online"
                    checked={paymentMethod === "online"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-2"
                  />
                  Online Payment (Razorpay)
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="cod"
                    checked={paymentMethod === "cod"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-2"
                  />
                  Cash on Delivery
                </label>
              </div>
            </div>

            <button
              onClick={handlePayment}
              className="w-full rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark transition"
            >
              {paymentMethod === "cod" ? "Place Order" : "Pay Now"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
