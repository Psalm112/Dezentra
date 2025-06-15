import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Container from "../components/common/Container";
import ChatLayout from "../components/layout/ChatLayout";
import ChatSidebar from "../components/chat/ChatSidebar";
import ChatConversation from "../components/chat/ChatConversation";
import { useChat } from "../utils/hooks/useChat";
import { useAuth } from "../context/AuthContext";

const ChatDetail = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const {
    loadConversations,
    loadConversation,
    formattedConversations,
    formattedCurrentConversation,
    isLoading,
    selectRecipient,
    currentRecipient,
    activeConversation,
  } = useChat();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (userId && userId !== currentRecipient) {
      selectRecipient(userId);
    }

    loadConversations(false);

    const interval = setInterval(() => {
      if (userId) {
        loadConversation(userId, false);
      }
      loadConversations(false, true);
    }, 15000);

    return () => clearInterval(interval);
  }, [
    isAuthenticated,
    userId,
    loadConversations,
    loadConversation,
    navigate,
    currentRecipient,
    selectRecipient,
  ]);

  return (
    <div className="bg-Dark">
      <Container className="py-4 md:py-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-[#212428] rounded-lg overflow-hidden shadow-lg"
        >
          <ChatLayout>
            <ChatSidebar
              conversations={formattedConversations}
              activeId={userId}
              isLoading={isLoading}
            />
            <ChatConversation
              messages={formattedCurrentConversation}
              recipientId={userId || ""}
              recipientName={activeConversation?.user.name || "User"}
              recipientImage={activeConversation?.user.profileImage || ""}
              currentUserId={user?._id || ""}
              isLoading={isLoading}
            />
          </ChatLayout>
        </motion.div>
      </Container>
    </div>
  );
};

export default ChatDetail;
