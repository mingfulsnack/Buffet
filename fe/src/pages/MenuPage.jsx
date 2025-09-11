import React, { useState, useEffect, useRef } from 'react';
import { menuAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import Modal from '../components/Modal';
import DishForm from '../components/menu/DishForm';
import CategoryForm from '../components/menu/CategoryForm';
import BuffetSetForm from '../components/menu/BuffetSetForm';
import './MenuPage.scss';

const MenuPage = () => {
  const { isAuthenticated, isAdmin } = useAuth();
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
  const [modalType, setModalType] = useState(''); // 'dish', 'category', 'buffet'
  const [editingItem, setEditingItem] = useState(null);

  // Prevent multiple API calls
  const hasLoadedData = useRef(false);
  const isAdminUser = isAuthenticated() && isAdmin();

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

  // These functions are no longer needed since we load all data from public menu

  useEffect(() => {
    const loadInitialData = async () => {
      // Prevent multiple calls
      if (hasLoadedData.current) return;

      hasLoadedData.current = true;
      setLoading(true);

      try {
        console.log('Loading initial data...');
        const publicMenuResponse = await menuAPI.getPublicMenu();
        console.log('Public menu response:', publicMenuResponse);

        if (publicMenuResponse.data.success) {
          const publicData = publicMenuResponse.data.data;

          // Extract dishes from categories
          const allDishes = [];
          if (publicData.danh_muc && Array.isArray(publicData.danh_muc)) {
            publicData.danh_muc.forEach((category) => {
              if (category.mon_an && Array.isArray(category.mon_an)) {
                category.mon_an.forEach((dish) => {
                  allDishes.push({ ...dish, tendanhmuc: category.tendanhmuc });
                });
              }
            });
          }

          setDishes(allDishes);
          setCategories(publicData.danh_muc || []);

          // Load buffet categories and detailed buffet sets if admin
          if (isAdminUser) {
            console.log('Loading admin buffet data...');
            const [buffetCategoriesResponse, buffetSetsResponse] =
              await Promise.all([
                menuAPI.getBuffetCategories(),
                menuAPI.getBuffetSets(),
              ]);

            console.log(
              'Buffet categories response:',
              buffetCategoriesResponse
            );
            console.log('Buffet sets response:', buffetSetsResponse);

            if (buffetCategoriesResponse.data.success) {
              setBuffetCategories(buffetCategoriesResponse.data.data);
            }

            if (buffetSetsResponse.data.success) {
              setBuffetSets(buffetSetsResponse.data.data);
            } else {
              setBuffetSets(publicData.set_buffet || []);
            }
          } else {
            setBuffetSets(publicData.set_buffet || []);
          }
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
        console.error('Error details:', error.response?.data);
        // Set empty data on error to prevent infinite loading
        setDishes([]);
        setCategories([]);
        setBuffetSets([]);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [isAdminUser]); // Include isAdminUser as dependency

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

    try {
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
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      alert(
        `Có lỗi xảy ra khi xóa ${
          type === 'dish'
            ? 'món ăn'
            : type === 'buffet'
            ? 'set buffet'
            : 'danh mục'
        }`
      );
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setModalType('');
    setEditingItem(null);
  };

  const handleSaveSuccess = async (savedItem) => {
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
    }
    handleModalClose();
  };

  if (loading) {
    return <LoadingSpinner size="large" message="Đang tải dữ liệu..." />;
  }

  return (
    <div className="menu-page">
      <div className="page-header">
        <h1>{isAdminUser ? 'Quản lý thực đơn' : 'Thực đơn nhà hàng'}</h1>
        {isAdminUser && (
          <div className="admin-actions">
            <Button
              className="themcate"
              variant="primary"
              onClick={() => handleAddItem('category')}
            >
              Thêm danh mục
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
        )}
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
          Set buffet (
          {isAdminUser ? filteredBuffetSets.length : buffetSets.length})
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
                  {isAdminUser && <th>Thao tác</th>}
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
                        />
                      ) : (
                        <div className="no-image">Không có ảnh</div>
                      )}
                    </td>
                    <td className="dish-name">{dish.tenmon}</td>
                    <td className="dish-note">{dish.ghichu || '-'}</td>
                    <td className="dish-price">{formatPrice(dish.dongia)}</td>
                    <td className="dish-category">{dish.tendanhmuc}</td>
                    {isAdminUser && (
                      <td className="dish-actions">
                        <Button
                          variant="info"
                          size="sm"
                          onClick={() => handleEditItem('dish', dish)}
                        >
                          Sửa
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteItem('dish', dish.mamon)}
                        >
                          Xóa
                        </Button>
                      </td>
                    )}
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
          {isAdminUser && (
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
          )}

          <div className="buffet-sets-table">
            <table>
              <thead>
                <tr>
                  <th>Hình ảnh</th>
                  <th>Tên set</th>
                  {isAdminUser && <th>Danh mục</th>}
                  <th>Giá</th>
                  <th>Thời gian phục vụ</th>
                  <th>Mô tả</th>
                  {isAdminUser && <th>Thao tác</th>}
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
                        />
                      ) : (
                        <div className="no-image">Không có ảnh</div>
                      )}
                    </td>
                    <td className="set-name">{set.tenset}</td>
                    {isAdminUser && (
                      <td className="set-category">{set.tendanhmuc || '-'}</td>
                    )}
                    <td className="set-price">{formatPrice(set.dongia)}</td>
                    <td className="set-time">
                      {set.thoigian_batdau && set.thoigian_ketthuc
                        ? `${set.thoigian_batdau} - ${set.thoigian_ketthuc}`
                        : '-'}
                    </td>
                    <td className="set-description">{set.mota || '-'}</td>
                    {isAdminUser && (
                      <td className="set-actions">
                        <Button
                          variant="info"
                          size="sm"
                          onClick={() => handleEditItem('buffet', set)}
                        >
                          Sửa
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteItem('buffet', set.maset)}
                        >
                          Xóa
                        </Button>
                      </td>
                    )}
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
      {isAdminUser && (
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
                    : 'danh mục'
                }`
              : `Thêm ${
                  modalType === 'dish'
                    ? 'món ăn'
                    : modalType === 'buffet'
                    ? 'set buffet'
                    : 'danh mục'
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
            <CategoryForm
              editingCategory={editingItem}
              onSave={handleSaveSuccess}
              onCancel={handleModalClose}
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
      )}
    </div>
  );
};

export default MenuPage;
