
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

function SubmitComplaint() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    category: "",
    description: "",
    location: "",
  });

  const [fileName, setFileName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    setFormData((previousData) => ({
      ...previousData,
      [event.target.name]: event.target.value,
    }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setFileName(file ? file.name : "");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    let user;
    let token;

    try {
      const storedUser = localStorage.getItem("user");
      token = localStorage.getItem("token");
      user = storedUser ? JSON.parse(storedUser) : null;
    } catch {
      setError("Your login session is invalid. Please log in again.");
      navigate("/login");
      return;
    }

    if (!user || !token) {
      setError("Please log in before submitting a complaint.");
      navigate("/login");
      return;
    }

    if (user.role !== "Citizen") {
      setError("Only citizen accounts can submit complaints.");
      return;
    }

    const API_URL = import.meta.env.VITE_API_URL;

    if (!API_URL) {
      setError("Server configuration is missing. Please try again later.");
      return;
    }

    setIsSubmitting(true);

    try {
      const data = new FormData();

      // The backend identifies the citizen from the verified JWT token.
      // Do not send user_id from the browser.
      data.append("category", formData.category);
      data.append("description", formData.description);
      data.append("location", formData.location);

      const fileInput = event.currentTarget.querySelector(
        'input[type="file"]'
      );

      if (fileInput?.files?.[0]) {
        data.append("supporting_file", fileInput.files[0]);
      }

      const response = await fetch(
        `${API_URL}/api/complaints/submit`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: data,
        }
      );

      const result = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setError("Your session has expired. Please log in again.");
        navigate("/login");
        return;
      }

      if (!response.ok) {
        setError(result.message || "Unable to submit your complaint.");
        return;
      }

      setMessage(
        `Complaint submitted successfully! Complaint ID: ${result.complaintId}`
      );

      setFormData({
        category: "",
        description: "",
        location: "",
      });

      setFileName("");

      if (fileInput) {
        fileInput.value = "";
      }

      setTimeout(() => {
        navigate("/citizen-dashboard");
      }, 2500);
    } catch (error) {
      console.error("Complaint submission error:", error);
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />

      <div className="complaint-page">
        <div className="complaint-card">
          <div className="complaint-heading">
            <p className="hero-tag">GRIEVANCE REGISTRATION</p>

            <h1>Register a Complaint</h1>

            <p>
              Provide the details below so the concerned department can
              review and resolve your grievance.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <label>Complaint Category</label>

            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">Select a category</option>
              <option value="Public Services">Public Services</option>
              <option value="Roads & Infrastructure">
                Roads & Infrastructure
              </option>
              <option value="Water Supply">Water Supply</option>
              <option value="Electricity">Electricity</option>
              <option value="Sanitation">Sanitation</option>
              <option value="Government Office">Government Office</option>
              <option value="Other">Other</option>
            </select>

            <label>Complaint Description</label>

            <textarea
              name="description"
              rows="6"
              placeholder="Describe your complaint in detail..."
              value={formData.description}
              onChange={handleChange}
              required
            />

            <label>Location</label>

            <input
              type="text"
              name="location"
              placeholder="Enter the location related to your complaint"
              value={formData.location}
              onChange={handleChange}
              required
            />

            <label>Supporting Document / Image</label>

            <input
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              onChange={handleFileChange}
            />

            {fileName && (
              <p className="file-name">
                Selected file: {fileName}
              </p>
            )}

            <button
              type="submit"
              className="auth-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Complaint"}
            </button>
          </form>

          {message && (
            <p className="success-message">
              {message}
            </p>
          )}

          {error && (
            <p className="error-message">
              {error}
            </p>
          )}
        </div>
      </div>
    </>
  );
}

export default SubmitComplaint;
