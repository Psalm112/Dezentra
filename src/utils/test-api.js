// Test utility for API endpoints
export const testAPIEndpoints = async () => {
  const endpoints = [
    {
      name: "Netlify Function",
      url: "/.netlify/functions/coingecko-proxy?ids=tether,avalanche-2&vs_currencies=usd,ngn",
    },
    {
      name: "Direct CoinGecko",
      url: "https://api.coingecko.com/api/v3/simple/price?ids=tether,avalanche-2&vs_currencies=usd,ngn",
    },
    {
      name: "CORS Proxy 1",
      url:
        "https://api.allorigins.win/raw?url=" +
        encodeURIComponent(
          "https://api.coingecko.com/api/v3/simple/price?ids=tether,avalanche-2&vs_currencies=usd,ngn"
        ),
    },
  ];

  const results = [];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint.name}...`);
      const startTime = Date.now();

      const response = await fetch(endpoint.url, {
        headers: {
          Accept: "application/json",
        },
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      if (response.ok) {
        const data = await response.json();
        results.push({
          name: endpoint.name,
          status: "✅ SUCCESS",
          duration: `${duration}ms`,
          data: data,
        });
        console.log(`✅ ${endpoint.name} - ${duration}ms`);
      } else {
        results.push({
          name: endpoint.name,
          status: `❌ FAILED (${response.status})`,
          duration: `${duration}ms`,
          error: response.statusText,
        });
        console.log(
          `❌ ${endpoint.name} - ${response.status} ${response.statusText}`
        );
      }
    } catch (error) {
      results.push({
        name: endpoint.name,
        status: "❌ ERROR",
        duration: "N/A",
        error: error.message,
      });
      console.log(`❌ ${endpoint.name} - ${error.message}`);
    }
  }

  console.table(results);
  return results;
};

// Test rate limiting detection
export const testRateLimitDetection = () => {
  const rateLimited = localStorage.getItem("rate_limited");
  if (rateLimited) {
    const timeSince = Date.now() - parseInt(rateLimited);
    const minutesAgo = Math.floor(timeSince / 60000);
    console.log(`Rate limited ${minutesAgo} minutes ago`);
    return true;
  } else {
    console.log("Not currently rate limited");
    return false;
  }
};

// Test cache status
export const testCacheStatus = () => {
  const cacheKeys = Object.keys(localStorage).filter(
    (key) =>
      key.startsWith("currency_rates_v2_") ||
      key === "user_geo_v2" ||
      key === "rate_limited"
  );

  const cacheData = {};
  cacheKeys.forEach((key) => {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        cacheData[key] = {
          lastUpdated: parsed.lastUpdated
            ? new Date(parsed.lastUpdated).toLocaleString()
            : "N/A",
          data: parsed,
        };
      }
    } catch (error) {
      cacheData[key] = { error: "Failed to parse" };
    }
  });

  console.log("Cache Status:", cacheData);
  return cacheData;
};
