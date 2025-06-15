import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import Container from "../components/common/Container";
import { IoChevronBackOutline, IoSearch } from "react-icons/io5";
import ProductList from "../components/product/ProductList";
import { useProductData } from "../utils/hooks/useProduct";
import { debounce } from "../utils/helpers";
import ProductCard from "../components/product/ProductCard";

const categories = [
  "Electronics",
  "Clothing",
  "Home & Garden",
  "Beauty & Personal Care",
  "Sports & Outdoors",
  "Art Work",
  "Accessories",
];

const Product = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const params = useParams();
  const categoryParam = params.categoryName;

  const {
    searchProducts,
    searchResults,
    loading,
    fetchAllProducts,
    fetchSponsoredProducts,
  } = useProductData();

  const [isSearching, setIsSearching] = useState(false);
  const [activeCategory, setActiveCategory] = useState(categoryParam || "All");

  // search
  const debouncedSearch = useMemo(
    () =>
      debounce(async (query: string) => {
        if (query.trim()) {
          setIsSearching(true);
          try {
            await searchProducts(query);
          } finally {
            setIsSearching(false);
          }
        }
      }, 300),
    [searchProducts]
  );

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchAllProducts(false, false, true),
        fetchSponsoredProducts(false, false, true),
      ]);
    };
    loadData();
  }, [fetchAllProducts, fetchSponsoredProducts]);

  // Update active category based on URL
  useEffect(() => {
    if (categoryParam) {
      const formattedCategory =
        categoryParam.charAt(0).toUpperCase() + categoryParam.slice(1);
      setActiveCategory(formattedCategory);
    } else {
      setActiveCategory("All");
    }
  }, [categoryParam, location]);

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      setSearchQuery(query);
      debouncedSearch(query);
    },
    [debouncedSearch]
  );

  const handleGoBack = useCallback(() => {
    window.history.back();
  }, []);

  const searchResultsWithNew = useMemo(() => {
    return searchResults
      .map((product) => {
        if (!product) return null;

        const isNew = (() => {
          const createdDate = new Date(product.createdAt);
          const now = new Date();
          const diffInMs = now.getTime() - createdDate.getTime();
          const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
          return diffInDays < 7;
        })();

        return { product, isNew };
      })
      .filter((item) => item !== null);
  }, [searchResults]);

  const isAllCategory = activeCategory === "All";

  return (
    <div className="bg-Dark min-h-screen">
      <Container>
        {isAllCategory ? (
          <>
            <h2 className="text-white font-bold text-2xl mb-6">
              Browse Products
            </h2>

            {/* Search Bar */}
            <div className="flex justify-center items-center gap-3 bg-[#292B30] outline-none border-0 rounded-lg px-4 py-3">
              <IoSearch className="text-white text-xl" />
              <input
                type="text"
                placeholder="Search DezenMart"
                className="w-full rounded-none bg-[#292B30] outline-none text-white placeholder-gray-400"
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>

            {/* Search Results */}
            {searchQuery && (
              <div className="mt-8">
                <div className="text-white text-xl mb-4">
                  {isSearching
                    ? "Searching..."
                    : `Search results for "${searchQuery}"`}
                </div>
                {!isSearching && searchResultsWithNew.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 md:gap-5">
                    {searchResultsWithNew.map(({ product, isNew }, index) => (
                      <ProductCard
                        key={`search-${product._id}-${index}`}
                        product={product}
                        isNew={isNew}
                      />
                    ))}
                  </div>
                ) : (
                  !isSearching && (
                    <div className="text-gray-400 text-center py-4">
                      No products found matching "{searchQuery}"
                    </div>
                  )
                )}
              </div>
            )}

            {/* Categories */}
            <div className="mt-8 overflow-x-auto scrollbar-hide">
              <div className="flex space-x-4 py-2 min-w-max scrollbar-hide ">
                <Link
                  to="/product"
                  className={`px-4 py-2 rounded-full transition-colors whitespace-nowrap ${
                    activeCategory === "All"
                      ? "bg-Red text-white"
                      : "bg-[#292B30] text-[#AEAEB2] hover:bg-[#343539]"
                  }`}
                >
                  All
                </Link>
                {categories.map((category) => (
                  <Link
                    to={`/product/category/${category.toLowerCase()}`}
                    key={`${category}-productbutton`}
                    className={`px-4 py-2 rounded-full transition-colors whitespace-nowrap ${
                      activeCategory === category
                        ? "bg-Red text-white"
                        : "bg-[#292B30] text-[#AEAEB2] hover:bg-[#343539]"
                    }`}
                  >
                    {category}
                  </Link>
                ))}
              </div>
            </div>

            {/* All Products */}
            {!searchQuery && (
              <>
                <ProductList
                  title="Featured Products"
                  className="mt-8"
                  isCategoryView={false}
                  isFeatured={true}
                  showViewAll={false}
                />
                <ProductList
                  title="All Products"
                  className="mt-8"
                  isCategoryView={true}
                  category="All"
                  showViewAll={false}
                />
              </>
            )}
          </>
        ) : (
          <>
            {/* Category Header */}
            <div className="relative mt-8">
              <button
                className="absolute top-1/2 left-0 -translate-y-1/2 text-white p-1.5 rounded-full hover:bg-[#292B30] transition-colors"
                onClick={handleGoBack}
                aria-label="Go back"
              >
                <IoChevronBackOutline className="h-6 w-6 align-middle" />
              </button>

              <h2 className="text-white font-bold text-[34px] px-4 md:px-0 mx-auto align-middle text-center">
                {activeCategory}
              </h2>
            </div>

            <ProductList
              title={activeCategory}
              className="mt-8"
              isCategoryView={true}
              category={activeCategory}
              showViewAll={false}
            />
          </>
        )}
      </Container>
    </div>
  );
};

export default Product;
