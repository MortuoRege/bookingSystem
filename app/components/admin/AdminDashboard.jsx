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
import "./AdminDashboard.css";

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

export default function AdminDashboard() {
  const router = useRouter();
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalStaff, setTotalStaff] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/stats", { cache: "no-store" });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
        }

        const data = await res.json();
        setTotalUsers(data.total_users ?? data.users ?? 0);
        setTotalStaff(data.total_staff ?? data.staff ?? 0);
      } catch (e) {
        console.error("Failed to load admin stats", e);
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
      value: 3,
      subtitle: "1 pending",
      icon: "calendar",
    },
  ];

  const activity = [
    { title: "New user registered", meta: "John Doe", time: "2 hours ago" },
    {
      title: "Appointment booked",
      meta: "Jane Smith with Dr. Johnson",
      time: "5 hours ago",
    },
    { title: "Provider verified", meta: "Dr. Michael Chen", time: "1 day ago" },
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

          {/* Anchors are fine if you really want them */}
          <a className="nav__item" href="#appointments">
            <span className="nav__icon" aria-hidden="true">
              <Icon name="calendar" />
            </span>
            Appointments
          </a>
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
              {activity.map((a, idx) => (
                <div key={idx} className="activityItem">
                  <div className="activityItem__left">
                    <div className="activityItem__title">{a.title}</div>
                    <div className="activityItem__meta">{a.meta}</div>
                  </div>
                  <div className="activityItem__time">{a.time}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="card panel">
            <div className="panel__header">
              <h2 className="panel__title">System Status</h2>
            </div>

            <div className="panel__body">
              <ProgressRow
                label="User Activity"
                value={85}
                colorClass="progressFill--green"
              />
              <ProgressRow
                label="Provider Availability"
                value={92}
                colorClass="progressFill--blue"
              />
              <ProgressRow
                label="Appointment Completion"
                value={78}
                colorClass="progressFill--purple"
              />
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}
