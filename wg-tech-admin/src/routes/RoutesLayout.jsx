import { Navigate, Outlet } from "react-router-dom";
import useUserStore from "../zustand/useUserStore";

export const ProtectedLayout = () => {
  const { user } = useUserStore();
  console.log(user, "Current User");

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const storedRole = String(user?.role || "").toLowerCase();
  const designationRole = String(user?.designation?.roleName || "").toLowerCase();
  const role = storedRole && storedRole !== "user" ? storedRole : designationRole || storedRole;
  if (!["admin", "worker"].includes(role)) {
    return <Navigate to="/access-denied" replace />;
  }

  const hasDesignation = Boolean(user?.designation);
  const hasRoutes = Boolean(user?.designation?.routes?.length);

  if (role !== "worker" && hasDesignation && !hasRoutes) {
    return <Navigate to="/access-denied" replace />;
  }

  return <Outlet />;
};

export const AuthProtectedLayout = () => {
  const { user } = useUserStore();
  console.log(user, "Current User");
  return <Outlet />;
};
