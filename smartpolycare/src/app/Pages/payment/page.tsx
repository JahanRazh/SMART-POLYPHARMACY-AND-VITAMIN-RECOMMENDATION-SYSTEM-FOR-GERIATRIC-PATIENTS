'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Helper component for large, accessible buttons
const LargeButton = ({ 
  children, 
  onClick, 
  variant = 'primary',
  disabled = false,
  fullWidth = false 
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  fullWidth?: boolean;
}) => {
  const baseClasses = "min-h-[60px] px-8 py-4 text-xl font-bold rounded-xl transition-all duration-200 shadow-lg";
  const variantClasses = {
    primary: "bg-teal-600 text-white hover:bg-teal-700 active:bg-teal-800",
    secondary: "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800",
    outline: "bg-white text-teal-700 border-4 border-teal-600 hover:bg-teal-50"
  };
  const disabledClasses = "opacity-50 cursor-not-allowed";
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${disabled ? disabledClasses : ''} ${fullWidth ? 'w-full' : ''}`}
    >
      {children}
    </button>
  );
};

type PaymentMethod = 'card' | 'paypal';

type CardData = {
  cardNumber: string;
  cardName: string;
  expiryDate: string;
  cvv: string;
  billingAddress: string;
  city: string;
  zipCode: string;
  country: string;
};

export default function PaymentPage() {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [cardData, setCardData] = useState<CardData>({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    billingAddress: '',
    city: '',
    zipCode: '',
    country: 'United States',
  });

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'cardNumber') {
      setCardData((prev) => ({ ...prev, [name]: formatCardNumber(value) }));
    } else if (name === 'expiryDate') {
      setCardData((prev) => ({ ...prev, [name]: formatExpiryDate(value) }));
    } else if (name === 'cvv') {
      const cvv = value.replace(/\D/g, '').substring(0, 4);
      setCardData((prev) => ({ ...prev, [name]: cvv }));
    } else {
      setCardData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validateCardForm = (): boolean => {
    if (!cardData.cardNumber || cardData.cardNumber.replace(/\s/g, '').length < 13) {
      setError('Please enter a valid card number');
      return false;
    }
    if (!cardData.cardName.trim()) {
      setError('Please enter the cardholder name');
      return false;
    }
    if (!cardData.expiryDate || cardData.expiryDate.length !== 5) {
      setError('Please enter a valid expiry date (MM/YY)');
      return false;
    }
    if (!cardData.cvv || cardData.cvv.length < 3) {
      setError('Please enter a valid CVV');
      return false;
    }
    if (!cardData.billingAddress.trim()) {
      setError('Please enter your billing address');
      return false;
    }
    if (!cardData.city.trim()) {
      setError('Please enter your city');
      return false;
    }
    if (!cardData.zipCode.trim()) {
      setError('Please enter your ZIP code');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (paymentMethod === 'card') {
        if (!validateCardForm()) {
          setLoading(false);
          return;
        }
        // Simulate payment processing
        await new Promise((resolve) => setTimeout(resolve, 2000));
        // In a real app, you would call your payment API here
        alert('Payment successful! Redirecting to Pro mode...');
        router.push('/Pages/adviceDetails?mode=pro');
      } else {
        // PayPal payment
        // In a real app, you would integrate PayPal SDK here
        alert('Redirecting to PayPal...');
        // For demo purposes, simulate PayPal redirect
        await new Promise((resolve) => setTimeout(resolve, 1500));
        router.push('/Pages/adviceDetails?mode=pro');
      }
    } catch (err: any) {
      setError(err.message || 'Payment processing failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 via-blue-50 to-white text-gray-900">
      <section className="container mx-auto px-4 sm:px-6 pt-20 pb-12 lg:pt-24 lg:pb-16">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          {/* Header - Large and Clear */}
          <div className="mb-10 text-center">
            <div className="inline-flex items-center gap-3 rounded-full border-2 border-teal-300 bg-teal-100 px-6 py-3 mb-6">
              <svg className="w-8 h-8 text-teal-700" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-xl font-bold text-teal-800">Secure Payment</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight text-gray-900 mb-4">
              Complete Your Payment
            </h1>
            <p className="text-xl sm:text-2xl text-gray-700 leading-relaxed max-w-2xl mx-auto">
              Unlock advanced lifestyle recommendations and personalized health protocols
            </p>
          </div>

          {/* Payment Summary - Large and Clear */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-10 rounded-3xl bg-white border-4 border-teal-200 shadow-xl p-8 sm:p-10"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-gray-200">
              Order Summary
            </h2>
            <div className="space-y-5">
              <div className="flex justify-between items-center py-3">
                <span className="text-2xl text-gray-700">Pro Mode Subscription</span>
                <span className="text-2xl font-bold text-gray-900">$29.99</span>
              </div>
              <div className="flex justify-between items-center pt-5 border-t-4 border-teal-300">
                <span className="text-3xl font-bold text-gray-900">Total Amount</span>
                <span className="text-4xl font-bold text-teal-600">$29.99</span>
              </div>
            </div>
            <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
              <p className="text-lg text-blue-800">
                <strong>✓ Secure Payment:</strong> Your information is encrypted and protected
              </p>
            </div>
          </motion.div>

          {/* Payment Method Selection - Large Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-10"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
              Choose Your Payment Method
            </h2>
            <div className="grid grid-cols-1 gap-6">
              <button
                onClick={() => setPaymentMethod('card')}
                className={`rounded-2xl border-4 p-8 text-left transition-all duration-200 min-h-[120px] ${
                  paymentMethod === 'card'
                    ? 'border-teal-600 bg-teal-50 shadow-xl scale-105'
                    : 'border-gray-300 bg-white hover:border-teal-400 hover:shadow-lg'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-teal-100 flex items-center justify-center">
                      <svg className="w-10 h-10 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <span className="text-2xl font-bold text-gray-900">Credit or Debit Card</span>
                  </div>
                  {paymentMethod === 'card' && (
                    <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex gap-3 mt-4">
                  <span className="text-lg text-gray-600 font-medium">Visa</span>
                  <span className="text-lg text-gray-400">•</span>
                  <span className="text-lg text-gray-600 font-medium">Mastercard</span>
                  <span className="text-lg text-gray-400">•</span>
                  <span className="text-lg text-gray-600 font-medium">American Express</span>
                </div>
              </button>

              <button
                onClick={() => setPaymentMethod('paypal')}
                className={`rounded-2xl border-4 p-8 text-left transition-all duration-200 min-h-[120px] ${
                  paymentMethod === 'paypal'
                    ? 'border-teal-600 bg-teal-50 shadow-xl scale-105'
                    : 'border-gray-300 bg-white hover:border-teal-400 hover:shadow-lg'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-blue-100 flex items-center justify-center">
                      <svg className="w-10 h-10 text-blue-700" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46a2.276 2.276 0 0 1 1.679.705 2.19 2.19 0 0 1 .5 1.752l-1.384 9.343a1.08 1.08 0 0 1-.17.51 1.098 1.098 0 0 1-.468.377l-6.96 2.844a11.25 11.25 0 0 1 .636 1.756 11.313 11.313 0 0 1 .385 1.84l.01.063h4.82a.75.75 0 0 1 .743.648l.007.112a.75.75 0 0 1-.648.743H7.077z" />
                      </svg>
                    </div>
                    <span className="text-2xl font-bold text-gray-900">PayPal</span>
                  </div>
                  {paymentMethod === 'paypal' && (
                    <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                <p className="text-xl text-gray-600 mt-2">Pay securely with your PayPal account</p>
              </button>
            </div>
          </motion.div>

          {/* Payment Form - Large Inputs */}
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onSubmit={handleSubmit}
            className="rounded-3xl bg-white border-4 border-teal-200 shadow-xl p-8 sm:p-10"
          >
            {paymentMethod === 'card' ? (
              <div className="space-y-8">
                <div className="mb-6 pb-4 border-b-2 border-gray-200">
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">Card Information</h3>
                  <p className="text-xl text-gray-600">Enter your card details below</p>
                </div>

                <div>
                  <label htmlFor="cardNumber" className="block text-2xl font-bold text-gray-900 mb-3">
                    Card Number <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    id="cardNumber"
                    name="cardNumber"
                    value={cardData.cardNumber}
                    onChange={handleCardChange}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    className="w-full px-6 py-5 text-2xl border-4 border-gray-400 rounded-xl focus:ring-4 focus:ring-teal-500 focus:border-teal-600 transition-all"
                    required
                    aria-label="Card number"
                  />
                  <p className="mt-2 text-lg text-gray-600">Enter the 16-digit number on your card</p>
                </div>

                <div>
                  <label htmlFor="cardName" className="block text-2xl font-bold text-gray-900 mb-3">
                    Name on Card <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    id="cardName"
                    name="cardName"
                    value={cardData.cardName}
                    onChange={handleCardChange}
                    placeholder="Enter name exactly as shown on card"
                    className="w-full px-6 py-5 text-2xl border-4 border-gray-400 rounded-xl focus:ring-4 focus:ring-teal-500 focus:border-teal-600 transition-all"
                    required
                    aria-label="Cardholder name"
                  />
                  <p className="mt-2 text-lg text-gray-600">Enter the name exactly as it appears on your card</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="expiryDate" className="block text-2xl font-bold text-gray-900 mb-3">
                      Expiry Date <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      id="expiryDate"
                      name="expiryDate"
                      value={cardData.expiryDate}
                      onChange={handleCardChange}
                      placeholder="MM/YY"
                      maxLength={5}
                      className="w-full px-6 py-5 text-2xl border-4 border-gray-400 rounded-xl focus:ring-4 focus:ring-teal-500 focus:border-teal-600 transition-all"
                      required
                      aria-label="Expiry date"
                    />
                    <p className="mt-2 text-lg text-gray-600">Format: Month/Year (e.g., 12/25)</p>
                  </div>

                  <div>
                    <label htmlFor="cvv" className="block text-2xl font-bold text-gray-900 mb-3">
                      CVV Security Code <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      id="cvv"
                      name="cvv"
                      value={cardData.cvv}
                      onChange={handleCardChange}
                      placeholder="123"
                      maxLength={4}
                      className="w-full px-6 py-5 text-2xl border-4 border-gray-400 rounded-xl focus:ring-4 focus:ring-teal-500 focus:border-teal-600 transition-all"
                      required
                      aria-label="CVV security code"
                    />
                    <p className="mt-2 text-lg text-gray-600">3-4 digits on the back of your card</p>
                  </div>
                </div>

                <div className="pt-8 border-t-3 border-gray-300">
                  <div className="mb-6 pb-4">
                    <h3 className="text-3xl font-bold text-gray-900 mb-2">Billing Address</h3>
                    <p className="text-xl text-gray-600">Enter your billing address</p>
                  </div>
                  
                  <div className="mb-6">
                    <label htmlFor="billingAddress" className="block text-2xl font-bold text-gray-900 mb-3">
                      Street Address <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      id="billingAddress"
                      name="billingAddress"
                      value={cardData.billingAddress}
                      onChange={handleCardChange}
                      placeholder="123 Main Street"
                      className="w-full px-6 py-5 text-2xl border-4 border-gray-400 rounded-xl focus:ring-4 focus:ring-teal-500 focus:border-teal-600 transition-all"
                      required
                      aria-label="Billing address"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label htmlFor="city" className="block text-2xl font-bold text-gray-900 mb-3">
                        City <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={cardData.city}
                        onChange={handleCardChange}
                        placeholder="New York"
                        className="w-full px-6 py-5 text-2xl border-4 border-gray-400 rounded-xl focus:ring-4 focus:ring-teal-500 focus:border-teal-600 transition-all"
                        required
                        aria-label="City"
                      />
                    </div>

                    <div>
                      <label htmlFor="zipCode" className="block text-2xl font-bold text-gray-900 mb-3">
                        ZIP Code <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        id="zipCode"
                        name="zipCode"
                        value={cardData.zipCode}
                        onChange={handleCardChange}
                        placeholder="10001"
                        className="w-full px-6 py-5 text-2xl border-4 border-gray-400 rounded-xl focus:ring-4 focus:ring-teal-500 focus:border-teal-600 transition-all"
                        required
                        aria-label="ZIP code"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="country" className="block text-2xl font-bold text-gray-900 mb-3">
                      Country <span className="text-red-600">*</span>
                    </label>
                    <select
                      id="country"
                      name="country"
                      value={cardData.country}
                      onChange={handleCardChange}
                      className="w-full px-6 py-5 text-2xl border-4 border-gray-400 rounded-xl focus:ring-4 focus:ring-teal-500 focus:border-teal-600 transition-all bg-white"
                      required
                      aria-label="Country"
                    >
                      <option value="United States">United States</option>
                      <option value="Canada">Canada</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Australia">Australia</option>
                      <option value="Germany">Germany</option>
                      <option value="France">France</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="mb-8">
                  <div className="w-32 h-32 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-20 h-20 text-blue-700"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46a2.276 2.276 0 0 1 1.679.705 2.19 2.19 0 0 1 .5 1.752l-1.384 9.343a1.08 1.08 0 0 1-.17.51 1.098 1.098 0 0 1-.468.377l-6.96 2.844a11.25 11.25 0 0 1 .636 1.756 11.313 11.313 0 0 1 .385 1.84l.01.063h4.82a.75.75 0 0 1 .743.648l.007.112a.75.75 0 0 1-.648.743H7.077z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-4xl font-bold text-gray-900 mb-4">Pay with PayPal</h3>
                <p className="text-2xl text-gray-700 mb-8 leading-relaxed">
                  You will be redirected to PayPal to complete your payment securely
                </p>
                <div className="bg-blue-50 border-4 border-blue-300 rounded-2xl p-6 max-w-2xl mx-auto">
                  <p className="text-2xl text-blue-900 font-semibold">
                    Click the "Pay with PayPal" button below to proceed
                  </p>
                </div>
              </div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 rounded-2xl bg-red-50 border-4 border-red-400 px-8 py-6"
              >
                <div className="flex items-start gap-4">
                  <svg className="w-10 h-10 text-red-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-2xl font-bold text-red-900 mb-2">Error</p>
                    <p className="text-xl text-red-800">{error}</p>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="mt-10 flex flex-col gap-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[70px] px-8 py-5 text-2xl font-bold rounded-2xl bg-teal-600 text-white hover:bg-teal-700 active:bg-teal-800 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-4">
                    <svg className="animate-spin h-8 w-8" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Processing Payment...</span>
                  </span>
                ) : (
                  paymentMethod === 'card' ? 'Pay $29.99 Now' : 'Pay with PayPal'
                )}
              </button>
              
              <Link
                href="/Pages/LifestyleAdvice"
                className="w-full min-h-[70px] px-8 py-5 text-2xl font-bold rounded-2xl border-4 border-gray-400 text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-all text-center"
              >
                Cancel and Go Back
              </Link>
            </div>

            {/* Security Notice - Large and Clear */}
            <div className="mt-10 flex items-start gap-4 p-6 bg-green-50 border-4 border-green-300 rounded-2xl">
              <svg className="w-12 h-12 text-green-700 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-2xl font-bold text-green-900 mb-2">Secure Payment</p>
                <p className="text-xl text-green-800 leading-relaxed">
                  Your payment information is encrypted and secure. We never store your full card details on our servers.
                </p>
              </div>
            </div>
          </motion.form>
        </motion.div>
      </section>
    </div>
  );
}

