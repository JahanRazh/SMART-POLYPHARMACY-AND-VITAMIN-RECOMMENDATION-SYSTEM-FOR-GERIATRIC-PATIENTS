// components/Auth/AgeGenderModal.jsx
"use client";

import { useState } from 'react';
import { useAuth } from '../Contexts/AuthContext';

const AgeGenderModal = ({ isOpen, onClose, onComplete }) => {
  const { updateProfileData } = useAuth();
  const [formData, setFormData] = useState({
    age: '',
    gender: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.age || formData.age < 1 || formData.age > 150) {
      setError('Please enter a valid age (1-150)');
      return;
    }

    if (!formData.gender) {
      setError('Please select your gender');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await updateProfileData({
        age: parseInt(formData.age),
        gender: formData.gender
      });
      
      if (onComplete) {
        onComplete();
      }
      onClose();
    } catch (error) {
      setError('Error saving information: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content auth-modal">
        <div className="modal-header">
          <h2>Complete Your Profile</h2>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>

        <div className="modal-body">
          <p className="text-gray-600 mb-4">
            Please provide your age and gender to complete your profile.
          </p>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="age">Age</label>
              <input
                type="number"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleChange}
                required
                min="1"
                max="150"
                disabled={loading}
                placeholder="Enter your age"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="gender">Gender</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
                disabled={loading}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AgeGenderModal;

