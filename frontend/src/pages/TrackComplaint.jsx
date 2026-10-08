import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";

function TrackComplaint() {
  const [searchParams] = useSearchParams();

  const [complaintId, setComplaintId] = useState(
    searchParams.get("complaintId") || ""
  );

  const [complaint, setComplaint] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setComplaint(null);
    setUpdates("");

    if (!complaintId.trim()) {
      setError("Please enter a complaint ID.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/complaints/track/${complaintId.trim()}`
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Complaint not found.");
        setLoading(false);
        return;
      }

      setComplaint(data.complaint);
      setUpdates(data.updates);
    } catch (error) {
      console.error(error);
      setError("Unable to connect to the server.");
    }

    setLoading(false);
  };

  return (
    <>
      <Navbar />

      <main className="tracking-page">
        <div className="tracking-card">
          <p className="hero-tag">COMPLAINT TRACKING</p>

          <h1>Track Your Complaint</h1>

          <p>
            Enter your complaint ID to check the current status and progress.
          </p>

          <form className="tracking-form" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Example: GRV-2026-58141"
              value={complaintId}
              onChange={(event) => setComplaintId(event.target.value)}
            />

            <button type="submit" className="auth-btn">
              {loading ? "Checking..." : "Track Complaint"}
            </button>
          </form>

          {error && (
            <p className="error-message">
              {error}
            </p>
          )}
        </div>

        {complaint && (
          <>
            <div className="tracking-card">
              <p className="hero-tag">COMPLAINT DETAILS</p>

              <h2>{complaint.complaint_id}</h2>

              <p>
                <strong>Category:</strong> {complaint.category}
              </p>

              <p>
                <strong>Location:</strong> {complaint.location}
              </p>

              <p>
                <strong>Description:</strong> {complaint.description}
              </p>

              <p>
                <strong>Current Status:</strong>{" "}
                <span
                  className={`status status-${complaint.status
                    .toLowerCase()
                    .replaceAll(" ", "-")}`}
                >
                  {complaint.status}
                </span>
              </p>
            </div>

            <div className="timeline-card">
              <h2>Complaint Timeline</h2>

              {updates.length === 0 ? (
                <p>No timeline updates available.</p>
              ) : (
                <div className="timeline">
                  {updates.map((update, index) => (
                    <div
                      className={`timeline-item ${
                        index === updates.length - 1
                          ? "active"
                          : "completed"
                      }`}
                      key={`${update.created_at}-${index}`}
                    >
                      <div className="timeline-dot"></div>

                      <div>
                        <h3>{update.status}</h3>

                        <p>
                          {new Date(
                            update.created_at
                          ).toLocaleString("en-IN")}
                        </p>

                        {update.remarks && (
                          <p>{update.remarks}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </>
  );
}

export default TrackComplaint;