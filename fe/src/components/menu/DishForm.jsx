import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import Button from '../Button';
import { menuAPI } from '../../services/api';
import './DishForm.scss';

const DishForm = ({ dish, isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    tenmon: '',
    madanhmuc: '',
    dongia: '',
    trangthai: 'Con',
    is_addon: false,
    ghichu: '',
    image: '',
  });

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      loadCategories();
      if (dish) {
        setFormData({
          tenmon: dish.tenmon || '',
          madanhmuc: dish.madanhmuc || '',
          dongia: dish.dongia || '',
          trangthai: dish.trangthai || 'Con',
          is_addon: dish.is_addon || false,
          ghichu: dish.ghichu || '',
          image: dish.image || '',
        });
      } else {
        setFormData({
          tenmon: '',
          madanhmuc: '',
          dongia: '',
          trangthai: 'Con',
          is_addon: false,
          ghichu: '',
          image: '',
        });
      }
      setErrors({});
    }
  }, [isOpen, dish]);

  const loadCategories = async () => {
    try {
      const response = await menuAPI.getCategories();
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.tenmon.trim()) {
      newErrors.tenmon = 'Tên món ăn không được để trống';
    }

    if (!formData.madanhmuc) {
      newErrors.madanhmuc = 'Vui lòng chọn danh mục';
    }

    if (!formData.dongia || formData.dongia <= 0) {
      newErrors.dongia = 'Đơn giá phải lớn hơn 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        dongia: parseFloat(formData.dongia),
      };

      let response;
      if (dish) {
        response = await menuAPI.updateDish(dish.mamon, submitData);
      } else {
        response = await menuAPI.createDish(submitData);
      }

      if (response.data.success) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Error saving dish:', error);
      if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: 'Có lỗi xảy ra khi lưu món ăn' });
      }
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <>
      <Button variant="ghost" onClick={onClose} disabled={loading}>
        Hủy
      </Button>
      <Button variant="primary" onClick={handleSubmit} loading={loading}>
        {dish ? 'Cập nhật' : 'Tạo mới'}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={dish ? 'Cập nhật món ăn' : 'Thêm món ăn mới'}
      size="medium"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="dish-form">
        {errors.general && (
          <div className="error-message general-error">{errors.general}</div>
        )}

        <div className="form-group">
          <label htmlFor="tenmon">Tên món ăn *</label>
          <input
            type="text"
            id="tenmon"
            name="tenmon"
            value={formData.tenmon}
            onChange={handleChange}
            className={errors.tenmon ? 'error' : ''}
            placeholder="Nhập tên món ăn"
          />
          {errors.tenmon && <span className="error-text">{errors.tenmon}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="madanhmuc">Danh mục *</label>
          <select
            id="madanhmuc"
            name="madanhmuc"
            value={formData.madanhmuc}
            onChange={handleChange}
            className={errors.madanhmuc ? 'error' : ''}
          >
            <option value="">Chọn danh mục</option>
            {categories.map((category) => (
              <option key={category.madanhmuc} value={category.madanhmuc}>
                {category.tendanhmuc}
              </option>
            ))}
          </select>
          {errors.madanhmuc && (
            <span className="error-text">{errors.madanhmuc}</span>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="dongia">Đơn giá (VNĐ) *</label>
            <input
              type="number"
              id="dongia"
              name="dongia"
              value={formData.dongia}
              onChange={handleChange}
              className={errors.dongia ? 'error' : ''}
              placeholder="0"
              min="0"
              step="1000"
            />
            {errors.dongia && (
              <span className="error-text">{errors.dongia}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="trangthai">Trạng thái</label>
            <select
              id="trangthai"
              name="trangthai"
              value={formData.trangthai}
              onChange={handleChange}
            >
              <option value="Con">Còn món</option>
              <option value="Het">Hết món</option>
              <option value="NgungKinhDoanh">Ngừng kinh doanh</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="image">URL hình ảnh</label>
          <input
            type="url"
            id="image"
            name="image"
            value={formData.image}
            onChange={handleChange}
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div className="form-group">
          <div className="checkbox-group">
            <input
              type="checkbox"
              id="is_addon"
              name="is_addon"
              checked={formData.is_addon}
              onChange={handleChange}
            />
            <label htmlFor="is_addon">Món ăn thêm</label>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="ghichu">Ghi chú</label>
          <textarea
            id="ghichu"
            name="ghichu"
            value={formData.ghichu}
            onChange={handleChange}
            placeholder="Ghi chú về món ăn..."
            rows="3"
          />
        </div>
      </form>
    </Modal>
  );
};

export default DishForm;
