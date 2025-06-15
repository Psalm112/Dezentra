import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BiSearch } from "react-icons/bi";
import ChatListItem from "./ChatListItem";
import { Conversation } from "../../utils/types";

interface ChatSidebarProps {
  conversations: (Conversation & { formattedTime: string; preview: string })[];
  activeId?: string;
  isLoading: boolean;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  conversations,
  activeId,
  isLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredConversations = searchTerm
    ? conversations.filter(
        (conv) =>
          conv.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          conv.lastMessage.content
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      )
    : conversations;

  return (
    <div
      className={`${
        activeId ? "max-md:hidden flex" : "flex"
      }flex-col w-full md:w-1/3 border-r border-[#292B30]`}
    >
      <div className="p-4 border-b border-[#292B30]">
        <h2 className="text-xl font-semibold text-white mb-3">Messages</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#292B30] text-white rounded-md py-2 pl-9 pr-3 focus:outline-none focus:ring-1 focus:ring-Red"
          />
          <BiSearch
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#545456]"
            size={18}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar">
        {isLoading && conversations.length === 0 ? (
          <div className="flex flex-col space-y-4 p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-[#292B30] animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-4 bg-[#292B30] rounded animate-pulse mb-2 w-1/2"></div>
                  <div className="h-3 bg-[#292B30] rounded animate-pulse w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length > 0 ? (
          <AnimatePresence>
            {filteredConversations.map((conversation) => (
              <motion.div
                key={conversation.user._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Link to={`/chat/${conversation.user._id}`}>
                  <ChatListItem
                    id={conversation.user._id}
                    name={conversation.user.name}
                    image={conversation.user.profileImage}
                    lastMessage={conversation.preview}
                    time={conversation.formattedTime}
                    unreadCount={conversation.unreadCount}
                    isActive={activeId === conversation.user._id}
                  />
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="flex flex-col items-center justify-center h-full px-4 text-center">
            <div className="text-[#545456] mb-2 text-5xl">💬</div>
            <p className="text-[#AEAEB2] mb-1">No conversations yet</p>
            <p className="text-[#545456] text-sm">
              Messages from other users will appear here
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
