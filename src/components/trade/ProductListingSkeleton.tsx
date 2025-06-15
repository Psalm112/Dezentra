const ProductListingSkeleton = () => {
  return (
    <div className="space-y-6">
      {[1, 2].map((item) => (
        <div
          key={item}
          className="grid grid-cols-1 xs:grid-cols-[2fr_3fr] h-full items-center gap-6 md:gap-10 p-6 md:px-[10%] lg:px-[15%] md:py-10 bg-[#292B30] mt-8 rounded-lg"
        >
          <div className="w-[60%] md:w-full h-40 mx-auto md:mx-0 rounded-md bg-[#1D1F23] animate-pulse"></div>

          <div className="flex flex-col w-full text-left space-y-3">
            <div className="h-8 bg-[#1D1F23] rounded-md w-3/4 animate-pulse"></div>
            <div className="h-4 bg-[#1D1F23] rounded-md w-1/2 animate-pulse"></div>
            <div className="h-6 bg-[#1D1F23] rounded-md w-1/4 animate-pulse"></div>
            <div className="h-4 bg-[#1D1F23] rounded-md w-1/3 ml-auto animate-pulse"></div>

            <div className="flex justify-between mt-2">
              <div className="h-4 bg-[#1D1F23] rounded-md w-1/3 animate-pulse"></div>
              <div className="h-4 bg-[#1D1F23] rounded-md w-1/3 animate-pulse"></div>
            </div>
            <div className="flex justify-between">
              <div className="h-4 bg-[#1D1F23] rounded-md w-1/3 animate-pulse"></div>
              <div className="h-4 bg-[#1D1F23] rounded-md w-1/3 animate-pulse"></div>
            </div>
            <div className="flex justify-between">
              <div className="h-4 bg-[#1D1F23] rounded-md w-1/3 animate-pulse"></div>
              <div className="h-4 bg-[#1D1F23] rounded-md w-1/3 animate-pulse"></div>
            </div>
          </div>

          <div className="xs:col-span-2 mx-auto xs:w-[80%] w-full lg:w-full lg:col-start-2">
            <div className="h-10 bg-[#1D1F23] rounded-md w-full animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  );
};
export default ProductListingSkeleton;
