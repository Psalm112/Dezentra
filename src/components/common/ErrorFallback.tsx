import React from "react";
import Button from "./Button";

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
}) => {
  return (
    <div className="bg-[#292B30] p-6 rounded-lg flex flex-col items-center justify-center text-center">
      <h2 className="text-xl font-semibold text-white mb-4">
        Something went wrong
      </h2>
      <p className="text-gray-300 mb-4">
        {error.message || "An unexpected error occurred"}
      </p>
      <Button
        title="Try again"
        onClick={resetErrorBoundary}
        className="bg-Red hover:bg-[#e02d37] text-white px-6 py-2 rounded-md"
      />
    </div>
  );
};

export default ErrorFallback;
