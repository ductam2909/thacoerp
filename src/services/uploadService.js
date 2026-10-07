import apiClient from "./apiClient";
import { ENV } from "../config/env";


export const uploadFile = async (file, url, options = {}) => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await apiClient.post(
      `${ENV.API_URL}${url}`,
      formData,
      {
        headers: {
          // "Content-Type": "multipart/form-data",
        },
        // File lớn có thể mất hơn 10 giây (timeout mặc định của apiClient).
        // timeout = 0 để thời gian upload phụ thuộc vào kết nối/server.
        timeout: options.timeout ?? 0,
        onUploadProgress: options.onUploadProgress,
      },
    );
    return response;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

// Upload multipart riêng cho FileManager.
export const uploadFileMultipart = async (file, url, options = {}) => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await apiClient.post(`${ENV.API_URL}${url}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: options.timeout ?? 0,
      signal: options.signal,
      cancelToken: options.cancelToken,
      onUploadProgress: (event) => {
        const percent = event.total
          ? Math.min(99, Math.round((event.loaded / event.total) * 100))
          : 0;
        options.onUploadProgress?.(percent, event);
      },
    });
    return response;
  } catch (error) {
    console.error("Error uploading multipart file:", error);
    throw error;
  }
};

/**
 * Upload multiple files
 * @param {Array<File|Object>} files - Array of files to upload (can be antd Upload file objects)
 * @returns {Promise<Array<any>>} - Array of responses
 */
export const uploadMultipleFiles = async (files, url, options = {}) => {
  if (!files || files.length === 0) return [];

  const formData = new FormData();
  files.forEach((file) => {
    const fileToUpload = file.originFileObj || file;
    formData.append("files", fileToUpload);
  });

  try {
    const response = await apiClient.post(
      `${ENV.API_URL}${url}`,
      formData,
      {
        timeout: options.timeout ?? 15 * 60 * 1000,
        onUploadProgress: options.onUploadProgress,
      },
    );
    const responseData =
      response?.data?.data || response?.data || response?.Data || response;

    return Array.isArray(responseData) ? responseData : [responseData];
  } catch (error) {
    console.error("Error uploading multiple files:", error);
    throw error;
  }
};
