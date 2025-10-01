import React from 'react';
import Modal from '../Modal';
import './MenuItemDetailModal.scss';

const MenuItemDetailModal = ({ isOpen, onClose, item, type }) => {
  if (!item) return null;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const isDish = type === 'dish';
  const isBuffet = type === 'buffet';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isDish ? 'Chi tiết món ăn' : 'Chi tiết set buffet'}
      className="menu-item-detail-modal"
    >
      <div className="menu-item-detail">
        {/* Hình ảnh */}
        <div className="item-image-section">
          {item.image ? (
            <img
              src={item.image}
              alt={isDish ? item.tenmon : item.tenset}
              className="item-image"
            />
          ) : (
            <div className="no-image-placeholder">
              <span>Không có hình ảnh</span>
            </div>
          )}
        </div>

        {/* Thông tin chi tiết */}
        <div className="item-info-section">
          <div className="item-header">
            <h2 className="item-name">
              {isDish ? item.tenmon : item.tenset}
            </h2>
          </div>

          <div className="item-details">
            {/* Danh mục */}
            <div className="detail-row">
              <span className="detail-label">Danh mục:</span>
              <span className="detail-value">
                {item.tendanhmuc || 'Chưa phân loại'}
              </span>
            </div>

            {/* Ghi chú/Mô tả */}
            <div className="detail-row">
              <span className="detail-label">
                {isDish ? 'Ghi chú:' : 'Mô tả:'}
              </span>
              <span className="detail-value">
                {isDish ? (item.ghichu || 'Không có ghi chú') : (item.mota || 'Không có mô tả')}
              </span>
            </div>

            {/* Thông tin đặc biệt cho buffet */}
            {isBuffet && (
              <>
                {/* Thời gian phục vụ */}
                <div className="detail-row">
                  <span className="detail-label">Thời gian phục vụ:</span>
                  <span className="detail-value">
                    {item.thoigian_batdau && item.thoigian_ketthuc
                      ? `${item.thoigian_batdau} - ${item.thoigian_ketthuc}`
                      : 'Cả ngày'}
                  </span>
                </div>
              </>
            )}

            {/* Thông tin đặc biệt cho món ăn */}
            {isDish && (
              <>
              </>
            )}
          </div>

          {/* Thông tin bổ sung */}
          <div className="item-additional-info">
            <div className="info-section">
              <h3>Thông tin bổ sung</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Giá:</span>
                  <span className="info-value highlight">
                    {formatPrice(isDish ? item.dongia : item.dongia)}
                  </span>
                </div>
                
                <div className="info-item">
                  <span className="info-label">Trạng thái:</span>
                  <span className="info-value status available">
                    Có sẵn
                  </span>
                </div>

                {isBuffet && item.thoigian_batdau && item.thoigian_ketthuc && (
                  <div className="info-item">
                    <span className="info-label">Khung giờ:</span>
                    <span className="info-value">
                      {item.thoigian_batdau} - {item.thoigian_ketthuc}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="modal-actions">
        <button className="btn-close" onClick={onClose}>
          Đóng
        </button>
      </div>
    </Modal>
  );
};

export default MenuItemDetailModal;