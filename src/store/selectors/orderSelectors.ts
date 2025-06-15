import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { Order } from "../../utils/types";

export const selectAllOrders = (state: RootState) => state.orders.orders;
export const selectSellerOrders = (state: RootState) =>
  state.orders.sellerOrders;
export const selectCurrentOrder = (state: RootState) =>
  state.orders.currentOrder;
export const selectOrderLoading = (state: RootState) =>
  state.orders.loading === "pending";
export const selectOrderError = (state: RootState) => state.orders.error;

export const selectOrdersByStatus = createSelector(
  //   [selectAllOrders, (state: RootState, status: string) => status],
  [selectAllOrders, (state: RootState, status: string) => status],
  (orders, status) => {
    return orders.filter((order: Order) => order.status === status);
  }
);
