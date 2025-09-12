import React, { useState, useEffect } from 'react';
import Button from '../Button';
import { menuAPI } from '../../services/api';
import './CategoryFormContent.scss';

const CategoryFormContent = ({ 
  editingCategory, 
  onSave, 
  onCancel, 
  type = 'category' // 'category' hoặc 'buffet-category'
}) => {
  const [formData, setFormData] = useState({
    tendanhmuc: '',
    mota: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editingCategory) {
      setFormData({
        tendanhmuc: editingCategory.tendanhmuc || '',
        mota: editingCategory.mota || '',
      });
    } else {
      setFormData({
        tendanhmuc: '',
        mota: '',
      });
    }
    setErrors({});
  }, [editingCategory]);

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
      let response;
      
      if (editingCategory) {
        // Update existing category
        if (type === 'buffet-category') {
          response = await menuAPI.updateBuffetCategory(editingCategory.madanhmuc, formData);
        } else {
          response = await menuAPI.updateCategory(editingCategory.madanhmuc, formData);
        }
      } else {
        // Create new category
        if (type === 'buffet-category') {
          response = await menuAPI.createBuffetCategory(formData);
        } else {
          response = await menuAPI.createCategory(formData);
        }
      }

      if (response.data.success) {
        onSave(response.data.data);
      }
    } catch (error) {
      console.error('Error saving category:', error);
      if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: 'Có lỗi xảy ra khi lưu danh mục' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
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

      <div className="form-actions">
        <Button variant="ghost" onClick={onCancel} disabled={loading}>
          Hủy
        </Button>
        <Button variant="primary" type="submit" loading={loading}>
          {editingCategory ? 'Cập nhật' : 'Tạo mới'}
        </Button>
      </div>
    </form>
  );
};

export default CategoryFormContent;
