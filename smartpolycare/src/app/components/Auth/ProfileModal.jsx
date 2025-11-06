// components/Auth/ProfileModal.jsx
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../Contexts/AuthContext';

const ProfileModal = ({ isOpen, onClose }) => {
  const { user, userProfile, updateProfileData } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (userProfile) {
      setFormData({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        email: user?.email || ''
      });
    }
  }, [userProfile, user]);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await updateProfileData({
        firstName: formData.firstName,
        lastName: formData.lastName,
        displayName: `${formData.firstName} ${formData.lastName}`,
        email: formData.email
      });
      
      setMessage('Profile updated successfully!');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      setMessage('Error updating profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content auth-modal">
        <div className="modal-header">
          <h2>Edit Profile</h2>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>

        <div className="modal-body">
          {message && (
            <div className={`message ${message.includes('Error') ? 'error-message' : 'success-message'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading || userProfile?.provider === 'google'}
              />
              {userProfile?.provider === 'google' && (
                <small className="text-gray-500">Email cannot be changed for Google accounts</small>
              )}
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </form>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Account Information</h3>
            <p className="text-sm text-gray-600">
              <strong>Login Method:</strong> {userProfile?.provider === 'google' ? 'Google' : 'Email/Password'}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Account Created:</strong> {user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'Unknown'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;