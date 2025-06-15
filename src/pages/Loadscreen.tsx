import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from ".";

const Loadscreen = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {}, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="w-full h-screen bg-Dark flex flex-col items-center justify-center">
      <div className="animate-pulse">
        <img src={Logo} alt="Dezennmart Logo" className="w-32 h-32" />
      </div>
      <div className="mt-8">
        <div className="w-16 h-1 bg-Red rounded-full relative overflow-hidden">
          <div className="absolute top-0 left-0 h-full w-1/2 bg-opacity-30 bg-white animate-[loading_1.5s_infinite]"></div>
        </div>
      </div>
    </div>
  );
};

export default Loadscreen;
