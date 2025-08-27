import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiHeart, 
  HiOutlineHeart, 
  HiChat,
  HiPaperAirplane,
  HiUserAdd,
  HiUserRemove,
  HiShare,
  HiX,
  HiOutlineUserAdd 
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
  const navigate = useNavigate();
  
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

  // Share functionality states
  const [showShareModal, setShowShareModal] = useState(false);
  const [chatContacts, setChatContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [sharingToChat, setSharingToChat] = useState(null);

  // Friend request states
  const [friendRequestStatus, setFriendRequestStatus] = useState('none'); // none, sent, received, friends
  const [loadingFriendRequest, setLoadingFriendRequest] = useState(false);

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

  // Check friend request status
  useEffect(() => {
    if (!isOwner && postedBy?._id) {
      checkFriendRequestStatus();
    }
  }, [postedBy?._id, isOwner]);

  const checkFriendRequestStatus = async () => {
    try {
      const token = localStorage.getItem('jwt');
      const response = await fetch(`${SERVER_URL}/api/v1/friends/status/${postedBy._id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFriendRequestStatus(data.status);
      }
    } catch (error) {
      console.error('Error checking friend request status:', error);
    }
  };

  // Handle friend request
  const handleFriendRequest = async () => {
    if (loadingFriendRequest) return;

    setLoadingFriendRequest(true);
    try {
      const token = localStorage.getItem('jwt');
      let endpoint, method;

      if (friendRequestStatus === 'none') {
        endpoint = '/api/v1/friends/send-request';
        method = 'POST';
      } else if (friendRequestStatus === 'sent') {
        endpoint = '/api/v1/friends/cancel-request';
        method = 'DELETE';
      } else if (friendRequestStatus === 'received') {
        endpoint = '/api/v1/friends/accept-request';
        method = 'POST';
      }

      const response = await fetch(`${SERVER_URL}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId: postedBy._id })
      });

      if (response.ok) {
        const data = await response.json();
        setFriendRequestStatus(data.status);
        toast.success(data.message);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to process friend request');
      }
    } catch (error) {
      console.error('Error handling friend request:', error);
      toast.error('Something went wrong');
    } finally {
      setLoadingFriendRequest(false);
    }
  };

  // Handle chat navigation
  const handleChatNavigation = async () => {
    try {
      const token = localStorage.getItem('jwt');
      const response = await fetch(`${SERVER_URL}/api/v1/chat/find-or-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId: postedBy._id })
      });

      if (response.ok) {
        const data = await response.json();
        navigate(`/chat/${data.chatId}`);
      } else {
        toast.error('Failed to open chat');
      }
    } catch (error) {
      console.error('Error opening chat:', error);
      toast.error('Failed to open chat');
    }
  };

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

  // Fetch chat contacts
  const fetchChatContacts = async () => {
    setLoadingContacts(true);
    try {
      const token = localStorage.getItem('jwt');
      const response = await fetch(`${SERVER_URL}/api/v1/chat/chats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setChatContacts(data.chats || []);
      } else {
        toast.error('Failed to load contacts');
      }
    } catch (error) {
      console.error('Error fetching chat contacts:', error);
      toast.error('Failed to load contacts');
    } finally {
      setLoadingContacts(false);
    }
  };

  // Handle share to chat
  const handleShareToChat = async (chatId, otherUserName) => {
    setSharingToChat(chatId);
    try {
      const postUrl = `${window.location.origin}/post/${id}`;
      const shareMessage = `Check out this post: ${postUrl}`;

      const token = localStorage.getItem('jwt');
      const response = await fetch(`${SERVER_URL}/api/v1/chat/chat/${chatId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: shareMessage,
          type: 'text',
          replyTo: chatId
        })
      });

      if (response.ok) {
        toast.success(`Post shared with ${otherUserName}!`);
        setShowShareModal(false);
      } else {
        toast.error('Failed to share post');
      }
    } catch (error) {
      console.error('Error sharing post:', error);
      toast.error('Failed to share post');
    } finally {
      setSharingToChat(null);
    }
  };

  // Handle share button click
  const handleShareClick = () => {
    setShowShareModal(true);
    fetchChatContacts();
  };

  // Copy post URL to clipboard
  const handleCopyLink = async () => {
    try {
      const postUrl = `${window.location.origin}/post/${id}`;
      await navigator.clipboard.writeText(postUrl);
      toast.success('Post link copied to clipboard!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Failed to copy link');
    }
  };

  // Get friend request button config
  const getFriendButtonConfig = () => {
    switch (friendRequestStatus) {
      case 'sent':
        return { text: 'Request Sent', disabled: true, color: 'secondary' };
      case 'received':
        return { text: 'Accept Request', disabled: false, color: 'primary' };
      case 'friends':
        return null; // Show chat icon instead
      default:
        return { text: 'Add Friend', disabled: false, color: 'outline' };
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
        <div className="flex items-center justify-between p-1 pb-2">
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
          <div className="flex items-center space-x-1">
            {!isOwner && (
              <>
                {/* Friend Request / Chat Button */}
                {friendRequestStatus === 'friends' ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleChatNavigation}
                    className="flex items-center justify-center p-2"
                    title="Send Message"
                  >
                    <HiChat className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    variant={getFriendButtonConfig()?.color || 'outline'}
                    size="sm"
                    onClick={handleFriendRequest}
                    disabled={loadingFriendRequest || getFriendButtonConfig()?.disabled}
                    className="flex items-center justify-center p-2"
                    title={getFriendButtonConfig()?.text || 'Add Friend'}
                  >
                    {loadingFriendRequest ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <HiOutlineUserAdd className="w-4 h-4" />
                    )}
                  </Button>
                )}

                {/* Follow Button */}
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
                      <span className='text-sm'>Following</span>
                    </>
                  ) : (
                    <>
                      <HiUserAdd className="w-4 h-4" />
                      <span className='text-sm'>Follow</span>
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Post Content */}
        <div className="px-4 pb-2">
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
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm text-gray-500">
                                <span className="cursor-pointer">
              {localLikesCount} {localLikesCount === 1 ? 'like' : 'likes'}
            </span>
            <span 
                                  className="cursor-pointer"
              onClick={() => setShowComments(!showComments)}
            >
              {localComments.length} {localComments.length === 1 ? 'comment' : 'comments'}
            </span>
          </div>
        </div>

        {/* Post Actions */}
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-evenly">
            <Button
              variant="ghost2"
              onClick={handleToggleLike}
              disabled={isLiking}
              className={`flex items-center space-x-2 ${
                localIsLiked ? 'text-red-500' : 'text-gray-600'
              }`}
            >
              {localIsLiked ? (
                <HiHeart className="w-6 h-6 text-red-500" />
              ) : (
                <HiOutlineHeart className="w-6 h-6" />
              )}
              <span className='hidden md:inline'>Like</span>
            </Button>

            <Button
              variant="ghost2"
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-2 text-gray-600"
            >
              <HiChat className="w-6 h-6" />
              <span className='hidden md:inline'>Comment</span>
            </Button>

            <Button
              variant="ghost2"
              onClick={handleShareClick}
              className="flex items-center space-x-2 text-gray-600"
            >
              <HiShare className="w-6 h-6" />
              <span className='hidden md:inline'>Share</span>
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
                        placeholder="Comment"
                        className="flex-1 resize-none rounded-2xl bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm text-gray-900 dark:text-white border-none focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                    key={comment._id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start space-x-3 p-4"
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

        {/* Share Modal */}
        {showShareModal && (
          <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999 }}>
            <div className="bg-white dark:bg-gray-800 rounded-3 p-4 mx-3" style={{ maxWidth: '500px', width: '100%', maxHeight: '80vh' }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0 dark:text-white">Share Post</h5>
                <button 
                  type="button"
                  className="btn btn-link p-0 text-gray-500"
                  onClick={() => setShowShareModal(false)}
                >
                  <HiX size={24} />
                </button>
              </div>
              
              {/* Copy Link Option */}
              <div className="border-bottom pb-3 mb-3">
                <button
                  onClick={handleCopyLink}
                  className="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center"
                >
                  <HiShare className="me-2" />
                  Copy Post Link
                </button>
              </div>

              {/* Chat Contacts */}
              <div>
                <h6 className="dark:text-white mb-3">Send to Chat</h6>
                {loadingContacts ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading contacts...</span>
                    </div>
                  </div>
                ) : chatContacts.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No chat contacts available</p>
                ) : (
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {chatContacts.map((chat) => {
                      const otherUser = chat.participants.find(p => p._id !== state._id);
                      return (
                        <div key={chat._id} className="d-flex align-items-center justify-content-between p-2 border-bottom">
                          <div className="d-flex align-items-center">
                            <img
                              src={otherUser?.pic || `https://ui-avatars.com/api/?name=${otherUser?.name}&background=random`}
                              alt={otherUser?.name}
                              className="rounded-circle me-3"
                              width="40"
                              height="40"
                            />
                            <div>
                              <p className="mb-0 dark:text-white">{otherUser?.name}</p>
                              <small className="text-gray-500">{otherUser?.email}</small>
                            </div>
                          </div>
                          <button
                            onClick={() => handleShareToChat(chat._id, otherUser?.name)}
                            disabled={sharingToChat === chat._id}
                            className="btn btn-primary btn-sm"
                          >
                            {sharingToChat === chat._id ? (
                              <div className="spinner-border spinner-border-sm" role="status" />
                            ) : (
                              'Send'
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
};

export default PostCard; 