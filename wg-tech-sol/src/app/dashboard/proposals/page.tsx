"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/zustand/authStore";
import MagnifyText from "@/app/components/MagnifyText";

interface Proposal {
  _id: string;
  title: string;
  description: string;
  status: "pending" | "approved" | "rejected" | "completed";
  submittedDate: string;
  budget?: string;
  timeline?: string;
  lastUpdate?: string;
}

export default function ProposalsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "pending" | "approved" | "rejected" | "completed"
  >("all");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/wgAuthForm");
    } else {
      fetchProposals();
    }
  }, []);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003";
      
      // Fetch only the user's proposals by searching their email
      const res = await fetch(`${API_URL}/api/v1/proposals?search=${encodeURIComponent(user?.email || "")}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const json = await res.json();
        const apiProposals = json.data?.proposals || [];
        
        // Map backend model to frontend Proposal interface
        const mappedProposals: Proposal[] = apiProposals.map((p: any) => ({
          _id: p._id,
          title: p.company || p.fullname || "Proposal",
          description: p.messages || p.company || "Project request",
          status: p.status?.toLowerCase() || "pending",
          submittedDate: p.createdAt || new Date().toISOString(),
          budget: p.budget ? `$${p.budget}` : "Not specified",
          timeline: p.timeline || "Not specified",
          lastUpdate: p.updatedAt || p.createdAt || new Date().toISOString()
        }));
        
        setProposals(mappedProposals);
      }
    } catch (error) {
      console.error("Error fetching proposals:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Proposal["status"]) => {
    switch (status) {
      case "pending":
        return "bg-[#0f0f0f] text-[#9EFF00] border border-[#9EFF00]/30";
      case "approved":
        return "bg-[#0f0f0f] text-[#9EFF00] border border-[#9EFF00]/30";
      case "rejected":
        return "bg-[#0f0f0f] text-[#9EFF00] border border-[#9EFF00]/30";
      case "completed":
        return "bg-[#0f0f0f] text-[#9EFF00] border border-[#9EFF00]/30";
      default:
        return "bg-[#0f0f0f] text-[#9EFF00] border border-[#9EFF00]/30";
    }
  };

  const getStatusIcon = (status: Proposal["status"]) => {
    switch (status) {
      case "pending":
        return "⏳";
      case "approved":
        return "✅";
      case "rejected":
        return "❌";
      case "completed":
        return "🎉";
      default:
        return "📋";
    }
  };

  const filteredProposals =
    filter === "all" ? proposals : proposals.filter((p) => p.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-[#9EFF00] text-xl">Loading proposals...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-[#9EFF00] mb-2">
          <MagnifyText text="My Proposals" />
        </h1>
        <p className="text-gray-400">
          Track all your project proposals and their status
        </p>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {(["all", "pending", "approved", "rejected", "completed"] as const).map(
          (status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg transition-all capitalize ${
                filter === status
                  ? "bg-[#9EFF00] text-black font-semibold"
                  : "bg-[#1a1a1a] text-white hover:bg-[#222]"
              }`}
            >
              {status}
            </button>
          ),
        )}
      </div>

      {/* Proposals List */}
      <div className="space-y-4">
        {filteredProposals.length === 0 ? (
          <div className="wg-card bg-[#111] border border-[#333] rounded-lg p-12 text-center">
            <p className="text-gray-400 text-lg">No proposals found</p>
          </div>
        ) : (
          filteredProposals.map((proposal) => (
            <div
              key={proposal._id}
              className="wg-card bg-[#111] border border-[#333] rounded-lg p-6 hover:border-[#9EFF00]/50 transition-all hover:shadow-lg hover:shadow-[#9EFF00]/20"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                {/* Proposal Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">
                      {getStatusIcon(proposal.status)}
                    </span>
                    <h3 className="text-xl font-bold text-white">
                      {proposal.title}
                    </h3>
                  </div>
                  <p className="text-gray-400 text-sm mb-3">
                    {proposal.description}
                  </p>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    {proposal.budget && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">
                          Budget
                        </p>
                        <p className="text-white font-semibold">
                          {proposal.budget}
                        </p>
                      </div>
                    )}
                    {proposal.timeline && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">
                          Timeline
                        </p>
                        <p className="text-white font-semibold">
                          {proposal.timeline}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wide">
                        Submitted
                      </p>
                      <p className="text-white font-semibold">
                        {new Date(proposal.submittedDate).toLocaleDateString()}
                      </p>
                    </div>
                    {proposal.lastUpdate && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">
                          Last Update
                        </p>
                        <p className="text-white font-semibold">
                          {new Date(proposal.lastUpdate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex flex-col items-start md:items-end gap-3">
                  <span
                    className={`px-4 py-2 rounded-lg font-semibold uppercase text-xs tracking-wide ${getStatusColor(
                      proposal.status,
                    )}`}
                  >
                    {proposal.status}
                  </span>
                  <button className="text-[#9EFF00] hover:text-[#7BCC00] font-medium text-sm transition-all">
                    View Details →
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
