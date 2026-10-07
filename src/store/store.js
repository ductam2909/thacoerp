import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slice/authSlice";
import menuReducer from "./slice/menuSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    menu: menuReducer,
  },
});
