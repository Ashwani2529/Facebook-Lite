import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  HiHome, 
  HiUser, 
  HiPlusCircle, 
  HiSearch,
  HiBell,
  HiMenu,
  HiX,
  HiSun,
  HiMoon,
  HiLogout,
  HiCog,
  HiUserGroup,
  HiChat,
  HiCode
} from 'react-icons/hi';

import { UserContext } from '../../App';
import { useTheme } from '../../contexts/ThemeContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Avatar from '../ui/Avatar';
import SERVER_URL from '../../server_url';
import logo from './logo2.png';
const Navbar = () => {
  const { state, dispatch } = useContext(UserContext);
  const { isDarkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Format time ago helper
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  // Handle search
  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim().length > 0) {
      try {
        const response = await fetch(`${SERVER_URL}/api/v1/users/search-users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('jwt')}`
          },
          body: JSON.stringify({ query })
        });
        const data = await response.json();
        setSearchResults(data.user || []);
        setShowSearchResults(true);
      } catch (error) {
        console.error('Search error:', error);
      }
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('jwt');
    localStorage.removeItem('user');
    dispatch({ type: 'CLEAR' });
    navigate('/login');
  };

  // Navigation items
  const navItems = [
    { name: 'Home', path: '/', icon: HiHome },
    { name: 'Following', path: '/following', icon: HiUserGroup },
    { name: 'Chats', path: '/chats', icon: HiChat },
    { name: 'Profile', path: '/profile', icon: HiUser },
    { name: 'Create', path: '/create', icon: HiPlusCircle },
  ];

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.search-container')) {
        setShowSearchResults(false);
      }
      if (!event.target.closest('.user-menu-container')) {
        setIsUserMenuOpen(false);
      }
      if (!event.target.closest('.notification-container')) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch real notifications from backend
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch(`${SERVER_URL}/api/v1/notifications?limit=10`, {
          headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('jwt')
          }
        });
        const data = await response.json();
        
        if (data.success) {
          const formattedNotifications = data.notifications.map(notif => ({
            id: notif._id,
            type: notif.type,
            message: notif.message,
            time: formatTimeAgo(notif.createdAt),
            avatar: notif.sender?.pic,
            read: notif.read,
            sender: notif.sender
          }));
          setNotifications(formattedNotifications);
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    if (state) {
      fetchNotifications();
    }
  }, [state]);

  // Debug: Test function to manually toggle theme
  // Removed debug functions for cleaner production code

  if (!state) return null;

  return (
    <nav className="navbar sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 group no-underline">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                {/* <span className="text-white font-bold text-sm">FL</span> */}
                <img src={logo} alt="logo" className="w-8 h-8" />
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                Facebook Lite
              </span>
            </Link>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:block flex-1 max-w-lg mx-8 search-container relative">
            <Input
              type="text"
              style={{
                paddingLeft: '42px',
              }}
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              icon={<HiSearch className="w-5 h-5" />}
              className="w-full"
            />
            
            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full mt-2 w-auto bg-white dark:bg-facebook-card rounded-xl shadow-strong border border-gray-200 dark:border-gray-700 py-2 z-50"
              >
                {searchResults.map((user) => (
                  <Link
                    key={user._id}
                    to={`/profile/${user._id}`}
                    onClick={() => setShowSearchResults(false)}
                    className="flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-200 transition-colors"
                  >
                    <Avatar src={user.pic} name={user.name} size="sm" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-black">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-800">
                        {user.email}
                      </p>
                    </div>
                  </Link>
                ))}
              </motion.div>
            )}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.name} to={item.path}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`
                      px-4 py-2 rounded-xl transition-all duration-200 flex items-center space-x-2
                      ${isActive 
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700' 
                        : 'text-gray-600 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </motion.div>
                </Link>
              );
            })}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleDarkMode}
              className="p-2"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <HiSun className="w-5 h-5" />
              ) : (
                <HiMoon className="w-5 h-5" />
              )}
            </Button>

            {/* Notifications */}
            <div className="relative notification-container">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="p-2 relative"
                aria-label="Notifications"
              >
                <HiBell className="w-5 h-5" />
                {notifications.some(n => !n.read) && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                )}
              </Button>
              {/* Notifications Dropdown */}
              {isNotificationOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute right-[-75px] mt-2 w-80 bg-white dark:bg-facebook-card rounded-xl shadow-strong border border-gray-500 dark:border-gray-700 py-2"
                  style={{ maxHeight: '400px' }}
                >
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-400 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-black">
                      Notifications
                    </h3>
                    {notifications.some(n => !n.read) && (
                      <button
                        onClick={async () => {
                          try {
                            const response = await fetch(`${SERVER_URL}/api/v1/notifications/mark-read`, {
                              method: 'PUT',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer ' + localStorage.getItem('jwt')
                              }
                            });
                            
                            if (response.ok) {
                              setNotifications(notifications.map(n => ({...n, read: true})));
                            }
                          } catch (error) {
                            console.error('Failed to mark notifications as read:', error);
                          }
                        }}
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm flex items-center space-x-1"
                        title="Mark all as read"
                      >
                        <span>✓✓</span>
                      </button>
                    )}
                  </div>
                  
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`flex items-start px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-l-4 ${
                            !notification.read 
                              ? 'border-primary-500 bg-primary-50/30 dark:bg-primary-900/10' 
                              : 'border-transparent'
                          }`}
                        >
                          <div className="flex-shrink-0">
                            <div className="dark:text-black w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                              {notification.type === 'like' && <span className="text-red-500">❤️</span>}
                              {notification.type === 'comment' && <span className="text-blue-500">💬</span>}
                              {notification.type === 'follow' && <span className="text-green-500">👤</span>}
                              {notification.type === 'new_post' && <span className="text-purple-500">📝</span>}
                              {notification.type === 'chat_request' && <span className="text-blue-600">💬</span>}
                              {notification.type === 'chat_message' && <span className="text-green-600">💬</span>}
                            </div>
                          </div>
                          <div className="ml-3 flex-1">
                            <p className="text-sm text-gray-900 dark:text-black">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-800 mt-1">
                              {notification.time}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-6 text-center">
                        <HiBell className="w-8 h-8 mx-auto text-gray-400 dark:text-gray-600 mb-2" />
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                          No notifications yet
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {notifications.length > 0 && (
                    <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-400 text-center">
                      <span className="text-gray-500 dark:text-gray-400 text-xs">
                        {notifications.filter(n => !n.read).length} unread notifications
                      </span>
                    </div>
                  )}
                </motion.div>
              )}
              </div>


            {/* User Menu */}
            <div className="relative user-menu-container">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 focus:outline-none"
              >
                <Avatar
                  src={state.pic}
                  name={state.name}
                  size="sm"
                  className="hover:ring-2 hover:ring-primary-500 transition-all"
                />
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute right-0 mt-2 w-56 bg-white dark:bg-facebook-card rounded-xl shadow-strong border border-gray-500 dark:border-gray-700 py-2"
                >
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-400">
                    <p className="text-sm font-medium text-gray-900">
                      {state.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {state.email}
                    </p>
                  </div>
                  
                  <Link
                    to="/profile"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-900 hover:bg-gray-50 dark:hover:bg-gray-200 no-underline"
                  >
                    <HiUser className="w-4 h-4 mr-3" />
                    Profile
                  </Link>
                  
                  <Link
                    to="/settings"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-900 hover:bg-gray-50 dark:hover:bg-gray-200 no-underline"
                  >
                    <HiCog className="w-4 h-4 mr-3" />
                    Settings
                  </Link>

                  {/* Sleek Developer Button */}
                  <a
                    href="https://ashwanisingh-portfolio.netlify.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex items-center px-4 py-3 text-sm font-medium bg-gradient-to-r from-gray-400 via-gray-700 to-gray-400 text-white hover:from-gray-700 hover:via-gray-700 hover:to-gray-700 transform hover:scale-105 transition-all duration-300 m-2 rounded-lg shadow-lg hover:shadow-xl overflow-hidden no-underline"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-400 via-gray-700 to-gray-400 rounded-lg opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative flex items-center">
                      <HiCode className="w-4 h-4 mr-3 animate-pulse" />
                      <span className="font-semibold tracking-wide">Developer</span>
                      <div className="ml-2 text-xs opacity-75">✨</div>
                    </div>
                    
                    {/* Glow Effect */}
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-gray-400 via-gray-700 to-gray-400 rounded-lg opacity-30 group-hover:opacity-60 blur transition-all duration-300 group-hover:duration-200 -z-10"></div>
                  </a>
                  
                  <hr className="my-2 border-gray-200 dark:border-gray-700" />
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <HiLogout className="w-4 h-4 mr-3" />
                    Sign out
                  </button>
                </motion.div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              {isMenuOpen ? (
                <HiX className="w-6 h-6" />
              ) : (
                <HiMenu className="w-6 h-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden py-4"
          >
            {/* Mobile Search */}
            <div className="mb-4 search-container relative">
              <Input
              style={{
                paddingLeft: '42px',
              }}
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                icon={<HiSearch className="w-5 h-5" />}
              />
              
              {/* Mobile Search Results */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-full mt-2 w-auto bg-white dark:bg-facebook-card rounded-xl shadow-strong border border-gray-200 dark:border-gray-700 py-2 z-50">
                  {searchResults.map((user) => (
                    <Link
                      key={user._id}
                      to={`/profile/${user._id}`}
                      onClick={() => {
                        setShowSearchResults(false);
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-200"
                    >
                      <Avatar src={user.pic} name={user.name} size="sm" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-black">{user.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-800">{user.email}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Navigation Links */}
            <div className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`
                      flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors
                      ${isActive
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700'
                        : 'text-gray-600 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 