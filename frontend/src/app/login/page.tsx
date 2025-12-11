"use client";

import Link from "next/link";

import { useState } from "react";

export default function LoginForm() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  setLoading(true);

  try {
    const res = await fetch("http://localhost:3001/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || data.error || "Login failed");
    }

    // THIS IS THE ONLY PART YOU NEED
    const position = (data.data?.user?.position || data.data?.position || "employee").toLowerCase();

    const redirectMap: Record<string, string> = {
      superadmin: "/admin/dashboard",
      vehicleadmin: "/admin/dashboard",
      manager: "/manager/dashboard",
      hod: "/hod/dashboard",
      employee: "/employee/dashboard",
      driver: "/driver/dashboard",
    };

    const redirectTo = redirectMap[position] || "/dashboard";
    
    // FULL RELOAD → SESSION IS RECOGNIZED → NO 404
    window.location.href = redirectTo;

  } catch (err) {
    console.error(err)
    setError( "Invalid email or password");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="max-w-md mx-auto p-8 rounded-lg shadow-md border dark:border-gray-800 border-gray-200">
      <h1 className="text-2xl font-bold mb-6 text-sky-400 text-center">
        Login to TMS
      </h1>

      {error && (
        <p className="mb-4 text-sm text-red-500 text-center bg-red-50 p-3 rounded">
          {error}
        </p>
      )}

      <form onSubmit={handleLogin}>
        <div>
          <label className="block text-sm font-medium dark:text-gray-100">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-3 block w-full rounded-md border border-gray-500 shadow-sm text-xs p-3 dark:text-gray-400 mb-5"
            placeholder="admin@fleet.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium dark:text-gray-100">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-3 block w-full rounded-md border border-gray-500 shadow-sm text-xs p-3 dark:text-gray-400"
            placeholder="••••••••"
          />
        </div>

        <div className="flex items-center justify-between mt-4 text-xs dark:text-gray-100">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
            />
            <label
              htmlFor="rememberMe"
              className="text-sm text-gray-600 cursor-pointer"
            >
              Remember me
            </label>
          </div>
          <Link
            href="/forgot-password"
            className="text-blue-500 hover:underline"
          >
            Forgot Password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent bg-sky-600 rounded-2xl mt-5 text-black font-bold cursor-pointer disabled:opacity-70"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
