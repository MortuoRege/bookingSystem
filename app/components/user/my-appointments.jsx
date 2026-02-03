"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import "./providers.css"; // same CSS file you're already using

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendar, faClock } from "@fortawesome/free-solid-svg-icons";

function Icon({ name }) {
  if (name === "calendar") return <FontAwesomeIcon icon={faCalendar} />;
  if (name === "clock") return <FontAwesomeIcon icon={faClock} />;
  return null;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MyAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/appointments", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setError(data.error || "Failed to load appointments.");
        } else {
          setAppointments(data.appointments || []);
        }
      } catch (e) {
        console.error(e);
        setError("Failed to load appointments.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleCancel(id) {
    if (!window.confirm("Cancel this appointment?")) return;

    setError("");
    try {
      const res = await fetch(`/api/appointments/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Failed to cancel appointment.");
        return;
      }

      setAppointments((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      console.error(e);
      setError("Failed to cancel appointment.");
    }
  }

  return (
    <div className="user-layout">
      <header className="topbar">
        <div className="topbar__left">
          <div className="topbar__brand">
            <span className="topbar__brandIcon">
              <Icon name="calendar" />{" "}
            </span>
            <span className="topbar__brandText">BookingSystem</span>
          </div>
          <nav className="topbar__nav">
            <Link href="/user" className="topbar__navLink">
              Providers
            </Link>
            <Link
              href="/my-appointments"
              className="topbar__navLink topbar__navLink--active"
            >
              My Appointments
            </Link>
          </nav>
        </div>
        <div className="topbar__right">
          <Link href="/login" className="btn btn--outline">
            Logout
          </Link>
        </div>
      </header>

      <main className="page">
        <h1 className="pageTitle">My Appointments</h1>

        {error && <p className="bookingCard__error">{error}</p>}
        {loading && <p>Loading appointments…</p>}

        {!loading && appointments.length === 0 && !error && (
          <p>You have no appointments yet.</p>
        )}

        <div className="appointmentsList">
          {appointments.map((appt) => {
            const start = appt.startsAt || appt.starts_at;
            const status = (appt.status || "Pending").toLowerCase();
            const providerName = appt.staff?.name || "Unknown provider";

            return (
              <article key={appt.id} className="appointmentCard">
                <div className="appointmentCard__header">
                  <div>
                    <h2 className="appointmentCard__providerName">
                      {providerName}
                    </h2>
                    <p className="appointmentCard__meta">
                      <span>
                        <Icon name="calendar" /> {formatDate(start)}
                      </span>
                      <span>
                        <Icon name="clock" /> {formatTime(start)}
                      </span>
                    </p>
                  </div>
                  <span
                    className={`appointmentCard__status appointmentCard__status--${status}`}
                  >
                    {appt.status || "Pending"}
                  </span>
                </div>

                {appt.notes && (
                  <p className="appointmentCard__notes">
                    <strong>Notes:</strong> {appt.notes}
                  </p>
                )}

                <div className="appointmentCard__footer">
                  <button
                    type="button"
                    className="btn btn--danger"
                    onClick={() => handleCancel(appt.id)}
                  >
                    Cancel Appointment
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}
