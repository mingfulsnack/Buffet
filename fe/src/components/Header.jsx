import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSignInAlt, FaSignOutAlt, FaUser } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import './Header.scss';

const Header = ({ isPublic = false }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/login');
  };

  const handleLogout = () => {
    console.log('Logging out user...');
    logout(); // AuthContext sẽ tự handle redirect
  };

  return (
    <header className={`header ${isPublic ? 'public' : ''}`}>
      <div className="header-content">
        <div className="header-left">
          {/* Can add breadcrumbs or page title here */}
        </div>

        <div className="header-right">
          {isAuthenticated() ? (
            <div className="user-menu">
              <div className="user-info">
                <FaUser className="user-icon" />
                <span className="user-name">{user?.hoten || 'User'}</span>
              </div>
              <button
                className="btn btn-secondary logout-btn"
                onClick={handleLogout}
              >
                <FaSignOutAlt />
                <span>Đăng xuất</span>
              </button>
            </div>
          ) : (
            <button className="btn btn-primary login-btn" onClick={handleLogin}>
              <FaSignInAlt />
              <span>Đăng nhập</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
