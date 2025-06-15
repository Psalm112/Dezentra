import React from "react";
import ChatAvatar from "./ChatAvatar";

interface ChatListItemProps {
  id: string;
  name: string;
  image: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  isActive?: boolean;
}

const ChatListItem: React.FC<ChatListItemProps> = ({
  name,
  image,
  lastMessage,
  time,
  unreadCount,
  isActive = false,
}) => {
  return (
    <div
      className={`flex items-center px-4 py-3 border-b border-[#292B30] cursor-pointer transition-colors ${
        isActive ? "bg-[#292B30]" : "hover:bg-[#262A30]"
      }`}
    >
      <ChatAvatar src={image} name={name} size="md" />

      <div className="ml-3 flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <h3 className="font-medium text-white truncate">{name}</h3>
          <span className="text-xs text-[#AEAEB2] whitespace-nowrap ml-2">
            {time}
          </span>
        </div>

        <div className="flex justify-between items-center mt-1">
          <p className="text-sm text-[#AEAEB2] truncate max-w-[80%]">
            {lastMessage}
          </p>

          {unreadCount > 0 && (
            <div className="bg-Red text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatListItem;
