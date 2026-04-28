import "./App.css";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import {
  AUTH_ROUTES,
  ADMIN_ROUTES,
  buildRoutesFromDesignation,
} from "./routes";
import MainLayout from "./components/layout";
import AdminLayout from "./components/adminLayout";
import useUserStore from "./zustand/useUserStore";
import { AuthProtectedLayout, ProtectedLayout } from "./routes/RoutesLayout";
import { SnackbarProvider } from "notistack";
import AccessDenied from "./app/auth/accessDenied";
import AccessGranted from "./app/auth/accessGranted";
import ViewDetails from "./app/projectsProgressManagement/viewDetails";
import ViewProposals from "./app/proposals/viewProposals";

function App() {
  const { user } = useUserStore();
  const effectiveAdminRoutes = user?.designation
    ? buildRoutesFromDesignation(user.designation)
    : ADMIN_ROUTES;

  return (
    <SnackbarProvider
      maxSnack={3}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route element={<AuthProtectedLayout />}>
            {AUTH_ROUTES?.map((route) => (
              <Route
                key={route.id}
                path={route.path}
                element={<AdminLayout>{route.component}</AdminLayout>}
              />
            ))}
            <Route path="access-denied" element={<AccessDenied />} />
            <Route path="access-granted" element={<AccessGranted />} />
          </Route>

          {/* Protected Routes */}
          <Route element={<ProtectedLayout />}>
            {effectiveAdminRoutes?.map((route) => (
              <Route
                key={route.id}
                path={route.path}
                element={<MainLayout>{route.component}</MainLayout>}
              />
            ))}
            <Route
              path="view-project-progress/:id"
              element={
                <MainLayout>
                  <ViewDetails />
                </MainLayout>
              }
            />
            <Route
              path="proposals/:proposalId"
              element={
                <MainLayout>
                  <ViewProposals />
                </MainLayout>
              }
            />
          </Route>

          {/* Fallback Route */}
          <Route
            path="*"
            element={<Navigate to={user ? "/" : "/login"} replace />}
          />
        </Routes>
      </BrowserRouter>
    </SnackbarProvider>
  );
}

export default App;
