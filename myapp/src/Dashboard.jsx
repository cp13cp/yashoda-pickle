import { api } from "./api";

const handlePayment = async () => {
  // 1. Backend se order lo
  const { data } = await api.post("/create-order", {
    amount: totalPrice,
  });

  // 2. Razorpay open karo
  const options = {
    key: "rzp_test_Sg4oblJYKlEXv6",
    amount: data.amount,
    currency: "INR",
    name: "Yashoda Pickle",
    description: "Order Payment",
    order_id: data.id,

    handler: async function (response) {
      alert("Payment Successful 🎉");

      // 👉 yahan Supabase me order save karo
    },

    prefill: {
      name: "Customer",
      email: "test@gmail.com",
    },
  };

  const rzp = new window.Razorpay(options);
  rzp.open();
};