import React, { useState } from "react";
import ChatContainerWrapper from "../../components/Chat/ChatContainerWrapper";

const WorkingField = () => {
  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Client Chats</h1>
          <p className="text-gray-600 mt-1">
            Communicate with onboarded clients (from Client collection). Media, documents, and comments appear per client.
          </p>
        </div>
        <div className="bg-white rounded-lg shadow overflow-hidden" style={{ minHeight: "70vh" }}>
          <ChatContainerWrapper source="clients" />
        </div>
      </div>
    </div>
  );
};

export default WorkingField;
