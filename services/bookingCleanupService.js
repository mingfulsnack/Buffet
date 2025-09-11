const { Booking } = require('../models');

class BookingCleanupService {
  // Tự động xóa booking cũ vào 0h hàng ngày
  static async cleanupOldBookings() {
    try {
      console.log('Starting booking cleanup at:', new Date().toISOString());

      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to start of today

      // Chỉ xóa những booking thỏa mãn:
      // 1. Ngày đặt bàn < hôm nay (không xóa booking tương lai)
      // 2. Trạng thái là DaHuy, DaXacNhan, hoặc QuaHan
      // 3. Không xóa DaDat vì có thể khách vẫn sẽ đến
      const result = await Booking.query(
        `
        DELETE FROM phieudatban 
        WHERE thoigian_dat < $1 
        AND trangthai IN ('DaHuy', 'DaXacNhan', 'QuaHan')
        RETURNING maphieu, thoigian_dat, trangthai
      `,
        [today]
      );

      console.log(
        `Cleaned up ${result.rows.length} old bookings:`,
        result.rows
      );

      return {
        success: true,
        deletedCount: result.rows.length,
        deletedBookings: result.rows,
      };
    } catch (error) {
      console.error('Error in booking cleanup:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Cập nhật trạng thái booking quá hạn
  static async updateExpiredBookings() {
    try {
      const now = new Date();

      // Booking được coi là quá hạn nếu:
      // - Trạng thái vẫn là DaDat
      // - Thời gian đặt + 2 giờ < thời gian hiện tại (cho khách 2h để đến)
      const result = await Booking.query(
        `
        UPDATE phieudatban 
        SET trangthai = 'QuaHan',
            updated_at = CURRENT_TIMESTAMP
        WHERE trangthai = 'DaDat' 
        AND thoigian_dat + INTERVAL '2 hours' < $1
        RETURNING maphieu, thoigian_dat, guest_hoten
      `,
        [now]
      );

      console.log(
        `Updated ${result.rows.length} expired bookings:`,
        result.rows
      );

      return {
        success: true,
        updatedCount: result.rows.length,
        updatedBookings: result.rows,
      };
    } catch (error) {
      console.error('Error updating expired bookings:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Chạy cả hai task cleanup
  static async runDailyCleanup() {
    console.log('=== Starting daily booking cleanup ===');

    // 1. Update expired bookings first
    const expiredResult = await this.updateExpiredBookings();
    console.log('Expired bookings update result:', expiredResult);

    // 2. Then cleanup old bookings
    const cleanupResult = await this.cleanupOldBookings();
    console.log('Old bookings cleanup result:', cleanupResult);

    console.log('=== Daily booking cleanup completed ===');

    return {
      expiredBookings: expiredResult,
      cleanupBookings: cleanupResult,
    };
  }
}

module.exports = BookingCleanupService;
