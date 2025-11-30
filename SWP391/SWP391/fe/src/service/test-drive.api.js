import api from "../config/axios";

const API = "test-drives";

// 📌 Lấy danh sách cuộc lái thử
export const fetchTestDrives = async () => {
  return await api.get(API);
};

// 📌 Thêm cuộc lái thử mới
export const postTestDrive = async (testDrive) => {
  return await api.post(API, testDrive);
};

// 📌 Cập nhật cuộc lái thử (dựa vào testDrive.id)
export const putTestDrive = async (testDrive) => {
  return await api.put(`${API}/${testDrive.id}`, testDrive);
};

// 📌 Xóa cuộc lái thử theo id
export const removeTestDrive = async (id) => {
  return await api.delete(`${API}/${id}`);
};

// 📌 Lấy chi tiết cuộc lái thử theo id
export const getTestDriveById = async (id) => {
  return await api.get(`${API}/${id}`);
};