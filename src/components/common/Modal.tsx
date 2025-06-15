import { AnimatePresence, motion } from "framer-motion";
import { FC, ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { IoMdClose } from "react-icons/io";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: string;
  showCloseButton?: boolean;
}

const Modal: FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "md:max-w-md",
  showCloseButton = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={handleBackdropClick}
      >
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

        {/* Modal content */}
        <div
          ref={modalRef}
          className={`relative w-full ${maxWidth} bg-[#212428]/90 backdrop-blur-md rounded-xl shadow-xl border border-gray-700/50 overflow-hidden transform transition-all max-h-[90vh] flex flex-col`}
          style={{ backdropFilter: "blur(12px)" }}
        >
          {/* Header with title and close button */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/50">
              {title && (
                <h3 className="text-lg font-medium text-white">{title}</h3>
              )}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="ml-auto text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-[#292B30]"
                  aria-label="Close modal"
                >
                  <IoMdClose size={20} />
                </button>
              )}
            </div>
          )}

          {/* Modal body */}
          <div className="p-6 max-md:px-1 overflow-y-auto flex-1 hide-scrollbar">
            {children}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default Modal;
