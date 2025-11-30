// config/axios.js
import axios from "axios";

// Tạo instance axios
const api = axios.create({
  baseURL: "/api", // dùng /api, Vite sẽ proxy tới backend
  headers: { "Content-Type": "application/json" },
  timeout: 10000, // 10 giây timeout
});

// --- Tự động thêm token từ localStorage ---
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- Xử lý response ---
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      console.error("Network or CORS error", error);
      return Promise.reject(new Error("Network or CORS error"));
    }
    if (error.response.status === 401) {
      console.error("Unauthorized - token invalid");
    }
    if (error.response.status === 500) {
      console.error("Internal Server Error");
    }
    return Promise.reject(error);
  }
);

export default api;

