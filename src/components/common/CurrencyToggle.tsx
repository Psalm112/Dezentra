import { memo } from "react";
import { IoMdSwap } from "react-icons/io";
import { useCurrency } from "../../context/CurrencyContext";
import { useCurrencyConverter } from "../../utils/hooks/useCurrencyConverter";

const CurrencyToggle = () => {
  const { secondaryCurrency, toggleSecondaryCurrency } = useCurrency();
  const { userCountry } = useCurrencyConverter();

  const displayText = secondaryCurrency === "USDT" ? "USD" : userCountry;

  return (
    <button
      onClick={toggleSecondaryCurrency}
      className="flex items-center gap-1 px-1.5 md:px-2 py-1 rounded bg-[#373A3F] hover:bg-[#42464d] transition-colors focus:outline-none focus:ring-2 focus:ring-Red focus:ring-opacity-50"
      aria-label={`Toggle currency display to ${
        secondaryCurrency === "USDT" ? userCountry : "USD"
      }`}
    >
      <span className="text-xs text-white">{displayText}</span>
      <IoMdSwap className="text-white text-xs" />
    </button>
  );
};

export default memo(CurrencyToggle);
