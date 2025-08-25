
import React, { useEffect, createContext, useReducer, useContext } from 'react';
import './index.css';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
// Components
import Login from './components/screens/Login';
import FgtPass from './components/screens/FgtPass';
import { useTheme } from './contexts/ThemeContext';
import Signup from './components/screens/Signup';
import Home from './components/screens/Home';
import Profile from './components/screens/Profile';
import CreatePost from './components/screens/CreatePost';
import IndividualProfile from './components/screens/Individualprfle';
import Subpost from './components/screens/Subpost';
import Settings from './components/screens/Settings';
import Following from './components/screens/Following';
import MyChats from './components/screens/MyChats';
import ChatInterface from './components/screens/ChatInterface';

// Context and Reducers
import { reducer, initialState } from './reducers/userReducer';
import { ThemeProvider } from './contexts/ThemeContext';
// Debug auth function for development
if (typeof window !== 'undefined') {
  window.clearAuth = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('jwt');
    console.log('✅ Auth data cleared. Please refresh the page.');
  };
}

// Create User Context
export const UserContext = createContext();

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { state } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user && !state) {
      navigate('/login');
    }
  }, [state, navigate]);

  return children;
};

// Public Route Component (redirect if logged in)
const PublicRoute = ({ children }) => {
  const { state } = useContext(UserContext);
  
  // Only check localStorage if we have both user data AND a valid token
  let user = null;
  let token = null;
  
  try {
    user = JSON.parse(localStorage.getItem("user"));
    token = localStorage.getItem("jwt");
  } catch (error) {
    console.log('Error parsing user data from localStorage:', error);
    // Clear invalid data
    localStorage.removeItem("user");
    localStorage.removeItem("jwt");
  }

  // Only redirect if we have both valid user data AND a token
  if ((user && token) || state) {
    console.log('PublicRoute: Redirecting to home - User logged in');
    return <Navigate to="/" replace />;
  }

  console.log('PublicRoute: Allowing access - No valid user session');
  return children;
};

// Auth Handler Component
const AuthHandler = () => {
  const { dispatch } = useContext(UserContext);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("jwt");
    
    if (user && token) {
      // Load user from localStorage initially
      dispatch({ type: "USER", payload: user });
      
      // Optionally fetch fresh user data from server to ensure it's up-to-date
      // This helps catch any changes made on other devices/sessions
      fetch(`${process.env.REACT_APP_SERVER_URL || 'http://localhost:5000'}/api/v1/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => res.json())
             .then(data => {
         if (data.success && data.user) {
           // Update with fresh data from server
           dispatch({ type: "USER", payload: data.user });
           localStorage.setItem('user', JSON.stringify(data.user));
           console.log('Refreshed user data from server on app load');
         }
       })
      .catch(error => {
        console.log('Failed to fetch fresh user data:', error);
        // Clear invalid auth data on error
        localStorage.removeItem('user');
        localStorage.removeItem('jwt');
        dispatch({ type: "CLEAR" });
      });
    } else {
      // Clear any invalid/incomplete auth data
      localStorage.removeItem('user');
      localStorage.removeItem('jwt');
      dispatch({ type: "CLEAR" });
    }
  }, [dispatch]);

  return null;
};

// App Content Component (uses theme context)
const AppContent = () => {
  const { isDarkMode } = useTheme();

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 dark:bg-facebook-dark transition-colors duration-300">
        <AuthHandler />
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/signup" 
            element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            } 
          />
          <Route 
            path="/forgot" 
            element={
              <PublicRoute>
                <FgtPass />
              </PublicRoute>
            } 
          />
          
          {/* Protected Routes */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/create" 
            element={
              <ProtectedRoute>
                <CreatePost />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile/:userid" 
            element={
              <ProtectedRoute>
                <IndividualProfile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/subscribed" 
            element={
              <ProtectedRoute>
                <Subpost />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/following" 
            element={
              <ProtectedRoute>
                <Following />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/chats" 
            element={
              <ProtectedRoute>
                <MyChats />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/chat/:chatId" 
            element={
              <ProtectedRoute>
                <ChatInterface />
              </ProtectedRoute>
            } 
          />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        {/* Toast notifications */}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: isDarkMode ? '#374151' : '#ffffff',
              color: isDarkMode ? '#ffffff' : '#1f2937',
              border: `1px solid ${isDarkMode ? '#6b7280' : '#e5e7eb'}`,
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            },
          }}
        />
      </div>
    </BrowserRouter>
  );
};

// Main App Component
function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <ThemeProvider>
      <UserContext.Provider value={{ state, dispatch }}>
        <AppContent />
      </UserContext.Provider>
    </ThemeProvider>
  );
}

export default App;


