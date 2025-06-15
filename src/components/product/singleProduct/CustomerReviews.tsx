import { useState, useEffect, useCallback } from "react";
import {
  MdOutlineStar,
  MdOutlineStarHalf,
  MdOutlineStarOutline,
} from "react-icons/md";
import { BiSolidQuoteRight } from "react-icons/bi";
import { motion, AnimatePresence } from "framer-motion";
import { useReviewData } from "../../../utils/hooks/useReview";

interface CustomerReviewsProps {
  productId?: string;
  reviewcount: React.Dispatch<React.SetStateAction<number>>;
}

interface ReviewWithFormatting {
  id: string;
  text: string;
  name: string;
  date: string;
  rating: number;
  avatar?: string;
}

const CustomerReviews = ({ productId, reviewcount }: CustomerReviewsProps) => {
  const [visibleReviews, setVisibleReviews] = useState<number>(3);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [formattedReviews, setFormattedReviews] = useState<
    ReviewWithFormatting[]
  >([]);

  const { getProductReviews, reviews } = useReviewData();

  useEffect(() => {
    const loadReviews = async () => {
      if (!productId) return;

      setIsLoading(true);
      try {
        await getProductReviews(productId, false, true);
      } catch (error) {
        console.error("Error fetching reviews:", error);
      }
    };

    loadReviews();
  }, [productId, getProductReviews]);

  useEffect(() => {
    if (reviews) {
      const formatted = reviews.map((review) => {
        const reviewData =
          typeof review.reviewer === "string"
            ? { _id: review._id, name: "Anonymous", profileImage: "" }
            : {
                _id: review.reviewer._id || "",
                name: review.reviewer.name || "Anonymous",
                profileImage: review.reviewer.profileImage || "",
              };

        return {
          id: review._id,
          text: review.comment,
          name: reviewData.name,
          date: new Date(review.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          }),
          rating: review.rating,
          avatar:
            reviewData.profileImage || "https://avatar.iran.liara.run/public",
        };
      });
      reviewcount(formatted.length);
      setFormattedReviews(formatted);
      setIsLoading(false);
    }
  }, [reviews, reviewcount]);

  const loadMoreReviews = () => {
    setIsLoading(true);
    setTimeout(() => {
      setVisibleReviews(formattedReviews.length);
      setIsLoading(false);
    }, 800);
  };

  const renderStars = useCallback((rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<MdOutlineStar key={i} className="text-Red" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<MdOutlineStarHalf key={i} className="text-Red" />);
      } else {
        stars.push(<MdOutlineStarOutline key={i} className="text-gray-500" />);
      }
    }

    return stars;
  }, []);

  const averageRating = formattedReviews.length
    ? (
        formattedReviews.reduce((sum, r) => sum + r.rating, 0) /
        formattedReviews.length
      ).toFixed(1)
    : "0.0";

  return (
    <div className="text-gray-400 px-3 sm:px-6 md:px-12 lg:px-20 py-3 sm:py-5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white text-lg font-medium">Customer Feedback</h3>
        <div className="flex items-center gap-1">
          <span className="text-white font-medium">{averageRating}</span>
          <div className="flex">{renderStars(parseFloat(averageRating))}</div>
          <span className="text-sm text-gray-400">
            ({formattedReviews.length})
          </span>
        </div>
      </div>

      {isLoading ? (
        // Loading skeletons
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#212428] p-4 rounded-lg animate-pulse">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-700/50" />
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-gray-700/50 rounded" />
                    <div className="h-3 w-16 bg-gray-700/50 rounded" />
                  </div>
                </div>
                <div className="w-20 h-8 bg-gray-700/50 rounded-md" />
              </div>
              <div className="h-4 w-full bg-gray-700/50 rounded mt-4" />
              <div className="h-4 w-3/4 bg-gray-700/50 rounded mt-2" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <AnimatePresence>
            {formattedReviews.slice(0, visibleReviews).map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-[#212428] p-3 sm:p-4 md:p-6 rounded-lg mb-3 sm:mb-4 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    {review.avatar && (
                      <img
                        src={review.avatar}
                        alt={review.name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-[#292B30]"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://randomuser.me/api/portraits/lego/1.jpg";
                        }}
                      />
                    )}
                    <div>
                      <h6 className="font-medium text-white text-sm sm:text-base">
                        {review.name}
                      </h6>
                      <span className="text-xs text-[#6D6D6D]">
                        Order {review.date}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-[#2f3137] shadow-xl px-2 py-1 rounded-md">
                    <div className="flex">{renderStars(review.rating)}</div>
                    <span className="text-white text-sm ml-1">
                      {review.rating}
                    </span>
                  </div>
                </div>

                <div className="relative pl-6 pr-2">
                  <BiSolidQuoteRight className="text-Red text-lg sm:text-xl absolute top-0 left-0 opacity-70" />
                  <p className="text-xs sm:text-sm md:text-base">
                    "{review.text}"
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {visibleReviews < formattedReviews.length && (
            <div className="mt-4 text-center">
              <button
                className="bg-[#292B30] text-Red hover:bg-[#31333a] px-4 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-Red/30 disabled:opacity-70"
                onClick={loadMoreReviews}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-Red"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Loading...
                  </span>
                ) : (
                  "View more reviews"
                )}
              </button>
            </div>
          )}

          {formattedReviews.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">
                No reviews yet. Be the first to leave a review!
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CustomerReviews;
