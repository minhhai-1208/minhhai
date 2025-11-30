-- =============================================
-- EV Dealer Management System Database Script - OPTIMIZED VERSION
-- SQL Server Implementation
-- =============================================

USE master;
GO

-- Create Database
IF EXISTS (SELECT name FROM sys.databases WHERE name = 'EV_Dealer_Management_V2')
BEGIN
    DROP DATABASE EV_Dealer_Management_V2;
END
GO

CREATE DATABASE EV_Dealer_Management_V2;
GO

USE EV_Dealer_Management_V2;
GO

-- =============================================
-- CREATE TABLES
-- =============================================

-- 1. Dealers Table (unchanged)
CREATE TABLE Dealers (
    dealer_id INT IDENTITY(1,1) PRIMARY KEY,
    dealer_code NVARCHAR(20) NOT NULL UNIQUE,
    dealer_name NVARCHAR(200) NOT NULL,
    address NVARCHAR(500) NOT NULL,
    city NVARCHAR(100) NOT NULL,
    region NVARCHAR(100) NOT NULL,
    contact_person NVARCHAR(100) NOT NULL,
    phone NVARCHAR(20) NOT NULL,
    email NVARCHAR(100) NOT NULL,
    contract_date DATE NOT NULL,
    sales_target DECIMAL(15,2) NOT NULL DEFAULT 0,
    debt_limit DECIMAL(15,2) NOT NULL DEFAULT 0,
    current_debt DECIMAL(15,2) NOT NULL DEFAULT 0,
    status NVARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
);

-- 2. Users Table (unchanged)
CREATE TABLE Users (
    user_id INT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(50) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    email NVARCHAR(100) NOT NULL UNIQUE,
    full_name NVARCHAR(100) NOT NULL,
    phone NVARCHAR(20) NOT NULL,
    role NVARCHAR(30) NOT NULL CHECK (role IN ('dealer_staff', 'dealer_manager', 'evm_staff', 'admin')),
    dealer_id INT NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (dealer_id) REFERENCES Dealers(dealer_id)
);

-- 3. Vehicle_Models Table (removed price_adjustment logic)
CREATE TABLE Vehicle_Models (
    model_id INT IDENTITY(1,1) PRIMARY KEY,
    model_code NVARCHAR(20) NOT NULL UNIQUE,
    model_name NVARCHAR(100) NOT NULL,
    category NVARCHAR(50) NOT NULL,
    battery_capacity DECIMAL(5,2) NOT NULL,
    range_km INT NOT NULL,
    charging_time DECIMAL(4,2) NOT NULL,
    motor_power DECIMAL(6,2) NOT NULL,
    seats INT NOT NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'discontinued')),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
);

-- 4. Vehicle_Versions Table (removed price_adjustment)
CREATE TABLE Vehicle_Versions (
    version_id INT IDENTITY(1,1) PRIMARY KEY,
    model_id INT NOT NULL,
    version_name NVARCHAR(100) NOT NULL,
    version_code NVARCHAR(20) NOT NULL,
    features_description NVARCHAR(1000),
    status NVARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (model_id) REFERENCES Vehicle_Models(model_id)
);

-- 5. Vehicle_Colors Table (removed price_adjustment)
CREATE TABLE Vehicle_Colors (
    color_id INT IDENTITY(1,1) PRIMARY KEY,
    color_name NVARCHAR(50) NOT NULL,
    color_code NVARCHAR(20) NOT NULL UNIQUE,
    hex_color NVARCHAR(7) NOT NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive'))
);

-- 6. NEW: Vehicle_Detail Table (unique combination with fixed price)
CREATE TABLE Vehicle_Detail (
    vehicle_detail_id INT IDENTITY(1,1) PRIMARY KEY,
    model_id INT NOT NULL,
    version_id INT NOT NULL,
    color_id INT NOT NULL,
    detail_code NVARCHAR(50) NOT NULL UNIQUE, -- Mã định danh duy nhất cho combo này
    final_price DECIMAL(15,2) NOT NULL, -- Giá cố định cho combo này
    status NVARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (model_id) REFERENCES Vehicle_Models(model_id),
    FOREIGN KEY (version_id) REFERENCES Vehicle_Versions(version_id),
    FOREIGN KEY (color_id) REFERENCES Vehicle_Colors(color_id),
    -- Đảm bảo không có combo trùng lặp
    UNIQUE (model_id, version_id, color_id)
);

-- 7. Vehicle_Inventory Table (updated to reference Vehicle_Detail)
CREATE TABLE Vehicle_Inventory (
    inventory_id INT IDENTITY(1,1) PRIMARY KEY,
    vehicle_detail_id INT NOT NULL, -- Thay vì 3 FK riêng biệt
    dealer_id INT NULL,
    vin_number NVARCHAR(50) NOT NULL UNIQUE,
    chassis_number NVARCHAR(50) NOT NULL,
    engine_number NVARCHAR(50) NOT NULL,
    manufacturing_date DATE NOT NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'in_stock' CHECK (status IN ('in_stock', 'sold', 'reserved', 'in_transit')),
    wholesale_price DECIMAL(15,2) NOT NULL,
    retail_price DECIMAL(15,2) NOT NULL, -- Có thể khác với Vehicle_Detail.final_price (để dealer điều chỉnh)
    received_date DATE,
    sold_date DATE,
    FOREIGN KEY (vehicle_detail_id) REFERENCES Vehicle_Detail(vehicle_detail_id),
    FOREIGN KEY (dealer_id) REFERENCES Dealers(dealer_id)
);

-- 8. Customers Table (unchanged)
CREATE TABLE Customers (
    customer_id INT IDENTITY(1,1) PRIMARY KEY,
    customer_code NVARCHAR(20) NOT NULL UNIQUE,
    full_name NVARCHAR(100) NOT NULL,
    id_number NVARCHAR(20) NOT NULL UNIQUE,
    phone NVARCHAR(20) NOT NULL,
    email NVARCHAR(100),
    address NVARCHAR(500) NOT NULL,
    city NVARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    occupation NVARCHAR(100),
    income_level NVARCHAR(50),
    dealer_id INT NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (dealer_id) REFERENCES Dealers(dealer_id)
);

-- 9. Promotions Table (unchanged)
CREATE TABLE Promotions (
    promotion_id INT IDENTITY(1,1) PRIMARY KEY,
    promotion_name NVARCHAR(200) NOT NULL,
    promotion_code NVARCHAR(50) NOT NULL UNIQUE,
    description NVARCHAR(1000),
    discount_type NVARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
    discount_value DECIMAL(15,2) NOT NULL,
    min_order_value DECIMAL(15,2) NOT NULL DEFAULT 0,
    applicable_models NVARCHAR(MAX), -- JSON format
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    dealer_id INT NULL,
    max_usage INT NOT NULL DEFAULT 0,
    current_usage INT NOT NULL DEFAULT 0,
    status NVARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (dealer_id) REFERENCES Dealers(dealer_id)
);

-- 10. MODIFIED: Orders Table (gộp Quotations vào, thêm nhiều trạng thái)
CREATE TABLE Orders (
    order_id INT IDENTITY(1,1) PRIMARY KEY,
    order_number NVARCHAR(50) NOT NULL UNIQUE,
    customer_id INT NOT NULL,
    dealer_id INT NOT NULL,
    staff_id INT NOT NULL,
    vehicle_detail_id INT NOT NULL, -- Reference đến Vehicle_Detail thay vì 3 FK riêng
    inventory_id INT NULL, -- NULL khi chưa có xe cụ thể được chỉ định
    
    -- Quotation related fields
    quotation_date DATE NOT NULL DEFAULT GETDATE(), -- Ngày tạo báo giá
    base_price DECIMAL(15,2) NOT NULL, -- Giá từ Vehicle_Detail
    discount_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    promotion_id INT NULL,
    quotation_valid_until DATE NOT NULL,
    
    -- Order related fields
    order_date DATE NULL, -- Ngày khách đồng ý đặt cọc
    delivery_date DATE NULL,
    total_amount DECIMAL(15,2) NOT NULL, -- base_price - discount_amount
    deposit_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    remaining_amount DECIMAL(15,2) NOT NULL,
    payment_method NVARCHAR(20) CHECK (payment_method IN ('cash', 'installment')),
    
    -- Combined status covering both quotation and order phases
    status NVARCHAR(30) NOT NULL DEFAULT 'draft_quotation' CHECK (status IN (
        'draft_quotation',      -- Báo giá đang soạn thảo
        'sent_quotation',       -- Báo giá đã gửi khách hàng
        'quotation_expired',    -- Báo giá hết hạn
        'quotation_cancelled',  -- Báo giá bị hủy
        'deposited',           -- Khách hàng đã đặt cọc (order được tạo)
        'pending_allocation',   -- Chờ phân bổ xe cụ thể
        'confirmed',           -- Đã có xe, chờ giao
        'ready_for_contract',  -- Sẵn sàng làm hợp đồng
        'delivered',           -- Đã giao xe
        'cancelled'            -- Đơn hàng bị hủy
    )),
    
    notes NVARCHAR(1000),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    
    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id),
    FOREIGN KEY (dealer_id) REFERENCES Dealers(dealer_id),
    FOREIGN KEY (staff_id) REFERENCES Users(user_id),
    FOREIGN KEY (vehicle_detail_id) REFERENCES Vehicle_Detail(vehicle_detail_id),
    FOREIGN KEY (inventory_id) REFERENCES Vehicle_Inventory(inventory_id),
    FOREIGN KEY (promotion_id) REFERENCES Promotions(promotion_id)
);

-- 11. Contracts Table (updated to reference Orders)
CREATE TABLE Contracts (
    contract_id INT IDENTITY(1,1) PRIMARY KEY,
    contract_number NVARCHAR(50) NOT NULL UNIQUE,
    order_id INT NOT NULL,
    customer_id INT NOT NULL,
    dealer_id INT NOT NULL,
    contract_date DATE NOT NULL,
    delivery_date DATE,
    total_value DECIMAL(15,2) NOT NULL,
    terms_conditions NVARCHAR(MAX),
    warranty_info NVARCHAR(1000),
    insurance_info NVARCHAR(1000),
    status NVARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'signed', 'completed', 'cancelled')),
    file_path NVARCHAR(500),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (order_id) REFERENCES Orders(order_id),
    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id),
    FOREIGN KEY (dealer_id) REFERENCES Dealers(dealer_id)
);

-- 12. Payments Table (unchanged)
CREATE TABLE Payments (
    payment_id INT IDENTITY(1,1) PRIMARY KEY,
    order_id INT NOT NULL,
    payment_type NVARCHAR(30) NOT NULL CHECK (payment_type IN ('deposit', 'installment', 'final_payment')),
    amount DECIMAL(15,2) NOT NULL,
    payment_method NVARCHAR(30) NOT NULL CHECK (payment_method IN ('cash', 'bank_transfer', 'credit_card')),
    payment_date DATE NOT NULL,
    transaction_reference NVARCHAR(100),
    status NVARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    notes NVARCHAR(1000),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (order_id) REFERENCES Orders(order_id)
);

-- 13. Test_Drives Table (updated to reference Vehicle_Detail)
CREATE TABLE Test_Drives (
    test_drive_id INT IDENTITY(1,1) PRIMARY KEY,
    customer_id INT NOT NULL,
    dealer_id INT NOT NULL,
    staff_id INT NOT NULL,
    vehicle_detail_id INT NOT NULL, -- Thay cho model_id
    inventory_id INT NOT NULL, -- Xe cụ thể để lái thử
    appointment_date DATETIME2 NOT NULL,
    actual_date DATETIME2,
    duration_minutes INT,
    customer_feedback NVARCHAR(1000),
    staff_notes NVARCHAR(1000),
    status NVARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id),
    FOREIGN KEY (dealer_id) REFERENCES Dealers(dealer_id),
    FOREIGN KEY (staff_id) REFERENCES Users(user_id),
    FOREIGN KEY (vehicle_detail_id) REFERENCES Vehicle_Detail(vehicle_detail_id),
    FOREIGN KEY (inventory_id) REFERENCES Vehicle_Inventory(inventory_id)
);

-- 14. Vehicle_Distribution Table (unchanged)
CREATE TABLE Vehicle_Distribution (
    distribution_id INT IDENTITY(1,1) PRIMARY KEY,
    from_location NVARCHAR(100) NOT NULL,
    to_dealer_id INT NOT NULL,
    inventory_id INT NOT NULL,
    distribution_date DATE NOT NULL,
    expected_arrival DATE NOT NULL,
    actual_arrival DATE,
    transport_company NVARCHAR(200),
    tracking_number NVARCHAR(100),
    status NVARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'delivered', 'cancelled')),
    cost DECIMAL(15,2) NOT NULL DEFAULT 0,
    notes NVARCHAR(1000),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (to_dealer_id) REFERENCES Dealers(dealer_id),
    FOREIGN KEY (inventory_id) REFERENCES Vehicle_Inventory(inventory_id)
);

-- 15. Customer_Feedback Table (unchanged)
CREATE TABLE Customer_Feedback (
    feedback_id INT IDENTITY(1,1) PRIMARY KEY,
    customer_id INT NOT NULL,
    dealer_id INT NOT NULL,
    order_id INT NULL,
    feedback_type NVARCHAR(20) NOT NULL CHECK (feedback_type IN ('complaint', 'suggestion', 'compliment')),
    subject NVARCHAR(200) NOT NULL,
    description NVARCHAR(2000) NOT NULL,
    priority NVARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status NVARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    assigned_to INT NULL,
    resolution_notes NVARCHAR(2000),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    resolved_at DATETIME2,
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id),
    FOREIGN KEY (dealer_id) REFERENCES Dealers(dealer_id),
    FOREIGN KEY (order_id) REFERENCES Orders(order_id),
    FOREIGN KEY (assigned_to) REFERENCES Users(user_id)
);

-- =============================================
-- INSERT SAMPLE DATA
-- =============================================

-- 1. Insert Dealers (unchanged)
INSERT INTO Dealers (dealer_code, dealer_name, address, city, region, contact_person, phone, email, contract_date, sales_target, debt_limit) VALUES
('DL001', N'Đại lý EV Hà Nội', N'123 Nguyễn Trãi, Thanh Xuân', N'Hà Nội', N'Miền Bắc', N'Nguyễn Văn A', '0241234567', 'hanoi@evdealer.com', '2023-01-15', 5000000000, 1000000000),
('DL002', N'Đại lý EV TP.HCM', N'456 Lê Văn Sỹ, Quận 3', N'TP.HCM', N'Miền Nam', N'Trần Thị B', '0281234567', 'hcm@evdealer.com', '2023-02-20', 7000000000, 1500000000),
('DL003', N'Đại lý EV Đà Nẵng', N'789 Hùng Vương, Hải Châu', N'Đà Nẵng', N'Miền Trung', N'Lê Văn C', '0236234567', 'danang@evdealer.com', '2023-03-10', 3000000000, 800000000);

-- 2. Insert Users (unchanged)
INSERT INTO Users (username, password_hash, email, full_name, phone, role, dealer_id) VALUES
('admin01', 'hash_admin01', 'admin@evmanagement.com', N'Quản trị viên hệ thống', '0901234567', 'admin', NULL),
('dl001_manager', 'hash_dl001_mgr', 'manager.hanoi@evdealer.com', N'Trưởng phòng Hà Nội', '0241234568', 'dealer_manager', 1),
('dl001_staff01', 'hash_dl001_s01', 'staff01.hanoi@evdealer.com', N'Nhân viên Hà Nội 01', '0241234569', 'dealer_staff', 1);

-- 3. Insert Vehicle_Models (no base_price)
INSERT INTO Vehicle_Models (model_code, model_name, category, battery_capacity, range_km, charging_time, motor_power, seats) VALUES
('EV001', 'VinFast VF e34', 'sedan', 42.0, 285, 7.5, 110.0, 5),
('EV002', 'VinFast VF 8', 'suv', 87.7, 420, 10.0, 300.0, 7),
('EV003', 'VinFast VF 9', 'suv', 123.0, 594, 12.0, 300.0, 7);

-- 4. Insert Vehicle_Versions (no price_adjustment)
INSERT INTO Vehicle_Versions (model_id, version_name, version_code, features_description) VALUES
(1, 'Eco', 'VF-E34-ECO', N'Phiên bản tiêu chuẩn với các tính năng cơ bản'),
(1, 'Plus', 'VF-E34-PLUS', N'Phiên bản nâng cao với thêm tính năng an toàn'),
(2, 'Eco', 'VF8-ECO', N'Phiên bản tiêu chuẩn'),
(2, 'Plus', 'VF8-PLUS', N'Phiên bản cao cấp với nội thất da');

-- 5. Insert Vehicle_Colors (no price_adjustment)
INSERT INTO Vehicle_Colors (color_name, color_code, hex_color) VALUES
(N'Trắng Ngọc Trai', 'WHITE_PEARL', '#F8F8FF'),
(N'Đen Obsidian', 'BLACK_OBS', '#1C1C1C'),
(N'Xanh Dương Đại Dương', 'BLUE_OCEAN', '#003366'),
(N'Đỏ Cherry', 'RED_CHERRY', '#DC143C');

-- 6. Insert Vehicle_Detail (NEW - with fixed prices for each combination)
INSERT INTO Vehicle_Detail (model_id, version_id, color_id, detail_code, final_price) VALUES
-- VF e34 Eco combinations
(1, 1, 1, 'VFE34-ECO-WHITE', 590000000),  -- VF e34 Eco Trắng
(1, 1, 2, 'VFE34-ECO-BLACK', 590000000),  -- VF e34 Eco Đen
(1, 1, 3, 'VFE34-ECO-BLUE', 605000000),   -- VF e34 Eco Xanh Dương (+15M)
(1, 1, 4, 'VFE34-ECO-RED', 610000000),    -- VF e34 Eco Đỏ (+20M)

-- VF e34 Plus combinations  
(1, 2, 1, 'VFE34-PLUS-WHITE', 640000000), -- VF e34 Plus Trắng
(1, 2, 2, 'VFE34-PLUS-BLACK', 640000000), -- VF e34 Plus Đen
(1, 2, 3, 'VFE34-PLUS-BLUE', 655000000),  -- VF e34 Plus Xanh Dương
(1, 2, 4, 'VFE34-PLUS-RED', 660000000),   -- VF e34 Plus Đỏ

-- VF 8 Eco combinations
(2, 3, 1, 'VF8-ECO-WHITE', 1200000000),   -- VF 8 Eco Trắng
(2, 3, 2, 'VF8-ECO-BLACK', 1200000000),   -- VF 8 Eco Đen
(2, 3, 3, 'VF8-ECO-BLUE', 1215000000),    -- VF 8 Eco Xanh Dương
(2, 3, 4, 'VF8-ECO-RED', 1220000000),     -- VF 8 Eco Đỏ

-- VF 8 Plus combinations
(2, 4, 1, 'VF8-PLUS-WHITE', 1300000000),  -- VF 8 Plus Trắng
(2, 4, 2, 'VF8-PLUS-BLACK', 1300000000),  -- VF 8 Plus Đen
(2, 4, 3, 'VF8-PLUS-BLUE', 1315000000),   -- VF 8 Plus Xanh Dương
(2, 4, 4, 'VF8-PLUS-RED', 1320000000);    -- VF 8 Plus Đỏ

-- 7. Insert Vehicle_Inventory (updated to use vehicle_detail_id)
INSERT INTO Vehicle_Inventory (vehicle_detail_id, dealer_id, vin_number, chassis_number, engine_number, manufacturing_date, wholesale_price, retail_price, received_date) VALUES
(1, 1, 'VIN001234567890001', 'CH001234567890001', 'EN001234567890001', '2024-01-15', 550000000, 590000000, '2024-02-01'),
(2, 1, 'VIN001234567890002', 'CH001234567890002', 'EN001234567890002', '2024-01-20', 550000000, 590000000, '2024-02-05'),
(9, 2, 'VIN001234567890003', 'CH001234567890003', 'EN001234567890003', '2024-02-10', 1150000000, 1200000000, '2024-02-25');

-- 8. Insert Customers (unchanged)
INSERT INTO Customers (customer_code, full_name, id_number, phone, email, address, city, date_of_birth, occupation, income_level, dealer_id) VALUES
('CUST001', N'Nguyễn Văn An', '001234567890', '0987654321', 'nguyenvanan@email.com', N'123 Trần Duy Hưng, Cầu Giấy', N'Hà Nội', '1985-06-15', N'Kỹ sư IT', N'Cao', 1),
('CUST002', N'Trần Thị Bình', '001234567891', '0987654322', 'tranthibinh@email.com', N'456 Lê Thánh Tôn, Quận 1', N'TP.HCM', '1990-03-22', N'Bác sĩ', N'Cao', 2);

-- 9. Insert Promotions (unchanged - example)
INSERT INTO Promotions (promotion_name, promotion_code, description, discount_type, discount_value, min_order_value, start_date, end_date, max_usage) VALUES
(N'Khuyến mãi Tết 2024', 'TET2024', N'Giảm giá đặc biệt nhân dịp Tết Nguyên Đán', 'percentage', 10.0, 500000000, '2024-01-01', '2024-02-29', 100);

-- 10. Insert Orders (NEW structure - combined quotation + order)
INSERT INTO Orders (order_number, customer_id, dealer_id, staff_id, vehicle_detail_id, inventory_id, quotation_date, base_price, discount_amount, quotation_valid_until, order_date, total_amount, deposit_amount, remaining_amount, payment_method, status) VALUES
-- Quotation đã thành order và đã đặt cọc
('ORD202400001', 1, 1, 3, 1, 1, '2024-02-01', 590000000, 59000000, '2024-03-01', '2024-02-15', 531000000, 106200000, 424800000, 'installment', 'confirmed'),

-- Quotation đã gửi khách hàng, chưa có phản hồi
('ORD202400002', 2, 2, 3, 9, NULL, '2024-02-10', 1200000000, 120000000, '2024-03-10', NULL, 1080000000, 0, 1080000000, NULL, 'sent_quotation'),

-- Quotation draft, chưa gửi
('ORD202400003', 1, 1, 3, 3, NULL, '2024-02-20', 605000000, 0, '2024-03-20', NULL, 605000000, 0, 605000000, NULL, 'draft_quotation');

-- =============================================
-- CREATE INDEXES FOR PERFORMANCE
-- =============================================

-- Indexes for new Vehicle_Detail table
CREATE INDEX IX_Vehicle_Detail_model_id ON Vehicle_Detail(model_id);
CREATE INDEX IX_Vehicle_Detail_version_id ON Vehicle_Detail(version_id);
CREATE INDEX IX_Vehicle_Detail_color_id ON Vehicle_Detail(color_id);
CREATE INDEX IX_Vehicle_Detail_detail_code ON Vehicle_Detail(detail_code);

-- Updated indexes
CREATE INDEX IX_Vehicle_Inventory_vehicle_detail_id ON Vehicle_Inventory(vehicle_detail_id);
CREATE INDEX IX_Orders_vehicle_detail_id ON Orders(vehicle_detail_id);
CREATE INDEX IX_Orders_status ON Orders(status);
CREATE INDEX IX_Test_Drives_vehicle_detail_id ON Test_Drives(vehicle_detail_id);

-- Existing indexes
CREATE INDEX IX_Users_dealer_id ON Users(dealer_id);
CREATE INDEX IX_Vehicle_Versions_model_id ON Vehicle_Versions(model_id);
CREATE INDEX IX_Vehicle_Inventory_dealer_id ON Vehicle_Inventory(dealer_id);
CREATE INDEX IX_Vehicle_Inventory_status ON Vehicle_Inventory(status);
CREATE INDEX IX_Customers_dealer_id ON Customers(dealer_id);
CREATE INDEX IX_Orders_customer_id ON Orders(customer_id);
CREATE INDEX IX_Orders_dealer_id ON Orders(dealer_id);
CREATE INDEX IX_Payments_order_id ON Payments(order_id);

-- =============================================
-- CREATE VIEWS FOR EASY QUERYING
-- =============================================

-- View để query thông tin xe chi tiết dễ dàng
CREATE VIEW vw_Vehicle_Full_Detail AS
SELECT 
    vd.vehicle_detail_id,
    vd.detail_code,
    vd.final_price,
    vd.status as detail_status,
    m.model_code,
    m.model_name,
    m.category,
    m.battery_capacity,
    m.range_km,
    m.charging_time,
    m.motor_power,
    m.seats,
    v.version_name,
    v.version_code,
    v.features_description,
    c.color_name,
    c.color_code,
    c.hex_color
FROM Vehicle_Detail vd
    INNER JOIN Vehicle_Models m ON vd.model_id = m.model_id
    INNER JOIN Vehicle_Versions v ON vd.version_id = v.version_id
    INNER JOIN Vehicle_Colors c ON vd.color_id = c.color_id;

-- View để query orders với thông tin đầy đủ
CREATE VIEW vw_Order_Full_Detail AS
SELECT 
    o.order_id,
    o.order_number,
    o.status,
    o.quotation_date,
    o.order_date,
    o.base_price,
    o.discount_amount,
    o.total_amount,
    o.deposit_amount,
    o.remaining_amount,
    o.payment_method,
    c.full_name as customer_name,
    c.phone as customer_phone,
    d.dealer_name,
    u.full_name as staff_name,
    vfd.model_name,
    vfd.version_name,
    vfd.color_name,
    vfd.detail_code,
    i.vin_number,
    p.promotion_name
FROM Orders o
    INNER JOIN Customers c ON o.customer_id = c.customer_id
    INNER JOIN Dealers d ON o.dealer_id = d.dealer_id
    INNER JOIN Users u ON o.staff_id = u.user_id
    INNER JOIN vw_Vehicle_Full_Detail vfd ON o.vehicle_detail_id = vfd.vehicle_detail_id
    LEFT JOIN Vehicle_Inventory i ON o.inventory_id = i.inventory_id
    LEFT JOIN Promotions p ON o.promotion_id = p.promotion_id;

PRINT 'Database EV_Dealer_Management_V2 created successfully with optimized structure!';

-- =============================================
-- STORED PROCEDURES FOR COMMON OPERATIONS
-- =============================================

-- Procedure để tạo báo giá mới
CREATE PROCEDURE sp_CreateQuotation
    @customer_id INT,
    @dealer_id INT,
    @staff_id INT,
    @vehicle_detail_id INT,
    @discount_amount DECIMAL(15,2) = 0,
    @promotion_id INT = NULL,
    @valid_days INT = 30,
    @notes NVARCHAR(1000) = NULL
AS
BEGIN
    DECLARE @base_price DECIMAL(15,2);
    DECLARE @total_amount DECIMAL(15,2);
    DECLARE @order_number NVARCHAR(50);
    DECLARE @valid_until DATE;
    
    -- Lấy giá từ Vehicle_Detail
    SELECT @base_price = final_price 
    FROM Vehicle_Detail 
    WHERE vehicle_detail_id = @vehicle_detail_id;
    
    SET @total_amount = @base_price - @discount_amount;
    SET @valid_until = DATEADD(DAY, @valid_days, GETDATE());
    
    -- Generate order number
    SET @order_number = 'QUO' + FORMAT(GETDATE(), 'yyyyMMdd') + RIGHT('000' + CAST(NEXT VALUE FOR seq_order_number AS VARCHAR(3)), 3);
    
    INSERT INTO Orders (
        order_number, customer_id, dealer_id, staff_id, vehicle_detail_id,
        quotation_date, base_price, discount_amount, promotion_id, 
        quotation_valid_until, total_amount, remaining_amount, 
        status, notes
    ) VALUES (
        @order_number, @customer_id, @dealer_id, @staff_id, @vehicle_detail_id,
        GETDATE(), @base_price, @discount_amount, @promotion_id,
        @valid_until, @total_amount, @total_amount,
        'draft_quotation', @notes
    );
    
    SELECT SCOPE_IDENTITY() as order_id, @order_number as order_number;
END;

-- Tạo sequence cho order number
CREATE SEQUENCE seq_order_number
    START WITH 1
    INCREMENT BY 1;

-- Procedure để chuyển quotation thành order (khi khách đặt cọc)
CREATE PROCEDURE sp_ConvertQuotationToOrder
    @order_id INT,
    @deposit_amount DECIMAL(15,2),
    @payment_method NVARCHAR(20),
    @inventory_id INT = NULL
AS
BEGIN
    DECLARE @total_amount DECIMAL(15,2);
    DECLARE @remaining_amount DECIMAL(15,2);
    
    SELECT @total_amount = total_amount FROM Orders WHERE order_id = @order_id;
    SET @remaining_amount = @total_amount - @deposit_amount;
    
    UPDATE Orders 
    SET 
        order_date = GETDATE(),
        deposit_amount = @deposit_amount,
        remaining_amount = @remaining_amount,
        payment_method = @payment_method,
        inventory_id = @inventory_id,
        status = CASE 
            WHEN @inventory_id IS NOT NULL THEN 'confirmed'
            ELSE 'deposited'
        END,
        updated_at = GETDATE()
    WHERE order_id = @order_id;
    
    -- Cập nhật trạng thái inventory nếu có
    IF @inventory_id IS NOT NULL
    BEGIN
        UPDATE Vehicle_Inventory 
        SET status = 'reserved'
        WHERE inventory_id = @inventory_id;
    END;
END;
GO