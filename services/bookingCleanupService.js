const { Booking } = require('../models');

class BookingCleanupService {
  // Tự động xóa booking cũ vào 0h hàng ngày - DISABLED
  static async cleanupOldBookings() {
    try {
      console.log(
        'Booking cleanup is disabled - keeping all booking records for history'
      );

      // ĐÃ TẮT CHỨC NĂNG XÓA TỰ ĐỘNG
      // Giữ lại tất cả booking để làm lịch sử và báo cáo
      // Không xóa booking đã hủy hoặc đã xác nhận

      return {
        success: true,
        deletedCount: 0,
        message: 'Auto-delete disabled - all bookings preserved',
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
      // - Thời gian đặt + 10 phút < thời gian hiện tại (cho khách 10 phút để đến)
      const result = await Booking.query(
        `
        UPDATE phieudatban 
        SET trangthai = 'QuaHan',
            updated_at = CURRENT_TIMESTAMP
        WHERE trangthai = 'DaDat' 
        AND thoigian_dat + INTERVAL '10 minutes' < $1
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

  // Cleanup booking đã hủy quá 30 phút - DISABLED
  static async cleanupCancelledBookings() {
    try {
      console.log(
        'Cancelled booking cleanup is disabled - keeping all records'
      );

      // ĐÃ TẮT CHỨC NĂNG XÓA BOOKING ĐÃ HỦY
      // Giữ lại để làm lịch sử

      return {
        success: true,
        deletedCount: 0,
        message: 'Auto-delete disabled - cancelled bookings preserved',
      };
    } catch (error) {
      console.error('Error cleaning up cancelled bookings:', error);
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
