import { Detail, Comment } from "../../../pages";

interface ProductTabsProps {
  activeTab: "details" | "reviews";
  setActiveTab: (tab: "details" | "reviews") => void;
  reviewCount?: number;
}

const ProductTabs = ({
  activeTab,
  setActiveTab,
  reviewCount = 0,
}: ProductTabsProps) => {
  return (
    <div className="flex items-center justify-between border-b border-gray-700 px-3 sm:px-6 md:px-12 lg:px-20 pt-2 sm:pt-4 overflow-x-auto">
      {/* Details Tab */}
      <button
        className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 text-base sm:text-lg md:text-xl font-bold px-2 sm:px-4 transition-all focus:outline-none  ${
          activeTab === "details"
            ? "text-Red"
            : "text-gray-400 hover:text-gray-200"
        }`}
        onClick={() => setActiveTab("details")}
        aria-selected={activeTab === "details"}
        role="tab"
      >
        <span className="relative pb-4">
          <span className="flex items-center gap-1 sm:gap-2">
            <img src={Detail} alt="" className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="whitespace-nowrap">Details</span>
          </span>
          {activeTab === "details" && (
            <span className="absolute bottom-0 left-0 bg-Red rounded-full w-full h-1"></span>
          )}
        </span>
      </button>

      {/* Reviews Tab */}
      <button
        className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 text-base sm:text-lg md:text-xl font-bold px-2 sm:px-4 transition-all focus:outline-none  ${
          activeTab === "reviews"
            ? "text-Red"
            : "text-gray-400 hover:text-gray-200"
        }`}
        onClick={() => setActiveTab("reviews")}
        aria-selected={activeTab === "reviews"}
        role="tab"
      >
        <span className="relative pb-4">
          <span className="flex items-center justify-center gap-1 sm:gap-2">
            <img src={Comment} alt="" className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="whitespace-nowrap">Reviews</span>
            {reviewCount > 0 && (
              <span className="bg-Red text-xs rounded-full px-1.5 py-0.5 ml-1 text-white">
                {reviewCount}
              </span>
            )}
          </span>
          {activeTab === "reviews" && (
            <span className="absolute bottom-0 left-0 bg-Red rounded-full w-full h-1"></span>
          )}
        </span>
      </button>
    </div>
  );
};

export default ProductTabs;
