"use client";

import React, { useState } from "react";

interface MealPlanOption {
  name: string;
  optionId: number;
  weeklyPlan: {
    [day: string]: {
      meals: string[];
      total_calories: number;
    };
  };
}

interface MealPlanResultProps {
  result: {
    bmi: number;
    bmi_advice: string;
    bmi_category: string;
    conditions: string[];
    daily_calorie_range: string;
    mealPlanOptions: MealPlanOption[];
    basicProfile?: {
      name: string;
      age: string;
      gender: string;
    };
    databaseId?: string;
    formDataSaved?: boolean;
  };
}

const MealPlanResult: React.FC<MealPlanResultProps> = ({ result }) => {
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);
  const [selectedDay, setSelectedDay] = useState<string>("Day 1");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [showRawData, setShowRawData] = useState(false);

  if (
    !result ||
    !result.mealPlanOptions ||
    result.mealPlanOptions.length === 0
  ) {
    return (
      <div className="text-center py-8 bg-yellow-50 rounded-lg">
        <p className="text-yellow-700">No meal plan options available</p>
      </div>
    );
  }

  const selectedOption = result.mealPlanOptions[selectedOptionIndex];
  const days = Object.keys(selectedOption.weeklyPlan);
  const selectedDayData = selectedOption.weeklyPlan[selectedDay];

  const saveSelectedPlanToDB = async () => {
    setSaving(true);
    setSaveMessage("");

    try {
      const payload = {
        selectedPlan: {
          ...selectedOption,
          name: selectedOption.name, // Ensure this is included
          patientName: result.basicProfile?.name || "Unknown Patient",
          patientAge: result.basicProfile?.age || "N/A",
          patientGender: result.basicProfile?.gender || "N/A",
          bmi: result.bmi,
          bmiCategory: result.bmi_category,
          bmiAdvice: result.bmi_advice,
          dailyCalorieRange: result.daily_calorie_range,
          selectedDay: selectedDay,
          selectedDayData: selectedDayData,
          totalCalories: selectedDayData.total_calories,
          numberOfMeals: selectedDayData.meals.length,
          timestamp: new Date().toISOString(),
        },
        originalPlanId: result.databaseId || "unknown",
        formDataSaved: result.formDataSaved || false,
      };

      // Save to Firebase
      const response = await fetch(
        "http://127.0.0.1:5000/api/meal-plans/save",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (data.success) {
        // ALSO SAVE TO LOCALSTORAGE
        const localStoragePlan = {
          id: Date.now().toString(),
          selectedPlan: payload.selectedPlan, // Use the same structure
          createdAt: new Date().toISOString(),
          planName: payload.selectedPlan.name,
          patientName: payload.selectedPlan.patientName,
          bmi: payload.selectedPlan.bmi,
        };

        try {
          const existingPlans = JSON.parse(
            localStorage.getItem("savedMealPlans") || "[]"
          );
          const updatedPlans = [localStoragePlan, ...existingPlans.slice(0, 9)];
          localStorage.setItem("savedMealPlans", JSON.stringify(updatedPlans));
        } catch (localStorageError) {
          console.error("Error saving to localStorage:", localStorageError);
        }

        const docId = data.data?.id || "unknown";
        setSaveMessage(`✅ Plan saved successfully! Document ID: ${docId}`);

        // Clear message after 8 seconds
        setTimeout(() => setSaveMessage(""), 8000);
      } else {
        setSaveMessage(`❌ Error: ${data.error || "Failed to save plan"}`);
      }
    } catch (error) {
      console.error("Save error:", error);
      setSaveMessage("❌ Network error: Could not connect to server");
    } finally {
      setSaving(false);
    }
  };

  const parseMealString = (meal: string) => {
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
  };

  const calculateDailyNutrition = () => {
    const meals = selectedDayData.meals.map(parseMealString);
    const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);

    const estimatedProtein = Math.round((totalCalories * 0.25) / 4);
    const estimatedCarbs = Math.round((totalCalories * 0.5) / 4);
    const estimatedFat = Math.round((totalCalories * 0.25) / 9);

    return {
      totalCalories,
      estimatedProtein,
      estimatedCarbs,
      estimatedFat,
      mealCount: meals.length,
    };
  };

  const dailyNutrition = calculateDailyNutrition();

  return (
    <div className="space-y-8">
      {/* Save Status Message */}
      {saveMessage && (
        <div
          className={`p-4 rounded-lg ${
            saveMessage.includes("✅")
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {saveMessage.includes("✅") ? (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              <span>{saveMessage}</span>
            </div>
            <button
              onClick={() => setSaveMessage("")}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Health Assessment */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl shadow-xl p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Health Assessment</h2>
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <p className="text-sm opacity-90">BMI</p>
                <p className="text-3xl font-bold">{result.bmi}</p>
                <p className="text-sm">({result.bmi_category})</p>
              </div>
              <div>
                <p className="text-sm opacity-90">Daily Calories</p>
                <p className="text-3xl font-bold">
                  {result.daily_calorie_range}
                </p>
              </div>
              {result.databaseId && (
                <div className="bg-white/20 p-3 rounded">
                  <p className="text-xs opacity-90">Database ID</p>
                  <p className="text-sm font-mono truncate max-w-[200px]">
                    {result.databaseId}
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="bg-white/20 p-4 rounded-lg min-w-[300px]">
            <p className="font-semibold">Health Advice:</p>
            <p className="text-sm mt-1">{result.bmi_advice}</p>
          </div>
        </div>
      </div>

      {/* Plan Selection */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">Select Meal Plan</h3>
          <span className="text-sm text-gray-500">
            {result.mealPlanOptions.length} options available
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {result.mealPlanOptions.map((option, index) => (
            <button
              key={option.optionId}
              onClick={() => {
                setSelectedOptionIndex(index);
                setSelectedDay("Day 1");
                setSaveMessage("");
              }}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedOptionIndex === index
                  ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                  : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-gray-800">{option.name}</h4>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      {Object.keys(option.weeklyPlan).length} days
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      Option {option.optionId}
                    </span>
                  </div>
                </div>
                {selectedOptionIndex === index && (
                  <svg
                    className="w-5 h-5 text-blue-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Day Selection & Nutrition */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Select Day</h3>
          <div className="flex flex-wrap gap-2">
            {days.map((day) => {
              const dayData = selectedOption.weeklyPlan[day];
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                    selectedDay === day
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <span>{day}</span>
                  <span className="text-xs opacity-75">
                    {dayData.total_calories} kcal
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4">Daily Nutrition</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>Total Calories</span>
              <span className="text-2xl font-bold">
                {dailyNutrition.totalCalories}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Protein</span>
              <span className="font-bold">
                {dailyNutrition.estimatedProtein}g
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Carbohydrates</span>
              <span className="font-bold">
                {dailyNutrition.estimatedCarbs}g
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Fat</span>
              <span className="font-bold">{dailyNutrition.estimatedFat}g</span>
            </div>
            <div className="pt-3 border-t border-white/20">
              <div className="flex justify-between items-center">
                <span>Meals</span>
                <span className="font-bold">{dailyNutrition.mealCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Day's Meals */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800">
              {selectedOption.name} - {selectedDay}
            </h3>
            <p className="text-gray-600">
              {selectedDayData.meals.length} meals •{" "}
              {selectedDayData.total_calories} total calories
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRawData(!showRawData)}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              {showRawData ? "Hide Raw Data" : "Show Raw Data"}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {selectedDayData.meals.map((meal, index) => {
            const parsedMeal = parseMealString(meal);

            return (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition hover:shadow-sm"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <h4 className="font-semibold text-gray-800 text-lg">
                          {parsedMeal.foodName}
                        </h4>
                        {parsedMeal.servingSize > 0 && (
                          <p className="text-sm text-gray-600 mt-1">
                            Serving: {parsedMeal.servingSize}g
                          </p>
                        )}
                      </div>
                    </div>

                    {showRawData && (
                      <div className="mt-3 p-3 bg-gray-50 rounded">
                        <p className="text-xs font-mono text-gray-600">
                          {parsedMeal.rawString}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-bold text-lg">
                        {parsedMeal.calories || "N/A"} kcal
                      </span>
                    </div>

                    {parsedMeal.servingSize > 0 && parsedMeal.calories > 0 && (
                      <div className="text-xs text-gray-500">
                        {parsedMeal.caloriesPerGram} kcal/g
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekly Overview */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Weekly Overview
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {days.map((day) => {
            const dayData = selectedOption.weeklyPlan[day];
            const isSelected = selectedDay === day;
            const mealsCount = dayData.meals.length;

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`p-3 rounded-lg border transition flex flex-col items-center ${
                  isSelected
                    ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                    : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                }`}
              >
                <p className="font-medium text-gray-800 text-sm">{day}</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {dayData.total_calories}
                </p>
                <p className="text-xs text-gray-500 mt-1">kcal</p>
                <div className="mt-2 flex items-center gap-1">
                  <svg
                    className="w-3 h-3 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path
                      fillRule="evenodd"
                      d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-xs text-gray-500">
                    {mealsCount} meals
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Save Plan Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-800">
              Save Selected Plan
            </h3>
            <p className="text-gray-600 mt-1">
              Save your selected meal plan to the database for future reference
            </p>
            {result.formDataSaved !== undefined && (
              <div
                className={`inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full text-sm ${
                  result.formDataSaved
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {result.formDataSaved ? (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Form data saved to database</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Form data not saved to database</span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={saveSelectedPlanToDB}
              disabled={saving}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                    />
                  </svg>
                  Save Selected Plan
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Export Options</h3>
            <p className="text-gray-600">
              Export your selected plan for offline reference
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                const dataStr = JSON.stringify(
                  {
                    selectedPlan: selectedOption,
                    selectedDay: selectedDay,
                    selectedDayData: selectedDayData,
                    patientInfo: result.basicProfile,
                    bmiInfo: {
                      bmi: result.bmi,
                      category: result.bmi_category,
                      advice: result.bmi_advice,
                    },
                    timestamp: new Date().toISOString(),
                  },
                  null,
                  2
                );
                const dataUri =
                  "data:application/json;charset=utf-8," +
                  encodeURIComponent(dataStr);
                const exportFileDefaultName = `meal-plan-${selectedOption.name
                  .replace(/\s+/g, "-")
                  .toLowerCase()}-${selectedDay}.json`;

                const linkElement = document.createElement("a");
                linkElement.setAttribute("href", dataUri);
                linkElement.setAttribute("download", exportFileDefaultName);
                linkElement.click();
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Export as JSON
            </button>

            <button
              onClick={() => window.print()}
              className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
              Print Plan
            </button>
          </div>
        </div>
      </div>

      {/* Status Information */}
      <div className="bg-gray-50 rounded-xl shadow p-4">
        <div className="space-y-3">
          <h4 className="font-bold text-gray-700">Current Status</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded">
              <h5 className="font-medium text-gray-700 mb-2">
                Database Status
              </h5>
              <p className="text-sm text-gray-600">
                Form Data Saved: {result.formDataSaved ? "✅ Yes" : "⚠️ No"}
              </p>
              {result.databaseId && (
                <p className="text-sm text-gray-600 mt-1">
                  Database ID:{" "}
                  <code className="bg-gray-100 px-1 rounded text-xs">
                    {result.databaseId}
                  </code>
                </p>
              )}
              <p className="text-sm text-gray-600 mt-1">
                Last Saved Plan ID:{" "}
                {sessionStorage.getItem("lastSavedPlanId") || "None"}
              </p>
            </div>

            <div className="bg-white p-4 rounded">
              <h5 className="font-medium text-gray-700 mb-2">
                Current Selection
              </h5>
              <p className="text-sm text-gray-600">
                Plan: {selectedOption.name} (Option {selectedOption.optionId})
              </p>
              <p className="text-sm text-gray-600">
                Day: {selectedDay} • {selectedDayData.meals.length} meals
              </p>
              <p className="text-sm text-gray-600">
                Total Calories: {selectedDayData.total_calories}
              </p>
              <p className="text-sm text-gray-600">
                Daily Target: {result.daily_calorie_range}
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded">
            <h5 className="font-medium text-gray-700 mb-2">
              Health Information
            </h5>
            <p className="text-sm text-gray-600">
              BMI: {result.bmi} ({result.bmi_category})
            </p>
            <p className="text-sm text-gray-600">Advice: {result.bmi_advice}</p>
            {result.conditions && result.conditions.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium text-gray-700">Conditions:</p>
                <ul className="text-sm text-gray-600 list-disc pl-5">
                  {result.conditions.map((condition, index) => (
                    <li key={index}>{condition}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealPlanResult;
