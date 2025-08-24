import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiUser, HiMail, HiLockClosed, HiPhone, HiCalendar, HiLocationMarker, HiSave } from 'react-icons/hi';
import toast from 'react-hot-toast';

import { UserContext } from '../../App';
import Navbar from '../layout/Navbar';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import SERVER_URL from '../../server_url';
import { generateAvatarPlaceholder } from '../../utils/avatarUtils';

const Settings = () => {
  const { state, dispatch } = useContext(UserContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    location: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    pic: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (state) {
      console.log('Settings - Loading state data:', {
        name: state.name,
        pic: state.pic,
        bio: state.bio
      });
      
      setFormData(prev => ({
        ...prev,
        name: state.name || '',
        email: state.email || '',
        bio: state.bio || '',
        location: state.location || '',
        phone: state.phone || '',
        dateOfBirth: state.dateOfBirth ? state.dateOfBirth.split('T')[0] : '',
        gender: state.gender || '',
        address: state.address || '',
        pic: state.pic || ''
      }));
      setImagePreview(state.pic || '');
    }
  }, [state]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.newPassword && !formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required to set new password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors below');
      return;
    }

    setLoading(true);

    try {
      let profilePicUrl = formData.pic;

      // Upload profile image if changed
      if (profileImage) {
        const imageData = new FormData();
        imageData.append('file', profileImage);
        imageData.append('cloud_name', 'dtrsgpw04');
        imageData.append('upload_preset', 'Cloudy'); // You'll need to set this up in Cloudinary
        
        try {
          const uploadResponse = await fetch('https://api.cloudinary.com/v1_1/dtrsgpw04/image/upload', {
            method: 'POST',
            body: imageData
          });
          const uploadData = await uploadResponse.json();
          if (uploadData.secure_url) {
            profilePicUrl = uploadData.secure_url;
          }
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          toast.error('Failed to upload profile picture');
        }
      }

      // Prepare update payload
      const updatePayload = {
        name: formData.name,
        bio: formData.bio,
        location: formData.location,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        address: formData.address
      };

      // Only include pic if it's a valid URL or empty
      if (profilePicUrl && profilePicUrl !== 'none' && profilePicUrl.trim() !== '') {
        // Check if it's a valid URL or let backend handle validation
        updatePayload.pic = profilePicUrl;
      } else {
        // Send empty string for no profile picture
        updatePayload.pic = '';
      }

      console.log('Update payload:', updatePayload);

      // Update profile info
      const profileResponse = await fetch(`${SERVER_URL}/api/v1/auth/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt')}`
        },
        body: JSON.stringify(updatePayload)
      });

      const profileData = await profileResponse.json();

      if (profileData.success) {
        // Update local user state
        dispatch({ type: 'USER', payload: profileData.user });
        localStorage.setItem('user', JSON.stringify(profileData.user));
        toast.success('Profile updated successfully!');

        // Handle password change if provided
        if (formData.newPassword) {
          const passwordResponse = await fetch(`${SERVER_URL}/api/v1/auth/change-password`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('jwt')}`
            },
            body: JSON.stringify({
              currentPassword: formData.currentPassword,
              newPassword: formData.newPassword
            })
          });

          const passwordData = await passwordResponse.json();

          if (passwordData.success) {
            toast.success('Password updated successfully!');
            setFormData(prev => ({
              ...prev,
              currentPassword: '',
              newPassword: '',
              confirmPassword: ''
            }));
          } else {
            toast.error(passwordData.error || 'Failed to update password');
          }
        }
      } else {
        toast.error(profileData.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Settings update error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
            Account Settings
          </h1>
          <p className="text-gray-600 mt-2">
            Update your profile information and account settings
          </p>
        </motion.div>

        {/* Settings Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Picture */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">
                  Profile Picture
                </h2>
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <img
                      src={imagePreview || formData.pic || generateAvatarPlaceholder(state?.name || 'User', 96)}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover border-4 border-gray-200 dark:border-gray-600"
                      onError={(e) => {
                        e.target.src = generateAvatarPlaceholder(state?.name || 'User', 96);
                      }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-40 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                      <label htmlFor="profile-image" className="cursor-pointer">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </label>
                    </div>
                  </div>
                  <div>
                    <input
                      type="file"
                      id="profile-image"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="profile-image"
                      className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors"
                    >
                      Change Picture
                    </label>
                    <p className="text-sm text-gray-500 mt-2">
                      JPG, GIF or PNG. Max size of 5MB.
                    </p>
                  </div>
                </div>
              </div>

              {/* Basic Information */}
              <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-900">
                  Basic Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    type="text"
                    style={{
                      paddingLeft: '42px',
                    }}
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    icon={<HiUser className="w-5 h-5" />}
                    error={errors.name}
                    required
                  />
                  
                  <Input
                    type="email"
                    style={{
                      paddingLeft: '42px',
                    }}
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    icon={<HiMail className="w-5 h-5" />}
                    error={errors.email}
                    required
                  />

                  <Input
                    type="tel"
                    style={{
                      paddingLeft: '42px',
                    }}
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    icon={<HiPhone className="w-5 h-5" />}
                  />

                  <Input
                    type="date"
                    style={{
                      paddingLeft: '42px',
                    }}
                    placeholder="Date of Birth"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    icon={<HiCalendar className="w-5 h-5" />}
                  />

                  <div className="md:col-span-1">
                    <select
                      value={formData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="w-full px-4 py-3 pl-14 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  </div>

                  <Input
                    type="text"
                    placeholder="Location"
                    style={{
                      paddingLeft: '42px',
                    }}
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    icon={<HiLocationMarker className="w-5 h-5" />}
                  />
                </div>

                <div className="mt-6">
                  <textarea
                    placeholder="Bio - Tell us about yourself..."
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    rows="4"
                    className="w-full px-4 py-3 pl-14 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  />
                </div>

                <div className="mt-6">
                  <textarea
                    placeholder="Address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    rows="3"
                    className="w-full px-4 py-3 pl-14 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>

              {/* Password Change */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">
                  Change Password
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Input
                    type="password"
                    placeholder="Current Password"
                    style={{
                      paddingLeft: '42px'
                    }}
                    value={formData.currentPassword}
                    onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                    icon={<HiLockClosed className="w-5 h-5" />}
                    error={errors.currentPassword}
                  />
                  
                  <Input
                    type="password"
                    placeholder="New Password"
                    style={{
                      paddingLeft: '42px'
                    }}
                    value={formData.newPassword}
                    onChange={(e) => handleInputChange('newPassword', e.target.value)}
                    icon={<HiLockClosed className="w-5 h-5" />}
                  />

                  <Input
                    type="password"
                    placeholder="Confirm New Password"
                    style={{
                      paddingLeft: '42px'
                    }}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    icon={<HiLockClosed className="w-5 h-5" />}
                    error={errors.confirmPassword}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/profile')}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  variant="facebook"
                  loading={loading}
                  disabled={loading}
                  className="flex items-center space-x-2"
                >
                  <HiSave className="w-5 h-5" />
                  <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
        </div>
      </div>
    </>
  );
};

export default Settings; 