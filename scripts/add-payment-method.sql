-- Add payment method column to hoadon table
-- This script adds hinhthuc_thanhtoan column with enum type (cash, bank)

-- Create enum type for payment method
DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('cash', 'bank');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add column hinhthuc_thanhtoan to hoadon table
ALTER TABLE hoadon 
ADD COLUMN IF NOT EXISTS hinhthuc_thanhtoan payment_method DEFAULT 'cash';

-- Add comment to column
COMMENT ON COLUMN hoadon.hinhthuc_thanhtoan IS 'Payment method: cash (Tiền mặt) or bank (Chuyển khoản)';

-- Update existing records to have default value
UPDATE hoadon 
SET hinhthuc_thanhtoan = 'cash' 
WHERE hinhthuc_thanhtoan IS NULL;
