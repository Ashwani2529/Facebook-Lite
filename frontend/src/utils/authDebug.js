// Auth Debug Utilities
// Use these functions in browser console for debugging auth issues

// Check current auth state
window.debugAuth = () => {
  const user = localStorage.getItem('user');
  const token = localStorage.getItem('jwt');
  
  console.log('=== AUTH DEBUG ===');
  console.log('User in localStorage:', user ? JSON.parse(user) : null);
  console.log('Token in localStorage:', token);
  console.log('==================');
  
  return { user: user ? JSON.parse(user) : null, token };
};

// Clear all auth data
window.clearAuth = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('jwt');
  console.log('✅ Cleared all auth data from localStorage');
  console.log('🔄 Please refresh the page');
};

// Log these functions are available
console.log('🔧 Auth debug functions available:');
console.log('   - debugAuth() - Check current auth state'); 
console.log('   - clearAuth() - Clear all auth data'); 