import { toast } from 'react-toastify';

// Success toast
export const showSuccess = (message) => {
  toast.success(message, {
    position: 'top-right',
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
};

// Error toast
export const showError = (message) => {
  toast.error(message, {
    position: 'top-right',
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
};

// Info toast
export const showInfo = (message) => {
  toast.info(message, {
    position: 'top-right',
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
};

// Warning toast
export const showWarning = (message) => {
  toast.warning(message, {
    position: 'top-right',
    autoClose: 4000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
};

// Loading toast with promise
export const showLoadingToast = (promise, messages = {}) => {
  const defaultMessages = {
    pending: 'Đang xử lý...',
    success: 'Thành công!',
    error: 'Có lỗi xảy ra!',
  };

  const finalMessages = { ...defaultMessages, ...messages };

  return toast.promise(promise, finalMessages, {
    position: 'top-right',
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
};

// Extract error message from axios error response
export const getErrorMessage = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.response?.data?.details) {
    // Handle validation errors (array of error messages)
    if (Array.isArray(error.response.data.details)) {
      return error.response.data.details.join(', ');
    }
    return error.response.data.details;
  }

  if (error.message) {
    return error.message;
  }

  return 'Có lỗi không xác định xảy ra';
};

// Show validation error from backend
export const showValidationError = (error) => {
  const message = getErrorMessage(error);
  showError(message);
};

export default {
  success: showSuccess,
  error: showError,
  info: showInfo,
  warning: showWarning,
  loading: showLoadingToast,
  validationError: showValidationError,
};
