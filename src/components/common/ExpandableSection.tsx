import { FC } from "react";
import { motion } from "framer-motion";
import { IoChevronForward } from "react-icons/io5";

interface ExpandableSectionProps {
  title: string;
  onClick?: () => void;
}

const ExpandableSection: FC<ExpandableSectionProps> = ({ title, onClick }) => {
  return (
    <motion.div
      className="bg-[#292B30] rounded-lg overflow-hidden shadow-lg mb-6 cursor-pointer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
    >
      <div className="py-4 px-6 flex justify-between items-center">
        <h3 className="text-white font-medium">{title}</h3>
        <motion.div
          whileHover={{ x: 3 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <IoChevronForward className="text-gray-400" />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ExpandableSection;
