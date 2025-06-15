import React from "react";

interface ChatAvatarProps {
  src: string;
  name: string;
  size?: "sm" | "md" | "lg";
  online?: boolean;
}

const ChatAvatar: React.FC<ChatAvatarProps> = ({
  src,
  name,
  size = "md",
  online,
}) => {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-14 h-14",
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className={`relative rounded-full overflow-hidden ${sizes[size]}`}>
      {src ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.style.display = "none";
            const fallbackElement =
              target.nextElementSibling as HTMLElement | null;
            if (fallbackElement) {
              fallbackElement.style.display = "flex";
            }
          }}
        />
      ) : null}

      <div
        className={`absolute inset-0 bg-[#333] text-white flex items-center justify-center text-sm font-medium ${
          src ? "hidden" : ""
        }`}
      >
        {getInitials(name)}
      </div>

      {online && (
        <div
          className={`absolute z-20 bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#212428] ${
            online ? "bg-green-500" : "bg-[#545456]"
          }`}
        />
      )}
    </div>
  );
};

export default ChatAvatar;
