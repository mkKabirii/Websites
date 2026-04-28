"use client";
import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/zustand/authStore";
import MagnifyText from "@/app/components/MagnifyText";
import {
  ChartBarSquareIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  UserIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.push("/wgAuthForm");
  }, []);

  const stats = [
    {
      id: "chats",
      icon: (
        <ChatBubbleOvalLeftEllipsisIcon className="h-8 w-8 text-[#9EFF00]" />
      ),
      label: "Active Chats",
      value: "2",
      href: "/dashboard/chat",
      color: "bg-[#0f0f0f] text-[#9EFF00]",
    },
    {
      id: "proposals",
      icon: <DocumentTextIcon className="h-8 w-8 text-[#9EFF00]" />,
      label: "Proposals",
      value: "1",
      href: "/dashboard/proposals",
      color: "bg-[#0f0f0f] text-[#9EFF00]",
    },
    {
      id: "completed",
      icon: <ChartBarSquareIcon className="h-8 w-8 text-[#9EFF00]" />,
      label: "Completed",
      value: "3",
      href: "/dashboard/proposals",
      color: "bg-[#0f0f0f] text-[#9EFF00]",
    },
    {
      id: "pending",
      icon: <Cog6ToothIcon className="h-8 w-8 text-[#9EFF00]" />,
      label: "Pending",
      value: "1",
      href: "/dashboard/proposals",
      color: "bg-[#0f0f0f] text-[#9EFF00]",
    },
  ];

  const quickActions = [
    {
      icon: (
        <ChatBubbleOvalLeftEllipsisIcon className="h-7 w-7 text-[#9EFF00]" />
      ),
      title: "Chat with Admin",
      description: "Send messages and get support",
      href: "/dashboard/chat",
      color: "bg-[#0f0f0f] border border-[#9EFF00]/20",
    },
    {
      icon: <UserIcon className="h-7 w-7 text-[#9EFF00]" />,
      title: "Edit Profile",
      description: "Update your account information",
      href: "/dashboard/profile",
      color: "bg-[#0f0f0f] border border-[#9EFF00]/20",
    },
    {
      icon: <DocumentTextIcon className="h-7 w-7 text-[#9EFF00]" />,
      title: "View Proposals",
      description: "Track your submitted proposals",
      href: "/dashboard/proposals",
      color: "bg-[#0f0f0f] border border-[#9EFF00]/20",
    },
    {
      icon: <Cog6ToothIcon className="h-7 w-7 text-[#9EFF00]" />,
      title: "Settings",
      description: "Manage your preferences",
      href: "/dashboard/settings",
      color: "bg-[#0f0f0f] border border-[#9EFF00]/20",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Card */}
      <div className="wg-card bg-[#0f0f0f] border border-[#9EFF00]/30 rounded-xl p-8">
        <h1 className="text-4xl font-bold text-[#9EFF00] mb-2">
          <MagnifyText
            text={`Welcome back, ${user?.fullname?.split(" ")[0] ?? "there"}!`}
          />
        </h1>
        <p className="text-gray-400">
          Here's your personal dashboard to manage your account and communicate
          with our team.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link key={stat.id} href={stat.href}>
            <div
              className={`wg-card ${stat.color} border border-[#9EFF00]/20 rounded-lg p-6 cursor-pointer hover:scale-105 hover:border-[#9EFF00]/40 transition-all`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
                <span className="text-4xl">{stat.icon}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((action, index) => (
            <Link key={index} href={action.href}>
              <div
                className={`wg-card ${action.color} rounded-lg p-6 cursor-pointer hover:shadow-lg hover:shadow-[#9EFF00]/20 transition-all group`}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-4xl">{action.icon}</span>
                  <span className="text-white/60 group-hover:text-white transition-all">
                    →
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-1">
                  {action.title}
                </h3>
                <p className="text-white/70 text-sm">{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="wg-card bg-[#111] border border-[#333] rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Recent Activity</h2>
        <div className="space-y-3">
          <div className="wg-card flex items-center justify-between p-4 bg-[#1a1a1a] rounded-lg hover:bg-[#222] transition-all">
            <div>
              <p className="text-white font-medium">New message from admin</p>
              <p className="text-gray-400 text-sm">About your proposal</p>
            </div>
            <span className="text-gray-500 text-sm">2 hours ago</span>
          </div>
          <div className="wg-card flex items-center justify-between p-4 bg-[#1a1a1a] rounded-lg hover:bg-[#222] transition-all">
            <div>
              <p className="text-white font-medium">Proposal submitted</p>
              <p className="text-gray-400 text-sm">
                Your proposal has been received
              </p>
            </div>
            <span className="text-gray-500 text-sm">1 day ago</span>
          </div>
          <div className="wg-card flex items-center justify-between p-4 bg-[#1a1a1a] rounded-lg hover:bg-[#222] transition-all">
            <div>
              <p className="text-white font-medium">Account created</p>
              <p className="text-gray-400 text-sm">Welcome to WG Tech Sol</p>
            </div>
            <span className="text-gray-500 text-sm">5 days ago</span>
          </div>
        </div>
      </div>
    </div>
  );
}
