// app/components/admin/appointments.jsx
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
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";
import "./admin-unified.css";

function Icon({ name }) {
  if (name === "calendar") return <FontAwesomeIcon icon={faCalendar} />;
  if (name === "grid") return <FontAwesomeIcon icon={faGrip} />;
  if (name === "users") return <FontAwesomeIcon icon={faUser} />;
  if (name === "briefcase") return <FontAwesomeIcon icon={faBriefcase} />;
  if (name === "logout") return <FontAwesomeIcon icon={faRightFromBracket} />;
  if (name === "chevron-down") return <FontAwesomeIcon icon={faChevronDown} />;
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

function StatusBadge({ status }) {
  const statusClass = status.toLowerCase();
  return (
    <span className={`statusBadge statusBadge--${statusClass}`}>{status}</span>
  );
}

export default function AdminAppointments() {
  const router = useRouter();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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

  useEffect(() => {
    loadAppointments();
  }, [statusFilter]);

  async function loadAppointments() {
    try {
      setLoading(true);
      const url =
        statusFilter === "all"
          ? "/api/admin/appointments"
          : `/api/admin/appointments?status=${statusFilter}`;

      const res = await apiGet(url, { cache: "no-store" });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      setAppointments(data.appointments || []);
    } catch (e) {
      console.error("Failed to load appointments", e);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  function capitalizeStatus(status) {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  const statusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "cancelled", label: "Cancelled" },
    { value: "completed", label: "Completed" },
  ];

  const currentStatusLabel =
    statusOptions.find((opt) => opt.value === statusFilter)?.label ||
    "All Statuses";

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
        <header className="appointmentsHeader">
          <h1 className="appointmentsHeader__title">Appointments Overview</h1>

          <div className="filterDropdown">
            <button
              className="filterDropdown__button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              type="button"
            >
              {currentStatusLabel}
              <span className="filterDropdown__icon">
                <Icon name="chevron-down" />
              </span>
            </button>

            {isDropdownOpen && (
              <div className="filterDropdown__menu">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    className={`filterDropdown__item ${
                      statusFilter === option.value
                        ? "filterDropdown__item--active"
                        : ""
                    }`}
                    onClick={() => {
                      setStatusFilter(option.value);
                      setIsDropdownOpen(false);
                    }}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        {loading ? (
          <div className="appointmentsLoading">Loading appointments...</div>
        ) : (
          <section className="appointmentsTable">
            <div className="appointmentsTable__header">
              <div className="appointmentsTable__headerCell">Patient</div>
              <div className="appointmentsTable__headerCell">Provider</div>
              <div className="appointmentsTable__headerCell">Date</div>
              <div className="appointmentsTable__headerCell">Time</div>
              <div className="appointmentsTable__headerCell">Status</div>
            </div>

            <div className="appointmentsTable__body">
              {appointments.length === 0 ? (
                <div className="appointmentsTable__empty">
                  No appointments found
                </div>
              ) : (
                appointments.map((appointment) => (
                  <div key={appointment.id} className="appointmentsTable__row">
                    <div className="appointmentsTable__cell">
                      {appointment.patient.name}
                    </div>
                    <div className="appointmentsTable__cell">
                      {appointment.provider.title} {appointment.provider.name}
                    </div>
                    <div className="appointmentsTable__cell">
                      {formatDate(appointment.startsAt)}
                    </div>
                    <div className="appointmentsTable__cell">
                      {formatTime(appointment.startsAt)}
                    </div>
                    <div className="appointmentsTable__cell">
                      <StatusBadge
                        status={capitalizeStatus(appointment.status)}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
