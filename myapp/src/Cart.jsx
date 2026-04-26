import { Link } from "react-router-dom";
export default function Cart({ cart = [], setCart }) {
  const totalPrice = cart.reduce((acc, item) => acc + Number(item.price) * item.quantity, 0);

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity <= 0) {
      // Remove item if quantity is 0 or less
      setCart(cart.filter((item) => item.id !== id));
    } else {
      setCart(
        cart.map((item) =>
          item.id === id ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-soft">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Your Cart</h1>
          <p className="text-sm text-slate-500">Review items and proceed to checkout.</p>
        </div>
        <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
          {cart.reduce((total, item) => total + item.quantity, 0)} items
        </span>
      </div>

      {cart.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-600">
          Cart is empty
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {cart.map((item, index) => (
              <div key={index} className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center">
                <img src={item.image} alt={item.name} className="h-24 w-24 rounded-2xl object-cover" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900">{item.name}</h3>
                  <p className="mt-1 text-sm text-slate-600">₹{item.price} each</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="rounded-full bg-slate-200 px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-300 transition"
                  >
                    -
                  </button>
                  <span className="px-3 py-1 text-sm font-semibold text-slate-900">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="rounded-full bg-slate-200 px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-300 transition"
                  >
                    +
                  </button>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-slate-900">₹{item.price * item.quantity}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-500">Total price</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">₹{totalPrice}</p>
            </div>
            <Link className="bg-orange-500 px-6 py-3 text-sm font-semibold text-white rounded-2xl shadow-sm hover:bg-orange-600 transition"
              to="/checkout"
            >
              Proceed to Checkout
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
