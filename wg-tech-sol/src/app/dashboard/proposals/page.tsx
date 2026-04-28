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
      // Mock data - replace with actual API call
      const mockProposals: Proposal[] = [
        {
          _id: "prop1",
          title: "Web Development Project",
          description: "Custom website development for e-commerce",
          status: "approved",
          submittedDate: new Date(
            Date.now() - 7 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          budget: "$5,000 - $8,000",
          timeline: "3-4 weeks",
          lastUpdate: new Date(
            Date.now() - 2 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
        {
          _id: "prop2",
          title: "Mobile App Design",
          description: "UI/UX design for iOS and Android app",
          status: "pending",
          submittedDate: new Date(
            Date.now() - 14 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          budget: "$3,000 - $5,000",
          timeline: "2-3 weeks",
          lastUpdate: new Date(
            Date.now() - 3 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
        {
          _id: "prop3",
          title: "Content Writing",
          description: "SEO-optimized blog posts and content",
          status: "completed",
          submittedDate: new Date(
            Date.now() - 30 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          budget: "$1,000 - $2,000",
          timeline: "1-2 weeks",
          lastUpdate: new Date(
            Date.now() - 1 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
      ];
      setProposals(mockProposals);
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
