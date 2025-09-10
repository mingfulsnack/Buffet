import React from 'react';
import './LoadingSpinner.scss';

const LoadingSpinner = ({ size = 'medium', message = 'Đang tải...' }) => {
  return (
    <div className={`loading-spinner ${size}`}>
      <div className="spinner"></div>
      {message && <span className="loading-message">{message}</span>}
    </div>
  );
};

export default LoadingSpinner;
