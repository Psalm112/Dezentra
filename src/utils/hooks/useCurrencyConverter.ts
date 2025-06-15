import { useState, useEffect, useCallback } from "react";

export type Currency = "USDT" | "CELO" | "FIAT";

interface ExchangeRates {
  USDT_CELO: number;
  USDT_FIAT: number;
  CELO_FIAT: number;
  lastUpdated: number;
}

// Default fallback rates
const DEFAULT_RATES: Omit<ExchangeRates, "lastUpdated"> = {
  USDT_CELO: 0.5,
  USDT_FIAT: 1,
  CELO_FIAT: 2,
};

// Cache keys
const CACHE_KEYS = {
  RATES: "currency_exchange_rates",
  GEO: "user_geo_data",
};

interface GeoData {
  currency: string;
  country: string;
  lastUpdated: number;
}

export const useCurrencyConverter = () => {
  const [rates, setRates] = useState<ExchangeRates>(() => {
    // Try to load cached rates from localStorage
    const cachedRates = localStorage.getItem(CACHE_KEYS.RATES);
    if (cachedRates) {
      try {
        const parsed = JSON.parse(cachedRates);
        // Use cached rates if they're less than 1 hour old
        if (Date.now() - parsed.lastUpdated < 60 * 60 * 1000) {
          return parsed;
        }
      } catch (e) {
        // Invalid cache, ignore
      }
    }
    // Default state
    return { ...DEFAULT_RATES, lastUpdated: 0 };
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userCountry, setUserCountry] = useState<string>(() => {
    // Try to load cached geo data
    const cachedGeo = localStorage.getItem(CACHE_KEYS.GEO);
    if (cachedGeo) {
      try {
        const parsed = JSON.parse(cachedGeo);
        // Use cached geo if it's less than 1 day old
        if (Date.now() - parsed.lastUpdated < 24 * 60 * 60 * 1000) {
          return parsed.currency;
        }
      } catch (e) {
        // Invalid cache, ignore
      }
    }
    return "USD";
  });

  const [selectedCurrency, setSelectedCurrency] = useState<Currency>("USDT");

  // Fetch exchange rates from CoinGecko API with proper caching
  const fetchRates = useCallback(
    async (forceRefresh = false) => {
      // Skip fetching if we already have recent data (< 5 mins) unless forced
      if (
        !forceRefresh &&
        rates.lastUpdated &&
        Date.now() - rates.lastUpdated < 5 * 60 * 1000
      ) {
        // Important: Set loading to false since we're skipping the fetch
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Get user's country/currency using IP geolocation
        let localCurrency = userCountry;
        let shouldUpdateGeo = true;

        // Try to get geolocation data
        try {
          const cachedGeo = localStorage.getItem(CACHE_KEYS.GEO);
          const shouldRefreshGeo =
            !cachedGeo ||
            JSON.parse(cachedGeo).lastUpdated <
              Date.now() - 24 * 60 * 60 * 1000;

          if (shouldRefreshGeo) {
            const geoResponse = await fetch("https://ipapi.co/json/");
            if (geoResponse.ok) {
              const geoData = await geoResponse.json();
              localCurrency = geoData.currency || "USD";

              // Cache geo data
              const geoCache: GeoData = {
                currency: localCurrency,
                country: geoData.country || "US",
                lastUpdated: Date.now(),
              };
              localStorage.setItem(CACHE_KEYS.GEO, JSON.stringify(geoCache));
              setUserCountry(localCurrency);
            } else {
              shouldUpdateGeo = false;
            }
          } else {
            shouldUpdateGeo = false;
          }
        } catch (geoError) {
          console.warn("Failed to fetch geolocation data:", geoError);
          shouldUpdateGeo = false;
        }

        // If we couldn't get fresh geo data but have cached data
        if (!shouldUpdateGeo && userCountry !== "USD") {
          localCurrency = userCountry;
        }

        // Fetch exchange rates with error handling and retries
        const fetchWithRetry = async (
          url: string,
          retries = 2
        ): Promise<Response> => {
          try {
            const response = await fetch(url);
            if (!response.ok)
              throw new Error(`HTTP error! Status: ${response.status}`);
            return response;
          } catch (err) {
            if (retries > 0) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
              return fetchWithRetry(url, retries - 1);
            }
            throw err;
          }
        };

        const response = await fetchWithRetry(
          `https://api.coingecko.com/api/v3/simple/price?ids=tether,celo&vs_currencies=${localCurrency.toLowerCase()},usd`
        );

        const data = await response.json();

        // Calculate exchange rates
        const usdtToFiat =
          data.tether[localCurrency.toLowerCase()] || data.tether.usd;
        const celoToFiat =
          data.celo[localCurrency.toLowerCase()] || data.celo.usd;
        const usdtToCelo = data.tether.usd / data.celo.usd;

        const newRates = {
          USDT_CELO: usdtToCelo,
          USDT_FIAT: usdtToFiat,
          CELO_FIAT: celoToFiat,
          lastUpdated: Date.now(),
        };

        // Update state and cache the rates
        setRates(newRates);
        localStorage.setItem(CACHE_KEYS.RATES, JSON.stringify(newRates));
      } catch (err) {
        setError((err as Error).message || "Failed to fetch exchange rates");

        // Use cached rates if available, or default fallback
        const cachedRates = localStorage.getItem(CACHE_KEYS.RATES);
        if (cachedRates) {
          try {
            setRates(JSON.parse(cachedRates));
          } catch (e) {
            // If parse fails, use default rates
            setRates({ ...DEFAULT_RATES, lastUpdated: Date.now() });
          }
        } else {
          // No cache, use defaults
          setRates({ ...DEFAULT_RATES, lastUpdated: Date.now() });
        }
      } finally {
        setLoading(false);
      }
    },
    [userCountry, rates.lastUpdated]
  );

  // Convert price between currencies with memoization
  const convertPrice = useCallback(
    (price: number, from: Currency, to: Currency): number => {
      if (from === to) return price;
      if (isNaN(price) || price === 0) return 0;

      switch (`${from}_${to}`) {
        case "USDT_CELO":
          return price * rates.USDT_CELO;
        case "USDT_FIAT":
          return price * rates.USDT_FIAT;
        case "CELO_USDT":
          return price / rates.USDT_CELO;
        case "CELO_FIAT":
          return price * rates.CELO_FIAT;
        case "FIAT_USDT":
          return price / rates.USDT_FIAT;
        case "FIAT_CELO":
          return price / rates.CELO_FIAT;
        default:
          return price;
      }
    },
    [rates]
  );

  // Format price
  const formatPrice = useCallback(
    (price: number, currency: Currency): string => {
      if (isNaN(price)) return "—";

      if (currency === "USDT") {
        return new Intl.NumberFormat(navigator.language, {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(price);
      }

      if (currency === "CELO") {
        return `${price.toLocaleString(navigator.language, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 4,
        })} CELO`;
      }

      // Format fiat with local currency symbol
      return new Intl.NumberFormat(navigator.language, {
        style: "currency",
        currency: userCountry,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(price);
    },
    [userCountry]
  );

  const refreshRates = useCallback(() => {
    return fetchRates(true);
  }, [fetchRates]);

  useEffect(() => {
    if (!rates.lastUpdated || Date.now() - rates.lastUpdated > 5 * 60 * 1000) {
      setLoading(true);
    } else {
      setLoading(false);
    }

    fetchRates();

    // Refresh rates every 5 minutes
    const interval = setInterval(() => fetchRates(), 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchRates]);

  return {
    rates: {
      USDT_CELO: rates.USDT_CELO,
      USDT_FIAT: rates.USDT_FIAT,
      CELO_FIAT: rates.CELO_FIAT,
    },
    loading,
    error,
    userCountry,
    selectedCurrency,
    setSelectedCurrency,
    convertPrice,
    formatPrice,
    refreshRates,
    lastUpdated: rates.lastUpdated,
  };
};
