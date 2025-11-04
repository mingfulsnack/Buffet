-- Script để cập nhật dữ liệu sau khi thêm cột maban
-- Chạy script này sau khi đã chạy add-maban-to-donhang.sql

BEGIN;

-- 1. Thêm trigger để tự động validate maban khi INSERT/UPDATE
CREATE OR REPLACE FUNCTION validate_donhang_maban()
RETURNS TRIGGER AS $$
BEGIN
  -- Kiểm tra maban có tồn tại trong bảng ban không
  IF NEW.maban IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM ban WHERE maban = NEW.maban) THEN
      RAISE EXCEPTION 'Mã bàn % không tồn tại', NEW.maban;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Gán trigger cho bảng donhang
CREATE TRIGGER trigger_validate_donhang_maban
  BEFORE INSERT OR UPDATE ON donhang
  FOR EACH ROW
  EXECUTE FUNCTION validate_donhang_maban();

-- 2. Tạo view để dễ dàng truy vấn thông tin đơn hàng + bàn
CREATE OR REPLACE VIEW v_donhang_detail AS
SELECT 
  d.madon,
  d.maban,
  b.tenban,
  v.tenvung,
  d.tongtien,
  d.ghichu,
  d.thoi_gian_tao,
  h.mahd,
  h.trangthai_thanhtoan,
  h.ngaylap as ngay_thanhtoan
FROM donhang d
LEFT JOIN ban b ON d.maban = b.maban
LEFT JOIN vung v ON b.mavung = v.mavung
LEFT JOIN hoadon h ON d.madon = h.madon
ORDER BY d.thoi_gian_tao DESC;

-- 3. Tạo function để lấy báo cáo hiệu suất bàn
CREATE OR REPLACE FUNCTION get_table_performance_report(
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  maban INTEGER,
  tenban VARCHAR,
  tenvung VARCHAR,
  soghe INTEGER,
  so_don_hang BIGINT,
  doanh_thu DECIMAL,
  don_hang_trung_binh DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.maban,
    b.tenban,
    v.tenvung,
    b.soghe,
    COUNT(d.madon) as so_don_hang,
    COALESCE(SUM(h.tongtien), 0) as doanh_thu,
    CASE 
      WHEN COUNT(d.madon) > 0 THEN COALESCE(SUM(h.tongtien), 0) / COUNT(d.madon)
      ELSE 0
    END as don_hang_trung_binh
  FROM ban b
  LEFT JOIN vung v ON b.mavung = v.mavung
  LEFT JOIN donhang d ON b.maban = d.maban 
    AND d.thoi_gian_tao::DATE BETWEEN p_start_date AND p_end_date
  LEFT JOIN hoadon h ON d.madon = h.madon
  GROUP BY b.maban, b.tenban, v.tenvung, b.soghe
  ORDER BY doanh_thu DESC, so_don_hang DESC;
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- Test function
SELECT * FROM get_table_performance_report(CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE);