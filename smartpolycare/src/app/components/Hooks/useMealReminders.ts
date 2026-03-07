import { useEffect, useRef, useState } from "react";
import { useNotifications } from "../Contexts/NotificationContext";

interface MealPlan {
  databaseId?: string;
  mealPlanOptions: Array<{
    weeklyPlan: {
      [day: string]: {
        meals: string[];
        total_calories: number;
      };
    };
  }>;
}

export const useMealReminders = (mealPlan: MealPlan | null) => {
  const { addNotification } = useNotifications();
  const notifiedRef = useRef<Set<string>>(new Set());
  
  const [nextMeal, setNextMeal] = useState<string | null>(null);
  const [timeToNextMeal, setTimeToNextMeal] = useState<string>("00:00:00");
  const [dailyProgress, setDailyProgress] = useState<number>(0);

  useEffect(() => {
    // If no meal plan, just return default values
    const updateTimer = () => {
      const now = new Date();
      const mealtimes = [
        { label: "Breakfast", h: 8, m: 0 },
        { label: "Lunch", h: 13, m: 0 },
        { label: "Dinner", h: 19, m: 30 }
      ];

      let nextTarget = null;
      let targetLabel = "";
      
      for (const time of mealtimes) {
        const target = new Date();
        target.setHours(time.h, time.m, 0, 0);
        if (now < target) {
          nextTarget = target;
          targetLabel = time.label;
          break;
        }
      }

      if (!nextTarget) {
        nextTarget = new Date();
        nextTarget.setDate(now.getDate() + 1);
        nextTarget.setHours(8, 0, 0, 0);
        targetLabel = "Breakfast";
      }

      const diff = nextTarget.getTime() - now.getTime();
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setNextMeal(targetLabel);
      setTimeToNextMeal(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
    };

    const checkReminders = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      // Breakfast: 8:00 AM
      if (currentHour === 8 && currentMinute === 0) {
        const key = `breakfast-${now.toDateString()}`;
        if (!notifiedRef.current.has(key)) {
          addNotification({
            title: "Breakfast Time",
            message: "Time for your morning nutrition! Check your plan for a healthy start.",
            type: "info"
          });
          notifiedRef.current.add(key);
        }
      }

      // Lunch: 13:00 (1:00 PM)
      if (currentHour === 13 && currentMinute === 0) {
        const key = `lunch-${now.toDateString()}`;
        if (!notifiedRef.current.has(key)) {
          addNotification({ title: "Lunch Reminder", message: "It's midday! Have you had your scheduled lunch yet?", type: "info" });
          notifiedRef.current.add(key);
        }
      }
      
      // Dinner: 19:30 (7:30 PM)
      if (currentHour === 19 && currentMinute === 30) {
        const key = `dinner-${now.toDateString()}`;
        if (!notifiedRef.current.has(key)) {
          addNotification({ title: "Dinner Time", message: "Time for your evening meal. Staying consistent is key!", type: "info" });
          notifiedRef.current.add(key);
        }
      }
    };

    const timerInterval = setInterval(updateTimer, 1000);
    const reminderInterval = setInterval(checkReminders, 60000);
    
    updateTimer();
    checkReminders();

    return () => {
      clearInterval(timerInterval);
      clearInterval(reminderInterval);
    };
  }, [addNotification]);

  return { nextMeal, timeToNextMeal, dailyProgress, setDailyProgress };
};
