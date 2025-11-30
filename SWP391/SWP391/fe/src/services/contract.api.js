import api from "../config/axios";

const API = "/contracts";

// 📌 Lấy danh sách Hợp đồng
export const fetchContracts = async () => {
    // GET /api/contracts
    return await api.get(API);
};

// 📌 Lấy chi tiết Hợp đồng theo id
export const getContractById = async (id) => {
    // GET /api/contracts/{id}
    return await api.get(`${API}/${id}`);
};

// 📌 Thêm Hợp đồng mới
export const postContract = async (contract) => {
    // POST /api/contracts
    // Payload: { dealerId, customerId, vehicleId, contractDate, totalAmount, ... }
    return await api.post(API, contract);
};

// 📌 Cập nhật Hợp đồng (dựa vào contract.id)
export const putContract = async (contract) => {
    // PUT /api/contracts/{id}
    // Payload: { id, dealerId, customerId, vehicleId, contractDate, totalAmount, ... }
    // Lưu ý: Đảm bảo controller xử lý cả tham số ID từ URL và payload
    return await api.put(`${API}/${contract.id}`, contract);
};

// 📌 Xóa Hợp đồng theo id
export const removeContract = async (id) => {
    // DELETE /api/contracts/{id}
    return await api.delete(`${API}/${id}`);
};

// 📌 Lấy Hợp đồng theo Order ID
export const getContractByOrderId = async (orderId) => {
    // GET /api/contracts/order/{orderId}
    return await api.get(`${API}/order/${orderId}`);
};

// 📌 Ký (Sign) Hợp đồng
export const signContract = async (contractId) => {
    // POST /api/contracts/sign/{contractId}
    return await api.post(`${API}/sign/${contractId}`);
};