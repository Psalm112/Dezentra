import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { TabNavigationProps } from "../../../utils/types";

const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
  options,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  useEffect(() => {
    const activeIndex = options.findIndex((opt) => opt.id === activeTab);

    // Only scroll if it's not the first or last tab
    if (activeIndex > 0 && activeIndex < options.length - 1) {
      const container = containerRef.current;
      const activeTabEl = tabRefs.current[activeTab];

      if (container && activeTabEl) {
        const containerRect = container.getBoundingClientRect();
        const tabRect = activeTabEl.getBoundingClientRect();
        const scrollOffset =
          tabRect.left -
          containerRect.left -
          container.clientWidth / 2 +
          tabRect.width / 2;

        container.scrollTo({
          left: container.scrollLeft + scrollOffset,
          behavior: "smooth",
        });
      }
    }
  }, [activeTab, options]);

  return (
    <motion.div
      ref={containerRef}
      className="flex bg-[#292B30] items-center gap-4 md:gap-8 mt-20 md:mt-40 p-2 w-fit max-lg:w-full overflow-x-auto scrollbar-hide rounded"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
    >
      {options.map(({ id, label }) => (
        <div key={id} className="relative">
          <button
            ref={(el) => void (tabRefs.current[id] = el)}
            className={`text-white rounded-lg px-4 py-2 font-bold whitespace-nowrap relative z-10 ${
              activeTab === id ? "text-white" : "text-gray-400"
            }`}
            onClick={() => onTabChange(id)}
          >
            {label}
          </button>
          {activeTab === id && (
            <motion.div
              className="absolute inset-0 bg-Red rounded-lg"
              layoutId="activeTab"
              initial={false}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{ zIndex: 0 }}
            />
          )}
        </div>
      ))}
    </motion.div>
  );
};

export default TabNavigation;
