import { useState } from "react";
import { supabase } from "./supabase";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const navigate = useNavigate();

  const handleSignup = async () => {
    if (!name || !email || !phone || !password) {
      alert("Please enter your name, email, phone number, and password.");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          phone,
        },
        // Disable Supabase email confirmation since we handle it ourselves
        emailRedirectTo: undefined
      },
    });

    if (error) {
      alert(error.message);
    } else {
      // Send our custom verification email
      await handleResendConfirmation();
      alert("Account created successfully! Please check your email to verify your account.");
      navigate("/login");
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      alert("Please enter your email address first.");
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/send-verification-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          name: name
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Verification email sent! Please check your inbox and spam folder.");
      } else {
        alert("Error sending verification email: " + data.error);
      }
    } catch (error) {
      alert("Error sending verification email: " + error.message);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-soft">
      <h2 className="text-3xl font-semibold text-slate-900">Create your account</h2>
      <p className="mt-2 text-sm text-slate-500">Signup with your name, email, and phone.</p>

      <div className="mt-8 space-y-4">
        <input
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
          onChange={(e) => setName(e.target.value)}
          placeholder="Full Name"
          value={name}
        />
        <input
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          value={email}
        />
        <input
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone Number"
          value={phone}
          type="tel"
        />
        <input
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
          value={password}
        />
        <button
          onClick={handleSignup}
          className="w-full rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark transition"
        >
          Signup
        </button>
        <button
          type="button"
          onClick={handleResendConfirmation}
          className="w-full rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 transition hover:bg-blue-100 mt-3"
        >
          Resend Confirmation Email
        </button>
      </div>
    </div>
  );
}
