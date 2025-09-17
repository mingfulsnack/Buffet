import React from 'react';
import { Link } from 'react-router-dom';
import { FaUtensils, FaCalendarAlt, FaPhone, FaClock, FaMapMarkerAlt } from 'react-icons/fa';
import './Dashboard.scss';

const Dashboard = () => {
  return (
    <div className="user-dashboard">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Chào mừng đến với Buffet Restaurant</h1>
          <p className="hero-subtitle">
            Trải nghiệm ẩm thực tuyệt vời với hệ thống buffet đa dạng và phong phú
          </p>
          <div className="hero-actions">
            <Link to="/menu" className="cta-button primary">
              <FaUtensils />
              Xem thực đơn
            </Link>
            <Link to="/booking" className="cta-button secondary">
              <FaCalendarAlt />
              Đặt bàn ngay
            </Link>
          </div>
        </div>
        <div className="hero-image">
          <img src="src/assets/loginpage.png" alt="Buffet Restaurant" />
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2>Dịch vụ nổi bật</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <FaUtensils />
              </div>
              <h3>Thực đơn đa dạng</h3>
              <p>Hơn 100 món ăn từ nhiều nền ẩm thực khác nhau, được cập nhật thường xuyên</p>
              <Link to="/menu" className="feature-link">Xem chi tiết →</Link>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <FaCalendarAlt />
              </div>
              <h3>Đặt bàn trực tuyến</h3>
              <p>Đặt bàn dễ dàng và nhanh chóng qua hệ thống online, tiết kiệm thời gian</p>
              <Link to="/booking" className="feature-link">Đặt bàn →</Link>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <FaClock />
              </div>
              <h3>Phục vụ cả ngày</h3>
              <p>Mở cửa từ 10:00 - 22:00 hàng ngày, phục vụ tất cả các bữa ăn</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <FaMapMarkerAlt />
              </div>
              <h3>Vị trí thuận lợi</h3>
              <p>Tọa lạc tại trung tâm thành phố, dễ dàng tiếp cận với bãi đậu xe rộng rãi</p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="quick-actions">
        <div className="container">
          <h2>Khám phá ngay</h2>
          <div className="actions-grid">
            <Link to="/menu" className="action-card">
              <div className="action-icon">
                <FaUtensils />
              </div>
              <div className="action-content">
                <h3>Thực đơn</h3>
                <p>Khám phá các món ăn và set buffet hấp dẫn</p>
              </div>
            </Link>

            <Link to="/booking" className="action-card">
              <div className="action-icon">
                <FaCalendarAlt />
              </div>
              <div className="action-content">
                <h3>Đặt bàn</h3>
                <p>Đặt bàn trực tuyến cho buổi ăn tuyệt vời</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="contact-section">
        <div className="container">
          <h2>Thông tin liên hệ</h2>
          <div className="contact-grid">
            <div className="contact-item">
              <FaPhone />
              <div>
                <h4>Hotline</h4>
                <p>1900 1234</p>
              </div>
            </div>
            <div className="contact-item">
              <FaClock />
              <div>
                <h4>Giờ phục vụ</h4>
                <p>10:00 - 22:00 (Hàng ngày)</p>
              </div>
            </div>
            <div className="contact-item">
              <FaMapMarkerAlt />
              <div>
                <h4>Địa chỉ</h4>
                <p>123 Đường ABC, Quận XYZ, TP.HCM</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
