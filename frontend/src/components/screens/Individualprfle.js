import React, { useState, useEffect, useContext } from 'react';
import Navbar from '../layout/Navbar';
import { useParams, useNavigate } from 'react-router-dom';
import { UserContext } from '../../App';
import Profilecards from './Profilecards';
import { generateAvatarPlaceholder } from '../../utils/avatarUtils';
import { HiChat, HiUserAdd, HiUserRemove } from 'react-icons/hi';
import toast from 'react-hot-toast';
import SERVER_URL from '../../server_url';

const Individualprfle = () => {
  const { userid } = useParams();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [friendRequestStatus, setFriendRequestStatus] = useState('none');
  const [isFriendRequestLoading, setIsFriendRequestLoading] = useState(false);
  const { state, dispatch } = useContext(UserContext);

  // Fetch user profile data and chat request status
  useEffect(() => {
    if (userid && state) {
      // Fetch user profile
      fetch(`${SERVER_URL}/api/v1/users/user/${userid}`, {
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('jwt')
        }
      })
        .then(res => res.json())
        .then(result => {
          setUserProfile(result);
          // Check if current user is already following this user
          if (result.user) {
            setIsFollowing(state.following?.includes(userid) || false);
          }
        })
        .catch(err => console.error('Profile fetch error:', err));

      // Check friend request status
      fetch(`${SERVER_URL}/api/v1/friends/status/${userid}`, {
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('jwt')
        }
      })
        .then(res => res.json())
        .then(result => {
          setFriendRequestStatus(result.status);
        })
        .catch(err => console.error('Friend request status error:', err));
    }
  }, [userid, state]);

  // Handle follow/unfollow toggle
  const handleToggleFollow = async () => {
    if (isFollowLoading) return;
    
    setIsFollowLoading(true);
    
    try {
      const endpoint = isFollowing ? 'unfollow' : 'follow';
      const bodyKey = isFollowing ? 'unfollowid' : 'followid';
      
      const response = await fetch(`${SERVER_URL}/api/v1/users/${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('jwt')
        },
        body: JSON.stringify({ [bodyKey]: userid })
      });

      const data = await response.json();
      
      if (data.success && data.user) {
        dispatch({
          type: "UPDATE",
          payload: {
            following: data.user.following,
            followers: data.user.followers
          }
        });
        localStorage.setItem("user", JSON.stringify(data.user));
        
        // Update local follow state
        setIsFollowing(!isFollowing);
        
        // Update the profile's follower count
        setUserProfile(prev => {
          if (!prev) return prev;
          
          const updatedFollowers = isFollowing 
            ? prev.user.followers.filter(id => id !== state._id)
            : [...prev.user.followers, state._id];
            
          return {
            ...prev,
            user: {
              ...prev.user,
              followers: updatedFollowers
            }
          };
        });
      }
    } catch (error) {
      console.error('Follow/unfollow error:', error);
    } finally {
      setIsFollowLoading(false);
    }
  };

  // Handle friend request
  const handleFriendRequest = async () => {
    if (isFriendRequestLoading) return;
    
    setIsFriendRequestLoading(true);
    
    try {
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
          'Authorization': 'Bearer ' + localStorage.getItem('jwt')
        },
        body: JSON.stringify({ userId: userid })
      });

      const data = await response.json();
      
      if (response.ok) {
        setFriendRequestStatus(data.status);
        toast.success(data.message);
      } else {
        toast.error(data.error || 'Failed to process friend request');
      }
    } catch (error) {
      console.error('Friend request error:', error);
      toast.error('Failed to process friend request');
    } finally {
      setIsFriendRequestLoading(false);
    }
  };

  // Get friend request button text and variant
  const getFriendButtonConfig = () => {
    switch (friendRequestStatus) {
      case 'sent':
        return { text: 'Cancel Request', variant: 'outline', icon: HiUserRemove, disabled: false };
      case 'received':
        return { text: 'Accept Request', variant: 'success', icon: HiUserAdd, disabled: false };
      case 'friends':
        return { text: 'Send Message', variant: 'primary', icon: HiChat, disabled: false };
      default:
        return { text: 'Add Friend', variant: 'outline', icon: HiUserAdd, disabled: false };
    }
  };

  // Handle chat navigation when users are friends
  const handleChatNavigation = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/api/v1/chat/find-or-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('jwt')
        },
        body: JSON.stringify({ userId: userid })
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

  return (
    <>
      <Navbar />
      {userProfile ? (
        <div className='container-fluid bg-gray-50 dark:bg-facebook-dark min-h-screen py-4'>
          <div className='row'>
            {/* Profile Picture */}
            <div className='flex items-center justify-center col-md-4 picture text-center'>
              <img 
                height='300px' 
                width='300px' 
                src={userProfile.user.pic && userProfile.user.pic !== 'none' 
                  ? userProfile.user.pic 
                  : generateAvatarPlaceholder(userProfile.user.name || 'User', 300)
                } 
                alt='Profile Picture'
                style={{ borderRadius: '15px', objectFit: 'fill',height:'300px',width:'300px' }}
                onError={(e) => {
                  e.target.src = generateAvatarPlaceholder(userProfile.user.name || 'User', 300);
                }}
              />
            </div>

            {/* Profile Info */}
            <div className='col-md-8 d-block'>
              <div className='d-block align-items-center'>
                <h3 className='m-4 text-gray-900 dark:text-white'>{userProfile.user.name}</h3>
                <div className='d-flex gap-2 m-2'>
                  <button 
                    onClick={handleToggleFollow}
                    disabled={isFollowLoading}
                    className={`btn ${isFollowing ? 'btn-outline-primary' : 'btn-primary'} px-2 py-2 d-flex align-items-center`}
                  >
                    {isFollowLoading ? (
                      <span>Loading...</span>
                    ) : isFollowing ? (
                      <>
                        <HiUserRemove className="me-2" size={16} />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <HiUserAdd className="me-2" size={16} />
                        <span>Follow</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={async () => {
                      const config = getFriendButtonConfig();
                      if (config.text === 'Send Message') {
                        handleChatNavigation();
                      } else {
                        handleFriendRequest();
                      }
                    }}
                    disabled={isFriendRequestLoading || getFriendButtonConfig().disabled}
                    className={`btn btn-${getFriendButtonConfig().variant} px-2 py-2 d-flex align-items-center`}
                  >
                    {isFriendRequestLoading ? (
                      <span>Loading...</span>
                    ) : (
                      <>
                        {React.createElement(getFriendButtonConfig().icon, { className: "me-2", size: 16 })}
                        <span>{getFriendButtonConfig().text}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className='d-flex justify-content-between align-items-center'>
                <div className='d-flex'>
                  <p className='my-5 p-3 text-gray-900 dark:text-white'>
                    <strong>{userProfile.posts ? userProfile.posts.length : 0}</strong> Posts
                  </p>
                  <p className='my-5 p-3 text-gray-900 dark:text-white'>
                    <strong>{userProfile.user.followers ? userProfile.user.followers.length : 0}</strong> Followers
                  </p>
                  <p className='my-5 p-3 text-gray-900 dark:text-white'>
                    <strong>{userProfile.user.following ? userProfile.user.following.length : 0}</strong> Following
                  </p>
                </div>
              </div>
                
              {/* Bio */}
              <div>
                <p className='m-3 text-gray-900 dark:text-white'>
                  {userProfile.user.bio || 'No bio available'}
                </p>
              </div>
            </div>
            <div className='border-light border-bottom my-4'></div>
          </div>

          {/* Posts Grid */}
          <div className='row'>
            {userProfile.posts && userProfile.posts.length > 0 ? (
              userProfile.posts.map((item, index) => (
                <Profilecards 
                  key={item._id || index}
                  postId={item._id}
                  url={item.photo} 
                  body={item.body}
                  isOwner={false}
                  onPostUpdate={() => {}}
                  onPostDelete={() => {}}
                />
              ))
            ) : (
              <div className='col-12 text-center py-5'>
                <p className='text-gray-500 dark:text-gray-400'>No posts yet</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Loading state
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}> 
          <div className="spinner-grow text-primary" style={{ width: "3rem", height: "3rem" }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}
    </>
  );
};

export default Individualprfle;
