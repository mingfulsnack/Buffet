-- Script để thêm cột maban vào bảng donhang
-- Điều này sẽ cho phép liên kết trực tiếp giữa đơn hàng và bàn ăn
-- để tính toán báo cáo hiệu suất bàn

BEGIN;

-- 1. Thêm cột maban vào bảng donhang
ALTER TABLE donhang 
ADD COLUMN maban INTEGER;

-- 2. Thêm foreign key constraint để đảm bảo tính toàn vẹn dữ liệu
ALTER TABLE donhang 
ADD CONSTRAINT fk_donhang_ban 
FOREIGN KEY (maban) REFERENCES ban(maban);

-- 3. Thêm index để tối ưu hiệu suất truy vấn
CREATE INDEX idx_donhang_maban ON donhang(maban);

-- 4. Thêm comment để giải thích mục đích của cột
COMMENT ON COLUMN donhang.maban IS 'Mã bàn - liên kết với bảng ban để theo dõi hiệu suất từng bàn';

-- 5. Cập nhật dữ liệu hiện tại (nếu có) - tạm thời set NULL
-- Trong thực tế, bạn có thể cần logic phức tạp hơn để map đơn hàng hiện tại với bàn
-- UPDATE donhang SET maban = 1 WHERE maban IS NULL; -- Ví dụ set tất cả về bàn 1

COMMIT;

-- Kiểm tra kết quả
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'donhang' 
AND column_name = 'maban';

-- Hiển thị cấu trúc bảng donhang sau khi thêm cột
\d donhang;