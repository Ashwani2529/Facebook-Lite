import React, { useState, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiHeart, 
  HiOutlineHeart, 
  HiChat,
  HiPaperAirplane,
  HiUserAdd,
  HiUserRemove
} from 'react-icons/hi';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import io from 'socket.io-client';

import { UserContext } from '../../App';
import Avatar from './Avatar';
import Button from './Button';
import Card from './Card';
import SERVER_URL from '../../server_url';

const PostCard = ({
  post,
  className = '',
}) => {
  const { state, dispatch } = useContext(UserContext);
  
  // Extract properties from post object safely
  const {
    _id: id,
    body,
    postedBy,
    photo,
    likes = [],
    comments = [],
    createdAt,
  } = post;
  
  const postedById = postedBy?._id;
  const isLiked = likes.includes(state?._id);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [localIsLiked, setLocalIsLiked] = useState(isLiked);
  const [localLikesCount, setLocalLikesCount] = useState(likes?.length || 0);
  const [localComments, setLocalComments] = useState(comments || []);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  const isOwner = postedById === state?._id;

  // Socket.IO setup for real-time comments
  useEffect(() => {
    const socket = io(SERVER_URL || 'http://localhost:5000');

    // Listen for new comments on this post
    socket.on('new_comment', (data) => {
      if (data.postId === id) {
        console.log('📝 Received new comment for post:', id);
        setLocalComments(prev => [...prev, data.comment]);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [id]);

  // Update local comments when post comments change
  useEffect(() => {
    setLocalComments(comments || []);
  }, [comments]);

  // Check if current user is following the post author
  useEffect(() => {
    if (state?.following && postedById && !isOwner) {
      setIsFollowing(state.following.includes(postedById));
    }
  }, [state?.following, postedById, isOwner]);

  // Handle like/unlike post
  const handleToggleLike = async () => {
    if (isLiking) return;
    
    setIsLiking(true);
    const endpoint = localIsLiked ? '/unlike' : '/like';
    
    try {
      const response = await fetch(`${SERVER_URL}/api/v1/posts${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt')}`
        },
        body: JSON.stringify({ postId: id })
      });

      if (response.ok) {
        const result = await response.json();
        setLocalIsLiked(!localIsLiked);
        setLocalLikesCount(result.likes?.length || 0);
        // updateFunc?.(result);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    } finally {
      setIsLiking(false);
    }
  };

  // Handle adding comment
  const handleAddComment = async () => {
    if (!commentText.trim() || isCommenting) return;

    setIsCommenting(true);

    try {
      const response = await fetch(`${SERVER_URL}/api/v1/posts/comment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt')}`
        },
        body: JSON.stringify({
          postId: id,
          text: commentText.trim()
        })
      });

      if (response.ok) {
        const result = await response.json();
        setCommentText('');
        // Comment will be added via Socket.IO broadcast automatically
        console.log('📝 Comment added successfully');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setIsCommenting(false);
    }
  };



  // Handle follow/unfollow user
  const handleToggleFollow = async () => {
    if (isFollowLoading || isOwner) return;

    setIsFollowLoading(true);

    try {
      const endpoint = isFollowing ? 'unfollow' : 'follow';
      const response = await fetch(`${SERVER_URL}/api/v1/users/${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt')}`
        },
        body: JSON.stringify({ 
          [endpoint + 'id']: postedById 
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setIsFollowing(!isFollowing);
        toast.success(isFollowing ? 'Unfollowed successfully' : 'Following successfully');
        
        // Update user context and localStorage with new following list
        if (data.user) {
          // Update global user context with new following/followers arrays
          dispatch({ type: 'UPDATE', payload: {
            followers: data.user.followers,
            following: data.user.following
          }});
          
          // Update localStorage with the complete updated user
          const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
          const updatedUser = {
            ...currentUser,
            followers: data.user.followers,
            following: data.user.following
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          
          console.log('Updated user context with new following list:', data.user.following);
        }
      } else {
        toast.error(data.error || `Failed to ${endpoint}`);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error('Something went wrong');
    } finally {
      setIsFollowLoading(false);
    }
  };

  // Handle delete post
  // const handleDeletePost = async () => {
  //   if (!window.confirm('Are you sure you want to delete this post?')) {
  //     return;
  //   }

  //   try {
  //     const response = await fetch(`${SERVER_URL}/api/v1/posts/deletepost/${id}`, {
  //       method: 'DELETE',
  //       headers: {
  //         'Authorization': `Bearer ${localStorage.getItem('jwt')}`
  //       }
  //     });

  //     if (response.ok) {
  //       const result = await response.json();
  //       // updateHome?.(result);
  //       toast.success('Post deleted successfully');
  //     }
  //   } catch (error) {
  //     console.error('Error deleting post:', error);
  //     toast.error('Failed to delete post');
  //   }
  // };

  // Handle key press for comment input
  const handleCommentKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`max-w-2xl mx-auto ${className}`}
    >
      <Card className="overflow-hidden">
        {/* Post Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <div className="flex items-center space-x-3">
            <Link 
              to={isOwner ? '/profile' : `/profile/${postedById}`}
              className="hover:opacity-80 transition-opacity"
            >
              <Avatar
                src={postedBy?.pic}
                name={postedBy?.name}
                size="lg"
                className="ring-2 ring-gray-200 dark:ring-gray-700"
              />
            </Link>
            <div>
              <Link
                to={isOwner ? '/profile' : `/profile/${postedById}`}
                className="font-semibold text-gray-900 hover:text-primary-600 transition-colors"
              >
                {postedBy?.name}
              </Link>
              <p className="text-sm text-gray-500">
                {createdAt && formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>

          {/* Follow Button and Post Options */}
          <div className="flex items-center space-x-2">
            {!isOwner && (
              <Button
                variant={isFollowing ? "outline" : "facebook"}
                size="sm"
                onClick={handleToggleFollow}
                disabled={isFollowLoading}
                className="flex items-center space-x-1"
              >
                {isFollowing ? (
                  <>
                    <HiUserRemove className="w-4 h-4" />
                    <span>Following</span>
                  </>
                ) : (
                  <>
                    <HiUserAdd className="w-4 h-4" />
                    <span>Follow</span>
                  </>
                )}
              </Button>
            )}

           
          </div>
        </div>

        {/* Post Content */}
        <div className="px-6 pb-4">
          {body && (
                          <p className="text-gray-900 text-lg leading-relaxed whitespace-pre-wrap">
                {body}
              </p>
          )}
        </div>

        {/* Post Image */}
        {photo && (
          <div className="relative">
            <motion.img
              src={photo}
              alt="Post content"
              className="w-full h-auto max-h-[600px] object-cover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              loading="lazy"
            />
          </div>
        )}

        {/* Post Stats */}
        <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span className="hover:underline cursor-pointer">
              {localLikesCount} {localLikesCount === 1 ? 'like' : 'likes'}
            </span>
            <span 
              className="hover:underline cursor-pointer"
              onClick={() => setShowComments(!showComments)}
            >
              {localComments.length} {localComments.length === 1 ? 'comment' : 'comments'}
            </span>
          </div>
        </div>

        {/* Post Actions */}
        <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-around">
            <Button
              variant="ghost"
              onClick={handleToggleLike}
              disabled={isLiking}
              className={`flex items-center space-x-2 ${
                localIsLiked ? 'text-red-500' : 'text-gray-600'
              }`}
            >
              {localIsLiked ? (
                <HiHeart className="w-6 h-6" />
              ) : (
                <HiOutlineHeart className="w-6 h-6" />
              )}
              <span>Like</span>
            </Button>

            <Button
              variant="ghost"
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-2 text-gray-600"
            >
              <HiChat className="w-6 h-6" />
              <span>Comment</span>
            </Button>
          </div>
        </div>

        {/* Comments Section */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-b border-gray-200 dark:border-gray-700"
            >
              {/* Add Comment */}
              <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-start space-x-3">
                  <Avatar src={state?.pic} name={state?.name} size="sm" />
                  <div className="flex-1">
                    <div className="flex items-end space-x-2">
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={handleCommentKeyPress}
                        placeholder="Write a comment... (Press Enter to send, Shift+Enter for new line)"
                        className="flex-1 resize-none rounded-2xl bg-gray-100 dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white border-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                        rows="1"
                      />
                      <Button
                        onClick={handleAddComment}
                        disabled={!commentText.trim() || isCommenting}
                        variant="primary"
                        size="sm"
                        className="p-2"
                      >
                        <HiPaperAirplane className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comments List */}
              <div className="max-h-96 overflow-y-auto">
                {localComments.map((comment, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start space-x-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <Avatar
                      src={comment.postedBy?.pic}
                      name={comment.postedBy?.name}
                      size="sm"
                    />
                    <div className="flex-1">
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2">
                        <p className="font-medium text-sm text-gray-900 dark:text-white">
                          {comment.postedBy?.name}
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                          {comment.text}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};

export default PostCard; 