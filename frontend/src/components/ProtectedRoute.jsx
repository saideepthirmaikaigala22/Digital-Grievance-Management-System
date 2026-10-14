
import { Navigate, Outlet } from "react-router-dom";

function ProtectedRoute({ allowedRoles }) {
  let user = null;
  let token = null;

  try {
    const storedUser = localStorage.getItem("user");
    token = localStorage.getItem("token");
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch {
    user = null;
  }

  if (!token || !user?.id || !user?.role) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    if (user.role === "Admin") {
      return <Navigate to="/admin-dashboard" replace />;
    }

    if (user.role === "Officer") {
      return <Navigate to="/officer-dashboard" replace />;
    }

    if (user.role === "Citizen") {
      return <Navigate to="/citizen-dashboard" replace />;
    }

    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
