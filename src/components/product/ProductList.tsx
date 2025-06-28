import { useEffect, useState, useCallback, useMemo } from "react";
import { twMerge } from "tailwind-merge";
import ProductCard from "./ProductCard";
import Title from "../common/Title";
import { Link } from "react-router-dom";
import { useProductData } from "../../utils/hooks/useProduct";
import { Product } from "../../utils/types";
import LoadingSpinner from "../common/LoadingSpinner";
import { useIntersectionObserver } from "../../utils/hooks/useIntersectionObserver";
import { useAuth } from "../../context/AuthContext";
import { useWeb3 } from "../../context/Web3Context";

interface Props {
  title: string;
  path?: string;
  className?: string;
  isCategoryView: boolean;
  isUserProducts?: boolean;
  category?: string;
  isFeatured?: boolean;
  maxItems?: number;
  showViewAll?: boolean;
}

interface FormattedProductProp extends Product {
  nativePrice: number;
  fiatPrice: number;
  formattedNativePrice: string;
  formattedFiatPrice: string;
  formattedUsdtPrice: string;
}

// const ITEMS_PER_PAGE = window.innerWidth < 768 ? 6 : 12;
// const HOME_PAGE_LIMIT = window.innerWidth < 768 ? 6 : 12;
// const CATEGORY_SPONSORED_LIMIT = window.innerWidth < 768 ? 4 : 8;

const ProductList = ({
  title,
  path,
  className,
  isCategoryView,
  category,
  isFeatured = false,
  maxItems,
  showViewAll = true,
  isUserProducts = false,
}: Props) => {
  const { user } = useAuth();
  const { wallet, chainId, isCorrectNetwork } = useWeb3();
  const {
    products,
    sponsoredProducts,
    loading,
    error,
    fetchAllProducts,
    fetchSponsoredProducts,
    getProductsByCategory,
    productsByUser,
  } = useProductData({
    chainId,
    isConnected: wallet.isConnected && isCorrectNetwork,
  });

  const [displayProducts, setDisplayProducts] = useState<
    FormattedProductProp[]
  >([]);
  const [sponsoredDisplayProducts, setSponsoredDisplayProducts] = useState<
    FormattedProductProp[]
  >([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Intersection observer
  const { targetRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: "100px",
  });

  // filtered products
  const { allProducts, categorySponsored } = useMemo(() => {
    let allProducts: FormattedProductProp[] = [];
    let categorySponsored: FormattedProductProp[] = [];

    if (isFeatured) {
      allProducts = sponsoredProducts || [];
    } else if (category && category !== "All") {
      const categoryProducts = getProductsByCategory(category);
      // Filter sponsored products for this category
      categorySponsored = (sponsoredProducts || []).filter(
        (product) => product.category?.toLowerCase() === category.toLowerCase()
      );
      // .slice(0, CATEGORY_SPONSORED_LIMIT);

      // Get non-sponsored products for this category
      const sponsoredIds = new Set(categorySponsored.map((p) => p._id));
      allProducts = categoryProducts.filter(
        (product) => !sponsoredIds.has(product._id)
      );
    } else if (isUserProducts) {
      const userProducts = productsByUser;
      categorySponsored = (sponsoredProducts || []).filter((product) => {
        if (!product || !user) return [];
        if (typeof product.seller === "object" && product.seller) {
          return (
            product.seller._id === user._id || product.seller.name === user.name
          );
        }

        return product.seller === user._id;
      });
      const sponsoredIds = new Set(categorySponsored.map((p) => p._id));
      allProducts = userProducts.filter(
        (product) => !sponsoredIds.has(product._id)
      );
    } else {
      const sponsoredIds = new Set((sponsoredProducts || []).map((p) => p._id));
      allProducts = (products || []).filter(
        (product) => !sponsoredIds.has(product._id)
      );
    }

    return { allProducts, categorySponsored };
  }, [
    products,
    sponsoredProducts,
    category,
    isFeatured,
    productsByUser,
    getProductsByCategory,
  ]);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setIsInitialLoading(true);
      setLoadError(null);

      try {
        if (isFeatured) {
          await fetchSponsoredProducts(false, false, true);
        } else {
          await Promise.all([
            fetchAllProducts(false, false, true),
            fetchSponsoredProducts(false, false, true),
          ]);
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setLoadError("Failed to load products. Please try again later.");
        }
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadInitialData();
  }, [isFeatured, fetchAllProducts, fetchSponsoredProducts]);

  useEffect(() => {
    if (isInitialLoading || loading) return;

    // Handle sponsored products for category view
    if (
      ((isCategoryView && category) || isUserProducts) &&
      categorySponsored.length > 0
    ) {
      setSponsoredDisplayProducts(categorySponsored);
    }

    // Determine how many items to show initially
    // let initialLimit = maxItems || ITEMS_PER_PAGE;
    // if (!isCategoryView && !isFeatured) {
    //   initialLimit = HOME_PAGE_LIMIT;
    // }

    const initialProducts = allProducts;
    // .slice(0, initialLimit);
    setDisplayProducts(initialProducts);
    setCurrentPage(1);
    // setHasMore(allProducts.length > initialLimit);
  }, [
    allProducts,
    categorySponsored,
    category,
    isCategoryView,
    isFeatured,
    maxItems,
    isInitialLoading,
    loading,
  ]);

  // Load more products
  const loadMoreProducts = useCallback(async () => {
    if (isLoadingMore || !hasMore || isInitialLoading) return;

    setIsLoadingMore(true);

    await new Promise((resolve) => setTimeout(resolve, 300));

    const nextPage = currentPage + 1;
    const startIndex = nextPage - 1;
    // * ITEMS_PER_PAGE;
    const endIndex = startIndex;
    // + ITEMS_PER_PAGE;

    const newProducts = allProducts.slice(startIndex, endIndex);

    if (newProducts.length > 0) {
      setDisplayProducts((prev) => [...prev, ...newProducts]);
      setCurrentPage(nextPage);
      setHasMore(endIndex < allProducts.length);
    } else {
      setHasMore(false);
    }

    setIsLoadingMore(false);
  }, [currentPage, allProducts, hasMore, isLoadingMore, isInitialLoading]);

  useEffect(() => {
    if (isIntersecting && !isLoadingMore && hasMore && !isInitialLoading) {
      loadMoreProducts();
    }
  }, [
    isIntersecting,
    loadMoreProducts,
    isLoadingMore,
    hasMore,
    isInitialLoading,
  ]);

  if (
    !isCategoryView &&
    !isInitialLoading &&
    !loadError &&
    displayProducts.length === 0 &&
    sponsoredDisplayProducts.length === 0
  ) {
    return null;
  }

  const newClass = twMerge("", className);
  const shouldShowLoadMore =
    (isCategoryView || isFeatured) && hasMore && !isLoadingMore;
  const totalProducts =
    displayProducts.length + sponsoredDisplayProducts.length;

  return (
    <section className={newClass}>
      {/* Header */}
      {!isCategoryView && (
        <div className="flex items-center justify-between px-4 md:px-0">
          <Title text={title} className="text-white text-lg md:text-2xl" />
          {path && showViewAll && (
            <Link
              to={path}
              className="text-sm md:text-base text-white hover:text-Red transition-colors"
            >
              View all
            </Link>
          )}
        </div>
      )}

      <div className="mt-4 md:mt-8">
        {/* Loading state */}
        {isInitialLoading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="md" />
          </div>
        ) : loadError || error ? (
          <div className="text-Red text-center py-8">
            {loadError ||
              error ||
              "Failed to load products. Please try again later."}
          </div>
        ) : totalProducts === 0 ? (
          <div className="text-gray-400 text-center py-8">
            No products found{category ? ` in ${category}` : ""}.
          </div>
        ) : (
          <>
            {/* Sponsored products section for category view */}
            {(isCategoryView || isUserProducts) &&
              sponsoredDisplayProducts.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="text-Green text-sm bg-Green/10 px-2 py-1 rounded border border-Green/20">
                      Sponsored
                    </span>
                    {!isUserProducts && `Featured in ${category}`}
                  </h3>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 md:gap-5">
                    {sponsoredDisplayProducts.map((product) => {
                      const isNew = (() => {
                        const createdDate = new Date(product.createdAt);
                        const now = new Date();
                        const diffInMs = now.getTime() - createdDate.getTime();
                        const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
                        return diffInDays < 7;
                      })();

                      return (
                        <ProductCard
                          key={`sponsored-${product._id}`}
                          product={product}
                          isNew={isNew}
                        />
                      );
                    })}
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-700 my-8"></div>
                  <h3 className="text-white text-lg font-semibold mb-4">
                    All {category !== "All" && category} Products
                  </h3>
                </div>
              )}

            {/* Main products grid */}
            <div className="grid grid-cols-1 xxs:grid-cols-2 gap-4 lg:grid-cols-4">
              {displayProducts.map((product, index) => {
                const isNew = (() => {
                  const createdDate = new Date(product.createdAt);
                  const now = new Date();
                  const diffInMs = now.getTime() - createdDate.getTime();
                  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
                  return diffInDays < 7;
                })();

                return (
                  <ProductCard
                    key={`${product._id}-${index}`}
                    product={product}
                    isNew={isNew}
                  />
                );
              })}
            </div>

            {/* Loading more indicator */}
            {isLoadingMore && (
              <div className="flex justify-center items-center py-8">
                <LoadingSpinner size="sm" />
                <span className="ml-2 text-gray-400">
                  Loading more products...
                </span>
              </div>
            )}

            {shouldShowLoadMore && (
              <div
                ref={targetRef}
                className="h-10 flex items-center justify-center"
              >
                <div className="w-1 h-1 bg-transparent"></div>
              </div>
            )}

            {/* End of results indicator */}
            {/* {!hasMore &&
              totalProducts > 0 &&
              (isCategoryView || isFeatured) && (
                <div className="text-center py-8 text-gray-400">
                  <div className="inline-flex items-center gap-2">
                    <div className="h-px bg-gray-600 w-8"></div>
                    <span className="text-sm">You've seen all products</span>
                    <div className="h-px bg-gray-600 w-8"></div>
                  </div>
                </div>
              )} */}
          </>
        )}
      </div>
    </section>
  );
};

export default ProductList;
