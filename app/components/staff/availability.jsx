"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  faCheck,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import "./staff-unified.css";

function Icon({ name }) {
  if (name === "calendar") return <FontAwesomeIcon icon={faCalendar} />;
  if (name === "grid") return <FontAwesomeIcon icon={faGrip} />;
  if (name === "users") return <FontAwesomeIcon icon={faUser} />;
  if (name === "briefcase") return <FontAwesomeIcon icon={faBriefcase} />;
  if (name === "logout") return <FontAwesomeIcon icon={faRightFromBracket} />;
  if (name === "check") return <FontAwesomeIcon icon={faCheck} />;
  if (name === "trash") return <FontAwesomeIcon icon={faTrash} />;
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

const DAY_ORDER = [
  { key: "sun", label: "Sunday" },
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
];

function toHHMMFromInput(value) {
  // <input type="time"> gives "HH:MM"
  return value || null;
}

export default function AvailabilityPage() {
  const router = useRouter();

  const [userId, setUserId] = useState(null);

  const [selectedDay, setSelectedDay] = useState("mon");
  const [days, setDays] = useState({
    sun: { start: null, end: null },
    mon: { start: null, end: null },
    tue: { start: null, end: null },
    wed: { start: null, end: null },
    thu: { start: null, end: null },
    fri: { start: null, end: null },
    sat: { start: null, end: null },
  });

  const selected = days[selectedDay] || { start: null, end: null };

  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");

  // Proper logout handler that clears both cookie and localStorage
  const handleLogout = async () => {
    try {
      // Step 1: Call API to clear the server-side auth cookie
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout API call failed:", err);
    }

    // Step 2: Clear client-side data
    localStorage.removeItem("user");
    
    // Step 3: Redirect to login
    router.push("/login");
  };

  const selectedDayLabel = useMemo(
    () => DAY_ORDER.find((d) => d.key === selectedDay)?.label ?? "Day",
    [selectedDay],
  );

  const isSelectedAvailable = Boolean(selected.start && selected.end);

  // load userId + availability
  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("user") || "null");
    const id = u?.id ?? null;
    setUserId(id);

    if (!id) return;

    (async () => {
      try {
        const res = await apiGet(`/api/staff/availability?userId=${id}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
        }
        const data = await res.json();
        const loaded = data?.days;

        if (loaded) {
          setDays((prev) => ({
            ...prev,
            ...loaded,
          }));
        }
      } catch (e) {
        console.error("Failed to load availability", e);
      }
    })();
  }, []);

  // when selected day changes, prefill form with saved times (or defaults)
  useEffect(() => {
    const d = days[selectedDay];
    if (d?.start && d?.end) {
      setStartTime(d.start);
      setEndTime(d.end);
    } else {
      setStartTime("09:00");
      setEndTime("17:00");
    }
  }, [selectedDay, days]);

  async function saveAvailability() {
    if (!userId) return;

    const start = toHHMMFromInput(startTime);
    const end = toHHMMFromInput(endTime);

    if (!start || !end) return;

    // basic validation: start < end
    if (start >= end) {
      alert("Start time must be before end time.");
      return;
    }

    try {
      const res = await fetch("/api/staff/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          day: selectedDay,
          start,
          end,
        }),
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : null;

      if (!res.ok) {
        alert(data?.error || "Failed to save availability");
        return;
      }

      setDays((prev) => ({
        ...prev,
        [selectedDay]: { start, end },
      }));
    } catch (e) {
      console.error(e);
      alert("Network error while saving availability");
    }
  }

  async function clearAvailability() {
    if (!userId) return;

    try {
      const res = await apiGet("/api/staff/availability", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, day: selectedDay }),
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : null;

      if (!res.ok) {
        alert(data?.error || "Failed to remove availability");
        return;
      }

      setDays((prev) => ({
        ...prev,
        [selectedDay]: { start: null, end: null },
      }));
    } catch (e) {
      console.error(e);
      alert("Network error while deleting availability");
    }
  }

  const summaryRows = DAY_ORDER.filter(
    (d) => days[d.key]?.start && days[d.key]?.end,
  ).map((d) => ({
    label: d.label,
    start: days[d.key].start,
    end: days[d.key].end,
  }));

  return (
    <div className="layout">
      {/* Sidebar (same as your dashboard) */}
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

      {/* Main */}
      <main className="main">
        <header className="pageHeader">
          <h1 className="pageTitle">Manage Availability</h1>
        </header>

        <section className="topGrid">
          {/* Left card: day selector */}
          <section className="card panel">
            <div className="panel__header">
              <h2 className="panel__title">Select Day</h2>
            </div>

            <div className="dayList">
              {DAY_ORDER.map((d) => {
                const available = Boolean(
                  days[d.key]?.start && days[d.key]?.end,
                );
                const active = d.key === selectedDay;

                return (
                  <button
                    key={d.key}
                    type="button"
                    className={`dayItem ${active ? "dayItem--active" : ""} ${
                      available ? "dayItem--available" : ""
                    }`}
                    onClick={() => setSelectedDay(d.key)}
                  >
                    <span className="dayItem__label">{d.label}</span>
                    {available ? (
                      <span className="dayItem__check" aria-hidden="true">
                        <Icon name="check" />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Right card: edit hours */}
          <section className="card panel">
            <div className="panel__header">
              <h2 className="panel__title">
                Set Working Hours for {selectedDayLabel}
              </h2>
            </div>

            <div className="form">
              <label className="fieldLabel" htmlFor="startTime">
                Start Time
              </label>
              <input
                id="startTime"
                className="timeInput"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />

              <label className="fieldLabel" htmlFor="endTime">
                End Time
              </label>
              <input
                id="endTime"
                className="timeInput"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />

              <div className="actionsRow">
                <button
                  className="primaryBtn"
                  type="button"
                  onClick={saveAvailability}
                >
                  Save Availability
                </button>

                <button
                  className="dangerIconBtn"
                  type="button"
                  onClick={clearAvailability}
                  aria-label="Remove availability for this day"
                  disabled={!isSelectedAvailable}
                  title={
                    !isSelectedAvailable
                      ? "No availability set"
                      : "Remove availability"
                  }
                >
                  <Icon name="trash" />
                </button>
              </div>

              <div className="infoBox">
                {isSelectedAvailable ? (
                  <span>
                    Currently available: {selected.start} - {selected.end}
                  </span>
                ) : (
                  <span>Currently available: —</span>
                )}
              </div>
            </div>
          </section>
        </section>

        {/* Summary */}
        <section className="card panel summaryCard">
          <div className="panel__header">
            <h2 className="panel__title">Availability Summary</h2>
          </div>

          <div className="summaryList">
            {summaryRows.length === 0 ? (
              <div className="summaryEmpty">No availability set yet.</div>
            ) : (
              summaryRows.map((row) => (
                <div key={row.label} className="summaryRow">
                  <div className="summaryDay">{row.label}</div>
                  <div className="summaryTime">
                    {row.start} - {row.end}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
