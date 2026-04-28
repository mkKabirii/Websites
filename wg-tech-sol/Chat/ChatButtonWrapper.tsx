"use client";

import React, { useEffect, useState } from "react";
import ClientChatButton from "./ClientChatButton";
import { useAuthStore } from "@/zustand/authStore";

export default function ChatButtonWrapper() {
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [forcedHydration, setForcedHydration] = useState(false);
  const {
    user: authUser,
    token: authToken,
    isHydrated,
    setHydrated,
  } = useAuthStore();

  // Hydration fallback: if not hydrated after a short delay, force it
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isHydrated) {
        setHydrated(true);
        setForcedHydration(true);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [isHydrated, setHydrated]);

  useEffect(() => {
    setMounted(true);
    // Initialize if either hydrated OR forced hydration timeout has occurred
    const shouldInitialize = isHydrated || forcedHydration;
    if (shouldInitialize) {
      initializeGuestUser();
    }
  }, [authUser, authToken, isHydrated, forcedHydration]);

  const initializeGuestUser = async () => {
    // Prefer persisted auth-store user (real client login) — NO GUEST FALLBACK
    const tokenFromStore = authToken || localStorage.getItem("token");
    if (authUser && tokenFromStore) {
      setUser({
        userId: authUser._id,
        userName: authUser.fullname || authUser.username || authUser.email,
        userEmail: authUser.email,
        userProfileImage:
          (authUser as any).profileImage ||
          authUser.profilePicture ||
          "https://via.placeholder.com/40",
        token: tokenFromStore,
        chatRole: authUser.userType || authUser.designation || "client",
      });
      return;
    }

    // Only create guest if NO logged-in user AND NO localStorage fallback
    const MAX_RETRIES = 3;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
      try {
        const response = await fetch(
          "http://localhost:8003/api/v1/auth/guest-login",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: "Guest User",
              company: "Guest Company",
            }),
          },
        );

        const data = await response.json();

        if (response.ok && data.success && data.token) {
          localStorage.setItem("token", data.token);
          localStorage.setItem(
            "user",
            JSON.stringify(data.user || data.client),
          );

          const userData = data.user || data.client;
          setUser({
            userId: userData._id,
            userName: userData.username || userData.name,
            userEmail: userData.email,
            userProfileImage: "https://via.placeholder.com/40",
            token: data.token,
            chatRole: "guest",
          });
          return;
        }

        console.error("❌ Guest login failed:", {
          status: response.status,
          error: data.message || data?.error || JSON.stringify(data),
          attempt,
        });
      } catch (error) {
        console.error("❌ Error initializing guest user:", error);
      }
    }

    console.error("❌ Guest login failed after retries; chat disabled.");
  };

  if (!mounted || !user) {
    return null;
  }

  const preferredChatType =
    user?.chatRole === "client" ? "admin_work" : "website";
  const fallbackChatType = "website";

  return (
    <ClientChatButton
      userId={user.userId}
      userName={user.userName}
      userEmail={user.userEmail}
      userProfileImage={user.userProfileImage}
      token={user.token}
      preferredChatType={preferredChatType}
      fallbackChatType={fallbackChatType}
    />
  );
}
