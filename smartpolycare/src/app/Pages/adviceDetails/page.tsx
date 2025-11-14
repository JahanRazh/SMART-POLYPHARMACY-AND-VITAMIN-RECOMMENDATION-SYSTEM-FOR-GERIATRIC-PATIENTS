'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type PatientAdviceData = {
  id?: string;
  career: string;
  sleepTime: string;
  sleepDuration: number;
  activityLevel: string;
  stressLevel: string;
  mealFrequency: number;
  waterIntake: number;
  smokingStatus: string;
  alcoholConsumption: string;
  notes?: string;
};

export default function AdviceDetailsPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<PatientAdviceData>({
    career: '',
    sleepTime: '',
    sleepDuration: 0,
    activityLevel: '',
    stressLevel: '',
    mealFrequency: 0,
    waterIntake: 0,
    smokingStatus: '',
    alcoholConsumption: '',
    notes: '',
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const api = axios.create({ baseURL: 'http://127.0.0.1:5000/api' });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'sleepDuration' || name === 'mealFrequency' || name === 'waterIntake'
        ? Number(value) || 0
        : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/advice-details', formData);
      const patientId = response.data?.id || response.data?.patientId;
      
      // Navigate to patient advice page with patient ID
      if (patientId) {
        router.push(`/Pages/patientAdvice?patientId=${patientId}`);
      } else {
        // If no ID returned, navigate anyway (backend might use session or other method)
        router.push('/Pages/patientAdvice');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit data. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 via-blue-50 to-white text-gray-900">
      <section className="container mx-auto px-6 pt-24 pb-16 lg:pt-28 lg:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-100 px-4 py-2 text-sm font-medium tracking-wide text-teal-700">
            Patient Lifestyle Assessment
          </span>
          <h1 className="mt-6 text-3xl font-bold leading-tight text-gray-900 sm:text-4xl md:text-5xl">
            Collect Patient Data for Personalized Advice
          </h1>
          <p className="mt-4 text-gray-600 md:text-lg leading-relaxed">
            Provide detailed lifestyle information to receive tailored recommendations
            for nutrition, movement, and sleep optimization.
          </p>

          <Link
            href="/Pages/LifestyleAdvice"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-teal-700"
          >
            View Lifestyle Advice
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-10 rounded-2xl bg-white border border-teal-100 shadow-lg p-8"
          >
            {error && (
              <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-800">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Career/Profession */}
              <div>
                <label htmlFor="career" className="block text-sm font-semibold text-gray-700 mb-2">
                  Career/Profession <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="career"
                  name="career"
                  value={formData.career}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Retired Teacher, Office Worker, Healthcare Professional"
                  className="w-full px-4 py-3 border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Sleep Time */}
              <div>
                <label htmlFor="sleepTime" className="block text-sm font-semibold text-gray-700 mb-2">
                  Typical Bedtime <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  id="sleepTime"
                  name="sleepTime"
                  value={formData.sleepTime}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Sleep Duration */}
              <div>
                <label htmlFor="sleepDuration" className="block text-sm font-semibold text-gray-700 mb-2">
                  Average Sleep Duration (hours) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="sleepDuration"
                  name="sleepDuration"
                  value={formData.sleepDuration || ''}
                  onChange={handleChange}
                  required
                  min="0"
                  max="24"
                  step="0.5"
                  placeholder="e.g., 7.5"
                  className="w-full px-4 py-3 border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
                <p className="mt-1 text-xs text-gray-500">Enter average hours of sleep per night</p>
              </div>

              {/* Activity Level */}
              <div>
                <label htmlFor="activityLevel" className="block text-sm font-semibold text-gray-700 mb-2">
                  Physical Activity Level <span className="text-red-500">*</span>
                </label>
                <select
                  id="activityLevel"
                  name="activityLevel"
                  value={formData.activityLevel}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white"
                >
                  <option value="">Select activity level</option>
                  <option value="sedentary">Sedentary (little to no exercise)</option>
                  <option value="light">Light (light exercise 1-3 days/week)</option>
                  <option value="moderate">Moderate (moderate exercise 3-5 days/week)</option>
                  <option value="active">Active (hard exercise 6-7 days/week)</option>
                  <option value="very-active">Very Active (very hard exercise, physical job)</option>
                </select>
              </div>

              {/* Stress Level */}
              <div>
                <label htmlFor="stressLevel" className="block text-sm font-semibold text-gray-700 mb-2">
                  Stress Level <span className="text-red-500">*</span>
                </label>
                <select
                  id="stressLevel"
                  name="stressLevel"
                  value={formData.stressLevel}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white"
                >
                  <option value="">Select stress level</option>
                  <option value="low">Low</option>
                  <option value="moderate">Moderate</option>
                  <option value="high">High</option>
                  <option value="very-high">Very High</option>
                </select>
              </div>

              {/* Meal Frequency */}
              <div>
                <label htmlFor="mealFrequency" className="block text-sm font-semibold text-gray-700 mb-2">
                  Meals per Day <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="mealFrequency"
                  name="mealFrequency"
                  value={formData.mealFrequency || ''}
                  onChange={handleChange}
                  required
                  min="1"
                  max="10"
                  placeholder="e.g., 3"
                  className="w-full px-4 py-3 border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Water Intake */}
              <div>
                <label htmlFor="waterIntake" className="block text-sm font-semibold text-gray-700 mb-2">
                  Daily Water Intake (cups) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="waterIntake"
                  name="waterIntake"
                  value={formData.waterIntake || ''}
                  onChange={handleChange}
                  required
                  min="0"
                  max="20"
                  placeholder="e.g., 8"
                  className="w-full px-4 py-3 border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Smoking Status */}
              <div>
                <label htmlFor="smokingStatus" className="block text-sm font-semibold text-gray-700 mb-2">
                  Smoking Status <span className="text-red-500">*</span>
                </label>
                <select
                  id="smokingStatus"
                  name="smokingStatus"
                  value={formData.smokingStatus}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white"
                >
                  <option value="">Select smoking status</option>
                  <option value="never">Never smoked</option>
                  <option value="former">Former smoker</option>
                  <option value="current">Current smoker</option>
                </select>
              </div>

              {/* Alcohol Consumption */}
              <div>
                <label htmlFor="alcoholConsumption" className="block text-sm font-semibold text-gray-700 mb-2">
                  Alcohol Consumption <span className="text-red-500">*</span>
                </label>
                <select
                  id="alcoholConsumption"
                  name="alcoholConsumption"
                  value={formData.alcoholConsumption}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white"
                >
                  <option value="">Select alcohol consumption</option>
                  <option value="none">None</option>
                  <option value="occasional">Occasional (1-2 drinks/week)</option>
                  <option value="moderate">Moderate (3-7 drinks/week)</option>
                  <option value="heavy">Heavy (8+ drinks/week)</option>
                </select>
              </div>

              {/* Additional Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Any additional information that might help with personalized advice..."
                  className="w-full px-4 py-3 border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-teal-600 px-6 py-4 text-base font-semibold text-white transition-colors duration-200 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : 'Submit Patient Data'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}

