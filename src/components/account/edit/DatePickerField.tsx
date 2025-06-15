import { motion, AnimatePresence } from "framer-motion";
import { RiCalendarLine } from "react-icons/ri";
import { useEffect, useRef, useState } from "react";
import { UseFormRegisterReturn } from "react-hook-form";
import { IoMdClose } from "react-icons/io";

interface DatePickerFieldProps {
  register: UseFormRegisterReturn<string>;
  error?: string;
  showDatePicker: boolean;
  setShowDatePicker: React.Dispatch<React.SetStateAction<boolean>>;
  selectedDate: {
    day: number;
    month: string;
    year: number;
  };
  onDateSelect: (day: number, month: string, year: number) => void;
  delay: number;
  label?: string;
}

const DatePickerField: React.FC<DatePickerFieldProps> = ({
  register,
  error,
  showDatePicker,
  setShowDatePicker,
  selectedDate,
  onDateSelect,
  delay,
  label = "Date of Birth",
}) => {
  const datePickerRef = useRef<HTMLDivElement>(null);
  const dayPickerRef = useRef<HTMLDivElement>(null);
  const monthPickerRef = useRef<HTMLDivElement>(null);
  const yearPickerRef = useRef<HTMLDivElement>(null);
  const [tempDate, setTempDate] = useState({ ...selectedDate });
  const [isMobile, setIsMobile] = useState(false);

  const ITEM_HEIGHT = 42;

  // Check for mobile screen size
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  useEffect(() => {
    if (showDatePicker) {
      setTempDate({ ...selectedDate });
      setTimeout(() => {
        scrollToCenter(false);
      }, 150);
    }
  }, [showDatePicker, selectedDate]);

  useEffect(() => {
    if (showDatePicker) {
      scrollToCenter(true);
    }
  }, [tempDate, showDatePicker]);

  // Available months and years for selection
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i + 5);

  // Days in the selected month
  const getDaysInMonth = (month: string, year: number) => {
    const monthIndex = months.indexOf(month);
    return new Date(year, monthIndex + 1, 0).getDate();
  };

  const daysInSelectedMonth = getDaysInMonth(tempDate.month, tempDate.year);
  const days = Array.from({ length: 31 }, (_, i) => i + 1); // Always show 31 days for consistent UI

  // date formatter
  const formatDate = () => {
    const monthIndex = months.indexOf(selectedDate.month) + 1;
    return `${monthIndex.toString().padStart(2, "0")}/${selectedDate.day
      .toString()
      .padStart(2, "0")}/${selectedDate.year}`;
  };

  // scroll to element
  const scrollToElement = (
    id: string,
    containerRef: React.RefObject<HTMLDivElement | null>,
    smooth = true
  ) => {
    if (!containerRef.current) return;

    const element = document.getElementById(id);
    if (element) {
      const container = containerRef.current;

      const containerHeight = container.clientHeight;
      const elementHeight = ITEM_HEIGHT;

      const scrollTop =
        element.offsetTop - containerHeight / 2 + elementHeight / 2;

      container.scrollTo({
        top: scrollTop,
        behavior: smooth ? "smooth" : "auto",
      });
    }
  };

  const scrollToCenter = (smooth = true) => {
    scrollToElement(`day-${tempDate.day}`, dayPickerRef, smooth);
    scrollToElement(`month-${tempDate.month}`, monthPickerRef, smooth);
    scrollToElement(`year-${tempDate.year}`, yearPickerRef, smooth);
  };

  // Handle temporary date selection
  const handleTempDateSelect = (day: number, month: string, year: number) => {
    const maxDays = getDaysInMonth(month, year);

    setTempDate({
      day: Math.min(day, maxDays),
      month,
      year,
    });
  };

  // Confirm and apply the selection
  const handleUpdate = () => {
    onDateSelect(tempDate.day, tempDate.month, tempDate.year);
    setShowDatePicker(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target as Node)
      ) {
        setShowDatePicker(false);
      }
    };

    if (showDatePicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDatePicker, setShowDatePicker]);

  //  scroll snap function
  const handleScroll = (
    containerRef: React.RefObject<HTMLDivElement | null>
  ) => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const timeoutIdStr = container.dataset.timeoutId || "0";
    clearTimeout(parseInt(timeoutIdStr, 10));

    const timeoutId = window.setTimeout(() => {
      const scrollTop = container.scrollTop;
      const index = Math.round(scrollTop / ITEM_HEIGHT);
      const newScrollTop = index * ITEM_HEIGHT;

      container.scrollTo({
        top: newScrollTop,
        behavior: "smooth",
      });

      // Update the selected date based on which column was scrolled
      if (
        containerRef === dayPickerRef &&
        days[index] &&
        index < daysInSelectedMonth
      ) {
        const day = days[index];
        if (day !== tempDate.day) {
          setTempDate((prev) => ({ ...prev, day }));
        }
      } else if (containerRef === monthPickerRef && months[index]) {
        const month = months[index];
        if (month !== tempDate.month) {
          const maxDays = getDaysInMonth(month, tempDate.year);
          setTempDate((prev) => ({
            ...prev,
            month,
            day: Math.min(prev.day, maxDays),
          }));
        }
      } else if (containerRef === yearPickerRef && years[index]) {
        const year = years[index];
        if (year !== tempDate.year) {
          const maxDays = getDaysInMonth(tempDate.month, year);
          setTempDate((prev) => ({
            ...prev,
            year,
            day: Math.min(prev.day, maxDays),
          }));
        }
      }
    }, 100);

    container.dataset.timeoutId = timeoutId.toString();
  };

  const getSpacerHeight = () => {
    return `${(220 - ITEM_HEIGHT) / 2}px`;
  };

  return (
    <motion.div
      className="relative w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <RiCalendarLine className="text-gray-400" />
        </div>
        <input
          type="text"
          readOnly
          value={formatDate()}
          placeholder="Select date"
          className={`w-full bg-[#292B30] text-white py-3.5 pl-10 pr-4 rounded-lg border ${
            error ? "border-red-500" : "border-white/20"
          } focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all duration-200`}
          onClick={() => setShowDatePicker(true)}
          {...register}
        />
      </div>

      {error && (
        <motion.p
          className="text-red-500 text-xs mt-1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {error}
        </motion.p>
      )}

      <AnimatePresence>
        {showDatePicker && (
          <motion.div
            ref={datePickerRef}
            className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm px-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-[#21232a] rounded-t-2xl md:rounded-2xl w-full md:max-w-sm overflow-hidden shadow-xl"
              initial={{
                y: isMobile ? 300 : 0,
                scale: isMobile ? 1 : 0.95,
                opacity: 0,
              }}
              animate={{
                y: 0,
                scale: 1,
                opacity: 1,
              }}
              exit={{
                y: isMobile ? 300 : 0,
                scale: isMobile ? 1 : 0.95,
                opacity: 0,
              }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 300,
              }}
            >
              {/* Drag handle */}
              <div className="md:hidden flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-gray-600 rounded-full"></div>
              </div>

              {/* Header */}
              <div className="relative flex justify-between items-center px-5 pt-4 pb-8 border-b border-white">
                <h3 className="text-white font-medium text-center w-full">
                  {label}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowDatePicker(false)}
                  className="absolute right-4 top-0 text-gray-400 hover:text-white transition-colors p-1.5 rounded-full hover:bg-gray-700/30"
                  aria-label="Close"
                >
                  <IoMdClose size={20} />
                </button>
              </div>

              {/* Date picker */}
              <div className="flex items-center justify-center text-center border-b border-white py-4">
                <div className="flex flex-row w-full h-[220px]">
                  {/* Day column */}
                  <div
                    ref={dayPickerRef}
                    className="flex-1 h-full overflow-y-auto scrollbar-hide relative"
                    onScroll={() => handleScroll(dayPickerRef)}
                  >
                    <div style={{ height: getSpacerHeight() }}></div>{" "}
                    {/* Top spacer */}
                    {days.map((day) => {
                      const isDisabled = day > daysInSelectedMonth;
                      const isSelected = tempDate.day === day && !isDisabled;

                      return (
                        <div
                          id={`day-${day}`}
                          key={`day-${day}`}
                          className={`h-[${ITEM_HEIGHT}px] flex items-center justify-center cursor-pointer transition-all duration-150 ${
                            isSelected
                              ? "bg-Red/30 text-white font-medium"
                              : isDisabled
                              ? "text-gray-600 cursor-not-allowed"
                              : "text-gray-300 hover:bg-gray-700/50"
                          }`}
                          onClick={() =>
                            !isDisabled &&
                            handleTempDateSelect(
                              day,
                              tempDate.month,
                              tempDate.year
                            )
                          }
                          style={{ height: `${ITEM_HEIGHT}px` }}
                        >
                          {day.toString().padStart(2, "0")}
                        </div>
                      );
                    })}
                    <div style={{ height: getSpacerHeight() }}></div>{" "}
                    {/* Bottom spacer */}
                    {/* Highlight indicator */}
                    <div className="absolute left-0 right-0 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <div
                        style={{ height: `${ITEM_HEIGHT}px` }}
                        className="border-t border-b border-gray-700/50"
                      ></div>
                    </div>
                  </div>

                  {/* Month column */}
                  <div
                    ref={monthPickerRef}
                    className="flex-1 h-full overflow-y-auto scrollbar-hide relative"
                    onScroll={() => handleScroll(monthPickerRef)}
                  >
                    <div style={{ height: getSpacerHeight() }}></div>{" "}
                    {/* Top spacer */}
                    {months.map((month) => (
                      <div
                        id={`month-${month}`}
                        key={`month-${month}`}
                        className={`flex items-center justify-center cursor-pointer transition-all duration-150 ${
                          tempDate.month === month
                            ? "bg-Red/30 text-white font-medium"
                            : "text-gray-300 hover:bg-gray-700/50"
                        }`}
                        onClick={() =>
                          handleTempDateSelect(
                            tempDate.day,
                            month,
                            tempDate.year
                          )
                        }
                        style={{ height: `${ITEM_HEIGHT}px` }}
                      >
                        {month}
                      </div>
                    ))}
                    <div style={{ height: getSpacerHeight() }}></div>{" "}
                    {/* Bottom spacer */}
                    {/* Highlight indicator */}
                    <div className="absolute left-0 right-0 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <div
                        style={{ height: `${ITEM_HEIGHT}px` }}
                        className="border-t border-b border-gray-700/50"
                      ></div>
                    </div>
                  </div>

                  {/* Year column */}
                  <div
                    ref={yearPickerRef}
                    className="flex-1 h-full overflow-y-auto scrollbar-hide relative"
                    onScroll={() => handleScroll(yearPickerRef)}
                  >
                    <div style={{ height: getSpacerHeight() }}></div>{" "}
                    {/* Top spacer */}
                    {years.map((year) => (
                      <div
                        id={`year-${year}`}
                        key={`year-${year}`}
                        className={`flex items-center justify-center cursor-pointer transition-all duration-150 ${
                          tempDate.year === year
                            ? "bg-Red/30 text-white font-medium"
                            : "text-gray-300 hover:bg-gray-700/50"
                        }`}
                        onClick={() =>
                          handleTempDateSelect(
                            tempDate.day,
                            tempDate.month,
                            year
                          )
                        }
                        style={{ height: `${ITEM_HEIGHT}px` }}
                      >
                        {year}
                      </div>
                    ))}
                    <div style={{ height: getSpacerHeight() }}></div>{" "}
                    {/* Bottom spacer */}
                    {/* Highlight indicator */}
                    <div className="absolute left-0 right-0 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <div
                        style={{ height: `${ITEM_HEIGHT}px` }}
                        className="border-t border-b border-gray-700/50"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom button */}
              <div className="p-5">
                <button
                  type="button"
                  className="w-full bg-Red hover:bg-red-600 active:bg-red-700 text-white py-3.5 rounded-xl font-medium transition-colors duration-200 shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  onClick={handleUpdate}
                >
                  Update
                </button>
              </div>

              {/*spacing for mobile */}
              <div className="h-2 md:hidden"></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DatePickerField;
