import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

function Home() {
  return (
    <>
      <Navbar />

      <main>
        <section className="hero">
          <div className="hero-content">
            <p className="hero-tag">DIGITAL GRIEVANCE MANAGEMENT</p>

            <h1>
              Raise Your Voice.
              <br />
              Get It Resolved.
            </h1>

            <p className="hero-text">
              Submit complaints, track their progress, and stay informed
              throughout the resolution process.
            </p>

            <div className="hero-buttons">
              <Link to="/register" className="btn primary-btn">
                Register a Complaint
              </Link>

              <Link to="/login" className="btn secondary-btn">
                Track Complaint
              </Link>
            </div>
          </div>
        </section>

        <section className="features">
          <h2>How It Works</h2>

          <div className="feature-grid">
            <div className="feature-card">
              <span>01</span>
              <h3>Submit</h3>
              <p>
                Register your complaint with the required details and
                supporting documents.
              </p>
            </div>

            <div className="feature-card">
              <span>02</span>
              <h3>Track</h3>
              <p>
                Use your complaint ID to monitor the progress of your grievance.
              </p>
            </div>

            <div className="feature-card">
              <span>03</span>
              <h3>Resolve</h3>
              <p>
                Authorities review your complaint and take appropriate action.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

export default Home;