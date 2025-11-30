import api from "../config/axios";

const API = "/dealers";

// 📌 Lấy danh sách đại lý
export const fetchDealers = async () => {
  return await api.get(API);
};

// 📌 Thêm đại lý mới
export const postDealer = async (dealer) => {
  return await api.post(API, dealer);
};

// 📌 Cập nhật đại lý (dựa vào dealer.id)
export const putDealer = async (dealer) => {
  return await api.put(`${API}/${dealer.id}`, dealer);
};

// 📌 Xóa đại lý theo id
export const removeDealer = async (id) => {
  return await api.delete(`${API}/${id}`);
};

// 📌 Lấy chi tiết đại lý theo id
export const getDealerById = async (id) => {
  return await api.get(`${API}/${id}`);
};
