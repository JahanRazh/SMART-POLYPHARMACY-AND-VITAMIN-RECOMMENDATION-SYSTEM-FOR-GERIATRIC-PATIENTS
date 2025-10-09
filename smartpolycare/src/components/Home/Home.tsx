"use client";

import React, { useEffect, useState } from "react";

function Index() {
  const [message, setMessage] = useState("Loading");

  useEffect(() => {
    // Example: fetch data from Flask backend
    fetch("http://127.0.0.1:5000/api/home")
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch(() => setMessage("Error fetching data"));
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "40px" }}>
      <h1>Home</h1>
      <h1>{message}</h1>
    </div>
  );
}

export default Index;

