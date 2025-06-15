import { motion } from "framer-motion";
import { BiMessageSquareDetail } from "react-icons/bi";

const ChatEmpty = () => {
  return (
    <motion.div
      className="hidden md:flex flex-col items-center justify-center flex-1 p-4 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <BiMessageSquareDetail className="text-[#545456] text-6xl mb-4" />
      <h3 className="text-white text-xl font-medium mb-2">
        Select a conversation
      </h3>
      <p className="text-[#AEAEB2] max-w-md">
        Choose from your existing conversations or start a new one through a
        product or user profile
      </p>
    </motion.div>
  );
};

export default ChatEmpty;
