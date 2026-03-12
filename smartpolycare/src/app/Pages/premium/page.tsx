'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function PremiumPage() {
  const searchParams = useSearchParams();
  const patientId = searchParams.get('patientId');
  const emailParam = searchParams.get('email');
  const identifier = emailParam || patientId;

  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly' | null>(null);

  const features = [
    { icon: '📅', title: '1-Month Advice', description: 'Detailed 30-day personalized health plan' },
    { icon: '📊', title: 'Advanced Analytics', description: 'Track your health metrics and progress' },
    { icon: '💬', title: 'Priority Support', description: '24/7 customer support for your queries' },
    { icon: '🎯', title: 'Custom Recommendations', description: 'AI-powered personalization for your lifestyle' },
    { icon: '📈', title: 'Health Insights', description: 'Weekly reports on your wellness journey' },
    { icon: '🔒', title: 'Secure Data', description: 'Your health information is fully encrypted' },
  ];

  const plans = [
    {
      name: 'Monthly Plan',
      duration: '1 Month',
      price: '$9.99',
      period: '/month',
      description: 'Perfect for trying out our premium features',
      features: [
        '✓ 1-Month Health Plan (30 days)',
        '✓ Daily Personalized Recommendations',
        '✓ Health Progress Tracking',
        '✓ Email Support',
        '✓ Access to Basic Analytics',
      ],
      cta: 'Subscribe Monthly',
      id: 'monthly',
    },
    {
      name: 'Yearly Plan',
      duration: '1 Year',
      price: '$89.99',
      period: '/year',
      description: 'Best value - Save 25% compared to monthly',
      features: [
        '✓ 12-Month Health Plan (365 days)',
        '✓ Daily Personalized Recommendations',
        '✓ Health Progress Tracking',
        '✓ Priority Email & Chat Support',
        '✓ Advanced Analytics & Reports',
        '✓ Quarterly Health Reviews',
        '✓ Free Plan Updates',
      ],
      cta: 'Subscribe Yearly',
      id: 'yearly',
      badge: 'SAVE 25%',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-white">
      {/* Header */}
      <section className="relative overflow-hidden pt-20 pb-12">
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ float: [0, 20, 0] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-10 left-10 w-72 h-72 bg-amber-200/30 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ float: [0, -20, 0] }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute bottom-10 right-10 w-72 h-72 bg-orange-200/30 rounded-full blur-3xl"
          />
        </div>

        <div className="relative container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-4"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-100 px-4 py-2 text-sm font-semibold tracking-wide text-amber-700">
              <span>👑</span>
              Premium Membership
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-4xl lg:text-5xl font-bold text-center text-gray-900 mb-6"
          >
            Unlock Your Full Health Potential
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-lg text-gray-600 text-center max-w-2xl mx-auto mb-8"
          >
            Get extended personalized health plans and advanced features to optimize your wellness journey
          </motion.p>

          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex justify-center mb-8"
          >
            <Link
              href={`/Pages/patientAdvice?${emailParam ? 'email' : 'patientId'}=${encodeURIComponent(identifier)}`}
              className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 font-semibold transition-colors"
            >
              ← Back to Free Plan
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-6 py-16">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-3xl font-bold text-center text-gray-900 mb-12"
        >
          Premium Features Included
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="rounded-2xl bg-white border border-amber-200 p-6 shadow-md hover:shadow-xl hover:border-amber-400 transition-all"
            >
              <div className="text-4xl mb-3">{feature.icon}</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="container mx-auto px-6 py-16">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-3xl font-bold text-center text-gray-900 mb-12"
        >
          Choose Your Plan
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.2 }}
              className={`relative rounded-3xl border-2 p-8 transition-all ${
                plan.id === 'yearly'
                  ? 'border-amber-500 bg-gradient-to-br from-amber-50 to-orange-50 shadow-xl'
                  : 'border-gray-200 bg-white hover:border-amber-300'
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-4 right-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                  {plan.badge}
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 text-sm">{plan.description}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600">{plan.period}</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">Valid for: {plan.duration}</p>
              </div>

              <div className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center gap-3 text-gray-700"
                  >
                    <span className="text-xl">✓</span>
                    <span className="text-sm">{feature}</span>
                  </motion.div>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedPlan(plan.id as 'monthly' | 'yearly')}
                className={`w-full rounded-xl py-3 font-bold transition-all text-center ${
                  plan.id === 'yearly'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg hover:shadow-amber-300'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {plan.cta}
              </motion.button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Success Modal */}
      {selectedPlan && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="bg-white rounded-3xl p-8 max-w-md text-center shadow-2xl"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="text-6xl mb-4 inline-block"
            >
              👑
            </motion.div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {selectedPlan === 'monthly' ? 'Monthly Plan' : 'Yearly Plan'} Selected!
            </h2>

            <p className="text-gray-600 mb-6">
              {selectedPlan === 'monthly'
                ? 'Your 1-month premium plan will be activated. Proceed to payment to complete your subscription.'
                : 'Your 1-year premium plan will be activated. Proceed to payment to complete your subscription.'}
            </p>

            <div className="space-y-3">
              <button
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 rounded-xl hover:shadow-lg transition-all"
              >
                Proceed to Payment
              </button>

              <button
                onClick={() => setSelectedPlan(null)}
                className="w-full border-2 border-gray-300 text-gray-700 font-semibold py-3 rounded-xl hover:border-gray-400 transition-all"
              >
                Continue Shopping
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-6">
              💳 Secure payment processing | 🔒 Your data is encrypted | ✓ Cancel anytime
            </p>
          </motion.div>
        </motion.div>
      )}

      {/* FAQ Section */}
      <section className="container mx-auto px-6 py-16 bg-white rounded-3xl mb-16">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-3xl font-bold text-center text-gray-900 mb-12"
        >
          Frequently Asked Questions
        </motion.h2>

        <div className="max-w-2xl mx-auto space-y-4">
          {[
            {
              question: 'Can I cancel my subscription anytime?',
              answer: 'Yes, you can cancel your subscription at any time from your account settings. No hidden fees or long-term commitments.',
            },
            {
              question: 'What payment methods do you accept?',
              answer: 'We accept all major credit cards, debit cards, and digital payment methods for your convenience.',
            },
            {
              question: 'What happens after my subscription ends?',
              answer: 'After your subscription ends, you can continue using the free plan with 2-week advice. Your data is always saved.',
            },
            {
              question: 'Is my health data secure?',
              answer: 'Absolutely! Your health information is encrypted with bank-level security and never shared with third parties.',
            },
          ].map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="rounded-xl border border-gray-200 p-6 hover:border-amber-300 transition-colors"
            >
              <h3 className="font-bold text-gray-900 mb-2">{faq.question}</h3>
              <p className="text-gray-600 text-sm">{faq.answer}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="container mx-auto px-6 pb-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl p-12 text-white"
        >
          <h2 className="text-3xl font-bold mb-4">Ready to Level Up?</h2>
          <p className="text-lg mb-6 opacity-90">
            Join thousands of users enjoying premium personalized health plans
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button className="bg-white text-amber-600 font-bold px-8 py-3 rounded-xl hover:shadow-lg transition-all">
              Get Started Today
            </button>
            <Link
              href={`/Pages/patientAdvice?${emailParam ? 'email' : 'patientId'}=${encodeURIComponent(identifier)}`}
              className="border-2 border-white text-white font-bold px-8 py-3 rounded-xl hover:bg-white/10 transition-all"
            >
              Back to Free Plan
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
