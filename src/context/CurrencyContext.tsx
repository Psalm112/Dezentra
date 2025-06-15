import { createContext, useContext, useState, ReactNode } from "react";

type SecondaryCurrency = "USDT" | "FIAT";

interface CurrencyContextType {
  secondaryCurrency: SecondaryCurrency;
  toggleSecondaryCurrency: () => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined
);

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};

interface CurrencyProviderProps {
  children: ReactNode;
}

export const CurrencyProvider = ({ children }: CurrencyProviderProps) => {
  const [secondaryCurrency, setSecondaryCurrency] =
    useState<SecondaryCurrency>("USDT");

  const toggleSecondaryCurrency = () => {
    setSecondaryCurrency((prev) => (prev === "USDT" ? "FIAT" : "USDT"));
  };

  const value = {
    secondaryCurrency,
    toggleSecondaryCurrency,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};
