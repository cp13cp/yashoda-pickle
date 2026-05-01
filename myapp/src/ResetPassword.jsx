import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (!token || !email) {
      setMessage("Invalid password reset link. Please request a new reset email.");
    } else {
      setMessage("Please enter your new password.");
    }
  }, [searchParams]);

  const handlePasswordUpdate = async () => {
    if (!newPassword) {
      alert("Please enter your new password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }

    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (!token || !email) {
      alert("Invalid reset link. Please request a new password reset.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(buildUrl("/reset-password"), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          email: email,
          newPassword: newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Password updated successfully! Please login with your new password.");
        navigate("/login");
      } else {
        alert("Error updating password: " + data.error);
      }
    } catch (error) {
      alert("Error updating password: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-soft">
      <h2 className="text-3xl font-semibold text-slate-900">Reset Password</h2>
      <p className="mt-3 text-sm text-slate-500">{message}</p>
      <div className="mt-8 space-y-4">
        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        <input
          type="password"
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        <button
          type="button"
          onClick={handlePasswordUpdate}
          disabled={loading}
          className="w-full rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </div>
    </div>
  );
}
