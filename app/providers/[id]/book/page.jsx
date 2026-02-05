"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendar } from "@fortawesome/free-solid-svg-icons";

import "../../../components/user/providers.css"; // adjust path if needed

const SLOT_MINUTES = 60;

function Icon({ name }) {
  if (name === "calendar") return <FontAwesomeIcon icon={faCalendar} />;
  return null;
}

// Build a full month calendar view starting from the current month
function buildMonthCalendar() {
  const result = [];
  const today = new Date();

  // Get the first day of the current month
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  // Get the last day of the current month
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  // Start from today (not past dates)
  const startDate = new Date(today);
  startDate.setHours(0, 0, 0, 0);

  // Build all days from today to the end of the month
  for (
    let d = new Date(startDate);
    d <= lastDayOfMonth;
    d.setDate(d.getDate() + 1)
  ) {
    const currentDate = new Date(d);
    const key = currentDate.toISOString().slice(0, 10); // YYYY-MM-DD
    const weekdayShort = currentDate.toLocaleDateString(undefined, {
      weekday: "short",
    });
    const weekdayLong = currentDate.toLocaleDateString(undefined, {
      weekday: "long",
    });

    result.push({
      date: currentDate,
      key,
      weekdayShort,
      weekdayLong,
      dayNumber: currentDate.getDate(),
      isToday: currentDate.toDateString() === today.toDateString(),
    });
  }

  return result;
}

// Helper function to get the current month name and year
function getCurrentMonthYear() {
  const today = new Date();
  return today.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function parseTimeToDate(baseDate, value) {
  if (!value) return null;
  const match = String(value).match(/(\d{2}):(\d{2})/);
  if (!match) return null;

  const [, hh, mm] = match;
  const d = new Date(baseDate);
  d.setHours(Number(hh), Number(mm), 0, 0);
  return d;
}

function buildSlotsForDate(date, availability) {
  if (!availability) return [];

  const weekday = date.getDay(); // 0=Sun .. 6=Sat
  let startKey, endKey;

  switch (weekday) {
    case 1:
      startKey = "mon_start";
      endKey = "mon_end";
      break;
    case 2:
      startKey = "tue_start";
      endKey = "tue_end";
      break;
    case 3:
      startKey = "wed_start";
      endKey = "wed_end";
      break;
    case 4:
      startKey = "thu_start";
      endKey = "thu_end";
      break;
    case 5:
      startKey = "fri_start";
      endKey = "fri_end";
      break;
    default:
      return []; // weekend: no slots
  }

  const start = parseTimeToDate(date, availability[startKey]);
  const end = parseTimeToDate(date, availability[endKey]);
  if (!start || !end || !(start < end)) return [];

  const slots = [];
  let current = new Date(start);

  while (current < end) {
    const label = current.toTimeString().slice(0, 5); // HH:MM
    slots.push({
      label,
      startsAt: new Date(current),
    });
    current = new Date(current.getTime() + SLOT_MINUTES * 60 * 1000);
  }

  return slots;
}

export default function BookAppointmentPage() {
  const router = useRouter();
  const { id } = useParams(); // provider id from /providers/[id]/book

  const [provider, setProvider] = useState(null);
  const [days, setDays] = useState([]);
  const [selectedDayKey, setSelectedDayKey] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [success, setSuccess] = useState("");

  // TODO: replace this with your real "current user" access
  const [currentUserId, setCurrentUserId] = useState(null);

  // Fetch provider + build day list
  useEffect(() => {
    if (!id) return;

    (async () => {
      try {
        setLoading(true);

        // 1) Provider (for name + availability)
        const res = await fetch(`/api/providers/${id}`, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setError(data.error || "Failed to load provider");
          setLoading(false);
          return;
        }

        const providerData = data.provider;
        setProvider(providerData);

        const upcomingDays = buildMonthCalendar();
        setDays(upcomingDays);

        // pick first day with slots as default
        let firstDayKey = null;
        let initialSlots = [];

        for (const d of upcomingDays) {
          const daySlots = buildSlotsForDate(d.date, providerData.availability);
          if (daySlots.length > 0) {
            firstDayKey = d.key;
            initialSlots = daySlots;
            break;
          }
        }

        if (!firstDayKey) {
          // no days have availability
          firstDayKey = upcomingDays[0]?.key ?? null;
        }

        setSelectedDayKey(firstDayKey);
        setSlots(initialSlots);
        setSelectedSlot(null);
      } catch (err) {
        console.error(err);
        setError("Failed to load provider");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Example of how you might fetch current user
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setError(data.error || "You must be logged in to book.");
          return;
        }

        setCurrentUserId(Number(data.user.id));
      } catch (e) {
        console.error(e);
        setError("Failed to load current user.");
      }
    })();
  }, []);

  function handleDayClick(day) {
    if (!provider?.availability) return;
    const daySlots = buildSlotsForDate(day.date, provider.availability);
    setSelectedDayKey(day.key);
    setSlots(daySlots);
    setSelectedSlot(null);
  }

  async function handleBook() {
    setError("");
    setSuccess("");

    // 1) Make sure we know who is logged in
    if (!currentUserId) {
      setError("You must be logged in to book an appointment.");
      return;
    }

    // 2) Make sure user selected a day and time
    if (!selectedDayKey || !selectedSlot) {
      setError("Please select a date and a time.");
      return;
    }

    // 3) Find the selected day object from `days`
    const dayObj = days.find((d) => d.key === selectedDayKey);
    if (!dayObj) {
      setError("Selected day is invalid.");
      return;
    }

    // 4) Build start/end Date objects from the day + time
    const baseDate = new Date(dayObj.date); // we created this in buildNextDays

    // selectedSlot.label is like "13:00"
    const [hourStr, minuteStr] = selectedSlot.label.split(":");
    const start = new Date(baseDate);
    start.setHours(Number(hourStr), Number(minuteStr), 0, 0);

    const end = new Date(start.getTime() + SLOT_MINUTES * 60 * 1000);

    // 5) Call the API with EXACT field names the backend expects
    setSaving(true);

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: Number(currentUserId), // from /api/me
          staffId: Number(id), // provider id from the URL
          startsAt: start.toISOString(),
          endsAt: end.toISOString(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Check if this is an appointment overlap conflict
        if (res.status === 409 || data.code === "APPOINTMENT_OVERLAP") {
          setError(
            data.error ||
              "This time slot is no longer available. Please select a different time.",
          );
          // Reset the selected slot so user must choose again
          setSelectedSlot(null);
        } else {
          setError(data.error || "Failed to create appointment.");
        }
        return;
      }

      // 6) Success: show confirmation message
      setSuccess("Appointment booked successfully! Redirecting...");

      // Clear selection
      setSelectedSlot(null);

      // Redirect after a short delay to show success message
      setTimeout(() => {
        router.push("/my-appointments");
      }, 1500);
    } catch (err) {
      console.error("Booking error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return null; // or a spinner
  }

  if (!provider) {
    return (
      <div className="user-layout">
        <header className="topbar">
          <div className="topbar__left">
            <div className="topbar__brand">
              <span className="topbar__brandIcon">
                <Icon name="calendar" />
              </span>
              <span className="topbar__brandText">BookingSystem</span>
            </div>
            <nav className="topbar__nav">
              <Link href="/providers" className="topbar__navLink">
                Providers
              </Link>
              <Link href="/my-appointments" className="topbar__navLink">
                My Appointments
              </Link>
            </nav>
          </div>
        </header>

        <main className="page">
          <p>Provider not found.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="user-layout">
      <header className="topbar">
        <div className="topbar__left">
          <div className="topbar__brand">
            <span className="topbar__brandIcon">
              <Icon name="calendar" />
            </span>
            <span className="topbar__brandText">BookingSystem</span>
          </div>
          <nav className="topbar__nav">
            <Link href="/user" className="topbar__navLink">
              Providers
            </Link>
            <Link href="/my-appointments" className="topbar__navLink">
              My Appointments
            </Link>
          </nav>
        </div>
        <div className="topbar__right">
          <button
            className="btn btn--outline"
            onClick={() => router.push("/login")}
          >
            Logout
          </button>
        </div>
      </header>

      <main className="page">
        <div className="providerProfile__backRow">
          <button
            type="button"
            className="providerProfile__backLink"
            onClick={() => router.push(`/providers/${id}`)}
          >
            ← Back to Provider
          </button>
        </div>

        <section className="bookingCard">
          <h1 className="bookingCard__title">
            Select Appointment Time with {provider.name}
          </h1>

          {error && <p className="bookingCard__error">{error}</p>}

          <div className="bookingCard__section">
            <h2 className="bookingCard__sectionTitle">
              Select Date - {getCurrentMonthYear()}
            </h2>
            <div className="bookingCard__calendarGrid">
              {days.map((d) => {
                const isSelected = d.key === selectedDayKey;
                const dayHasSlots =
                  provider.availability &&
                  buildSlotsForDate(d.date, provider.availability).length > 0;

                const className =
                  "bookingDateButton" +
                  (isSelected ? " bookingDateButton--selected" : "") +
                  (!dayHasSlots ? " bookingDateButton--disabled" : "") +
                  (d.isToday ? " bookingDateButton--today" : "");

                return (
                  <button
                    key={d.key}
                    type="button"
                    className={className}
                    disabled={!dayHasSlots}
                    onClick={() => handleDayClick(d)}
                    title={d.weekdayLong + ", " + d.dayNumber}
                  >
                    <span className="bookingDateButton__weekday">
                      {d.weekdayShort}
                    </span>
                    <span className="bookingDateButton__dayNumber">
                      {d.dayNumber}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bookingCard__section">
            <h2 className="bookingCard__sectionTitle">Select Time</h2>

            <div className="bookingCard__timeGrid">
              {slots.length === 0 && (
                <p className="bookingCard__noSlots">
                  No available time slots for this day.
                </p>
              )}

              {slots.map((slot) => {
                const isSelected = selectedSlot?.label === slot.label;
                const className =
                  "bookingTimeButton" +
                  (isSelected ? " bookingTimeButton--selected" : "");

                return (
                  <button
                    key={slot.label}
                    type="button"
                    className={className}
                    onClick={() => setSelectedSlot(slot)}
                  >
                    {slot.label}
                  </button>
                );
              })}
            </div>
          </div>

          {error && <p className="bookingCard__error">{error}</p>}
          {success && <p className="bookingCard__success">{success}</p>}

          <button
            type="button"
            className="bookingCard__submit btn btn--primary"
            disabled={!selectedSlot || saving}
            onClick={handleBook}
          >
            {saving ? "Booking..." : "Continue to Booking"}
          </button>
        </section>
      </main>
    </div>
  );
}
