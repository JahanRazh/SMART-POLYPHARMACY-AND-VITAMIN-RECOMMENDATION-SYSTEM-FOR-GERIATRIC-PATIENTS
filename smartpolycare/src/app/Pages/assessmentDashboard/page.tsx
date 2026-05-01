'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { User, Calendar, Activity, Pill, Brain, HeartPulse, Stethoscope, ChevronRight, Bell, HelpCircle } from 'lucide-react';
import Image from 'next/image';

const MAX_SCORES = {
  gds15: 15,
  gad7: 21,
  mmas8: 8,
  iadl: 8
};

// Interpretation logic based on psychometric standards
const getCategory = (metric: string, score: number) => {
  if (metric === 'gds15') {
    if (score <= 4) return { label: 'Normal', color: 'text-green-600', bg: 'bg-green-100', status: 'Good' };
    if (score <= 8) return { label: 'Mild Depression', color: 'text-yellow-600', bg: 'bg-yellow-100', status: 'Moderate' };
    if (score <= 11) return { label: 'Moderate Depression', color: 'text-orange-600', bg: 'bg-orange-100', status: 'Needs Attention' };
    return { label: 'Severe Depression', color: 'text-red-600', bg: 'bg-red-100', status: 'High Risk' };
  }
  if (metric === 'gad7') {
    if (score <= 4) return { label: 'Minimal Anxiety', color: 'text-green-600', bg: 'bg-green-100', status: 'Good' };
    if (score <= 9) return { label: 'Mild Anxiety', color: 'text-yellow-600', bg: 'bg-yellow-100', status: 'Moderate' };
    if (score <= 14) return { label: 'Moderate Anxiety', color: 'text-orange-600', bg: 'bg-orange-100', status: 'Needs Attention' };
    return { label: 'Severe Anxiety', color: 'text-red-600', bg: 'bg-red-100', status: 'High Risk' };
  }
  if (metric === 'mmas8') {
    if (score === 8) return { label: 'High Adherence', color: 'text-green-600', bg: 'bg-green-100', status: 'Good' };
    if (score >= 6) return { label: 'Medium Adherence', color: 'text-yellow-600', bg: 'bg-yellow-100', status: 'Moderate' };
    return { label: 'Low Adherence', color: 'text-red-600', bg: 'bg-red-100', status: 'High Risk' };
  }
  if (metric === 'iadl') {
    if (score === 8) return { label: 'Fully Independent', color: 'text-green-600', bg: 'bg-green-100', status: 'Good' };
    if (score >= 6) return { label: 'Mild Impairment', color: 'text-yellow-600', bg: 'bg-yellow-100', status: 'Moderate' };
    if (score >= 4) return { label: 'Moderate Impairment', color: 'text-orange-600', bg: 'bg-orange-100', status: 'Needs Attention' };
    return { label: 'Severe Impairment', color: 'text-red-600', bg: 'bg-red-100', status: 'High Risk' };
  }
  return { label: 'Unknown', color: 'text-gray-600', bg: 'bg-gray-100', status: 'Unknown' };
};

// Mock Firebase Data
const mockAssessments = [
  { timestamp: "2024-03-10T10:00:00Z", gds15_score: 9, gad7_score: 11, mmas8_score: 7, iadl_score: 8 },
  { timestamp: "2024-04-15T10:00:00Z", gds15_score: 8, gad7_score: 10, mmas8_score: 6, iadl_score: 7 },
  { timestamp: "2024-05-20T10:30:00Z", gds15_score: 7, gad7_score: 8, mmas8_score: 4, iadl_score: 6 }
];

export default function AssessmentDashboard() {
  const [viewMode, setViewMode] = useState<'raw' | 'normalized'>('normalized');

  // Process data for charts
  const chartData = useMemo(() => {
    return mockAssessments.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).map(entry => {
      const date = new Date(entry.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      
      if (viewMode === 'normalized') {
        return {
          date,
          fullDate: entry.timestamp,
          GDS15: Math.round((entry.gds15_score / MAX_SCORES.gds15) * 100),
          GAD7: Math.round((entry.gad7_score / MAX_SCORES.gad7) * 100),
          MMAS8: Math.round((entry.mmas8_score / MAX_SCORES.mmas8) * 100),
          IADL: Math.round((entry.iadl_score / MAX_SCORES.iadl) * 100),
          raw: entry
        };
      }
      return {
        date,
        fullDate: entry.timestamp,
        GDS15: entry.gds15_score,
        GAD7: entry.gad7_score,
        MMAS8: entry.mmas8_score,
        IADL: entry.iadl_score,
        raw: entry
      };
    });
  }, [viewMode]);

  const latest = mockAssessments[mockAssessments.length - 1];

  const gdsCategory = getCategory('gds15', latest.gds15_score);
  const gadCategory = getCategory('gad7', latest.gad7_score);
  const mmasCategory = getCategory('mmas8', latest.mmas8_score);
  const iadlCategory = getCategory('iadl', latest.iadl_score);

  // Trend analysis logic
  const getTrend = (metric: 'gds15_score' | 'gad7_score' | 'mmas8_score' | 'iadl_score') => {
    if (mockAssessments.length < 2) return 'Stable';
    const current = mockAssessments[mockAssessments.length - 1][metric];
    const prev = mockAssessments[mockAssessments.length - 2][metric];
    
    // For GDS and GAD, lower is better. For MMAS and IADL, higher is better.
    if (metric === 'gds15_score' || metric === 'gad7_score') {
      if (current < prev) return 'Improving';
      if (current > prev) return 'Deteriorating';
      return 'Stable';
    } else {
      if (current > prev) return 'Improving';
      if (current < prev) return 'Deteriorating';
      return 'Stable';
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const rawData = payload[0].payload.raw;
      return (
        <div className="bg-white p-4 border border-gray-200 shadow-xl rounded-xl min-w-[200px]">
          <p className="font-bold text-gray-800 border-b pb-2 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => {
            let metricKey = '';
            if (entry.dataKey === 'GDS15') metricKey = 'gds15';
            else if (entry.dataKey === 'GAD7') metricKey = 'gad7';
            else if (entry.dataKey === 'MMAS8') metricKey = 'mmas8';
            else if (entry.dataKey === 'IADL') metricKey = 'iadl';

            const rawVal = rawData[`${metricKey}_score`];
            const cat = getCategory(metricKey, rawVal);

            return (
              <div key={index} className="flex justify-between items-center text-sm my-1 gap-4">
                <span style={{ color: entry.color }} className="font-semibold">{entry.name}:</span>
                <div className="text-right flex items-center gap-2">
                  <span className="font-bold">{entry.value}{viewMode === 'normalized' ? '%' : ''}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${cat.bg} ${cat.color}`}>{cat.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Activity className="w-6 h-6 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-800">Psychometric Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"><Bell className="w-5 h-5" /></button>
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"><HelpCircle className="w-5 h-5" /></button>
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border-2 border-white shadow-sm">
            RK
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8 space-y-6">
        
        {/* Profile Card & Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6 items-center md:items-start">
            <div className="w-24 h-24 rounded-full bg-gray-200 border-4 border-white shadow-md flex-shrink-0 overflow-hidden relative">
               <div className="absolute inset-0 flex items-center justify-center text-gray-400"><User size={48} /></div>
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Ramesh Kumar</h2>
                <p className="text-gray-500">72 Years, Male</p>
                <p className="text-indigo-600 font-medium mt-1 text-sm bg-indigo-50 inline-block px-2 py-1 rounded-md">Patient ID: GC-2024-1287</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Session Date</p>
                    <p className="text-sm font-semibold text-gray-800">20 May 2024, 10:30 AM</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Assessment Type</p>
                    <p className="text-sm font-semibold text-gray-800">Routine Psychometric Evaluation</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800">Patient Info</h3>
              <button className="text-indigo-600 text-sm font-semibold hover:underline">Edit</button>
            </div>
            <ul className="space-y-3 text-sm">
              <li className="flex justify-between"><span className="text-gray-500">Condition</span><span className="font-semibold text-gray-800">Hypertension, Diabetes</span></li>
              <li className="flex justify-between"><span className="text-gray-500">Medications</span><span className="font-semibold text-gray-800">6 Active</span></li>
              <li className="flex justify-between"><span className="text-gray-500">Phone</span><span className="font-semibold text-gray-800">+91 9876543210</span></li>
            </ul>
          </div>
        </div>

        {/* Score Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-blue-50/50 rounded-3xl p-5 border border-blue-100 flex flex-col justify-between hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="font-bold text-gray-800">Emotional Health</p>
                <p className="text-xs text-gray-500">(GDS-15)</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600"><Brain className="w-6 h-6" /></div>
            </div>
            <div>
              <p className="text-3xl font-bold text-blue-600">{latest.gds15_score} <span className="text-sm text-gray-400 font-normal">/ {MAX_SCORES.gds15}</span></p>
              <div className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-semibold ${gdsCategory.bg} ${gdsCategory.color}`}>
                {gdsCategory.label}
              </div>
            </div>
          </div>

          <div className="bg-emerald-50/50 rounded-3xl p-5 border border-emerald-100 flex flex-col justify-between hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="font-bold text-gray-800">Anxiety Control</p>
                <p className="text-xs text-gray-500">(GAD-7)</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600"><HeartPulse className="w-6 h-6" /></div>
            </div>
            <div>
              <p className="text-3xl font-bold text-emerald-600">{latest.gad7_score} <span className="text-sm text-gray-400 font-normal">/ {MAX_SCORES.gad7}</span></p>
              <div className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-semibold ${gadCategory.bg} ${gadCategory.color}`}>
                {gadCategory.label}
              </div>
            </div>
          </div>

          <div className="bg-amber-50/50 rounded-3xl p-5 border border-amber-100 flex flex-col justify-between hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="font-bold text-gray-800">Med Adherence</p>
                <p className="text-xs text-gray-500">(MMAS-8)</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600"><Pill className="w-6 h-6" /></div>
            </div>
            <div>
              <p className="text-3xl font-bold text-amber-600">{latest.mmas8_score} <span className="text-sm text-gray-400 font-normal">/ {MAX_SCORES.mmas8}</span></p>
              <div className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-semibold ${mmasCategory.bg} ${mmasCategory.color}`}>
                {mmasCategory.label}
              </div>
            </div>
          </div>

          <div className="bg-purple-50/50 rounded-3xl p-5 border border-purple-100 flex flex-col justify-between hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="font-bold text-gray-800">Functional Indep.</p>
                <p className="text-xs text-gray-500">(IADL)</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600"><Activity className="w-6 h-6" /></div>
            </div>
            <div>
              <p className="text-3xl font-bold text-purple-600">{latest.iadl_score} <span className="text-sm text-gray-400 font-normal">/ {MAX_SCORES.iadl}</span></p>
              <div className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-semibold ${iadlCategory.bg} ${iadlCategory.color}`}>
                {iadlCategory.label}
              </div>
            </div>
          </div>
        </div>

        {/* Chart & Insights Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                Time-Series Trend Overview
                <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Validated Scales</span>
              </h3>
              
              <div className="bg-gray-100 p-1 rounded-xl flex">
                <button 
                  onClick={() => setViewMode('normalized')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${viewMode === 'normalized' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Normalized (0-100%)
                </button>
                <button 
                  onClick={() => setViewMode('raw')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${viewMode === 'raw' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Raw Scores
                </button>
              </div>
            </div>

            <div className="flex-1 w-full h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#6B7280', fontSize: 12}} 
                    domain={viewMode === 'normalized' ? [0, 100] : ['auto', 'auto']}
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  
                  <Line type="monotone" name="Depression (GDS-15)" dataKey="GDS15" stroke="#3B82F6" strokeWidth={3} dot={{r: 5, strokeWidth: 2}} activeDot={{r: 8}} />
                  <Line type="monotone" name="Anxiety (GAD-7)" dataKey="GAD7" stroke="#10B981" strokeWidth={3} dot={{r: 5, strokeWidth: 2}} activeDot={{r: 8}} />
                  <Line type="monotone" name="Adherence (MMAS-8)" dataKey="MMAS8" stroke="#F59E0B" strokeWidth={3} dot={{r: 5, strokeWidth: 2}} activeDot={{r: 8}} />
                  <Line type="monotone" name="Function (IADL)" dataKey="IADL" stroke="#8B5CF6" strokeWidth={3} dot={{r: 5, strokeWidth: 2}} activeDot={{r: 8}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Clinical Insights Panel */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-indigo-600" />
              AI Clinical Insights
            </h3>
            
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-4">
                <Brain className="w-6 h-6 text-red-500 shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-red-900 text-sm">Depression & Anxiety Trend</p>
                  <p className="text-red-700 text-sm mt-1">
                    GDS-15 score indicates <span className="font-bold">{gdsCategory.label}</span> ({getTrend('gds15_score')}). 
                    GAD-7 score indicates <span className="font-bold">{gadCategory.label}</span> ({getTrend('gad7_score')}). 
                    Patient may benefit from relaxation techniques and regular counseling.
                  </p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-4">
                <Pill className="w-6 h-6 text-amber-500 shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-amber-900 text-sm">Medication Routine</p>
                  <p className="text-amber-700 text-sm mt-1">
                    Medication adherence is <span className="font-bold">{mmasCategory.label}</span>. Trend is {getTrend('mmas8_score')}. Monitor and reinforce medication routine.
                  </p>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex gap-4">
                <Activity className="w-6 h-6 text-emerald-500 shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-emerald-900 text-sm">Functional Ability</p>
                  <p className="text-emerald-700 text-sm mt-1">
                    Functional independence shows <span className="font-bold">{iadlCategory.label}</span> ({getTrend('iadl_score')}). Encourage continued physical activity.
                  </p>
                </div>
              </div>

              <button className="w-full mt-4 py-3 bg-white border-2 border-indigo-100 text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-colors">
                View Detailed Analysis
              </button>
            </div>
          </div>
        </div>

        {/* Assessment History Table */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Assessment History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-y border-gray-200">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-center">GDS-15<br/><span className="text-[10px] font-normal lowercase">(Depression)</span></th>
                  <th className="px-6 py-4 text-center">GAD-7<br/><span className="text-[10px] font-normal lowercase">(Anxiety)</span></th>
                  <th className="px-6 py-4 text-center">MMAS-8<br/><span className="text-[10px] font-normal lowercase">(Adherence)</span></th>
                  <th className="px-6 py-4 text-center">IADL<br/><span className="text-[10px] font-normal lowercase">(Independence)</span></th>
                  <th className="px-6 py-4">Overall Status</th>
                </tr>
              </thead>
              <tbody>
                {[...mockAssessments].reverse().map((entry, idx) => {
                  const dCat = getCategory('gds15', entry.gds15_score);
                  const aCat = getCategory('gad7', entry.gad7_score);
                  const mCat = getCategory('mmas8', entry.mmas8_score);
                  const iCat = getCategory('iadl', entry.iadl_score);
                  
                  // Simple overall status logic for demo
                  const hasSevere = [dCat, aCat, mCat, iCat].some(c => c.label.includes('Severe') || c.label.includes('Low'));
                  const overallStatus = hasSevere ? 'High Risk' : 'Moderate Risk';
                  const statusColor = hasSevere ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700';

                  return (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-800">
                        {new Date(entry.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-blue-600">{entry.gds15_score}</td>
                      <td className="px-6 py-4 text-center font-bold text-emerald-600">{entry.gad7_score}</td>
                      <td className="px-6 py-4 text-center font-bold text-amber-600">{entry.mmas8_score}</td>
                      <td className="px-6 py-4 text-center font-bold text-purple-600">{entry.iadl_score}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-lg font-semibold text-xs ${statusColor}`}>
                          {overallStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex justify-center text-xs text-gray-400 items-center gap-1">
            <HelpCircle className="w-3 h-3" /> All data is secure and HIPAA compliant
          </div>
        </div>

      </div>
    </div>
  );
}
