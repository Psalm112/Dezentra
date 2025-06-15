export const debounce = <F extends (...args: any[]) => any>(
  func: F,
  wait: number
) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function (this: any, ...args: Parameters<F>) {
    const context = this;

    if (timeout) clearTimeout(timeout);

    return new Promise<ReturnType<F>>((resolve) => {
      timeout = setTimeout(() => {
        const result = func.apply(context, args);
        resolve(result);
        timeout = null;
      }, wait);
    });
  };
};

// order storage
const ORDER_ID_KEY = "current_order_id";

export const storeOrderId = (orderId: string): void => {
  localStorage.setItem(ORDER_ID_KEY, orderId);
};

export const getStoredOrderId = (): string | null => {
  return localStorage.getItem(ORDER_ID_KEY);
};

export const clearStoredOrderId = (): void => {
  localStorage.removeItem(ORDER_ID_KEY);
};
