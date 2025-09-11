import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSignInAlt, FaSignOutAlt, FaUser } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { forceLogout } from '../utils/authUtils';
import './Header.scss';

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/login');
  };

  const handleLogout = () => {
    try {
      logout();
      // Try normal navigation first
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Normal logout failed, using force logout:', error);
      // If normal logout fails, use force logout
      forceLogout();
    }
  };

  return (
    <header className="header">
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
            <button 
              className="btn btn-primary login-btn" 
              onClick={handleLogin}
            >
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
