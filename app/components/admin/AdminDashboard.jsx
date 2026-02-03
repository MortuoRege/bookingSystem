// app/components/AdminDashboard.jsx
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

function StatCard({ title, value, subtitle, icon }) {
  return (
    <section className="card stat">
      <div className="stat__top">
        <h3 className="stat__title">{title}</h3>
        <span className="stat__icon" aria-hidden="true">
          <Icon name={icon} />
        </span>
      </div>
      <div className="stat__value">{value}</div>
      <div className="stat__subtitle">{subtitle}</div>
    </section>
  );
}

function ProgressRow({ label, value, colorClass }) {
  return (
    <div className="progressRow">
      <div className="progressRow__top">
        <div className="progressRow__label">{label}</div>
        <div className="progressRow__value">{value}%</div>
      </div>
      <div
        className="progressTrack"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`progressFill ${colorClass}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

// Simple "NavLink" for Next (active class)
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

// Helper function to format relative time
function getRelativeTime(timestamp) {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInSeconds = Math.floor((now - time) / 1000);

  if (diffInSeconds < 60) {
    return "just now";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ${days === 1 ? "day" : "days"} ago`;
  } else {
    const weeks = Math.floor(diffInSeconds / 604800);
    return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
  }
}

export default function AdminDashboard() {
  const router = useRouter();
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalStaff, setTotalStaff] = useState(0);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [pendingAppointments, setPendingAppointments] = useState(0);
  const [recentActivity, setRecentActivity] = useState([]);
  const [systemStatus, setSystemStatus] = useState({
    userActivity: 0,
    providerAvailability: 0,
    appointmentCompletion: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/stats", { cache: "no-store" });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
        }

        const data = await res.json();
        setTotalUsers(data.users ?? 0);
        setTotalStaff(data.staff ?? 0);
        setTotalAppointments(data.appointments ?? 0);
        setPendingAppointments(data.appointmentsByStatus?.pending ?? 0);
        setRecentActivity(data.recentActivity ?? []);
        setSystemStatus(data.systemStatus ?? {
          userActivity: 0,
          providerAvailability: 0,
          appointmentCompletion: 0,
        });
      } catch (e) {
        console.error("Failed to load admin stats", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stats = [
    {
      title: "Total Users",
      value: totalUsers,
      subtitle: "Registered end users",
      icon: "users",
    },
    {
      title: "Total Providers",
      value: totalStaff,
      subtitle: "Service providers",
      icon: "briefcase",
    },
    {
      title: "Total Appointments",
      value: totalAppointments,
      subtitle: `${pendingAppointments} pending`,
      icon: "calendar",
    },
  ];

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

      <main className="main">
        <header className="header">
          <h1 className="header__title">Admin Dashboard</h1>
        </header>

        {loading ? (
          <div className="loadingState">Loading dashboard data...</div>
        ) : (
          <>
            <section className="statsGrid">
              {stats.map((s) => (
                <StatCard key={s.title} {...s} />
              ))}
            </section>

            <section className="bottomGrid">
              <section className="card panel">
                <div className="panel__header">
                  <h2 className="panel__title">Recent Activity</h2>
                </div>

                <div className="activityList">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((a, idx) => (
                      <div key={idx} className="activityItem">
                        <div className="activityItem__left">
                          <div className="activityItem__title">{a.title}</div>
                          <div className="activityItem__meta">{a.meta}</div>
                        </div>
                        <div className="activityItem__time">
                          {getRelativeTime(a.timestamp)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="emptyState">
                      <p className="emptyState__text">No recent activity</p>
                    </div>
                  )}
                </div>
              </section>

              <section className="card panel">
                <div className="panel__header">
                  <h2 className="panel__title">System Status</h2>
                </div>

                <div className="panel__body">
                  <ProgressRow
                    label="User Activity"
                    value={systemStatus.userActivity}
                    colorClass="progressFill--green"
                  />
                  <ProgressRow
                    label="Provider Availability"
                    value={systemStatus.providerAvailability}
                    colorClass="progressFill--blue"
                  />
                  <ProgressRow
                    label="Appointment Completion"
                    value={systemStatus.appointmentCompletion}
                    colorClass="progressFill--purple"
                  />
                </div>
              </section>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
