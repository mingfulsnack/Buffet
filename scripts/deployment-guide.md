# Hướng dẫn triển khai cập nhật database và code

## 1. Chạy Scripts Database

### Bước 1: Thêm cột maban vào bảng donhang

```bash
# Kết nối đến PostgreSQL và chạy script:
psql -U [username] -d [database_name] -f scripts/add-maban-to-donhang.sql
```

### Bước 2: Thêm functions và triggers

```bash
# Chạy script để thêm functions và triggers:
psql -U [username] -d [database_name] -f scripts/update-donhang-functions.sql
```

## 2. Cập nhật Code (Đã hoàn thành)

### Files đã được cập nhật:

- ✅ `models/Order.js` - Thêm hỗ trợ maban trong createOrder
- ✅ `models/Order.js` - Cập nhật getAllOrdersWithDetails để include thông tin bàn
- ✅ `models/Booking.js` - Cập nhật getTablePerformanceReport để sử dụng cấu trúc mới

## 3. Cập nhật Frontend (Cần thực hiện)

### Cần cập nhật file OrdersPage.jsx để:

1. Thêm dropdown chọn bàn khi tạo đơn hàng mới
2. Hiển thị thông tin bàn trong danh sách đơn hàng
3. Thêm filter theo bàn

### Ví dụ code cần thêm:

```javascript
// Trong form tạo đơn hàng
const [selectedTable, setSelectedTable] = useState('');
const [tables, setTables] = useState([]);

// Load danh sách bàn
useEffect(() => {
  api.get('/tables').then(response => {
    setTables(response.data);
  });
}, []);

// Thêm vào form
<select
  value={selectedTable}
  onChange={(e) => setSelectedTable(e.target.value)}
>
  <option value="">Chọn bàn (tùy chọn)</option>
  {tables.map(table => (
    <option key={table.maban} value={table.maban}>
      {table.tenban} - {table.tenvung}
    </option>
  ))}
</select>

// Khi submit đơn hàng
const orderData = {
  monAn: [...],
  ghichu: note,
  maban: selectedTable || null
};
```

## 4. Test Plan

### Kiểm tra Database:

1. Verify cột maban đã được thêm: `\d donhang`
2. Test foreign key constraint: Thử insert donhang với maban không tồn tại
3. Test function báo cáo: `SELECT * FROM get_table_performance_report(CURRENT_DATE - 30, CURRENT_DATE);`

### Kiểm tra API:

1. Tạo đơn hàng mới với maban
2. Tạo đơn hàng mới không có maban (should work)
3. Test API báo cáo bàn: GET `/api/reports/table-performance`

### Kiểm tra Frontend:

1. Form tạo đơn hàng hiển thị dropdown bàn
2. Danh sách đơn hàng hiển thị thông tin bàn
3. Báo cáo hiệu suất bàn hoạt động chính xác

## 5. Rollback Plan (Nếu cần)

```sql
-- Remove foreign key
ALTER TABLE donhang DROP CONSTRAINT IF EXISTS fk_donhang_ban;
-- Remove index
DROP INDEX IF EXISTS idx_donhang_maban;
-- Remove column
ALTER TABLE donhang DROP COLUMN IF EXISTS maban;
-- Remove functions
DROP FUNCTION IF EXISTS get_table_performance_report(DATE, DATE);
DROP FUNCTION IF EXISTS validate_donhang_maban();
-- Remove trigger
DROP TRIGGER IF EXISTS trigger_validate_donhang_maban ON donhang;
-- Remove view
DROP VIEW IF EXISTS v_donhang_detail;
```

## 6. Benefits của cập nhật này:

1. **Báo cáo chính xác**: Có thể tính toán doanh thu và số lượng đơn hàng theo từng bàn
2. **Truy vết tốt hơn**: Biết đơn hàng nào thuộc bàn nào
3. **Phân tích hiệu suất**: So sánh hiệu suất giữa các bàn, các khu vực
4. **Tối ưu vận hành**: Xác định bàn nào được sử dụng nhiều nhất
5. **Báo cáo chi tiết**: Tạo báo cáo theo vùng, theo bàn, theo thời gian

## 7. Lưu ý quan trọng:

- Cột `maban` có thể NULL (đơn hàng cũ hoặc đơn hàng không gắn với bàn cụ thể)
- Trigger sẽ validate maban khi INSERT/UPDATE
- Foreign key đảm bảo tính toàn vẹn dữ liệu
- Index trên maban để tối ưu hiệu suất truy vấn
