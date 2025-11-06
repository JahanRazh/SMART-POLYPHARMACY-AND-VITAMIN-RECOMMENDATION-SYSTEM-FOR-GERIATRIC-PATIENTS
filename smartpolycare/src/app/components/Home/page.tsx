// app/components/Home/page.tsx
'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from '../images/polycare.jpg';

const Home = () => {
  const [activeFeature, setActiveFeature] = useState(0);

  const clinicalFeatures = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: "Polypharmacy Risk Scoring",
      description: "AI-powered assessment of drug-drug interactions and patient-specific risk factors using clinical algorithms.",
      metrics: "95% clinical accuracy",
      color: "teal"
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      title: "Vitamin Deficiency Detection",
      description: "Early identification of nutrient deficiencies through symptom analysis and medication profiling.",
      metrics: "10+ vitamin profiles",
      color: "blue"
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
        </svg>
      ),
      title: "Personalized Nutrition Planning",
      description: "Evidence-based dietary recommendations considering drug-nutrient interactions and patient preferences.",
      metrics: "Personalized meal plans",
      color: "emerald"
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Mental Health Monitoring",
      description: "Comprehensive wellness support with emotional tracking and lifestyle recommendations.",
      metrics: "Holistic care approach",
      color: "purple"
    }
  ];

  const clinicalStats = [
    { value: "98%", label: "Clinical Accuracy", description: "In drug interaction detection" },
    { value: "50k+", label: "Medications", description: "In our knowledge base" },
    { value: "24/7", label: "Monitoring", description: "Real-time risk assessment" },
    { value: "10k+", label: "Active Users", description: "Healthcare providers & patients" }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      teal: 'bg-teal-50 border-teal-200 text-teal-600',
      blue: 'bg-blue-50 border-blue-200 text-blue-600',
      emerald: 'bg-emerald-50 border-emerald-200 text-emerald-600',
      purple: 'bg-purple-50 border-purple-200 text-purple-600'
    };
    return colors[color as keyof typeof colors] || colors.teal;
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section - Clinical Grade */}
      <section className="relative bg-white py-20 lg:py-28">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-teal-50 border border-teal-200">
                  <span className="text-teal-600 font-medium text-sm">Clinical AI Platform</span>
                </div>
                <h1 className="text-3xl lg:text-3xl xl:text-3xl font-bold text-gray-900 leading-tight">
                  SMART POLYPHARMACY & VITAMIN RECOMMENDATION SYSTEM
                  <span className="block text-transparent bg-gradient-to-r from-teal-600 to-blue-700 bg-clip-text">
                    FOR-GERIATRIC-PATIENTS
                  </span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed max-w-2xl">
                  Advanced AI-driven platform for polypharmacy management and vitamin deficiency prevention. 
                  Trusted by healthcare providers for evidence-based clinical decision support.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/clinical-demo" 
                  className="bg-gradient-to-r from-teal-600 to-blue-700 text-white px-8 py-4 rounded-lg hover:shadow-xl transition-all duration-200 font-semibold text-center"
                >
                  Start Clinical Assessment
                </Link>
                <Link 
                  href="/provider-information" 
                  className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg hover:border-teal-500 hover:text-teal-600 transition-all duration-200 font-semibold text-center"
                >
                  For Healthcare Providers
                </Link>
              </div>

            
            </div>

            <div className="relative">
             
                  <div className="flex items-center justify-center">
                    <img
                      src="/images/polycare.jpg"
                      alt="Clinical illustration"
                      
                    />
                  </div>
              
            </div>
          </div>
        </div>
      </section>

      {/* Clinical Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Comprehensive Clinical Solutions
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Integrated AI systems designed specifically for geriatric patient care and medication safety.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {clinicalFeatures.map((feature, index) => (
              <div 
                key={index}
                className={`bg-white rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 cursor-pointer ${
                  activeFeature === index ? 'ring-2 ring-teal-500' : ''
                }`}
                onMouseEnter={() => setActiveFeature(index)}
              >
                <div className="flex items-start space-x-6">
                  <div className={`p-4 rounded-xl ${getColorClasses(feature.color)}`}>
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed mb-4">
                      {feature.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-teal-600">
                        {feature.metrics}
                      </span>
                      <Link 
                        href={`/features/${feature.title.toLowerCase().replace(/\s+/g, '-')}`}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        Learn more →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Clinical Workflow Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Streamlined Clinical Workflow
            </h2>
            <p className="text-xl text-gray-600">
              Designed for seamless integration into healthcare practices
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 mx-auto mb-6">
                  <span className="text-2xl font-bold">1</span>
                </div>
                <h3 className="text-xl font-bold mb-4">Patient Data Input</h3>
                <p className="text-gray-600">
                  Secure entry of medications, health history, and clinical parameters
                </p>
              </div>
              
              <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mx-auto mb-6">
                  <span className="text-2xl font-bold">2</span>
                </div>
                <h3 className="text-xl font-bold mb-4">AI Analysis</h3>
                <p className="text-gray-600">
                  Comprehensive assessment of interactions and deficiency risks
                </p>
              </div>
              
              <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-6">
                  <span className="text-2xl font-bold">3</span>
                </div>
                <h3 className="text-xl font-bold mb-4">Clinical Report</h3>
                <p className="text-gray-600">
                  Actionable insights and evidence-based recommendations
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Professional */}
      <section className="py-20 bg-gradient-to-r from-gray-900 to-blue-900 text-white">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              Ready to Enhance Patient Safety?
            </h2>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              Join leading healthcare institutions using SmartPolyCare for evidence-based geriatric care management.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                href="/clinical-trial" 
                className="bg-white text-gray-900 px-8 py-4 rounded-lg hover:shadow-2xl transition-all duration-200 font-semibold"
              >
                Start Clinical Trial
              </Link>
              <Link 
                href="/contact-sales" 
                className="border-2 border-white text-white px-8 py-4 rounded-lg hover:bg-white hover:text-gray-900 transition-all duration-200 font-semibold"
              >
                Contact Sales
              </Link>
            </div>
            <p className="text-blue-200 mt-6 text-sm">
              HIPAA compliant • Clinical validation ongoing • Provider network available
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;