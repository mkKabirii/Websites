import React, { useState } from "react";
import ChatContainerWrapper from "../../components/Chat/ChatContainerWrapper";

const FILTERS = [
  { value: "all",      label: "All" },
  { value: "accepted", label: "Accepted Proposals" },
  { value: "client",   label: "Client Chats" },
  { value: "group",    label: "Group Chats" },
];

const WorkingField = () => {
  const [activeFilter, setActiveFilter] = useState("all");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "#0a0a0a",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          padding: "18px 24px 0 24px",
          borderBottom: "1px solid #1e1e1e",
        }}
      >
        <h2
          style={{
            margin: "0 0 4px 0",
            color: "#fff",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "-0.3px",
          }}
        >
          Working Field
        </h2>
        <p style={{ margin: "0 0 14px 0", color: "#666", fontSize: 13 }}>
          Manage accepted proposals, client conversations, and group discussions.
        </p>

        {/* ── Filter Tabs ── */}
        <div style={{ display: "flex", gap: 4 }}>
          {FILTERS.map((f) => {
            const isActive = activeFilter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setActiveFilter(f.value)}
                style={{
                  padding: "8px 18px",
                  borderRadius: "8px 8px 0 0",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: isActive ? 700 : 500,
                  fontSize: 13,
                  background: isActive ? "#9EFF00" : "transparent",
                  color: isActive ? "#000" : "#888",
                  borderBottom: isActive
                    ? "2px solid #9EFF00"
                    : "2px solid transparent",
                  transition: "all 0.18s ease",
                  whiteSpace: "nowrap",
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Chat Panel: single instance, source always all_working, filter changes ── */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        <ChatContainerWrapper source="all_working" chatFilter={activeFilter} />
      </div>
    </div>
  );
};

export default WorkingField;

