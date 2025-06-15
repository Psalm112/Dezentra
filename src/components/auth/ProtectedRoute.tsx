import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Loadscreen from "../../pages/Loadscreen";

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // console.log("Protected route check:", { isAuthenticated, isLoading });

  if (isLoading) {
    return <Loadscreen />;
  }

  if (!isAuthenticated) {
    // console.log("User not authenticated, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
