// app/providers/[id]/page.jsx
import Link from "next/link";
import { prisma } from "../../prisma";
import "../../components/user/providers.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendar } from "@fortawesome/free-solid-svg-icons";

function Icon({ name }) {
  if (name === "calendar") return <FontAwesomeIcon icon={faCalendar} />;
  return null;
}

function formatTime(value) {
  if (!value) return null;
  const str = String(value);
  const match = str.match(/\d{2}:\d{2}/);
  return match ? match[0] : str;
}

// server component
export default async function ProviderProfilePage({ params }) {
  const { id: idStr } = await params;
  const idNum = Number(idStr);

  if (!Number.isFinite(idNum) || idNum <= 0) {
    return (
      <main className="page">
        <p>Invalid provider id.</p>
      </main>
    );
  }

  const row = await prisma.staff.findUnique({
    where: { user_id: BigInt(idNum) },
    include: {
      users: {
        select: {
          full_name: true,
          email: true,
        },
      },
    },
  });

  if (!row) {
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
          <div className="topbar__right">
            <Link href="/login" className="btn btn--outline">
              Logout
            </Link>
          </div>
        </header>

        <main className="page">
          <div className="providerProfile__backRow">
            <Link href="/user" className="providerProfile__backLink">
              ← Back to Providers
            </Link>
          </div>
          <p>Provider not found.</p>
        </main>
      </div>
    );
  }

  const availability = {
    mon_start: row.mon_start,
    mon_end: row.mon_end,
    tue_start: row.tue_start,
    tue_end: row.tue_end,
    wed_start: row.wed_start,
    wed_end: row.wed_end,
    thu_start: row.thu_start,
    thu_end: row.thu_end,
    fri_start: row.fri_start,
    fri_end: row.fri_end,
  };

  const days = [
    {
      key: "mon",
      label: "Monday",
      start: availability.mon_start,
      end: availability.mon_end,
    },
    {
      key: "tue",
      label: "Tuesday",
      start: availability.tue_start,
      end: availability.tue_end,
    },
    {
      key: "wed",
      label: "Wednesday",
      start: availability.wed_start,
      end: availability.wed_end,
    },
    {
      key: "thu",
      label: "Thursday",
      start: availability.thu_start,
      end: availability.thu_end,
    },
    {
      key: "fri",
      label: "Friday",
      start: availability.fri_start,
      end: availability.fri_end,
    },
  ];

  const availableDays = days.filter((d) => d.start && d.end);
  const availableDaysLabel =
    availableDays.length > 0
      ? availableDays.map((d) => d.label).join(", ")
      : "No availability set";

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
            <Link
              href="/providers"
              className="topbar__navLink topbar__navLink--active"
            >
              Providers
            </Link>
            <Link href="/my-appointments" className="topbar__navLink">
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
        <div className="providerProfile__backRow">
          <Link href="/user" className="providerProfile__backLink">
            ← Back to Providers
          </Link>
        </div>

        <section className="providerProfile">
          <header className="providerProfile__header">
            <div>
              <h1 className="providerProfile__name">{row.users.full_name}</h1>
              <p className="providerProfile__specialty">
                {row.specialty || "Specialist"}
              </p>
            </div>
            <span className="providerProfile__badge">Verified</span>
          </header>

          <div className="providerProfile__section">
            <h2 className="providerProfile__sectionTitle">About</h2>
            <p className="providerProfile__sectionBody">
              {row.bio || "This provider has not added a description yet."}
            </p>
          </div>

          <div className="providerProfile__section">
            <h2 className="providerProfile__sectionTitle">Availability</h2>

            <div className="providerProfile__availabilityBox">
              <p className="providerProfile__availabilitySummary">
                <span className="providerProfile__availabilitySummaryLabel">
                  Available on:
                </span>{" "}
                {availableDaysLabel}
              </p>

              {availableDays.length > 0 && (
                <ul className="providerProfile__availabilityList">
                  {availableDays.map((d) => (
                    <li
                      key={d.key}
                      className="providerProfile__availabilityListItem"
                    >
                      <span>{d.label}</span>
                      <span>
                        {formatTime(d.start)} – {formatTime(d.end)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Navigation to booking page: use Link, not onClick/router */}
          <Link
            href={`/providers/${idStr}/book`}
            className="btn btn--primary providerProfile__bookButton"
          >
            Book Appointment
          </Link>
        </section>
      </main>
    </div>
  );
}
