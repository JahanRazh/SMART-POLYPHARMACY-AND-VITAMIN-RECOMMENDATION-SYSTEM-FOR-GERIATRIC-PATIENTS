//pages/patients/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../components/Contexts/AuthContext';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';
import axios from 'axios';

const PatientDataForm = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [existingPatient, setExistingPatient] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    // Basic Information
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    age: '',
    gender: '',
    phoneNumber: '',
    address: '',
    city: '',
    zipCode: '',
    email: '',
    
    // Medical Information
    bloodType: '',
    height: '',
    weight: '',
    bmi: '',
    
    // Medical History
    chronicConditions: [] as string[],
    allergies: [] as string[],
    currentMedications: [] as string[],
    previousSurgeries: [] as string[],
    
    // Lifestyle
    smokingStatus: '',
    alcoholConsumption: '',
    exerciseFrequency: '',
    dietType: '',
    
    // Emergency Contact
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    
    // Additional Notes
    additionalNotes: '',
    
    // Link to user
    userId: user?.uid || ''
  });

  const [newCondition, setNewCondition] = useState('');
  const [newAllergy, setNewAllergy] = useState('');
  const [newMedication, setNewMedication] = useState('');
  const [newSurgery, setNewSurgery] = useState('');

  // Check if patient data already exists for this user
  useEffect(() => {
    if (user?.uid) {
      checkExistingPatient();
    }
  }, [user]);

  const checkExistingPatient = async () => {
    try {
      const q = query(collection(db, 'patients'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const patientData = querySnapshot.docs[0].data();
        const patientId = querySnapshot.docs[0].id;
        setExistingPatient({ id: patientId, ...patientData });
        
        // Convert Firestore timestamps to string values for form
        const formattedData: any = { ...patientData };
        Object.keys(formattedData).forEach(key => {
          if (formattedData[key]?.toDate) {
            formattedData[key] = formattedData[key].toDate().toISOString().split('T')[0];
          }
          if (key === 'age' && typeof formattedData[key] === 'number') {
            formattedData[key] = formattedData[key].toString();
          }
          if (key === 'height' && typeof formattedData[key] === 'number') {
            formattedData[key] = formattedData[key].toString();
          }
          if (key === 'weight' && typeof formattedData[key] === 'number') {
            formattedData[key] = formattedData[key].toString();
          }
        });
        
        setFormData({ 
          ...formData, 
          ...formattedData, 
          userId: user.uid 
        });
        setIsEditing(true);
      }
    } catch (err) {
      console.error('Error checking existing patient:', err);
    }
  };

  const calculateBMI = () => {
    const height = parseFloat(formData.height);
    const weight = parseFloat(formData.weight);
    if (height && weight && height > 0) {
      const heightInMeters = height / 100; // Convert cm to meters
      const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(2);
      setFormData(prev => ({ ...prev, bmi }));
    }
  };

  useEffect(() => {
    if (formData.height && formData.weight) {
      calculateBMI();
    }
  }, [formData.height, formData.weight]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addItem = (field: keyof typeof formData, value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...(prev[field] as string[]), value.trim()]
      }));
      setter('');
    }
  };

  const removeItem = (field: keyof typeof formData, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('Please log in to save patient data');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Prepare data for submission
      const submissionData: any = {
        ...formData,
        userId: user.uid,
        updatedAt: Timestamp.now()
      };

      // Convert string values to appropriate types
      if (submissionData.age) submissionData.age = parseInt(submissionData.age);
      if (submissionData.height) submissionData.height = parseFloat(submissionData.height);
      if (submissionData.weight) submissionData.weight = parseFloat(submissionData.weight);
      if (submissionData.bmi) submissionData.bmi = parseFloat(submissionData.bmi);

      // Remove empty values
      Object.keys(submissionData).forEach(key => {
        if (submissionData[key] === '' || submissionData[key] === null || submissionData[key] === undefined) {
          delete submissionData[key];
        }
        if (Array.isArray(submissionData[key]) && submissionData[key].length === 0) {
          delete submissionData[key];
        }
      });

      // Preserve original createdAt if updating
      if (existingPatient?.createdAt) {
        submissionData.createdAt = existingPatient.createdAt;
      } else {
        submissionData.createdAt = Timestamp.now();
      }

      let savedPatientId = existingPatient?.id;

      // Save to Firestore
      if (existingPatient) {
        // Update existing patient
        const patientRef = doc(db, 'patients', existingPatient.id);
        await updateDoc(patientRef, submissionData);
        setSuccess('Patient data updated successfully!');
        savedPatientId = existingPatient.id;
      } else {
        // Create new patient
        const docRef = await addDoc(collection(db, 'patients'), submissionData);
        setSuccess('Patient data saved successfully!');
        savedPatientId = docRef.id;
        setIsEditing(true);
      }

      // Also save to backend API
      try {
        const api = axios.create({ baseURL: 'http://127.0.0.1:5000' });
        if (existingPatient) {
          await api.put(`/api/patients_details/${existingPatient.id}`, submissionData);
        } else {
          await api.post('/api/patients_details', submissionData);
        }
        console.log('Data synchronized with backend API');
      } catch (apiError) {
        console.warn('Backend API save failed, but Firestore save succeeded:', apiError);
      }

      // Refresh existing patient data
      await checkExistingPatient();
      
    } catch (err: any) {
      console.error('Error saving patient data:', err);
      setError('Failed to save patient data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="patient-form-container">
        <div className="error-message">
          Please log in to access the patient data form.
        </div>
      </div>
    );
  }

  return (
    <div className="patient-form-container">
      <div className="patient-form-header">
        <h2>{isEditing ? 'Update Patient Data' : 'Patient Data Form'}</h2>
        <p className="form-subtitle">
          Please fill in the following information for comprehensive patient care.
        </p>
      </div>

      {error && (
        <div className="error-message" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {success && (
        <div className="success-message" style={{ marginBottom: '1rem' }}>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="patient-form">
        {/* Basic Information Section */}
        <section className="form-section">
          <h3 className="section-title">Basic Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="firstName">First Name *</label>
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
              <label htmlFor="lastName">Last Name *</label>
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
                disabled={loading}
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
              <label htmlFor="age">Age</label>
              <input
                type="number"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleChange}
                min="0"
                max="150"
                disabled={loading}
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
                <option value="prefer-not-to-say">Prefer not to say</option>
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
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="address">Address</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                disabled={loading}
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
              />
            </div>
          </div>
        </section>

        {/* Medical Information Section */}
        <section className="form-section">
          <h3 className="section-title">Medical Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="bloodType">Blood Type</label>
              <select
                id="bloodType"
                name="bloodType"
                value={formData.bloodType}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="">Select Blood Type</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="height">Height (cm)</label>
              <input
                type="number"
                id="height"
                name="height"
                value={formData.height}
                onChange={handleChange}
                min="0"
                step="0.1"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="weight">Weight (kg)</label>
              <input
                type="number"
                id="weight"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                min="0"
                step="0.1"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="bmi">BMI</label>
              <input
                type="text"
                id="bmi"
                name="bmi"
                value={formData.bmi || 'Calculated automatically'}
                disabled
                className="disabled-input"
              />
            </div>
          </div>
        </section>

        {/* Medical History Section */}
        <section className="form-section">
          <h3 className="section-title">Medical History</h3>
          
          <div className="form-group">
            <label>Chronic Conditions</label>
            <div className="array-input-group">
              <input
                type="text"
                placeholder="e.g., Diabetes, Hypertension"
                value={newCondition}
                onChange={(e) => setNewCondition(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addItem('chronicConditions', newCondition, setNewCondition);
                  }
                }}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => addItem('chronicConditions', newCondition, setNewCondition)}
                className="btn-add"
                disabled={loading}
              >
                Add
              </button>
            </div>
            <div className="tag-list">
              {formData.chronicConditions.map((condition, index) => (
                <span key={index} className="tag">
                  {condition}
                  <button
                    type="button"
                    onClick={() => removeItem('chronicConditions', index)}
                    className="tag-remove"
                    disabled={loading}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Allergies</label>
            <div className="array-input-group">
              <input
                type="text"
                placeholder="e.g., Penicillin, Peanuts"
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addItem('allergies', newAllergy, setNewAllergy);
                  }
                }}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => addItem('allergies', newAllergy, setNewAllergy)}
                className="btn-add"
                disabled={loading}
              >
                Add
              </button>
            </div>
            <div className="tag-list">
              {formData.allergies.map((allergy, index) => (
                <span key={index} className="tag">
                  {allergy}
                  <button
                    type="button"
                    onClick={() => removeItem('allergies', index)}
                    className="tag-remove"
                    disabled={loading}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Current Medications</label>
            <div className="array-input-group">
              <input
                type="text"
                placeholder="e.g., Metformin 500mg, Aspirin 81mg"
                value={newMedication}
                onChange={(e) => setNewMedication(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addItem('currentMedications', newMedication, setNewMedication);
                  }
                }}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => addItem('currentMedications', newMedication, setNewMedication)}
                className="btn-add"
                disabled={loading}
              >
                Add
              </button>
            </div>
            <div className="tag-list">
              {formData.currentMedications.map((medication, index) => (
                <span key={index} className="tag">
                  {medication}
                  <button
                    type="button"
                    onClick={() => removeItem('currentMedications', index)}
                    className="tag-remove"
                    disabled={loading}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Previous Surgeries</label>
            <div className="array-input-group">
              <input
                type="text"
                placeholder="e.g., Hip Replacement (2020)"
                value={newSurgery}
                onChange={(e) => setNewSurgery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addItem('previousSurgeries', newSurgery, setNewSurgery);
                  }
                }}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => addItem('previousSurgeries', newSurgery, setNewSurgery)}
                className="btn-add"
                disabled={loading}
              >
                Add
              </button>
            </div>
            <div className="tag-list">
              {formData.previousSurgeries.map((surgery, index) => (
                <span key={index} className="tag">
                  {surgery}
                  <button
                    type="button"
                    onClick={() => removeItem('previousSurgeries', index)}
                    className="tag-remove"
                    disabled={loading}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Lifestyle Section */}
        <section className="form-section">
          <h3 className="section-title">Lifestyle Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="smokingStatus">Smoking Status</label>
              <select
                id="smokingStatus"
                name="smokingStatus"
                value={formData.smokingStatus}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="">Select Status</option>
                <option value="never">Never</option>
                <option value="former">Former Smoker</option>
                <option value="current">Current Smoker</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="alcoholConsumption">Alcohol Consumption</label>
              <select
                id="alcoholConsumption"
                name="alcoholConsumption"
                value={formData.alcoholConsumption}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="">Select Frequency</option>
                <option value="never">Never</option>
                <option value="occasional">Occasional</option>
                <option value="moderate">Moderate</option>
                <option value="heavy">Heavy</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="exerciseFrequency">Exercise Frequency</label>
              <select
                id="exerciseFrequency"
                name="exerciseFrequency"
                value={formData.exerciseFrequency}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="">Select Frequency</option>
                <option value="none">None</option>
                <option value="light">Light (1-2 times/week)</option>
                <option value="moderate">Moderate (3-4 times/week)</option>
                <option value="active">Active (5+ times/week)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="dietType">Diet Type</label>
              <select
                id="dietType"
                name="dietType"
                value={formData.dietType}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="">Select Diet</option>
                <option value="omnivore">Omnivore</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="keto">Keto</option>
                <option value="mediterranean">Mediterranean</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </section>

        {/* Emergency Contact Section */}
        <section className="form-section">
          <h3 className="section-title">Emergency Contact</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="emergencyContactName">Contact Name</label>
              <input
                type="text"
                id="emergencyContactName"
                name="emergencyContactName"
                value={formData.emergencyContactName}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="emergencyContactPhone">Contact Phone</label>
              <input
                type="tel"
                id="emergencyContactPhone"
                name="emergencyContactPhone"
                value={formData.emergencyContactPhone}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="emergencyContactRelationship">Relationship</label>
              <input
                type="text"
                id="emergencyContactRelationship"
                name="emergencyContactRelationship"
                value={formData.emergencyContactRelationship}
                onChange={handleChange}
                placeholder="e.g., Spouse, Child, Friend"
                disabled={loading}
              />
            </div>
          </div>
        </section>

        {/* Additional Notes Section */}
        <section className="form-section">
          <h3 className="section-title">Additional Notes</h3>
          <div className="form-group full-width">
            <label htmlFor="additionalNotes">Notes</label>
            <textarea
              id="additionalNotes"
              name="additionalNotes"
              value={formData.additionalNotes}
              onChange={handleChange}
              rows={4}
              placeholder="Any additional information that might be relevant..."
              disabled={loading}
            />
          </div>
        </section>

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? 'Saving...' : (isEditing ? 'Update Patient Data' : 'Save Patient Data')}
          </button>
        </div>
      </form>

      <style jsx>{`
        .patient-form-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .patient-form-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .patient-form-header h2 {
          color: #2d3748;
          margin-bottom: 0.5rem;
        }

        .form-subtitle {
          color: #718096;
        }

        .patient-form {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .form-section {
          margin-bottom: 2rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .section-title {
          color: #2d3748;
          margin-bottom: 1rem;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-group label {
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #4a5568;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 0.75rem;
          border: 1px solid #cbd5e0;
          border-radius: 4px;
          font-size: 1rem;
        }

        .form-group input:disabled,
        .form-group select:disabled,
        .form-group textarea:disabled {
          background-color: #f7fafc;
          cursor: not-allowed;
        }

        .disabled-input {
          background-color: #f7fafc !important;
          color: #a0aec0 !important;
        }

        .array-input-group {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .array-input-group input {
          flex: 1;
        }

        .btn-add {
          padding: 0.5rem 1rem;
          background-color: #48bb78;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .btn-add:disabled {
          background-color: #a0aec0;
          cursor: not-allowed;
        }

        .btn-add:hover:not(:disabled) {
          background-color: #38a169;
        }

        .tag-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .tag {
          display: inline-flex;
          align-items: center;
          background-color: #edf2f7;
          padding: 0.25rem 0.5rem;
          border-radius: 9999px;
          font-size: 0.875rem;
        }

        .tag-remove {
          margin-left: 0.25rem;
          background: none;
          border: none;
          cursor: pointer;
          color: #718096;
        }

        .tag-remove:hover {
          color: #e53e3e;
        }

        .tag-remove:disabled {
          cursor: not-allowed;
          color: #a0aec0;
        }

        .form-actions {
          margin-top: 2rem;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .btn-primary {
          background-color: #4299e1;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #3182ce;
        }

        .btn-primary:disabled {
          background-color: #a0aec0;
          cursor: not-allowed;
        }

        .btn-full {
          width: 100%;
        }

        .error-message {
          background-color: #fed7d7;
          color: #c53030;
          padding: 1rem;
          border-radius: 4px;
          border: 1px solid #feb2b2;
        }

        .success-message {
          background-color: #c6f6d5;
          color: #276749;
          padding: 1rem;
          border-radius: 4px;
          border: 1px solid #9ae6b4;
        }
      `}</style>
    </div>
  );
};

export default PatientDataForm;