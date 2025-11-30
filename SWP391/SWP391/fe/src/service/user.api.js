// src/services/user.api.js
import api from "../config/axios";

// 🔴 Chỉ giữ lại endpoint cho các thao tác chi tiết (CRUD theo ID)
const USER_API = "/users"; 
// 🟢 Endpoint mới cho Danh sách Users (từ authentication-controller)
const LIST_API = "/user";
// 📌 Lấy danh sách tất cả user
const REGISTER_API = "/register";
export const fetchUsers = async () => {
    // 💡 Gọi đến GET /api/user. Backend trả về trực tiếp mảng, không có .data
    return await api.get(LIST_API);
};
// 📌 Lấy chi tiết user theo id
export const getUserById = async (id) => {
  return await api.get(`${USER_API}/${id}`);
};

// 📌 Thêm user mới
export const postUser = async (user) => {
 // Phải gọi đến POST /api/register
return await api.post(REGISTER_API, user); 
};
// 📌 Cập nhật user (dựa vào user.id)
export const putUser = async (user) => {
  return await api.put(`${USER_API}/${user.id}`, user);
};

// 📌 Xóa user theo id
export const removeUser = async (id) => {
  return await api.delete(`${USER_API}/${id}`);
};
