import { motion } from "framer-motion";
import { FaQuestion } from "react-icons/fa";
import { LiaAngleLeftSolid } from "react-icons/lia";
import {
  RiEdit2Fill,
  RiShieldKeyholeFill,
  RiContactsBook2Fill,
  RiShieldCheckFill,
  RiLogoutBoxRLine,
  RiThumbUpLine,
  RiBuilding2Line,
} from "react-icons/ri";
import { Avatar2, TwoFactor } from "../../../pages";
import { lazy, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useNavigate } from "react-router";
const EditProfile = lazy(() => import("../edit/EditProfile"));

interface SettingItemProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  delay: number;
}

const SettingItem = ({ icon, label, onClick, delay }: SettingItemProps) => {
  return (
    <motion.button
      className="flex items-center gap-4 w-full px-4 py-3 hover:bg-[#3A3A3C] rounded-lg"
      onClick={onClick}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="bg-Red p-2 rounded-full">{icon}</div>
      <span className="text-white">{label}</span>
    </motion.button>
  );
};

const Settings = ({
  setViewState,
  profileData,
}: {
  setViewState: (state: "overview" | "settings" | "edit-profile") => void;
  profileData: {
    name: string;
    dob: string;
    email: string;
    phone: string;
  };
}) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const settingSections: { items: SettingItemProps[] }[] = [
    {
      items: [
        {
          icon: <RiEdit2Fill className="text-white" />,
          label: "Edit Profile",
          delay: 0.1,
          onClick: () => setShowEditProfile(true),
        },
        {
          icon: <RiContactsBook2Fill className="text-white" />,
          label: "Join Our Community",
          delay: 0.2,
          onClick: () =>
            window.open("https://t.me/dezenmart_commuinity", "_blank"),
        },
      ],
    },
    {
      items: [
        {
          icon: <RiShieldKeyholeFill className="text-white" />,
          label: "Privacy",
          delay: 0.3,
        },
        {
          icon: <RiShieldCheckFill className="text-white" />,
          label: "Safety",
          delay: 0.4,
        },
        {
          icon: (
            <img
              src={TwoFactor}
              alt="Two-Factor Authentication"
              className="w-5 h-5"
            />
          ),
          label: "Two-Factor Authentication",
          delay: 0.5,
        },
      ],
    },
    {
      items: [
        {
          icon: <FaQuestion className="text-white font-bold" />,
          label: "Help",
          delay: 0.6,
        },
        {
          icon: <RiThumbUpLine className="text-white" />,
          label: "Rate Our App",
          delay: 0.8,
        },
        {
          icon: <RiBuilding2Line className="text-white" />,
          label: "About Us",
          delay: 1.0,
        },
        {
          icon: <RiLogoutBoxRLine className="text-white" />,
          label: "Log Out",
          delay: 1.2,
          onClick: () => {
            logout();
            navigate("/");
          },
        },
      ],
    },
  ];

  return (
    <>
      {showEditProfile ? (
        <EditProfile
          avatar={Avatar2}
          setViewState={() => setViewState("settings")}
          currentProfile={profileData}
        />
      ) : (
        <motion.div
          className="mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex gap-10 mb-4">
            <motion.button
              aria-label="Settings"
              className="hover:opacity-80 transition-opacity"
              transition={{ type: "spring", stiffness: 300 }}
              onClick={() => setViewState("overview")}
            >
              <LiaAngleLeftSolid className="text-white text-2xl" />
            </motion.button>
            <h3 className="text-white text-4xl font-semibold">Settings</h3>
          </div>

          {settingSections.map((section, sectionIndex) => (
            <motion.div
              key={sectionIndex}
              className="bg-[#292B30] rounded-lg mb-4 py-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: sectionIndex * 0.1 }}
            >
              {section.items.map((item) => (
                <SettingItem
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  delay={item.delay}
                  onClick={item.onClick}
                />
              ))}
            </motion.div>
          ))}
        </motion.div>
      )}
    </>
  );
};

export default Settings;
