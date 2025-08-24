import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserContext } from '../../App';
import { generateAvatarPlaceholder } from '../../utils/avatarUtils';
import { HiArrowLeft, HiPaperAirplane, HiPhotograph, HiEmojiHappy, HiDotsVertical } from 'react-icons/hi';
import SERVER_URL from '../../server_url';
import io from 'socket.io-client';
import './ChatInterface.css';

const ChatInterface = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { state } = useContext(UserContext);
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const [typing, setTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);

  useEffect(() => {
    if (chatId && state) {
      fetchChat();
      fetchMessages();
      initializeSocket();
    }

    return () => {
      if (socket) {
        socket.emit('leave_chat', chatId);
        socket.disconnect();
      }
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
    };
  }, [chatId, state]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize Socket.IO connection
  const initializeSocket = () => {
    const newSocket = io(SERVER_URL || 'http://localhost:5000', {
      withCredentials: true
    });

    newSocket.on('connect', () => {
      console.log('🔗 Connected to Socket.IO server');
      newSocket.emit('join_chat', chatId);
    });

    // Listen for new messages
    newSocket.on('new_message', (data) => {
      console.log('📨 Received new message:', data);
      if (data.chatId === chatId) {
        setMessages(prev => {
          // Check if message already exists to avoid duplicates
          const exists = prev.some(msg => msg._id === data.message._id);
          if (exists) return prev;
          return [...prev, data.message];
        });
      }
    });

    // Listen for typing indicators
    newSocket.on('user_typing', (data) => {
      console.log('👤 User typing:', data);
      if (data.userId !== state._id) {
        setOtherUserTyping(true);
      }
    });

    newSocket.on('user_stopped_typing', (data) => {
      console.log('👤 User stopped typing:', data);
      if (data.userId !== state._id) {
        setOtherUserTyping(false);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from Socket.IO server');
    });

    setSocket(newSocket);
  };

  const fetchChat = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/api/v1/chat/chats`, {
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('jwt')
        }
      });
      const data = await response.json();
      if (data.success) {
        const currentChat = data.chats.find(c => c._id === chatId);
        if (currentChat) {
          setChat(currentChat);
          const other = currentChat.participants.find(p => p._id !== state._id);
          setOtherUser(other);
        } else {
          navigate('/chats');
        }
      }
    } catch (error) {
      console.error('Fetch chat error:', error);
      navigate('/chats');
    }
  };

  const fetchMessages = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      
      const response = await fetch(`${SERVER_URL}/api/v1/chat/chat/${chatId}/messages`, {
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('jwt')
        }
      });
      const data = await response.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Fetch messages error:', error);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage('');

    // Stop typing indicator
    if (typing && socket) {
      setTyping(false);
      socket.emit('stop_typing', {
        chatId: chatId,
        userId: state._id
      });
    }

    try {
      const response = await fetch(`${SERVER_URL}/api/v1/chat/chat/${chatId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('jwt')
        },
        body: JSON.stringify({
          content: messageContent,
          messageType: 'text'
        })
      });

      const data = await response.json();
      if (data.success) {
        // Socket.IO will handle adding the message to UI automatically
        // No need to refresh messages manually
      } else {
        alert('Failed to send message');
        setNewMessage(messageContent);
      }
    } catch (error) {
      console.error('Send message error:', error);
      alert('Failed to send message');
      setNewMessage(messageContent);
    } finally {
      setSending(false);
    }
  };

  // Handle typing indicators
  const handleTyping = () => {
    if (!socket || !otherUser) return;

    if (!typing) {
      setTyping(true);
      socket.emit('typing', {
        chatId: chatId,
        userId: state._id,
        userName: state.name
      });
    }

    // Clear existing timer
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    // Set new timer to stop typing after 1 second of inactivity
    typingTimerRef.current = setTimeout(() => {
      setTyping(false);
      if (socket) {
        socket.emit('stop_typing', {
          chatId: chatId,
          userId: state._id
        });
      }
    }, 1000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatMessageTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatMessageDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const shouldShowDateSeparator = (message, index) => {
    if (index === 0) return true;
    const currentDate = new Date(message.createdAt).toDateString();
    const previousDate = new Date(messages[index - 1].createdAt).toDateString();
    return currentDate !== previousDate;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center bg-gray-50 dark:bg-facebook-dark" style={{ minHeight: '100vh' }}>
        <div className="spinner-grow text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!chat || !otherUser) {
    return (
      <div className="d-flex justify-content-center align-items-center bg-gray-50 dark:bg-facebook-dark" style={{ minHeight: '100vh' }}>
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">Chat not found</p>
          <button onClick={() => navigate('/chats')} className="btn btn-primary mt-3">
            Back to Chats
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container d-flex flex-column bg-gray-50 dark:bg-facebook-dark" style={{ height: '100vh' }}>
      {/* Chat Header */}
      <div className="chat-header bg-white dark:bg-facebook-card border-bottom p-3 d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center">
          <button 
            onClick={() => navigate('/chats')}
            className="btn btn-link p-0 me-3 text-primary"
          >
            <HiArrowLeft size={24} />
          </button>
          <img
            src={otherUser.pic && otherUser.pic !== 'none' 
              ? otherUser.pic 
              : generateAvatarPlaceholder(otherUser.name, 40)
            }
            alt={otherUser.name}
            className="rounded-circle me-3"
            width="40"
            height="40"
            style={{ objectFit: 'cover' }}
            onError={(e) => {
              e.target.src = generateAvatarPlaceholder(otherUser.name, 40);
            }}
          />
          <div>
            <h6 className="mb-0 text-gray-900 dark:text-black">{otherUser.name}</h6>
            <small className="text-gray-500">Online</small>
          </div>
        </div>
        <button className="btn btn-link p-2">
          <HiDotsVertical className="text-gray-500" size={20} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="chat-messages flex-grow-1 overflow-auto p-3 bg-gray-50 dark:bg-gray-700">
        <div className="d-flex flex-column">
          {messages.map((message, index) => (
            <React.Fragment key={message._id}>
              {/* Date Separator */}
              {shouldShowDateSeparator(message, index) && (
                <div className="d-flex justify-content-center my-3">
                  <div className="bg-white dark:bg-facebook-card px-3 py-1 rounded-pill shadow-sm">
                    <small className="text-gray-900 dark:text-gray-700">
                      {formatMessageDate(message.createdAt)}
                    </small>
                  </div>
                </div>
              )}

              {/* Message Bubble */}
              <div className={`d-flex mb-2 ${message.sender._id === state._id ? 'justify-content-end' : 'justify-content-start'}`}>
                <div 
                  className={`message-bubble px-3 py-2 rounded-3 ${
                    message.sender._id === state._id 
                      ? 'bg-primary text-white ms-5' 
                      : 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white me-5 shadow-sm'
                  }`}
                  style={{ maxWidth: '75%' }}
                >
                  <div className="message-content">
                    <p className="mb-1 dark:text-black">{message.content}</p>
                    <div className="d-flex align-items-center justify-content-end">
                      <small 
                        className={message.sender._id === state._id ? 'text-white-50' : 'text-gray-500'}
                        style={{ fontSize: '0.7rem' }}
                      >
                        {formatMessageTime(message.createdAt)}
                      </small>
                      {message.sender._id === state._id && (
                        <span className="ms-1 text-black">
                          {message.readStatus === 'read' ? '✓✓' : '✓'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </React.Fragment>
          ))}

          {/* Typing Indicator */}
          {otherUserTyping && (
            <div className="d-flex justify-content-start mb-2">
              <div className="bg-white dark:bg-gray-600 px-3 py-2 rounded-3 me-5 shadow-sm">
                <div className="typing-indicator d-flex align-items-center">
                  <div className="typing-dots">
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                  </div>
                  <small className="ms-2 text-gray-500 dark:text-gray-400">
                    {otherUser?.name} is typing...
                  </small>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="chat-input-container bg-white dark:bg-facebook-card p-3 border-top">
        <form onSubmit={sendMessage} className="d-flex align-items-center gap-2">
          <button 
            type="button" 
            className="btn btn-link p-2 text-gray-500"
            title="Attach Photo"
          >
            <HiPhotograph size={20} />
          </button>
          
          <div className="flex-grow-1 position-relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(e);
                }
              }}
              placeholder="Type a message... (Press Enter to send)"
              className="chat-input form-control rounded-pill px-4 py-2 border-0 bg-gray-100 dark:bg-gray-700 dark:text-white"
              style={{ resize: 'none' }}
              disabled={sending}
            />
            <button 
              type="button" 
              className="btn btn-link position-absolute end-0 top-50 translate-middle-y me-2 p-1"
              title="Emoji"
            >
              <HiEmojiHappy className="text-gray-500" size={20} />
            </button>
          </div>
          
          <button 
            type="submit" 
            disabled={!newMessage.trim() || sending}
            className="send-button btn btn-primary rounded-circle p-2 d-flex align-items-center justify-content-center"
            style={{ width: '40px', height: '40px' }}
          >
            {sending ? (
              <div className="spinner-border spinner-border-sm text-white" role="status">
                <span className="visually-hidden">Sending...</span>
              </div>
            ) : (
              <HiPaperAirplane size={18} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface; 