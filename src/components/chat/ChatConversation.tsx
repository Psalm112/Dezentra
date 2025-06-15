// src/components/chat/ChatConversation.tsx
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ChatHeader from "./ChatHeader";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import { Message } from "../../utils/types";
import { useChat } from "../../utils/hooks/useChat";

interface ChatConversationProps {
  messages: (Message & { formattedTime: string })[];
  recipientId: string;
  recipientName: string;
  recipientImage: string;
  currentUserId: string;
  isLoading: boolean;
}

const ChatConversation: React.FC<ChatConversationProps> = ({
  messages,
  recipientId,
  recipientName,
  recipientImage,
  currentUserId,
  isLoading,
}) => {
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { sendMessage } = useChat();

  const sortedMessages = [...messages].sort((a, b) => {
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setIsSending(true);
    try {
      await sendMessage({
        recipient: recipientId,
        content: newMessage.trim(),
      });
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 w-full md:w-2/3 overflow-hidden">
      <ChatHeader
        name={recipientName}
        image={recipientImage}
        onBack={() => navigate("/chat")}
      />

      <div className="flex-1 overflow-y-auto p-4 bg-[#1A1D21] scrollbar-thin">
        {isLoading && messages.length === 0 ? (
          <div className="flex flex-col space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={`flex ${
                  i % 2 === 0 ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`p-3 rounded-lg ${
                    i % 2 === 0
                      ? "rounded-tr-none bg-[#292B30]"
                      : "rounded-tl-none bg-[#333]"
                  } w-4/5 md:w-1/2 h-16 animate-pulse`}
                ></div>
              </div>
            ))}
          </div>
        ) : sortedMessages.length > 0 ? (
          <AnimatePresence initial={false}>
            {sortedMessages.map((message, index) => (
              <motion.div
                key={(message._id as string) || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChatMessage
                  content={message.content}
                  time={message.formattedTime}
                  isOwn={
                    typeof message.sender === "string"
                      ? message.sender === currentUserId
                      : (message.sender as any)._id === currentUserId
                  }
                  isRead={message.read}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-[#545456] mb-2 text-5xl">👋</div>
            <p className="text-[#AEAEB2] mb-1">No messages yet</p>
            <p className="text-[#545456] text-sm">
              Send a message to start the conversation
            </p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput
        value={newMessage}
        onChange={setNewMessage}
        onSend={handleSendMessage}
        isLoading={isSending}
      />
    </div>
  );
};

export default ChatConversation;
