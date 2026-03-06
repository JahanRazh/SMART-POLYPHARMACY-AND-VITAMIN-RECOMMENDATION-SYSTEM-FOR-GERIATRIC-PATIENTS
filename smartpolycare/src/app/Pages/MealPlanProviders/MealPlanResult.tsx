import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useAuth } from "../../components/Contexts/AuthContext";
import { useMealReminders } from "../../components/Hooks/useMealReminders";
import { 
  CheckCircle, 
  Calendar, 
  ChevronRight, 
  Clock, 
  Info, 
  ArrowLeft,
  Settings,
  Download,
  Printer,
  Trash2,
  Lock,
  ChevronDown,
  User,
  Heart,
  ShieldAlert,
  Zap,
  Activity
} from "lucide-react";

interface MealPlanResultProps {
  result: any;
  onBack?: () => void;
  onDelete?: () => void;
  isSavedView?: boolean;
}

interface DailyNutrition {
  totalCalories: number;
  estimatedProtein: number;
  estimatedCarbs: number;
  estimatedFat: number;
  mealCount: number;
}

interface ParsedMeal {
  foodName: string;
  servingSize: number;
  calories: number;
  caloriesPerGram: string;
  rawString: string;
}

const MealPlanResult: React.FC<MealPlanResultProps> = ({ 
  result, 
  onBack, 
  onDelete,
  isSavedView = false 
}) => {
  const { user } = useAuth();
  
  // HUD Data from useMealReminders
  const { nextMeal, timeToNextMeal, dailyProgress, setDailyProgress } = useMealReminders(result);

  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [selectedDay, setSelectedDay] = useState("Day 1");
  const [showRawData, setShowRawData] = useState(false);
  const [checkedMeals, setCheckedMeals] = useState<Record<string, boolean>>({});
  const [savingProgress, setSavingProgress] = useState(false);
  const [trackingError, setTrackingError] = useState("");

  const selectedOption = useMemo(() => 
    result?.mealPlanOptions?.[selectedOptionIndex], 
    [result, selectedOptionIndex]
  );

  const allDays = useMemo(() => {
    if (!selectedOption?.weeklyPlan) return [];
    return Object.keys(selectedOption.weeklyPlan).sort((a, b) => {
      return parseInt(a.replace("Day ", "")) - parseInt(b.replace("Day ", ""));
    });
  }, [selectedOption]);

  const daysInWeek = useMemo(() => {
    const startIdx = (currentWeek - 1) * 7;
    return allDays.slice(startIdx, startIdx + 7);
  }, [allDays, currentWeek]);

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
    return dayData.meals.every((_: string, idx: number) => checkedMeals[`${dayName}-${idx}`]);
  }, [selectedOption, checkedMeals]);

  const isDayLocked = useCallback((dayName: string) => {
    const dayNum = parseInt(dayName.replace("Day ", ""));
    if (dayNum === 1) return false;
    const prevDayName = `Day ${dayNum - 1}`;
    return !checkDayCompletion(prevDayName);
  }, [checkDayCompletion]);

  const dailyNutrition = useMemo((): DailyNutrition => {
    if (!selectedDayData?.meals) {
      return { totalCalories: 0, estimatedProtein: 0, estimatedCarbs: 0, estimatedFat: 0, mealCount: 0 };
    }
    const parsedMeals = selectedDayData.meals.map(parseMealString);
    const totalCalories = parsedMeals.reduce((sum: number, meal: ParsedMeal) => sum + meal.calories, 0);
    return {
      totalCalories,
      estimatedProtein: Math.round((totalCalories * 0.25) / 4),
      estimatedCarbs: Math.round((totalCalories * 0.5) / 4),
      estimatedFat: Math.round((totalCalories * 0.25) / 9),
      mealCount: selectedDayData.meals.length,
    };
  }, [selectedDayData, parseMealString]);

  // Robust extraction of clinical data (handles both fresh and saved formats)
  const clinicalConditions = useMemo(() => {
    const raw = result.conditions || result.medicalConditions;
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object') {
      const filtered = Object.keys(raw).filter(k => k !== 'other' && (raw as any)[k]);
      if ((raw as any).other) filtered.push((raw as any).other);
      return filtered;
    }
    return [];
  }, [result.conditions, result.medicalConditions]);

  const dietaryStrategy = useMemo(() => {
    const raw = result.dietary_restrictions || result.dietaryRestrictions;
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object') {
      const filtered = Object.keys(raw).filter(k => k !== 'other' && (raw as any)[k]);
      if ((raw as any).other) filtered.push((raw as any).other);
      return filtered;
    }
    return [];
  }, [result.dietary_restrictions, result.dietaryRestrictions]);

  const nutrientDeficiencies = useMemo(() => {
    return result.vitamin_deficiencies || result.vitaminDeficiencies || [];
  }, [result.vitamin_deficiencies, result.vitaminDeficiencies]);

  // Effects
  useEffect(() => {
    const total = selectedDayData?.meals?.length || 1;
    const completed = Object.keys(checkedMeals).filter(k => k.startsWith(`${selectedDay}-`) && checkedMeals[k]).length;
    setDailyProgress((completed / total) * 100);
  }, [checkedMeals, selectedDay, selectedDayData, setDailyProgress]);

  useEffect(() => {
    console.log("MealPlanResult mounted with result data:", {
      hasDatabaseId: !!result.databaseId,
      databaseId: result.databaseId,
      allKeys: Object.keys(result),
      isSavedView
    });
  }, [result, isSavedView]);

  const handleExport = useCallback(() => {
    setIsExporting(true);
    setTimeout(() => {
      try {
        const dataStr = JSON.stringify({
          selectedPlan: selectedOption,
          selectedDay: selectedDay,
          selectedDayData: selectedDayData,
          patientInfo: result.basicProfile,
          clinicalData: {
            planDuration: result.plan_duration || "1 Month",
            bmi: result.bmi,
            bmiCategory: result.bmi_category,
          },
          timestamp: new Date().toISOString(),
        }, null, 2);
        const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
        const exportFileDefaultName = `meal-plan-${selectedOption?.name.replace(/\s+/g, "-").toLowerCase()}-${selectedDay}.json`;
        const linkElement = document.createElement("a");
        linkElement.setAttribute("href", dataUri);
        linkElement.setAttribute("download", exportFileDefaultName);
        linkElement.click();
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      } catch (error) {
        console.error('Export failed:', error);
      } finally {
        setIsExporting(false);
      }
    }, 500);
  }, [selectedOption, selectedDay, selectedDayData, result]);

  const handleSaveTracking = async () => {
    if (!user) {
      setTrackingError("You must be logged in to save progress.");
      return;
    }
    const planId = result.databaseId || (result as any).id || (selectedOption as any)?.databaseId || (selectedOption as any)?.id;
    if (!planId) {
      setTrackingError(`Tracking ID not found. Please regenerate.`);
      return;
    }
    setSavingProgress(true);
    setTrackingError("");
    try {
      const consumedMeals = selectedDayData?.meals?.filter((_: string, idx: number) => checkedMeals[`${selectedDay}-${idx}`]) || [];
      const response = await fetch("http://127.0.0.1:5000/api/meal-plans/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, planId: planId, day: selectedDay, consumedMeals: consumedMeals }),
      });
      if (!response.ok) throw new Error("Failed to save tracking progress");
      setTrackingError("");
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (err: any) {
      console.error("Tracking save failed:", err);
      setTrackingError(err.message || "An error occurred");
    } finally {
      setSavingProgress(false);
    }
  };

  if (!result || !result.mealPlanOptions || result.mealPlanOptions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Info className="w-10 h-10 text-yellow-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Outdated Meal Plan Format</h3>
          <button onClick={() => window.location.href = "/Pages/MealPlanProviders"} className="px-6 py-3 bg-indigo-600 text-white rounded-lg">Generate New Plan</button>
        </div>
      </div>
    );
  }

  if (!selectedOption || !selectedOption.weeklyPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Info className="w-10 h-10 text-yellow-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Invalid Plan Data</h3>
          <button onClick={() => window.location.href = "/Pages/MealPlanProviders"} className="px-6 py-3 bg-indigo-600 text-white rounded-lg">Generate New Plan</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* HUD DASHBOARD */}
      <div className="sticky top-[113px] sm:top-[73px] z-[40] bg-white border-b border-gray-100 shadow-sm px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Clock className="h-5 w-5" />
              </div>
              <div className="hidden sm:block">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Current Progress</p>
                <h4 className="text-sm font-bold text-gray-900">{selectedDay} Plan</h4>
              </div>
           </div>
           <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Daily Goal</p>
                <p className="text-sm font-bold text-teal-600">{selectedDayData?.total_calories || 0} kcal</p>
              </div>
              <div className="h-2 w-24 sm:w-48 bg-gray-100 rounded-full overflow-hidden">
                 <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${dailyProgress}%` }} />
              </div>
           </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-6 pb-10 sm:px-6 lg:px-8">
        {showSuccessMessage && (
          <div className="fixed top-24 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-slide-in z-50">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>Operation Successful!</span>
            </div>
          </div>
        )}

        <div className="mx-auto max-w-6xl space-y-6">
          {onBack && (
            <button onClick={onBack} className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">
              <ArrowLeft className="w-4 h-4" /> Back to Providers
            </button>
          )}

          {/* Header Card */}
          <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-gray-100">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-1">Meal Dashboard</p>
                  <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Your Personalized Plan</h1>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={handleExport} disabled={isExporting} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-sm border border-emerald-100 hover:bg-emerald-100 transition-all">
                    <Download className="w-4 h-4" /> Export JSON
                  </button>
                  <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-sm border border-indigo-100 hover:bg-indigo-100 transition-all">
                    <Printer className="w-4 h-4" /> Print
                  </button>
                </div>
             </div>
          </div>

          {/* Clinical & Health Profile Restoration */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
             {/* Patient Overview */}
             <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
                <div className="flex items-center gap-3 mb-6">
                   <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
                      <User className="w-5 h-5" />
                   </div>
                   <h3 className="text-lg font-black text-gray-900">Clinical Profile</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                   <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Sex & Age</p>
                      <p className="text-sm font-bold text-gray-900 capitalize">
                        {result.basicProfile?.gender || "N/A"} • {result.basicProfile?.age || "N/A"}y
                      </p>
                   </div>
                   <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Weight</p>
                      <p className="text-sm font-bold text-gray-900">{result.basicProfile?.weight || result.weight || "N/A"} kg</p>
                   </div>
                   <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">BMI Category</p>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          result.bmi_category === "Normal" ? "bg-emerald-500" :
                          result.bmi_category === "Underweight" ? "bg-blue-500" :
                          result.bmi_category === "Overweight" ? "bg-amber-500" : "bg-red-500"
                        }`} />
                        <p className="text-sm font-bold text-gray-900">{result.bmi_category || "N/A"}</p>
                      </div>
                   </div>
                   <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Activity</p>
                      <p className="text-sm font-bold text-gray-900 capitalize">{result.basicProfile?.activityLevel || "Moderate"}</p>
                   </div>
                </div>
                <div className="mt-6 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5 text-indigo-500" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Target Range</p>
                        <p className="text-sm font-bold text-indigo-900">{result.daily_calorie_range || "N/A"}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">BMI Score</p>
                      <p className="text-lg font-black text-indigo-600">{result.bmi || "N/A"}</p>
                   </div>
                </div>
             </div>

             {/* Health Assessment */}
             <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                   <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600">
                      <Heart className="w-5 h-5" />
                   </div>
                   <h3 className="text-lg font-black text-gray-900">Health Outlook</h3>
                </div>
                <div className="space-y-4">
                   <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Conditions & Risks</p>
                      <div className="flex flex-wrap gap-2">
                         {clinicalConditions.length > 0 ? (
                           clinicalConditions.map((c: string, i: number) => (
                             <span key={i} className="px-3 py-1 bg-rose-50 text-rose-700 rounded-lg text-xs font-bold border border-rose-100 capitalize">{c}</span>
                           ))
                         ) : (
                           <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-100">No Chronic Conditions</span>
                         )}
                      </div>
                   </div>
                   <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Dietary Strategy</p>
                      <div className="flex flex-wrap gap-2">
                         {dietaryStrategy.length > 0 ? (
                           dietaryStrategy.map((r: string, i: number) => (
                             <span key={i} className="px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold border border-amber-100 capitalize">{r}</span>
                           ))
                         ) : (
                           <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold border border-blue-100">Standard Nutrition</span>
                         )}
                      </div>
                   </div>
                   {nutrientDeficiencies.length > 0 && (
                     <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Nutrient Deficiencies</p>
                        <div className="flex flex-wrap gap-2">
                           {nutrientDeficiencies.map((v: any, i: number) => (
                             <span key={i} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-100">
                               {typeof v === 'string' ? v : `${v.name} (${v.level})`}
                             </span>
                           ))}
                        </div>
                     </div>
                   )}
                </div>
                <div className="mt-8 pt-4 border-t border-gray-50">
                   <div className="flex items-start gap-3">
                      <ShieldAlert className="w-4 h-4 text-amber-500 mt-0.5" />
                      <p className="text-[11px] font-bold text-gray-500 leading-relaxed">
                        {result.bmi_advice || "Follow the calibrated portion sizes to maintain stable glycemic and metabolic levels."}
                      </p>
                   </div>
                </div>
             </div>
          </div>

          {/* Horizontal Calendar Hook */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                    <Calendar className="w-6 h-6" />
                 </div>
                 <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Plan Schedule</h3>
                    <div className="mt-1">
                      <select 
                        className="text-sm font-bold text-indigo-600 bg-indigo-50 rounded-lg px-3 py-1 outline-none cursor-pointer"
                        value={currentWeek}
                        onChange={(e) => {
                          const w = parseInt(e.target.value);
                          setCurrentWeek(w);
                          setSelectedDay(`Day ${(w - 1) * 7 + 1}`);
                        }}
                      >
                        {Array.from({ length: Math.ceil(allDays.length / 7) }).map((_, i) => (
                          <option key={i} value={i + 1}>Week {i + 1} (Days {i * 7 + 1}-{Math.min((i + 1) * 7, allDays.length)})</option>
                        ))}
                      </select>
                    </div>
                 </div>
              </div>

              {/* HUD Timer in Calendar */}
              <div className="bg-indigo-600 px-6 py-4 rounded-2xl text-white shadow-xl flex items-center gap-6 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                 <div className="relative z-10 border-r border-white/20 pr-6">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-0.5">Next Meal In</p>
                    <p className="text-3xl font-black tabular-nums">{timeToNextMeal}</p>
                 </div>
                 <div className="hidden sm:flex gap-4 relative z-10">
                    {[{l:"B", t:"08:00"}, {l:"L", t:"13:00"}, {l:"D", t:"19:30"}].map((m, i) => (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">{m.l}</div>
                        <span className="text-[9px] opacity-60">{m.t}</span>
                      </div>
                    ))}
                 </div>
              </div>
            </div>

            {/* Horizontal Carousel */}
            <div className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
               {daysInWeek.map((day) => {
                  const isSelected = selectedDay === day;
                  const isLocked = isDayLocked(day);
                  const isDone = checkDayCompletion(day);
                  const dayNum = parseInt(day.replace("Day ", ""));

                  return (
                    <button
                      key={day}
                      disabled={isLocked}
                      onClick={() => setSelectedDay(day)}
                      className={`flex-shrink-0 min-w-[130px] p-5 rounded-3xl transition-all border snap-center group relative overflow-hidden ${
                        isSelected ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl scale-105 z-10' :
                        isLocked ? 'bg-gray-50 border-gray-100 text-gray-400 opacity-60 grayscale cursor-not-allowed' :
                        'bg-white border-gray-100 text-gray-600 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-3">
                         <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg font-black ${isSelected ? 'bg-white/20' : 'bg-indigo-50 text-indigo-600'}`}>
                           {isLocked ? <Lock className="w-5 h-5" /> : dayNum}
                         </div>
                         <div className="text-center">
                           <span className="text-sm font-black uppercase tracking-tight block">{day}</span>
                           <span className={`text-[10px] font-bold ${isSelected ? 'text-indigo-200' : isDone ? 'text-emerald-600' : 'text-gray-400'}`}>
                             {isDone ? "Completed" : `${selectedOption.weeklyPlan[day].total_calories} kcal`}
                           </span>
                         </div>
                      </div>
                    </button>
                  );
               })}
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-6 animate-slide-up">
             {/* Nutrition */}
             <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                  <Info className="w-5 h-5 text-indigo-500" /> Daily Breakdown
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                   {[
                     { label: "Calories", val: dailyNutrition.totalCalories, unit: "kcal", color: "bg-blue-500", icon: "🔥" },
                     { label: "Protein", val: dailyNutrition.estimatedProtein, unit: "g", color: "bg-red-500", icon: "🥩" },
                     { label: "Carbs", val: dailyNutrition.estimatedCarbs, unit: "g", color: "bg-amber-500", icon: "🍞" },
                     { label: "Fats", val: dailyNutrition.estimatedFat, unit: "g", color: "bg-emerald-500", icon: "🥑" }
                   ].map((item, i) => (
                     <div key={i} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 group hover:bg-white hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-2">
                           <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{item.label}</span>
                           <span className="text-sm">{item.icon}</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                           <span className="text-2xl font-black text-gray-900">{item.val}</span>
                           <span className="text-xs font-bold text-gray-400">{item.unit}</span>
                        </div>
                        <div className="mt-3 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                           <div className={`h-full ${item.color}`} style={{ width: '40%' }}></div>
                        </div>
                     </div>
                   ))}
                </div>
             </div>

             {/* Meals */}
             <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100">
                   <div>
                      <h3 className="text-xl font-black text-gray-900">{selectedDay} Menu</h3>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{dailyNutrition.mealCount} Curated Selections</p>
                   </div>
                   <button onClick={() => setShowRawData(!showRawData)} className="p-2 bg-gray-50 rounded-xl text-gray-600 hover:bg-gray-100">
                      <Settings className="w-5 h-5" />
                   </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {selectedDayData?.meals.map((meal: string, idx: number) => {
                      const p = parseMealString(meal);
                      const key = `${selectedDay}-${idx}`;
                      return (
                        <div key={idx} className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${checkedMeals[key] ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-100'}`}>
                           <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex flex-shrink-0 items-center justify-center font-black ${checkedMeals[key] ? 'bg-indigo-600 text-white' : 'bg-white text-gray-400 shadow-sm'}`}>
                                {idx + 1}
                              </div>
                              <div>
                                 <h4 className={`font-bold text-sm ${checkedMeals[key] ? 'text-indigo-900' : 'text-gray-900'}`}>{p.foodName}</h4>
                                 <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tight">{p.servingSize}g • {p.calories} kcal</p>
                              </div>
                           </div>
                           <input 
                             type="checkbox" 
                             checked={checkedMeals[key] || false}
                             onChange={(e) => setCheckedMeals(prev => ({ ...prev, [key]: e.target.checked }))}
                             className="w-6 h-6 rounded-lg text-indigo-600 border-gray-300 focus:ring-indigo-500"
                           />
                        </div>
                      );
                   })}
                </div>

                <div className="mt-8 pt-8 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                   <div className="flex-1">
                      {trackingError && <p className="text-xs font-bold text-red-500 mb-1 animate-pulse">⚠️ {trackingError}</p>}
                      {showSuccessMessage && <p className="text-xs font-bold text-emerald-600 mb-1">✅ Progress stored!</p>}
                   </div>
                   <button 
                     onClick={handleSaveTracking} 
                     disabled={savingProgress}
                     className={`w-full sm:w-auto px-8 py-4 rounded-2xl font-black text-white shadow-xl transition-all transform active:scale-95 ${savingProgress ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700 hover:-translate-y-1 hover:shadow-indigo-200'}`}
                   >
                     {savingProgress ? "Processing..." : "Save Progress"}
                   </button>
                </div>
             </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
        @keyframes slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.5s ease-out; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default MealPlanResult;