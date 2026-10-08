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

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];

    if (file) {
      setFileName(file.name);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
      setError("Please login before submitting a complaint.");
      return;
    }

    try {
      const data = new FormData();

      data.append("user_id", user.id);
      data.append("category", formData.category);
      data.append("description", formData.description);
      data.append("location", formData.location);

      const fileInput = document.querySelector('input[type="file"]');

      if (fileInput && fileInput.files[0]) {
        data.append("supporting_file", fileInput.files[0]);
      }

      const response = await fetch("/api/complaints/submit", {
        method: "POST",
        body: data,
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message);
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

      setTimeout(() => {
        navigate("/citizen-dashboard");
      }, 2500);
    } catch (error) {
      console.error(error);
      setError("Unable to connect to the server.");
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

            <button type="submit" className="auth-btn">
              Submit Complaint
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