import React from "react";
import { Box, Tab, Tabs } from "@mui/material";
import ChatContainerWrapper from "../../components/Chat/ChatContainerWrapper";

const ChatPage = () => {
  const [source, setSource] = React.useState("accepted");

  return (
    <Box>
      <Tabs
        value={source}
        onChange={(_, value) => setSource(value)}
        sx={{
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
      <ChatContainerWrapper source={source} />
    </Box>
  );
};

export default ChatPage;
