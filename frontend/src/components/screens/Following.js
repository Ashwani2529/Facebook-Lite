import React, { useState, useEffect } from 'react';
import Navbar from '../layout/Navbar';
import PostCard from '../ui/PostCard';
import { HiUsers, HiRefresh } from 'react-icons/hi';
import SERVER_URL from '../../server_url';

const Following = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');

  const fetchPosts = async (page = 1, append = false) => {
    try {
      if (page === 1) {
        setLoading(true);
        setError('');
      } else {
        setLoadingMore(true);
      }
      
      const response = await fetch(`${SERVER_URL}/api/v1/posts/getsubpost?page=${page}&limit=30`, {
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('jwt')
        }
      });

      const data = await response.json();
      
      if (data.posts) {
        if (append) {
          setPosts(prev => [...prev, ...data.posts]);
        } else {
          setPosts(data.posts);
        }
        setHasMore(data.pagination?.hasMore || false);
        setCurrentPage(page);
      } else {
        setError('Failed to fetch posts from following users');
      }
    } catch (error) {
      console.error('Error fetching following posts:', error);
      setError('Network error occurred while fetching posts');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchPosts(1, false);
  }, []);

  const handleShowMore = () => {
    fetchPosts(currentPage + 1, true);
  };

  const handleRefresh = () => {
    fetchPosts(1, false);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 dark:bg-facebook-dark flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading posts from following...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 dark:bg-facebook-dark">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <HiUsers className="text-primary-500 w-8 h-8" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Following
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Posts from users you follow
                  </p>
                </div>
              </div>
              <button
                onClick={handleRefresh}
                className="p-2 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Refresh posts"
              >
                <HiRefresh className="w-5 h-5" />
              </button>
            </div>

            {/* Error State */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
                <p className="text-red-600 dark:text-red-400">{error}</p>
                <button
                  onClick={handleRefresh}
                  className="mt-2 text-sm text-red-700 dark:text-red-300 hover:underline"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Posts */}
            {posts.length > 0 ? (
              <div className="space-y-6">
                {posts.map(post => (
                  <PostCard key={post._id} post={post} />
                ))}
                
                {/* Show More Button */}
                {hasMore && (
                  <div className="text-center py-8">
                    <button
                      onClick={handleShowMore}
                      disabled={loadingMore}
                      className="btn btn-primary px-6 py-3 rounded-full d-flex align-items-center mx-auto gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                    >
                      {loadingMore ? (
                        <>
                          <div className="spinner-border spinner-border-sm" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          Loading more posts...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-plus"></i>
                          Show More Posts
                        </>
                      )}
                    </button>
                  </div>
                )}
                
                {!hasMore && posts.length > 30 && (
                  <div className="text-center py-8">
                    <div className="bg-white dark:bg-facebook-card rounded-xl p-6 shadow-sm">
                      <p className="text-gray-500 dark:text-gray-400 text-lg">
                        🎉 You've caught up!
                      </p>
                      <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                        No more posts from users you follow. Check back later!
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="bg-white dark:bg-facebook-card rounded-xl p-8 shadow-sm">
                  <HiUsers size={64} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No posts yet
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
                    No posts from users you follow
                  </p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">
                    Start following users to see their posts here!
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button 
                      onClick={() => window.location.href = '/'} 
                      className="btn btn-primary px-6 py-2"
                    >
                      Discover Users
                    </button>
                    <button
                      onClick={handleRefresh}
                      className="btn btn-outline-primary px-6 py-2"
                    >
                      Refresh
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Following; 