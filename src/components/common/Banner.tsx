import { FC } from "react";
import { motion } from "framer-motion";

export interface BannerProps {
  title: string;
  subtitle: string;
  isUppercase?: boolean;
  primaryImage: string;
  secondaryImage?: string;
  backgroundColor?: string;
  textColor?: string;
}

const Banner: FC<BannerProps> = ({
  title,
  subtitle,
  isUppercase = true,
  primaryImage,
  secondaryImage,
  backgroundColor = "#ff3b3b",
  textColor = "white",
}) => {
  return (
    <motion.div
      className="flex justify-between items-center px-4 rounded-lg overflow-hidden"
      style={{ backgroundColor }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h5 className={`text-${textColor} text-base md:text-xl p-4`}>
        {title}{" "}
        <span
          className={`${
            isUppercase ? "uppercase" : ""
          } font-bold block md:inline`}
        >
          {subtitle}
        </span>
      </h5>
      <div className="flex items-center justify-center">
        <motion.img
          src={primaryImage}
          alt={`${title} primary image`}
          className="w-[50px] h-[50px] md:w-[90px] md:h-[90px]"
          initial={{ rotate: -10 }}
          animate={{ rotate: 0 }}
          transition={{ duration: 0.5 }}
        />
        {secondaryImage && (
          <motion.img
            src={secondaryImage}
            alt={`${title} secondary image`}
            className="w-[30px] h-[30px] md:w-[69px] md:h-[67px]"
            initial={{ rotate: 10, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
        )}
      </div>
    </motion.div>
  );
};

export default Banner;
