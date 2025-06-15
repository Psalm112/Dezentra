import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiCopy } from "react-icons/fi";
import { FaFacebook, FaWhatsapp, FaTelegram, FaEnvelope } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { useSnackbar } from "../../../../context/SnackbarContext";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  promoCode: string;
  shareLink?: string;
}

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  promoCode,
  shareLink = "",
}) => {
  const { showSnackbar } = useSnackbar();
  const finalShareLink =
    shareLink || (typeof window !== "undefined" ? window.location.origin : "");
  const shareText = `Use my promo code ${promoCode} to get points on your first purchase!`;

  const socialLinks = [
    {
      name: "Facebook",
      icon: <FaFacebook size={24} />,
      color: "#1877F2",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        finalShareLink
      )}&quote=${encodeURIComponent(shareText)}`,
    },
    {
      name: "Twitter",
      icon: <FaXTwitter size={24} />,
      color: "#1A1A1A",
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        shareText
      )}&url=${encodeURIComponent(finalShareLink)}`,
    },
    {
      name: "WhatsApp",
      icon: <FaWhatsapp size={24} />,
      color: "#25D366",
      url: `https://wa.me/?text=${encodeURIComponent(
        shareText + " " + finalShareLink
      )}`,
    },
    {
      name: "Telegram",
      icon: <FaTelegram size={24} />,
      color: "#0088cc",
      url: `https://t.me/share/url?url=${encodeURIComponent(
        finalShareLink
      )}&text=${encodeURIComponent(shareText)}`,
    },
    {
      name: "Email",
      icon: <FaEnvelope size={24} />,
      color: "#D44638",
      url: `mailto:?subject=Check out this promo code&body=${encodeURIComponent(
        shareText + " " + finalShareLink
      )}`,
    },
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        onClose();
        showSnackbar("Copied referral link successfully", "success");
      })
      .catch((err) => {
        console.error("Failed to copy:", err);
        showSnackbar("Failed to copy referral link, try again", "error");
      });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-[#292B30] rounded-lg max-w-md w-full p-6 relative"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <motion.button
              className="absolute right-4 top-4 text-gray-400 hover:text-white"
              onClick={onClose}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <FiX size={24} />
            </motion.button>

            <h3 className="text-xl font-bold text-white mb-4">
              Share your code
            </h3>

            {shareLink && (
              <div className="p-3 bg-[#333] rounded-lg mb-6 flex items-center justify-between">
                <span className="text-white font-medium truncate pr-2">
                  {finalShareLink}
                </span>
                <motion.button
                  className="text-gray-400 hover:text-white flex-shrink-0"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => copyToClipboard(shareLink)}
                >
                  <FiCopy size={20} />
                </motion.button>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2"
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: social.color }}
                  >
                    {social.icon}
                  </div>
                  <span className="text-xs text-gray-300">{social.name}</span>
                </motion.a>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ShareModal;
