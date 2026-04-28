"use client";
import { usePathname } from "next/navigation";
import ChatButtonWrapper from "../../../Chat/ChatButtonWrapper";

export default function ConditionalChatButton() {
  const pathname = usePathname();
  if (pathname.startsWith("/dashboard")) return null;
  return <ChatButtonWrapper />;
}
