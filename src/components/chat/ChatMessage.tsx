import { memo } from "react";
import { motion } from "framer-motion";
import { IoCheckmark, IoCheckmarkDoneOutline } from "react-icons/io5";

interface ChatMessageProps {
  content: string;
  time: string;
  isOwn: boolean;
  isRead: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = memo(
  ({ content, time, isOwn, isRead }) => {
    return (
      <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-4`}>
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className={`max-w-[80%] md:max-w-[70%] rounded-lg ${
            isOwn
              ? "bg-Red text-white rounded-tr-none"
              : "bg-[#292B30] text-white rounded-tl-none"
          } px-3 pt-2 pb-1`}
        >
          <p className="mb-1 break-words">{content}</p>
          <div className="flex items-center justify-end">
            <p
              className={`text-xs ${
                isOwn ? "text-white text-opacity-70" : "text-[#AEAEB2]"
              } text-right`}
            >
              {time}
            </p>
            {isOwn && isRead && (
              <IoCheckmarkDoneOutline
                className={`${
                  isRead ? "text-[#d4af37]" : "text-[#AEAEB2] text-xs"
                }`}
              />
            )}
            {isOwn && !isRead && (
              <IoCheckmark className="text-[#AEAEB2] text-xs" />
            )}
          </div>
        </motion.div>
      </div>
    );
  }
);

export default ChatMessage;
