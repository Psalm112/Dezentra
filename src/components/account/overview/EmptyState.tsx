import { motion } from "framer-motion";
import Button from "../../common/Button";

interface EmptyStateProps {
  message: string;
  buttonText: string;
  buttonPath: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  message,
  buttonText,
  buttonPath,
}) => {
  return (
    <motion.div
      className="flex flex-col gap-12 md:gap-24 items-center justify-center px-6 md:px-11 py-12 md:py-24 bg-[#292B30] mt-8 rounded-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h1
        className="text-white text-xl md:text-2xl font-semibold text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {message}
      </motion.h1>
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          title={buttonText}
          className="bg-Red border-0 rounded text-white px-8 md:px-14 py-2 w-full md:w-auto transition-colors hover:bg-[#e02d37]"
          path={buttonPath}
        />
      </motion.div>
    </motion.div>
  );
};

export default EmptyState;
