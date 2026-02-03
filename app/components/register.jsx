// app/components/register.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "./register.css";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const trimmedFullName = fullName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedFullName || !trimmedEmail || !password) {
      setError("All fields are required.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          fullName: trimmedFullName, 
          email: trimmedEmail, 
          password 
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Registration failed.");
        return;
      }

      // Success - redirect to login
      router.push("/login");
    } catch (err) {
      console.error("Registration error:", err);
      setError("Network error. Is the server running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="register-page">
      <div className="register-card">
        <h1 className="register-title">Create Your Account</h1>

        <form className="register-form" onSubmit={handleSubmit}>
          <label className="register-label" htmlFor="fullName">
            Full Name
          </label>
          <input
            id="fullName"
            className="register-input"
            type="text"
            placeholder="John Doe"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          <label className="register-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className="register-input"
            type="email"
            placeholder="your@email.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label className="register-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className="register-input"
            type="password"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="register-error">{error}</p>}

          <button className="register-btn" type="submit" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="register-login">
          Already have an account?{" "}
          <Link className="register-link-btn" href="/login">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
