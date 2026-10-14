
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

function AdminDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const API_URL = import.meta.env.VITE_API_URL;

  const isAdmin = user?.role === "Admin";

  const loadComplaints = async () => {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(`${API_URL}/api/complaints/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Failed to load complaints.");
        return;
      }

      setComplaints(data);
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token || !user) {
      navigate("/login", { replace: true });
      return;
    }

    if (!isAdmin) {
      navigate(
        user.role === "Officer"
          ? "/officer-dashboard"
          : "/citizen-dashboard",
        { replace: true }
      );
      return;
    }

    loadComplaints();
  }, []);

  const total = complaints.length;

  const submitted = complaints.filter(
    (complaint) => complaint.status === "Submitted"
  ).length;

  const inProgress = complaints.filter(
    (complaint) =>
      complaint.status === "Assigned" ||
      complaint.status === "In Progress"
  ).length;

  const escalated = complaints.filter(
    (complaint) => complaint.status === "Escalated"
  ).length;

  const resolved = complaints.filter(
    (complaint) =>
      complaint.status === "Resolved" ||
      complaint.status === "Closed"
  ).length;

  const categoryCounts = complaints.reduce((acc, complaint) => {
    acc[complaint.category] = (acc[complaint.category] || 0) + 1;
    return acc;
  }, {});

  if (!token || !user || !isAdmin) {
    return null;
  }

  return (
    <>
      <Navbar />

      <main className="dashboard-page">
        <div className="dashboard-header">
          <div>
            <p className="hero-tag">ADMIN PORTAL</p>
            <h1>Admin Dashboard 👑</h1>
            <p>
              Monitor complaints, resolution progress, and grievance
              performance.
            </p>
          </div>
        </div>

        {message && <p className="success-message">{message}</p>}

        <section className="stats-grid">
          <div className="stat-card">
            <span>Total Complaints</span>
            <strong>{total}</strong>
          </div>

          <div className="stat-card">
            <span>Submitted</span>
            <strong>{submitted}</strong>
          </div>

          <div className="stat-card">
            <span>In Progress</span>
            <strong>{inProgress}</strong>
          </div>

          <div className="stat-card">
            <span>Escalated</span>
            <strong>{escalated}</strong>
          </div>

          <div className="stat-card">
            <span>Resolved</span>
            <strong>{resolved}</strong>
          </div>
        </section>

        <section className="complaints-section">
          <div className="section-heading">
            <h2>Complaint Analytics</h2>
            <span>Category-wise complaints</span>
          </div>

          <div className="stats-grid">
            {Object.entries(categoryCounts).map(([category, count]) => (
              <div className="stat-card" key={category}>
                <span>{category}</span>
                <strong>{count}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="complaints-section">
          <div className="section-heading">
            <h2>All Complaints</h2>
            <span>Live from database</span>
          </div>

          {loading ? (
            <p>Loading complaints...</p>
          ) : complaints.length === 0 ? (
            <p>No complaints available.</p>
          ) : (
            <div className="complaint-table">
              <div className="table-header">
                <span>Complaint ID</span>
                <span>Citizen</span>
                <span>Category</span>
                <span>Location</span>
                <span>Status</span>
              </div>

              {complaints.map((complaint) => (
                <div className="table-row" key={complaint.id}>
                  <span className="complaint-id">
                    {complaint.complaint_id}
                  </span>

                  <span>{complaint.citizen_name}</span>

                  <span>{complaint.category}</span>

                  <span>{complaint.location}</span>

                  <span>
                    <span
                      className={`status status-${complaint.status
                        .toLowerCase()
                        .replaceAll(" ", "-")}`}
                    >
                      {complaint.status}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}

export default AdminDashboard;
