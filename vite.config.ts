import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@selfxyz/common/utils/appType": "@selfxyz/core",
    },
  },
  build: {
    rollupOptions: {
      external: [],
      onwarn(warning, warn) {
        // Ignore the specific @selfxyz/qrcode import warning
        if (
          warning.code === "MISSING_EXPORT" &&
          warning.message.includes("@selfxyz/qrcode") &&
          warning.message.includes("SelfApp")
        ) {
          return;
        }
        warn(warning);
      },
    },
  },
  // build: {
  //   minify: false,
  // },
});
