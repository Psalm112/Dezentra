import { useState, useEffect, useCallback, useMemo } from "react";
import { SUPPORTED_CHAINS, getChainMetadata } from "../config/web3.config";

export type Currency = "USDT" | "NATIVE" | "FIAT";

export interface ChainNativeToken {
  symbol: string;
  name: string;
  decimals: number;
  coingeckoId: string;
}

// Updated to match your supported testnet chains
export const CHAIN_NATIVE_TOKENS: Record<number, ChainNativeToken> = {
  // Avalanche Fuji Testnet
  43113: {
    symbol: "AVAX",
    name: "Avalanche",
    decimals: 18,
    coingeckoId: "avalanche-2",
  },
  // Base Sepolia Testnet
  84532: {
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
    coingeckoId: "ethereum",
  },
  // Ethereum Sepolia Testnet
  11155111: {
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
    coingeckoId: "ethereum",
  },
  // Arbitrum Sepolia Testnet
  421614: {
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
    coingeckoId: "ethereum",
  },
  // Mainnet fallbacks for reference
  1: { symbol: "ETH", name: "Ethereum", decimals: 18, coingeckoId: "ethereum" },
  137: {
    symbol: "MATIC",
    name: "Polygon",
    decimals: 18,
    coingeckoId: "matic-network",
  },
  43114: {
    symbol: "AVAX",
    name: "Avalanche",
    decimals: 18,
    coingeckoId: "avalanche-2",
  },
  42220: { symbol: "CELO", name: "Celo", decimals: 18, coingeckoId: "celo" },
  44787: { symbol: "CELO", name: "Celo", decimals: 18, coingeckoId: "celo" },
  42161: {
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
    coingeckoId: "ethereum",
  },
  10: {
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
    coingeckoId: "ethereum",
  },
  8453: {
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
    coingeckoId: "ethereum",
  },
};

// Default to Avalanche Fuji
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

const DEFAULT_RATES: Omit<ExchangeRates, "lastUpdated"> = {
  USDT_NATIVE: 0.025, // 1 USDT = 0.025 AVAX
  USDT_FIAT: 1,
  NATIVE_FIAT: 40, // 1 AVAX = ~$40
  nativeTokenSymbol: "AVAX",
  nativeTokenName: "Avalanche",
  chainId: DEFAULT_CHAIN_ID,
};

// cache configuration
const CACHE_CONFIG = {
  RATE_CACHE_DURATION: 15 * 60 * 1000,
  GEO_CACHE_DURATION: 24 * 60 * 60 * 1000,
  STALE_CACHE_DURATION: 60 * 60 * 1000,
  API_TIMEOUT: 10000,
  RETRY_DELAY: 2000,
  MAX_RETRIES: 1,
  RATE_LIMIT_DELAY: 60000,
} as const;

// API endpoints with fallbacks
const API_ENDPOINTS = {
  PRIMARY: "/.netlify/functions/coingecko-proxy",
  COINGECKO: "https://api.coingecko.com/api/v3/simple/price",
  PROXY: "https://api.allorigins.win/raw?url=",
  PROXY_ALT: "https://cors-anywhere.herokuapp.com/",
} as const;

const CACHE_KEYS = {
  RATES: (chainId: number) => `currency_rates_v2_${chainId}`,
  GEO: "user_geo_v2",
} as const;

interface GeoData {
  currency: string;
  country: string;
  lastUpdated: number;
}

interface UseCurrencyConverterProps {
  chainId?: number;
  isConnected?: boolean;
}

// Utility function to check if chain is supported
const isSupportedChain = (chainId: number | undefined): boolean => {
  if (!chainId) return false;
  return SUPPORTED_CHAINS.some((chain) => chain.id === chainId);
};

// Get effective chain ID
const getEffectiveChainId = (
  chainId: number | undefined,
  isConnected: boolean
): number => {
  if (!isConnected) return DEFAULT_CHAIN_ID;
  if (!chainId) return DEFAULT_CHAIN_ID;

  // If connected to a supported chain, use it
  if (isSupportedChain(chainId)) return chainId;

  // For unsupported chains, still return the chain ID but mark as unsupported
  return chainId;
};

export const useCurrencyConverter = ({
  chainId,
  isConnected = false,
}: UseCurrencyConverterProps = {}) => {
  const effectiveChainId = useMemo(
    () => getEffectiveChainId(chainId, isConnected),
    [chainId, isConnected]
  );

  const isUnsupportedNetwork = useMemo(
    () => isConnected && chainId && !isSupportedChain(chainId),
    [chainId, isConnected]
  );

  // Get native token info
  const nativeTokenInfo = useMemo(() => {
    const tokenInfo = CHAIN_NATIVE_TOKENS[effectiveChainId];
    if (tokenInfo) return tokenInfo;

    // Fallback: try to get from web3 config metadata
    const chainMetadata = getChainMetadata(effectiveChainId);
    if (chainMetadata) {
      return {
        symbol: chainMetadata.nativeCurrency,
        name: chainMetadata.name,
        decimals: 18,
        coingeckoId:
          chainMetadata.nativeCurrency.toLowerCase() === "avax"
            ? "avalanche-2"
            : "ethereum",
      };
    }

    // Ultimate fallback
    return CHAIN_NATIVE_TOKENS[DEFAULT_CHAIN_ID];
  }, [effectiveChainId]);

  // Initialize state
  const [rates, setRates] = useState<ExchangeRates>(() => {
    const cacheKey = CACHE_KEYS.RATES(effectiveChainId);
    try {
      const cachedRates = localStorage.getItem(cacheKey);
      if (cachedRates) {
        const parsed = JSON.parse(cachedRates);
        // Use cached rates if they're not too old
        if (
          Date.now() - parsed.lastUpdated <
          CACHE_CONFIG.STALE_CACHE_DURATION
        ) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn("Failed to parse cached rates:", error);
    }

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
    try {
      const cachedGeo = localStorage.getItem(CACHE_KEYS.GEO);
      if (cachedGeo) {
        const parsed = JSON.parse(cachedGeo);
        if (Date.now() - parsed.lastUpdated < CACHE_CONFIG.GEO_CACHE_DURATION) {
          return parsed.currency;
        }
      }
    } catch (error) {
      console.warn("Failed to parse cached geo data:", error);
    }
    return "USD";
  });

  // geo data fetching
  const fetchGeoData = useCallback(async (): Promise<string> => {
    try {
      const cachedGeo = localStorage.getItem(CACHE_KEYS.GEO);
      if (cachedGeo) {
        const parsed = JSON.parse(cachedGeo);
        if (Date.now() - parsed.lastUpdated < CACHE_CONFIG.GEO_CACHE_DURATION) {
          return parsed.currency;
        }
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        CACHE_CONFIG.API_TIMEOUT
      );

      try {
        const response = await fetch("https://ipapi.co/json/", {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          const currency = data.currency || "USD";

          const geoCache: GeoData = {
            currency,
            country: data.country || "US",
            lastUpdated: Date.now(),
          };

          localStorage.setItem(CACHE_KEYS.GEO, JSON.stringify(geoCache));
          setUserCountry(currency);
          return currency;
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error) {
      console.warn("Geo fetch failed, using cached/default currency:", error);
    }

    return userCountry;
  }, [userCountry]);

  // rate fetching
  const fetchRates = useCallback(
    async (forceRefresh = false) => {
      const cacheKey = CACHE_KEYS.RATES(effectiveChainId);

      // Skip if we have recent data and not forcing refresh
      if (
        !forceRefresh &&
        rates.chainId === effectiveChainId &&
        rates.lastUpdated &&
        Date.now() - rates.lastUpdated < CACHE_CONFIG.RATE_CACHE_DURATION
      ) {
        return;
      }

      // Don't fetch rates for unsupported networks
      if (isUnsupportedNetwork) {
        const fallbackRates: ExchangeRates = {
          ...DEFAULT_RATES,
          nativeTokenSymbol: nativeTokenInfo.symbol,
          nativeTokenName: nativeTokenInfo.name,
          chainId: effectiveChainId,
          lastUpdated: Date.now(),
        };
        setRates(fallbackRates);
        return;
      }

      setLoading(true);
      setError(null);

      let retryCount = 0;
      const maxRetries = CACHE_CONFIG.MAX_RETRIES;

      const attemptFetch = async (): Promise<void> => {
        try {
          const localCurrency = await fetchGeoData();
          const coingeckoId = nativeTokenInfo.coingeckoId;
          const currencies = `${localCurrency.toLowerCase()},usd`;

          const controller = new AbortController();
          const timeoutId = setTimeout(
            () => controller.abort(),
            CACHE_CONFIG.API_TIMEOUT
          );

          try {
            // Try multiple API approaches with fallbacks
            let response: Response;
            let data: any;
            let apiUsed = "";

            // Strategy 1: Try Netlify Function first (best option)
            try {
              response = await fetch(
                `${API_ENDPOINTS.PRIMARY}?ids=tether,${coingeckoId}&vs_currencies=${currencies}`,
                {
                  signal: controller.signal,
                  headers: {
                    Accept: "application/json",
                  },
                }
              );

              if (response.ok) {
                data = await response.json();
                apiUsed = "netlify-function";
              } else {
                throw new Error(`Netlify Function failed: ${response.status}`);
              }
            } catch (netlifyError) {
              console.warn(
                "Netlify Function failed, trying direct API:",
                netlifyError
              );

              // Strategy 2: Try direct API call
              try {
                response = await fetch(
                  `${API_ENDPOINTS.COINGECKO}?ids=tether,${coingeckoId}&vs_currencies=${currencies}`,
                  {
                    signal: controller.signal,
                    headers: {
                      Accept: "application/json",
                    },
                  }
                );

                if (response.ok) {
                  data = await response.json();
                  apiUsed = "direct";
                } else {
                  throw new Error(`Direct API failed: ${response.status}`);
                }
              } catch (directError) {
                console.warn(
                  "Direct API call failed, trying proxy:",
                  directError
                );

                // Strategy 3: Try first CORS proxy
                try {
                  const proxyUrl = `${API_ENDPOINTS.PROXY}${encodeURIComponent(
                    `${API_ENDPOINTS.COINGECKO}?ids=tether,${coingeckoId}&vs_currencies=${currencies}`
                  )}`;

                  response = await fetch(proxyUrl, {
                    signal: controller.signal,
                    headers: {
                      Accept: "application/json",
                    },
                  });

                  if (response.ok) {
                    data = await response.json();
                    apiUsed = "proxy1";
                  } else {
                    throw new Error(`Proxy 1 failed: ${response.status}`);
                  }
                } catch (proxy1Error) {
                  console.warn(
                    "First proxy failed, trying alternative:",
                    proxy1Error
                  );

                  // Strategy 4: Try alternative CORS proxy
                  try {
                    const proxyUrl2 = `${API_ENDPOINTS.PROXY_ALT}${API_ENDPOINTS.COINGECKO}?ids=tether,${coingeckoId}&vs_currencies=${currencies}`;

                    response = await fetch(proxyUrl2, {
                      signal: controller.signal,
                      headers: {
                        Accept: "application/json",
                        Origin: window.location.origin,
                      },
                    });

                    if (response.ok) {
                      data = await response.json();
                      apiUsed = "proxy2";
                    } else {
                      throw new Error(`Proxy 2 failed: ${response.status}`);
                    }
                  } catch (proxy2Error) {
                    console.warn(
                      "All proxies failed, using fallback rates:",
                      proxy2Error
                    );
                    throw new Error("All API attempts failed");
                  }
                }
              }
            }

            clearTimeout(timeoutId);

            if (!response.ok) {
              if (response.status === 429) {
                // Rate limited - store this info and use cached data
                localStorage.setItem("rate_limited", Date.now().toString());
                throw new Error("Rate limited - using cached data");
              }
              throw new Error(
                `HTTP ${response.status}: ${response.statusText}`
              );
            }

            if (!data.tether || !data[coingeckoId]) {
              throw new Error("Invalid API response structure");
            }

            // Calculate rates
            const usdtPrice = data.tether.usd || 1;
            const nativePrice = data[coingeckoId].usd;

            if (!nativePrice || nativePrice <= 0) {
              throw new Error("Invalid native token price data");
            }

            const usdtToFiat =
              data.tether[localCurrency.toLowerCase()] || usdtPrice;
            const nativeToFiat =
              data[coingeckoId][localCurrency.toLowerCase()] || nativePrice;
            const usdtToNative = usdtPrice / nativePrice;

            const newRates: ExchangeRates = {
              USDT_NATIVE: usdtToNative,
              USDT_FIAT: usdtToFiat,
              NATIVE_FIAT: nativeToFiat,
              nativeTokenSymbol: nativeTokenInfo.symbol,
              nativeTokenName: nativeTokenInfo.name,
              chainId: effectiveChainId,
              lastUpdated: Date.now(),
            };

            setRates(newRates);
            localStorage.setItem(cacheKey, JSON.stringify(newRates));
            // Clear rate limit flag on successful fetch
            localStorage.removeItem("rate_limited");
            setError(null);

            console.info(`Successfully fetched rates using ${apiUsed} API`);
          } catch (fetchError) {
            clearTimeout(timeoutId);
            throw fetchError;
          }
        } catch (error) {
          if (retryCount < maxRetries) {
            retryCount++;
            console.warn(
              `Rate fetch attempt ${retryCount} failed, retrying...`,
              error
            );
            // Exponential backoff
            const delay =
              CACHE_CONFIG.RETRY_DELAY * Math.pow(2, retryCount - 1);
            await new Promise((resolve) => setTimeout(resolve, delay));
            await attemptFetch();
          } else {
            throw error;
          }
        }
      };

      try {
        await attemptFetch();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Network error";
        setError(errorMessage);
        console.warn("All rate fetch attempts failed:", errorMessage);

        // Try to use stale cached data
        try {
          const cachedRates = localStorage.getItem(cacheKey);
          if (cachedRates) {
            const parsed = JSON.parse(cachedRates);
            // Use even stale cache if it exists
            if (parsed.lastUpdated) {
              setRates(parsed);
              console.info("Using stale cached rates due to fetch failure");
              return;
            }
          }
        } catch (cacheError) {
          console.warn("Failed to use cached rates:", cacheError);
        }

        // Ultimate fallback to default rates
        const fallbackRates: ExchangeRates = {
          ...DEFAULT_RATES,
          nativeTokenSymbol: nativeTokenInfo.symbol,
          nativeTokenName: nativeTokenInfo.name,
          chainId: effectiveChainId,
          lastUpdated: Date.now(),
        };
        setRates(fallbackRates);
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
      isUnsupportedNetwork,
    ]
  );

  // price conversion
  const convertPrice = useCallback(
    (price: number, from: Currency, to: Currency): number => {
      if (from === to || !isFinite(price) || price === 0) return price;

      try {
        switch (`${from}_${to}`) {
          case "USDT_NATIVE":
            return price * rates.USDT_NATIVE;
          case "USDT_FIAT":
            return price * rates.USDT_FIAT;
          case "NATIVE_USDT":
            return rates.USDT_NATIVE > 0 ? price / rates.USDT_NATIVE : 0;
          case "NATIVE_FIAT":
            return price * rates.NATIVE_FIAT;
          case "FIAT_USDT":
            return rates.USDT_FIAT > 0 ? price / rates.USDT_FIAT : 0;
          case "FIAT_NATIVE":
            return rates.NATIVE_FIAT > 0 ? price / rates.NATIVE_FIAT : 0;
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

  // price formatting
  const formatPrice = useCallback(
    (price: number, currency: Currency): string => {
      if (!isFinite(price) || price == null) return "—";

      try {
        if (currency === "USDT") {
          return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
            maximumFractionDigits: Math.abs(price) < 1 ? 6 : 2,
          }).format(price);
        }

        if (currency === "NATIVE") {
          const decimals =
            Math.abs(price) < 1 ? 6 : Math.abs(price) < 1000 ? 4 : 2;
          const formattedNumber = price.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: decimals,
          });
          return `${formattedNumber} ${rates.nativeTokenSymbol}`;
        }

        // FIAT formatting with locale detection
        try {
          return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: userCountry,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(price);
        } catch (localeError) {
          // Fallback to USD if user's currency is not supported
          return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(price);
        }
      } catch (error) {
        console.warn("Price formatting failed:", error);
        const symbol =
          currency === "NATIVE" ? rates.nativeTokenSymbol : currency;
        return `${price.toFixed(2)} ${symbol}`;
      }
    },
    [rates.nativeTokenSymbol, userCountry]
  );

  const refreshRates = useCallback(() => fetchRates(true), [fetchRates]);

  // Effect to fetch rates when chain changes
  useEffect(() => {
    const needsFresh =
      !rates.lastUpdated ||
      rates.chainId !== effectiveChainId ||
      Date.now() - rates.lastUpdated > CACHE_CONFIG.RATE_CACHE_DURATION;

    if (needsFresh && !isUnsupportedNetwork) {
      fetchRates();
    } else if (isUnsupportedNetwork && rates.chainId !== effectiveChainId) {
      // Update rates immediately for unsupported networks
      const fallbackRates: ExchangeRates = {
        ...DEFAULT_RATES,
        nativeTokenSymbol: nativeTokenInfo.symbol,
        nativeTokenName: nativeTokenInfo.name,
        chainId: effectiveChainId,
        lastUpdated: Date.now(),
      };
      setRates(fallbackRates);
    }
  }, [
    effectiveChainId,
    fetchRates,
    isUnsupportedNetwork,
    nativeTokenInfo,
    rates.chainId,
    rates.lastUpdated,
  ]);

  // Auto-refresh interval with cleanup and rate limit checking
  useEffect(() => {
    if (isUnsupportedNetwork) return;

    const interval = setInterval(() => {
      // Check if we're rate limited
      const rateLimited = localStorage.getItem("rate_limited");
      if (rateLimited) {
        const rateLimitTime = parseInt(rateLimited);
        const timeSinceRateLimit = Date.now() - rateLimitTime;

        // If rate limited recently, skip this refresh
        if (timeSinceRateLimit < CACHE_CONFIG.RATE_LIMIT_DELAY) {
          console.info("Skipping rate fetch due to recent rate limiting");
          return;
        } else {
          // Clear rate limit flag if enough time has passed
          localStorage.removeItem("rate_limited");
        }
      }

      if (!loading) {
        fetchRates();
      }
    }, CACHE_CONFIG.RATE_CACHE_DURATION);

    return () => clearInterval(interval);
  }, [fetchRates, loading, isUnsupportedNetwork]);

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
      isUnsupportedNetwork: isUnsupportedNetwork,
    }),
    [
      rates,
      loading,
      error,
      userCountry,
      convertPrice,
      formatPrice,
      refreshRates,
      isUnsupportedNetwork,
    ]
  );
};
