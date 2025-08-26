import React, { useState, useEffect, useContext } from 'react';
import Navbar from '../layout/Navbar';
import { useParams, useNavigate } from 'react-router-dom';
import { UserContext } from '../../App';
import Profilecards from './Profilecards';
import { generateAvatarPlaceholder } from '../../utils/avatarUtils';
import { HiChat, HiUserAdd, HiUserRemove } from 'react-icons/hi';
import SERVER_URL from '../../server_url';

const Individualprfle = () => {
  const { userid } = useParams();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [chatRequestStatus, setChatRequestStatus] = useState(null);
  const [isChatRequestLoading, setIsChatRequestLoading] = useState(false);
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

      // Check chat request status
      fetch(`${SERVER_URL}/api/v1/chat/request-status/${userid}`, {
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('jwt')
        }
      })
        .then(res => res.json())
        .then(result => {
          setChatRequestStatus(result);
        })
        .catch(err => console.error('Chat request status error:', err));
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

  // Handle chat request
  const handleChatRequest = async () => {
    if (isChatRequestLoading) return;
    
    setIsChatRequestLoading(true);
    
    try {
      const response = await fetch(`${SERVER_URL}/api/v1/chat/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('jwt')
        },
        body: JSON.stringify({ 
          receiverId: userid,
          message: `Hi ${userProfile?.user?.name || 'there'}! I'd like to chat with you.`
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setChatRequestStatus({
          status: 'pending',
          isSender: true
        });
        alert('Chat request sent successfully!');
      } else {
        alert(data.error || 'Failed to send chat request');
      }
    } catch (error) {
      console.error('Chat request error:', error);
      alert('Failed to send chat request');
    } finally {
      setIsChatRequestLoading(false);
    }
  };

  // Get chat request button text and variant
  const getChatButtonConfig = () => {
    if (!chatRequestStatus || chatRequestStatus.status === null) {
      return { text: 'Send Request', variant: 'success', icon: HiChat, disabled: false };
    }
    
    const { status, isSender } = chatRequestStatus;
    
    if (status === 'pending') {
      return isSender 
        ? { text: 'Request Sent', variant: 'outline', icon: HiChat, disabled: true }
        : { text: 'Request Received', variant: 'warning', icon: HiChat, disabled: true };
    }
    
    if (status === 'accepted') {
      return { text: 'Open Chat', variant: 'primary', icon: HiChat, disabled: false };
    }
    
    if (status === 'declined') {
      return { text: 'Request Declined', variant: 'outline', icon: HiChat, disabled: true };
    }
    
    return { text: 'Send Request', variant: 'success', icon: HiChat, disabled: false };
  };

  return (
    <>
      <Navbar />
      {userProfile ? (
        <div className='container-fluid bg-gray-50 dark:bg-facebook-dark min-h-screen py-4'>
          <div className='row'>
            {/* Profile Picture */}
            <div className='col-md-4 picture text-center'>
              <img 
                height='300px' 
                width='300px' 
                src={userProfile.user.pic && userProfile.user.pic !== 'none' 
                  ? userProfile.user.pic 
                  : generateAvatarPlaceholder(userProfile.user.name || 'User', 300)
                } 
                alt='Profile Picture'
                style={{ borderRadius: '15px', objectFit: 'cover' }}
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
                      const config = getChatButtonConfig();
                      if (config.text === 'Open Chat') {
                        // Find existing chat with this user
                        try {
                          const response = await fetch(`${SERVER_URL}/api/v1/chat/chats`, {
                            headers: {
                              'Authorization': 'Bearer ' + localStorage.getItem('jwt')
                            }
                          });
                          const data = await response.json();
                          if (data.success) {
                            const existingChat = data.chats.find(chat => 
                              chat.participants.some(p => p._id === userid)
                            );
                            if (existingChat) {
                              navigate(`/chat/${existingChat._id}`);
                            } else {
                              alert('Chat not found. Please try again.');
                            }
                          }
                        } catch (error) {
                          console.error('Find chat error:', error);
                          alert('Failed to open chat');
                        }
                      } else if (!config.disabled && config.text === 'Send Request') {
                        handleChatRequest();
                      }
                    }}
                    disabled={isChatRequestLoading || getChatButtonConfig().disabled}
                    className={`btn btn-${getChatButtonConfig().variant} px-2 py-2 d-flex align-items-center`}
                  >
                    {isChatRequestLoading ? (
                      <span>Loading...</span>
                    ) : (
                      <>
                        {React.createElement(getChatButtonConfig().icon, { className: "me-2", size: 16 })}
                        <span>{getChatButtonConfig().text}</span>
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
