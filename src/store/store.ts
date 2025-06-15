import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slices/userSlice";
import productReducer from "./slices/productSlice";
import reviewReducer from "./slices/reviewSlice";
import referralReducer from "./slices/referralSlice";
import orderReducer from "./slices/orderSlice";
import contractReducer from "./slices/contractSlice";
import watchlistReducer from "./slices/watchlistSlice";
import rewardsReducer from "./slices/rewardsSlice";
import notificationsReducer from "./slices/notificationsSlice";
import chatsReducer from "./slices/chatSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    products: productReducer,
    reviews: reviewReducer,
    referrals: referralReducer,
    orders: orderReducer,
    contract: contractReducer,
    watchlist: watchlistReducer,
    rewards: rewardsReducer,
    notifications: notificationsReducer,
    chat: chatsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // serializableCheck: false,
      serializableCheck: {
        ignoredActions: [
          "products/fetchAll/fulfilled",
          "products/fetchById/fulfilled",
        ],
        ignoredPaths: ["products.currentProduct", "products.products"],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
