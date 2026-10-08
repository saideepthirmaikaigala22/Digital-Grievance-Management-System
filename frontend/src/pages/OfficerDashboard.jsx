import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";

function OfficerDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [message, setMessage] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));

  const loadComplaints = () => {
    fetch("/api/complaints/all")
      .then((response) => response.json())
      .then((data) => setComplaints(data))
      .catch((error) => console.error(error));
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  const updateStatus = async (complaintId, status) => {
    try {
      const response = await fetch(
        `/api/complaints/update-status/${complaintId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
            remarks: `Complaint status changed to ${status}.`,
            updated_by: user.id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message);
        return;
      }

      setMessage("Complaint updated successfully! ✅");
      loadComplaints();
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to the server.");
    }
  };

  const escalateComplaint = async (complaintId) => {
    try {
      const response = await fetch(
        `/api/complaints/escalate/${complaintId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            updated_by: user.id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message);
        return;
      }

      setMessage("Complaint escalated successfully! 🚨");
      loadComplaints();
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to the server.");
    }
  };

  return (
    <>
      <Navbar />

      <main className="dashboard-page">
        <div className="dashboard-header">
          <div>
            <p className="hero-tag">OFFICER PORTAL</p>
            <h1>Officer Dashboard 👮</h1>
            <p>
              Review complaints and update their resolution status.
            </p>
          </div>
        </div>

        {message && <p className="success-message">{message}</p>}

        <section className="complaints-section">
          <div className="section-heading">
            <h2>All Complaints</h2>
            <span>{complaints.length} complaints</span>
          </div>

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
                    className={`status status-${complaint.status
                      .toLowerCase()
                      .replaceAll(" ", "-")}`}
                  >
                    {complaint.status}
                  </span>
                </span>

                <span>
                  <select
                    value={complaint.status}
                    onChange={(event) =>
                      updateStatus(
                        complaint.complaint_id,
                        event.target.value
                      )
                    }
                  >
                    <option value="Submitted">Submitted</option>
                    <option value="Assigned">Assigned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Escalated">Escalated</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>

                  <button
                    className="auth-btn"
                    onClick={() =>
                      escalateComplaint(complaint.complaint_id)
                    }
                    style={{ marginTop: "8px" }}
                  >
                    Escalate
                  </button>
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}

export default OfficerDashboard;