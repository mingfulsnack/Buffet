import React, { useState, useEffect, useRef } from 'react';
import { menuAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import './MenuPage.scss';

const MenuPage = () => {
  const [activeTab, setActiveTab] = useState('dishes');
  const [dishes, setDishes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [buffetSets, setBuffetSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Prevent multiple API calls
  const hasLoadedData = useRef(false);

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
                  allDishes.push({...dish, tendanhmuc: category.tendanhmuc});
                });
              }
            });
          }

          setDishes(allDishes);
          setCategories(publicData.danh_muc || []);
          setBuffetSets(publicData.set_buffet || []);
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
  }, []); // Empty dependency array to run only once

  // Filter dishes based on search and category
  const filteredDishes = dishes.filter(dish => {
    const matchesSearch = !searchTerm || 
      dish.tenmon.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dish.ghichu?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || 
      dish.madanhmuc?.toString() === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  if (loading) {
    return <LoadingSpinner size="large" message="Đang tải dữ liệu..." />;
  }

  return (
    <div className="menu-page">
      <div className="page-header">
        <h1>Thực đơn nhà hàng</h1>
      </div>

      <div className="menu-tabs">
        <button
          className={`tab-button ${activeTab === 'dishes' ? 'active' : ''}`}
          onClick={() => setActiveTab('dishes')}
        >
          Món ăn ({filteredDishes.length})
        </button>
        <button
          className={`tab-button ${
            activeTab === 'buffet-sets' ? 'active' : ''
          }`}
          onClick={() => setActiveTab('buffet-sets')}
        >
          Set buffet ({buffetSets.length})
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
                        <img src={dish.image} alt={dish.tenmon} className="dish-image" />
                      ) : (
                        <div className="no-image">Không có ảnh</div>
                      )}
                    </td>
                    <td className="dish-name">{dish.tenmon}</td>
                    <td className="dish-note">{dish.ghichu || '-'}</td>
                    <td className="dish-price">{formatPrice(dish.dongia)}</td>
                    <td className="dish-category">{dish.tendanhmuc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredDishes.length === 0 && (
              <div className="no-dishes">
                Không tìm thấy món ăn nào
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'buffet-sets' && (
        <div className="buffet-sets-section">
          <div className="buffet-sets-table">
            <table>
              <thead>
                <tr>
                  <th>Hình ảnh</th>
                  <th>Tên set</th>
                  <th>Giá</th>
                  <th>Thời gian phục vụ</th>
                  <th>Mô tả</th>
                </tr>
              </thead>
              <tbody>
                {buffetSets.map((set) => (
                  <tr key={set.maset}>
                    <td className="set-image-cell">
                      {set.image ? (
                        <img src={set.image} alt={set.tenset} className="set-image" />
                      ) : (
                        <div className="no-image">Không có ảnh</div>
                      )}
                    </td>
                    <td className="set-name">{set.tenset}</td>
                    <td className="set-price">{formatPrice(set.dongia)}</td>
                    <td className="set-time">
                      {set.thoigian_batdau && set.thoigian_ketthuc
                        ? `${set.thoigian_batdau} - ${set.thoigian_ketthuc}`
                        : '-'}
                    </td>
                    <td className="set-description">{set.mota || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {buffetSets.length === 0 && (
              <div className="no-buffet-sets">
                Hiện tại chưa có set buffet nào
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuPage;
