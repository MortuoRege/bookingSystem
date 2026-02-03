// app/login/page.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "./login.css";

export default function Page() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      // after res.json()
      localStorage.setItem("user", JSON.stringify(data.user));

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      const role = data?.user?.role;
      if (role === "admin") {
        router.push("/admin");
      } else if (role === "staff") {
        router.push("/staff");
      } else {
        router.push("/user");
      }
    } catch {
      setError("Network error. Is the server running?");
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">Login to Your Account</h1>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className="login-input"
            type="email"
            placeholder="your@email.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label className="login-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className="login-input"
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="login-error">{error}</p>}

          <button className="login-primary-btn" type="submit">
            Login
          </button>
        </form>

        <p className="login-register">
          Don&apos;t have an account?{" "}
          <Link className="login-link-btn" href="/register">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
