import axiosClient from "../utils/axios";
import { API_ENDPOINTS } from "../constants/apiEndpoints";

export const authService = {
  login: async (data) => {
    const payload = {
      username: data.username,
      password: data.password,
      domain: data.domain || "",
    };

    const response = await axiosClient.post(API_ENDPOINTS.AUTH.LOGIN, payload);

    return response;
  },

  logout: async () => {
    const response = await axiosClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    return response;
  },

  changePassword: async (data) => {
    return axiosClient.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, data);
  },
};
