import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import SubmitComplaint from "./pages/SubmitComplaint";
import CitizenDashboard from "./pages/CitizenDashboard";
import TrackComplaint from "./pages/TrackComplaint";
import OfficerDashboard from "./pages/OfficerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/submit-complaint" element={<SubmitComplaint />} />
        <Route path="/citizen-dashboard" element={<CitizenDashboard />} />
        <Route path="/track-complaint" element={<TrackComplaint />} />
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route
  path="/officer-dashboard"
  element={<OfficerDashboard />}
/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;