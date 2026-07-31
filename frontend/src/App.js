import React, { createContext, useContext, useEffect, useReducer, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import ChatInterface from './components/screens/ChatInterface';
import CreatePost from './components/screens/CreatePost';
import FgtPass from './components/screens/FgtPass';
import Following from './components/screens/Following';
import Home from './components/screens/Home';
import IndividualProfile from './components/screens/Individualprfle';
import Login from './components/screens/Login';
import MyChats from './components/screens/MyChats';
import PostModal from './components/screens/PostModal';
import Profile from './components/screens/Profile';
import Settings from './components/screens/Settings';
import Signup from './components/screens/Signup';
import Subpost from './components/screens/Subpost';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { initialState, reducer } from './reducers/userReducer';
import SERVER_URL from './server_url';
import { disconnectSocket } from './services/socket';

export const UserContext = createContext();

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    localStorage.removeItem('user');
    return null;
  }
};

const ProtectedRoute = ({ children }) => {
  const { state } = useContext(UserContext);
  const hasStoredSession = readStoredUser() && localStorage.getItem('jwt');
  return state || hasStoredSession ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { state } = useContext(UserContext);
  const hasStoredSession = readStoredUser() && localStorage.getItem('jwt');
  return state || hasStoredSession ? <Navigate to="/" replace /> : children;
};

const AuthHandler = () => {
  const { dispatch } = useContext(UserContext);
  const [validated, setValidated] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const user = readStoredUser();
    const token = localStorage.getItem('jwt');

    if (!user || !token) {
      localStorage.removeItem('user');
      localStorage.removeItem('jwt');
      dispatch({ type: 'CLEAR' });
      setValidated(true);
      return () => controller.abort();
    }

    dispatch({ type: 'USER', payload: user });

    fetch(`${SERVER_URL}/api/v1/auth/me`, {
      signal: controller.signal,
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async response => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          const error = new Error(data.error || 'Unable to validate session');
          error.status = response.status;
          throw error;
        }
        return data;
      })
      .then(data => {
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
          dispatch({ type: 'USER', payload: data.user });
        }
      })
      .catch(error => {
        if (error.name === 'AbortError') return;
        if (error.status === 401) {
          localStorage.removeItem('user');
          localStorage.removeItem('jwt');
          disconnectSocket();
          dispatch({ type: 'CLEAR' });
        }
      })
      .finally(() => setValidated(true));

    return () => controller.abort();
  }, [dispatch]);

  return validated ? null : <div className="app-loading-bar" aria-label="Checking your session" />;
};

const protectedRoutes = [
  ['/', <Home />],
  ['/profile', <Profile />],
  ['/create', <CreatePost />],
  ['/profile/:userid', <IndividualProfile />],
  ['/subscribed', <Subpost />],
  ['/settings', <Settings />],
  ['/following', <Following />],
  ['/chats', <MyChats />],
  ['/chat/:chatId', <ChatInterface />],
  ['/post/:postId', <PostModal />]
];

const AppContent = () => {
  const { isDarkMode } = useTheme();

  return (
    <BrowserRouter>
      <div className="app-shell min-h-screen">
        <AuthHandler />
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
          <Route path="/forgot" element={<PublicRoute><FgtPass /></PublicRoute>} />
          {protectedRoutes.map(([path, element]) => (
            <Route
              key={path}
              path={path}
              element={<ProtectedRoute>{element}</ProtectedRoute>}
            />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster
          position="top-center"
          gutter={10}
          toastOptions={{
            duration: 4000,
            className: isDarkMode ? 'app-toast app-toast--dark' : 'app-toast'
          }}
        />
      </div>
    </BrowserRouter>
  );
};

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
