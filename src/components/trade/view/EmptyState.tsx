import { FC } from "react";
import { motion } from "framer-motion";
import Button from "../../common/Button";

interface EmptyStateProps {
  title: string;
  message: string;
  className?: string;
}

const EmptyState: FC<EmptyStateProps> = ({
  title,
  message,
  className = "",
}) => {
  // Container animation
  const containerVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  // Circle animation
  const circleVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      transition: { delay: 0.2 },
    },
    hover: {
      scale: 1.05,
      transition: { type: "spring", stiffness: 400, damping: 10 },
    },
  };

  // Left arrow animation
  const leftArrowVariants = {
    initial: { x: 0 },
    animate: {
      x: [-3, 0, -3],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  // Right arrow animation
  const rightArrowVariants = {
    initial: { x: 0 },
    animate: {
      x: [3, 0, 3],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  return (
    <motion.div
      className={`flex flex-col items-center justify-start w-full h-[50vh] md:h-[60vh] py-16 px-4 ${className}`}
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.5 }}
    >
      <motion.div variants={circleVariants} whileHover="hover" className="mb-8">
        <motion.svg
          width="80"
          height="80"
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <motion.circle
            cx="40"
            cy="40"
            r="39.5"
            stroke="#7C818F"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
          <motion.path
            variants={leftArrowVariants}
            initial="initial"
            animate="animate"
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M25.9004 31.8891C25.7078 31.7063 25.5996 31.4585 25.5996 31.2001C25.5996 30.9417 25.7078 30.6939 25.9004 30.511L34.1293 22.7104C34.2235 22.6146 34.337 22.5378 34.4632 22.4845C34.5894 22.4312 34.7256 22.4026 34.8637 22.4002C35.0018 22.3979 35.139 22.422 35.2671 22.4711C35.3952 22.5201 35.5115 22.5931 35.6092 22.6857C35.7069 22.7783 35.7839 22.8886 35.8356 23.01C35.8873 23.1314 35.9127 23.2614 35.9103 23.3924C35.9079 23.5233 35.8776 23.6524 35.8214 23.772C35.7652 23.8916 35.6841 23.9993 35.5831 24.0885L29.1097 30.225H48.571C48.8438 30.225 49.1054 30.3277 49.2983 30.5106C49.4912 30.6935 49.5996 30.9415 49.5996 31.2001C49.5996 31.4587 49.4912 31.7067 49.2983 31.8896C49.1054 32.0724 48.8438 32.1752 48.571 32.1752H29.1097L35.5831 38.3116C35.6841 38.4009 35.7652 38.5086 35.8214 38.6282C35.8776 38.7478 35.9079 38.8769 35.9103 39.0078C35.9127 39.1387 35.8873 39.2688 35.8356 39.3902C35.7839 39.5116 35.7069 39.6219 35.6092 39.7145C35.5115 39.8071 35.3952 39.8801 35.2671 39.9291C35.139 39.9782 35.0018 40.0022 34.8637 39.9999C34.7256 39.9976 34.5894 39.969 34.4632 39.9157C34.337 39.8624 34.2235 39.7855 34.1293 39.6897L25.9004 31.8891Z"
            fill="#7C818F"
          />
          <motion.path
            variants={rightArrowVariants}
            initial="initial"
            animate="animate"
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M49.2988 48.111C49.4914 48.2939 49.5996 48.5417 49.5996 48.8001C49.5996 49.0585 49.4914 49.3063 49.2988 49.4891L41.0699 57.2897C40.9757 57.3855 40.8622 57.4624 40.736 57.5157C40.6098 57.569 40.4736 57.5976 40.3355 57.5999C40.1974 57.6023 40.0602 57.5782 39.9321 57.5291C39.8041 57.4801 39.6877 57.4071 39.59 57.3145C39.4924 57.2219 39.4154 57.1116 39.3636 56.9902C39.3119 56.8688 39.2865 56.7387 39.2889 56.6078C39.2914 56.4769 39.3216 56.3478 39.3778 56.2282C39.434 56.1086 39.5151 56.0009 39.6161 55.9116L46.0895 49.7752L26.6282 49.7752C26.3554 49.7752 26.0938 49.6724 25.9009 49.4896C25.708 49.3067 25.5996 49.0587 25.5996 48.8001C25.5996 48.5415 25.708 48.2935 25.9009 48.1106C26.0938 47.9277 26.3554 47.825 26.6282 47.825L46.0895 47.825L39.6161 41.6885C39.5151 41.5993 39.434 41.4916 39.3778 41.372C39.3216 41.2524 39.2914 41.1233 39.2889 40.9924C39.2865 40.8614 39.3119 40.7314 39.3636 40.61C39.4154 40.4886 39.4924 40.3783 39.59 40.2857C39.6877 40.1931 39.8041 40.1201 39.9321 40.0711C40.0602 40.022 40.1974 39.9979 40.3355 40.0002C40.4736 40.0026 40.6098 40.0312 40.736 40.0845C40.8622 40.1378 40.9757 40.2146 41.0699 40.3104L49.2988 48.111Z"
            fill="#7C818F"
          />
        </motion.svg>
      </motion.div>

      <motion.h2
        className="text-white text-center font-bold text-2xl mb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        {title}
      </motion.h2>

      <motion.p
        className="text-gray-400 text-center max-w-xs text-base"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        {message}
      </motion.p>
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="mt-auto text-center xs:col-span-2 xs:w-[80%] w-full lg:w-full lg:col-start-2"
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 15,
        }}
      >
        <Button
          title="Browse for Products"
          className="flex justify-center items-center  bg-Red border-0 rounded text-white px-6 py-2 w-full transition-colors hover:bg-[#e02d37]"
          path={`/trades`}
        />
      </motion.div>
    </motion.div>
  );
};

export default EmptyState;
