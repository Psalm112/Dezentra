export const parseWeb3Error = (error: any): string => {
  if (error?.cause?.reason) {
    return error.cause.reason;
  }

  if (error?.shortMessage) {
    return error.shortMessage;
  }

  const errorMessage = error?.message || error?.toString() || "";

  // error messages
  if (errorMessage.includes("insufficient funds")) {
    return "Insufficient funds for gas fees";
  }

  if (errorMessage.includes("user rejected")) {
    return "Transaction was cancelled by user";
  }

  if (
    errorMessage.includes("network changed") ||
    errorMessage.includes("chain mismatch")
  ) {
    return "Network changed during transaction. Please try again.";
  }

  if (errorMessage.includes("nonce too low")) {
    return "Transaction nonce error. Please try again.";
  }

  if (errorMessage.includes("gas limit")) {
    return "Gas limit exceeded. Please try again.";
  }

  if (errorMessage.includes("replacement transaction underpriced")) {
    return "Transaction underpriced. Please increase gas price.";
  }

  // Contract-specific errors
  if (errorMessage.includes("InsufficientUSDTBalance")) {
    return "Insufficient USDT balance";
  }

  if (errorMessage.includes("InsufficientUSDTAllowance")) {
    return "Insufficient USDT allowance. Please approve spending.";
  }

  if (errorMessage.includes("InvalidTradeId")) {
    return "Invalid trade ID";
  }

  if (errorMessage.includes("InvalidQuantity")) {
    return "Invalid quantity specified";
  }

  if (errorMessage.includes("InsufficientQuantity")) {
    return "Insufficient quantity available";
  }

  if (errorMessage.includes("BuyerIsSeller")) {
    return "Cannot buy your own trade";
  }

  if (errorMessage.includes("InvalidLogisticsProvider")) {
    return "Invalid logistics provider selected";
  }

  if (errorMessage.includes("NotAuthorized")) {
    return "You are not authorized to perform this action";
  }

  if (errorMessage.includes("InvalidPurchaseId")) {
    return "Invalid purchase ID";
  }

  if (errorMessage.includes("InvalidPurchaseState")) {
    return "Purchase is not in the correct state for this action";
  }

  if (errorMessage.includes("PurchaseNotFound")) {
    return "Purchase not found";
  }

  if (errorMessage.includes("TradeNotFound")) {
    return "Trade not found";
  }

  return "Transaction failed. Please try again.";
};
