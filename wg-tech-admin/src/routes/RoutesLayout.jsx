import { Navigate, Outlet } from "react-router-dom";
import useUserStore from "../zustand/useUserStore";

export const ProtectedLayout = () => {
  const { user } = useUserStore();
  console.log(user, "Current User");

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const hasDesignation = Boolean(user?.designation);
  const hasRoutes = Boolean(user?.designation?.routes?.length);

  if (hasDesignation && !hasRoutes) {
    return <Navigate to="/access-denied" replace />;
  }

  return <Outlet />;
};

export const AuthProtectedLayout = () => {
  const { user } = useUserStore();
  console.log(user, "Current User");
  return <Outlet />;
};
