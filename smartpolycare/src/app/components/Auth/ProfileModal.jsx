// components/Auth/ProfileModal.jsx
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../Contexts/AuthContext';

const ProfileModal = ({ isOpen, onClose }) => {
  const { user, userProfile, updateProfileData } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    age: '',
    gender: '',
    phoneNumber: '',
    address: '',
    city: '',
    zipCode: '',
    dateOfBirth: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (userProfile) {
      setFormData({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        email: user?.email || userProfile.email || '',
        age: userProfile.age || '',
        gender: userProfile.gender || '',
        phoneNumber: userProfile.phoneNumber || '',
        address: userProfile.address || '',
        city: userProfile.city || '',
        zipCode: userProfile.zipCode || '',
        dateOfBirth: userProfile.dateOfBirth || ''
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
      // Validate age if provided
      if (formData.age && (formData.age < 1 || formData.age > 150)) {
        setMessage('Please enter a valid age (1-150)');
        return;
      }

      const profileUpdate = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        displayName: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        age: formData.age ? parseInt(formData.age) : null,
        gender: formData.gender || null,
        phoneNumber: formData.phoneNumber || null,
        address: formData.address || null,
        city: formData.city || null,
        zipCode: formData.zipCode || null,
        dateOfBirth: formData.dateOfBirth || null
      };

      await updateProfileData(profileUpdate);
      
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
      <div className="modal-content auth-modal" style={{ maxWidth: '600px' }}>
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

            <div className="form-group">
              <label htmlFor="age">Age</label>
              <input
                type="number"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleChange}
                min="1"
                max="150"
                disabled={loading}
                placeholder="Enter your age"
              />
            </div>

            <div className="form-group">
              <label htmlFor="gender">Gender</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="phoneNumber">Phone Number</label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                disabled={loading}
                placeholder="Enter your phone number"
              />
            </div>

            <div className="form-group">
              <label htmlFor="dateOfBirth">Date of Birth</label>
              <input
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="address">Address</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                disabled={loading}
                placeholder="Enter your address"
              />
            </div>

            <div className="form-group">
              <label htmlFor="city">City</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                disabled={loading}
                placeholder="Enter your city"
              />
            </div>

            <div className="form-group">
              <label htmlFor="zipCode">Zip Code</label>
              <input
                type="text"
                id="zipCode"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
                disabled={loading}
                placeholder="Enter your zip code"
              />
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