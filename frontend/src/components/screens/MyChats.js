import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../layout/Navbar';
import { UserContext } from '../../App';
import { generateAvatarPlaceholder } from '../../utils/avatarUtils';
import { HiChat, HiCheck, HiX, HiClock } from 'react-icons/hi';
import SERVER_URL from '../../server_url';

const MyChats = () => {
  const [activeTab, setActiveTab] = useState('chats'); // 'chats' or 'requests'
  const [chats, setChats] = useState([]);
  const [chatRequests, setChatRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { state } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (state) {
      fetchChats();
      fetchChatRequests();
    }
  }, [state]);

  const fetchChats = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/api/v1/chat/chats`, {
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('jwt')
        }
      });
      const data = await response.json();
      if (data.success) {
        setChats(data.chats);
      }
    } catch (error) {
      console.error('Fetch chats error:', error);
    }
  };

  const fetchChatRequests = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/api/v1/chat/requests/received`, {
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('jwt')
        }
      });
      const data = await response.json();
      if (data.success) {
        setChatRequests(data.requests);
      }
    } catch (error) {
      console.error('Fetch chat requests error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChatRequestResponse = async (requestId, action) => {
    try {
      const response = await fetch(`${SERVER_URL}/api/v1/chat/request/${requestId}/respond`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('jwt')
        },
        body: JSON.stringify({ action })
      });

      const data = await response.json();
      if (data.success) {
        // Remove the request from the list
        setChatRequests(prev => prev.filter(req => req._id !== requestId));
        
        // If accepted, refresh chats to show the new conversation
        if (action === 'accept') {
          fetchChats();
        }
        
        alert(`Chat request ${action}ed successfully!`);
      } else {
        alert(data.error || `Failed to ${action} chat request`);
      }
    } catch (error) {
      console.error(`Chat request ${action} error:`, error);
      alert(`Failed to ${action} chat request`);
    }
  };

  const openChat = (chatId) => {
    navigate(`/chat/${chatId}`);
  };

  const getOtherParticipant = (chat) => {
    return chat.participants.find(p => p._id !== state._id);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="spinner-grow text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container-fluid bg-gray-50 dark:bg-facebook-dark min-h-screen py-4">
        <div className="row justify-content-center">
          <div className="col-lg-8 col-xl-6">
            {/* Header */}
            <div className="bg-gray-800 dark:bg-facebook-card rounded-xl shadow-lg mb-4 p-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                <HiChat className="inline me-2" size={24} />
                My Chats
              </h2>
              
              {/* Tabs */}
              <div className="d-flex gap-2 mb-4">
                <button
                  onClick={() => setActiveTab('chats')}
                  className={`btn ${activeTab === 'chats' ? 'btn-primary' : 'btn-outline-primary'} px-4 py-2`}
                >
                  Conversations ({chats.length})
                </button>
                <button
                  onClick={() => setActiveTab('requests')}
                  className={`btn ${activeTab === 'requests' ? 'btn-primary' : 'btn-outline-primary'} px-4 py-2 position-relative`}
                >
                  Requests ({chatRequests.length})
                  {chatRequests.length > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                      {chatRequests.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="bg-gray-800 dark:bg-facebook-card rounded-xl shadow-lg">
              {activeTab === 'chats' ? (
                /* Chat List */
                <div className="p-0">
                  {chats.length === 0 ? (
                    <div className="text-center py-5">
                      <HiChat size={48} className="text-gray-400 mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">No conversations yet</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500">
                        Send a chat request to start chatting with someone!
                      </p>
                    </div>
                  ) : (
                    chats.map((chat, index) => {
                      const otherUser = getOtherParticipant(chat);
                      return (
                        <div
                          key={chat._id}
                          onClick={() => openChat(chat._id)}
                          className={`d-flex align-items-center p-4 border-bottom hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                            index === chats.length - 1 ? 'border-0' : ''
                          }`}
                          style={{ cursor: 'pointer' }}
                        >
                          <img
                            src={otherUser.pic && otherUser.pic !== 'none' 
                              ? otherUser.pic 
                              : generateAvatarPlaceholder(otherUser.name, 50)
                            }
                            alt={otherUser.name}
                            className="rounded-circle me-3"
                            width="50"
                            height="50"
                            style={{ objectFit: 'cover' }}
                            onError={(e) => {
                              e.target.src = generateAvatarPlaceholder(otherUser.name, 50);
                            }}
                          />
                          <div className="flex-grow-1">
                            <h6 className="mb-1 text-gray-900 dark:text-white">{otherUser.name}</h6>
                            <p className="mb-0 text-sm text-gray-500 dark:text-gray-400">
                              {chat.lastMessage 
                                ? `${chat.lastMessage.sender?.name === state.name ? 'You: ' : ''}${chat.lastMessage.content}`
                                : 'Start a conversation'
                              }
                            </p>
                          </div>
                          <div className="text-end">
                            <small className="text-gray-400">
                              {formatTime(chat.lastActivity)}
                            </small>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                /* Chat Requests */
                <div className="p-0">
                  {chatRequests.length === 0 ? (
                    <div className="text-center py-5">
                      <HiClock size={48} className="text-gray-400 mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">No pending requests</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500">
                        Chat requests will appear here
                      </p>
                    </div>
                  ) : (
                    chatRequests.map((request, index) => (
                      <div
                        key={request._id}
                        className={`p-4 border-bottom ${
                          index === chatRequests.length - 1 ? 'border-0' : ''
                        }`}
                      >
                        <div className="d-flex align-items-start">
                          <img
                            src={request.sender.pic && request.sender.pic !== 'none'
                              ? request.sender.pic
                              : generateAvatarPlaceholder(request.sender.name, 50)
                            }
                            alt={request.sender.name}
                            className="rounded-circle me-3"
                            width="50"
                            height="50"
                            style={{ objectFit: 'cover' }}
                            onError={(e) => {
                              e.target.src = generateAvatarPlaceholder(request.sender.name, 50);
                            }}
                          />
                          <div className="flex-grow-1">
                            <h6 className="mb-1 text-gray-900 dark:text-white">
                              {request.sender.name}
                            </h6>
                            <p className="mb-2 text-sm text-gray-600 dark:text-gray-300">
                              {request.message || 'Wants to chat with you'}
                            </p>
                            <small className="text-gray-400">
                              {formatTime(request.createdAt)}
                            </small>
                          </div>
                        </div>
                        
                        <div className="d-flex gap-2 mt-3">
                          <button
                            onClick={() => handleChatRequestResponse(request._id, 'accept')}
                            className="btn btn-success px-3 py-2 d-flex align-items-center"
                          >
                            <HiCheck className="me-1" size={16} />
                            Accept
                          </button>
                          <button
                            onClick={() => handleChatRequestResponse(request._id, 'decline')}
                            className="btn btn-outline-danger px-3 py-2 d-flex align-items-center"
                          >
                            <HiX className="me-1" size={16} />
                            Decline
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MyChats; 