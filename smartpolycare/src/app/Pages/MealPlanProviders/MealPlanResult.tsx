import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  ArrowLeft, Download, Printer, User, Heart, Zap, Info, ShieldAlert, 
  Calendar, Clock, CheckCircle, Lock, Save, Settings,
  Activity, Scale, Ruler, Pill, Loader2,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuth } from '@/app/components/Contexts/AuthContext';
import { useMealReminders } from '@/app/components/Hooks/useMealReminders';

interface ParsedMeal {
  foodName: string;
  servingSize: number;
  calories: number;
  caloriesPerGram: string;
  rawString: string;
}

interface DailyNutrition {
  totalCalories: number;
  estimatedProtein: number;
  estimatedCarbs: number;
  estimatedFat: number;
  mealCount: number;
}

interface MealPlanResultProps {
  result: any;
  onBack?: () => void;
  onDelete?: (id: string) => void;
  isSavedView?: boolean;
}

const MealPlanResult: React.FC<MealPlanResultProps> = ({ 
  result, 
  onBack, 
  onDelete,
  isSavedView = false 
}) => {
  const { user } = useAuth();
  
  // HUD Data from useMealReminders
  const { nextMeal, timeToNextMeal, timeToDayEnd, dailyProgress, setDailyProgress } = useMealReminders(result as any);

  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [selectedDay, setSelectedDay] = useState("Day 1");
  const [showRawData, setShowRawData] = useState(false);
  const [checkedMeals, setCheckedMeals] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [trackingError, setTrackingError] = useState("");

  const selectedOption = useMemo(() => 
    result?.mealPlanOptions?.[selectedOptionIndex], 
    [result, selectedOptionIndex]
  );

  const allDays = useMemo(() => {
    if (!selectedOption?.weeklyPlan) return [];
    return Object.keys(selectedOption.weeklyPlan).sort((a, b) => {
      const numA = parseInt(a.replace("Day ", "")) || 0;
      const numB = parseInt(b.replace("Day ", "")) || 0;
      return numA - numB;
    });
  }, [selectedOption]);

  const daysInWeek = useMemo(() => {
    const startIdx = (currentWeek - 1) * 7;
    return allDays.slice(startIdx, startIdx + 7);
  }, [allDays, currentWeek]);

  const totalWeeks = useMemo(() => Math.ceil(allDays.length / 7), [allDays]);

  const handleWeekChange = (direction: 'next' | 'prev') => {
    if (direction === 'next' && currentWeek < totalWeeks) {
      setCurrentWeek(prev => prev + 1);
    } else if (direction === 'prev' && currentWeek > 1) {
      setCurrentWeek(prev => prev - 1);
    }
  };

  const selectedDayData = useMemo(() => {
    if (!selectedOption?.weeklyPlan) return null;
    return selectedOption.weeklyPlan[selectedDay] || selectedOption.weeklyPlan[daysInWeek[0]];
  }, [selectedOption, selectedDay, daysInWeek]);

  const parseMealString = useCallback((meal: string): ParsedMeal => {
    if (!meal || typeof meal !== 'string') {
      return { foodName: 'Unknown', servingSize: 0, calories: 0, caloriesPerGram: '0', rawString: String(meal) };
    }
    const match = meal.match(/^(•\s*)?(.+?)\s*-\s*(\d+)g\s*\(~(\d+)\s*kcal\)$/);
    if (match) {
      return {
        foodName: match[2].trim(),
        servingSize: parseInt(match[3]),
        calories: parseInt(match[4]),
        caloriesPerGram: (parseInt(match[4]) / parseInt(match[3])).toFixed(2),
        rawString: meal,
      };
    }
    return {
      foodName: meal.replace(/^•\s*/, "").split(" - ")[0] || meal,
      servingSize: 0,
      calories: 0,
      caloriesPerGram: "0",
      rawString: meal,
    };
  }, []);

  const checkDayCompletion = useCallback((dayName: string) => {
    const dayData = selectedOption?.weeklyPlan?.[dayName];
    if (!dayData) return false;
    return dayData.meals.every((_: any, idx: number) => checkedMeals[`${dayName}-${idx}`]);
  }, [selectedOption, checkedMeals]);

  const isDayLocked = useCallback((dayName: string) => {
    if (isSavedView) return false;
    const dayNum = parseInt(dayName.replace("Day ", ""));
    if (dayNum === 1) return false;
    
    // Strict sequential lock: Day N is locked if Day N-1 is not 100% complete
    const prevDayName = `Day ${dayNum - 1}`;
    return !checkDayCompletion(prevDayName);
  }, [checkDayCompletion, isSavedView]);

  useEffect(() => {
    const saved = localStorage.getItem(`meal-progress-${result.id || result.databaseId || 'current'}`);
    if (saved) {
      try {
        setCheckedMeals(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load progress", e);
      }
    }
  }, [result.id, result.databaseId]);

  const toggleMeal = (day: string, idx: number) => {
    if (isDayLocked(day) || !selectedOption) return;
    const key = `${day}-${idx}`;
    const newChecked = { ...checkedMeals, [key]: !checkedMeals[key] };
    setCheckedMeals(newChecked);
    localStorage.setItem(`meal-progress-${result.id || result.databaseId || 'current'}`, JSON.stringify(newChecked));
    
    // Update daily progress for HUD
    const today = selectedDay;
    const todayMeals = selectedOption?.weeklyPlan?.[today]?.meals || [];
    const completedCount = todayMeals.filter((_: any, i: number) => newChecked[`${today}-${i}`]).length;
    const progress = todayMeals.length > 0 ? (completedCount / todayMeals.length) * 100 : 0;
    setDailyProgress(progress);
  };

  const saveToCloud = async (day: string) => {
    if (!user?.uid) return;
    setIsSaving(true);
    setTrackingError("");
    
    try {
      const dayMeals = selectedOption?.weeklyPlan?.[day]?.meals || [];
      const consumedMeals = dayMeals
        .map((m: string, i: number) => ({ name: parseMealString(m).foodName, index: i }))
        .filter((_: any, i: number) => checkedMeals[`${day}-${i}`]);

      const payload = {
        userId: user.uid,
        planId: result.id || result.databaseId || "unknown",
        day: day,
        consumedMeals: consumedMeals,
        timestamp: new Date().toISOString()
      };

      const response = await fetch('http://127.0.0.1:5000/api/meal-plans/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Failed to sync progress");
      
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (err) {
      setTrackingError("Sync failed. Local progress saved.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!result) return null;

  const clinicalConditions = result.conditions || [];
  const nutrientDeficiencies = result.vitamin_deficiencies || [];

  const upcomingPrepDays = allDays.filter(d => {
    const dNum = parseInt(d.replace("Day ", ""));
    const selNum = parseInt(selectedDay.replace("Day ", ""));
    return dNum > selNum && dNum <= selNum + 3;
  });

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </button>
            <div className="h-6 w-px bg-gray-200" />
            <h1 className="text-sm font-black text-gray-900 uppercase tracking-widest">
              Geriatric Performance Dashboard
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            {showSuccessMessage && (
               <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 animate-fade-in">
                  Cloud Sync Successful
               </div>
            )}
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-gray-900 transition-all hover:shadow-sm">
              <Printer className="w-4 h-4" />
              Print Report
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all hover:shadow-lg shadow-gray-200">
              <Download className="w-4 h-4" />
              Export .JSON
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Clinical Profile Header */}
        <div className="mb-12">
           <div className="flex items-center gap-2 mb-6">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                Clinical Profile
              </span>
           </div>
           
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {/* Card 1: Name */}
                <div className="bg-white border border-gray-100 p-5 rounded-[24px] shadow-sm hover:shadow-md transition-all group">
                   <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-indigo-50 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                         <User className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Patient Name</span>
                   </div>
                   <p className="text-base font-black text-gray-900 truncate">
                      {result.basicProfile?.name || result.patient_name || result.patientName || "N/A"}
                   </p>
                </div>

                {/* Card 2: Sex & Age */}
                <div className="bg-white border border-gray-100 p-5 rounded-[24px] shadow-sm hover:shadow-md transition-all group">
                   <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-emerald-50 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                         <Calendar className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sex & Age</span>
                   </div>
                   <p className="text-base font-black text-gray-900 uppercase">
                     {result.basicProfile?.gender || result.patient_gender || result.patientGender || "N/A"} • {result.basicProfile?.age || result.patient_age || result.patientAge || "N/A"}y
                   </p>
                </div>

                {/* Card 3: Height */}
                <div className="bg-white border border-gray-100 p-5 rounded-[24px] shadow-sm hover:shadow-md transition-all group">
                   <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-sky-50 rounded-xl group-hover:bg-sky-600 group-hover:text-white transition-colors">
                         <Ruler className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Height</span>
                   </div>
                   <p className="text-base font-black text-gray-900">
                      {result.basicProfile?.height || result.height || result.patientHeight || "N/A"} cm
                   </p>
                </div>

                {/* Card 4: Weight */}
                <div className="bg-white border border-gray-100 p-5 rounded-[24px] shadow-sm hover:shadow-md transition-all group">
                   <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-rose-50 rounded-xl group-hover:bg-rose-600 group-hover:text-white transition-colors">
                         <Scale className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Weight</span>
                   </div>
                   <p className="text-base font-black text-gray-900">
                      {result.basicProfile?.weight || result.weight || result.patientWeight || "N/A"} kg
                   </p>
                </div>

                {/* Card 5: BMI Category */}
                <div className="bg-white border border-gray-100 p-5 rounded-[24px] shadow-sm hover:shadow-md transition-all group">
                   <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-amber-50 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
                         <Activity className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">BMI Status</span>
                   </div>
                    <p className="text-base font-black text-gray-900 truncate uppercase">
                       {result.bmi_category || result.bmiCategory || result.bmiLevel || "N/A"}
                    </p>
                </div>

                {/* Card 6: Activity Level */}
                <div className="bg-white border border-gray-100 p-5 rounded-[24px] shadow-sm hover:shadow-md transition-all group">
                   <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-purple-50 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                         <Zap className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Activity</span>
                   </div>
                   <p className="text-base font-black text-gray-900 truncate uppercase">
                      {result.basicProfile?.activityLevel || result.activity_level || result.activityLevel || result.patientActivityLevel || "N/A"}
                   </p>
                </div>

                <div className="lg:col-span-6 mt-4 p-6 bg-emerald-950 rounded-[32px] text-white flex items-center justify-between shadow-xl shadow-emerald-900/10">
                   <div className="flex items-center gap-4">
                      <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                         <Heart className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div>
                         <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Target Deficiency Resolution</p>
                         <h3 className="text-xl font-black">Daily Calorie Target: {result.daily_calorie_range || result.dailyCalorieRange || "N/A"}</h3>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-black text-emerald-400/60 uppercase tracking-widest">Plan Duration</p>
                      <p className="text-xl font-black uppercase">{result.plan_duration || result.planDuration || "N/A"}</p>
                   </div>
                </div>
           </div>
        </div>

        {/* Nutritional Guidance Section */}
        <div className="mb-16">
           <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                 <ShieldAlert className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight italic">Nutrient Focus & Guidance</h2>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {nutrientDeficiencies.map((def: any, i: number) => (
                <div key={i} className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm hover:shadow-xl transition-all hover:border-amber-200 group">
                   <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-600 group-hover:text-white transition-all">
                        <Pill className="w-6 h-6" />
                      </div>
                      <div className="px-3 py-1 bg-gray-50 text-gray-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                         Deficiency
                      </div>
                   </div>
                   <h3 className="text-lg font-black text-gray-900 mb-1">{def.name}</h3>
                   <div className="flex items-center gap-2 mb-4">
                      <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                        {def.level || 'Moderate'}
                      </span>
                   </div>
                   <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 w-2/3" />
                   </div>
                </div>
              ))}
              
              {nutrientDeficiencies.length === 0 && (
                 <div className="lg:col-span-4 p-8 bg-gray-50 rounded-[32px] border border-dashed border-gray-300 text-center">
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No Critical Deficiencies Flagged</p>
                 </div>
              )}
           </div>
        </div>

        {/* Live HUD Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-gray-900 rounded-3xl p-6 text-white shadow-xl shadow-gray-200 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 bg-white/5 rounded-full group-hover:scale-150 transition-transform duration-700" />
               <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                     <div className="p-2 bg-white/10 rounded-xl">
                        <Clock className="w-5 h-5 text-amber-400" />
                     </div>
                     <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Day Countdown</span>
                  </div>
                  <p className="text-3xl font-black tabular-nums tracking-tighter mb-1">{timeToDayEnd}</p>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Until Day Over</p>
               </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
               <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                     <CheckCircle className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Daily Progress</span>
               </div>
               <p className="text-3xl font-black text-gray-900 tracking-tighter mb-2">{Math.round(dailyProgress)}%</p>
               <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-1000 ease-out"
                    style={{ width: `${dailyProgress}%` }}
                  />
               </div>
            </div>

            <div className="md:col-span-2 bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200 relative overflow-hidden flex items-center justify-between">
               <div className="absolute top-0 right-0 w-64 h-64 -mr-32 -mt-32 bg-white/10 rounded-full" />
               <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-2">
                     <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                        <Zap className="w-5 h-5 text-amber-300" />
                     </div>
                     <span className="text-[10px] font-black uppercase tracking-widest text-indigo-100">Next Scheduled Meal</span>
                  </div>
                  <h3 className="text-xl font-black tracking-tight">{(nextMeal as any)?.name || "All Meals Logged"}</h3>
                  <p className="text-sm font-bold text-indigo-100/80">{(nextMeal as any)?.time || "Great job!"}</p>
               </div>
               <div className="relative z-10 text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-100 mb-1">Incoming In</p>
                  <p className="text-3xl font-black tabular-nums tracking-tighter">{timeToNextMeal}</p>
               </div>
            </div>
        </div>

        <div className="bg-white rounded-[40px] border border-gray-100 p-8 lg:p-12 shadow-sm mb-12">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                 <Calendar className="w-6 h-6 text-gray-900" />
                 <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Clinical Meal Calendar</h2>
              </div>
              <p className="text-gray-500 font-medium max-w-xl text-lg">
                Strict sequential progression. Complete each day to unlock the next calibrated meal plan.
              </p>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between bg-gray-100 p-2 rounded-2xl">
                <button 
                  onClick={() => handleWeekChange('prev')}
                  disabled={currentWeek === 1}
                  className={`p-2 rounded-xl transition-all ${currentWeek === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-white hover:text-gray-900 shadow-sm'}`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="text-center">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-0.5">Timeline Navigator</p>
                  <p className="text-sm font-black text-gray-900">Week {currentWeek} of {totalWeeks}</p>
                </div>
                <button 
                  onClick={() => handleWeekChange('next')}
                  disabled={currentWeek === totalWeeks}
                  className={`p-2 rounded-xl transition-all ${currentWeek === totalWeeks ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-white hover:text-gray-900 shadow-sm'}`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="flex p-1.5 bg-gray-100 rounded-2xl overflow-x-auto no-scrollbar scrollbar-hide">
                {daysInWeek.map((day) => {
                  const isLocked = isDayLocked(day);
                  return (
                    <button
                      key={day}
                      onClick={() => !isLocked && setSelectedDay(day)}
                      className={`flex flex-col items-center justify-center min-w-[80px] h-20 rounded-xl transition-all relative ${
                        selectedDay === day 
                          ? "bg-white text-gray-900 shadow-sm" 
                          : isLocked 
                            ? "text-gray-400 cursor-not-allowed" 
                            : "text-gray-500 hover:text-gray-900 hover:bg-white/50"
                      }`}
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest mb-1">{day.split(" ")[0]}</span>
                      <span className="text-lg font-black">{day.split(" ")[1]}</span>
                      {isLocked && <Lock className="w-3 h-3 absolute top-2 right-2 opacity-40 text-rose-500" />}
                      {checkDayCompletion(day) && <CheckCircle className="w-3 h-3 absolute top-2 right-2 text-emerald-500" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-8 space-y-6">
              <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-black uppercase tracking-widest">
                       {selectedDay} Regimen
                    </div>
                    {isDayLocked(selectedDay) && (
                       <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-black border border-rose-100">
                          <Lock className="w-3 h-3" />
                          LOCKED: COMPLETE PREVIOUS DAY
                       </div>
                    )}
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Day Highlights</p>
                    <p className="text-sm font-black text-gray-900">High Fiber • Protein Dense</p>
                 </div>
              </div>

              {selectedDayData?.meals?.map((meal: string, idx: number) => {
                const p = parseMealString(meal);
                const isChecked = checkedMeals[`${selectedDay}-${idx}`];
                const isLocked = isDayLocked(selectedDay);
                
                return (
                  <div 
                    key={idx}
                    className={`group relative bg-white border rounded-3xl p-6 transition-all duration-300 ${
                      isChecked 
                        ? "border-emerald-200 bg-emerald-50/20 shadow-none scale-[0.98]" 
                        : isLocked
                          ? "border-gray-100 opacity-60 grayscale cursor-not-allowed"
                          : "border-gray-100 hover:border-gray-300 hover:bg-gray-50/50 hover:-translate-y-1 shadow-sm hover:shadow-xl hover:shadow-gray-100"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-start gap-4">
                        <div className={`mt-1.5 w-6 h-6 rounded-full border-4 flex-shrink-0 transition-all duration-500 ${
                          isChecked 
                            ? "bg-emerald-500 border-emerald-200 scale-110 shadow-lg shadow-emerald-200" 
                            : "bg-white border-gray-100 group-hover:border-gray-300"
                        }`} />
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                            Meal {idx + 1}
                            {isChecked && <span className="text-emerald-600">✓ Logged</span>}
                          </p>
                          <h4 className={`text-xl font-black transition-all ${isChecked ? "text-emerald-900/40 line-through" : "text-gray-900"}`}>
                            {p.foodName}
                          </h4>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6 md:border-l md:border-gray-100 md:pl-8">
                         <div className="text-center">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Serving</p>
                            <p className="text-sm font-black text-gray-900">{p.servingSize}g</p>
                         </div>
                         <div className="text-center">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Energy</p>
                            <p className="text-sm font-black text-emerald-600">{p.calories} kcal</p>
                         </div>
                         <div className="flex items-center gap-2">
                           <button 
                             onClick={() => toggleMeal(selectedDay, idx)}
                             disabled={isLocked}
                             className={`p-3 rounded-2xl transition-all ${
                               isChecked 
                                 ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200" 
                                 : isLocked
                                   ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                                   : "bg-gray-900 text-white hover:bg-black hover:scale-105"
                             }`}
                           >
                             {isChecked ? <CheckCircle className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                           </button>
                         </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="lg:col-span-4 space-y-8">
               <div className="bg-gray-900 rounded-[32px] p-8 text-white relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 bg-emerald-400/20 rounded-full blur-3xl group-hover:bg-emerald-400/40 transition-all duration-700" />
                  <div className="relative z-10">
                    <h5 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-4">Metabolic Summary</h5>
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between items-end mb-2">
                           <p className="text-[10px] font-bold text-gray-400 uppercase">Protein Targets</p>
                           <p className="text-sm font-black">75% Achieved</p>
                        </div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                           <div className="h-full bg-emerald-400 w-3/4" />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-end mb-2">
                           <p className="text-[10px] font-bold text-gray-400 uppercase">Fiber Threshold</p>
                           <p className="text-sm font-black text-amber-400">Critical</p>
                        </div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                           <div className="h-full bg-amber-400 w-full animate-pulse" />
                        </div>
                      </div>
                    </div>
                  </div>
               </div>

               <div className="bg-white border rounded-[32px] p-6 border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-50">
                     <Settings className="w-5 h-5 text-gray-400" />
                     <h5 className="text-xs font-black text-gray-900 uppercase tracking-widest">Regimen Controls</h5>
                  </div>
                  <div className="space-y-4">
                      <button 
                         onClick={() => saveToCloud(selectedDay)}
                         disabled={isSaving}
                         className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-100"
                      >
                         {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                         {isSaving ? "Syncing..." : "Save Daily Progress"}
                      </button>
                  </div>
               </div>
            </div>
          </div>
          
          {/* Ready for Buy Advance Prep Console */}
          <div className="mt-20 p-8 lg:p-12 bg-amber-50 rounded-[40px] border border-amber-100 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 -mr-32 -mt-32 bg-amber-200/20 rounded-full blur-3xl opacity-50" />
             <div className="flex items-center justify-between mb-10 pb-6 border-b border-amber-200/50">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-2xl shadow-sm border border-amber-100 text-amber-600">
                       <Clock className="w-6 h-6" />
                    </div>
                    <div>
                       <h2 className="text-2xl font-black text-amber-900 tracking-tight italic">Ready for Buy</h2>
                       <p className="text-[10px] font-black text-amber-700/60 uppercase tracking-widest">Next 3 days pre-shopping console</p>
                    </div>
                 </div>
                 <div className="px-4 py-2 bg-amber-200/50 rounded-xl text-amber-700 text-[10px] font-black uppercase tracking-wider">
                    3-Day Shopping List
                 </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {upcomingPrepDays.map((prepDay) => {
                   const dayData = selectedOption?.weeklyPlan?.[prepDay];
                   return (
                      <div key={prepDay} className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 border border-amber-200/50 hover:bg-white transition-all group">
                         <div className="flex items-center justify-between mb-4">
                            <span className="px-3 py-1 bg-amber-900 text-amber-50 rounded-full text-[10px] font-black uppercase tracking-widest">
                               {prepDay}
                            </span>
                            <span className="text-[10px] font-bold text-amber-600 uppercase">Prep Mode 🛒</span>
                         </div>
                         <div className="space-y-3">
                            {dayData?.meals?.map((m: string, i: number) => {
                               const mp = parseMealString(m);
                               return (
                                  <div key={i} className="flex items-center justify-between gap-3 text-sm">
                                     <p className="text-amber-900 font-bold truncate flex-1">{mp.foodName}</p>
                                     <p className="text-amber-600/60 font-black text-[10px]">{mp.servingSize}g</p>
                                  </div>
                               );
                            })}
                         </div>
                      </div>
                   )
                })}
             </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-12 border-t border-gray-100">
           {/* Action Buttons Footer removed */}
        </div>
      </div>

      {showRawData && (
        <div className="max-w-7xl mx-auto px-6 mt-8">
          <pre className="p-8 bg-gray-900 text-emerald-400 rounded-[32px] overflow-auto text-xs font-mono shadow-2xl">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default MealPlanResult;