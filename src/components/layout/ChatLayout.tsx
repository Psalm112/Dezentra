import React from "react";

interface ChatLayoutProps {
  children: React.ReactNode;
}

const ChatLayout: React.FC<ChatLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col md:flex-row w-full h-[calc(100vh-170px)] sm:h-[calc(100vh-140px)] overflow-hidden">
      {children}
    </div>
  );
};

export default ChatLayout;
