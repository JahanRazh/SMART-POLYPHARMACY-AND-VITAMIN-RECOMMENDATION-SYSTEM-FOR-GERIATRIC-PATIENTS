"use client";
import { useState } from "react";
import Link from "next/link";

/* ================= TYPES ================= */

type Medicine = {
  name: string;
  dosage: string;
  duration: number | "";
  durationUnit: "months" | "years";
  image: File | null;
};

type Symptom = {
  emoji: string;
  label: string;
};

/* ================= SYMPTOMS ================= */

const symptomList: Symptom[] = [
  { emoji: "😴", label: "Fatigue" },
  { emoji: "🤕", label: "Headache" },
  { emoji: "🖐️", label: "Tingling / Numbness" },
  { emoji: "💇‍♀️", label: "Hair Loss" },
  { emoji: "😵‍💫", label: "Dizziness" },
  { emoji: "🦵", label: "Weakness" },
  { emoji: "🤢", label: "Nausea" },
];

export default function AddPatientPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [error, setError] = useState("");

  /* ================= MEDICINES ================= */

  const addMedicine = () => {
    setMedicines([
      ...medicines,
      {
        name: "",
        dosage: "",
        duration: "",
        durationUnit: "months",
        image: null,
      },
    ]);
  };

  const updateMedicine = (
    index: number,
    field: keyof Medicine,
    value: any
  ) => {
    const updated = [...medicines];
    updated[index] = { ...updated[index], [field]: value };
    setMedicines(updated);
  };

  /* ================= SYMPTOMS ================= */

  const addSymptom = (symptom: Symptom) => {
    if (symptoms.some((s) => s.label === symptom.label)) return;
    setSymptoms([...symptoms, symptom]);
  };

  const removeSymptom = (label: string) => {
    setSymptoms(symptoms.filter((s) => s.label !== label));
  };

  /* ================= SUBMIT ================= */

  const handleSubmit = async () => {
    if (medicines.length < 2) {
      setError("⚠️ At least 5 medicines are required (polypharmacy)");
      return;
    }

    setError("");

    const formData = new FormData();
    formData.append("medicines", JSON.stringify(medicines));
    formData.append("symptoms", JSON.stringify(symptoms));

    medicines.forEach((m, i) => {
      if (m.image) {
        formData.append(`image_${i}`, m.image);
      }
    });

    await fetch("http://localhost:5000/submit-patient", {
      method: "POST",
      body: formData,
    });

    alert("✅ Patient data submitted");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* ================= TOP BAR ================= */}
      <header className="flex justify-between items-center p-4">
        <h1 className="text-xl font-bold text-cyan-400">
          Polypharmacy System
        </h1>
        <div className="flex gap-3">
          <Link href="/" className="px-4 py-2 bg-slate-700 rounded-lg">
            🏠 Home
          </Link>
          <Link href="/about" className="px-4 py-2 bg-slate-700 rounded-lg">
            ℹ️ About
          </Link>
        </div>
      </header>

      {/* ================= SPLIT PAGE ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4 max-w-6xl mx-auto">
        {/* ================= LEFT: MEDICINES ================= */}
        <section className="bg-slate-800/80 backdrop-blur-xl shadow-xl rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-cyan-300">
            💊 Medicines ({medicines.length}/5)
          </h2>

          {medicines.map((m, i) => (
            <div
              key={i}
              className="bg-slate-700/50 border border-slate-600/40 rounded-xl p-4 space-y-3"
            >
              <input
                className="w-full bg-slate-800 p-2 rounded"
                placeholder="Medicine name"
                onChange={(e) =>
                  updateMedicine(i, "name", e.target.value)
                }
              />

              <input
                className="w-full bg-slate-800 p-2 rounded"
                placeholder="Dosage (e.g. 500mg BD)"
                onChange={(e) =>
                  updateMedicine(i, "dosage", e.target.value)
                }
              />

              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  className="w-full bg-slate-800 p-2 rounded"
                  placeholder="Duration"
                  onChange={(e) =>
                    updateMedicine(
                      i,
                      "duration",
                      Math.max(1, Number(e.target.value))
                    )
                  }
                />
                <select
                  className="w-full bg-slate-800 p-2 rounded"
                  onChange={(e) =>
                    updateMedicine(i, "durationUnit", e.target.value)
                  }
                >
                  <option value="months">Months</option>
                  <option value="years">Years</option>
                </select>
              </div>

              {/* IMAGE UPLOAD */}
              <div className="border border-dashed border-cyan-400 rounded-lg p-3 text-sm">
                <label className="block text-cyan-300 mb-1">
                  📸 Medicine image (optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    updateMedicine(
                      i,
                      "image",
                      e.target.files?.[0] || null
                    )
                  }
                />
                {m.image && (
                  <p className="text-green-400 mt-1">
                    ✅ Image selected
                  </p>
                )}
              </div>
            </div>
          ))}

          <button
            onClick={addMedicine}
            className="w-full border border-cyan-400 text-cyan-300 py-2 rounded-xl"
          >
            ➕ Add Medicine
          </button>

          {error && (
            <div className="bg-red-900/60 text-red-300 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}
        </section>

        {/* ================= RIGHT: SYMPTOMS ================= */}
        <section className="bg-slate-800/80 backdrop-blur-xl shadow-xl rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-cyan-300">
            😷 Symptoms
          </h2>

          {/* EMOJI PICKER */}
          <div className="flex flex-wrap gap-3">
            {symptomList.map((s) => (
              <button
                key={s.label}
                onClick={() => addSymptom(s)}
                className="text-2xl hover:scale-110 transition"
                title={s.label}
              >
                {s.emoji}
              </button>
            ))}
          </div>

          {/* SELECTED SYMPTOMS */}
          <div className="bg-slate-700/60 rounded-xl p-3 flex flex-wrap gap-2 min-h-[80px]">
            {symptoms.length === 0 && (
              <span className="text-slate-400 text-sm">
                Select symptoms using emojis above
              </span>
            )}

            {symptoms.map((s) => (
              <span
                key={s.label}
                className="bg-cyan-500 text-black px-3 py-1 rounded-full text-sm flex items-center gap-2"
              >
                {s.emoji} {s.label}
                <button
                  onClick={() => removeSymptom(s.label)}
                  className="font-bold"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </section>
      </div>

      {/* ================= SUBMIT ================= */}
      <div className="max-w-3xl mx-auto p-6">
        <button
          onClick={handleSubmit}
          className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold py-3 rounded-xl"
        >
          Submit Patient Data
        </button>
      </div>
    </main>
  );
}
