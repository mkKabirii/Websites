import React from "react";
import ChatContainerWrapper from "../../components/Chat/ChatContainerWrapper";

const ChatPage = () => {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "16px 20px 8px 20px" }}>
        <h2 style={{ margin: 0, color: "#fff", fontSize: 22, fontWeight: 700 }}>
          Website Support
        </h2>
        <p style={{ margin: "4px 0 0 0", color: "#888", fontSize: 13 }}>
          Messages from website visitors and support requests.
        </p>
      </div>
      <div style={{ flex: 1 }}>
        <ChatContainerWrapper source="website" />
      </div>
    </div>
  );
};

export default ChatPage;
