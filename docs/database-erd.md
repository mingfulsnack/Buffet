# 🗃️ DATABASE ERD DIAGRAM - BUFFET RESTAURANT SYSTEM

## 📊 Entity Relationship Diagram

```mermaid
erDiagram
    %% Core Tables
    VUNG {
        int mavung PK
        varchar tenvung
        text mota
    }

    BAN {
        int maban PK
        int mavung FK
        varchar tenban
        int soghe
        varchar vitri
        varchar trangthai
        int version
        text ghichu
    }

    NHANVIEN {
        int manv PK
        varchar hoten
        varchar tendangnhap UK
        text matkhauhash
        int mavaitro FK
        varchar sodienthoai
        varchar email
        varchar calam
        date ngayvaolam
        boolean is_active
        timestamp created_at
    }

    VAI_TRO {
        int mavaitro PK
        varchar tenvaitro UK
    }

    QUYEN {
        int maquyen PK
        varchar tenquyen
    }

    VAITRO_QUYEN {
        int mavaitro PK,FK
        int maquyen PK,FK
    }

    %% Menu & Product Tables
    DANHMUCMONAN {
        int madanhmuc PK
        varchar tendanhmuc
        text mota
    }

    MONAN {
        int mamon PK
        varchar tenmon
        int madanhmuc FK
        decimal dongia
        varchar trangthai
        boolean is_addon
        text ghichu
        varchar image
    }

    DANHMUCBUFFET {
        int madanhmuc PK
        varchar tendanhmuc UK
        text mota
    }

    SETBUFFET {
        int maset PK
        varchar tenset
        decimal dongia
        time thoigian_batdau
        time thoigian_ketthuc
        text mota
        varchar trangthai
        varchar image
        int madanhmuc FK
    }

    SETBUFFET_CHITIET {
        int maset PK,FK
        int mamon PK,FK
        int soluong
    }

    %% Booking Tables
    PHIEUDATBAN {
        int maphieu PK
        int makh FK
        varchar guest_hoten
        varchar guest_sodienthoai
        varchar guest_email
        int maban FK
        int songuoi
        timestamp thoigian_dat
        timestamp thoigian_den
        timestamp thoigian_huy
        varchar trangthai
        varchar nguon_dat
        timestamp created_at
        int created_by FK
        timestamp updated_at
        uuid booking_token
        timestamp cancel_deadline
        text ghichu
        timestamp auto_delete_at
    }

    PHIEUDATBAN_LICHSU {
        int id PK
        int maphieu FK
        timestamp thoi_gian
        varchar hanh_dong
        text noidung
        int thuchienboi FK
    }

    %% Order & Payment Tables
    DONHANG {
        int madon PK
        decimal tongtien
        text ghichu
        timestamp thoi_gian_tao
    }

    DONHANG_CHITIET {
        int id PK
        int madon FK
        int mamon FK
        int maset FK
        int soluong
        decimal dongia
        decimal thanhtien
    }

    HOADON {
        int mahd PK
        int madon FK
        decimal tongtien
        decimal giamgia
        decimal phiphuthu
        varchar trangthai_thanhtoan
        timestamp ngaylap
    }

    %% Relationships
    VUNG ||--o{ BAN : contains
    VAI_TRO ||--o{ NHANVIEN : has
    VAI_TRO ||--o{ VAITRO_QUYEN : granted
    QUYEN ||--o{ VAITRO_QUYEN : assigned

    DANHMUCMONAN ||--o{ MONAN : categorizes
    DANHMUCBUFFET ||--o{ SETBUFFET : categorizes
    SETBUFFET ||--o{ SETBUFFET_CHITIET : contains
    MONAN ||--o{ SETBUFFET_CHITIET : included_in

    BAN ||--o{ PHIEUDATBAN : booked_for
    NHANVIEN ||--o{ PHIEUDATBAN : created_by
    PHIEUDATBAN ||--o{ PHIEUDATBAN_LICHSU : tracked_in
    NHANVIEN ||--o{ PHIEUDATBAN_LICHSU : performed_by

    DONHANG ||--o{ DONHANG_CHITIET : contains
    MONAN ||--o{ DONHANG_CHITIET : ordered
    SETBUFFET ||--o{ DONHANG_CHITIET : ordered
    DONHANG ||--|| HOADON : generates
```

## 📋 TABLE DESCRIPTIONS

### 🏢 **Core Management Tables**

#### 1. **VUNG** (Areas/Zones)

- Quản lý các khu vực trong nhà hàng (VIP, thường, ngoài trời...)
- **Primary Key**: `mavung`

#### 2. **BAN** (Tables)

- Quản lý bàn ăn với trạng thái và vị trí
- **Foreign Key**: `mavung` → VUNG
- **States**: 'Trong', 'DaDat', 'DangSuDung', 'BaoTri'

#### 3. **NHANVIEN** (Employees)

- Quản lý thông tin nhân viên và đăng nhập
- **Foreign Key**: `mavaitro` → VAI_TRO
- **Unique**: `tendangnhap`

#### 4. **VAI_TRO** & **QUYEN** (Roles & Permissions)

- Hệ thống phân quyền RBAC (Role-Based Access Control)
- Many-to-many relationship qua `VAITRO_QUYEN`

### 🍽️ **Menu & Product Tables**

#### 5. **DANHMUCMONAN** (Food Categories)

- Phân loại món ăn: Khai vị, Món chính, Tráng miệng...

#### 6. **MONAN** (Food Items)

- Chi tiết từng món ăn với giá và trạng thái
- **Foreign Key**: `madanhmuc` → DANHMUCMONAN

#### 7. **SETBUFFET** & **SETBUFFET_CHITIET** (Buffet Sets)

- Set buffet với thời gian phục vụ
- Chi tiết các món trong set
- **Foreign Keys**: `madanhmuc` → DANHMUCBUFFET, `mamon` → MONAN

### 📋 **Booking Tables**

#### 8. **PHIEUDATBAN** (Booking Records)

- Phiếu đặt bàn với thông tin khách và trạng thái
- **Foreign Keys**: `maban` → BAN, `created_by` → NHANVIEN
- **Unique**: `booking_token` (UUID)

#### 9. **PHIEUDATBAN_LICHSU** (Booking History)

- Audit trail cho các thay đổi đặt bàn
- **Foreign Keys**: `maphieu` → PHIEUDATBAN, `thuchienboi` → NHANVIEN

### 💰 **Order & Payment Tables**

#### 10. **DONHANG** & **DONHANG_CHITIET** (Orders)

- Đơn hàng và chi tiết món đã order
- Support cả món lẻ và set buffet

#### 11. **HOADON** (Invoices)

- Hóa đơn thanh toán với thuế và phí
- **Foreign Key**: `madon` → DONHANG

## 🔗 KEY RELATIONSHIPS

### Primary Relationships:

1. **VUNG** → **BAN** (1:N) - Một vùng chứa nhiều bàn
2. **BAN** → **PHIEUDATBAN** (1:N) - Một bàn có nhiều lần đặt
3. **MONAN** → **SETBUFFET_CHITIET** (1:N) - Món ăn thuộc nhiều set
4. **DONHANG** → **HOADON** (1:1) - Mỗi đơn hàng có một hóa đơn

### Secondary Relationships:

- **VAI_TRO** ↔ **QUYEN** (N:N) - Phân quyền RBAC
- **PHIEUDATBAN** → **PHIEUDATBAN_LICHSU** (1:N) - Audit trail
- **DONHANG_CHITIET** references both **MONAN** và **SETBUFFET**

## 📊 BUSINESS FLOW MAPPING

```
Customer Journey:
VUNG → BAN → PHIEUDATBAN → DONHANG → HOADON

Menu Management:
DANHMUCMONAN → MONAN → SETBUFFET_CHITIET ← SETBUFFET ← DANHMUCBUFFET

Staff Management:
VAI_TRO → VAITRO_QUYEN ← QUYEN
     ↓
  NHANVIEN
```

## 🎯 KEY FEATURES

✅ **Optimistic Locking**: `version` field in BAN table  
✅ **Audit Trail**: PHIEUDATBAN_LICHSU for booking changes  
✅ **UUID Tokens**: Secure booking references  
✅ **RBAC System**: Role-based permissions  
✅ **Flexible Menu**: Both individual items and buffet sets  
✅ **Guest Support**: Non-member booking capability  
✅ **Status Tracking**: Complete state management

---

_📊 This ERD represents a comprehensive restaurant management system with booking, menu, staff, and payment capabilities._
