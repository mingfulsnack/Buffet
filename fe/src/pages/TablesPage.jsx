import React, { useState, useEffect } from 'react';
import { tableAPI } from '../services/api';
import Modal from '../components/Modal';
import Button from '../components/Button';
import {
  showLoadingToast,
  showValidationError,
} from '../utils/toast';
import './TablesPage.scss';

const TablesPage = () => {
  const [tablesByArea, setTablesByArea] = useState([]);
  const [allTables, setAllTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [areas, setAreas] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [formData, setFormData] = useState({
    tenban: '',
    mavung: '',
    soghe: '',
    vitri: '',
    ghichu: '',
    trangthai: '',
  });

  // Danh sách trạng thái bàn
  const tableStatuses = [
    { value: 'Trong', label: 'Trống' },
    { value: 'DaDat', label: 'Đang đặt trước' },
    { value: 'DangSuDung', label: 'Đang được sử dụng' },
  ];

  // Mapping trạng thái từ backend sang hiển thị
  const getStatusDisplay = (table) => {
    switch (table.trangthai) {
      case 'Trong':
        return { text: 'Trống', class: 'status-empty' };
      case 'DaDat':
        return { text: 'Đang đặt trước', class: 'status-reserved' };
      case 'DangSuDung':
        return { text: 'Đang được sử dụng', class: 'status-occupied' };
      default:
        return { text: table.trangthai || 'Trống', class: 'status-empty' };
    }
  };

  // Load danh sách bàn
  const loadTables = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await tableAPI.getTables();

      if (response.data.success) {
        console.log('Tables API response:', response.data);
        console.log('Tables data structure:', response.data.data);
        const areas = response.data.data;
        setTablesByArea(areas);

        // Flatten tất cả bàn từ tất cả vùng để tính thống kê
        const flatTables = areas.reduce((acc, area) => {
          console.log('Processing area:', area);
          return acc.concat(area.tables);
        }, []);
        setAllTables(flatTables);
        console.log('Flattened tables:', flatTables);
        console.log('Sample table structure:', flatTables[0]);
      } else {
        setError(response.data.message || 'Không thể tải danh sách bàn');
      }
    } catch (err) {
      console.error('Error loading tables:', err);
      setError('Lỗi khi tải danh sách bàn');
    } finally {
      setLoading(false);
    }
  };

  // Load danh sách vùng
  const loadAreas = async () => {
    try {
      console.log('Loading areas...');
      const response = await tableAPI.getAreas();
      console.log('Areas API response:', response.data);
      if (response.data.success) {
        console.log('Areas data:', response.data.data);
        setAreas(response.data.data);
      } else {
        console.error('Failed to load areas:', response.data.message);
      }
    } catch (err) {
      console.error('Error loading areas:', err);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      tenban: '',
      mavung: '',
      soghe: '',
      vitri: '',
      ghichu: '',
      trangthai: 'Trong',
    });
    setEditingTable(null);
  };

  // Mở modal thêm bàn
  const handleAddTable = async () => {
    // Đảm bảo areas đã được load
    if (areas.length === 0) {
      await loadAreas();
    }
    resetForm();
    setIsModalOpen(true);
  };

  // Mở modal sửa bàn
  const handleEditTable = async (table, area) => {
    console.log('Editing table:', table);
    console.log('Table area:', area);
    console.log('Available areas:', areas);

    // Đảm bảo areas đã được load
    if (areas.length === 0) {
      console.log('Areas not loaded, loading now...');
      await loadAreas();
    }

    const formDataToSet = {
      tenban: table.tenban,
      mavung: area.mavung,
      soghe: table.soghe,
      vitri: table.vitri || '',
      ghichu: table.ghichu || '',
      trangthai: table.trangthai,
    };

    console.log('Setting form data:', formDataToSet);
    setFormData(formDataToSet);
    setEditingTable(table);
    setIsModalOpen(true);
  };

  // Xử lý thay đổi form
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Lưu bàn (tạo mới hoặc cập nhật)
  const handleSaveTable = async (e) => {
    e.preventDefault();

    const saveOperation = async () => {
      const tableData = {
        ...formData,
        soghe: parseInt(formData.soghe),
        mavung: parseInt(formData.mavung),
      };

      if (editingTable) {
        // Kiểm tra xem có thay đổi trạng thái không
        const oldStatus = editingTable.trangthai;
        const newStatus = formData.trangthai;

        if (oldStatus !== newStatus) {
          // Cập nhật trạng thái riêng
          await tableAPI.updateStatus(editingTable.maban, {
            trangthai: newStatus,
            version: editingTable.version || 1,
          });
        }

        // Cập nhật thông tin bàn
        await tableAPI.updateTable(editingTable.maban, tableData);
      } else {
        await tableAPI.createTable(tableData);
      }

      setIsModalOpen(false);
      resetForm();
      loadTables();
    };

    try {
      await showLoadingToast(saveOperation(), {
        pending: editingTable ? 'Đang cập nhật bàn...' : 'Đang tạo bàn mới...',
        success: editingTable
          ? 'Cập nhật bàn thành công!'
          : 'Tạo bàn mới thành công!',
        error: 'Có lỗi xảy ra khi lưu bàn',
      });
    } catch (err) {
      console.error('Error saving table:', err);
      showValidationError(err);
    }
  };

  // Xóa bàn
  const handleDeleteTable = async (table) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa bàn ${table.tenban}?`)) {
      const deleteOperation = async () => {
        await tableAPI.deleteTable(table.maban);
        loadTables();
      };

      try {
        await showLoadingToast(deleteOperation(), {
          pending: 'Đang xóa bàn...',
          success: 'Xóa bàn thành công!',
          error: 'Có lỗi xảy ra khi xóa bàn',
        });
      } catch (err) {
        console.error('Error deleting table:', err);
        showValidationError(err);
      }
    }
  };

  useEffect(() => {
    loadTables();
    loadAreas();
  }, []);

  if (loading) {
    return (
      <div className="tables-page">
        <div className="loading">Đang tải danh sách bàn...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tables-page">
        <div className="error">
          <p>{error}</p>
          <button onClick={loadTables} className="btn btn-primary">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tables-page">
      <div className="page-header">
        <div className="header-top">
          <h1>Quản lý bàn</h1>
          <Button onClick={handleAddTable} className="btn-primary">
            + Thêm bàn
          </Button>
        </div>
        <div className="stats">
          <div className="stat-item">
            <span className="stat-label">Tổng số bàn:</span>
            <span className="stat-value">{allTables.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Trống:</span>
            <span className="stat-value">
              {allTables.filter((t) => t.trangthai === 'Trong').length}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Đang đặt:</span>
            <span className="stat-value">
              {allTables.filter((t) => t.trangthai === 'DaDat').length}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Đang sử dụng:</span>
            <span className="stat-value">
              {allTables.filter((t) => t.trangthai === 'DangSuDung').length}
            </span>
          </div>
        </div>
      </div>

      <div className="tables-content">
        <div className="tables-table-container">
          <table className="tables-table">
            <thead>
              <tr>
                <th>Tên bàn</th>
                <th>Vùng</th>
                <th>Số ghế</th>
                <th>Trạng thái</th>
                <th>Ghi chú</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {tablesByArea.map((area) =>
                area.tables.map((table, index) => {
                  const status = getStatusDisplay(table);
                  return (
                    <tr key={table.maban || `${area.mavung}-table-${index}`}>
                      <td className="table-name">
                        <strong>{table.tenban}</strong>
                      </td>
                      <td className="table-area">{area.tenvung}</td>
                      <td className="table-seats">
                        <span className="seat-count">{table.soghe}</span>
                      </td>
                      <td className="table-status">
                        <span className={`status-badge ${status.class}`}>
                          {status.text}
                        </span>
                      </td>
                      <td className="table-notes">{table.ghichu || '-'}</td>
                      <td className="table-actions">
                        <div className="action-buttons">
                          <Button
                            onClick={() => handleEditTable(table, area)}
                            variant="edit"
                          >
                            Sửa
                          </Button>
                          <Button
                            onClick={() => handleDeleteTable(table)}
                            variant="delete"
                          >
                            Xóa
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {allTables.length === 0 && (
            <div className="no-data">
              <p>Chưa có bàn nào được tạo</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal thêm/sửa bàn */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingTable ? 'Sửa thông tin bàn' : 'Thêm bàn mới'}
      >
        <form onSubmit={handleSaveTable} className="table-form">
          {/* Debug info */}
          {import.meta.env.DEV && (
            <div
              style={{
                background: '#f0f0f0',
                padding: '10px',
                marginBottom: '10px',
                fontSize: '12px',
              }}
            >
              <strong>Debug:</strong>
              <br />
              Form Data: {JSON.stringify(formData, null, 2)}
              <br />
              Areas: {areas.length} items
              <br />
              Editing: {editingTable ? editingTable.maban : 'None'}
            </div>
          )}
          <div className="form-group">
            <label htmlFor="tenban">Tên bàn *</label>
            <input
              type="text"
              id="tenban"
              name="tenban"
              value={formData.tenban}
              onChange={handleFormChange}
              placeholder="VD: B01, VIP01..."
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="mavung">Vùng *</label>
            <select
              id="mavung"
              name="mavung"
              value={formData.mavung}
              onChange={handleFormChange}
              required
            >
              <option value="">-- Chọn vùng --</option>
              {areas.map((area) => (
                <option key={area.mavung} value={area.mavung}>
                  {area.tenvung}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="soghe">Số ghế *</label>
            <input
              type="number"
              id="soghe"
              name="soghe"
              value={formData.soghe}
              onChange={handleFormChange}
              min="1"
              max="20"
              placeholder="VD: 4, 6, 8..."
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="vitri">Vị trí</label>
            <input
              type="text"
              id="vitri"
              name="vitri"
              value={formData.vitri}
              onChange={handleFormChange}
              placeholder="VD: Gần cửa sổ, Góc phòng..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="ghichu">Ghi chú</label>
            <textarea
              id="ghichu"
              name="ghichu"
              value={formData.ghichu}
              onChange={handleFormChange}
              rows="3"
              placeholder="Ghi chú thêm về bàn..."
            />
          </div>

          {editingTable && (
            <div className="form-group">
              <label htmlFor="trangthai">Trạng thái *</label>
              <select
                id="trangthai"
                name="trangthai"
                value={formData.trangthai}
                onChange={handleFormChange}
                required
              >
                {tableStatuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-actions">
            <Button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              className="btn-secondary"
            >
              Hủy
            </Button>
            <Button type="submit" className="btn-primary">
              {editingTable ? 'Cập nhật' : 'Tạo bàn'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TablesPage;
