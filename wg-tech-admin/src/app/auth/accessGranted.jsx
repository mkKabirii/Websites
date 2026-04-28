import React, { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import VideoScreen from "../../components/videoScreen";
import accessGrantedVideo from "../../assets/access-granted.mp4";
import accessGrantedImage from "../../assets/accessGranted.gif";
import { Box } from "@mui/material";
import useUserStore from "../../zustand/useUserStore";

const AccessGranted = () => {
  const navigate = useNavigate();
  const { user } = useUserStore();

  const navigateToFirstRoute = useCallback(() => {
    const storedRole = String(user?.role || "").toLowerCase();
    const designationRole = String(user?.designation?.roleName || "").toLowerCase();
    const role =
      storedRole && storedRole !== "user" ? storedRole : designationRole || storedRole;

    if (role === "worker") {
      navigate("/my-projects");
      return;
    }

    // Get first route from user's designation routes
    const userRoutes = user?.designation?.routes || [];
    if (userRoutes.length > 0) {
      // Sort routes by order and get first route
      const sortedRoutes = [...userRoutes].sort(
        (a, b) => (a.order || 0) - (b.order || 0),
      );
      const firstRoute = sortedRoutes[0];
      const firstRoutePath = firstRoute?.path;

      if (firstRoutePath) {
        navigate(firstRoutePath);
      } else {
        navigate("/");
      }
    } else {
      navigate("/");
    }
  }, [user, navigate]);

  const handleVideoEnd = () => {
    // Navigate to first route after video ends
    navigateToFirstRoute();
  };

  useEffect(() => {
    // Auto navigate after 5 seconds if video doesn't end naturally
    const timer = setTimeout(() => {
      navigateToFirstRoute();
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigateToFirstRoute]);

  return (
    <VideoScreen
      videoSource={accessGrantedVideo}
      onVideoEnd={handleVideoEnd}
      isAccessGranted={true}
    />
  );
};

export default AccessGranted;
