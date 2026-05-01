import React from "react";
import { Box, Tab, Tabs } from "@mui/material";
import ChatContainerWrapper from "../../components/Chat/ChatContainerWrapper";
import useUserStore from "../../zustand/useUserStore";

const ChatPage = () => {
  const { user } = useUserStore();
  const storedRole = String(user?.role || "").toLowerCase();
  const designationRole = String(user?.designation?.roleName || "").toLowerCase();
  const role = storedRole && storedRole !== "user" ? storedRole : designationRole || storedRole;
  const isWorker = role === "worker";
  const [source, setSource] = React.useState("accepted");

  React.useEffect(() => {
    if (isWorker) setSource("accepted");
  }, [isWorker]);

  return (
    <Box>
      {!isWorker && (
        <Tabs
          value={source}
          onChange={(_, value) => setSource(value)}
          sx={{
            mt: 2,
            mb: 2,
            "& .MuiTab-root": { color: "#B0B0B0", textTransform: "none" },
            "& .Mui-selected": { color: "#8CE600 !important" },
            "& .MuiTabs-indicator": { backgroundColor: "#8CE600" },
          }}
        >
          <Tab value="accepted" label="Accepted Proposals" />
          <Tab value="clients" label="All Clients" />
          <Tab value="website" label="Website Support" />
        </Tabs>
      )}
      <ChatContainerWrapper source={source} />
    </Box>
  );
};

export default ChatPage;
