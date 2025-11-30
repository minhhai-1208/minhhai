import axios from "axios";

const API = "https://68d14842e6c0cbeb39a43ba4.mockapi.io/sales";

// 📌 Lấy danh sách tất cả sales
export const fetchSales = async () => {
  return await axios.get(API);
};

// 📌 Thêm một sale mới
export const postSale = async (sale) => {
  return await axios.post(API, sale);
};

// 📌 Cập nhật sale (dựa vào sale.id)
export const putSale = async (sale) => {
  return await axios.put(`${API}/${sale.id}`, sale);
};

// 📌 Xóa sale theo id
export const removeSale = async (id) => {
  return await axios.delete(`${API}/${id}`);
};

// 📌 Lấy chi tiết một sale theo id
export const getSaleById = async (id) => {
  return await axios.get(`${API}/${id}`);
};
