import { FC, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Banner, { BannerProps } from "./Banner";

interface BannerCarouselProps {
  banners: BannerProps[];
  autoRotate?: boolean;
  rotationInterval?: number; // in milliseconds
  className?: string;
}

const BannerCarousel: FC<BannerCarouselProps> = ({
  banners,
  autoRotate = true,
  rotationInterval = 5000, // 5 seconds default
  className = "",
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToNext = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
  }, [banners.length]);

  //   const goToPrevious = useCallback(() => {
  //     setCurrentIndex(
  //       (prevIndex) => (prevIndex - 1 + banners.length) % banners.length
  //     );
  //   }, [banners.length]);

  const goToIndex = (index: number) => {
    setCurrentIndex(index);
  };

  // Auto-rotation effect
  useEffect(() => {
    let interval: number | undefined;

    if (autoRotate && banners.length > 1) {
      interval = window.setInterval(goToNext, rotationInterval);
    }

    return () => {
      if (interval !== undefined) window.clearInterval(interval);
    };
  }, [autoRotate, goToNext, rotationInterval, banners.length]);

  if (banners.length === 1) {
    return (
      <div className={`mt-8 md:mt-28 ${className}`}>
        <Banner {...banners[0]} />
      </div>
    );
  }

  return (
    <div className={`relative mt-8 md:mt-28 ${className}`}>
      {/* Banner container */}
      <div className="relative overflow-hidden rounded-lg">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            className="w-full"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{
              duration: 0.5,
              ease: [0.25, 0.1, 0.25, 1], // Smooth cubic-bezier easing
            }}
          >
            <Banner {...banners[currentIndex]} />
          </motion.div>
        </AnimatePresence>

        {/* Navigation arrows - visible on hover or on larger screens */}
        {/* <div className="absolute inset-y-0 left-0 hidden sm:flex items-center">
          <motion.button
            onClick={goToPrevious}
            className="p-1 rounded-full bg-black/30 text-white hover:bg-black/50 focus:outline-none ml-2"
            aria-label="Previous banner"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </motion.button>
        </div>

        <div className="absolute inset-y-0 right-0 hidden sm:flex items-center">
          <motion.button
            onClick={goToNext}
            className="p-1 rounded-full bg-black/30 text-white hover:bg-black/50 focus:outline-none mr-2"
            aria-label="Next banner"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </motion.button>
        </div> */}
      </div>

      {/*indicator */}
      {banners.length > 1 && (
        <div className="flex justify-center items-center space-x-3 mt-4">
          {banners.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => goToIndex(index)}
              className="focus:outline-none"
              aria-label={`Go to banner ${index + 1}`}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className="bg-white rounded-sm overflow-hidden"
                animate={{
                  width: currentIndex === index ? "40px" : "8px",
                  height: currentIndex === index ? "4px" : "8px",
                  borderRadius: currentIndex === index ? "2px" : "4px",
                  opacity: currentIndex === index ? 1 : 0.5,
                }}
                transition={{
                  duration: 0.3,
                  ease: "easeInOut",
                }}
              >
                {currentIndex === index && (
                  <motion.div
                    className="h-full bg-white"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{
                      duration: rotationInterval / 1000,
                      ease: "linear",
                    }}
                    key={`progress-${currentIndex}`}
                  />
                )}
              </motion.div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
};

export default BannerCarousel;
