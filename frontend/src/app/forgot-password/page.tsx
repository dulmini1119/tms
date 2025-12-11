"use client";
import { useState } from "react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState(1); // 1 = email, 2 = OTP
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setMessage("");

    const res = await fetch("http://localhost:3001/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    if (!res.ok) return setError(data.error?.message || "Failed");

    setMessage("OTP sent to your email!");
    setStep(2);
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setMessage("");

    const res = await fetch("http://localhost:3001/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp, newPassword }),
    });

    const data = await res.json();
    if (!res.ok) return setError(data.error?.message || "Failed");

    setMessage("Password reset successful! Redirecting to login...");
    setTimeout(() => (window.location.href = "/login"), 2000);
  };

  return (
    <div className="max-w-md mx-auto p-8 mt-20 bg-white dark:bg-gray-800 rounded-lg shadow-lg transition-colors duration-300">
      <h1 className="text-2xl font-bold text-center mb-8 text-sky-600 dark:text-sky-400">
        {step === 1 ? "Forgot Password" : "Enter OTP"}
      </h1>

      {error && (
        <p className="text-red-500 text-center bg-red-50 dark:bg-red-900 dark:text-red-300 p-3 rounded transition-colors duration-300">
          {error}
        </p>
      )}
      {message && (
        <p className="text-green-600 text-center bg-green-50 dark:bg-green-900 dark:text-green-300 p-3 rounded transition-colors duration-300">
          {message}
        </p>
      )}

      {step === 1 ? (
        <form onSubmit={sendOtp} className="space-y-6">
          <input
            type="email"
            placeholder="Enter your company email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400 transition-colors duration-300"
          />
          <button
            type="submit"
            className="w-full bg-sky-600 dark:bg-sky-500 text-white py-3 rounded-lg font-bold hover:bg-sky-700 dark:hover:bg-sky-600 transition-colors duration-300"
          >
            Send OTP
          </button>
        </form>
      ) : (
        <form onSubmit={resetPassword} className="space-y-6">
          <input
            type="text"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            maxLength={6}
            className="w-full p-3 border rounded-lg text-center text-2xl tracking-widest bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 transition-colors duration-300"
          />
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 transition-colors duration-300"
          />
          <button
            type="submit"
            className="w-full bg-green-600 dark:bg-green-500 text-white py-3 rounded-lg font-bold hover:bg-green-700 dark:hover:bg-green-600 transition-colors duration-300"
          >
            Reset Password
          </button>
        </form>
      )}

      <p className="text-center mt-6 text-gray-700 dark:text-gray-300">
        <a href="/login" className="text-sky-600 dark:text-sky-400 hover:underline">
          Back to Login
        </a>
      </p>
    </div>
  );
}
