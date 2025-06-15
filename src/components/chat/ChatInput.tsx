import { useRef, useEffect, KeyboardEvent } from "react";
import { BiSend } from "react-icons/bi";
import { motion } from "framer-motion";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  isLoading,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Adjust textarea height based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "24px";

    const lineHeight = 24;
    const maxHeight = lineHeight * 4;
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);

    textarea.style.height = `${newHeight}px`;
    textarea.style.overflowY =
      textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [value]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="border-t border-[#292B30] p-3 bg-[#212428]">
      <div className="flex items-end">
        <div className="flex-1 bg-[#292B30] rounded-lg px-3 py-2">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="w-full bg-transparent text-white outline-none resize-none min-h-[24px] scrollbar-thin scrollbar-thumb-[#3A3D42] scrollbar-track-transparent"
            disabled={isLoading}
          />
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onSend}
          disabled={!value.trim() || isLoading}
          className={`ml-2 p-3 rounded-full ${
            value.trim() && !isLoading
              ? "bg-Red text-white"
              : "bg-[#292B30] text-[#545456]"
          } flex items-center justify-center transition-colors`}
        >
          {isLoading ? (
            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <BiSend size={20} />
          )}
        </motion.button>
      </div>
    </div>
  );
};

export default ChatInput;
