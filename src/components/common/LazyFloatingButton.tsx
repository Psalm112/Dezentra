import { FC, ReactNode, Suspense } from "react";
import { motion } from "framer-motion";
import FloatingActionButton from "./FloatingActionButton";

interface LazyFloatingButtonProps {
  icon: ReactNode;
  to: string;
  label?: string;
  position?: "bottom-right" | "bottom-center";
  color?: "primary" | "secondary";
}

const ButtonPlaceholder: FC<{
  position?: "bottom-right" | "bottom-center";
  hasLabel?: boolean;
}> = ({ position = "bottom-right", hasLabel = false }) => {
  const positionClasses = {
    "bottom-right": "bottom-20 md:bottom-6 right-4 md:right-6",
    "bottom-center":
      "bottom-20 md:bottom-6 left-1/2 transform -translate-x-1/2",
  };

  return (
    <motion.div
      className={`fixed z-40 ${positionClasses[position]} flex flex-col items-center`}
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: [0.3, 0.7, 0.3],
      }}
      transition={{
        scale: { duration: 0.2 },
        opacity: { repeat: Infinity, duration: 1.5, ease: "easeInOut" },
      }}
    >
      <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#292B30]" />
      {hasLabel && (
        <div className="hidden md:block mt-2 w-16 h-4 bg-[#292B30] rounded opacity-50" />
      )}
    </motion.div>
  );
};

const LazyFloatingButton: FC<LazyFloatingButtonProps> = (props) => {
  return (
    <Suspense
      fallback={
        <ButtonPlaceholder position={props.position} hasLabel={!!props.label} />
      }
    >
      <FloatingActionButton {...props} />
    </Suspense>
  );
};

export default LazyFloatingButton;
