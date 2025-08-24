import React, { useState, useEffect } from 'react';
import Navbar from '../layout/Navbar';
import PostCard from '../ui/PostCard';
import SERVER_URL from '../../server_url';

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchPosts = async (page = 1, append = false) => {
    try {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);

      const response = await fetch(`${SERVER_URL}/api/v1/posts/allpost?page=${page}&limit=30`, {
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('jwt')
        }
      });
      const data = await response.json();
      if (append) {
        setPosts(prev => [...prev, ...(data.posts || [])]);
      } else {
        setPosts(data.posts || []);
      }
      
      setHasMore(data.pagination?.hasMore || false);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching posts:', error);
      if (!append) setPosts([]);
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
            <p className="text-gray-600 dark:text-gray-400">Loading posts...</p>
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Home Feed
              </h1>
              <button
                onClick={handleRefresh}
                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                title="Refresh posts"
              >
                <i className="fas fa-sync-alt"></i>
              </button>
            </div>

            {/* Posts */}
            {posts.length > 0 ? (
              <div className="space-y-6">
                {posts.map(post => (
                  <PostCard key={post._id} post={post}/>
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
                        🎉 You've reached the end!
                      </p>
                      <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                        No more posts to show. Check back later for new content!
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="bg-white dark:bg-facebook-card rounded-xl p-8 shadow-sm">
                  <i className="fas fa-newspaper text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
                  <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
                    No posts available
                  </p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">
                    Follow some users or create your first post to see content here!
                  </p>
                  <div className="flex gap-3 justify-center">
                    <a href="/create" className="btn btn-primary px-4 py-2">
                      Create Post
                    </a>
                    <button 
                      onClick={handleRefresh}
                      className="btn btn-outline-primary px-4 py-2"
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

export default Home;