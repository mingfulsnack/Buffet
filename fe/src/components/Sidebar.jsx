import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FaUtensils, 
  FaUsers, 
  FaUserTie, 
  FaTable, 
  FaClipboardList, 
  FaChartBar,
  FaCalendarAlt,
  FaTachometerAlt
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import './Sidebar.scss';

const Sidebar = () => {
  const { isAuthenticated, isAdmin } = useAuth();

  // Menu items for guests (not logged in)
  const guestMenuItems = [
    {
      path: '/menu',
      icon: <FaUtensils />,
      label: 'Thực đơn'
    },
    {
      path: '/booking',
      icon: <FaCalendarAlt />,
      label: 'Đặt bàn'
    }
  ];

  // Menu items for authenticated admin users
  const adminMenuItems = [
    {
      path: '/dashboard',
      icon: <FaTachometerAlt />,
      label: 'Dashboard'
    },
    {
      path: '/menu',
      icon: <FaUtensils />,
      label: 'Quản Lý Thực Đơn'
    },
    {
      path: '/customers',
      icon: <FaUsers />,
      label: 'Quản Lý Khách Hàng'
    },
    {
      path: '/employees',
      icon: <FaUserTie />,
      label: 'Quản Lý Nhân Viên'
    },
    {
      path: '/tables',
      icon: <FaTable />,
      label: 'Quản Lý Bàn',
      isActive: true // Currently selected item with yellow highlight
    },
    {
      path: '/orders',
      icon: <FaClipboardList />,
      label: 'Quản Lý Đơn Hàng'
    },
    {
      path: '/reports',
      icon: <FaChartBar />,
      label: 'Báo Cáo'
    }
  ];

  // Determine which menu to show
  const menuItems = (isAuthenticated() && isAdmin()) ? adminMenuItems : guestMenuItems;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <img 
            src="/images/logo.png" 
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
};

export default Sidebar;
