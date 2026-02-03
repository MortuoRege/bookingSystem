// app/components/ProvidersPage.jsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBriefcase,
  faUser,
  faCalendar,
  faGrip,
  faRightFromBracket,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import "./admin-unified.css";

function Icon({ name }) {
  if (name === "calendar") return <FontAwesomeIcon icon={faCalendar} />;
  if (name === "grid") return <FontAwesomeIcon icon={faGrip} />;
  if (name === "users") return <FontAwesomeIcon icon={faUser} />;
  if (name === "briefcase") return <FontAwesomeIcon icon={faBriefcase} />;
  if (name === "logout") return <FontAwesomeIcon icon={faRightFromBracket} />;
  if (name === "close") return <FontAwesomeIcon icon={faXmark} />;
  return null;
}

function AppNavLink({ href, icon, children }) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      className={`nav__item ${isActive ? "nav__item--active" : ""}`}
      href={href}
    >
      <span className="nav__icon" aria-hidden="true">
        <Icon name={icon} />
      </span>
      {children}
    </Link>
  );
}

export default function ProvidersPage() {
  const router = useRouter();
  const [staffList, setStaffList] = useState([]);

  async function refreshStaff() {
    const res = await fetch("/api/admin/stats", { cache: "no-store" });
    const data = await res.json();
    setStaffList(data.staffList || []);
  }

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/stats", { cache: "no-store" });
        const data = await res.json();
        setStaffList(data.staffList || []);
      } catch (e) {
        console.error("failed to load admin stats", e);
      }
    })();
  }, []);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    profession: "",
    title: "",
    bio: "",
    email: "",
    password: "",
  });

  // close on Escape
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") setIsAddOpen(false);
    }
    if (isAddOpen) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isAddOpen]);

  function openAdd() {
    setIsAddOpen(true);
  }

  function closeAdd() {
    setIsAddOpen(false);
    setForm((prev) => ({ ...prev, password: "" }));
  }

  function onChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();

    if (
      !form.fullName.trim() ||
      !form.profession.trim() ||
      !form.email.trim() ||
      !form.password.trim()
    ) {
      alert("Please fill in full name, profession, email, and password.");
      return;
    }

    if (form.password.length < 8) {
      alert("Password must be at least 8 characters.");
      return;
    }

    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          specialty: form.profession,
          title: form.title,
          bio: form.bio,
          password: form.password,
        }),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }

      if (!res.ok) {
        alert(data?.error || `Failed: ${res.status}`);
        return;
      }

      await refreshStaff();
      setForm({
        fullName: "",
        profession: "",
        title: "",
        bio: "",
        email: "",
        password: "",
      });
      closeAdd();
    } catch (err) {
      console.error("Network error:", err);
      alert("Network error: could not reach backend.");
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this user?")) return;

    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.error || "Delete failed");
        return;
      }

      setStaffList((prev) => prev.filter((u) => u.id !== id));
    } catch (e) {
      console.error(e);
      alert("Network error");
    }
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <span className="sidebar__brandIcon" aria-hidden="true">
            <Icon name="calendar" />
          </span>
          <span className="sidebar__brandText">BookingSystem</span>
        </div>

        <nav className="nav">
          <AppNavLink href="/admin" icon="grid">
            Dashboard
          </AppNavLink>
          <AppNavLink href="/users" icon="users">
            Users
          </AppNavLink>
          <AppNavLink href="/providers" icon="briefcase">
            Providers
          </AppNavLink>
          <AppNavLink href="/appointments" icon="calendar">
            Appointments
          </AppNavLink>
        </nav>

        <div className="sidebar__spacer" />

        <button
          className="logout"
          type="button"
          onClick={() => router.push("/login")}
        >
          <span className="logout__icon" aria-hidden="true">
            <Icon name="logout" />
          </span>
          Logout
        </button>
      </aside>

      <main className="main" id="providers">
        <div className="pageHeader">
          <h1 className="pageTitle">Providers Management</h1>
          <button className="btn btn--primary" type="button" onClick={openAdd}>
            + Add Provider
          </button>
        </div>

        <div className="list">
          <div className="card usersCard">
            <div className="usersTable">
              <div className="usersRow usersRow--head">
                <div>Name</div>
                <div>Email</div>
                <div>Specialty</div>
                <div>Role</div>
                <div>Actions</div>
              </div>

              {staffList.map((u) => (
                <div className="usersRow" key={u.id}>
                  <div className="cellName">{u.name}</div>
                  <div className="cellEmail">{u.email}</div>
                  <div className="cellSpecialty">{u.specialty || "-"}</div>

                  <div>
                    <span className="pill pill--role">{u.role}</span>
                  </div>

                  <div className="cellActions">
                    <button
                      className="btn btn--danger"
                      type="button"
                      onClick={() => handleDelete(u.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {isAddOpen && (
          <div className="modalOverlay" onClick={closeAdd} role="presentation">
            <div
              className="modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="addProviderTitle"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modalHeader">
                <h2 className="modalTitle" id="addProviderTitle">
                  Add Provider
                </h2>
                <button
                  className="iconBtn"
                  type="button"
                  onClick={closeAdd}
                  aria-label="Close"
                >
                  <Icon name="close" />
                </button>
              </div>

              <form className="modalBody" onSubmit={onSubmit}>
                <div className="field">
                  <label className="fieldLabel" htmlFor="fullName">
                    Full name
                  </label>
                  <input
                    id="fullName"
                    className="input"
                    name="fullName"
                    value={form.fullName}
                    onChange={onChange}
                    placeholder="Dr Sarah Johnson"
                    autoComplete="name"
                  />
                </div>

                <div className="field">
                  <label className="fieldLabel" htmlFor="profession">
                    Specialty
                  </label>
                  <input
                    id="profession"
                    className="input"
                    name="profession"
                    value={form.profession}
                    onChange={onChange}
                    placeholder="Cardiology"
                  />
                </div>

                <div className="field">
                  <label className="fieldLabel" htmlFor="title">
                    Title (Optional)
                  </label>
                  <input
                    id="title"
                    className="input"
                    name="title"
                    value={form.title}
                    onChange={onChange}
                    placeholder="MD, PhD"
                  />
                </div>

                <div className="field">
                  <label className="fieldLabel" htmlFor="bio">
                    Bio (Optional)
                  </label>
                  <textarea
                    id="bio"
                    className="input"
                    name="bio"
                    value={form.bio}
                    onChange={onChange}
                    placeholder="Brief description of experience and expertise..."
                    rows="4"
                  />
                </div>

                <div className="field">
                  <label className="fieldLabel" htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    className="input"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={onChange}
                    placeholder="sarah@example.com"
                    autoComplete="email"
                  />
                </div>

                <div className="field field--password">
                  <label className="fieldLabel" htmlFor="password">
                    Password
                  </label>
                  <input
                    id="password"
                    className="input"
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={onChange}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                  />
                </div>

                <div className="modalActions">
                  <button className="btn" type="button" onClick={closeAdd}>
                    Cancel
                  </button>
                  <button className="btn btn--primary" type="submit">
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
