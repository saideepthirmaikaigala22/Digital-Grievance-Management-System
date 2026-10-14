
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

const API_URL = import.meta.env.VITE_API_URL;

function CitizenDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      setError("Please log in to view your complaints.");
      return;
    }

    const fetchComplaints = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/api/complaints/my-complaints/${user.id}`
        );

        if (!response.ok) {
          throw new Error(`Failed to load complaints (${response.status})`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("Unexpected response from the server.");
        }

        setComplaints(data);
      } catch (err) {
        console.error("Error loading complaints:", err);
        setError(err.message || "Unable to load complaints.");
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, [user?.id]);

  const total = complaints.length;

  const inProgress = complaints.filter(
    (complaint) =>
      complaint.status === "In Progress" ||
      complaint.status === "Assigned" ||
      complaint.status === "Escalated"
  ).length;

  const resolved = complaints.filter(
    (complaint) =>
      complaint.status === "Resolved" ||
      complaint.status === "Closed"
  ).length;

  const submitted = complaints.filter(
    (complaint) => complaint.status === "Submitted"
  ).length;

  return (
    <>
      <Navbar />

      <main className="dashboard-page">
        <div className="dashboard-header">
          <div>
            <p className="hero-tag">CITIZEN PORTAL</p>

            <h1>Welcome, {user?.name || "Citizen"} 👋</h1>

            <p>Manage and track your grievances from one place.</p>
          </div>

          <Link to="/submit-complaint" className="btn primary-btn">
            + Register Complaint
          </Link>
        </div>

        <section className="stats-grid">
          <div className="stat-card">
            <span>Total Complaints</span>
            <strong>{total}</strong>
          </div>

          <div className="stat-card">
            <span>In Progress</span>
            <strong>{inProgress}</strong>
          </div>

          <div className="stat-card">
            <span>Resolved</span>
            <strong>{resolved}</strong>
          </div>

          <div className="stat-card">
            <span>Submitted</span>
            <strong>{submitted}</strong>
          </div>
        </section>

        <section className="complaints-section">
          <div className="section-heading">
            <h2>My Complaints</h2>
            <span>Live from database</span>
          </div>

          {loading ? (
            <p>Loading complaints...</p>
          ) : error ? (
            <p role="alert">{error}</p>
          ) : complaints.length === 0 ? (
            <p>No complaints submitted yet.</p>
          ) : (
            <div className="complaint-table">
              <div className="table-header">
                <span>Complaint ID</span>
                <span>Category</span>
                <span>Date</span>
                <span>Status</span>
                <span>Action</span>
              </div>

              {complaints.map((complaint) => (
                <div className="table-row" key={complaint.id}>
                  <span className="complaint-id">
                    {complaint.complaint_id}
                  </span>

                  <span>{complaint.category}</span>

                  <span>
                    {complaint.created_at
                      ? new Date(complaint.created_at).toLocaleDateString(
                          "en-IN"
                        )
                      : "—"}
                  </span>

                  <span>
                    <span
                      className={`status status-${(complaint.status || "submitted")
                        .toLowerCase()
                        .replaceAll(" ", "-")}`}
                    >
                      {complaint.status || "Submitted"}
                    </span>
                  </span>

                  <Link
                    to={`/track-complaint?complaintId=${encodeURIComponent(
                      complaint.complaint_id
                    )}`}
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}

export default CitizenDashboard;
