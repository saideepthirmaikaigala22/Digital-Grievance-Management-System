
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

function OfficerDashboard() {
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [loading, setLoading] = useState(true);
  const [busyComplaint, setBusyComplaint] = useState("");

  const API_URL = import.meta.env.VITE_API_URL;

  let token = null;
  let user = null;

  try {
    token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch {
    user = null;
  }

  const isOfficer = user?.role === "Officer";

  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);
  };

  const handleUnauthorized = (status, serverMessage) => {
    if (status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login", { replace: true });
      return true;
    }

    if (status === 403) {
      showMessage(
        serverMessage || "You are not authorized to perform this action.",
        "error"
      );
      return true;
    }

    return false;
  };

  const loadComplaints = useCallback(async () => {
    if (!API_URL) {
      showMessage("Server configuration is missing.", "error");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/complaints/all`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        if (handleUnauthorized(response.status, data.message)) {
          return;
        }

        throw new Error(data.message || "Failed to load complaints.");
      }

      if (!Array.isArray(data)) {
        throw new Error("Unexpected response from the server.");
      }

      setComplaints(data);
    } catch (error) {
      console.error("Error loading complaints:", error);
      showMessage(
        error.message || "Unable to load complaints. Please try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [API_URL, token, navigate]);

  useEffect(() => {
    if (!token || !user?.id) {
      navigate("/login", { replace: true });
      return;
    }

    if (!isOfficer) {
      if (user.role === "Admin") {
        navigate("/admin-dashboard", { replace: true });
      } else if (user.role === "Citizen") {
        navigate("/citizen-dashboard", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
      return;
    }

    loadComplaints();
  }, [token, user?.id, user?.role, isOfficer, navigate, loadComplaints]);

  const updateStatus = async (complaintId, status) => {
    if (!API_URL || busyComplaint) return;

    setBusyComplaint(complaintId);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/complaints/update-status/${encodeURIComponent(
          complaintId
        )}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status,
            remarks: `Complaint status changed to ${status}.`,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (!handleUnauthorized(response.status, data.message)) {
          showMessage(data.message || "Unable to update complaint.", "error");
        }
        return;
      }

      showMessage("Complaint updated successfully! ✅");
      await loadComplaints();
    } catch (error) {
      console.error("Error updating complaint:", error);
      showMessage("Unable to connect to the server.", "error");
    } finally {
      setBusyComplaint("");
    }
  };

  const escalateComplaint = async (complaintId) => {
    if (!API_URL || busyComplaint) return;

    setBusyComplaint(complaintId);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/complaints/escalate/${encodeURIComponent(
          complaintId
        )}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (!handleUnauthorized(response.status, data.message)) {
          showMessage(
            data.message || "Unable to escalate complaint.",
            "error"
          );
        }
        return;
      }

      showMessage("Complaint escalated successfully! 🚨");
      await loadComplaints();
    } catch (error) {
      console.error("Error escalating complaint:", error);
      showMessage("Unable to connect to the server.", "error");
    } finally {
      setBusyComplaint("");
    }
  };

  if (!token || !user || !isOfficer) {
    return null;
  }

  return (
    <>
      <Navbar />

      <main className="dashboard-page">
        <div className="dashboard-header">
          <div>
            <p className="hero-tag">OFFICER PORTAL</p>
            <h1>Officer Dashboard 👮</h1>
            <p>Review complaints and update their resolution status.</p>
          </div>
        </div>

        {message && (
          <p
            className={
              messageType === "error"
                ? "error-message"
                : "success-message"
            }
            role="status"
          >
            {message}
          </p>
        )}

        <section className="complaints-section">
          <div className="section-heading">
            <h2>All Complaints</h2>
            <span>{complaints.length} complaints</span>
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
                <span>Status</span>
                <span>Action</span>
              </div>

              {complaints.map((complaint) => (
                <div className="table-row" key={complaint.id}>
                  <span className="complaint-id">
                    {complaint.complaint_id}
                  </span>

                  <span>{complaint.citizen_name}</span>

                  <span>{complaint.category}</span>

                  <span>
                    <span
                      className={`status status-${(
                        complaint.status || "submitted"
                      )
                        .toLowerCase()
                        .replaceAll(" ", "-")}`}
                    >
                      {complaint.status || "Submitted"}
                    </span>
                  </span>

                  <span>
                    <select
                      value={complaint.status || "Submitted"}
                      disabled={busyComplaint === complaint.complaint_id}
                      onChange={(event) => {
                        const newStatus = event.target.value;

                        if (newStatus !== complaint.status) {
                          updateStatus(complaint.complaint_id, newStatus);
                        }
                      }}
                    >
                      <option value="Submitted">Submitted</option>
                      <option value="Assigned">Assigned</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Escalated">Escalated</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>

                    <button
                      type="button"
                      className="auth-btn"
                      disabled={Boolean(busyComplaint)}
                      onClick={() =>
                        escalateComplaint(complaint.complaint_id)
                      }
                      style={{ marginTop: "8px" }}
                    >
                      {busyComplaint === complaint.complaint_id
                        ? "Please wait..."
                        : "Escalate"}
                    </button>
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

export default OfficerDashboard;
