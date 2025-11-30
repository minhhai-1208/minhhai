import api from "../config/axios";

// Khai báo hằng số API
const API = "/contracts"; 

// --- GET Requests ---

/**
 * Lấy tất cả hợp đồng. (GET /api/contracts)
 */
export const fetchContracts = async () => {
    const response = await api.get(API);
    return response.data; // Trả về data
};

/**
 * Lấy chi tiết hợp đồng theo ID. (GET /api/contracts/{id})
 */
export const getContractById = async (id) => {
    const response = await api.get(`${API}/${id}`);
    return response.data; // Trả về data
};

/**
 * Lấy hợp đồng theo ID đơn hàng. (GET /api/contracts/order/{orderId})
 */
export const getContractByOrderId = async (orderId) => {
    const response = await api.get(`${API}/order/${orderId}`);
    return response.data; // Trả về data
};


// --- POST Requests ---

/**
 * Tạo hợp đồng mới từ đơn hàng. (POST /api/contracts)
 * @param {object} contractData - Dữ liệu tạo hợp đồng.
 */
export const postContract = async (contractData) => {
    const response = await api.post(API, contractData);
    return response.data; // Trả về object hợp đồng đã tạo (chứa ID mới)
};

/**
 * Ký hợp đồng. (POST /api/contracts/sign/{contractId})
 * @param {number} contractId - ID của hợp đồng cần ký.
 */
export const signContract = async (contractId) => {
    // Không cần trả về data nếu API không trả về payload quan trọng,
    // nhưng vẫn giữ định dạng trả về data cho nhất quán.
    const response = await api.post(`${API}/sign/${contractId}`, {});
    return response.data; 
};


// --- PUT Requests ---

/**
 * Chỉnh sửa hợp đồng. (PUT /api/contracts/{id})
 * @param {number} id - ID hợp đồng.
 * @param {object} contractData - Dữ liệu chỉnh sửa.
 */
export const putContract = async (id, contractData) => {
    const response = await api.put(`${API}/${id}`, contractData);
    return response.data; // Trả về data
};


// --- DELETE Requests ---

/**
 * Xóa hợp đồng. (DELETE /api/contracts/{id})
 * @param {number} id - ID của hợp đồng cần xóa.
 */
export const deleteContract = async (id) => {
    const response = await api.delete(`${API}/${id}`);
    return response.data; // Trả về data (hoặc null/message tùy BE)
};