import React, { useState, useEffect, useRef } from 'react';
import { bookingAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import Modal from '../components/Modal';
import {
  showLoadingToast,
  showValidationError,
} from '../utils/toast';
import './AdminBookingsPage.scss';

const AdminBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Prevent multiple API calls
  const hasLoadedData = useRef(false);

  useEffect(() => {
    const loadBookings = async () => {
      if (hasLoadedData.current) return;

      hasLoadedData.current = true;
      setLoading(true);

      try {
        console.log('Loading bookings...');
        const response = await bookingAPI.getBookings();

        if (response.data.success) {
          setBookings(response.data.data);
        }
      } catch (error) {
        console.error('Error loading bookings:', error);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, []);

  // Filter bookings
  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      !searchTerm ||
      booking.guest_hoten?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.guest_sodienthoai?.includes(searchTerm) ||
      booking.khachhang_hoten?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || booking.trangthai === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleCancelBooking = async () => {
    if (!selectedBooking || !cancelReason.trim()) return;

    setSubmitting(true);

    const cancelOperation = async () => {
      await bookingAPI.cancelBooking(selectedBooking.maphieu, cancelReason);

      // Update booking status in local state
      setBookings((prev) =>
        prev.map((booking) =>
          booking.maphieu === selectedBooking.maphieu
            ? { ...booking, trangthai: 'DaHuy' }
            : booking
        )
      );

      setShowCancelModal(false);
      setSelectedBooking(null);
      setCancelReason('');
    };

    try {
      await showLoadingToast(cancelOperation(), {
        pending: 'Đang hủy đặt bàn...',
        success: 'Hủy đặt bàn thành công!',
        error: 'Có lỗi xảy ra khi hủy đặt bàn',
      });
    } catch (error) {
      console.error('Error canceling booking:', error);
      showValidationError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmBooking = async (bookingId) => {
    const confirmOperation = async () => {
      await bookingAPI.confirmBooking(bookingId);

      // Update booking status in local state
      setBookings((prev) =>
        prev.map((booking) =>
          booking.maphieu === bookingId
            ? { ...booking, trangthai: 'DaXacNhan' }
            : booking
        )
      );
    };

    try {
      await showLoadingToast(confirmOperation(), {
        pending: 'Đang xác nhận đặt bàn...',
        success: 'Xác nhận đặt bàn thành công!',
        error: 'Có lỗi xảy ra khi xác nhận đặt bàn',
      });
    } catch (error) {
      console.error('Error confirming booking:', error);
      showValidationError(error);
    }
  };

  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleString('vi-VN');
  };

  const getStatusColor = (status) => {
    const statusColors = {
      DaDat: 'status-pending',
      DaXacNhan: 'status-confirmed',
      DaHuy: 'status-cancelled',
      QuaHan: 'status-expired',
    };
    return statusColors[status] || 'status-default';
  };

  const getStatusText = (status) => {
    const statusTexts = {
      DaDat: 'Đã đặt',
      DaXacNhan: 'Đã xác nhận',
      DaHuy: 'Đã hủy',
      QuaHan: 'Quá hạn',
    };
    return statusTexts[status] || status;
  };

  if (loading) {
    return <LoadingSpinner size="large" message="Đang tải dữ liệu..." />;
  }

  return (
    <div className="admin-bookings-page">
      <div className="page-header">
        <h1>Quản lý đặt bàn</h1>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc số điện thoại..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="status-filter">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="DaDat">Đã đặt</option>
            <option value="DaXacNhan">Đã xác nhận</option>
            <option value="DaHuy">Đã hủy</option>
            <option value="QuaHan">Quá hạn</option>
          </select>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bookings-table-container">
        {filteredBookings.length === 0 ? (
          <div className="no-data">
            <p>Không có đặt bàn nào được tìm thấy</p>
          </div>
        ) : (
          <table className="bookings-table">
            <thead>
              <tr>
                <th>Mã phiếu</th>
                <th>Tên khách</th>
                <th>Số điện thoại</th>
                <th>Bàn</th>
                <th>Số người</th>
                <th>Thời gian đặt</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <tr key={booking.maphieu}>
                  <td>{booking.maphieu}</td>
                  <td>
                    {booking.guest_hoten || booking.khachhang_hoten || 'N/A'}
                  </td>
                  <td>
                    {booking.guest_sodienthoai ||
                      booking.khachhang_sodienthoai ||
                      'N/A'}
                  </td>
                  <td>{booking.ban_tenban || `Bàn ${booking.maban}`}</td>
                  <td>{booking.songuoi}</td>
                  <td>{formatDateTime(booking.thoigian_dat)}</td>
                  <td>
                    <span
                      className={`status-badge ${getStatusColor(
                        booking.trangthai
                      )}`}
                    >
                      {getStatusText(booking.trangthai)}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {booking.trangthai === 'DaDat' && (
                        <>
                          <Button
                            variant="edit"
                            size="small"
                            onClick={() =>
                              handleConfirmBooking(booking.maphieu)
                            }
                          >
                            Xác nhận
                          </Button>
                          <Button
                            variant="delete"
                            size="small"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowCancelModal(true);
                            }}
                          >
                            Hủy
                          </Button>
                        </>
                      )}
                      {(booking.trangthai === 'DaXacNhan' ||
                        booking.trangthai === 'DaHuy' ||
                        booking.trangthai === 'QuaHan') && (
                        <span className="no-actions">Không có thao tác</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Cancel Booking Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setSelectedBooking(null);
          setCancelReason('');
        }}
        title="Hủy đặt bàn"
      >
        <div className="cancel-booking-form">
          <p>
            Bạn có chắc chắn muốn hủy đặt bàn của khách hàng "
            {selectedBooking?.guest_hoten || selectedBooking?.khachhang_hoten}"?
          </p>

          <div className="form-group">
            <label htmlFor="cancelReason">Lý do hủy *</label>
            <textarea
              id="cancelReason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Nhập lý do hủy đặt bàn..."
              rows="3"
              required
            />
          </div>

          <div className="modal-actions">
            <Button
              variant="cancel"
              onClick={() => {
                setShowCancelModal(false);
                setSelectedBooking(null);
                setCancelReason('');
              }}
            >
              Đóng
            </Button>
            <Button
              variant="delete"
              onClick={handleCancelBooking}
              disabled={!cancelReason.trim() || submitting}
            >
              {submitting ? 'Đang hủy...' : 'Xác nhận hủy'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminBookingsPage;
