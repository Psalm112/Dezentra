import { motion } from "framer-motion";
import { FiPlus, FiEye } from "react-icons/fi";

interface SubTabsProps {
  activeSubTab: "create" | "view";
  onSubTabChange: (tab: "create" | "view") => void;
}

const SubTabs: React.FC<SubTabsProps> = ({ activeSubTab, onSubTabChange }) => {
  const subTabs = [
    { id: "create" as const, label: "Create Product", icon: FiPlus },
    { id: "view" as const, label: "My Products", icon: FiEye },
  ];

  return (
    <div className="flex bg-[#1F2025] rounded-lg p-1 mb-6 w-fit">
      {subTabs.map(({ id, label, icon: Icon }) => (
        <div key={id} className="relative">
          <button
            className={`relative z-10 flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeSubTab === id
                ? "text-white"
                : "text-gray-400 hover:text-gray-300"
            }`}
            onClick={() => onSubTabChange(id)}
          >
            <Icon size={16} />
            {label}
          </button>
          {activeSubTab === id && (
            <motion.div
              className="absolute inset-0 bg-[#333] rounded-md"
              layoutId="activeSubTab"
              initial={false}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              style={{ zIndex: 0 }}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default SubTabs;
