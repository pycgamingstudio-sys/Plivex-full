import axios from "axios";

export const createAxiosClient = (options = {}) => {
  const instance = axios.create({
    baseURL: options.baseURL || import.meta.env.VITE_API_BASE_URL || "",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    timeout: options.timeout || 15000,
  });

  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  instance.interceptors.response.use(
    (response) => response.data,
    (error) => Promise.reject(error)
  );

  return instance;
};

const axiosClient = createAxiosClient();
export default axiosClient;

