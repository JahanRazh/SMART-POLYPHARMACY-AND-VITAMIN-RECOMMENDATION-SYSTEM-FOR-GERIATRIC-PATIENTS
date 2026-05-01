'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import axios from 'axios';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/components/Contexts/AuthContext';
const api = axios.create({ baseURL: 'http://127.0.0.1:5000/api' });



// --- Counsellor Data ---
const counsellors = [
  { id: 1, name: 'Dr. Sarah Jenkins', specialization: 'Geriatric Psychology', experience: '15 years', bio: 'Specializes in helping seniors navigate life transitions and manage anxiety related to health changes.', icon: '👩‍⚕️' },
  { id: 2, name: 'Mr. David Chen', specialization: 'Lifestyle & Wellness Coach', experience: '10 years', bio: 'Focuses on holistic approaches to wellness, incorporating mindfulness and healthy daily habits.', icon: '👨‍⚕️' },
  { id: 3, name: 'Dr. Emily Carter', specialization: 'Mental Health Counselor', experience: '12 years', bio: 'Expert in cognitive behavioral therapy tailored for older adults dealing with depression or loneliness.', icon: '👩‍⚕️' },
  { id: 4, name: 'Ms. Rachel Green', specialization: 'Nutrition & Wellness Consultant', experience: '8 years', bio: 'Provides guidance on aligning mental well-being with nutritional habits for optimal aging.', icon: '👩‍⚕️' }
];

export default function BookCounsellorPage() {
  const { user, userProfile } = useAuth();
  const searchParams = useSearchParams();
  const patientId = searchParams.get('patientId');
  const emailParam = searchParams.get('email');
  const identifier = user?.email || userProfile?.email || emailParam || patientId || "unknown_patient";

  const [selectedCounsellor, setSelectedCounsellor] = useState<typeof counsellors[0] | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleBookClick = async (counsellor: typeof counsellors[0]) => {
    setSelectedCounsellor(counsellor);
    setIsSubmitting(true);
    setSubmitError("");

    const payload = {
      patientId: identifier,
      counsellor_id: counsellor.id,
      timestamp: new Date().toISOString()
    };

    try {
      const res = await api.post('/book-counsellor', payload);
      if (res.status === 201) {
        setShowConfirmation(true);
      }
    } catch (err: any) {
      console.error(err);
      setSubmitError("Failed to book counsellor. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-teal-50 to-cyan-50 pt-24 pb-12 px-6">
      <AnimatePresence mode="wait">
        {!showConfirmation ? (
          <motion.div key="list" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-6xl mx-auto">
            <div className="mb-12 text-center">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-teal-700 to-blue-600 bg-clip-text text-transparent mb-4">Book a Wellness Counsellor</h1>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">Connect with our certified professionals to get personalized guidance on your wellness journey.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {counsellors.map((counsellor, index) => (
                <motion.div key={counsellor.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} whileHover={{ y: -8, boxShadow: '0 25px 50px rgba(0,0,0,0.1)' }} className="bg-white rounded-3xl p-8 border border-teal-100 shadow-lg relative overflow-hidden group">
                  <div className="flex items-start gap-6">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-4xl shadow-md">{counsellor.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">{counsellor.name}</h3>
                      <p className="text-teal-600 font-medium mb-2">{counsellor.specialization}</p>
                      <p className="text-sm text-gray-500 mb-4 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-400"></span>{counsellor.experience} Experience</p>
                    </div>
                  </div>
                  <p className="text-gray-600 leading-relaxed mt-4 mb-8 h-20">{counsellor.bio}</p>
                  <button onClick={() => handleBookClick(counsellor)} disabled={isSubmitting} className="w-full py-4 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 text-white font-bold shadow-md hover:shadow-xl transform transition-all duration-300 disabled:opacity-50">
                    {isSubmitting && selectedCounsellor?.id === counsellor.id ? "Booking..." : "Book Consultation"}
                  </button>
                  {submitError && selectedCounsellor?.id === counsellor.id && (
                    <p className="text-red-500 text-sm mt-2 text-center">{submitError}</p>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div key="confirmation" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto text-center mt-20">
            <div className="bg-white rounded-3xl p-10 border border-teal-100 shadow-xl">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-5xl text-green-500">✓</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Booking Confirmed!</h2>
              <p className="text-gray-600 text-lg mb-8">
                You have successfully booked a session with <span className="font-bold text-teal-700">{selectedCounsellor?.name}</span>.
                The counsellor will reach out to you shortly to schedule the exact date and time.
              </p>
              <Link href="/Pages/LifestyleAdvice" className="inline-block px-8 py-4 bg-gradient-to-r from-teal-600 to-blue-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all">
                Return Home
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
