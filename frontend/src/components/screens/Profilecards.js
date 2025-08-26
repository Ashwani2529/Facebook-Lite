import React, { useState } from 'react';
import { HiPencil, HiTrash, HiX, HiCheck } from 'react-icons/hi';
import toast from 'react-hot-toast';
import SERVER_URL from '../../server_url';

const Profilecards = ({ url, body, postId, onPostUpdate, onPostDelete, isOwner = true }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedCaption, setEditedCaption] = useState(body);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle caption update
  const handleUpdateCaption = async () => {
    if (editedCaption.trim() === body.trim()) {
      setIsEditing(false);
      return;
    }

    setIsUpdating(true);
    try {
      const token = localStorage.getItem('jwt');
      const response = await fetch(`${SERVER_URL}/api/v1/posts/updatepost/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          body: editedCaption.trim()
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Caption updated successfully!');
        setIsEditing(false);
        if (onPostUpdate) {
          onPostUpdate(postId, editedCaption.trim());
        }
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update caption');
      }
    } catch (error) {
      console.error('Error updating caption:', error);
      toast.error('Failed to update caption');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle post deletion
  const handleDeletePost = async () => {
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('jwt');
      const response = await fetch(`${SERVER_URL}/api/v1/posts/deletepost/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Post deleted successfully!');
        setShowDeleteModal(false);
        if (onPostDelete) {
          onPostDelete(postId);
        }
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    } finally {
      setIsDeleting(false);
    }
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditedCaption(body);
    setIsEditing(false);
  };

  return (
    <>
      <div className='col-md-4'>
        <div className='post-container position-relative mb-4 bg-white dark:bg-gray-800 rounded-3 shadow-lg overflow-hidden'>
          {/* Post Actions - Only show for owner */}
          {isOwner && (
            <div className='position-absolute top-0 end-0 p-2' style={{ zIndex: 10 }}>
              <div className='d-flex gap-1'>
                <button
                  className='btn btn-sm btn-outline-primary rounded-circle d-flex align-items-center justify-content-center'
                  style={{ width: '32px', height: '32px' }}
                  title='Edit Caption'
                  onClick={() => setIsEditing(true)}
                >
                  <HiPencil size={14} />
                </button>
                <button
                  className='btn btn-sm btn-outline-danger rounded-circle d-flex align-items-center justify-content-center'
                  style={{ width: '32px', height: '32px' }}
                  title='Delete Post'
                  onClick={() => setShowDeleteModal(true)}
                >
                  <HiTrash size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Post Image */}
          <div className='post-image-container'>
            <img 
              className='card-img-top' 
              alt='post' 
              src={url}
              style={{ 
                height: '300px', 
                width: '100%', 
                objectFit: 'cover' 
              }}
            />
          </div>

          {/* Post Caption */}
          <div className='p-3'>
            {isEditing ? (
              <div className='edit-caption-container'>
                <textarea
                  value={editedCaption}
                  onChange={(e) => setEditedCaption(e.target.value)}
                  className='form-control mb-2 dark:bg-gray-700 dark:text-white'
                  rows='3'
                  placeholder='Enter caption...'
                />
                <div className='d-flex gap-2 justify-content-end'>
                  <button
                    className='btn btn-sm btn-secondary'
                    onClick={handleCancelEdit}
                    disabled={isUpdating}
                  >
                    <HiX className='me-1' size={14} />
                    Cancel
                  </button>
                  <button
                    className='btn btn-sm btn-primary'
                    onClick={handleUpdateCaption}
                    disabled={isUpdating || !editedCaption.trim()}
                  >
                    {isUpdating ? (
                      <>
                        <div className="spinner-border spinner-border-sm me-1" role="status" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <HiCheck className='me-1' size={14} />
                        Save
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <p className='card-text text-gray-800 mb-0'>
                {body}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999 }}>
          <div className="bg-white dark:bg-gray-800 rounded-3 p-4 mx-3" style={{ maxWidth: '400px', width: '100%' }}>
            <div className="text-center mb-4">
              <div className="mb-3">
                <HiTrash className="text-danger" size={48} />
              </div>
              <h5 className="mb-2 dark:text-white">Delete Post</h5>
              <p className="text-gray-600 dark:text-gray-300">
                Are you sure you want to delete this post? This action cannot be undone.
              </p>
            </div>
            
            <div className="d-flex gap-2 justify-content-end">
              <button 
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                type="button"
                className="btn btn-danger"
                onClick={handleDeletePost}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div className="spinner-border spinner-border-sm me-2" role="status" />
                    Deleting...
                  </>
                ) : (
                  'Delete Post'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Profilecards;