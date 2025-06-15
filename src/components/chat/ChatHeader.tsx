import { BiArrowBack, BiDotsVerticalRounded } from "react-icons/bi";
import ChatAvatar from "./ChatAvatar";

interface ChatHeaderProps {
  name: string;
  image: string;
  onBack: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ name, image, onBack }) => {
  return (
    <div className="flex items-center p-4 border-b border-[#292B30] bg-[#212428]">
      <button
        onClick={onBack}
        className="md:hidden mr-2 text-[#AEAEB2] hover:text-white transition-colors"
      >
        <BiArrowBack size={20} />
      </button>

      <ChatAvatar src={image} name={name} size="sm" online={true} />

      <div className="ml-3 flex-1">
        <h3 className="font-medium text-white">{name}</h3>
        <p className="text-xs text-[#AEAEB2]">Online</p>
      </div>

      <button className="text-[#AEAEB2] hover:text-white transition-colors">
        <BiDotsVerticalRounded size={20} />
      </button>
    </div>
  );
};

export default ChatHeader;
