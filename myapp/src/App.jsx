import React, { useState, useEffect, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";

import ErrorBoundary from "./components/ErrorBoundary";
import Signup from "./Signup";
import Login from "./Login";
import ResetPassword from "./ResetPassword";
import Protected from "./Protected";
import Navbar from "./Navbar";
import Products from "./Product";
import Cart from "./Cart";
import Checkout from "./Checkout";

// Lazy loaded components
const LazyAdmin = lazy(() => import("./Admin"));
const LazyOrderTracking = lazy(() => import("./OrderTracking"));
const LazyProfile = lazy(() => import("./Profile"));

// Loading component
function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
    </div>
  );
}

function Dashboard() {
  return <h2>Dashboard</h2>;
}

function App() {
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem("cart");
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error("Error loading cart:", error);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("cart", JSON.stringify(cart));
    } catch (error) {
      console.error("Error saving cart:", error);
    }
  }, [cart]);

  return (
    <ErrorBoundary>
      <HelmetProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-slate-50 text-slate-900">
            <Navbar cart={cart} />

            <main className="mx-auto max-w-6xl px-4 py-8 lg:px-6">
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  <Route path="/" element={<Products cart={cart} setCart={setCart} />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/cart" element={<Cart cart={cart} setCart={setCart} />} />

                  <Route
                    path="/checkout"
                    element={
                      <Protected>
                        <Checkout cart={cart} setCart={setCart} />
                      </Protected>
                    }
                  />

                  <Route
                    path="/orders"
                    element={
                      <Protected>
                        <LazyOrderTracking />
                      </Protected>
                    }
                  />

                  <Route
                    path="/profile"
                    element={
                      <Protected>
                        <LazyProfile />
                      </Protected>
                    }
                  />

                  <Route
                    path="/admin"
                    element={
                      <Protected>
                        <LazyAdmin />
                      </Protected>
                    }
                  />

                  <Route
                    path="/dashboard"
                    element={
                      <Protected>
                        <Dashboard />
                      </Protected>
                    }
                  />
                </Routes>
              </Suspense>
            </main>
          </div>
        </BrowserRouter>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;