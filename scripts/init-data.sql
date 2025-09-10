-- Script khởi tạo dữ liệu mẫu cho hệ thống buffet restaurant

-- Thêm hạng thành viên
INSERT INTO hangthanhvien (tenhang, uudai) VALUES
('Đồng', 'Giảm giá 5% cho tất cả set buffet'),
('Bạc', 'Giảm giá 10% cho tất cả set buffet + Free nước ngọt'),
('Vàng', 'Giảm giá 15% cho tất cả set buffet + Free nước ngọt + Món tráng miệng'),
('Kim cương', 'Giảm giá 20% cho tất cả set buffet + Free nước ngọt + Món tráng miệng + Ưu tiên đặt bàn');

-- Thêm vùng
INSERT INTO vung (tenvung, mota) VALUES
('Tầng 1 - Sảnh chính', 'Khu vực sảnh chính tầng 1, view đẹp'),
('Tầng 1 - VIP', 'Khu vực VIP tầng 1, riêng tư'),
('Tầng 2 - Gia đình', 'Khu vực tầng 2 dành cho gia đình'),
('Tầng 2 - Nhóm lớn', 'Khu vực tầng 2 cho nhóm đông người'),
('Sân thượng', 'Khu vực sân thượng, view thành phố');

-- Thêm bàn (một số bàn mẫu)
INSERT INTO ban (mavung, tenban, soghe, vitri, trangthai, ghichu) VALUES
(1, 'B01', 4, '{"x": 100, "y": 150}', 'Trong', 'Bàn 4 người gần cửa sổ'),
(1, 'B02', 4, '{"x": 200, "y": 150}', 'Trong', 'Bàn 4 người trung tâm'),
(1, 'B03', 6, '{"x": 300, "y": 150}', 'Trong', 'Bàn 6 người'),
(1, 'B04', 8, '{"x": 400, "y": 150}', 'Trong', 'Bàn 8 người'),
(2, 'VIP01', 6, '{"x": 100, "y": 250}', 'Trong', 'Phòng VIP 6 người'),
(2, 'VIP02', 8, '{"x": 200, "y": 250}', 'Trong', 'Phòng VIP 8 người'),
(3, 'F01', 4, '{"x": 100, "y": 350}', 'Trong', 'Bàn gia đình 4 người'),
(3, 'F02', 6, '{"x": 200, "y": 350}', 'Trong', 'Bàn gia đình 6 người'),
(4, 'G01', 10, '{"x": 100, "y": 450}', 'Trong', 'Bàn nhóm lớn 10 người'),
(4, 'G02', 12, '{"x": 200, "y": 450}', 'Trong', 'Bàn nhóm lớn 12 người'),
(5, 'R01', 4, '{"x": 100, "y": 550}', 'Trong', 'Bàn sân thượng view đẹp'),
(5, 'R02', 6, '{"x": 200, "y": 550}', 'Trong', 'Bàn sân thượng view thành phố');

-- Thêm vai trò
INSERT INTO vai_tro (tenvaitro) VALUES
('Admin'),
('Manager'), 
('Staff'),
('Cashier');

-- Thêm quyền
INSERT INTO quyen (tenquyen) VALUES
('booking.create'),
('booking.read'),
('booking.update'),
('booking.delete'),
('table.create'),
('table.read'),
('table.update'),
('table.delete'),
('menu.create'),
('menu.read'),
('menu.update'),
('menu.delete'),
('customer.create'),
('customer.read'),
('customer.update'),
('customer.delete'),
('employee.create'),
('employee.read'),
('employee.update'),
('employee.delete'),
('report.read'),
('system.admin');

-- Phân quyền cho vai trò Admin (tất cả quyền)
INSERT INTO vaitro_quyen (mavaitro, maquyen)
SELECT 1, maquyen FROM quyen;

-- Phân quyền cho vai trò Manager
INSERT INTO vaitro_quyen (mavaitro, maquyen)
SELECT 2, maquyen FROM quyen WHERE tenquyen IN (
  'booking.create', 'booking.read', 'booking.update', 'booking.delete',
  'table.read', 'table.update',
  'menu.create', 'menu.read', 'menu.update', 'menu.delete',
  'customer.create', 'customer.read', 'customer.update', 'customer.delete',
  'employee.read',
  'report.read'
);

-- Phân quyền cho vai trò Staff
INSERT INTO vaitro_quyen (mavaitro, maquyen)
SELECT 3, maquyen FROM quyen WHERE tenquyen IN (
  'booking.create', 'booking.read', 'booking.update',
  'table.read', 'table.update',
  'menu.read',
  'customer.create', 'customer.read', 'customer.update'
);

-- Phân quyền cho vai trò Cashier
INSERT INTO vaitro_quyen (mavaitro, maquyen)
SELECT 4, maquyen FROM quyen WHERE tenquyen IN (
  'booking.read',
  'table.read',
  'menu.read',
  'customer.read'
);

-- Thêm nhân viên mẫu (mật khẩu: admin123)
INSERT INTO nhanvien (hoten, tendangnhap, matkhauhash, mavaitro, sodienthoai, email, calam) VALUES
('Nguyễn Văn Admin', 'admin', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeU5sF7LKaJKNyGEa', 1, '0901234567', 'admin@buffet.com', 'Toàn thời gian'),
('Trần Thị Manager', 'manager', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeU5sF7LKaJKNyGEa', 2, '0901234568', 'manager@buffet.com', 'Toàn thời gian'),
('Lê Văn Staff', 'staff1', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeU5sF7LKaJKNyGEa', 3, '0901234569', 'staff1@buffet.com', 'Ca sáng'),
('Phạm Thị Staff', 'staff2', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeU5sF7LKaJKNyGEa', 3, '0901234570', 'staff2@buffet.com', 'Ca chiều');

-- Thêm danh mục món ăn
INSERT INTO danhmucmonan (tendanhmuc, mota) VALUES
('Khai vị', 'Các món khai vị, salad, gỏi'),
('Soup', 'Các loại súp, canh'),
('Nướng BBQ', 'Thịt nướng, hải sản nướng'),
('Hấp', 'Các món hấp, dimsum'),
('Chiên xào', 'Các món chiên, xào'),
('Lẩu', 'Các loại lẩu'),
('Tráng miệng', 'Chè, bánh ngọt, trái cây'),
('Nước uống', 'Nước ngọt, trà, café');

-- Thêm món ăn mẫu
INSERT INTO monan (tenmon, madanhmuc, dongia, trangthai, is_addon, ghichu) VALUES
-- Khai vị
('Salad trộn', 1, 0, 'Con', false, 'Salad tươi với sốt đặc biệt'),
('Gỏi cuốn tôm thịt', 1, 0, 'Con', false, 'Gỏi cuốn tươi'),
('Chả cá Hà Nội', 1, 0, 'Con', false, 'Chả cá truyền thống'),

-- Soup  
('Súp cua', 2, 0, 'Con', false, 'Súp cua ngon'),
('Canh chua cá', 2, 0, 'Con', false, 'Canh chua truyền thống'),
('Soup gà nấm', 2, 0, 'Con', false, 'Soup gà bổ dưỡng'),

-- Nướng BBQ
('Thịt bò nướng', 3, 0, 'Con', false, 'Thịt bò tươi nướng'),
('Thịt heo nướng', 3, 0, 'Con', false, 'Thịt heo nướng thơm'),
('Tôm nướng', 3, 0, 'Con', false, 'Tôm tươi nướng'),
('Cá nướng', 3, 0, 'Con', false, 'Cá tươi nướng'),

-- Hấp
('Dimsum hấp', 4, 0, 'Con', false, 'Dimsum Hồng Kông'),
('Shumai', 4, 0, 'Con', false, 'Shumai truyền thống'),
('Há cảo', 4, 0, 'Con', false, 'Há cảo tôm'),

-- Chiên xào
('Cơm chiên dương châu', 5, 0, 'Con', false, 'Cơm chiên đặc biệt'),
('Mì xào giòn', 5, 0, 'Con', false, 'Mì xào giòn hải sản'),
('Tôm tempura', 5, 0, 'Con', false, 'Tôm chiên tempura'),

-- Lẩu
('Lẩu Thái', 6, 0, 'Con', false, 'Lẩu Thái chua cay'),
('Lẩu nấm', 6, 0, 'Con', false, 'Lẩu nấm chay'),
('Lẩu hải sản', 6, 0, 'Con', false, 'Lẩu hải sản tươi'),

-- Tráng miệng
('Chè đậu xanh', 7, 0, 'Con', false, 'Chè đậu xanh mát lạnh'),
('Bánh flan', 7, 0, 'Con', false, 'Bánh flan caramen'),
('Trái cây tươi', 7, 0, 'Con', false, 'Trái cây theo mùa'),
('Kem vanilla', 7, 0, 'Con', false, 'Kem vanilla thơm ngon'),

-- Nước uống (addon)
('Coca Cola', 8, 25000, 'Con', true, 'Nước ngọt có ga'),
('Pepsi', 8, 25000, 'Con', true, 'Nước ngọt có ga'),
('Trà đá', 8, 15000, 'Con', true, 'Trà đá truyền thống'),
('Café đen', 8, 20000, 'Con', true, 'Café đen đậm đà'),
('Nước suối', 8, 10000, 'Con', true, 'Nước suối tinh khiết');

-- Thêm set buffet
INSERT INTO setbuffet (tenset, dongia, thoigian_batdau, thoigian_ketthuc, mota, trangthai) VALUES
('Set Buffet Trưa', 299000, '11:00', '14:00', 'Buffet trưa với đa dạng món ăn Á - Âu', 'HoatDong'),
('Set Buffet Tối', 399000, '17:30', '21:30', 'Buffet tối cao cấp với hải sản tươi sống', 'HoatDong'),
('Set Buffet Cuối Tuần', 449000, '11:00', '21:30', 'Buffet đặc biệt cuối tuần với premium food', 'HoatDong'),
('Set Buffet Trẻ Em', 199000, '11:00', '21:30', 'Buffet dành cho trẻ em dưới 12 tuổi', 'HoatDong');

-- Thêm chi tiết set buffet (tất cả món ăn không phải addon)
INSERT INTO setbuffet_chitiet (maset, mamon, soluong)
SELECT s.maset, m.mamon, 1 
FROM setbuffet s
CROSS JOIN monan m 
WHERE m.is_addon = false;

-- Thêm khuyến mãi mẫu
INSERT INTO khuyenmai (tenkm, loai_km, giatri, ngay_batdau, ngay_ketthuc, dieu_kien, is_active) VALUES
('Giảm giá 10% cho khách hàng mới', 'percentage', 10, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', '{"min_total": 200000, "customer_type": "new"}', true),
('Giảm 50k cho hóa đơn trên 500k', 'fixed', 50000, CURRENT_DATE, CURRENT_DATE + INTERVAL '15 days', '{"min_total": 500000}', true),
('Buffet cuối tuần giảm 15%', 'percentage', 15, CURRENT_DATE, CURRENT_DATE + INTERVAL '60 days', '{"day_of_week": [6,7], "apply_to": "SetBuffet"}', true);

-- Thêm áp dụng khuyến mãi (dùng 0 cho object_id khi áp dụng toàn bộ)
INSERT INTO khuyenmai_apdung (makm, object_type, object_id) VALUES
(1, 'ToanBo', 0),
(2, 'ToanBo', 0), 
(3, 'SetBuffet', 3);

-- Thêm một số khách hàng mẫu
INSERT INTO khachhang (hoten, gioitinh, sodienthoai, email, diachi, mahang) VALUES
('Nguyễn Văn A', 'Nam', '0912345678', 'nguyenvana@email.com', '123 Nguyễn Huệ, Q1, TP.HCM', 2),
('Trần Thị B', 'Nữ', '0912345679', 'tranthib@email.com', '456 Lê Lợi, Q1, TP.HCM', 1),
('Lê Văn C', 'Nam', '0912345680', 'levanc@email.com', '789 Võ Văn Tần, Q3, TP.HCM', 3),
('Phạm Thị D', 'Nữ', '0912345681', 'phamthid@email.com', '321 Cách Mạng Tháng 8, Q10, TP.HCM', 1);

COMMIT;
