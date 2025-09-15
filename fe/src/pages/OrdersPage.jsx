import React, { useState, useEffect } from 'react';
import './OrdersPage.scss';
import { FaPlus, FaEdit, FaTrash, FaCheck, FaMinus } from 'react-icons/fa';
import Modal from '../components/Modal';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [menuData, setMenuData] = useState({ dishes: [], sets: [] });
  const [orderItems, setOrderItems] = useState([]);
  const [orderNote, setOrderNote] = useState('');
  const [menuLoading, setMenuLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/orders', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      if (data.success) {
        setOrders(data.data);
      } else {
        setError(data.message || 'Lỗi khi lấy danh sách đơn hàng');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Lỗi khi lấy danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const fetchMenu = async () => {
    try {
      setMenuLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/orders/menu', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch menu');
      }

      const data = await response.json();
      if (data.success) {
        setMenuData(data.data);
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Lỗi khi lấy menu');
    } finally {
      setMenuLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:3000/api/orders/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }

      const data = await response.json();
      if (data.success) {
        const order = data.data;
        setOrderNote(order.ghichu || '');

        // Convert chi tiết thành orderItems format
        const items = order.chitiet.map((item) => ({
          id: item.mamon || item.maset,
          type: item.type,
          name: item.tenmon,
          price: item.dongia,
          soluong: item.soluong,
        }));
        setOrderItems(items);
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Lỗi khi lấy chi tiết đơn hàng');
    }
  };

  const handleAddOrder = () => {
    setEditingOrder(null);
    setOrderItems([]);
    setOrderNote('');
    setShowOrderModal(true);
    fetchMenu();
  };

  const handleEditOrder = async (order) => {
    setEditingOrder(order);
    await fetchOrderDetails(order.madon);
    await fetchMenu();
    setShowOrderModal(true);
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đơn hàng này?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:3000/api/orders/${orderId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete order');
      }

      const data = await response.json();
      if (data.success) {
        fetchOrders();
        alert('Xóa đơn hàng thành công!');
      } else {
        alert(data.message || 'Lỗi khi xóa đơn hàng');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Lỗi khi xóa đơn hàng');
    }
  };

  const handleConfirmOrder = async (orderId) => {
    if (
      !window.confirm(
        'Bạn có chắc chắn muốn xác nhận đơn hàng này? Đơn hàng sẽ được chuyển thành hóa đơn và bị xóa khỏi danh sách.'
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:3000/api/orders/${orderId}/confirm`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to confirm order');
      }

      const data = await response.json();
      if (data.success) {
        fetchOrders();
        alert('Xác nhận đơn hàng thành công! Đã tạo hóa đơn và xóa đơn hàng.');
      } else {
        alert(data.message || 'Lỗi khi xác nhận đơn hàng');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Lỗi khi xác nhận đơn hàng');
    }
  };

  const addItemToOrder = (item) => {
    const existingItem = orderItems.find(
      (orderItem) => orderItem.id === item.id && orderItem.type === item.type
    );

    if (existingItem) {
      setOrderItems(
        orderItems.map((orderItem) =>
          orderItem.id === item.id && orderItem.type === item.type
            ? { ...orderItem, soluong: orderItem.soluong + 1 }
            : orderItem
        )
      );
    } else {
      setOrderItems([...orderItems, { ...item, soluong: 1 }]);
    }
  };

  const updateItemQuantity = (itemId, itemType, newQuantity) => {
    if (newQuantity <= 0) {
      removeItemFromOrder(itemId, itemType);
      return;
    }

    setOrderItems(
      orderItems.map((item) =>
        item.id === itemId && item.type === itemType
          ? { ...item, soluong: newQuantity }
          : item
      )
    );
  };

  const removeItemFromOrder = (itemId, itemType) => {
    setOrderItems(
      orderItems.filter(
        (item) => !(item.id === itemId && item.type === itemType)
      )
    );
  };

  const calculateTotal = () => {
    return orderItems.reduce(
      (total, item) => total + item.price * item.soluong,
      0
    );
  };

  const handleSaveOrder = async () => {
    if (orderItems.length === 0) {
      alert('Vui lòng chọn ít nhất một món');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');

      const orderData = {
        monAn: orderItems.map((item) => ({
          id: item.id,
          type: item.type,
          soluong: item.soluong,
        })),
        ghichu: orderNote,
      };

      const url = editingOrder
        ? `http://localhost:3000/api/orders/${editingOrder.madon}`
        : 'http://localhost:3000/api/orders';

      const method = editingOrder ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Failed to save order');
      }

      const data = await response.json();
      if (data.success) {
        setShowOrderModal(false);
        fetchOrders();
        alert(
          editingOrder
            ? 'Cập nhật đơn hàng thành công!'
            : 'Tạo đơn hàng thành công!'
        );
      } else {
        alert(data.message || 'Lỗi khi lưu đơn hàng');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Lỗi khi lưu đơn hàng');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  return (
    <div className="orders-page">
      <div className="page-header">
        <h1>Quản lý đơn hàng</h1>
        <button className="btn btn-primary" onClick={handleAddOrder}>
          <FaPlus /> Thêm đơn hàng
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="orders-table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Các món được chọn</th>
              <th>Tổng tiền</th>
              <th>Ghi chú</th>
              <th>Ngày lập</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center">
                  Chưa có đơn hàng nào
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.madon}>
                  <td>{order.madon}</td>
                  <td className="dishes-cell" title={order.monan_text}>
                    {order.monan_text || 'Không có món'}
                  </td>
                  <td>{formatCurrency(order.tongtien)}</td>
                  <td>{order.ghichu || '-'}</td>
                  <td>{formatDate(order.thoi_gian_tao)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-sm btn-warning"
                        onClick={() => handleEditOrder(order)}
                        title="Sửa"
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteOrder(order.madon)}
                        title="Xóa"
                      >
                        <FaTrash />
                      </button>
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => handleConfirmOrder(order.madon)}
                        title="Xác nhận"
                      >
                        <FaCheck />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Order Modal */}
      <Modal
        isOpen={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        title={editingOrder ? 'Sửa đơn hàng' : 'Thêm đơn hàng'}
        size="large"
      >
        <div className="order-modal-content">
          {menuLoading ? (
            <div className="loading">Đang tải menu...</div>
          ) : (
            <>
              {/* Menu Selection */}
              <div className="menu-section">
                <h3>Chọn món</h3>

                {/* Dishes */}
                <div className="menu-category">
                  <h4>Món ăn</h4>
                  <div className="menu-grid">
                    {menuData.dishes.map((dish) => (
                      <div
                        key={dish.id}
                        className="menu-item"
                        onClick={() => addItemToOrder(dish)}
                      >
                        <div className="menu-item-image">
                          {dish.image ? (
                            <img src={dish.image} alt={dish.name} />
                          ) : (
                            <div className="no-image">Không có ảnh</div>
                          )}
                        </div>
                        <div className="menu-item-info">
                          <h5>{dish.name}</h5>
                          <p className="price">{formatCurrency(dish.price)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Set Buffet */}
                <div className="menu-category">
                  <h4>Set Buffet</h4>
                  <div className="menu-grid">
                    {menuData.sets.map((set) => (
                      <div
                        key={set.id}
                        className="menu-item"
                        onClick={() => addItemToOrder(set)}
                      >
                        <div className="menu-item-image">
                          {set.image ? (
                            <img src={set.image} alt={set.name} />
                          ) : (
                            <div className="no-image">Không có ảnh</div>
                          )}
                        </div>
                        <div className="menu-item-info">
                          <h5>{set.name}</h5>
                          <p className="price">{formatCurrency(set.price)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Order Cart */}
              <div className="order-cart">
                <h3>Giỏ hàng</h3>
                {orderItems.length === 0 ? (
                  <p className="empty-cart">Chưa có món nào được chọn</p>
                ) : (
                  <>
                    <div className="cart-items">
                      {orderItems.map((item, index) => (
                        <div
                          key={`${item.type}-${item.id}-${index}`}
                          className="cart-item"
                        >
                          <div className="item-info">
                            <h5>{item.name}</h5>
                            <p className="item-price">
                              {formatCurrency(item.price)}
                            </p>
                          </div>
                          <div className="quantity-controls">
                            <button
                              className="btn btn-sm"
                              onClick={() =>
                                updateItemQuantity(
                                  item.id,
                                  item.type,
                                  item.soluong - 1
                                )
                              }
                            >
                              <FaMinus />
                            </button>
                            <span className="quantity">{item.soluong}</span>
                            <button
                              className="btn btn-sm"
                              onClick={() =>
                                updateItemQuantity(
                                  item.id,
                                  item.type,
                                  item.soluong + 1
                                )
                              }
                            >
                              <FaPlus />
                            </button>
                          </div>
                          <div className="item-total">
                            {formatCurrency(item.price * item.soluong)}
                          </div>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() =>
                              removeItemFromOrder(item.id, item.type)
                            }
                          >
                            <FaTrash />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="cart-total">
                      <h4>Tổng cộng: {formatCurrency(calculateTotal())}</h4>
                    </div>
                  </>
                )}

                {/* Order Note */}
                <div className="order-note">
                  <label htmlFor="orderNote">Ghi chú:</label>
                  <textarea
                    id="orderNote"
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    placeholder="Nhập ghi chú cho đơn hàng..."
                    rows="3"
                  />
                </div>

                {/* Save Button */}
                <div className="modal-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowOrderModal(false)}
                    disabled={submitting}
                  >
                    Hủy
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleSaveOrder}
                    disabled={submitting || orderItems.length === 0}
                  >
                    {submitting
                      ? 'Đang lưu...'
                      : editingOrder
                      ? 'Cập nhật'
                      : 'Lưu đơn hàng'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default OrdersPage;
