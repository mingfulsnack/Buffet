import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import Button from '../Button';
import { menuAPI } from '../../services/api';
import { showValidationError } from '../../utils/toast';
import './CategoryForm.scss';

const CategoryForm = ({ category, isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    tendanhmuc: '',
    mota: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (category) {
        setFormData({
          tendanhmuc: category.tendanhmuc || '',
          mota: category.mota || '',
        });
      } else {
        setFormData({
          tendanhmuc: '',
          mota: '',
        });
      }
      setErrors({});
    }
  }, [isOpen, category]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.tendanhmuc.trim()) {
      newErrors.tendanhmuc = 'Tên danh mục không được để trống';
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
      const response = await menuAPI.createCategory(formData);

      if (response.data.success) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Error saving category:', error);
      showValidationError(error);
      if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: 'Có lỗi xảy ra khi lưu danh mục' });
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
        Tạo mới
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Thêm danh mục mới"
      size="small"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="category-form">
        {errors.general && (
          <div className="error-message general-error">{errors.general}</div>
        )}

        <div className="form-group">
          <label htmlFor="tendanhmuc">Tên danh mục *</label>
          <input
            type="text"
            id="tendanhmuc"
            name="tendanhmuc"
            value={formData.tendanhmuc}
            onChange={handleChange}
            className={errors.tendanhmuc ? 'error' : ''}
            placeholder="Nhập tên danh mục"
          />
          {errors.tendanhmuc && (
            <span className="error-text">{errors.tendanhmuc}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="mota">Mô tả</label>
          <textarea
            id="mota"
            name="mota"
            value={formData.mota}
            onChange={handleChange}
            placeholder="Mô tả danh mục..."
            rows="3"
          />
        </div>
      </form>
    </Modal>
  );
};

export default CategoryForm;
