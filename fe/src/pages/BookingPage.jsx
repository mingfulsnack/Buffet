import React, { useState, useEffect, useRef } from 'react';
import { tableAPI, bookingAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import Modal from '../components/Modal';
import {
  showSuccess,
  showError,
  showLoadingToast,
  showValidationError,
} from '../utils/toast';
import './BookingPage.scss';

const BookingPage = () => {
  const [step, setStep] = useState(1); // 1: Chọn bàn, 2: Thông tin khách, 3: Xác nhận
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Data states
  const [areas, setAreas] = useState([]);
  const [tables, setTables] = useState([]);

  // Form states
  const [selectedTable, setSelectedTable] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    guest_hoten: '',
    guest_sodienthoai: '',
    guest_email: '',
    songuoi: 1,
    thoigian_dat: '',
    ghichu: '',
  });

  // UI states
  const [errors, setErrors] = useState({});
  const [selectedArea, setSelectedArea] = useState('all');
  const [successModal, setSuccessModal] = useState({
    show: false,
    bookingData: null,
  });

  // Prevent multiple API calls
  const hasLoadedInitialData = useRef(false);
  const isLoadingTables = useRef(false);

  // Function to reload tables (for use after booking)
  const reloadTables = async () => {
    try {
      const params = {
        trangthai: 'Trong',
        ...(selectedArea !== 'all' && { mavung: selectedArea }),
      };

      const response = await tableAPI.getPublicTables(params);
      if (response.data.success) {
        setTables(response.data.data);
      }
    } catch (error) {
      console.error('Error reloading tables:', error);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      // Prevent multiple calls
      if (hasLoadedInitialData.current) return;

      hasLoadedInitialData.current = true;
      setLoading(true);

      try {
        console.log('Loading initial data...');
        const areasResponse = await tableAPI.getPublicAreas();

        if (areasResponse.data.success) {
          setAreas(areasResponse.data.data);
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []); // Empty dependency array to run only once

  // Load tables when areas are loaded or area selection changes
  useEffect(() => {
    const loadTables = async () => {
      // Don't load if no areas or currently loading
      if (areas.length === 0 || isLoadingTables.current) return;

      isLoadingTables.current = true;
      try {
        const params = {
          trangthai: 'Trong', // Chỉ lấy bàn trống
          ...(selectedArea !== 'all' && { mavung: selectedArea }),
        };

        const response = await tableAPI.getPublicTables(params);
        if (response.data.success) {
          setTables(response.data.data);
        }
      } catch (error) {
        console.error('Error loading tables:', error);
      } finally {
        isLoadingTables.current = false;
      }
    };

    loadTables();
  }, [areas.length, selectedArea]); // Depend on areas and selected area

  const handleTableSelect = (table) => {
    setSelectedTable(table);
    setBookingForm((prev) => ({
      ...prev,
      maban: table.maban,
    }));
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setBookingForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateStep = (stepNumber) => {
    const newErrors = {};

    if (stepNumber === 1) {
      if (!selectedTable) {
        newErrors.table = 'Vui lòng chọn bàn';
      }
    }

    if (stepNumber === 2) {
      if (!bookingForm.guest_hoten.trim()) {
        newErrors.guest_hoten = 'Vui lòng nhập họ tên';
      }

      if (!bookingForm.guest_sodienthoai.trim()) {
        newErrors.guest_sodienthoai = 'Vui lòng nhập số điện thoại';
      } else if (!/^[0-9]{10,11}$/.test(bookingForm.guest_sodienthoai)) {
        newErrors.guest_sodienthoai = 'Số điện thoại không hợp lệ';
      }

      if (
        bookingForm.guest_email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bookingForm.guest_email)
      ) {
        newErrors.guest_email = 'Email không hợp lệ';
      }

      if (!bookingForm.thoigian_dat) {
        newErrors.thoigian_dat = 'Vui lòng chọn thời gian đặt bàn';
      } else {
        const selectedTime = new Date(bookingForm.thoigian_dat);
        const now = new Date();
        if (selectedTime <= now) {
          newErrors.thoigian_dat =
            'Thời gian đặt bàn phải sau thời điểm hiện tại';
        }
      }

      if (
        bookingForm.songuoi < 1 ||
        bookingForm.songuoi > selectedTable?.soghe
      ) {
        newErrors.songuoi = `Số người phải từ 1 đến ${selectedTable?.soghe}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handlePrevStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) {
      return;
    }

    setSubmitting(true);

    const createBooking = async () => {
      // Convert datetime-local to ISO string
      const bookingDateTime = new Date(bookingForm.thoigian_dat);

      const bookingData = {
        ...bookingForm,
        maban: selectedTable.maban,
        songuoi: parseInt(bookingForm.songuoi),
        thoigian_dat: bookingDateTime.toISOString(), // Convert to ISO string
      };

      console.log(
        'Submitting booking data:',
        JSON.stringify(bookingData, null, 2)
      );

      const response = await bookingAPI.createPublicBooking(bookingData);

      if (response.data.success) {
        setSuccessModal({
          show: true,
          bookingData: response.data.data,
        });

        // Reset form
        setStep(1);
        setSelectedTable(null);
        setBookingForm({
          guest_hoten: '',
          guest_sodienthoai: '',
          guest_email: '',
          songuoi: 1,
          thoigian_dat: '',
          ghichu: '',
        });

        // Reload tables
        reloadTables();
      }
    };

    try {
      await showLoadingToast(createBooking(), {
        pending: 'Đang tạo đặt bàn...',
        success: 'Đặt bàn thành công!',
        error: 'Có lỗi xảy ra khi đặt bàn',
      });
    } catch (error) {
      console.error('Error creating booking:', error);
      showValidationError(error);
      if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: 'Có lỗi xảy ra khi đặt bàn. Vui lòng thử lại.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleString('vi-VN');
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30); // Tối thiểu 30 phút từ bây giờ
    return now.toISOString().slice(0, 16);
  };

  if (loading) {
    return <LoadingSpinner size="large" message="Đang tải dữ liệu..." />;
  }

  return (
    <div className="booking-page">
      <div className="booking-container">
        <h1>Đặt bàn</h1>

        {/* Progress Steps */}
        <div className="booking-steps">
          <div
            className={`step ${step >= 1 ? 'active' : ''} ${
              step > 1 ? 'completed' : ''
            }`}
          >
            <div className="step-number">1</div>
            <div className="step-title">Chọn bàn</div>
          </div>
          <div
            className={`step ${step >= 2 ? 'active' : ''} ${
              step > 2 ? 'completed' : ''
            }`}
          >
            <div className="step-number">2</div>
            <div className="step-title">Thông tin khách</div>
          </div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-title">Xác nhận</div>
          </div>
        </div>

        {/* Step 1: Chọn bàn */}
        {step === 1 && (
          <div className="step-content">
            <h2>Chọn bàn</h2>

            {/* Area Filter */}
            <div className="area-filter">
              <label>Chọn khu vực:</label>
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
              >
                <option value="all">Tất cả khu vực</option>
                {areas.map((area) => (
                  <option key={area.mavung} value={area.mavung}>
                    {area.tenvung}
                  </option>
                ))}
              </select>
            </div>

            {/* Tables Grid */}
            <div className="tables-grid">
              {tables.length === 0 ? (
                <p className="no-tables">
                  Không có bàn trống trong khu vực này
                </p>
              ) : (
                tables.map((area) => (
                  <div key={area.mavung} className="area-section">
                    <h3>{area.tenvung}</h3>
                    <div className="tables-list">
                      {(area.tables || []).map((table) => (
                        <div
                          key={table.maban}
                          className={`table-card ${
                            selectedTable?.maban === table.maban
                              ? 'selected'
                              : ''
                          }`}
                          onClick={() => handleTableSelect(table)}
                        >
                          <div className="table-name">{table.tenban}</div>
                          <div className="table-capacity">
                            {table.soghe} ghế
                          </div>
                          {/* {table.vitri && (
                            <div className="table-location">{table.vitri}</div>
                          )} */}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {errors.table && (
              <div className="error-message">{errors.table}</div>
            )}

            <div className="step-actions">
              <Button
                variant="primary"
                onClick={handleNextStep}
                disabled={!selectedTable}
              >
                Tiếp tục
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Thông tin khách */}
        {step === 2 && (
          <div className="step-content">
            <h2>Thông tin đặt bàn</h2>

            {/* Selected Table Info */}
            <div className="selected-table-info">
              <h3>Bàn đã chọn</h3>
              <div className="table-details">
                <span className="table-name">{selectedTable?.tenban}</span>
                <span className="table-capacity">
                  Sức chứa: {selectedTable?.soghe} người
                </span>
                {/* {selectedTable?.vitri && (
                  <span className="table-location">
                    Vị trí: {selectedTable.vitri}
                  </span>
                )} */}
              </div>
            </div>

            <form className="booking-form">
              {errors.general && (
                <div className="error-message general-error">
                  {errors.general}
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="guest_hoten">Họ và tên *</label>
                  <input
                    type="text"
                    id="guest_hoten"
                    name="guest_hoten"
                    value={bookingForm.guest_hoten}
                    onChange={handleFormChange}
                    className={errors.guest_hoten ? 'error' : ''}
                    placeholder="Nhập họ và tên"
                  />
                  {errors.guest_hoten && (
                    <span className="error-text">{errors.guest_hoten}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="guest_sodienthoai">Số điện thoại *</label>
                  <input
                    type="tel"
                    id="guest_sodienthoai"
                    name="guest_sodienthoai"
                    value={bookingForm.guest_sodienthoai}
                    onChange={handleFormChange}
                    className={errors.guest_sodienthoai ? 'error' : ''}
                    placeholder="0123456789"
                  />
                  {errors.guest_sodienthoai && (
                    <span className="error-text">
                      {errors.guest_sodienthoai}
                    </span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="guest_email">Email</label>
                <input
                  type="email"
                  id="guest_email"
                  name="guest_email"
                  value={bookingForm.guest_email}
                  onChange={handleFormChange}
                  className={errors.guest_email ? 'error' : ''}
                  placeholder="email@example.com"
                />
                {errors.guest_email && (
                  <span className="error-text">{errors.guest_email}</span>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="songuoi">Số người *</label>
                  <input
                    type="number"
                    id="songuoi"
                    name="songuoi"
                    value={bookingForm.songuoi}
                    onChange={handleFormChange}
                    className={errors.songuoi ? 'error' : ''}
                    min="1"
                    max={selectedTable?.soghe || 20}
                  />
                  {errors.songuoi && (
                    <span className="error-text">{errors.songuoi}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="thoigian_dat">Thời gian đặt bàn *</label>
                  <input
                    type="datetime-local"
                    id="thoigian_dat"
                    name="thoigian_dat"
                    value={bookingForm.thoigian_dat}
                    onChange={handleFormChange}
                    className={errors.thoigian_dat ? 'error' : ''}
                    min={getMinDateTime()}
                  />
                  {errors.thoigian_dat && (
                    <span className="error-text">{errors.thoigian_dat}</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="ghichu">Ghi chú</label>
                <textarea
                  id="ghichu"
                  name="ghichu"
                  value={bookingForm.ghichu}
                  onChange={handleFormChange}
                  placeholder="Yêu cầu đặc biệt..."
                  rows="3"
                />
              </div>
            </form>

            <div className="step-actions">
              <Button variant="ghost" onClick={handlePrevStep}>
                Quay lại
              </Button>
              <Button variant="primary" onClick={handleNextStep}>
                Tiếp tục
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Xác nhận */}
        {step === 3 && (
          <div className="step-content">
            <h2>Xác nhận đặt bàn</h2>

            <div className="booking-summary">
              <div className="summary-section">
                <h3>Thông tin bàn</h3>
                <div className="info-row">
                  <span className="label">Bàn:</span>
                  <span className="value">{selectedTable?.tenban}</span>
                </div>
                <div className="info-row">
                  <span className="label">Sức chứa:</span>
                  <span className="value">{selectedTable?.soghe} người</span>
                </div>
                {/* {selectedTable?.vitri && (
                  <div className="info-row">
                    <span className="label">Vị trí:</span>
                    <span className="value">{selectedTable.vitri}</span>
                  </div>
                )} */}
              </div>

              <div className="summary-section">
                <h3>Thông tin khách hàng</h3>
                <div className="info-row">
                  <span className="label">Họ tên:</span>
                  <span className="value">{bookingForm.guest_hoten}</span>
                </div>
                <div className="info-row">
                  <span className="label">Số điện thoại:</span>
                  <span className="value">{bookingForm.guest_sodienthoai}</span>
                </div>
                {bookingForm.guest_email && (
                  <div className="info-row">
                    <span className="label">Email:</span>
                    <span className="value">{bookingForm.guest_email}</span>
                  </div>
                )}
                <div className="info-row">
                  <span className="label">Số người:</span>
                  <span className="value">{bookingForm.songuoi} người</span>
                </div>
                <div className="info-row">
                  <span className="label">Thời gian:</span>
                  <span className="value">
                    {formatDateTime(bookingForm.thoigian_dat)}
                  </span>
                </div>
                {bookingForm.ghichu && (
                  <div className="info-row">
                    <span className="label">Ghi chú:</span>
                    <span className="value">{bookingForm.ghichu}</span>
                  </div>
                )}
              </div>
            </div>

            {errors.general && (
              <div className="error-message general-error">
                {errors.general}
              </div>
            )}

            <div className="step-actions">
              <Button
                variant="ghost"
                onClick={handlePrevStep}
                disabled={submitting}
              >
                Quay lại
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                loading={submitting}
              >
                Xác nhận đặt bàn
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Success Modal */}
      <Modal
        isOpen={successModal.show}
        onClose={() => setSuccessModal({ show: false, bookingData: null })}
        title="Đặt bàn thành công!"
        size="medium"
        footer={
          <Button
            variant="primary"
            onClick={() => setSuccessModal({ show: false, bookingData: null })}
          >
            Đóng
          </Button>
        }
      >
        <div className="success-content">
          <div className="success-icon">✅</div>
          <p className="success-message">
            Đặt bàn của bạn đã được ghi nhận thành công!
          </p>

          {successModal.bookingData && (
            <div className="booking-details">
              <div className="detail-row">
                <span className="label">Mã đặt bàn:</span>
                <span className="value code">
                  {successModal.bookingData.maphieu}
                </span>
              </div>
              <div className="detail-row">
                <span className="label">Bàn:</span>
                <span className="value">{successModal.bookingData.tenban}</span>
              </div>
              <div className="detail-row">
                <span className="label">Thời gian:</span>
                <span className="value">
                  {formatDateTime(successModal.bookingData.thoigian_dat)}
                </span>
              </div>
              <div className="detail-row">
                <span className="label">Trạng thái:</span>
                <span className="value">Chờ xác nhận</span>
              </div>
            </div>
          )}

          <p className="notice">
            Vui lòng lưu lại mã đặt bàn để tra cứu. Chúng tôi sẽ liên hệ với bạn
            để xác nhận trong thời gian sớm nhất.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default BookingPage;
