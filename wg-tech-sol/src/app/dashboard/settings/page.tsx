"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/zustand/authStore";
import MagnifyText from "@/app/components/MagnifyText";

interface Settings {
  emailNotifications: boolean;
  chatNotifications: boolean;
  weeklyReport: boolean;
  marketingEmails: boolean;
  twoFactorAuth: boolean;
}

export default function SettingsPage() {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();
  const [settings, setSettings] = useState<Settings>({
    emailNotifications: true,
    chatNotifications: true,
    weeklyReport: true,
    marketingEmails: false,
    twoFactorAuth: false,
  });
  const [loading, setLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/wgAuthForm");
    } else {
      fetchSettings();
    }
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      // TODO: Fetch actual settings from API
      setSettings({
        emailNotifications: true,
        chatNotifications: true,
        weeklyReport: true,
        marketingEmails: false,
        twoFactorAuth: false,
      });
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof Settings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSaveSettings = async () => {
    try {
      // TODO: Send settings update to API
      setSaveMessage("Settings saved successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setSaveMessage("Failed to save settings");
    }
  };

  const handleChangePassword = async () => {
    // TODO: Implement change password flow
    console.log("Change password");
  };

  const handleDeleteAccount = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete your account? This action cannot be undone.",
      )
    ) {
      try {
        // TODO: Send delete account request to API
        localStorage.removeItem("token");
        clearAuth();
        router.push("/wgAuthForm");
      } catch (error) {
        console.error("Error deleting account:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-[#9EFF00] text-xl">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-[#9EFF00] mb-2">
          <MagnifyText text="Settings" />
        </h1>
        <p className="text-gray-400">
          Manage your account preferences and security
        </p>
      </div>

      {/* Success Message */}
      {saveMessage && (
        <div
          className={`p-4 rounded-lg ${
            saveMessage.includes("successfully")
              ? "bg-green-900/20 border border-green-400/30 text-green-400"
              : "bg-red-900/20 border border-red-400/30 text-red-400"
          }`}
        >
          {saveMessage}
        </div>
      )}

      {/* Notification Settings */}
      <div className="bg-[#111] border border-[#333] rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-6">
          Notification Settings
        </h2>
        <div className="space-y-4">
          {/* Email Notifications */}
          <div className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-lg hover:border border-[#333]">
            <div>
              <p className="text-white font-semibold">Email Notifications</p>
              <p className="text-gray-400 text-sm">
                Receive email updates about your proposals
              </p>
            </div>
            <button
              onClick={() => handleToggle("emailNotifications")}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all ${
                settings.emailNotifications ? "bg-[#9EFF00]" : "bg-[#333]"
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  settings.emailNotifications
                    ? "translate-x-7"
                    : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Chat Notifications */}
          <div className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-lg hover:border border-[#333]">
            <div>
              <p className="text-white font-semibold">Chat Notifications</p>
              <p className="text-gray-400 text-sm">
                Get notified when admin sends messages
              </p>
            </div>
            <button
              onClick={() => handleToggle("chatNotifications")}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all ${
                settings.chatNotifications ? "bg-[#9EFF00]" : "bg-[#333]"
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  settings.chatNotifications ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Weekly Report */}
          <div className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-lg hover:border border-[#333]">
            <div>
              <p className="text-white font-semibold">Weekly Report</p>
              <p className="text-gray-400 text-sm">
                Receive a summary of your proposals every week
              </p>
            </div>
            <button
              onClick={() => handleToggle("weeklyReport")}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all ${
                settings.weeklyReport ? "bg-[#9EFF00]" : "bg-[#333]"
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  settings.weeklyReport ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Marketing Emails */}
          <div className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-lg hover:border border-[#333]">
            <div>
              <p className="text-white font-semibold">Marketing Emails</p>
              <p className="text-gray-400 text-sm">
                Receive updates about new services and offers
              </p>
            </div>
            <button
              onClick={() => handleToggle("marketingEmails")}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all ${
                settings.marketingEmails ? "bg-[#9EFF00]" : "bg-[#333]"
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  settings.marketingEmails ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSaveSettings}
          className="mt-6 w-full bg-[#9EFF00] text-black font-semibold py-3 rounded-lg hover:bg-[#7BCC00] transition-all"
        >
          Save Notification Settings
        </button>
      </div>

      {/* Security Settings */}
      <div className="bg-[#111] border border-[#333] rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-6">
          Security Settings
        </h2>
        <div className="space-y-4">
          {/* Two Factor Auth */}
          <div className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-lg hover:border border-[#333]">
            <div>
              <p className="text-white font-semibold">
                Two-Factor Authentication
              </p>
              <p className="text-gray-400 text-sm">
                Add an extra layer of security to your account
              </p>
            </div>
            <button
              onClick={() => handleToggle("twoFactorAuth")}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all ${
                settings.twoFactorAuth ? "bg-[#9EFF00]" : "bg-[#333]"
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  settings.twoFactorAuth ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Change Password */}
          <button
            onClick={handleChangePassword}
            className="w-full p-4 bg-[#0a0a0a] rounded-lg hover:bg-[#1a1a1a] transition-all text-left"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-semibold">Change Password</p>
                <p className="text-gray-400 text-sm">Update your password</p>
              </div>
              <span className="text-[#9EFF00]">→</span>
            </div>
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-900/10 border border-red-400/30 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-red-400 mb-4">Danger Zone</h2>
        <p className="text-gray-400 mb-4">
          Irreversible and destructive actions
        </p>
        <button
          onClick={handleDeleteAccount}
          className="w-full px-4 py-3 bg-red-900/30 text-red-400 font-semibold rounded-lg hover:bg-red-900/50 border border-red-400/50 transition-all"
        >
          Delete Account
        </button>
      </div>
    </div>
  );
}
