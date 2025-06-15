import { motion } from "framer-motion";
import { UseFormRegisterReturn } from "react-hook-form";
import {
  RiUser3Line,
  RiCalendarLine,
  RiMailLine,
  RiUserLocationLine,
} from "react-icons/ri";

interface ProfileFieldProps {
  label: string;
  icon: "person" | "calendar" | "email" | "location";
  placeholder: string;
  register: UseFormRegisterReturn<string>;
  error?: string;
  delay: number;
  disabled?: boolean;
}

const ProfileField: React.FC<ProfileFieldProps> = ({
  label,
  icon,
  placeholder,
  register,
  error,
  delay,
  disabled,
}) => {
  const getIcon = () => {
    switch (icon) {
      case "person":
        return <RiUser3Line className="text-gray-400" />;
      case "calendar":
        return <RiCalendarLine className="text-gray-400" />;
      case "email":
        return <RiMailLine className="text-gray-400" />;
      case "location":
        return <RiUserLocationLine className="text-gray-400" />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      className="flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      {label && (
        <label className="text-white text-sm mb-2 opacity-80">{label}</label>
      )}
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          {getIcon()}
        </div>
        <input
          type={icon === "email" ? "email" : "text"}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full bg-[#292B30] text-white py-3 pl-10 pr-4 rounded border ${
            error ? "border-red-500" : "border-white/20"
          } transition-colors focus:border-white outline-none`}
          {...register}
        />
      </div>
      {error && (
        <motion.p
          className="text-red-500 text-xs mt-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {error}
        </motion.p>
      )}
    </motion.div>
  );
};

export default ProfileField;
