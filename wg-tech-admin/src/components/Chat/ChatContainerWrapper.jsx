import React, { useState, useEffect } from "react";
import ChatContainer from "./ChatContainer";
import useUserStore from "../../zustand/useUserStore";

const ChatContainerWrapper = ({ source = "accepted" }) => {
  const { user } = useUserStore();
  const [userId, setUserId] = useState(null);
  const [adminId, setAdminId] = useState(null);

  useEffect(() => {
    if (user) {
      const id = user._id || user.id;
      setUserId(id);
      setAdminId(id);
    }
  }, [user]);

  if (!userId) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "#999" }}>
        <p>Loading chat...</p>
      </div>
    );
  }

  return (
    <ChatContainer
      userId={userId}
      adminId={adminId}
      userRole={user?.designation?.roleName || "admin"}
      source={source}
    />
  );
};

export default ChatContainerWrapper;
