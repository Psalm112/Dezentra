import { RootState } from "../store";
import { Product } from "../../utils/types";

export const selectAllProducts = (state: RootState) => state.products.products;

export const selectCurrentProduct = (state: RootState) =>
  state.products.currentProduct;

export const selectSponsoredProducts = (state: RootState) =>
  state.products.sponsoredProducts;

export const selectProductLoading = (state: RootState) =>
  state.products.loading;

export const selectProductError = (state: RootState) => state.products.error;

export const selectSearchResults = (state: RootState) =>
  state.products.searchResults;

export const selectProductsByCategory = (
  state: RootState,
  category: string
): Product[] => {
  if (!state.products.products) return [];

  if (category === "All") return state.products.products;

  return state.products.products.filter(
    (product) =>
      product.category &&
      product.category.toLowerCase() === category.toLowerCase()
  );
};

export const selectRelatedProducts = (state: RootState): Product[] => {
  if (!state.products.currentProduct || !state.products.products) return [];

  const { category } = state.products.currentProduct;
  const productId = state.products.currentProduct._id;

  return state.products.products
    .filter(
      (product) =>
        product.category &&
        product.category === category &&
        product._id !== productId
    )
    .map((product) => ({
      ...product,
      seller:
        typeof product.seller === "object"
          ? product.seller._id
          : product.seller,
    }));
};
