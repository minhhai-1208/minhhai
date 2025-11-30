import api from "../config/axios";

const API = "customers";

// 📌 Lấy danh sách khách hàng
export const fetchCustomers = async () => {
  return await api.get(API);
};

// 📌 Thêm khách hàng mới
export const postCustomer = async (customer) => {
  return await api.post(API, customer);
};

// 📌 Cập nhật khách hàng (dựa vào customer.id)
export const putCustomer = async (customer) => {
  return await api.put(`${API}/${customer.id}`, customer);
};

// 📌 Xóa khách hàng theo id
export const removeCustomer = async (id) => {
  return await api.delete(`${API}/${id}`);
};

// 📌 Lấy chi tiết khách hàng theo id
export const getCustomerById = async (id) => {
  return await api.get(`${API}/${id}`);
};
