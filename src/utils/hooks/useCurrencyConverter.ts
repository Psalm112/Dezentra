import { useState, useEffect, useCallback, useMemo } from "react";
export type Currency = "USDT" | "NATIVE" | "FIAT";

export interface ChainNativeToken {
  symbol: string;
  name: string;
  decimals: number;
  coingeckoId: string;
}
export const CHAIN_NATIVE_TOKENS: Record<number, ChainNativeToken> = {
  // Ethereum Mainnet
  1: { symbol: "ETH", name: "Ethereum", decimals: 18, coingeckoId: "ethereum" },
  // Polygon
  137: {
    symbol: "MATIC",
    name: "Polygon",
    decimals: 18,
    coingeckoId: "matic-network",
  },
  // Avalanche C-Chain
  43114: {
    symbol: "AVAX",
    name: "Avalanche",
    decimals: 18,
    coingeckoId: "avalanche-2",
  },
  // Avalanche Fuji Testnet
  43113: {
    symbol: "AVAX",
    name: "Avalanche",
    decimals: 18,
    coingeckoId: "avalanche-2",
  },
  // Celo Mainnet
  42220: { symbol: "CELO", name: "Celo", decimals: 18, coingeckoId: "celo" },
  // Celo Alfajores Testnet
  44787: { symbol: "CELO", name: "Celo", decimals: 18, coingeckoId: "celo" },
  // Arbitrum One
  42161: {
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
    coingeckoId: "ethereum",
  },
  // Optimism
  10: {
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
    coingeckoId: "ethereum",
  },
  // Base
  8453: {
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
    coingeckoId: "ethereum",
  },
};
// Default to Avalanche Fuji if chain not supported
export const DEFAULT_CHAIN_ID = 43113;
interface ExchangeRates {
  USDT_NATIVE: number;
  USDT_FIAT: number;
  NATIVE_FIAT: number;
  nativeTokenSymbol: string;
  nativeTokenName: string;
  chainId: number;
  lastUpdated: number;
}
// Default fallback rates (using AVAX as default)
const DEFAULT_RATES: Omit<ExchangeRates, "lastUpdated"> = {
  USDT_NATIVE: 0.05, // 1 USDT = 0.05 AVAX (approximate)
  USDT_FIAT: 1,
  NATIVE_FIAT: 20, // 1 AVAX = ~$20 (approximate)
  nativeTokenSymbol: "AVAX",
  nativeTokenName: "Avalanche",
  chainId: DEFAULT_CHAIN_ID,
};
// Cache keys with chain-specific caching
const CACHE_KEYS = {
  RATES: (chainId: number) => `currency_exchange_rates_${chainId}`,
  GEO: "user_geo_data",
  RATE_CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  GEO_CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 hours
};
interface GeoData {
  currency: string;
  country: string;
  lastUpdated: number;
}
interface UseCurrencyConverterProps {
  chainId?: number;
  isConnected?: boolean;
}
export const useCurrencyConverter = ({
  chainId,
  isConnected = false,
}: UseCurrencyConverterProps = {}) => {
  // Determine effective chain ID
  const effectiveChainId = useMemo(() => {
    if (!isConnected || !chainId || !CHAIN_NATIVE_TOKENS[chainId]) {
      return DEFAULT_CHAIN_ID;
    }
    return chainId;
  }, [chainId, isConnected]);
  // Get native token info for current chain
  const nativeTokenInfo = useMemo(() => {
    return (
      CHAIN_NATIVE_TOKENS[effectiveChainId] ||
      CHAIN_NATIVE_TOKENS[DEFAULT_CHAIN_ID]
    );
  }, [effectiveChainId]);
  const [rates, setRates] = useState<ExchangeRates>(() => {
    // Try to load cached rates from localStorage
    const cacheKey = CACHE_KEYS.RATES(effectiveChainId);
    const cachedRates = localStorage.getItem(cacheKey);
    if (cachedRates) {
      try {
        const parsed = JSON.parse(cachedRates);
        // Use cached rates if they're recent enough
        if (Date.now() - parsed.lastUpdated < CACHE_KEYS.RATE_CACHE_DURATION) {
          return parsed;
        }
      } catch (e) {
        console.warn("Invalid cached rates, using defaults");
      }
    }

    // Default state with current chain info
    return {
      ...DEFAULT_RATES,
      nativeTokenSymbol: nativeTokenInfo.symbol,
      nativeTokenName: nativeTokenInfo.name,
      chainId: effectiveChainId,
      lastUpdated: 0,
    };
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [userCountry, setUserCountry] = useState<string>(() => {
    // Try to load cached geo data
    const cachedGeo = localStorage.getItem(CACHE_KEYS.GEO);
    if (cachedGeo) {
      try {
        const parsed = JSON.parse(cachedGeo);
        // Use cached geo if it's recent enough
        if (Date.now() - parsed.lastUpdated < CACHE_KEYS.GEO_CACHE_DURATION) {
          return parsed.currency;
        }
      } catch (e) {
        console.warn("Invalid cached geo data");
      }
    }
    return "USD";
  });
  // Fetch geo data
  const fetchGeoData = useCallback(async (): Promise<string> => {
    try {
      const cachedGeo = localStorage.getItem(CACHE_KEYS.GEO);
      if (cachedGeo) {
        const parsed = JSON.parse(cachedGeo);
        if (Date.now() - parsed.lastUpdated < CACHE_KEYS.GEO_CACHE_DURATION) {
          setUserCountry(parsed.currency);
          return parsed.currency;
        }
      }
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const geoResponse = await fetch("https://ipapi.co/json/", {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (geoResponse.ok) {
        const geoData = await geoResponse.json();
        const currency = geoData.currency || "USD";

        // Cache geo data
        const geoCache: GeoData = {
          currency,
          country: geoData.country || "US",
          lastUpdated: Date.now(),
        };
        localStorage.setItem(CACHE_KEYS.GEO, JSON.stringify(geoCache));
        setUserCountry(currency);
        return currency;
      }
    } catch (error) {
      console.warn("Failed to fetch geolocation data:", error);
    }

    return userCountry;
  }, [userCountry]);
  // Fetch exchange rates
  const fetchRates = useCallback(
    async (forceRefresh = false) => {
      const cacheKey = CACHE_KEYS.RATES(effectiveChainId);
      // Skip fetching if there is recent data unless forced
      if (
        !forceRefresh &&
        rates.chainId === effectiveChainId &&
        rates.lastUpdated &&
        Date.now() - rates.lastUpdated < CACHE_KEYS.RATE_CACHE_DURATION
      ) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Get user's local currency
        const localCurrency = await fetchGeoData();

        // Fetch exchange rates
        const fetchWithRetry = async (
          url: string,
          retries = 2
        ): Promise<Response> => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

          try {
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response;
          } catch (err) {
            clearTimeout(timeoutId);
            if (retries > 0) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
              return fetchWithRetry(url, retries - 1);
            }
            throw err;
          }
        };

        const coingeckoId = nativeTokenInfo.coingeckoId;
        const currencies = `${localCurrency.toLowerCase()},usd`;
        const response = await fetchWithRetry(
          `https://api.coingecko.com/api/v3/simple/price?ids=tether,${coingeckoId}&vs_currencies=${currencies}`
        );

        const data = await response.json();

        // Validate API response
        if (!data.tether || !data[coingeckoId]) {
          throw new Error("Invalid API response structure");
        }

        // Calculate exchange rates
        const usdtToFiat =
          data.tether[localCurrency.toLowerCase()] || data.tether.usd || 1;
        const nativeToFiat =
          data[coingeckoId][localCurrency.toLowerCase()] ||
          data[coingeckoId].usd ||
          DEFAULT_RATES.NATIVE_FIAT;
        const usdtToNative =
          (data.tether.usd || 1) /
          (data[coingeckoId].usd || DEFAULT_RATES.NATIVE_FIAT);

        const newRates: ExchangeRates = {
          USDT_NATIVE: usdtToNative,
          USDT_FIAT: usdtToFiat,
          NATIVE_FIAT: nativeToFiat,
          nativeTokenSymbol: nativeTokenInfo.symbol,
          nativeTokenName: nativeTokenInfo.name,
          chainId: effectiveChainId,
          lastUpdated: Date.now(),
        };

        // Update state and cache
        setRates(newRates);
        localStorage.setItem(cacheKey, JSON.stringify(newRates));
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch exchange rates";
        setError(errorMessage);
        console.warn("Exchange rate fetch failed:", errorMessage);

        // Try to use cached data
        const cachedRates = localStorage.getItem(cacheKey);
        if (cachedRates) {
          try {
            const parsed = JSON.parse(cachedRates);
            setRates(parsed);
          } catch (parseError) {
            // If cache is corrupted, use defaults
            setRates({
              ...DEFAULT_RATES,
              nativeTokenSymbol: nativeTokenInfo.symbol,
              nativeTokenName: nativeTokenInfo.name,
              chainId: effectiveChainId,
              lastUpdated: Date.now(),
            });
          }
        } else {
          // No cache available, use defaults
          setRates({
            ...DEFAULT_RATES,
            nativeTokenSymbol: nativeTokenInfo.symbol,
            nativeTokenName: nativeTokenInfo.name,
            chainId: effectiveChainId,
            lastUpdated: Date.now(),
          });
        }
      } finally {
        setLoading(false);
      }
    },
    [
      effectiveChainId,
      nativeTokenInfo,
      rates.chainId,
      rates.lastUpdated,
      fetchGeoData,
    ]
  );
  // Convert price between currencies
  const convertPrice = useCallback(
    (price: number, from: Currency, to: Currency): number => {
      if (from === to || isNaN(price) || price === 0) return price;
      try {
        switch (`${from}_${to}`) {
          case "USDT_NATIVE":
            return price * rates.USDT_NATIVE;
          case "USDT_FIAT":
            return price * rates.USDT_FIAT;
          case "NATIVE_USDT":
            return price / rates.USDT_NATIVE;
          case "NATIVE_FIAT":
            return price * rates.NATIVE_FIAT;
          case "FIAT_USDT":
            return price / rates.USDT_FIAT;
          case "FIAT_NATIVE":
            return price / rates.NATIVE_FIAT;
          default:
            return price;
        }
      } catch (error) {
        console.warn("Price conversion failed:", error);
        return price;
      }
    },
    [rates]
  );
  // Format price with proper localization
  const formatPrice = useCallback(
    (price: number, currency: Currency): string => {
      if (isNaN(price) || price === null || price === undefined) return "—";
      try {
        if (currency === "USDT") {
          return new Intl.NumberFormat(navigator.language, {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
            maximumFractionDigits: 6,
          }).format(price);
        }

        if (currency === "NATIVE") {
          const formattedNumber = price.toLocaleString(navigator.language, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6,
          });
          return `${formattedNumber} ${rates.nativeTokenSymbol}`;
        }

        // Format fiat with local currency symbol
        return new Intl.NumberFormat(navigator.language, {
          style: "currency",
          currency: userCountry,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(price);
      } catch (error) {
        console.warn("Price formatting failed:", error);
        return `${price.toFixed(2)} ${
          currency === "NATIVE" ? rates.nativeTokenSymbol : currency
        }`;
      }
    },
    [rates.nativeTokenSymbol, userCountry]
  );
  // Manual refresh function
  const refreshRates = useCallback(() => {
    return fetchRates(true);
  }, [fetchRates]);
  // fetch rates when chain changes
  useEffect(() => {
    // Only set loading if no have recent data for this chain
    const needsFresh =
      !rates.lastUpdated ||
      rates.chainId !== effectiveChainId ||
      Date.now() - rates.lastUpdated > CACHE_KEYS.RATE_CACHE_DURATION;
    if (needsFresh) {
      setLoading(true);
      fetchRates();
    }
  }, [effectiveChainId, fetchRates]);
  // Auto-refresh rates periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        fetchRates();
      }
    }, CACHE_KEYS.RATE_CACHE_DURATION);
    return () => clearInterval(interval);
  }, [fetchRates, loading]);

  return useMemo(
    () => ({
      rates: {
        USDT_NATIVE: rates.USDT_NATIVE,
        USDT_FIAT: rates.USDT_FIAT,
        NATIVE_FIAT: rates.NATIVE_FIAT,
      },
      nativeToken: {
        symbol: rates.nativeTokenSymbol,
        name: rates.nativeTokenName,
        chainId: rates.chainId,
      },
      loading,
      error,
      userCountry,
      convertPrice,
      formatPrice,
      refreshRates,
      lastUpdated: rates.lastUpdated,
      isUnsupportedNetwork:
        !isConnected || !chainId || !CHAIN_NATIVE_TOKENS[chainId],
    }),
    [
      rates,
      loading,
      error,
      userCountry,
      convertPrice,
      formatPrice,
      refreshRates,
      isConnected,
      chainId,
    ]
  );
};
