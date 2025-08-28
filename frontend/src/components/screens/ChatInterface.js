import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserContext } from '../../App';
import { generateAvatarPlaceholder } from '../../utils/avatarUtils';
import { HiArrowLeft, HiPaperAirplane, HiPhotograph, HiEmojiHappy, HiDotsVertical, HiX } from 'react-icons/hi';
import SERVER_URL from '../../server_url';
import io from 'socket.io-client';
import toast from 'react-hot-toast';
import imageCompression from "browser-image-compression";
import EmojiPicker from 'emoji-picker-react';
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
  
  // Image upload states
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Emoji picker state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);
  const fileInputRef = useRef(null);

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
      newSocket.emit('join_chat', chatId);
    });

    // Listen for new messages
    newSocket.on('new_message', (data) => {
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
      if (data.userId !== state._id) {
        setOtherUserTyping(true);
      }
    });

    newSocket.on('user_stopped_typing', (data) => {
      if (data.userId !== state._id) {
        setOtherUserTyping(false);
      }
    });

    newSocket.on('disconnect', () => {
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

  // Handle image selection
  const handleImageSelect = (file) => {
    if (!file) {
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      console.log('❌ Invalid file type:', file.type);
      toast.error('Please select a valid image file (JPEG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      console.log('❌ File too large:', file.size);
      toast.error('Image size should be less than 5MB');
      return;
    }

    try {
        // Create preview
      const imagePreviewUrl = URL.createObjectURL(file);
      
      setSelectedImage(file);
      setImagePreview(imagePreviewUrl);
    } catch (error) {
      console.error('❌ Error creating image preview:', error);
      toast.error('Failed to create image preview');
    }
  };

  // Handle file input change
  const handleFileChange = (e) => {
    
    const file = e.target.files[0];
    
    if (file) {
      handleImageSelect(file);
    } else {
      console.log('❌ No file found in the selection');
    }
  };

  // Remove selected image
  const removeSelectedImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setSelectedImage(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Upload image to Cloudinary
  const uploadImageToCloudinary = async (compressedImage) => {
    const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;
    
    const data = new FormData();
    data.append("file", compressedImage);
    data.append("upload_preset", uploadPreset);
    data.append("cloud_name", cloudName);

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: data
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      return result.secure_url;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  // Send image message
  const sendImageMessage = async () => {
    if (!selectedImage || uploadingImage) return;

    setUploadingImage(true);
    setSending(true);

    try {
      // Compress image
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true
      };
      const compressedFile = await imageCompression(selectedImage, options);
      
      // Upload to Cloudinary
      const imageUrl = await uploadImageToCloudinary(compressedFile);

      // Send message with image
      const token = localStorage.getItem('jwt');
      const response = await fetch(`${SERVER_URL}/api/v1/chat/chat/${chatId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: imageUrl,
          messageType: 'image'
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Remove selected image
        removeSelectedImage();
        toast.success('Image sent!');
      } else {
        throw new Error('Failed to send image');
      }
    } catch (error) {
      console.error('Error sending image:', error);
      toast.error('Failed to send image. Please try again.');
    } finally {
      setUploadingImage(false);
      setSending(false);
    }
  };

  // Handle emoji selection
  const onEmojiClick = (emojiData, event) => {
    setNewMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  // Function to make URLs clickable
  const makeLinksClickable = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    
    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        const isPostLink = part.includes('/post/');
        return (
          <a 
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 bg-black font-bold hover:text-blue-700 underline"
            style={{ color: '#1976d2' }}
            onClick={(e) => {
              if (isPostLink) {
                // For post links, navigate within the app
                e.preventDefault();
                const postId = part.split('/post/')[1];
                window.open(`/post/${postId}`, '_blank');
              }
            }}
          >
            {isPostLink ? 'View Post' : part}
          </a>
        );
      }
      return part;
    });
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
                    {(message.type === 'image' || (message.content && message.content.includes('cloudinary.com'))) ? (
                      <div className="message-image">
                        <img 
                          src={message.content} 
                          alt="Shared image" 
                          className="img-fluid rounded-3 mb-2"
                          style={{ maxWidth: '200px', maxHeight: '200px', cursor: 'pointer' }}
                          onClick={() => window.open(message.content, '_blank')}
                        />
                      </div>
                    ) : (
                      <p className="mb-1 dark:text-black">
                        {makeLinksClickable(message.content)}
                      </p>
                    )}
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
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            style={{ display: 'none' }}
          />
          
          <button 
            type="button" 
            className="btn btn-link p-2 text-gray-500"
            title="Attach Photo"
            onClick={() => {
                fileInputRef.current.click();
            }}
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
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <HiEmojiHappy className="text-gray-500" size={20} />
            </button>
            
            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div className="position-absolute" style={{ bottom: '60px', right: '-6px', zIndex: 1000 }}>
                <EmojiPicker 
                  onEmojiClick={onEmojiClick}
                  width={300}
                  height={400}
                />
              </div>
            )}
          </div>
          
          <button 
            type="submit" 
            disabled={(!newMessage.trim() && !selectedImage) || sending}
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

        {/* Image Preview Modal */}
        {selectedImage && (
          <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999 }}>
            <div className="bg-white dark:bg-gray-800 rounded-3 p-4 mx-3" style={{ maxWidth: '500px', width: '100%' }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0 dark:text-white">Send Image</h5>
                <button 
                  type="button"
                  className="btn btn-link p-0 text-gray-500"
                  onClick={removeSelectedImage}
                >
                  <HiX size={24} />
                </button>
              </div>
              
              <div className="text-center mb-3">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="img-fluid rounded-3"
                  style={{ maxHeight: '300px' }}
                />
              </div>
              
              <div className="d-flex gap-2 justify-content-end">
                <button 
                  type="button"
                  className="btn btn-secondary"
                  onClick={removeSelectedImage}
                  disabled={uploadingImage}
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  className="btn btn-primary"
                  onClick={sendImageMessage}
                  disabled={uploadingImage}
                >
                  {uploadingImage ? (
                    <>
                      <div className="spinner-border spinner-border-sm me-2" role="status">
                        <span className="visually-hidden">Uploading...</span>
                      </div>
                      Sending...
                    </>
                  ) : (
                    'Send Image'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
};

export default ChatInterface; 