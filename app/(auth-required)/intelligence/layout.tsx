import { ChatHistoryFrame } from "@/components/intelligence/ChatHistoryFrame";

export default function IntelligenceLayout({ children }: { children: React.ReactNode }) {
  return <ChatHistoryFrame>{children}</ChatHistoryFrame>;
}
