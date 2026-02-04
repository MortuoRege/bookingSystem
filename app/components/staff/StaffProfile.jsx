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
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
        }

        const data = await res.json();

        if (cancelled) return;
        setProfile(data.profile);
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
          onClick={() => router.push("/login")}
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
        </header>

        {loading ? (
          <div className="loadingMessage">Loading profile...</div>
        ) : error ? (
          <div className="errorMessage">Error: {error}</div>
        ) : profile ? (
          <div className="profileContainer">
            <div className="profileCard">
              <div className="profileField">
                <label className="profileLabel">Name</label>
                <div className="profileValue">{profile.name || "—"}</div>
              </div>

              <div className="profileField">
                <label className="profileLabel">Email</label>
                <div className="profileValue">{profile.email || "—"}</div>
              </div>

              <div className="profileField">
                <label className="profileLabel">Specialty</label>
                <div className="profileValue">{profile.specialty || "—"}</div>
              </div>

              {profile.title && (
                <div className="profileField">
                  <label className="profileLabel">Title</label>
                  <div className="profileValue">{profile.title}</div>
                </div>
              )}

              <div className="profileField">
                <label className="profileLabel">Description</label>
                <div className="profileValue profileValue--description">
                  {profile.bio || "No description provided."}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="errorMessage">No profile data available</div>
        )}
      </main>
    </div>
  );
}
