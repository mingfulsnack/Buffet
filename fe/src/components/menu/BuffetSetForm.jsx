import React, { useState, useEffect } from 'react';
import { menuAPI } from '../../services/api';
import Button from '../Button';
import { showValidationError } from '../../utils/toast';
import './BuffetSetForm.scss';

const BuffetSetForm = ({
  editingSet,
  onSave,
  onCancel,
  buffetCategories = [],
}) => {
  const [formData, setFormData] = useState({
    tenset: '',
    dongia: '',
    thoigian_batdau: '',
    thoigian_ketthuc: '',
    mota: '',
    image: '',
    madanhmuc: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingSet) {
      setFormData({
        tenset: editingSet.tenset || '',
        dongia: editingSet.dongia || '',
        thoigian_batdau: editingSet.thoigian_batdau || '',
        thoigian_ketthuc: editingSet.thoigian_ketthuc || '',
        mota: editingSet.mota || '',
        image: editingSet.image || '',
        madanhmuc: editingSet.madanhmuc || '',
      });
    }
  }, [editingSet]);

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

    if (!formData.tenset.trim()) {
      newErrors.tenset = 'Vui lòng nhập tên set buffet';
    }

    if (!formData.madanhmuc) {
      newErrors.madanhmuc = 'Vui lòng chọn danh mục';
    }

    if (!formData.dongia || formData.dongia <= 0) {
      newErrors.dongia = 'Vui lòng nhập giá hợp lệ';
    }

    if (!formData.thoigian_batdau) {
      newErrors.thoigian_batdau = 'Vui lòng chọn thời gian bắt đầu';
    }

    if (!formData.thoigian_ketthuc) {
      newErrors.thoigian_ketthuc = 'Vui lòng chọn thời gian kết thúc';
    }

    if (
      formData.thoigian_batdau &&
      formData.thoigian_ketthuc &&
      formData.thoigian_batdau >= formData.thoigian_ketthuc
    ) {
      newErrors.thoigian_ketthuc =
        'Thời gian kết thúc phải sau thời gian bắt đầu';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        dongia: parseFloat(formData.dongia),
      };

      let response;
      if (editingSet) {
        response = await menuAPI.updateBuffetSet(editingSet.maset, submitData);
      } else {
        response = await menuAPI.createBuffetSet(submitData);
      }

      if (response.data.success) {
        onSave(response.data.data);
      }
    } catch (error) {
      console.error('Error saving buffet set:', error);
      showValidationError(error);
      if (error.response?.data?.details) {
        const backendErrors = {};
        error.response.data.details.forEach((detail) => {
          const field = detail.split(' ')[0].toLowerCase();
          backendErrors[field] = detail;
        });
        setErrors(backendErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="buffet-set-form">
      <div className="form-group">
        <label htmlFor="tenset">Tên set buffet *</label>
        <input
          type="text"
          id="tenset"
          name="tenset"
          value={formData.tenset}
          onChange={handleChange}
          className={errors.tenset ? 'error' : ''}
          placeholder="Nhập tên set buffet"
        />
        {errors.tenset && <span className="error-text">{errors.tenset}</span>}
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
          <option value="">-- Chọn danh mục --</option>
          {buffetCategories.map((category) => (
            <option key={category.madanhmuc} value={category.madanhmuc}>
              {category.tendanhmuc}
            </option>
          ))}
        </select>
        {errors.madanhmuc && (
          <span className="error-text">{errors.madanhmuc}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="dongia">Giá (VNĐ) *</label>
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

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="thoigian_batdau">Thời gian bắt đầu *</label>
          <input
            type="time"
            id="thoigian_batdau"
            name="thoigian_batdau"
            value={formData.thoigian_batdau}
            onChange={handleChange}
            className={errors.thoigian_batdau ? 'error' : ''}
          />
          {errors.thoigian_batdau && (
            <span className="error-text">{errors.thoigian_batdau}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="thoigian_ketthuc">Thời gian kết thúc *</label>
          <input
            type="time"
            id="thoigian_ketthuc"
            name="thoigian_ketthuc"
            value={formData.thoigian_ketthuc}
            onChange={handleChange}
            className={errors.thoigian_ketthuc ? 'error' : ''}
          />
          {errors.thoigian_ketthuc && (
            <span className="error-text">{errors.thoigian_ketthuc}</span>
          )}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="mota">Mô tả</label>
        <textarea
          id="mota"
          name="mota"
          value={formData.mota}
          onChange={handleChange}
          placeholder="Mô tả về set buffet này..."
          rows="3"
        />
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

      <div className="form-actions">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? 'Đang lưu...' : editingSet ? 'Cập nhật' : 'Thêm mới'}
        </Button>
      </div>
    </form>
  );
};

export default BuffetSetForm;
