// app/components/UsersPage.jsx
"use client";

import React, { useEffect, useState } from "react";
import { apiGet, apiPost, apiDelete } from "../../lib/api-client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBriefcase,
  faUser,
  faCalendar,
  faGrip,
  faRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";
import "./admin-unified.css";

function Icon({ name }) {
  if (name === "calendar") return <FontAwesomeIcon icon={faCalendar} />;
  if (name === "grid") return <FontAwesomeIcon icon={faGrip} />;
  if (name === "users") return <FontAwesomeIcon icon={faUser} />;
  if (name === "briefcase") return <FontAwesomeIcon icon={faBriefcase} />;
  if (name === "logout") return <FontAwesomeIcon icon={faRightFromBracket} />;
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

export default function UsersPage() {
  const router = useRouter();
  const [userList, setUserList] = useState([]);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
  });

  // Proper logout handler that clears both cookie and localStorage
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout API call failed:", err);
    }
    localStorage.removeItem("user");
    router.push("/login");
  };

  async function refreshUsers() {
    const res = await fetch("/api/admin/stats", { cache: "no-store" });
    const data = await res.json();
    setUserList(data.userList || []);
  }

  useEffect(() => {
    (async () => {
      try {
        await refreshUsers();
      } catch (e) {
        console.error("failed to load admin stats", e);
      }
    })();
  }, []);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") setIsEditOpen(false);
    }
    if (isEditOpen) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isEditOpen]);

  function openEdit(user) {
    setEditingUser(user);
    setEditForm({
      fullName: user.name,
      email: user.email,
    });
    setIsEditOpen(true);
  }

  function closeEdit() {
    setIsEditOpen(false);
    setEditingUser(null);
    setEditForm({
      fullName: "",
      email: "",
    });
  }

  function onEditChange(e) {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  }

  async function onEditSubmit(e) {
    e.preventDefault();

    if (!editForm.fullName.trim()) {
      alert("Please fill in the full name.");
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fullName: editForm.fullName,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data?.error || `Failed: ${res.status}`);
        return;
      }

      await refreshUsers();
      closeEdit();
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

      setUserList((prev) => prev.filter((u) => u.id !== id));
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
          onClick={handleLogout}
        >
          <span className="logout__icon" aria-hidden="true">
            <Icon name="logout" />
          </span>
          Logout
        </button>
      </aside>

      <main className="main">
        <div className="card usersCard">
          <div className="usersTable">
            <div className="usersRow usersRow--head">
              <div>Name</div>
              <div>Email</div>
              <div>Role</div>
              <div>Actions</div>
            </div>

            {userList.map((u) => (
              <div className="usersRow" key={u.id}>
                <div className="cellName">{u.name}</div>
                <div className="cellEmail">{u.email}</div>

                <div>
                  <span className="pill pill--role">{u.role}</span>
                </div>

                <div className="cellActions">
                  <button
                    className="btn btn--secondary"
                    type="button"
                    onClick={() => openEdit(u)}
                  >
                    Edit
                  </button>
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

        {isEditOpen && editingUser && (
          <div className="modalOverlay" onClick={closeEdit} role="presentation">
            <div
              className="modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="editUserTitle"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modalHeader">
                <h2 className="modalTitle" id="editUserTitle">
                  Edit User
                </h2>
                <button
                  className="iconBtn"
                  type="button"
                  onClick={closeEdit}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <form className="modalBody" onSubmit={onEditSubmit}>
                <div className="field">
                  <label className="fieldLabel" htmlFor="editFullName">
                    Full name
                  </label>
                  <input
                    id="editFullName"
                    className="input"
                    name="fullName"
                    value={editForm.fullName}
                    onChange={onEditChange}
                    placeholder="John Doe"
                    autoComplete="name"
                  />
                </div>

                <div className="field">
                  <label className="fieldLabel">Email</label>
                  <div className="fieldValue">{editingUser.email}</div>
                  <div className="fieldNote">Email cannot be changed</div>
                </div>

                <div className="field">
                  <label className="fieldLabel">Role</label>
                  <div className="fieldValue">{editingUser.role}</div>
                  <div className="fieldNote">Role cannot be changed</div>
                </div>

                <div className="modalActions">
                  <button className="btn" type="button" onClick={closeEdit}>
                    Cancel
                  </button>
                  <button className="btn btn--primary" type="submit">
                    Save Changes
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
