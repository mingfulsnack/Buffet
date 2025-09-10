import React from 'react';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user, isAdmin } = useAuth();

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <div className="welcome-message">
        <h2>Chào mừng, {user?.hoten || 'User'}!</h2>
        <p>Vai trò: {user?.tenvaitro || 'Unknown'}</p>
        {isAdmin() && <p>Bạn có quyền truy cập đầy đủ hệ thống quản lý.</p>}
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Tổng quan hệ thống</h3>
          <p>Đây là trang chính của hệ thống quản lý nhà hàng buffet.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
