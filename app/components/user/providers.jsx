// app/components/user/providers.jsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendar } from "@fortawesome/free-solid-svg-icons";

import Link from "next/link";
import "./providers.css";

function Icon({ name }) {
  if (name === "calendar") return <FontAwesomeIcon icon={faCalendar} />;
  return null;
}

export default function UserProvidersPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [providers, setProviders] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/providers", { cache: "no-store" });
        const data = await res.json();

        if (!res.ok) {
          console.error("Failed to load providers:", data.error);
          return;
        }

        const providersFromApi = data.providers || [];

        const mapped = providersFromApi.map((p) => {
          const a = p.availability || {};

          // simple label based on which days have data
          const dayNames = [
            a.mon_start && a.mon_end ? "Monday" : null,
            a.tue_start && a.tue_end ? "Tuesday" : null,
            a.wed_start && a.wed_end ? "Wednesday" : null,
            a.thu_start && a.thu_end ? "Thursday" : null,
            a.fri_start && a.fri_end ? "Friday" : null,
          ].filter(Boolean);

          const availabilitySummary =
            dayNames.length > 0
              ? `Available on: ${dayNames.join(", ")}`
              : "Availability not set";

          return {
            id: p.id,
            name: p.name,
            specialty: p.specialty || "Specialist",
            bio: p.bio || "This provider has not added a description yet.",
            availabilityLabel: availabilitySummary,
          };
        });

        setProviders(mapped);
      } catch (err) {
        console.error("Failed to load providers", err);
      }
    })();
  }, []);

  function handleLogout() {
    // No real session yet, so just send them back to login.
    router.push("/login");
  }

  return (
    <div className="user-layout">
      {/* Top navigation bar */}
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
              className={
                "topbar__navLink" +
                (pathname === "/providers" ? " topbar__navLink--active" : "")
              }
            >
              Providers
            </Link>
            <Link
              href="/my-appointments"
              className={
                "topbar__navLink" +
                (pathname === "/my-appointments"
                  ? " topbar__navLink--active"
                  : "")
              }
            >
              My Appointments
            </Link>
          </nav>
        </div>

        <div className="topbar__right">
          <button className="btn btn--outline" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="page">
        <header className="page__header">
          <h1 className="page__title">Browse Service Providers</h1>
          <p className="page__subtitle">
            Choose a specialist and see when they&apos;re available for an
            appointment.
          </p>
        </header>

        <section className="providers">
          {providers.length === 0 ? (
            <p className="providers__empty">
              There are no providers available yet.
            </p>
          ) : (
            <div className="providers__grid">
              {providers.map((provider) => (
                <article key={provider.id} className="providerCard">
                  <div className="providerCard__body">
                    <h2 className="providerCard__name">{provider.name}</h2>
                    <p className="providerCard__specialty">
                      {provider.specialty}
                    </p>
                    <p className="providerCard__bio">{provider.bio}</p>
                  </div>

                  <div className="providerCard__footer">
                    <div className="providerCard__availability">
                      <span className="providerCard__availabilityLabel">
                        Availability
                      </span>
                      <span className="providerCard__availabilityValue">
                        {provider.availability}
                      </span>
                    </div>
                    <button
                      className="btn btn--primary providerCard__button"
                      type="button"
                      // Later this should open a provider detail / booking flow
                      onClick={() => router.push(`/providers/${provider.id}/`)}
                    >
                      View Profile
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
