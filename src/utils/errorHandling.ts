export const setupGlobalErrorHandling = () => {
  // Handle unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    console.error("Unhandled promise rejection:", event.reason);
    // send to an error tracking service here
  });

  // Handle uncaught exceptions
  window.addEventListener("error", (event) => {
    console.error("Uncaught error:", event.error);
    //  send to an error tracking service here
  });
};
