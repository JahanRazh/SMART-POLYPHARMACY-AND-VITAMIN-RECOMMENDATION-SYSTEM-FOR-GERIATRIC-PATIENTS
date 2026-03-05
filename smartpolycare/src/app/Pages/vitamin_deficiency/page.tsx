"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/app/components/Contexts/AuthContext";

/* ================= TYPES ================= */

type VitaminResult = {
  vitamin: string;
  name: string;
  description: string;
  foods: string[];
  icon: string;
  contributing_pairs: string[];
};

type PairDetail = {
  drug1: string;
  drug2: string;
  vitamins: string[];
};

type PredictionResponse = {
  predictions: VitaminResult[];
  drugs: string[];
  symptoms: string[];
  predicted_vitamins: string[];
  pair_details: PairDetail[];
  total_pairs_analyzed: number;
};

/* ================= API BASE ================= */
const API = "http://localhost:5000/api/vitamin-deficiency";

/* ================= COMPONENT ================= */

export default function VitaminDeficiencyPage() {
  const { user } = useAuth();
  /* ---- state ---- */
  const [drugs, setDrugs] = useState<string[]>(["", "", "", "", ""]);
  const [drugSuggestions, setDrugSuggestions] = useState<Record<number, string[]>>({});
  const [activeDrugDrop, setActiveDrugDrop] = useState<number | null>(null);

  const [allSymptoms, setAllSymptoms] = useState<string[]>([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [symptomSearch, setSymptomSearch] = useState("");

  const [results, setResults] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const drugsContainerRef = useRef<HTMLDivElement>(null);

  /* ---- load symptoms on mount ---- */
  useEffect(() => {
    fetch(`${API}/symptoms`)
      .then((r) => r.json())
      .then((d) => setAllSymptoms(d.items || []))
      .catch(() => { });
  }, []);

  /* ---- fetch saved assessment ---- */
  useEffect(() => {
    if (!user) return;
    fetch(`${API}/assessment?userId=${user.uid}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data && data.inputDrugs) {
          setDrugs(data.inputDrugs);
          setSelectedSymptoms(data.inputSymptoms || []);
        }
      })
      .catch(() => { });
  }, [user]);

  /* ---- close dropdowns on outside click ---- */
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (
        drugsContainerRef.current &&
        !drugsContainerRef.current.contains(e.target as Node)
      ) {
        setActiveDrugDrop(null);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  /* ---- drug autocomplete ---- */
  const searchDrugs = useCallback(
    async (query: string, index: number) => {
      if (query.length < 1) {
        setDrugSuggestions((prev) => ({ ...prev, [index]: [] }));
        return;
      }
      try {
        const res = await fetch(
          `${API}/drugs?q=${encodeURIComponent(query)}&limit=10`
        );
        const data = await res.json();
        setDrugSuggestions((prev) => ({ ...prev, [index]: data.items || [] }));
      } catch {
        setDrugSuggestions((prev) => ({ ...prev, [index]: [] }));
      }
    },
    []
  );

  /* ---- drug list management ---- */
  const updateDrug = (index: number, value: string) => {
    const updated = [...drugs];
    updated[index] = value;
    setDrugs(updated);
  };

  const addDrug = () => {
    setDrugs([...drugs, ""]);
  };

  const removeDrug = (index: number) => {
    if (drugs.length <= 2) return; // minimum 2
    setDrugs(drugs.filter((_, i) => i !== index));
    setDrugSuggestions({});
    setActiveDrugDrop(null);
  };

  /* ---- symptom toggle ---- */
  const toggleSymptom = (s: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  /* ---- filtered symptoms for display ---- */
  const filteredSymptoms = allSymptoms.filter(
    (s) =>
      s.toLowerCase().includes(symptomSearch.toLowerCase()) &&
      !selectedSymptoms.includes(s)
  );

  /* ---- count valid drugs ---- */
  const validDrugs = drugs.filter((d) => d.trim().length > 0);

  /* ---- submit prediction ---- */
  const handlePredict = async () => {
    if (validDrugs.length < 2) return setError("Please enter at least 2 drugs");
    if (selectedSymptoms.length === 0)
      return setError("Please select at least one symptom");

    setError("");
    setLoading(true);
    setResults(null);

    try {
      const res = await fetch(`${API}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.uid,
          drugs: validDrugs,
          symptoms: selectedSymptoms,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Prediction failed");
        return;
      }

      setResults(data as PredictionResponse);
    } catch {
      setError("Server error — make sure the backend is running");
    } finally {
      setLoading(false);
    }
  };

  /* ---- reset ---- */
  const handleReset = () => {
    setDrugs(["", "", "", "", ""]);
    setSelectedSymptoms([]);
    setResults(null);
    setError("");
    setDrugSuggestions({});
  };

  /* ================= RENDER ================= */
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* ===== HEADER ===== */}
      <header className="flex justify-between items-center px-6 py-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🧬</span>
          <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Vitamin Deficiency Predictor
          </h1>
        </div>
        <div className="flex gap-3">
          <Link
            href="/"
            className="px-4 py-2 bg-slate-700/60 hover:bg-slate-600 rounded-lg text-sm transition"
          >
            🏠 Home
          </Link>
          <Link
            href="/Pages/Polypharmacy/Homepage"
            className="px-4 py-2 bg-slate-700/60 hover:bg-slate-600 rounded-lg text-sm transition"
          >
            💊 Polypharmacy
          </Link>
        </div>
      </header>

      {/* ===== HERO BANNER ===== */}
      <div className="text-center py-10 px-4">
        <h2 className="text-3xl md:text-4xl font-bold mb-3">
          Drug-Induced{" "}
          <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Vitamin Deficiency
          </span>{" "}
          Analysis
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg">
          Enter your medications and symptoms — our ML model will analyze all
          drug pair combinations to predict possible vitamin deficiencies.
        </p>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ===== LEFT: DRUG INPUTS ===== */}
          <section
            ref={drugsContainerRef}
            className="bg-slate-800/70 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-cyan-300 flex items-center gap-2">
                💊 Medications ({validDrugs.length})
              </h3>
              <span className="text-xs text-slate-500">Minimum 2 required</span>
            </div>

            {/* Drug inputs */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {drugs.map((drug, i) => (
                <div key={i} className="relative">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <label className="text-xs text-slate-500 mb-0.5 block">
                        Drug {i + 1}
                      </label>
                      <input
                        className="w-full bg-slate-900/80 border border-slate-600 focus:border-cyan-400 p-2.5 rounded-xl outline-none transition text-sm"
                        placeholder={`Type drug name...`}
                        value={drug}
                        onChange={(e) => {
                          updateDrug(i, e.target.value);
                          searchDrugs(e.target.value, i);
                          setActiveDrugDrop(i);
                        }}
                        onFocus={() => {
                          if (
                            drugSuggestions[i] &&
                            drugSuggestions[i].length > 0
                          )
                            setActiveDrugDrop(i);
                        }}
                      />
                      {activeDrugDrop === i &&
                        drugSuggestions[i] &&
                        drugSuggestions[i].length > 0 && (
                          <ul className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600 rounded-xl max-h-40 overflow-y-auto shadow-2xl">
                            {drugSuggestions[i].map((d) => (
                              <li
                                key={d}
                                className="px-3 py-2 hover:bg-cyan-600/30 cursor-pointer text-sm transition"
                                onClick={() => {
                                  updateDrug(i, d);
                                  setActiveDrugDrop(null);
                                }}
                              >
                                {d}
                              </li>
                            ))}
                          </ul>
                        )}
                    </div>
                    {drugs.length > 2 && (
                      <button
                        onClick={() => removeDrug(i)}
                        className="self-end mb-0.5 px-3 py-2.5 bg-red-900/40 hover:bg-red-800/60 border border-red-500/30 rounded-xl text-red-400 text-sm transition"
                        title="Remove drug"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add drug button */}
            <button
              onClick={addDrug}
              className="w-full border border-dashed border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10 py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2"
            >
              ➕ Add Another Drug
            </button>

            {/* Summary */}
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                Analysis Summary
              </p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xl font-bold text-cyan-400">
                    {validDrugs.length}
                  </p>
                  <p className="text-xs text-slate-500">Drugs</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-emerald-400">
                    {validDrugs.length >= 2
                      ? (validDrugs.length * (validDrugs.length - 1)) / 2
                      : 0}
                  </p>
                  <p className="text-xs text-slate-500">Pairs</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-purple-400">
                    {selectedSymptoms.length}
                  </p>
                  <p className="text-xs text-slate-500">Symptoms</p>
                </div>
              </div>
            </div>
          </section>

          {/* ===== RIGHT: SYMPTOMS ===== */}
          <section className="bg-slate-800/70 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-cyan-300 flex items-center gap-2">
              😷 Symptoms ({selectedSymptoms.length} selected)
            </h3>

            {/* Search bar */}
            <input
              id="symptom-search"
              className="w-full bg-slate-900/80 border border-slate-600 focus:border-cyan-400 p-3 rounded-xl outline-none text-sm transition"
              placeholder="🔍 Search symptoms..."
              value={symptomSearch}
              onChange={(e) => setSymptomSearch(e.target.value)}
            />

            {/* Selected symptoms */}
            {selectedSymptoms.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedSymptoms.map((s) => (
                  <span
                    key={s}
                    className="bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 px-3 py-1 rounded-full text-sm flex items-center gap-2 hover:bg-cyan-500/30 transition cursor-pointer"
                    onClick={() => toggleSymptom(s)}
                  >
                    {s}
                    <span className="text-cyan-400 font-bold">×</span>
                  </span>
                ))}
              </div>
            )}

            {/* Available symptoms */}
            <div className="bg-slate-900/50 rounded-xl p-3 max-h-64 overflow-y-auto border border-slate-700/50">
              {filteredSymptoms.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-4">
                  {allSymptoms.length === 0
                    ? "Loading symptoms..."
                    : "No matching symptoms"}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {filteredSymptoms.map((s) => (
                    <button
                      key={s}
                      onClick={() => toggleSymptom(s)}
                      className="bg-slate-700/60 hover:bg-slate-600 border border-slate-600/50 px-3 py-1.5 rounded-full text-xs transition hover:border-cyan-500/50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ===== ERROR ===== */}
        {error && (
          <div className="mt-4 bg-red-900/40 border border-red-500/40 text-red-300 p-4 rounded-xl text-sm flex items-center gap-2">
            ⚠️ {error}
          </div>
        )}

        {/* ===== BUTTONS ===== */}
        <div className="flex gap-4 mt-6">
          <button
            id="predict-btn"
            onClick={handlePredict}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold py-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-cyan-500/20"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Analyzing {validDrugs.length >= 2
                  ? `${(validDrugs.length * (validDrugs.length - 1)) / 2} pairs`
                  : ""}...
              </span>
            ) : (
              `🔬 Predict Vitamin Deficiency (${validDrugs.length} drugs)`
            )}
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-4 bg-slate-700/60 hover:bg-slate-600 rounded-xl font-semibold transition"
          >
            🔄 Reset
          </button>
        </div>

        {/* ===== RESULTS ===== */}
        {results !== null && (
          <section className="mt-8 space-y-6">
            {/* Header */}
            <div className="text-center">
              <h3 className="text-2xl font-bold">
                {results.predictions.length > 0 ? (
                  <>
                    🧪 Predicted Vitamin Deficiencies (
                    <span className="text-cyan-400">
                      {results.predictions.length}
                    </span>
                    )
                  </>
                ) : (
                  "✅ No Vitamin Deficiencies Detected"
                )}
              </h3>
              <p className="text-slate-400 text-sm mt-1">
                Analyzed {results.total_pairs_analyzed} drug pair
                {results.total_pairs_analyzed !== 1 ? "s" : ""} from{" "}
                {results.drugs.length} medications
              </p>
            </div>

            {results.predictions.length === 0 && (
              <p className="text-slate-400 text-center">
                Based on the given drugs and symptoms, no vitamin deficiency was
                predicted.
              </p>
            )}

            {/* Vitamin cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.predictions.map((v) => (
                <div
                  key={v.vitamin}
                  className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{v.icon}</span>
                    <div>
                      <h4 className="text-lg font-bold text-cyan-300">
                        {v.name}
                      </h4>
                      <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full">
                        {v.vitamin}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-slate-300 mb-3 leading-relaxed">
                    {v.description}
                  </p>

                  {/* Contributing drug pairs */}
                  {v.contributing_pairs && v.contributing_pairs.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                        💊 Caused by
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {v.contributing_pairs.map((pair) => (
                          <span
                            key={pair}
                            className="bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full text-xs"
                          >
                            {pair}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommended foods */}
                  {v.foods && v.foods.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                        🥗 Recommended Foods
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {v.foods.map((f) => (
                          <span
                            key={f}
                            className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full text-xs"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pair-by-pair breakdown */}
            {results.pair_details && results.pair_details.length > 0 && (
              <div className="bg-slate-800/70 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                <h4 className="text-lg font-semibold text-cyan-300 mb-4">
                  📋 Pair-by-Pair Breakdown
                </h4>
                <div className="space-y-2">
                  {results.pair_details.map((p, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-slate-900/50 rounded-xl px-4 py-3 border border-slate-700/40"
                    >
                      <span className="text-sm font-medium">
                        {p.drug1}{" "}
                        <span className="text-slate-500 mx-1">+</span> {p.drug2}
                      </span>
                      <div className="flex gap-1.5">
                        {p.vitamins.map((vit) => (
                          <span
                            key={vit}
                            className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full text-xs"
                          >
                            {vit}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
