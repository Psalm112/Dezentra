import React, { createContext, useState, useContext, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

type SnackbarType = "success" | "error" | "info";

interface SnackbarContextType {
  showSnackbar: (message: string, type?: SnackbarType) => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(
  undefined
);

export const useSnackbar = () => {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error("useSnackbar must be used within a SnackbarProvider");
  }
  return context;
};

export const SnackbarProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [snackbar, setSnackbar] = useState<{
    visible: boolean;
    message: string;
    type: SnackbarType;
  }>({
    visible: false,
    message: "",
    type: "info",
  });

  const showSnackbar = (message: string, type: SnackbarType = "info") => {
    setSnackbar({ visible: true, message, type });
    setTimeout(() => {
      setSnackbar((prev) => ({ ...prev, visible: false }));
    }, 3000);
  };

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      <AnimatePresence>
        {snackbar.visible && (
          <motion.div
            className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-3 rounded-lg shadow-lg z-50 ${
              snackbar.type === "success"
                ? "bg-green-600"
                : snackbar.type === "error"
                ? "bg-red-600"
                : "bg-gray-800"
            } text-white`}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
          >
            {snackbar.message}
          </motion.div>
        )}
      </AnimatePresence>
    </SnackbarContext.Provider>
  );
};
