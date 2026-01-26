// app/register/page.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "./register.css";

export default function RegisterPage() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "end_user",
  });

  const [error, setError] = useState("");
  const router = useRouter();

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Register failed");
        return;
      }

      router.push("/login");
    } catch {
      setError("Network error. Is the server running?");
    }
  }

  return (
    <div className="register-page">
      <div
        className="register-card"
        role="region"
        aria-label="Create an account"
      >
        <h1 className="register-title">Create an Account</h1>

        <form className="register-form" onSubmit={handleRegister}>
          <div className="form-group">
            <label className="label" htmlFor="fullName">
              Full Name
            </label>
            <input
              className="input"
              id="fullName"
              name="fullName"
              type="text"
              placeholder="John Doe"
              value={form.fullName}
              onChange={handleChange}
              autoComplete="name"
              required
            />
          </div>

          <div className="form-group">
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              className="input"
              id="email"
              name="email"
              type="email"
              placeholder="your@email.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              className="input"
              id="password"
              name="password"
              type="password"
              placeholder="At least 6 characters"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>

          {error && <p className="error-text">{error}</p>}

          <button className="button" type="submit">
            Register
          </button>
        </form>

        <p className="login-text">
          Already have an account?{" "}
          <Link className="login-link" href="/login">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
