import React from "react";

interface Props {
  result: any;
}

const MealPlanResult: React.FC<Props> = ({ result }) => {
  const savePlan = async (plan: any) => {
    await fetch("http://127.0.0.1:5000/api/meal-plans/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(plan),
    });

    alert("✅ Meal plan saved successfully");
  };

  return (
    <div className="mt-10 space-y-6">
      <h2 className="text-3xl font-bold text-center text-gray-800">
        Select Your Meal Plan
      </h2>

      {result.mealPlanOptions.map((opt: any) => (
        <div
          key={opt.optionId}
          className="border rounded-xl p-5 shadow bg-white"
        >
          <h3 className="text-xl font-semibold mb-3">
            Meal Plan Option {opt.optionId}
          </h3>

          {Object.entries(opt.weeklyPlan).map(([day, info]: any) => (
            <div key={day} className="mb-3">
              <h4 className="font-semibold text-gray-700">{day}</h4>
              <ul className="list-disc ml-6 text-gray-600">
                {info.meals.map((meal: string, idx: number) => (
                  <li key={idx}>{meal}</li>
                ))}
              </ul>
              <p className="text-sm text-gray-500">
                Calories: {info.total_calories}
              </p>
            </div>
          ))}

          <button
            onClick={() => savePlan(opt)}
            className="mt-4 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg"
          >
            Select This Meal Plan
          </button>
        </div>
      ))}
    </div>
  );
};

export default MealPlanResult;
