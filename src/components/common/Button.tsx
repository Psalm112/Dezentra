import { Link } from "react-router-dom";
import { twMerge } from "tailwind-merge";
import { motion } from "framer-motion";
import { forwardRef } from "react";

interface Props {
  title: string | React.ReactNode;
  icon?: React.ReactNode;
  iconPosition?: "start" | "end";
  path?: string;
  className?: string;
  img?: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement | HTMLButtonElement>;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, Props>(
  (
    {
      title,
      icon,
      path,
      className,
      img,
      onClick,
      disabled = false,
      type = "button",
      iconPosition = "end",
    },
    ref
  ) => {
    const newClassName = twMerge(
      "flex whitespace-nowrap gap-1 text-sm font-bold items-center capitalize rounded-lg py-1.5 px-3 transition-all duration-300",
      disabled ? "opacity-50 cursor-not-allowed" : "hover:opacity-90",
      className
    );

    const content = (
      <>
        {icon && iconPosition === "start" && icon}
        {img && <img src={img} alt="" className="w-[18px] h-[18px]" />}
        {title}
        {icon && iconPosition === "end" && icon}
      </>
    );

    // Animation properties
    const buttonAnimation = {
      whileHover: disabled ? {} : { scale: 1.02 },
      whileTap: disabled ? {} : { scale: 0.98 },
      transition: { type: "spring", stiffness: 400, damping: 17 },
    };

    if (path) {
      return (
        <motion.div {...buttonAnimation}>
          <Link
            to={path}
            className={newClassName}
            onClick={onClick as React.MouseEventHandler<HTMLAnchorElement>}
            aria-disabled={disabled}
            ref={ref as React.Ref<HTMLAnchorElement>}
          >
            {content}
          </Link>
        </motion.div>
      );
    }

    return (
      <motion.button
        type={type}
        className={newClassName}
        onClick={onClick as React.MouseEventHandler<HTMLButtonElement>}
        disabled={disabled}
        ref={ref as React.Ref<HTMLButtonElement>}
        {...buttonAnimation}
      >
        {content}
      </motion.button>
    );
  }
);

Button.displayName = "Button";

export default Button;
