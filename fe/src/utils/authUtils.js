// Auth utility functions

export const forceLogout = () => {
  console.log('Force logout - clearing all data');
  
  // Clear all storage
  localStorage.clear();
  sessionStorage.clear();
  
  // Clear any cookies (if any)
  document.cookie.split(";").forEach((c) => {
    document.cookie = c
      .replace(/^ +/, "")
      .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });
  
  // Force redirect to home
  window.location.href = '/';
};

export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
};
