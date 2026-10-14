
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import SubmitComplaint from "./pages/SubmitComplaint";
import CitizenDashboard from "./pages/CitizenDashboard";
import TrackComplaint from "./pages/TrackComplaint";
import OfficerDashboard from "./pages/OfficerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Public complaint tracking remains available */}
        <Route path="/track-complaint" element={<TrackComplaint />} />

        {/* Citizen-only pages */}
        <Route element={<ProtectedRoute allowedRoles={["Citizen"]} />}>
          <Route
            path="/submit-complaint"
            element={<SubmitComplaint />}
          />
          <Route
            path="/citizen-dashboard"
            element={<CitizenDashboard />}
          />
        </Route>

        {/* Officer-only pages */}
        <Route element={<ProtectedRoute allowedRoles={["Officer"]} />}>
          <Route
            path="/officer-dashboard"
            element={<OfficerDashboard />}
          />
        </Route>

        {/* Admin-only pages */}
        <Route element={<ProtectedRoute allowedRoles={["Admin"]} />}>
          <Route
            path="/admin-dashboard"
            element={<AdminDashboard />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
