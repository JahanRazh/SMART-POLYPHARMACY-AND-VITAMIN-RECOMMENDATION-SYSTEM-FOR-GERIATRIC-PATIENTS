"use client";

import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";

const PatientAssessmentForm = () => {
  const webcamRef = useRef<Webcam | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    exercise_time: "",
    sleep_duration: "",
    physical_activity: "",
    screen_time: "",
    work_hours: "",
    social_interaction_duration: "",
    gender: "Male",
    occupation: "",
    smoking_habit: "No",
    alcohol_intake: "No",
    meditation_practice: "No",
  });

  const [detectedEmotion, setDetectedEmotion] = useState("");
  const [mentalHealthLevel, setMentalHealthLevel] = useState("");

  // Capture webcam image every 5 seconds for emotion
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!webcamRef.current) return;

      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc || !formData.name || !formData.age) return;

      try {
        const res = await fetch("http://127.0.0.1:5000/detect_emotion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            age: Number(formData.age),
            image: imageSrc,
          }),
        });

        const data = await res.json();
        setDetectedEmotion(data.emotion);
      } catch (error) {
        console.error("Emotion detection failed:", error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [formData.name, formData.age]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Send mental health data to backend
      const res = await fetch("http://127.0.0.1:5000/full_assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          age: Number(formData.age),
          exercise_time: Number(formData.exercise_time),
          sleep_duration: Number(formData.sleep_duration),
          physical_activity: Number(formData.physical_activity),
          screen_time: Number(formData.screen_time),
          work_hours: Number(formData.work_hours),
          social_interaction_duration: Number(formData.social_interaction_duration),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMentalHealthLevel(data.mental_health_level);

        // Now save everything (including occupation, emotion, etc.) in Firebase
        await fetch("/api/save_patient_data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            detectedEmotion,
            mentalHealthLevel: data.mental_health_level,
          }),
        });

        alert("Patient data saved successfully!");
      } else {
        alert("Error predicting mental health: " + data.error);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to submit data");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Patient Assessment</h2>
      <form onSubmit={handleSubmit}>
        {Object.keys(formData).map((key) => (
          <div key={key} style={{ marginBottom: "10px" }}>
            <label style={{ marginRight: "10px" }}>{key.replace("_", " ")}:</label>
            {["gender", "smoking_habit", "alcohol_intake", "meditation_practice"].includes(key) ? (
              <select name={key} value={(formData as any)[key]} onChange={handleChange}>
                {key === "gender" && (
                  <>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </>
                )}
                {key === "smoking_habit" && (
                  <>
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </>
                )}
                {key === "alcohol_intake" && (
                  <>
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </>
                )}
                {key === "meditation_practice" && (
                  <>
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </>
                )}
              </select>
            ) : (
              <input
                type={["age","exercise_time","sleep_duration","physical_activity","screen_time","work_hours","social_interaction_duration"].includes(key) ? "number" : "text"}
                name={key}
                value={(formData as any)[key]}
                onChange={handleChange}
                required
              />
            )}
          </div>
        ))}

        <button type="submit">Submit</button>
      </form>

      <h3>Webcam Preview</h3>
      <Webcam
        ref={webcamRef}
        audio={false}
        screenshotFormat="image/jpeg"
        width={320}
        height={240}
        videoConstraints={{ facingMode: "user" }}
      />

      {detectedEmotion && (
        <p><strong>Last Detected Emotion:</strong> {detectedEmotion}</p>
      )}

      {mentalHealthLevel && (
        <p><strong>Mental Health Level:</strong> {mentalHealthLevel}</p>
      )}
    </div>
  );
};

export default PatientAssessmentForm;
