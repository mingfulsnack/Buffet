import React, { useState, useEffect } from 'react';
import Button from '../Button';
import { menuAPI } from '../../services/api';
import { showValidationError } from '../../utils/toast';
import './DishForm.scss';

const DishForm = ({ categories, editingDish, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    tenmon: '',
    madanhmuc: '',
    dongia: '',
    trangthai: 'Con',
    is_addon: false,
    ghichu: '',
    image: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editingDish) {
      setFormData({
        tenmon: editingDish.tenmon || '',
        madanhmuc: editingDish.madanhmuc || '',
        dongia: editingDish.dongia || '',
        trangthai: editingDish.trangthai || 'Con',
        is_addon: editingDish.is_addon || false,
        ghichu: editingDish.ghichu || '',
        image: editingDish.image || '',
      });
    }
  }, [editingDish]);

  // const loadCategories = async () => {
  //   try {
  //     const response = await menuAPI.getCategories();
  //     if (response.data.success) {
  //       // Categories are passed as props, no need to load
  //     }
  //   } catch (error) {
  //     console.error('Error loading categories:', error);
  //   }
  // };

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
      if (editingDish) {
        response = await menuAPI.updateDish(editingDish.mamon, submitData);
      } else {
        response = await menuAPI.createDish(submitData);
      }

      if (response.data.success) {
        onSave(response.data.data);
      }
    } catch (error) {
      console.error('Error saving dish:', error);
      showValidationError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
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
          {errors.dongia && <span className="error-text">{errors.dongia}</span>}
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

      <div className="form-actions">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? 'Đang lưu...' : editingDish ? 'Cập nhật' : 'Thêm mới'}
        </Button>
      </div>
    </form>
  );
};

export default DishForm;
