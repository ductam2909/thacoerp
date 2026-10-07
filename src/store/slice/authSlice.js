import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authService } from "../../services/authService";
import {
  setStorage,
  removeStorage,
  getStorage,
  clearStorage,
} from "../../utils/storage";
import { jwtDecode } from "jwt-decode";

export const loginAsync = createAsyncThunk(
  "auth/login",
  async (data, { rejectWithValue }) => {
    try {
      const response = await authService.login(data);
      const envelope = response?.data || response;
      const payload = envelope?.data || envelope;

      if (envelope?.success === false) {
        throw new Error(envelope?.message || "Login failed");
      }

      const tokenString =
        payload?.token ||
        payload?.access_token ||
        (typeof payload === "string" ? payload : null);

      if (!tokenString || typeof tokenString !== "string") {
        throw new Error("Định dạng Token trả về không hợp lệ");
      }

      // Lưu Token để dùng cho các API khác
      setStorage("accessToken", tokenString);

      // Lưu thông tin user từ API response (nếu là object)
      let userInfo = typeof payload === "object" ? { ...payload } : {};
      delete userInfo.token;
      delete userInfo.access_token;

      // Nếu API không trả về userInfo mà chỉ trả về token, fallback về decode token
      if (Object.keys(userInfo).length === 0) {
        userInfo = jwtDecode(tokenString);
      }

      setStorage("userInfo", JSON.stringify(userInfo));

      return {
        accessToken: tokenString,
        user: userInfo,
        permissions: userInfo.lst_RoleNames || userInfo.permissions || [],
      };
    } catch (error) {
      console.error("Login API Error:", error);
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.message ||
          "Đăng nhập thất bại",
      );
    }
  },
);

const tokenFromStorage = getStorage("accessToken");
const userInfoStr = getStorage("userInfo");
let initialUser = null;
let initialPermissions = [];
let initialIsAuthenticated = false;

if (tokenFromStorage) {
  try {
    if (userInfoStr) {
      initialUser = JSON.parse(userInfoStr);
      initialPermissions =
        initialUser.lst_RoleNames || initialUser.permissions || [];
    } else {
      const decoded = jwtDecode(tokenFromStorage);
      initialUser = decoded;
      initialPermissions = decoded.lst_RoleNames || decoded.permissions || [];
    }
    initialIsAuthenticated = true;
  } catch (error) {
    console.error("Invalid token or user info on init:", error);
    removeStorage("accessToken");
    removeStorage("userInfo");
  }
}

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: initialUser,
    token: initialIsAuthenticated ? tokenFromStorage : null,
    isAuthenticated: initialIsAuthenticated,
    permissions: initialPermissions,
    loading: false,
    error: null,
  },
  reducers: {
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      setStorage("userInfo", JSON.stringify(state.user));
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.permissions = [];
      state.isAuthenticated = false;
      clearStorage();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(loginAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.permissions = action.payload.permissions;
        state.isAuthenticated = true;
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, updateUser } = authSlice.actions;
export default authSlice.reducer;
