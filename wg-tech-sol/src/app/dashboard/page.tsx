"use client";
import React, { useEffect, useState } from "react";
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

  const [activeChats, setActiveChats] = useState(0);
  const [totalProposals, setTotalProposals] = useState(0);
  const [completedProposals, setCompletedProposals] = useState(0);
  const [pendingProposals, setPendingProposals] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/wgAuthForm");
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003";

        // Fetch Chats
        let chatCount = 0;
        if (user?._id) {
          try {
            const chatRes = await fetch(`${API_URL}/api/v1/chats/user/${user._id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (chatRes.ok) {
              const chatData = await chatRes.json();
              chatCount = chatData.data?.length || 0;
            }
          } catch (e) {
            console.error("Error fetching chats:", e);
          }
        }
        setActiveChats(chatCount);

        // Fetch Proposals
        if (user?.email) {
          try {
            const propsRes = await fetch(`${API_URL}/api/v1/proposals?search=${encodeURIComponent(user.email)}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (propsRes.ok) {
              const propsData = await propsRes.json();
              const proposals = propsData.data?.proposals || [];
              setTotalProposals(proposals.length);
              setCompletedProposals(proposals.filter((p: any) => p.status?.toLowerCase() === "completed").length);
              setPendingProposals(proposals.filter((p: any) => p.status?.toLowerCase() === "pending").length);
            }
          } catch (e) {
            console.error("Error fetching proposals:", e);
          }
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user, router]);

  const stats = [
    {
      id: "chats",
      icon: (
        <ChatBubbleOvalLeftEllipsisIcon className="h-8 w-8 text-[#9EFF00]" />
      ),
      label: "Active Chats",
      value: isLoading ? "..." : activeChats.toString(),
      href: "/dashboard/chat",
      color: "bg-[#0f0f0f] text-[#9EFF00]",
    },
    {
      id: "proposals",
      icon: <DocumentTextIcon className="h-8 w-8 text-[#9EFF00]" />,
      label: "Proposals",
      value: isLoading ? "..." : totalProposals.toString(),
      href: "/dashboard/proposals",
      color: "bg-[#0f0f0f] text-[#9EFF00]",
    },
    {
      id: "completed",
      icon: <ChartBarSquareIcon className="h-8 w-8 text-[#9EFF00]" />,
      label: "Completed",
      value: isLoading ? "..." : completedProposals.toString(),
      href: "/dashboard/proposals",
      color: "bg-[#0f0f0f] text-[#9EFF00]",
    },
    {
      id: "pending",
      icon: <Cog6ToothIcon className="h-8 w-8 text-[#9EFF00]" />,
      label: "Pending",
      value: isLoading ? "..." : pendingProposals.toString(),
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
    <div className="space-y-8 pb-12">
      {/* Welcome Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#111] to-[#1a1a1a] border border-[#222] rounded-2xl p-8 lg:p-10 shadow-lg">
        {/* Subtle background accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#9EFF00] opacity-5 blur-[100px] rounded-full pointer-events-none"></div>
        
        <div className="relative z-10">
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3 tracking-tight">
            Welcome back, <span className="text-[#9EFF00]">{user?.fullname?.split(" ")[0] ?? "there"}</span>!
          </h1>
          <p className="text-gray-400 max-w-2xl text-lg font-light leading-relaxed">
            Here's your personal dashboard to monitor active projects, track proposals, and seamlessly communicate with our team.
          </p>
        </div>
      </div>

      {/* Quick Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => (
          <Link key={stat.id} href={stat.href} className="group">
            <div className="relative bg-[#111] border border-[#222] rounded-2xl p-6 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[#9EFF00]/40 hover:shadow-[0_8px_30px_rgb(158,255,0,0.05)] overflow-hidden">
              {/* Subtle hover gradient */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#9EFF00]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium tracking-wide uppercase mb-2">{stat.label}</p>
                  <p className="text-4xl font-bold text-white">
                    {stat.value}
                  </p>
                </div>
                <div className="p-3 bg-[#1a1a1a] rounded-xl group-hover:scale-110 group-hover:bg-[#9EFF00]/10 transition-all duration-300">
                  {stat.icon}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <div className="w-2 h-6 bg-[#9EFF00] rounded-full"></div>
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {quickActions.map((action, index) => (
              <Link key={index} href={action.href} className="group">
                <div className="bg-[#111] border border-[#222] rounded-2xl p-6 transition-all duration-300 hover:bg-[#151515] hover:border-[#333]">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-[#1a1a1a] rounded-xl text-[#9EFF00] group-hover:bg-[#9EFF00] group-hover:text-black transition-colors duration-300">
                      {action.icon}
                    </div>
                    <span className="text-gray-500 group-hover:text-[#9EFF00] group-hover:translate-x-1 transition-all duration-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-[#9EFF00] transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-gray-400 text-sm font-light">
                    {action.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <div className="w-2 h-6 bg-[#9EFF00] rounded-full"></div>
            Recent Activity
          </h2>
          <div className="bg-[#111] border border-[#222] rounded-2xl p-6 h-[calc(100%-2.75rem)]">
            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="w-6 h-6 border-2 border-[#9EFF00] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : totalProposals === 0 && activeChats === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <div className="w-16 h-16 mb-4 rounded-full bg-[#1a1a1a] flex items-center justify-center">
                  <DocumentTextIcon className="w-8 h-8 text-gray-500" />
                </div>
                <p className="text-white font-medium mb-1">No recent activity</p>
                <p className="text-gray-500 text-sm">Your latest updates will appear here.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Dynamically populated recent items based on counts */}
                {activeChats > 0 && (
                  <div className="relative pl-6 before:absolute before:left-0 before:top-2 before:w-2 before:h-2 before:bg-[#9EFF00] before:rounded-full before:shadow-[0_0_8px_#9EFF00]">
                    <p className="text-white font-medium text-sm">You have {activeChats} active chat{activeChats !== 1 ? 's' : ''}</p>
                    <p className="text-gray-500 text-xs mt-1">Check your inbox for new messages</p>
                  </div>
                )}
                {totalProposals > 0 && (
                  <div className="relative pl-6 before:absolute before:left-0 before:top-2 before:w-2 before:h-2 before:bg-blue-400 before:rounded-full before:shadow-[0_0_8px_rgba(96,165,250,0.8)]">
                    <p className="text-white font-medium text-sm">You have {totalProposals} proposal{totalProposals !== 1 ? 's' : ''}</p>
                    <p className="text-gray-500 text-xs mt-1">Track your project progress</p>
                  </div>
                )}
                {pendingProposals > 0 && (
                  <div className="relative pl-6 before:absolute before:left-0 before:top-2 before:w-2 before:h-2 before:bg-yellow-400 before:rounded-full before:shadow-[0_0_8px_rgba(250,204,21,0.8)]">
                    <p className="text-white font-medium text-sm">{pendingProposals} pending proposal{pendingProposals !== 1 ? 's' : ''}</p>
                    <p className="text-gray-500 text-xs mt-1">Awaiting admin review</p>
                  </div>
                )}
                <div className="relative pl-6 before:absolute before:left-0 before:top-2 before:w-2 before:h-2 before:bg-gray-600 before:rounded-full">
                  <p className="text-white font-medium text-sm">Account connected</p>
                  <p className="text-gray-500 text-xs mt-1">Welcome to your dashboard</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
