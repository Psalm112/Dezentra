const fetch = require("node-fetch");

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json",
  };

  // Handle preflight requests
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  try {
    // Get query parameters from the request
    const { ids, vs_currencies } = event.queryStringParameters || {};

    if (!ids || !vs_currencies) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Missing required parameters: ids and vs_currencies",
        }),
      };
    }

    // Construct the CoinGecko API URL
    const apiUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=${vs_currencies}`;

    // Make the request to CoinGecko
    const response = await fetch(apiUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Dezenmart-Frontend/1.0",
      },
      timeout: 10000, // 10 second timeout
    });

    if (!response.ok) {
      // Handle rate limiting specifically
      if (response.status === 429) {
        return {
          statusCode: 429,
          headers,
          body: JSON.stringify({
            error: "Rate limited by CoinGecko API",
            retryAfter: response.headers.get("retry-after") || 60,
          }),
        };
      }

      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          error: `CoinGecko API error: ${response.statusText}`,
        }),
      };
    }

    const data = await response.json();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error("Proxy error:", error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Internal server error",
        message: error.message,
      }),
    };
  }
};
