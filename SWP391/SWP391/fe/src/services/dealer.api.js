// dealer.api.js
import api from "../config/axios";

const API = "/dealers";

// 📌 Lấy danh sách tất cả đại lý
export const fetchDealers = async () => {
  return await api.get(API);
};

// 📌 Lấy chi tiết đại lý theo id
export const getDealerById = async (id) => {
  return await api.get(`${API}/${id}`);
};

// 📌 Thêm đại lý mới
export const postDealer = async (dealer) => {
  return await api.post(API, dealer);
};

// 📌 Cập nhật đại lý theo id
export const putDealer = async (dealer) => {
  return await api.put(`${API}/${dealer.id}`, dealer);
};

// 📌 Xóa đại lý theo id
export const removeDealer = async (id) => {
  return await api.delete(`${API}/${id}`);
};
