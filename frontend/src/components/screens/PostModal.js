import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiX, HiArrowLeft } from 'react-icons/hi';
import toast from 'react-hot-toast';
import Navbar from '../layout/Navbar';
import PostCard from '../ui/PostCard';
import Loading from '../ui/Loading';
import SERVER_URL from '../../server_url';

const PostModal = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    try {
      const token = localStorage.getItem('jwt');
      const response = await fetch(`${SERVER_URL}/api/v1/posts/post/${postId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPost(data.post);
      } else if (response.status === 404) {
        setError('Post not found');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to load post');
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      setError('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    navigate(-1); // Go back to previous page
  };

  const handleGoToProfile = () => {
    if (post && post.postedBy) {
      navigate(`/profile/${post.postedBy._id}`);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-facebook-bg dark:bg-gray-900 pt-20">
          <div className="container mx-auto px-4">
            <div className="flex justify-center items-center py-20">
              <Loading />
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-facebook-bg dark:bg-gray-900 pt-20">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={handleClose}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white transition-colors"
                >
                  <HiArrowLeft className="w-5 h-5" />
                  <span>Back</span>
                </button>
              </div>

              {/* Error Message */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
                <div className="mb-4">
                  <HiX className="w-16 h-16 text-red-500 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                  {error}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  The post you're looking for might have been deleted or doesn't exist.
                </p>
                <button
                  onClick={handleClose}
                  className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-facebook-bg dark:bg-gray-900 pt-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={handleClose}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white transition-colors"
              >
                <HiArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </button>
              
              <button
                onClick={handleGoToProfile}
                className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
              >
                View Profile
              </button>
            </div>

            {/* Post */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <PostCard 
                post={post}
                className="mb-6"
              />
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PostModal; 