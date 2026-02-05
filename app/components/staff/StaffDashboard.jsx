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
import "./staff-unified.css";

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
        {icon ? (
          <span className="stat__icon" aria-hidden="true">
            <Icon name={icon} />
          </span>
        ) : null}
      </div>

      <div className="stat__value">{value}</div>
      {subtitle ? <div className="stat__subtitle">{subtitle}</div> : null}
    </section>
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
      <span className="nav__label">{children}</span>
    </Link>
  );
}

export default function StaffDashboard() {
  const router = useRouter();
  const [todaysAppointment, setTodaysAppointment] = useState(0);
  const [totalAppointment, setTotalAppointment] = useState(0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "null");
        const userId = user?.id;

        if (!userId) throw new Error("Not logged in (no user in localStorage)");

        const res = await apiGet(`/api/staff/stats?userId=${userId}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
        }

        const data = await res.json();

        if (cancelled) return;
        setTodaysAppointment(data.appointmentsToday ?? 0);
        setTotalAppointment(data.appointmentsAllTime ?? 0);
      } catch (e) {
        console.error("Failed to load staff stats", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const stats = [
    {
      title: "Today's appointments",
      value: todaysAppointment,
      subtitle: null,
      icon: "calendar",
    },
    {
      title: "Total appointments",
      value: totalAppointment,
      subtitle: null,
      icon: "briefcase",
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
          <h1 className="header__title">Dashboard</h1>
        </header>

        <section className="statsGrid">
          {stats.map((s) => (
            <StatCard key={s.title} {...s} />
          ))}
        </section>
      </main>
    </div>
  );
}
