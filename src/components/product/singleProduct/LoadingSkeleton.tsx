import React from "react";

interface LoadingSkeletonProps {
  type?: "full" | "partial";
}

const ProductLoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  type = "full",
}) => {
  const pulseClass = "animate-pulse bg-gray-700/30 rounded";

  // Full page skeleton
  if (type === "full") {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col xl:flex-row gap-6">
          {/* Left column - Product Image */}
          <div className="w-full xl:w-5/12 bg-[#292B30] rounded-xl shadow-lg p-6">
            <div className="flex flex-col items-center justify-center">
              {/* Navigation buttons skeleton */}
              <div className="w-full flex justify-between mb-4">
                <div className={`${pulseClass} w-10 h-10 rounded-full`}></div>
                <div className="flex gap-2">
                  <div className={`${pulseClass} w-10 h-10 rounded-full`}></div>
                  <div className={`${pulseClass} w-10 h-10 rounded-full`}></div>
                </div>
              </div>

              {/* Image skeleton */}
              <div
                className={`${pulseClass} w-[65%] sm:w-[50%] md:w-[40%] aspect-[1/2.5]`}
              ></div>

              {/* Indicator dots skeleton */}
              <div className="flex gap-2 mt-4">
                <div className={`${pulseClass} w-2 h-2 rounded-full`}></div>
                <div className={`${pulseClass} w-2 h-2 rounded-full`}></div>
                <div className={`${pulseClass} w-2 h-2 rounded-full`}></div>
              </div>
            </div>
          </div>

          {/* Right column - Product Info */}
          <div className="w-full xl:w-7/12">
            <div className="bg-[#292B30] shadow-xl rounded-xl overflow-hidden">
              {/* Product title and price skeleton */}
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className={`${pulseClass} h-8 w-3/4`}></div>
                  <div className={`${pulseClass} h-6 w-1/4`}></div>
                </div>
              </div>

              {/* Tabs skeleton */}
              <div className="border-b border-gray-700 px-6 pt-4 pb-2">
                <div className="flex justify-between">
                  <div className={`${pulseClass} h-8 w-1/4`}></div>
                  <div className={`${pulseClass} h-8 w-1/4`}></div>
                </div>
              </div>

              {/* Content skeleton */}
              <div className="p-4 sm:p-6">
                <div className="space-y-4">
                  <div className={`${pulseClass} h-4 w-full`}></div>
                  <div className={`${pulseClass} h-4 w-5/6`}></div>
                  <div className={`${pulseClass} h-4 w-4/6`}></div>
                  <div className={`${pulseClass} h-4 w-full`}></div>
                  <div className={`${pulseClass} h-4 w-3/4`}></div>
                </div>
              </div>

              {/* Purchase section skeleton */}
              <div className="border-t border-gray-700 p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className={`${pulseClass} h-10 w-1/4`}></div>
                  <div className={`${pulseClass} h-10 w-1/3`}></div>
                </div>
              </div>
            </div>

            {/* Related products skeleton */}
            <div className="mt-8 bg-[#292B30] rounded-xl p-4 sm:p-6 shadow-lg">
              <div className={`${pulseClass} h-6 w-1/3 mb-4`}></div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="bg-[#212428] rounded-lg p-3">
                    <div className={`${pulseClass} aspect-square mb-2`}></div>
                    <div className={`${pulseClass} h-4 w-4/5 mb-1`}></div>
                    <div className={`${pulseClass} h-3 w-2/5`}></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Partial skeleton
  return (
    <div className="p-4 sm:p-6">
      <div className="space-y-4">
        <div className={`${pulseClass} h-4 w-full`}></div>
        <div className={`${pulseClass} h-4 w-5/6`}></div>
        <div className={`${pulseClass} h-4 w-4/6`}></div>
      </div>
    </div>
  );
};

export default ProductLoadingSkeleton;
