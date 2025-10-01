import React, { useState, useEffect, useRef } from 'react';
import { menuAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import MenuItemDetailModal from '../../components/menu/MenuItemDetailModal';
import './MenuPage.scss';

const MenuPage = () => {
  const [activeTab, setActiveTab] = useState('dishes');
  const [dishes, setDishes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [buffetSets, setBuffetSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [buffetSearchTerm, setBuffetSearchTerm] = useState('');
  const [selectedBuffetCategory, setSelectedBuffetCategory] = useState('');
  const [buffetCategories, setBuffetCategories] = useState([]);

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

  useEffect(() => {
    const loadInitialData = async () => {
      // Prevent multiple calls
      if (hasLoadedData.current) return;

      hasLoadedData.current = true;
      setLoading(true);

      try {
        console.log('Loading public menu data...');
        const publicMenuResponse = await menuAPI.getPublicMenu();
        console.log('Public menu response:', publicMenuResponse);

        if (publicMenuResponse.data.success) {
          const publicData = publicMenuResponse.data.data;

          // Process dishes from categories
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

          // Get buffet categories from public menu data
          const buffetCategoriesData = publicData.danh_muc_buffet || [];
          setBuffetCategories(buffetCategoriesData);

          // Add category names to buffet sets
          const buffetSetsWithCategories = (publicData.set_buffet || []).map(
            (set) => {
              const category = buffetCategoriesData.find(
                (cat) => cat.madanhmuc === set.madanhmuc
              );
              return {
                ...set,
                tendanhmuc: category ? category.tendanhmuc : '',
              };
            }
          );

          console.log(
            'Processed buffet sets with categories:',
            buffetSetsWithCategories
          );
          setBuffetSets(buffetSetsWithCategories);
        }
      } catch (error) {
        console.error('Error loading public menu data:', error);
        console.error('Error details:', error.response?.data);
        setDishes([]);
        setCategories([]);
        setBuffetSets([]);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []); // Only run once

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

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  if (loading) {
    return <LoadingSpinner size="large" message="Đang tải thực đơn..." />;
  }

  return (
    <div className="user-menu-page">
      <div className="page-header">
        <h1>Thực đơn nhà hàng</h1>
        <p className="subtitle">
          Khám phá các món ăn ngon và set buffet hấp dẫn
        </p>
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
                      style={{ cursor: 'pointer', color: '#3498db', fontWeight: '500' }}
                    >
                      {dish.tenmon}
                    </td>
                    <td className="dish-note">{dish.ghichu || '-'}</td>
                    <td className="dish-price">{formatPrice(dish.dongia)}</td>
                    <td className="dish-category">
                      {dish.tendanhmuc ? (
                        <span className="category-badge">
                          {dish.tendanhmuc}
                        </span>
                      ) : (
                        '-'
                      )}
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
                      style={{ cursor: 'pointer', color: '#3498db', fontWeight: '500' }}
                    >
                      {set.tenset}
                    </td>
                    <td className="set-category">
                      {set.tendanhmuc ? (
                        <span className="category-badge">{set.tendanhmuc}</span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="set-price">{formatPrice(set.dongia)}</td>
                    <td className="set-time">
                      {set.thoigian_batdau && set.thoigian_ketthuc ? (
                        <span className="time-badge">
                          {set.thoigian_batdau} - {set.thoigian_ketthuc}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="set-description">{set.mota || '-'}</td>
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

export default MenuPage;
