import { twMerge } from "tailwind-merge";

interface Props {
  children: React.ReactNode;
  className?: string;
}
const Container = ({ children, className }: Props) => {
  const newClassName = twMerge(
    "max-w-screen-xl mx-auto pt-4 px-4 pb-20 md:px-4 xl:px-0",
    className
  );
  return <div className={newClassName}> {children} </div>;
};

export default Container;
