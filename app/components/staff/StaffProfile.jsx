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
  faBell,
} from "@fortawesome/free-solid-svg-icons";
import "./staff-unified.css";

function Icon({ name }) {
  if (name === "calendar") return <FontAwesomeIcon icon={faCalendar} />;
  if (name === "grid") return <FontAwesomeIcon icon={faGrip} />;
  if (name === "users") return <FontAwesomeIcon icon={faUser} />;
  if (name === "briefcase") return <FontAwesomeIcon icon={faBriefcase} />;
  if (name === "logout") return <FontAwesomeIcon icon={faRightFromBracket} />;
  if (name === "bell") return <FontAwesomeIcon icon={faBell} />;
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
      <span className="nav__label">{children}</span>
    </Link>
  );
}

export default function StaffProfile() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  
  // Form state for editing
  const [formData, setFormData] = useState({
    name: "",
    specialty: "",
    title: "",
    bio: "",
  });

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      localStorage.removeItem("user");
      router.push("/login");
    } catch (err) {
      console.error("Logout failed:", err);
      // Still redirect even if API call fails
      localStorage.removeItem("user");
      router.push("/login");
    }
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "null");
        const userId = user?.id;

        if (!userId) {
          throw new Error("Not logged in");
        }

        // Fetch user and staff data
        const res = await fetch(`/api/staff/profile?userId=${userId}`, {
          cache: "no-store",
          credentials: "include",
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
        }

        const data = await res.json();

        if (cancelled) return;
        setProfile(data.profile);
        setFormData({
          name: data.profile.name || "",
          specialty: data.profile.specialty || "",
          title: data.profile.title || "",
          bio: data.profile.bio || "",
        });
        setLoading(false);
      } catch (e) {
        console.error("Failed to load profile", e);
        if (!cancelled) {
          setError(e.message);
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleEditClick = () => {
    setIsEditing(true);
    setSuccessMessage("");
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form to original profile data
    setFormData({
      name: profile.name || "",
      specialty: profile.specialty || "",
      title: profile.title || "",
      bio: profile.bio || "",
    });
    setError(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage("");

      const user = JSON.parse(localStorage.getItem("user") || "null");
      const userId = user?.id;

      if (!userId) {
        throw new Error("Not logged in");
      }

      const res = await fetch(`/api/staff/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          userId,
          name: formData.name,
          specialty: formData.specialty,
          title: formData.title,
          bio: formData.bio,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update profile");
      }

      const data = await res.json();
      setProfile(data.profile);
      setIsEditing(false);
      setSuccessMessage("Profile updated successfully!");
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Failed to save profile:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

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
          <AppNavLink href="/staff" icon="grid">
            Dashboard
          </AppNavLink>

          <AppNavLink href="/availability" icon="users">
            Availability
          </AppNavLink>

          <AppNavLink href="/staff-appointments" icon="briefcase">
            Appointments
          </AppNavLink>

          <AppNavLink href="/staff-profile" icon="users">
            Profile
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
          <span className="logout__label">Logout</span>
        </button>
      </aside>

      <main className="main">
        <header className="header">
          <h1 className="header__title">Profile Settings</h1>
          {!loading && !error && profile && !isEditing && (
            <button 
              className="btn btn--primary" 
              onClick={handleEditClick}
            >
              Edit Profile
            </button>
          )}
        </header>

        {successMessage && (
          <div className="successMessage">{successMessage}</div>
        )}

        {loading ? (
          <div className="loadingMessage">Loading profile...</div>
        ) : error ? (
          <div className="errorMessage">Error: {error}</div>
        ) : profile ? (
          <div className="profileContainer">
            <div className="profileCard">
              <div className="profileField">
                <label className="profileLabel">Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    className="input"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Full name"
                  />
                ) : (
                  <div className="profileValue">{profile.name || "—"}</div>
                )}
              </div>

              <div className="profileField">
                <label className="profileLabel">Email</label>
                <div className="profileValue profileValue--muted">
                  {profile.email || "—"}
                  {isEditing && <span className="profileNote"> (Cannot be changed)</span>}
                </div>
              </div>

              <div className="profileField">
                <label className="profileLabel">Specialty</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="specialty"
                    className="input"
                    value={formData.specialty}
                    onChange={handleInputChange}
                    placeholder="e.g., Cardiology, Pediatrics"
                  />
                ) : (
                  <div className="profileValue">{profile.specialty || "—"}</div>
                )}
              </div>

              <div className="profileField">
                <label className="profileLabel">Title</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="title"
                    className="input"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g., MD, PhD"
                  />
                ) : (
                  <div className="profileValue">{profile.title || "—"}</div>
                )}
              </div>

              <div className="profileField">
                <label className="profileLabel">Description</label>
                {isEditing ? (
                  <textarea
                    name="bio"
                    className="input"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Brief description of your experience and expertise"
                    rows="4"
                  />
                ) : (
                  <div className="profileValue profileValue--description">
                    {profile.bio || "No description provided."}
                  </div>
                )}
              </div>

              {isEditing && (
                <div className="profileActions">
                  <button 
                    className="btn btn--outline" 
                    onClick={handleCancelEdit}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn btn--primary" 
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="errorMessage">No profile data available</div>
        )}
      </main>
    </div>
  );
}
