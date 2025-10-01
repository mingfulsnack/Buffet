import React, { useState, useEffect, useRef, useCallback } from 'react';
import { menuAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import DishForm from '../../components/menu/DishForm';
import CategoryForm from '../../components/menu/CategoryForm';
import CategoryFormContent from '../../components/menu/CategoryFormContent';
import BuffetSetForm from '../../components/menu/BuffetSetForm';
import MenuItemDetailModal from '../../components/menu/MenuItemDetailModal';
import {
  showSuccess,
  showLoadingToast,
  showValidationError,
} from '../../utils/toast';
import './AdminMenuPage.scss';

const AdminMenuPage = () => {
  const [activeTab, setActiveTab] = useState('dishes');
  const [dishes, setDishes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [buffetSets, setBuffetSets] = useState([]);
  const [buffetCategories, setBuffetCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [buffetSearchTerm, setBuffetSearchTerm] = useState('');
  const [selectedBuffetCategory, setSelectedBuffetCategory] = useState('');

  // Admin states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'dish', 'category', 'buffet', 'buffet-category'
  const [editingItem, setEditingItem] = useState(null);

  // Detail modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [detailType, setDetailType] = useState(''); // 'dish' or 'buffet'

  // Prevent multiple API calls
  const hasLoadedData = useRef(false);

  // Handle tab change to reset search/filter
  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    if (tabName === 'dishes') {
      setSearchTerm('');
      setSelectedCategory('');
    } else if (tabName === 'buffet-sets') {
      setBuffetSearchTerm('');
      setSelectedBuffetCategory('');
    }
  };

  // Load dishes from API
  const loadDishes = useCallback(async () => {
    try {
      // Set limit to 100 to get all dishes
      const response = await menuAPI.getDishes({ limit: 100 });
      if (response.data.success) {
        setDishes(response.data.data);
      }
    } catch (error) {
      console.error('Error loading dishes:', error);
      setDishes([]);
    }
  }, []);

  // Load categories from API
  const loadCategories = useCallback(async () => {
    try {
      const response = await menuAPI.getCategories();
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    }
  }, []);

  // Load buffet sets from API
  const loadBuffetSets = useCallback(async () => {
    try {
      // Set limit to 100 to get all buffet sets
      const response = await menuAPI.getBuffetSets({ limit: 100 });
      if (response.data.success) {
        setBuffetSets(response.data.data);
      }
    } catch (error) {
      console.error('Error loading buffet sets:', error);
      setBuffetSets([]);
    }
  }, []);

  // Load buffet categories
  const loadBuffetCategories = useCallback(async () => {
    try {
      const response = await menuAPI.getBuffetCategories();
      if (response.data.success) {
        setBuffetCategories(response.data.data);
      }
    } catch (error) {
      console.error('Error loading buffet categories:', error);
      setBuffetCategories([]);
    }
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      // Prevent multiple calls
      if (hasLoadedData.current) return;

      hasLoadedData.current = true;
      setLoading(true);

      try {
        console.log('Loading admin menu data...');
        await Promise.all([
          loadDishes(),
          loadCategories(),
          loadBuffetSets(),
          loadBuffetCategories(),
        ]);
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [loadDishes, loadCategories, loadBuffetSets, loadBuffetCategories]);

  // Filter dishes based on search and category
  const filteredDishes = dishes.filter((dish) => {
    const matchesSearch =
      !searchTerm ||
      dish.tenmon.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dish.ghichu?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      !selectedCategory || dish.madanhmuc?.toString() === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Filter buffet sets based on search and category
  const filteredBuffetSets = buffetSets.filter((set) => {
    const matchesSearch =
      !buffetSearchTerm ||
      set.tenset.toLowerCase().includes(buffetSearchTerm.toLowerCase()) ||
      set.mota?.toLowerCase().includes(buffetSearchTerm.toLowerCase());

    const matchesCategory =
      !selectedBuffetCategory ||
      set.madanhmuc?.toString() === selectedBuffetCategory;

    return matchesSearch && matchesCategory;
  });

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  // Admin handlers
  const handleAddItem = (type) => {
    setModalType(type);
    setEditingItem(null);
    setShowModal(true);
  };

  const handleEditItem = (type, item) => {
    setModalType(type);
    setEditingItem(item);
    setShowModal(true);
  };

  const handleDeleteItem = async (type, id) => {
    if (!confirm('Bạn có chắc chắn muốn xóa?')) return;

    const deleteOperation = async () => {
      if (type === 'dish') {
        await menuAPI.deleteDish(id);
        setDishes((prev) => prev.filter((dish) => dish.mamon !== id));
      } else if (type === 'buffet') {
        await menuAPI.deleteBuffetSet(id);
        setBuffetSets((prev) => prev.filter((set) => set.maset !== id));
      } else if (type === 'category') {
        await menuAPI.deleteCategory(id);
        setCategories((prev) => prev.filter((cat) => cat.madanhmuc !== id));
        // Reset selected category if it was deleted
        if (selectedCategory === id.toString()) {
          setSelectedCategory('');
        }
      }
    };

    const typeNames = {
      dish: 'món ăn',
      buffet: 'set buffet',
      category: 'danh mục',
    };

    try {
      await showLoadingToast(deleteOperation(), {
        pending: `Đang xóa ${typeNames[type]}...`,
        success: `Xóa ${typeNames[type]} thành công!`,
        error: `Có lỗi xảy ra khi xóa ${typeNames[type]}`,
      });
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      showValidationError(error);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setModalType('');
    setEditingItem(null);
  };

  // Detail modal handlers
  const handleViewDetail = (type, item) => {
    setDetailType(type);
    setDetailItem(item);
    setShowDetailModal(true);
  };

  const handleDetailModalClose = () => {
    setShowDetailModal(false);
    setDetailItem(null);
    setDetailType('');
  };

  const handleSaveSuccess = async (savedItem) => {
    const typeNames = {
      dish: editingItem
        ? 'Cập nhật món ăn thành công!'
        : 'Thêm món ăn thành công!',
      buffet: editingItem
        ? 'Cập nhật set buffet thành công!'
        : 'Thêm set buffet thành công!',
      category: editingItem
        ? 'Cập nhật danh mục thành công!'
        : 'Thêm danh mục thành công!',
      'buffet-category': editingItem
        ? 'Cập nhật danh mục buffet thành công!'
        : 'Thêm danh mục buffet thành công!',
    };

    if (modalType === 'dish') {
      if (editingItem) {
        setDishes((prev) =>
          prev.map((dish) =>
            dish.mamon === savedItem.mamon ? savedItem : dish
          )
        );
      } else {
        setDishes((prev) => [...prev, savedItem]);
      }
    } else if (modalType === 'buffet') {
      // Reload buffet sets to get updated data with category info
      try {
        const response = await menuAPI.getBuffetSets();
        if (response.data.success) {
          setBuffetSets(response.data.data);
        }
      } catch (error) {
        console.error('Error reloading buffet sets:', error);
      }
    } else if (modalType === 'category') {
      if (editingItem) {
        setCategories((prev) =>
          prev.map((cat) =>
            cat.madanhmuc === savedItem.madanhmuc ? savedItem : cat
          )
        );
      } else {
        setCategories((prev) => [...prev, savedItem]);
      }
    } else if (modalType === 'buffet-category') {
      if (editingItem) {
        setBuffetCategories((prev) =>
          prev.map((cat) =>
            cat.madanhmuc === savedItem.madanhmuc ? savedItem : cat
          )
        );
      } else {
        setBuffetCategories((prev) => [...prev, savedItem]);
      }
    }

    showSuccess(typeNames[modalType]);
    handleModalClose();
  };

  if (loading) {
    return <LoadingSpinner size="large" message="Đang tải dữ liệu..." />;
  }

  return (
    <div className="admin-menu-page">
      <div className="page-header">
        <h1>Quản lý thực đơn</h1>
        <div className="admin-actions">
          <Button
            className="themcate"
            variant="primary"
            onClick={() =>
              handleAddItem(
                activeTab === 'dishes' ? 'category' : 'buffet-category'
              )
            }
          >
            {activeTab === 'dishes'
              ? 'Thêm danh mục món ăn'
              : 'Thêm danh mục buffet'}
          </Button>
          <Button
            className="theman"
            onClick={() =>
              handleAddItem(activeTab === 'dishes' ? 'dish' : 'buffet')
            }
          >
            {activeTab === 'dishes' ? 'Thêm món ăn' : 'Thêm set buffet'}
          </Button>
        </div>
      </div>

      <div className="menu-tabs">
        <button
          className={`tab-button ${activeTab === 'dishes' ? 'active' : ''}`}
          onClick={() => handleTabChange('dishes')}
        >
          Món ăn ({filteredDishes.length})
        </button>
        <button
          className={`tab-button ${
            activeTab === 'buffet-sets' ? 'active' : ''
          }`}
          onClick={() => handleTabChange('buffet-sets')}
        >
          Set buffet ({filteredBuffetSets.length})
        </button>
      </div>

      {activeTab === 'dishes' && (
        <div className="dishes-section">
          <div className="filters">
            <div className="search-box">
              <input
                type="text"
                placeholder="Tìm kiếm món ăn..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((category) => (
                <option key={category.madanhmuc} value={category.madanhmuc}>
                  {category.tendanhmuc}
                </option>
              ))}
            </select>
          </div>

          <div className="dishes-table">
            <table>
              <thead>
                <tr>
                  <th>Hình ảnh</th>
                  <th>Tên món</th>
                  <th>Ghi chú</th>
                  <th>Giá</th>
                  <th>Danh mục</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredDishes.map((dish) => (
                  <tr key={dish.mamon}>
                    <td className="dish-image-cell">
                      {dish.image ? (
                        <img
                          src={dish.image}
                          alt={dish.tenmon}
                          className="dish-image"
                          onClick={() => handleViewDetail('dish', dish)}
                          style={{ cursor: 'pointer' }}
                        />
                      ) : (
                        <div 
                          className="no-image"
                          onClick={() => handleViewDetail('dish', dish)}
                          style={{ cursor: 'pointer' }}
                        >
                          Không có ảnh
                        </div>
                      )}
                    </td>
                    <td 
                      className="dish-name"
                      onClick={() => handleViewDetail('dish', dish)}
                      style={{ cursor: 'pointer', color: '#3498db' }}
                    >
                      {dish.tenmon}
                    </td>
                    <td className="dish-note">{dish.ghichu || '-'}</td>
                    <td className="dish-price">{formatPrice(dish.dongia)}</td>
                    <td className="dish-category">{dish.tendanhmuc}</td>
                    <td className="dish-actions">
                      <Button
                        variant="edit"
                        onClick={() => handleEditItem('dish', dish)}
                      >
                        Sửa
                      </Button>
                      <Button
                        variant="delete"
                        onClick={() => handleDeleteItem('dish', dish.mamon)}
                      >
                        Xóa
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredDishes.length === 0 && (
              <div className="no-dishes">Không tìm thấy món ăn nào</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'buffet-sets' && (
        <div className="buffet-sets-section">
          <div className="filters">
            <div className="search-box">
              <input
                type="text"
                placeholder="Tìm kiếm set buffet..."
                value={buffetSearchTerm}
                onChange={(e) => setBuffetSearchTerm(e.target.value)}
              />
            </div>
            <select
              value={selectedBuffetCategory}
              onChange={(e) => setSelectedBuffetCategory(e.target.value)}
            >
              <option value="">Tất cả danh mục</option>
              {buffetCategories.map((category) => (
                <option key={category.madanhmuc} value={category.madanhmuc}>
                  {category.tendanhmuc}
                </option>
              ))}
            </select>
          </div>

          <div className="buffet-sets-table">
            <table>
              <thead>
                <tr>
                  <th>Hình ảnh</th>
                  <th>Tên set</th>
                  <th>Danh mục</th>
                  <th>Giá</th>
                  <th>Thời gian phục vụ</th>
                  <th>Mô tả</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredBuffetSets.map((set) => (
                  <tr key={set.maset}>
                    <td className="set-image-cell">
                      {set.image ? (
                        <img
                          src={set.image}
                          alt={set.tenset}
                          className="set-image"
                          onClick={() => handleViewDetail('buffet', set)}
                          style={{ cursor: 'pointer' }}
                        />
                      ) : (
                        <div 
                          className="no-image"
                          onClick={() => handleViewDetail('buffet', set)}
                          style={{ cursor: 'pointer' }}
                        >
                          Không có ảnh
                        </div>
                      )}
                    </td>
                    <td 
                      className="set-name"
                      onClick={() => handleViewDetail('buffet', set)}
                      style={{ cursor: 'pointer', color: '#3498db' }}
                    >
                      {set.tenset}
                    </td>
                    <td className="set-category">{set.tendanhmuc || '-'}</td>
                    <td className="set-price">{formatPrice(set.dongia)}</td>
                    <td className="set-time">
                      {set.thoigian_batdau && set.thoigian_ketthuc
                        ? `${set.thoigian_batdau} - ${set.thoigian_ketthuc}`
                        : '-'}
                    </td>
                    <td className="set-description">{set.mota || '-'}</td>
                    <td className="set-actions">
                      <Button
                        variant="edit"
                        onClick={() => handleEditItem('buffet', set)}
                      >
                        Sửa
                      </Button>
                      <Button
                        variant="delete"
                        onClick={() => handleDeleteItem('buffet', set.maset)}
                      >
                        Xóa
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredBuffetSets.length === 0 && (
              <div className="no-buffet-sets">
                {buffetSearchTerm || selectedBuffetCategory
                  ? 'Không tìm thấy set buffet nào phù hợp'
                  : 'Hiện tại chưa có set buffet nào'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin Modal for Add/Edit */}
      <Modal
        isOpen={showModal}
        onClose={handleModalClose}
        title={
          editingItem
            ? `Sửa ${
                modalType === 'dish'
                  ? 'món ăn'
                  : modalType === 'buffet'
                  ? 'set buffet'
                  : modalType === 'category'
                  ? 'danh mục món ăn'
                  : 'danh mục buffet'
              }`
            : `Thêm ${
                modalType === 'dish'
                  ? 'món ăn'
                  : modalType === 'buffet'
                  ? 'set buffet'
                  : modalType === 'category'
                  ? 'danh mục món ăn'
                  : 'danh mục buffet'
              } mới`
        }
      >
        {modalType === 'dish' && (
          <DishForm
            categories={categories}
            editingDish={editingItem}
            onSave={handleSaveSuccess}
            onCancel={handleModalClose}
          />
        )}
        {modalType === 'category' && (
          <CategoryFormContent
            editingCategory={editingItem}
            onSave={handleSaveSuccess}
            onCancel={handleModalClose}
            type="category"
          />
        )}
        {modalType === 'buffet-category' && (
          <CategoryFormContent
            editingCategory={editingItem}
            onSave={handleSaveSuccess}
            onCancel={handleModalClose}
            type="buffet-category"
          />
        )}
        {modalType === 'buffet' && (
          <BuffetSetForm
            editingSet={editingItem}
            buffetCategories={buffetCategories}
            onSave={handleSaveSuccess}
            onCancel={handleModalClose}
          />
        )}
      </Modal>

      {/* Detail Modal */}
      <MenuItemDetailModal
        isOpen={showDetailModal}
        onClose={handleDetailModalClose}
        item={detailItem}
        type={detailType}
      />
    </div>
  );
};

export default AdminMenuPage;
