import apiClient from "./apiClient";

const createFormData = (obj) => {
  if (obj instanceof FormData) return obj;

  const formData = new FormData();
  Object.keys(obj).forEach((key) => {
    if (Array.isArray(obj[key])) {
      obj[key].forEach((item) => formData.append(key, item));
    } else {
      formData.append(key, obj[key]);
    }
  });
  return formData;
};

export const getRequest = (url, params, config = {}) => {
  return apiClient.get(url, { ...config, params });
};

export const postRequest = (url, data, config = {}) => {
  let requestData = data;
  let headers = { ...config.headers };

  if (config.isMultipart) {
    requestData = createFormData(data);
    headers["Content-Type"] = "multipart/form-data";
  }

  return apiClient.post(url, requestData, { ...config, headers });
};

export const putRequest = (url, data, config = {}) => {
  let requestData = data;
  let headers = { ...config.headers };

  if (config.isMultipart) {
    requestData = createFormData(data);
    headers["Content-Type"] = "multipart/form-data";
  }

  return apiClient.put(url, requestData, { ...config, headers });
};

export const patchRequest = (url, data, config = {}) => {
  let requestData = data;
  let headers = { ...config.headers };

  if (config.isMultipart) {
    requestData = createFormData(data);
    headers["Content-Type"] = "multipart/form-data";
  }

  return apiClient.patch(url, requestData, { ...config, headers });
};

export const deleteRequest = (url, params) => {
  return apiClient.delete(url, { params });
};
