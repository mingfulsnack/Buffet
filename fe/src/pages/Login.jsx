import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { showSuccess, showValidationError } from '../utils/toast';
import './Login.scss';

const Login = () => {
  const [formData, setFormData] = useState({
    tendangnhap: '',
    matkhau: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to intended page after login
  const from = location.state?.from?.pathname || '/dashboard'; // Default to dashboard for admin

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await authAPI.login(formData);

      if (response.data.success) {
        const { employee, token } = response.data.data;
        console.log('Login successful - Employee data:', employee);
        console.log('Employee role:', employee?.vaitro);

        // Pass employee as user to login function
        login(employee, token);
        showSuccess('Đăng nhập thành công!');
        navigate(from, { replace: true });
      } else {
        setError(response.data.message || 'Đăng nhập thất bại');
      }
    } catch (error) {
      console.error('Login error:', error);
      showValidationError(error);
      setError(
        error.response?.data?.message ||
          'Có lỗi xảy ra khi đăng nhập. Vui lòng thử lại.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Background image */}
      <div className="login-background">
        <img
          src="src/assets/loginpage.png"
          alt="Restaurant Background"
          className="background-image"
        />
      </div>

      <div className="login-container">
        {/* Left panel with image */}
        <div className="login-image-panel">
          <img
            src="src/assets/logidmid.png"
            alt="Restaurant"
            className="login-image"
            onError={(e) => {
              // Fallback if image doesn't exist
              e.target.style.display = 'none';
            }}
          />
        </div>

        {/* Right panel with login form */}
        <div className="login-form-panel">
          <div className="login-form-container">
            <div className="login-header">
              <h1 className="login-title">LOGIN</h1>
            </div>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <input
                  type="text"
                  name="tendangnhap"
                  placeholder="Tên đăng nhập"
                  value={formData.tendangnhap}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <input
                  type="password"
                  name="matkhau"
                  placeholder="Mật khẩu"
                  value={formData.matkhau}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary login-submit-btn"
                disabled={isLoading}
              >
                {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
                            <button
                type="button"
                className="btn btn-secondary home-btn"
                onClick={() => navigate('/')}
              >
                <span className="home-icon">🏠</span>
                Về trang chủ
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
