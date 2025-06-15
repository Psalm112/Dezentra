import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Container from "../components/common/Container";
import ChatLayout from "../components/layout/ChatLayout";
import ChatSidebar from "../components/chat/ChatSidebar";
import ChatEmpty from "../components/chat/ChatEmpty";
import { useChat } from "../utils/hooks/useChat";
import { useAuth } from "../context/AuthContext";

const Chat = () => {
  const { loadConversations, formattedConversations, isLoading } = useChat();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    loadConversations(false, true);

    // refresh conversations every minute
    const interval = setInterval(() => {
      loadConversations(false, true);
    }, 60000);

    return () => clearInterval(interval);
  }, [isAuthenticated, loadConversations, navigate]);

  return (
    <div className="bg-Dark">
      <Container className="py-4 md:py-6 ">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-[#212428] rounded-lg overflow-hidden shadow-lg"
        >
          <ChatLayout>
            <ChatSidebar
              conversations={formattedConversations}
              isLoading={isLoading}
            />
            <ChatEmpty />
          </ChatLayout>
        </motion.div>
      </Container>
    </div>
  );
};

export default Chat;
