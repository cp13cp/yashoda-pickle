import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { Link } from "react-router-dom";

export default function Products({ cart, setCart }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase.from("pickle").select("*");

    if (error) {
      console.log(error);
    } else {
      setProducts(data);
    }
  };

  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        // Increase quantity if item already exists
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        // Add new item with quantity 1
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-semibold text-slate-900">Our Products</h1>
          <p className="mt-2 text-sm text-slate-600">Browse fresh picks and add your favorites to the cart.</p>
        </div>
        <Link className="relative inline-flex items-center gap-1 hover:text-orange-500 transition"
          to="/cart"
          className="inline-flex items-center justify-center rounded-2xl bg-brand px-5 py-3 text-sm font-semibold text-black shadow-sm hover:bg-brand-dark transition"
        >
          Cart Items: {cart.reduce((total, item) => total + item.quantity, 0)}
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {products.map((item) => (
          <div key={item.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <img src={item.image} alt={item.name} className="mx-auto h-40 w-40 object-contain" />
            <h2 className="mt-5 text-xl font-semibold text-slate-900">{item.name}</h2>
            <p className="mt-2 text-lg font-semibold text-brand">₹{item.price}</p>
            <button
              type="button"
              onClick={() => addToCart(item)}
              className="mt-5 w-full rounded-2xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
