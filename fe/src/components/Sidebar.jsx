import React, { memo, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import {
  FaUtensils,
  FaUsers,
  FaUserTie,
  FaTable,
  FaClipboardList,
  FaChartBar,
  FaCalendarAlt,
  FaTachometerAlt,
  FaFileInvoice,
  FaShoppingCart,
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import './Sidebar.scss';

const Sidebar = memo(() => {
  const { isAuthenticated, isAdmin, user } = useAuth();

  // Memoize authentication state
  const authState = useMemo(
    () => ({
      isAuth: isAuthenticated(),
      isAdminUser: isAdmin(),
      currentUser: user,
    }),
    [isAuthenticated, isAdmin, user]
  );

  // Only log when auth state changes, not on every render
  if (window.sidebarDebug) {
    console.log('Sidebar Debug:', {
      isAuthenticated: authState.isAuth,
      isAdmin: authState.isAdminUser,
      user: authState.currentUser,
      userRole: authState.currentUser?.vaitro,
    });
  }

  // Menu items for guests (not logged in)
  const guestMenuItems = [
    {
      path: '/',
      icon: <FaTachometerAlt />,
      label: 'Trang chủ',
    },
    {
      path: '/menu',
      icon: <FaUtensils />,
      label: 'Thực đơn',
    },
    {
      path: '/booking',
      icon: <FaCalendarAlt />,
      label: 'Đặt bàn',
    },
  ];

  // Menu items for authenticated admin users
  const adminMenuItems = [
    {
      path: '/admin',
      icon: <FaTachometerAlt />,
      label: 'Admin Dashboard',
    },
    {
      path: '/admin/menu',
      icon: <FaUtensils />,
      label: 'Quản Lý Thực Đơn',
    },
    {
      path: '/admin/bookings',
      icon: <FaCalendarAlt />,
      label: 'Quản Lý Đặt Bàn',
    },
    {
      path: '/admin/employees',
      icon: <FaUserTie />,
      label: 'Quản Lý Nhân Viên',
    },
    {
      path: '/admin/tables',
      icon: <FaTable />,
      label: 'Quản Lý Bàn',
    },
    {
      path: '/admin/orders',
      icon: <FaShoppingCart />,
      label: 'Quản Lý Đơn Hàng',
    },
    {
      path: '/admin/invoices',
      icon: <FaFileInvoice />,
      label: 'Quản Lý Hóa Đơn',
    },
    {
      path: '/admin/reports',
      icon: <FaChartBar />,
      label: 'Báo Cáo',
    },
  ];

  // Determine which menu to show
  const menuItems =
    authState.isAuth && authState.isAdminUser ? adminMenuItems : guestMenuItems;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <img
            src="/src/assets/logobambam.png"
            alt="Restaurant Logo"
            className="logo-image"
            onError={(e) => {
              // Fallback if logo image doesn't exist
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
          <div className="logo-text" style={{ display: 'none' }}>
            Buffet Restaurant
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <ul className="menu-list">
          {menuItems.map((item, index) => (
            <li key={index} className="menu-item">
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `menu-link ${isActive || item.isActive ? 'active' : ''}`
                }
              >
                <span className="menu-icon">{item.icon}</span>
                <span className="menu-text">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;
