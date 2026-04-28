"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/zustand/authStore";
import { getProfile } from "@/api/module/user";
import Image from "next/image";
import {
  Squares2X2Icon,
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
} from "@heroicons/react/24/outline";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const getProfileSrc = (path?: string) =>
    path
      ? path.startsWith("http")
        ? path
        : `http://localhost:8003${path}`
      : "";
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const { user, clearAuth, setAuth, isHydrated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isHydrated) return;

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/wgAuthForm");
      return;
    }

    const role = String(user?.userType || user?.role || user?.designation || "").toLowerCase();
    if (user && role !== "client") {
      localStorage.removeItem("token");
      clearAuth();
      router.push("/wgAuthForm");
      return;
    }

    setIsLoading(false);

    if (!user) {
      (async () => {
        try {
          const res = await getProfile();
          if (res.status === 200 || res.status === 201) {
            const data = res.data?.data || res.data;
            const normalizedUser = {
              _id: data._id,
              fullname: data.fullname || data.username || data.name,
              email: data.email,
              profilePicture: data.profilePicture || data.profileImage,
              nationalId: data.nationalId || null,
              designation: data.role || data.designation,
              userType: data.role || data.userType || "user",
            };
            if (normalizedUser.userType !== "client") {
              localStorage.removeItem("token");
              clearAuth();
              router.push("/wgAuthForm");
              return;
            }
            setAuth({ token, user: normalizedUser });
          }
        } catch {
          // If profile load fails, keep existing auth state.
        }
      })();
    }
  }, [isHydrated, user, router, setAuth]);

  const displayName = user?.fullname || user?.username || user?.email || "User";
  const displayInitial = displayName?.charAt(0)?.toUpperCase() || "U";

  const handleLogout = () => {
    localStorage.removeItem("token");
    clearAuth();
    router.push("/wgAuthForm");
  };

  const menuItems = [
    {
      icon: <Squares2X2Icon className="h-6 w-6" />,
      label: "Dashboard",
      href: "/dashboard",
      active: pathname === "/dashboard",
    },
    {
      icon: <ChatBubbleLeftRightIcon className="h-6 w-6" />,
      label: "Chats",
      href: "/dashboard/chat",
      active: pathname === "/dashboard/chat",
    },
    {
      icon: <UserCircleIcon className="h-6 w-6" />,
      label: "My Account",
      href: "/dashboard/profile",
      active: pathname === "/dashboard/profile",
    },
    {
      icon: <ClipboardDocumentListIcon className="h-6 w-6" />,
      label: "My Proposals",
      href: "/dashboard/proposals",
      active: pathname === "/dashboard/proposals",
    },
    {
      icon: <Cog6ToothIcon className="h-6 w-6" />,
      label: "Settings",
      href: "/dashboard/settings",
      active: pathname === "/dashboard/settings",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-[#9EFF00] text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex bg-black text-white min-h-screen">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen overflow-y-auto bg-gradient-to-b from-[#1a1a1a] to-black border-r border-[#333] z-40 transition-transform duration-300 ${
          isSidebarOpen ? "translate-x-0 w-64" : "-translate-x-full"
        } lg:relative lg:translate-x-0 lg:w-64`}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-[#333]">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/Logo.png"
              alt="Logo"
              width={40}
              height={40}
              className="h-10 w-10 object-contain"
            />
            <span className="font-bold text-[#9EFF00]">Client Hub</span>
          </Link>
        </div>

        {/* User Info */}
        <div className="p-6 border-b border-[#333]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-[#9EFF00] flex items-center justify-center text-black font-bold overflow-hidden">
              {user?.profilePicture ? (
                <img
                  src={getProfileSrc(user.profilePicture)}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{displayInitial}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">
                {displayName}
              </p>
              <p className="text-gray-400 text-xs truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                // Close sidebar on mobile when navigating
                if (window.innerWidth < 1024) {
                  setIsSidebarOpen(false);
                }
              }}
              className={`wg-nav-glow flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                item.active
                  ? "bg-[#9EFF00] text-black font-semibold"
                  : "text-gray-300 hover:text-[#9EFF00]"
              }`}
            >
              <span className="text-xl text-gray-400">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-[#333]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-red-900/20 text-red-400 hover:bg-red-900/40 transition-all font-medium"
          >
            <ArrowLeftOnRectangleIcon className="h-6 w-6 text-gray-400" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="sticky top-0 bg-[#111] border-b border-[#333] p-4 flex items-center justify-between lg:hidden z-30">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-[#222] rounded-lg transition-all"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <span className="text-[#9EFF00] font-bold">Client Dashboard</span>
          <div className="w-6"></div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
