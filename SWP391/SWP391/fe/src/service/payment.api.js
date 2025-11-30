import api from "../config/axios";

// Khai báo hằng số API
const API = "/payments"; 

// --- GET Requests ---

// 📌 Lấy danh sách tất cả giao dịch thanh toán
// GET /api/payments
export const fetchPayments = async () => {
 return await api.get(API);
};

// 📌 Lấy chi tiết thanh toán theo ID
// GET /api/payments/{id}
export const getPaymentById = async (id) => {
 return await api.get(`${API}/${id}`);
};

// 📌 Lấy các thanh toán theo ID đơn hàng
// GET /api/payments/order/{orderId}
export const getPaymentsByOrderId = async (orderId) => {
 return await api.get(`${API}/order/${orderId}`);
};


// --- PUT Requests ---

// 📌 Cập nhật trạng thái thanh toán
// PUT /api/payments/{id}/status
export const putPaymentStatus = async (id, statusData) => {
// statusData thường là object { status: 'new_status' }
 return await api.put(`${API}/${id}/status`, statusData);
};


// --- POST Requests (VNPay) ---

// 📌 Tạo URL thanh toán đặt cọc qua VNPay
// POST /api/payments/vnpay/deposit
export const postVNPayDeposit = async (orderId) => {
    // POST /api/payments/vnpay/deposit?orderId={orderId}
    return await api.post(
        `${API}/vnpay/deposit`, 
        {}, // Body rỗng để tránh gửi 'null'
        { params: { orderId } } // Truyền orderId dưới dạng Query Parameter
    );
};

// 📌 Tạo URL thanh toán cuối cùng qua VNPay
// POST /api/payments/vnpay/final
export const postVNPayFinal = async (orderId) => {
    // Truyền body là {} và orderId dưới dạng Query Parameter
    return await api.post(
        `${API}/vnpay/final`, 
        {}, // Body rỗng
        { params: { orderId } } 
    );
};