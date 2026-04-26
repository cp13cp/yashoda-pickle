import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetMode, setResetMode] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const type = searchParams.get("type");
    const accessToken = searchParams.get("access_token");

    if ((type === "recovery" || type === "password_recovery") && accessToken) {
      setResetMode(true);
    }
  }, [searchParams]);

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Login successful");
      navigate("/");
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      alert("Please enter your email to reset your password.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });

    if (error) alert(error.message);
    else alert("Password reset email sent. Check your inbox.");
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      alert("Please enter your email address first.");
      return;
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });

    if (error) {
      alert("Error resending confirmation email: " + error.message);
    } else {
      alert("Confirmation email sent! Please check your inbox and spam folder.");
    }
  };

  const handlePasswordUpdate = async () => {
    if (!newPassword) {
      alert("Please enter your new password.");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      alert(error.message);
    } else {
      alert("Password updated successfully. Please login with your new password.");
      navigate("/login");
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-soft">
      <h2 className="text-3xl font-semibold text-slate-900">Welcome back</h2>
      <p className="mt-2 text-sm text-slate-500">Login to continue to your account.</p>

      {resetMode ? (
        <div className="mt-8 space-y-4">
          <p className="text-sm text-slate-600">Enter a new password to complete the reset.</p>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New Password"
            type="password"
            value={newPassword}
          />
          <button
            type="button"
            onClick={handlePasswordUpdate}
            className="w-full rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark transition"
          >
            Update Password
          </button>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          <input
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            value={email}
          />
          <input
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            value={password}
          />
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleLogin}
              className="flex-1 rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark transition"
            >
              Login
            </button>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-100"
            >
              Forgot Password
            </button>
          </div>
          <button
            type="button"
            onClick={handleResendConfirmation}
            className="w-full rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 transition hover:bg-blue-100 mt-3"
          >
            Resend Confirmation Email
          </button>
        </div>
      )}
    </div>
  );
}
