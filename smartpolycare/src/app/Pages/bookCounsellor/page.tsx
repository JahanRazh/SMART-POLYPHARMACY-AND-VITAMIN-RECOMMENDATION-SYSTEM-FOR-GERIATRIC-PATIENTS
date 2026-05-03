'use client';

import React, { useState, useMemo } from 'react';
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

// --- Time Slots ---
const TIME_SLOTS = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM', '05:00 PM',
];

export default function BookCounsellorPage() {
  const { user, userProfile } = useAuth();
  const searchParams = useSearchParams();
  const patientId = searchParams.get('patientId');
  const emailParam = searchParams.get('email');
  const identifier = user?.email || userProfile?.email || emailParam || patientId || "unknown_patient";

  // Steps: 'list' -> 'schedule' -> 'confirmation'
  const [step, setStep] = useState<'list' | 'schedule' | 'confirmation'>('list');
  const [selectedCounsellor, setSelectedCounsellor] = useState<typeof counsellors[0] | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Generate next 14 available dates (skip Sundays)
  const availableDates = useMemo(() => {
    const dates: string[] = [];
    const now = new Date();
    // Start from tomorrow
    const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    while (dates.length < 14) {
      if (cursor.getDay() !== 0) { // Skip Sunday
        dates.push(cursor.toISOString().split('T')[0]);
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    return dates;
  }, []);

  const handleSelectCounsellor = (counsellor: typeof counsellors[0]) => {
    setSelectedCounsellor(counsellor);
    setSelectedDate('');
    setSelectedTime('');
    setSubmitError('');
    setStep('schedule');
  };

  const handleConfirmBooking = async () => {
    if (!selectedCounsellor || !selectedDate || !selectedTime) return;
    setIsSubmitting(true);
    setSubmitError("");

    const payload = {
      patientId: identifier,
      counsellor_id: selectedCounsellor.id,
      counsellor_name: selectedCounsellor.name,
      counsellor_specialization: selectedCounsellor.specialization,
      booking_date: selectedDate,
      booking_time: selectedTime,
      timestamp: new Date().toISOString()
    };

    try {
      const res = await api.post('/book-counsellor', payload);
      if (res.status === 201) {
        setStep('confirmation');
      }
    } catch (err: any) {
      console.error(err);
      setSubmitError("Failed to book counsellor. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date for display
  const formatDisplayDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-teal-50 to-cyan-50 pt-24 pb-12 px-6">
      <AnimatePresence mode="wait">

        {/* ═══════ STEP 1: Counsellor List ═══════ */}
        {step === 'list' && (
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
                  <button
                    onClick={() => handleSelectCounsellor(counsellor)}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 text-white font-bold shadow-md hover:shadow-xl transform transition-all duration-300"
                  >
                    Book Consultation
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ═══════ STEP 2: Date & Time Selection ═══════ */}
        {step === 'schedule' && selectedCounsellor && (
          <motion.div key="schedule" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="max-w-3xl mx-auto">

            {/* Back button */}
            <button onClick={() => setStep('list')} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-teal-700 hover:text-teal-900 transition-colors">
              ← Back to Counsellors
            </button>

            {/* Counsellor Summary Card */}
            <div className="bg-white rounded-3xl p-6 border border-teal-100 shadow-lg mb-8 flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-3xl shadow-md shrink-0">{selectedCounsellor.icon}</div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedCounsellor.name}</h2>
                <p className="text-teal-600 font-medium text-sm">{selectedCounsellor.specialization}</p>
                <p className="text-xs text-gray-500 mt-0.5">{selectedCounsellor.experience} Experience</p>
              </div>
            </div>

            {/* Date Selection */}
            <div className="bg-white rounded-3xl p-8 border border-teal-100 shadow-lg mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                📅 Select Date
              </h3>
              <p className="text-sm text-gray-500 mb-5">Choose a convenient date for your session</p>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {availableDates.map((date) => {
                  const d = new Date(date + 'T00:00:00');
                  const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                  const dayNum = d.getDate();
                  const month = d.toLocaleDateString('en-US', { month: 'short' });
                  const isSelected = selectedDate === date;

                  return (
                    <button
                      key={date}
                      onClick={() => { setSelectedDate(date); setSelectedTime(''); }}
                      className={`flex flex-col items-center p-3 rounded-2xl border-2 transition-all duration-200 ${isSelected
                          ? 'border-teal-500 bg-teal-50 shadow-md scale-105'
                          : 'border-gray-100 bg-white hover:border-teal-200 hover:bg-teal-50/50'
                        }`}
                    >
                      <span className={`text-xs font-bold uppercase tracking-wider ${isSelected ? 'text-teal-600' : 'text-gray-400'}`}>{dayName}</span>
                      <span className={`text-2xl font-extrabold mt-0.5 ${isSelected ? 'text-teal-700' : 'text-gray-800'}`}>{dayNum}</span>
                      <span className={`text-[10px] font-semibold ${isSelected ? 'text-teal-500' : 'text-gray-400'}`}>{month}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Selection — only show after date is selected */}
            <AnimatePresence>
              {selectedDate && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  className="bg-white rounded-3xl p-8 border border-teal-100 shadow-lg mb-6"
                >
                  <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                    🕐 Select Time
                  </h3>
                  <p className="text-sm text-gray-500 mb-5">Available time slots for {formatDisplayDate(selectedDate)}</p>

                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {TIME_SLOTS.map((time) => {
                      const isSelected = selectedTime === time;
                      return (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`py-3 px-2 rounded-xl text-sm font-semibold border-2 transition-all duration-200 ${isSelected
                              ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md scale-105'
                              : 'border-gray-100 bg-white text-gray-700 hover:border-blue-200 hover:bg-blue-50/50'
                            }`}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Confirm Button */}
            <AnimatePresence>
              {selectedDate && selectedTime && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  className="bg-white rounded-3xl p-6 border border-teal-100 shadow-lg"
                >
                  {/* Booking summary */}
                  <div className="rounded-2xl bg-gradient-to-r from-teal-50 to-blue-50 p-5 mb-5 border border-teal-100">
                    <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Booking Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{selectedCounsellor.icon}</span>
                        <span className="font-semibold text-gray-900">{selectedCounsellor.name}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-teal-600">{selectedCounsellor.specialization}</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-700">
                        <span className="text-lg">📅</span>
                        <span className="font-semibold">{formatDisplayDate(selectedDate)}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-lg">🕐</span>
                        <span className="font-semibold">{selectedTime}</span>
                      </div>
                    </div>
                  </div>

                  {submitError && (
                    <p className="text-red-500 text-sm mb-4 text-center bg-red-50 p-3 rounded-xl">{submitError}</p>
                  )}

                  <button
                    onClick={handleConfirmBooking}
                    disabled={isSubmitting}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 text-white font-bold text-lg shadow-lg hover:shadow-xl transform transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {isSubmitting ? (
                      <><span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" /> Confirming…</>
                    ) : (
                      <>✅ Confirm Booking</>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ═══════ STEP 3: Confirmation ═══════ */}
        {step === 'confirmation' && (
          <motion.div key="confirmation" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto text-center mt-20">
            <div className="bg-white rounded-3xl p-10 border border-teal-100 shadow-xl">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-5xl text-green-500">✓</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Booking Confirmed!</h2>
              <p className="text-gray-600 text-lg mb-2">
                You have successfully booked a session with <span className="font-bold text-teal-700">{selectedCounsellor?.name}</span>.
              </p>

              {/* Date & Time display */}
              <div className="inline-flex items-center gap-4 bg-teal-50 border border-teal-200 rounded-2xl px-6 py-4 mt-4 mb-8">
                <div className="text-center">
                  <p className="text-xs text-teal-600 font-semibold uppercase tracking-wider">Date</p>
                  <p className="text-lg font-bold text-teal-800">{selectedDate ? formatDisplayDate(selectedDate) : ''}</p>
                </div>
                <div className="w-px h-10 bg-teal-200"></div>
                <div className="text-center">
                  <p className="text-xs text-teal-600 font-semibold uppercase tracking-wider">Time</p>
                  <p className="text-lg font-bold text-teal-800">{selectedTime}</p>
                </div>
              </div>

              <p className="text-sm text-gray-500 mb-8">A confirmation will be sent to your registered email.</p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/Pages/LifestyleAdvice" className="inline-block px-8 py-4 bg-gradient-to-r from-teal-600 to-blue-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all">
                  Return Home
                </Link>
                <button
                  onClick={() => { setStep('list'); setSelectedCounsellor(null); setSelectedDate(''); setSelectedTime(''); }}
                  className="inline-block px-8 py-4 bg-white border-2 border-teal-200 text-teal-700 font-bold rounded-xl hover:bg-teal-50 transition-all"
                >
                  Book Another
                </button>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
