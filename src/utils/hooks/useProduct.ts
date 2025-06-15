import { useCallback, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "./redux";
import {
  fetchAllProducts,
  fetchProductById,
  fetchSponsoredProducts,
  searchProducts,
  clearCurrentProduct,
  clearSearchResults,
} from "../../store/slices/productSlice";
import {
  selectAllProducts,
  selectCurrentProduct,
  selectSponsoredProducts,
  selectProductLoading,
  selectProductError,
  selectSearchResults,
  // selectProductsByCategory,
  selectRelatedProducts,
  // selectFormattedProduct,
} from "../../store/selectors/productSelectors";
import { useSnackbar } from "../../context/SnackbarContext";
import { useEffect } from "react";
import { api } from "../services/apiService";
import { useCurrencyConverter } from "./useCurrencyConverter";
import { Product } from "../types";
import { useCurrency } from "../../context/CurrencyContext";
import { useAuth } from "../../context/AuthContext";

export const useProductData = () => {
  const { user } = useAuth();
  const { secondaryCurrency } = useCurrency();
  const dispatch = useAppDispatch();
  const { showSnackbar } = useSnackbar();
  const {
    loading: exchangeRatesLoading,
    convertPrice,
    formatPrice,
  } = useCurrencyConverter();

  const products = useAppSelector(selectAllProducts);
  const product = useAppSelector(selectCurrentProduct);
  // const rawFormattedProduct = useAppSelector(selectFormattedProduct);
  const sponsoredProducts = useAppSelector(selectSponsoredProducts);
  const loading = useAppSelector(selectProductLoading) === "pending";
  const error = useAppSelector(selectProductError);
  const searchResults = useAppSelector(selectSearchResults);
  const relatedProducts = useAppSelector(selectRelatedProducts);

  const formatProductWithCurrencies = useCallback(
    (product: Product) => {
      if (!product) return null;

      const celoPrice = convertPrice(product.price, "USDT", "CELO");
      const fiatPrice = convertPrice(product.price, "USDT", "FIAT");

      return {
        ...product,
        celoPrice,
        fiatPrice,
        formattedUsdtPrice: formatPrice(product.price, "USDT"),
        formattedCeloPrice: formatPrice(celoPrice, "CELO"),
        formattedFiatPrice: formatPrice(fiatPrice, "FIAT"),
      };
    },
    [convertPrice, formatPrice]
  );
  const shouldExcludeSeller = useCallback(
    (productSeller: string | { _id: string; name: string }) => {
      if (!user) return false;

      if (typeof productSeller === "object" && productSeller) {
        return (
          productSeller._id === user._id || productSeller.name === user.name
        );
      }

      return productSeller === user._id;
    },
    [user]
  );
  const formattedProduct = useMemo(() => {
    if (!product) return null;
    return formatProductWithCurrencies(product);
  }, [product, formatProductWithCurrencies]);

  const formattedProducts = useMemo(() => {
    return products
      .map(formatProductWithCurrencies)
      .filter((product): product is NonNullable<typeof product> => {
        if (!product) return false;
        return !shouldExcludeSeller(product.seller);
      });
  }, [products, formatProductWithCurrencies, shouldExcludeSeller]);

  const formattedRelatedProducts = useMemo(() => {
    return relatedProducts
      .map(formatProductWithCurrencies)
      .filter((product): product is NonNullable<typeof product> => {
        if (!product) return false;
        return !shouldExcludeSeller(product.seller);
      });
  }, [relatedProducts, formatProductWithCurrencies, shouldExcludeSeller]);

  const formattedSponsoredProducts = useMemo(() => {
    return sponsoredProducts
      .map(formatProductWithCurrencies)
      .filter((product): product is NonNullable<typeof product> => {
        if (!product) return false;
        return !shouldExcludeSeller(product.seller);
      });
  }, [sponsoredProducts, formatProductWithCurrencies, shouldExcludeSeller]);

  const formattedSearchResults = useMemo(() => {
    return searchResults
      .map(formatProductWithCurrencies)
      .filter((product): product is NonNullable<typeof product> => {
        if (!product) return false;
        return !shouldExcludeSeller(product.seller);
      });
  }, [searchResults, formatProductWithCurrencies, shouldExcludeSeller]);

  const formattedProductsByUser = useMemo(() => {
    return products
      .map(formatProductWithCurrencies)
      .filter((product): product is NonNullable<typeof product> => {
        if (!product || !user) return false;

        if (typeof product.seller === "object" && product.seller) {
          return (
            product.seller._id === user._id || product.seller.name === user.name
          );
        }

        return product.seller === user._id;
      });
  }, [products, formatProductWithCurrencies, user]);
  const fetchAllProductsAsync = useCallback(
    async (
      showNotification = false,
      forceRefresh = false,
      preventAbort = false
    ) => {
      try {
        const result = await dispatch(
          fetchAllProducts({ forceRefresh, preventAbort })
        ).unwrap();
        if (!result.ok) {
          throw new Error(result.error || "Failed to load products");
        }

        await dispatch(
          fetchAllProducts.fulfilled(result.data, "", { forceRefresh })
        );

        if (showNotification) {
          showSnackbar("Products loaded successfully", "success");
        }
        return true;
      } catch (err: any) {
        if (err.name === "AbortError") {
          return false;
        }

        if (showNotification) {
          showSnackbar(
            (err as Error).message || "Failed to load products",
            "error"
          );
        }
        return false;
      }
    },
    [dispatch, showSnackbar]
  );

  const fetchSponsoredProductsAsync = useCallback(
    async (
      showNotification = false,
      forceRefresh = false,
      preventAbort = false
    ) => {
      try {
        const result = await dispatch(
          fetchSponsoredProducts({ forceRefresh, preventAbort })
        ).unwrap();
        if (!result.ok) {
          throw new Error(result.error || "Failed to load sponsored products");
        }

        await dispatch(
          fetchSponsoredProducts.fulfilled(result.data, "", { forceRefresh })
        );

        if (showNotification) {
          showSnackbar("Featured products loaded successfully", "success");
        }
        return result.data;
      } catch (err: any) {
        if (err.name === "AbortError") {
          return [];
        }

        if (showNotification) {
          showSnackbar(
            (err as Error).message || "Failed to load featured products",
            "error"
          );
        }
        return [];
      }
    },
    [dispatch, showSnackbar]
  );

  const fetchProductByIdAsync = useCallback(
    async (id: string, showNotification = false) => {
      try {
        const result = await dispatch(fetchProductById(id)).unwrap();
        if (showNotification) {
          showSnackbar("Product loaded successfully", "success");
        }
        return result;
      } catch (err) {
        if (showNotification) {
          showSnackbar((err as string) || "Failed to load product", "error");
        }
        return null;
      }
    },
    [dispatch, showSnackbar]
  );

  const searchProductsAsync = useCallback(
    async (query: string, showNotification = false) => {
      if (!query.trim()) {
        dispatch(clearSearchResults());
        return [];
      }
      try {
        const result = await dispatch(searchProducts(query)).unwrap();
        if (showNotification) {
          showSnackbar("Search completed successfully", "success");
        }
        return result.results;
      } catch (err) {
        if (showNotification) {
          showSnackbar((err as string) || "Failed to search products", "error");
        }
        return [];
      }
    },
    [dispatch, showSnackbar]
  );

  const createProductAsync = useCallback(
    async (productData: FormData, showNotification = true) => {
      try {
        const response = await api.createProduct(productData);
        if (!response.ok) {
          if (showNotification) {
            showSnackbar(response.error || "Failed to create product", "error");
          }
          return null;
        }
        // Refresh products list after successful creation
        await dispatch(fetchAllProducts({ forceRefresh: true })).unwrap();
        if (showNotification) {
          showSnackbar("Product created successfully", "success");
        }
        return response.data;
      } catch (err) {
        if (showNotification) {
          showSnackbar((err as string) || "Failed to create product", "error");
        }
        return null;
      }
    },
    [dispatch, showSnackbar]
  );

  const updateProductAsync = useCallback(
    async (
      productId: string,
      productData: FormData,
      showNotification = true
    ) => {
      try {
        const response = await api.updateProduct(productId, productData);
        if (!response.ok) {
          if (showNotification) {
            showSnackbar(response.error || "Failed to update product", "error");
          }
          return null;
        }
        // Refresh product details and list after successful update
        await dispatch(fetchProductById(productId)).unwrap();
        await dispatch(fetchAllProducts({ forceRefresh: true })).unwrap();
        if (showNotification) {
          showSnackbar("Product updated successfully", "success");
        }
        return response.data;
      } catch (err) {
        if (showNotification) {
          showSnackbar((err as string) || "Failed to update product", "error");
        }
        return null;
      }
    },
    [dispatch, showSnackbar]
  );

  const deleteProductAsync = useCallback(
    async (productId: string, showNotification = true) => {
      try {
        const response = await api.deleteProduct(productId);
        if (!response.ok) {
          if (showNotification) {
            showSnackbar(response.error || "Failed to delete product", "error");
          }
          return false;
        }
        // Refresh products list after successful deletion
        await dispatch(fetchAllProducts({ forceRefresh: true })).unwrap();
        if (showNotification) {
          showSnackbar("Product deleted successfully", "success");
        }
        return true;
      } catch (err) {
        if (showNotification) {
          showSnackbar((err as string) || "Failed to delete product", "error");
        }
        return false;
      }
    },
    [dispatch, showSnackbar]
  );

  const getProductsByCategory = useCallback(
    (category: string) => {
      let filteredProducts;

      if (category === "All") {
        filteredProducts = products || [];
      } else {
        filteredProducts = products.filter(
          (product) =>
            product.category &&
            product.category.toLowerCase() === category.toLowerCase()
        );
      }

      return filteredProducts
        .map(formatProductWithCurrencies)
        .filter((product): product is NonNullable<typeof product> => {
          if (!product) return false;
          return !shouldExcludeSeller(product.seller);
        });
    },
    [products, formatProductWithCurrencies, shouldExcludeSeller]
  );

  const clearProduct = useCallback(() => {
    dispatch(clearCurrentProduct());
  }, [dispatch]);

  // Clean up on unmount
  useEffect(() => {
    return () => {};
  }, []);

  return {
    products: formattedProducts,
    product,
    formattedProduct,
    sponsoredProducts: formattedSponsoredProducts,
    searchResults: formattedSearchResults,
    relatedProducts: formattedRelatedProducts,
    productsByUser: formattedProductsByUser,
    loading: loading,
    error,
    fetchAllProducts: fetchAllProductsAsync,
    fetchProductById: fetchProductByIdAsync,
    fetchSponsoredProducts: fetchSponsoredProductsAsync,
    searchProducts: searchProductsAsync,
    createProduct: createProductAsync,
    updateProduct: updateProductAsync,
    deleteProduct: deleteProductAsync,
    getProductsByCategory,
    clearProduct,
    secondaryCurrency,
  };
};
