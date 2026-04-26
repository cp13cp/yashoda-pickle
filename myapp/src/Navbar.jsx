import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { Link, useNavigate } from "react-router-dom";

export default function Navbar({ cart = [] }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("🔄 Auth state changed:", _event, session?.user?.email || "No user");
      setUser(session?.user || null);

      if (session?.user) {
        const adminEmails = ["admin@yashodapickle.com", "admin@example.com", "your-email@example.com", "singhchandrapal13@gmail.com"];
        const userIsAdmin = adminEmails.includes(session.user.email) || session.user.user_metadata?.role === "admin";
        setIsAdmin(userIsAdmin);
      } else {
        setIsAdmin(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.log("🔍 Auth check error:", error.message);
        setUser(null);
        setIsAdmin(false);
        return;
      }
      setUser(data.user);

      // Check if user is admin
      if (data.user) {
        const adminEmails = ["admin@yashodapickle.com", "admin@example.com", "your-email@example.com", "singhchandrapal13@gmail.com"];
        const userIsAdmin = adminEmails.includes(data.user.email) || data.user.user_metadata?.role === "admin";
        setIsAdmin(userIsAdmin);
      } else {
        setIsAdmin(false);
      }
    } catch (err) {
      console.log("🔍 Auth check exception:", err.message);
      setUser(null);
      setIsAdmin(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const userName = user
    ? user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0]
    : null;

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg shadow-md border-b">
      <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">

        {/* Logo */}
        <Link
          to="/"
          className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent"
        >
          🥭 Yashoda Pickle
        </Link>

        {/* Menu */}
        <div className="hidden md:flex items-center gap-6">
          <Link className="hover:text-orange-500 transition" to="/">
            Products
          </Link>

          <Link className="relative inline-flex items-center gap-1 hover:text-orange-500 transition" to="/cart">
            <span className="text-lg">🛒</span>
            Cart
            {cart.length > 0 && (
              <span className="absolute -right-3 -top-2 inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-red-500 px-2 text-xs font-semibold text-white">
                {cart.reduce((total, item) => total + item.quantity, 0)}
              </span>
            )}
          </Link>

          {user && (
            <>
              <span className="hidden md:inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-sm font-medium text-orange-700">
                Hello, {userName}
              </span>
              <Link className="hover:text-orange-500 transition" to="/orders">
                📦 Orders
              </Link>
              <Link className="hover:text-orange-500 transition" to="/profile">
                👤 Profile
              </Link>
            </>
          )}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {!user ? (
            <>
              <Link
                to="/signup"
                className="px-4 py-2 rounded-full border hover:bg-gray-100 transition"
              >
                Signup
              </Link>

              <Link
                to="/login"
                className="px-4 py-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white shadow hover:scale-105 transition"
              >
                Login
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/dashboard"
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 transition"
              >
                <span className="text-base">👤</span> Dashboard
              </Link>

              {/* Admin link - only show for admin users */}
              {isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 hover:bg-purple-200 transition"
                >
                  <span className="text-base">⚙️</span> Admin
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition"
              >
                <span className="text-base">↩</span> Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}