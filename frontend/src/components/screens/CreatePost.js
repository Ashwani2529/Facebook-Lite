import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiPhotograph, HiX, HiArrowLeft } from 'react-icons/hi';
import toast from 'react-hot-toast';
import imageCompression from "browser-image-compression";

// Import our modern UI components
import { Button, Card } from '../ui';
import Navbar from '../layout/Navbar';

// Import utilities
import { UserContext } from '../../App';
import SERVER_URL from '../../server_url';

const CreatePost = () => {
  const { state } = useContext(UserContext);
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    body: '',
    image: null,
    imagePreview: '',
    tags: []
  });

  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle image selection
  const handleImageSelect = (file) => {
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    const imagePreview = URL.createObjectURL(file);
    
    setFormData(prev => ({
      ...prev,
      image: file,
      imagePreview
    }));

    toast.success('Image selected successfully!');
  };

  // Handle file input change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    handleImageSelect(file);
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleImageSelect(files[0]);
    }
  };

  // Remove selected image
  const removeImage = () => {
    if (formData.imagePreview) {
      URL.revokeObjectURL(formData.imagePreview);
    }
    setFormData(prev => ({
      ...prev,
      image: null,
      imagePreview: ''
    }));
  };

  // Upload image to Cloudinary
  const uploadImage = async (compressedImage) => {
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
        throw new Error('Failed to upload image');
      }

      const result = await response.json();
      return result.url;
    } catch (error) {
      throw new Error('Image upload failed: ' + error.message);
    }
  };

  // Create post
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.body.trim()) {
      toast.error('Please write something for your post!');
      return;
    }

    if (!formData.image) {
      toast.error('Please select an image for your post!');
      return;
    }

    setLoading(true);

    try {
      // Show compression progress
      toast.loading('Compressing image...', { id: 'compress' });

      // Compress image
      const compressionOptions = {
        maxSizeMB: 2,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        fileType: 'image/jpeg'
      };

      const compressedImage = await imageCompression(formData.image, compressionOptions);
      toast.success('Image compressed successfully!', { id: 'compress' });

      // Upload image
      toast.loading('Uploading image...', { id: 'upload' });
      const imageUrl = await uploadImage(compressedImage);
      toast.success('Image uploaded successfully!', { id: 'upload' });

      // Create post
      toast.loading('Creating post...', { id: 'post' });

              const response = await fetch(`${SERVER_URL}/api/v1/posts/createpost`, {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + localStorage.getItem("jwt"),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          body: formData.body.trim(),
          photo: imageUrl
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create post');
      }

      toast.success('Post created successfully!', { id: 'post' });

      // Clean up and redirect
      if (formData.imagePreview) {
        URL.revokeObjectURL(formData.imagePreview);
      }

      // Redirect to home with a slight delay
      setTimeout(() => {
        navigate('/');
      }, 1000);

    } catch (error) {
      console.error('Error creating post:', error);
      toast.error(error.message || 'Failed to create post. Please try again.');
      toast.dismiss('compress');
      toast.dismiss('upload');
      toast.dismiss('post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-facebook-dark">
      <Navbar />
      
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <HiArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              Create Post
            </h1>
          </div>
        </motion.div>

        {/* Main Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* User Info */}
              <div className="flex items-center space-x-3 pb-4 border-b border-gray-100 dark:border-gray-700">
                <img
                  src={state?.pic || 'https://via.placeholder.com/40'}
                  alt={state?.name || 'User'}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-medium text-gray-900">
                    {state?.name || 'Anonymous User'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Public post
                  </p>
                </div>
              </div>

              {/* Post Content */}
              <div>
                <textarea
                  placeholder="What's on your mind?"
                  value={formData.body}
                  onChange={(e) => handleInputChange('body', e.target.value)}
                  className="
                    w-full p-4 border-none resize-none text-lg placeholder-gray-400
                    bg-transparent text-gray-900
                    focus:outline-none
                    min-h-[120px]
                  "
                  disabled={loading}
                />
              </div>

              {/* Image Upload Area */}
              <div className="space-y-4">
                {!formData.imagePreview && (
                  <div
                    className={`
                      border-2 border-dashed rounded-xl p-8 text-center transition-colors
                      ${dragOver 
                        ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20' 
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      }
                    `}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="image-upload"
                      disabled={loading}
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <div className="flex flex-col items-center space-y-3">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                          <HiPhotograph className="w-8 h-8 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-lg font-medium text-gray-700">
                            Add photos
                          </p>
                                                      <p className="text-sm text-gray-500">
                            Drag and drop or click to select
                          </p>
                        </div>
                      </div>
                    </label>
                  </div>
                )}

                {/* Image Preview */}
                <AnimatePresence>
                  {formData.imagePreview && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="relative rounded-xl overflow-hidden"
                    >
                      <img
                        src={formData.imagePreview}
                        alt="Preview"
                        className="w-full h-64 object-cover"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        disabled={loading}
                        className="
                          absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70
                          rounded-full text-white transition-colors
                          disabled:opacity-50 disabled:cursor-not-allowed
                        "
                      >
                        <HiX className="w-5 h-5" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="facebook"
                  loading={loading}
                  disabled={loading || !formData.body.trim() || !formData.image}
                  className="flex-1"
                >
                  {loading ? 'Creating...' : 'Create Post'}
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6"
        >
          <Card className="p-4">
            <h3 className="font-medium text-gray-900 mb-2">
              Tips for great posts
            </h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Use high-quality images (up to 5MB)</li>
              <li>• Write engaging captions</li>
              <li>• Images will be compressed automatically</li>
              <li>• Supported formats: JPEG, PNG, GIF, WebP</li>
            </ul>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default CreatePost;