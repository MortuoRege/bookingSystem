// app/components/staff/AppointmentModal.jsx
"use client";

import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faTrash } from "@fortawesome/free-solid-svg-icons";
import "./staff-unified.css";

function StatusBadge({ status }) {
  const statusClass = status.toLowerCase();
  return (
    <span className={`statusBadge statusBadge--${statusClass}`}>{status}</span>
  );
}

export default function AppointmentModal({ appointment, onClose, onRefresh }) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!appointment) return null;

  function formatFullDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
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

  // Close modal when clicking backdrop
  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  async function handleRefuseAppointment() {
    if (!confirm("Are you sure you want to refuse this appointment? This will permanently delete it.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/staff/appointments?id=${appointment.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to delete appointment");
        return;
      }

      alert("Appointment refused and deleted successfully");
      onClose();
      
      // Refresh the appointments list in the parent component
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error deleting appointment:", error);
      alert("Failed to delete appointment");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="modalBackdrop" onClick={handleBackdropClick}>
      <div className="modal">
        <div className="modal__header">
          <div>
            <h2 className="modal__title">Appointment Details</h2>
            <p className="modal__subtitle">
              Review and manage this appointment request
            </p>
          </div>
          <button
            className="modal__closeButton"
            onClick={onClose}
            aria-label="Close modal"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="modal__body">
          <div className="modal__grid">
            {/* Patient */}
            <div className="modal__field">
              <div className="modal__label">Patient</div>
              <div className="modal__value">{appointment.patient.name}</div>
            </div>

            {/* Status */}
            <div className="modal__field">
              <div className="modal__label">Status</div>
              <div className="modal__value">
                <StatusBadge status={capitalizeStatus(appointment.status)} />
              </div>
            </div>

            {/* Date */}
            <div className="modal__field">
              <div className="modal__label">Date</div>
              <div className="modal__value">
                {formatFullDate(appointment.startsAt)}
              </div>
            </div>

            {/* Time */}
            <div className="modal__field">
              <div className="modal__label">Time</div>
              <div className="modal__value">
                {formatTime(appointment.startsAt)}
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="modal__notesSection">
            <div className="modal__label">Notes</div>
            <div className="modal__notes">
              {appointment.notes || "Regular checkup"}
            </div>
          </div>

          {/* Actions Section */}
          <div className="modal__actions">
            <button
              className="modal__refuseButton"
              onClick={handleRefuseAppointment}
              disabled={isDeleting}
            >
              <FontAwesomeIcon icon={faTrash} />
              {isDeleting ? "Refusing..." : "Refuse Appointment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
