"use client";

import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";

const EmotionForm = () => {
  const webcamRef = useRef<Webcam | null>(null);

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [detectedEmotion, setDetectedEmotion] = useState("");

  // Capture webcam image every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!webcamRef.current) return;

      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc || !name || !age) return;

      try {
        const res = await fetch("http://localhost:5000/detect_emotion", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            age,
            image: imageSrc,
          }),
        });

        const data = await res.json();
        setDetectedEmotion(data.emotion);
        console.log("Detected emotion:", data.emotion);
      } catch (error) {
        console.error("Emotion detection failed:", error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [name, age]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(
      `Form submitted!\nName: ${name}\nAge: ${age}\nLast detected emotion: ${detectedEmotion}`
    );
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Patient Details</h2>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Name: </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Age: </label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            required
          />
        </div>

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
        <p>
          <strong>Last Detected Emotion:</strong> {detectedEmotion}
        </p>
      )}
    </div>
  );
};

export default EmotionForm;
