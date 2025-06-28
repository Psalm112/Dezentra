import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { LiaAngleLeftSolid } from "react-icons/lia";
import { FaRegHeart, FaHeart } from "react-icons/fa";
import { IoShareSocialOutline } from "react-icons/io5";
import { motion } from "framer-motion";
import { useWatchlist } from "../utils/hooks/useWatchlist";

import ProductImage from "../components/product/singleProduct/ProductImage";
import ProductTabs from "../components/product/singleProduct/ProductTabs";
import ProductDetails from "../components/product/singleProduct/ProductDetails";
import CustomerReviews from "../components/product/singleProduct/CustomerReviews";
import PurchaseSection from "../components/product/singleProduct/PurchaseSection";
import ProductLoadingSkeleton from "../components/product/singleProduct/LoadingSkeleton";
import ProductCard from "../components/product/ProductCard";
import { useProductData } from "../utils/hooks/useProduct";
import { useCurrency } from "../context/CurrencyContext";
import { ProductVariant } from "../utils/types";
import { useAuth } from "../context/AuthContext";
import { useWeb3 } from "../context/Web3Context";

type TabType = "details" | "reviews";

const SingleProduct = () => {
  const { user } = useAuth();
  const { productId } = useParams();
  const navigate = useNavigate();
  const { wallet, chainId, isCorrectNetwork } = useWeb3();
  const {
    formattedProduct,
    loading,
    error,
    fetchProductById,
    relatedProducts,
  } = useProductData({
    chainId,
    isConnected: wallet.isConnected && isCorrectNetwork,
  });
  const { secondaryCurrency } = useCurrency();
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [reviewCount, setReviewCount] = useState(0);
  const { isProductInWatchlist, toggleWatchlist, checkProductWatchlist } =
    useWatchlist();
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null
  );
  const isFavorite = productId ? isProductInWatchlist(productId) : false;

  const handleGoBack = () => navigate(-1);

  const handleToggleFavorite = () => {
    if (productId) {
      toggleWatchlist(productId);
    }
  };

  const handleVariantSelect = (variant: ProductVariant) => {
    if (!variant) return;

    // if (typeof variant.quantity !== "number") {
    //   console.warn("Invalid variant selected: missing quantity");
    //   return;
    // }

    setSelectedVariant(variant);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: formattedProduct?.name || "Check out this product",
          text:
            typeof formattedProduct?.description === "string"
              ? formattedProduct.description.slice(0, 100)
              : "I found this amazing product",
          url: window.location.href,
        });
      } catch (error) {
        console.error("Error sharing product:", error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  useEffect(() => {
    const loadProduct = async () => {
      if (productId) {
        await fetchProductById(productId);
        await checkProductWatchlist(productId);
        setActiveTab("details");
      }
    };
    loadProduct();

    window.scrollTo(0, 0);

    // Cleanup
    return () => {};
  }, [productId, fetchProductById, checkProductWatchlist]);

  // Initialize with first available variant when product loads
  useEffect(() => {
    if (
      !loading &&
      formattedProduct?.type &&
      Array.isArray(formattedProduct.type) &&
      formattedProduct.type.length > 0
    ) {
      // Find first variant with quantity > 0
      const firstAvailableVariant =
        formattedProduct.type.find(
          (variant: ProductVariant) => variant.quantity > 0
        ) || formattedProduct.type[0];

      handleVariantSelect(firstAvailableVariant);
    } else {
      setSelectedVariant(null);
    }
  }, [formattedProduct, loading]);

  if (loading || !formattedProduct) {
    return <ProductLoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="bg-Dark min-h-screen flex items-center justify-center">
        <div className="bg-[#292B30] p-8 rounded-xl shadow-lg">
          <h2 className="text-xl font-bold mb-4">Cannot Find Product</h2>
          <p className="text-gray-400 mb-6">
            Sorry, we couldn't find the product you're looking for.
          </p>
          <button
            onClick={handleGoBack}
            className="bg-Red text-white py-2 px-6 rounded-md hover:bg-[#d52a33] transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const backgroundStyle = {
    background: `linear-gradient(to bottom, #292B30 0%, rgba(41, 43, 48, 0.95) 100%)`,
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="bg-Dark min-h-screen"
    >
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col xl:flex-row gap-6">
          <div
            style={backgroundStyle}
            className="w-full xl:w-5/12 rounded-xl shadow-lg transition-all duration-500"
          >
            <div className="relative flex flex-col items-center p-4 sm:p-6 h-full">
              {/* Navigation Controls */}
              <div className="flex items-center justify-between w-full absolute top-4 px-2 sm:px-4 z-10">
                <button
                  onClick={handleGoBack}
                  aria-label="Go back"
                  className="hover:opacity-80 transition-opacity p-2.5 bg-black/20 backdrop-blur-sm rounded-full"
                >
                  <LiaAngleLeftSolid className="text-xl sm:text-2xl text-white" />
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={handleShare}
                    aria-label="Share product"
                    className="hover:opacity-80 transition-opacity p-2.5 bg-black/20 backdrop-blur-sm rounded-full"
                  >
                    <IoShareSocialOutline className="text-xl sm:text-2xl text-white" />
                  </button>

                  <button
                    onClick={handleToggleFavorite}
                    aria-label={
                      isFavorite ? "Remove from favorites" : "Add to favorites"
                    }
                    className="hover:opacity-80 transition-opacity p-2.5 bg-black/20 backdrop-blur-sm rounded-full"
                  >
                    {isFavorite ? (
                      <FaHeart className="text-xl sm:text-2xl text-Red" />
                    ) : (
                      <FaRegHeart className="text-xl sm:text-2xl text-white" />
                    )}
                  </button>
                </div>
              </div>

              {/* Product Image */}
              <ProductImage images={formattedProduct.images} />
            </div>
          </div>

          <div className="w-full xl:w-7/12">
            <div className="bg-[#292B30] shadow-xl text-white w-full rounded-xl overflow-hidden">
              <div className="px-4 sm:px-8 md:px-12 py-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <h1 className="text-2xl sm:text-3xl font-bold">
                    {formattedProduct.name}
                  </h1>
                  <div className="flex flex-col gap-1 text-right">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">
                        {formattedProduct.formattedNativePrice}
                      </span>
                    </div>
                    <span className="text-sm text-gray-400 justify-self-start sm:justify-self-end">
                      {secondaryCurrency === "USDT"
                        ? formattedProduct.formattedUsdtPrice
                        : formattedProduct.formattedFiatPrice}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <ProductTabs
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                reviewCount={reviewCount}
              />

              {/* Tab Content */}
              <div className="transition-all duration-300">
                {activeTab === "details" ? (
                  <ProductDetails
                    product={formattedProduct}
                    onVariantSelect={handleVariantSelect}
                  />
                ) : (
                  <CustomerReviews
                    productId={formattedProduct._id}
                    reviewcount={setReviewCount}
                  />
                )}
              </div>

              {typeof formattedProduct.seller === "object" &&
                formattedProduct.seller?._id !== user?._id && (
                  <PurchaseSection
                    product={formattedProduct}
                    selectedVariant={selectedVariant as ProductVariant}
                  />
                )}
            </div>
          </div>
        </div>
        {relatedProducts.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-white mb-4">
              Related Products
            </h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 md:gap-5">
              {relatedProducts.map((product) => {
                if (!product) return null;
                return <ProductCard key={product?._id} product={product} />;
              })}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SingleProduct;
