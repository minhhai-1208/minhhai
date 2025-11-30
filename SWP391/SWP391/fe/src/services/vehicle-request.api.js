import api from "../config/axios";

// Base API Path cho Vehicle Request Controller
const API = "/vehicle-requests"; 

// Lấy danh sách yêu cầu đang chờ xử lý
export const fetchPendingVehicleRequests = async () => {
return await api.get(`${API}/pending`);
};

// Chấp thuận một yêu cầu
// Sửa: Truyền approvedQuantity qua Query Parameter
export const approveVehicleRequest = async (requestId, approvedQuantity) => {
    // Axios cho phép truyền Query Parameters qua object 'params'
    return await api.put(`${API}/${requestId}/approve`, null, { 
        params: { approvedQuantity } // Gửi approvedQuantity qua URL
    });
};

// Từ chối một yêu cầu
// Sửa: Truyền reason qua Query Parameter
export const rejectVehicleRequest = async (requestId, reason) => {
    // Axios cho phép truyền Query Parameters qua object 'params'
    return await api.put(`${API}/${requestId}/reject`, null, { 
        params: { reason } // Gửi reason qua URL
    });
};