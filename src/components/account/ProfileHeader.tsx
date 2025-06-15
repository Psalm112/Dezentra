import { motion } from "framer-motion";
import { RiSettings3Fill } from "react-icons/ri";
import { MdOutlineCheckCircleOutline } from "react-icons/md";
import { useCallback } from "react";
import { FiCopy } from "react-icons/fi";

interface ProfileHeaderProps {
  avatar: string;
  name: string;
  email: string;
  id: string;
  showSettings: React.Dispatch<React.SetStateAction<boolean>>;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  avatar,
  name,
  email,
  id,
  showSettings,
}) => {
  const handleCopyId = useCallback(() => {
    if (!id) return;

    navigator.clipboard
      .writeText(id)
      // .then(() => {
      //   setCopied(true);
      //   setTimeout(() => setCopied(false), 2000);
      // })
      .catch((err) => console.error("Failed to copy code:", err));
  }, [id]);
  return (
    <>
      <motion.div
        className="flex items-center justify-between w-full mb-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-white font-bold text-xl md:text-2xl">Profile</h1>
        <motion.button
          aria-label="Settings"
          className="hover:opacity-80 transition-opacity"
          whileHover={{ rotate: 90 }}
          transition={{ type: "spring", stiffness: 300 }}
          onClick={() => showSettings(true)}
        >
          <RiSettings3Fill className="text-white text-2xl" />
        </motion.button>
      </motion.div>

      <motion.div
        className="flex flex-col items-center justify-center mt-10"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <motion.img
          src={avatar}
          className="w-24 sm:w-[121px] mb-3 rounded-full border-2 border-Red"
          alt="User profile"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        />
        <motion.h2
          className="text-white text-xl sm:text-2xl font-bold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {name}
        </motion.h2>
        <motion.div
          className="flex items-center justify-center gap-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-white text-lg sm:text-xl my-2">{email}</h3>
          <MdOutlineCheckCircleOutline className="text-[#1FBE42] text-2xl" />
        </motion.div>
        {/* <motion.button
          className="flex items-center justify-center gap-1 cursor-pointer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCopyId}
        >
          <span className="text-gray-400 text-xs sm:text-sm">{id}</span>
          <FiCopy size={18} className="text-gray-400" />
        </motion.button> */}
      </motion.div>
    </>
  );
};

export default ProfileHeader;
