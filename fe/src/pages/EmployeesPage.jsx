import React, { useState, useEffect, useRef } from 'react';
import { employeeAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import Modal from '../components/Modal';
import {
  showLoadingToast,
  showValidationError,
} from '../utils/toast';
import './EmployeesPage.scss';

const EmployeesPage = () => {
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Form state
  const [employeeForm, setEmployeeForm] = useState({
    hoten: '',
    tendangnhap: '',
    matkhau: '',
    mavaitro: '',
    sodienthoai: '',
    email: '',
    calam: '',
    is_active: true,
  });

  // Prevent multiple API calls
  const hasLoadedData = useRef(false);

  useEffect(() => {
    const loadData = async () => {
      if (hasLoadedData.current) return;

      hasLoadedData.current = true;
      setLoading(true);

      try {
        console.log('Loading employees and roles...');
        const [employeesResponse, rolesResponse] = await Promise.all([
          employeeAPI.getEmployees(),
          employeeAPI.getRoles(),
        ]);

        if (employeesResponse.data.success) {
          setEmployees(employeesResponse.data.data);
        }

        if (rolesResponse.data.success) {
          setRoles(rolesResponse.data.data);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setEmployees([]);
        setRoles([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter employees
  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      !searchTerm ||
      employee.hoten?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.sodienthoai?.includes(searchTerm) ||
      employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.tenvaitro?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEmployeeForm((prev) => ({
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

  const resetForm = () => {
    setEmployeeForm({
      hoten: '',
      tendangnhap: '',
      matkhau: '',
      mavaitro: '',
      sodienthoai: '',
      email: '',
      calam: '',
      is_active: true,
    });
    setErrors({});
    setEditingEmployee(null);
  };

  const handleAddEmployee = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEditEmployee = (employee) => {
    setEmployeeForm({
      hoten: employee.hoten || '',
      tendangnhap: employee.tendangnhap || '',
      matkhau: '', // Don't populate password for security
      mavaitro: employee.mavaitro || '',
      sodienthoai: employee.sodienthoai || '',
      email: employee.email || '',
      calam: employee.calam || '',
      is_active: employee.is_active !== false,
    });
    setEditingEmployee(employee);
    setShowModal(true);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!employeeForm.hoten.trim()) {
      newErrors.hoten = 'Vui lòng nhập họ tên';
    }

    if (!editingEmployee && !employeeForm.tendangnhap.trim()) {
      newErrors.tendangnhap = 'Vui lòng nhập tên đăng nhập';
    }

    if (!editingEmployee && !employeeForm.matkhau.trim()) {
      newErrors.matkhau = 'Vui lòng nhập mật khẩu';
    }

    if (!employeeForm.mavaitro) {
      newErrors.mavaitro = 'Vui lòng chọn vai trò';
    }

    if (
      employeeForm.sodienthoai &&
      !/^[0-9]{10,11}$/.test(employeeForm.sodienthoai)
    ) {
      newErrors.sodienthoai = 'Số điện thoại không hợp lệ';
    }

    if (employeeForm.email && !/\S+@\S+\.\S+/.test(employeeForm.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);

    const saveEmployee = async () => {
      const submitData = { ...employeeForm };

      // Remove password if empty during edit
      if (editingEmployee && !submitData.matkhau.trim()) {
        delete submitData.matkhau;
      }

      if (editingEmployee) {
        await employeeAPI.updateEmployee(editingEmployee.manv, submitData);

        // Update employee in local state
        setEmployees((prev) =>
          prev.map((emp) =>
            emp.manv === editingEmployee.manv ? { ...emp, ...submitData } : emp
          )
        );
      } else {
        const response = await employeeAPI.createEmployee(submitData);

        if (response.data.success) {
          // Add new employee to local state
          setEmployees((prev) => [...prev, response.data.data]);
        }
      }

      setShowModal(false);
      resetForm();
    };

    try {
      await showLoadingToast(saveEmployee(), {
        pending: editingEmployee
          ? 'Đang cập nhật nhân viên...'
          : 'Đang tạo nhân viên mới...',
        success: editingEmployee
          ? 'Cập nhật nhân viên thành công!'
          : 'Tạo nhân viên mới thành công!',
        error: 'Có lỗi xảy ra khi lưu nhân viên',
      });
    } catch (error) {
      console.error('Error saving employee:', error);
      if (error.response?.data?.details) {
        // Handle validation errors from backend
        const backendErrors = {};
        error.response.data.details.forEach((detail) => {
          const field = detail.split(' ')[0].toLowerCase();
          backendErrors[field] = detail;
        });
        setErrors(backendErrors);
      } else {
        showValidationError(error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    if (!confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) return;

    const deleteEmployee = async () => {
      await employeeAPI.deleteEmployee(employeeId);

      // Remove employee from local state
      setEmployees((prev) => prev.filter((emp) => emp.manv !== employeeId));
    };

    try {
      await showLoadingToast(deleteEmployee(), {
        pending: 'Đang xóa nhân viên...',
        success: 'Xóa nhân viên thành công!',
        error: 'Có lỗi xảy ra khi xóa nhân viên',
      });
    } catch (error) {
      console.error('Error deleting employee:', error);
      showValidationError(error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  if (loading) {
    return <LoadingSpinner size="large" message="Đang tải dữ liệu..." />;
  }

  return (
    <div className="employees-page">
      <div className="page-header">
        <h1>Quản lý nhân viên</h1>
        <Button
          className="themnv"
          variant="primary"
          onClick={handleAddEmployee}
        >
          Thêm nhân viên
        </Button>
      </div>

      {/* Search */}
      <div className="search-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, số điện thoại, email hoặc chức vụ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Employees Table */}
      <div className="employees-table-container">
        {filteredEmployees.length === 0 ? (
          <div className="no-data">
            <p>Không có nhân viên nào được tìm thấy</p>
          </div>
        ) : (
          <table className="employees-table">
            <thead>
              <tr>
                <th>Tên</th>
                <th>Số điện thoại</th>
                <th>Email</th>
                <th>Chức vụ</th>
                <th>Ca làm việc</th>
                <th>Ngày vào làm</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((employee) => (
                <tr key={employee.manv}>
                  <td>{employee.hoten}</td>
                  <td>{employee.sodienthoai || 'N/A'}</td>
                  <td>{employee.email || 'N/A'}</td>
                  <td>{employee.tenvaitro || 'N/A'}</td>
                  <td>{employee.calam || 'N/A'}</td>
                  <td>
                    {employee.ngayvaolam
                      ? formatDate(employee.ngayvaolam)
                      : 'N/A'}
                  </td>
                  <td>
                    <span
                      className={`status-badge ${
                        employee.is_active ? 'status-active' : 'status-inactive'
                      }`}
                    >
                      {employee.is_active ? 'Hoạt động' : 'Ngừng hoạt động'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <Button
                        variant="edit"
                        onClick={() => handleEditEmployee(employee)}
                      >
                        Sửa
                      </Button>
                      <Button
                        variant="delete"
                        onClick={() => handleDeleteEmployee(employee.manv)}
                      >
                        Xóa
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Employee Form Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingEmployee ? 'Sửa nhân viên' : 'Thêm nhân viên mới'}
      >
        <div className="employee-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="hoten">Họ tên *</label>
              <input
                type="text"
                id="hoten"
                name="hoten"
                value={employeeForm.hoten}
                onChange={handleFormChange}
                className={errors.hoten ? 'error' : ''}
                placeholder="Nhập họ và tên"
              />
              {errors.hoten && (
                <span className="error-text">{errors.hoten}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="sodienthoai">Số điện thoại</label>
              <input
                type="tel"
                id="sodienthoai"
                name="sodienthoai"
                value={employeeForm.sodienthoai}
                onChange={handleFormChange}
                className={errors.sodienthoai ? 'error' : ''}
                placeholder="0123456789"
              />
              {errors.sodienthoai && (
                <span className="error-text">{errors.sodienthoai}</span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={employeeForm.email}
              onChange={handleFormChange}
              className={errors.email ? 'error' : ''}
              placeholder="email@example.com"
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="tendangnhap">
                Tên đăng nhập {!editingEmployee && '*'}
              </label>
              <input
                type="text"
                id="tendangnhap"
                name="tendangnhap"
                value={employeeForm.tendangnhap}
                onChange={handleFormChange}
                className={errors.tendangnhap ? 'error' : ''}
                placeholder="Nhập tên đăng nhập"
                disabled={!!editingEmployee}
              />
              {errors.tendangnhap && (
                <span className="error-text">{errors.tendangnhap}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="matkhau">
                Mật khẩu {!editingEmployee && '*'}
              </label>
              <input
                type="password"
                id="matkhau"
                name="matkhau"
                value={employeeForm.matkhau}
                onChange={handleFormChange}
                className={errors.matkhau ? 'error' : ''}
                placeholder={
                  editingEmployee
                    ? 'Để trống nếu không thay đổi'
                    : 'Nhập mật khẩu'
                }
              />
              {errors.matkhau && (
                <span className="error-text">{errors.matkhau}</span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="mavaitro">Chức vụ *</label>
              <select
                id="mavaitro"
                name="mavaitro"
                value={employeeForm.mavaitro}
                onChange={handleFormChange}
                className={errors.mavaitro ? 'error' : ''}
              >
                <option value="">Chọn chức vụ</option>
                {roles.map((role) => (
                  <option key={role.mavaitro} value={role.mavaitro}>
                    {role.tenvaitro}
                  </option>
                ))}
              </select>
              {errors.mavaitro && (
                <span className="error-text">{errors.mavaitro}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="calam">Ca làm việc</label>
              <input
                type="text"
                id="calam"
                name="calam"
                value={employeeForm.calam}
                onChange={handleFormChange}
                placeholder="VD: Sáng (6:00-14:00)"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="is_active"
                checked={employeeForm.is_active}
                onChange={handleFormChange}
              />
              <span className="checkbox-text">Nhân viên đang hoạt động</span>
            </label>
          </div>

          <div className="modal-actions">
            <Button
              variant="secondary"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
            >
              Hủy
            </Button>
            <Button
              className="themnvmodal"
              variant="primary"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting
                ? 'Đang lưu...'
                : editingEmployee
                ? 'Cập nhật'
                : 'Thêm mới'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EmployeesPage;
