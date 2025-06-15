import { FC, ReactNode } from "react";
import { motion } from "framer-motion";

interface StatusAlertProps {
  icon: ReactNode;
  message: string;
  verificationMessage?: string;
  type?: "warning" | "info" | "error";
}

const StatusAlert: FC<StatusAlertProps> = ({
  icon,
  message,
  verificationMessage,
  type = "warning",
}) => {
  const bgColor = {
    warning: "bg-Red/10 ",
    info: "bg-blue-950 ",
    error: "bg-red-950 ",
  }[type];

  return (
    <motion.div
      className={`rounded-lg p-4 flex items-center gap-3 text-white-200 w-full ${bgColor}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-red-500">{icon}</div>
      <div className="w-full">
        <p className="text-sm inline">{message}</p>
        {verificationMessage && (
          <p className="text-sm mt-1 font-bold inline">
            &nbsp;
            {verificationMessage}
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default StatusAlert;
