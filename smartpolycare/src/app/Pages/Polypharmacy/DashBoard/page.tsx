"use client";

import { useAuth } from "@/app/components/Contexts/AuthContext";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type SeveritySummary = Record<string, number>;

type Interaction = {
    drugA: string;
    drugB: string;
    severity: string;
    description?: string;
    ddinterIdA?: string;
    ddinterIdB?: string;
};

type RiskCalculation = {
    scores: {
        s1: number;
        s2: number;
        s3: number;
        s4: number;
        s5: number;
    };
    weights: {
        drugWeight: number;
        ageWeight: number;
        ddiWeight: number;
        liverWeight: number;
        kidneyWeight: number;
    };
    drugCount: number;
    ddiCount: number;
    riskScore: number;
    riskLevel: string;
    calculation: {
        drugComponent: number;
        ageComponent: number;
        ddiComponent: number;
        liverComponent: number;
        kidneyComponent: number;
        s1Explanation?: string;
        s2Explanation?: string;
        s3Explanation?: string;
        s4Explanation?: string;
        s5Explanation?: string;
    };
};

type AdePrediction = {
    drug: string;
    disease: string;
    predictedADE: string;
    confidence: number;
};

type AssessmentResponse = {
    assessmentId: string;
    mode?: "self" | "caretaker";
    user: {
        firstName?: string;
        lastName?: string;
        displayName?: string;
        age?: number;
        gender?: string;
        email?: string;
    };
    drugCount: number;
    drugs: string[];
    interactionsFound: number;
    interactions: Interaction[];
    severitySummary: SeveritySummary;
    age: number;
    liverFunction: string;
    kidneyFunction: string;
    existingDiseases?: string[];
    adePredictions?: AdePrediction[];
    riskCalculation: RiskCalculation;
    createdAt: string;
    source?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_LOCAL_API_URL;

const DashboardPage = () => {
    const { user } = useAuth();
    const [analysis, setAnalysis] = useState<AssessmentResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const router = useRouter();

    // State for collapsible sections
    const [sections, setSections] = useState({
        detailedCalculation: true,
        s1: false,
        s2: false,
        s3: false,
        s4: false,
        s5: false,
    });

    const toggleSection = (key: keyof typeof sections) => {
        setSections((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const ChevronUp = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
            <polyline points="18 15 12 9 6 15"></polyline>
        </svg>
    );

    const ChevronDown = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
            <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
    );

    useEffect(() => {
        const fetchAssessment = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`${API_BASE}/api/polypharmacy/assessment?userId=${user.uid}`);
                if (response.ok) {
                    const data: AssessmentResponse = await response.json();
                    setAnalysis(data);
                } else {
                    // If 404 or other error, it means no assessment likely exists
                    setAnalysis(null);
                }
            } catch (error) {
                console.error("Failed to fetch assessment", error);
                setError("Failed to load assessment data.");
            } finally {
                setLoading(false);
            }
        };

        fetchAssessment();
    }, [user]);

    const handleClear = async () => {
        if (!user) return;

        if (!confirm("Are you sure you want to clear this analysis?")) return;

        try {
            await fetch(`${API_BASE}/api/polypharmacy/assessment?userId=${user.uid}`, {
                method: "DELETE",
            });
            setAnalysis(null);
            router.push("/Pages/Polypharmacy/Polyform");
        } catch (error) {
            console.error("Failed to clear analysis", error);
            alert("Failed to clear analysis.");
        }
    };

    const renderSeverityCard = (label: string, count: number, accent: string) => (
        <div className={`rounded-xl border p-4 ${accent}`}>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-3xl font-bold text-gray-900">{count}</p>
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-10 flex items-center justify-center">
                <p className="text-gray-500">Loading analysis...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 py-10">
                <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-xl text-center">
                    <p className="text-gray-600">Please sign in to view your dashboard.</p>
                </div>
            </div>
        );
    }



    if (!analysis) {
        return (
            <div className="min-h-screen bg-gray-50 py-10">
                <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-xl text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">No Analysis Found</h1>
                    <p className="text-gray-600 mb-6">You haven't performed a polypharmacy risk analysis yet.</p>
                    <Link
                        href="/Pages/Polypharmacy/Polyform"
                        className="inline-block rounded-2xl bg-indigo-600 px-6 py-3 text-white shadow-lg transition hover:bg-indigo-700"
                    >
                        Start New Analysis
                    </Link>
                </div>
            </div>
        )
    }

    const severitySummary = analysis.severitySummary || {};

    return (
        <div className="min-h-screen bg-gray-50 py-10">
            <div className="mx-auto max-w-5xl space-y-6">

                {/* Navigation Buttons */}
                <div className="flex gap-4">
                    <Link
                        href="/Pages/Polypharmacy/Polyform"
                        className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                    >
                        <span>←</span> Back to Form
                    </Link>
                </div>

                {/* Header Section */}
                <div className="rounded-3xl bg-white p-8 shadow-xl">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p className="text-xs uppercase tracking-wide text-indigo-500">
                                Dashboard
                            </p>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Polypharmacy Analysis Results
                            </h1>
                            <p className="mt-2 text-gray-600">
                                Analysis for {analysis.user.firstName} {analysis.user.lastName} (Age: {analysis.age})
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Link
                                href="/Pages/Polypharmacy/Polyform"
                                className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-100"
                            >
                                Edit / New Analysis
                            </Link>
                            <button
                                onClick={handleClear}
                                className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
                            >
                                Clear Results
                            </button>
                        </div>
                    </div>
                </div>

                {/* Patient & Medication Details */}
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Patient Details
                        </h2>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">Name</span>
                                <span className="font-medium text-gray-900">
                                    {analysis.user.firstName} {analysis.user.lastName}
                                </span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">Age</span>
                                <span className="font-medium text-gray-900">{analysis.age} years</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">Gender</span>
                                <span className="font-medium text-gray-900 capitalize">
                                    {analysis.user.gender || "Not specified"}
                                </span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">Liver Function</span>
                                <span className="font-medium text-gray-900 text-right max-w-[60%]">
                                    {analysis.liverFunction}
                                </span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">Kidney Function</span>
                                <span className="font-medium text-gray-900 text-right max-w-[60%]">
                                    {analysis.kidneyFunction}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Existing Diseases</span>
                                <span className="font-medium text-gray-900 text-right max-w-[60%]">
                                    {analysis.existingDiseases && analysis.existingDiseases.length > 0
                                        ? analysis.existingDiseases.join(", ")
                                        : "None specified"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Medication List
                        </h2>
                        {analysis.drugs && analysis.drugs.length > 0 ? (
                            <ul className="space-y-2">
                                {analysis.drugs.map((drug, index) => (
                                    <li
                                        key={index}
                                        className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-700"
                                    >
                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                                            {index + 1}
                                        </span>
                                        {drug}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-500">No drugs listed.</p>
                        )}
                    </div>

                    {/* Adverse Drug Event Predictions */}
                    {analysis.adePredictions && analysis.adePredictions.length > 0 && (
                        <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm md:col-span-2">
                            <h2 className="text-lg font-semibold text-gray-900 mb-1">
                                ⚠️ Adverse Drug Event Predictions
                            </h2>
                            <p className="text-sm text-gray-500 mb-4">
                                ML-predicted adverse events based on your medications, age, and existing conditions.
                            </p>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead>
                                        <tr className="bg-orange-50 text-gray-700">
                                            <th className="px-4 py-3 font-semibold rounded-tl-xl">Drug</th>
                                            <th className="px-4 py-3 font-semibold">Existing Disease</th>
                                            <th className="px-4 py-3 font-semibold">Predicted ADE</th>
                                            <th className="px-4 py-3 font-semibold rounded-tr-xl text-right">Confidence</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {analysis.adePredictions.map((pred, index) => (
                                            <tr
                                                key={`ade-${index}`}
                                                className={`border-b border-gray-100 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"
                                                    }`}
                                            >
                                                <td className="px-4 py-3 font-medium text-gray-900">
                                                    {pred.drug}
                                                </td>
                                                <td className="px-4 py-3 text-gray-700">
                                                    {pred.disease}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="inline-block rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                                                        {pred.predictedADE}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span
                                                        className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${pred.confidence >= 50
                                                                ? "bg-red-100 text-red-800"
                                                                : pred.confidence >= 30
                                                                    ? "bg-orange-100 text-orange-800"
                                                                    : "bg-yellow-100 text-yellow-800"
                                                            }`}
                                                    >
                                                        {pred.confidence}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                </div>


                {/* Drug Interaction Severity Breakdown */}
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1 px-1">
                        Drug Interaction Severity Breakdown
                    </h3>
                    <div className="flex gap-6 mb-6 px-1">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-500">Drug Count:</span>
                            <span className="text-lg font-bold text-gray-900">{analysis.drugCount}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-500">Drug Interaction Count:</span>
                            <span className="text-lg font-bold text-gray-900">
                                {(severitySummary.Major || 0) + (severitySummary.Moderate || 0) + (severitySummary.Minor || 0)}
                            </span>
                        </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 transition-all hover:scale-[1.02] hover:shadow-lg">
                            <div className="flex items-center justify-between mb-4">
                                <span className="inline-flex items-center rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                                    <span className="mr-1.5 h-2 w-2 rounded-full bg-rose-500"></span>
                                    Major
                                </span>
                                <div className="h-8 w-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                            <div className="flex items-baseline space-x-2">
                                <p className="text-4xl font-extrabold text-gray-900">
                                    {severitySummary.Major || 0}
                                </p>
                                <p className="text-sm text-gray-400 font-medium">interactions</p>
                            </div>
                            <p className="mt-2 text-xs font-medium text-rose-600/80">Requires Immediate Attention</p>
                            <div className="absolute bottom-0 left-0 h-1 w-full bg-rose-100">
                                <div className="h-full bg-rose-500" style={{ width: '100%' }}></div>
                            </div>
                        </div>

                        <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 transition-all hover:scale-[1.02] hover:shadow-lg">
                            <div className="flex items-center justify-between mb-4">
                                <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                                    <span className="mr-1.5 h-2 w-2 rounded-full bg-amber-500"></span>
                                    Moderate
                                </span>
                                <div className="h-8 w-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                        <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                            <div className="flex items-baseline space-x-2">
                                <p className="text-4xl font-extrabold text-gray-900">
                                    {severitySummary.Moderate || 0}
                                </p>
                                <p className="text-sm text-gray-400 font-medium">interactions</p>
                            </div>
                            <p className="mt-2 text-xs font-medium text-amber-600/80">Monitor Closely</p>
                            <div className="absolute bottom-0 left-0 h-1 w-full bg-amber-100">
                                <div className="h-full bg-amber-500" style={{ width: '60%' }}></div>
                            </div>
                        </div>

                        <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 transition-all hover:scale-[1.02] hover:shadow-lg">
                            <div className="flex items-center justify-between mb-4">
                                <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                                    <span className="mr-1.5 h-2 w-2 rounded-full bg-emerald-500"></span>
                                    Minor
                                </span>
                                <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                            <div className="flex items-baseline space-x-2">
                                <p className="text-4xl font-extrabold text-gray-900">
                                    {severitySummary.Minor || 0}
                                </p>
                                <p className="text-sm text-gray-400 font-medium">interactions</p>
                            </div>
                            <p className="mt-2 text-xs font-medium text-emerald-600/80">Low Priority</p>
                            <div className="absolute bottom-0 left-0 h-1 w-full bg-emerald-100">
                                <div className="h-full bg-emerald-500" style={{ width: '20%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Interaction Breakdown Table */}
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Interaction Breakdown
                    </h3>
                    {analysis.interactions.length === 0 ? (
                        <p className="mt-4 text-sm text-gray-500">
                            No interactions were found for this drug list.
                        </p>
                    ) : (
                        <div className="mt-4 overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-600">
                                <thead>
                                    <tr className="text-xs uppercase tracking-wide text-gray-500">
                                        <th className="px-4 py-2">Drug A</th>
                                        <th className="px-4 py-2">Drug B</th>
                                        <th className="px-4 py-2">Severity</th>
                                        <th className="px-4 py-2">Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analysis.interactions.map((interaction, index) => (
                                        <tr
                                            key={`${interaction.drugA}-${interaction.drugB}-${index}`}
                                            className="border-t"
                                        >
                                            <td className="px-4 py-3 font-medium text-gray-900">
                                                {interaction.drugA}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-gray-900">
                                                {interaction.drugB}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs font-semibold ${interaction.severity === "Major"
                                                        ? "bg-rose-100 text-rose-700"
                                                        : interaction.severity === "Moderate"
                                                            ? "bg-amber-100 text-amber-700"
                                                            : interaction.severity === "Minor"
                                                                ? "bg-emerald-100 text-emerald-700"
                                                                : "bg-gray-100 text-gray-700"
                                                        }`}
                                                >
                                                    {interaction.severity}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                {interaction.description || "Not provided"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Risk Score and Level */}
                {/* Risk Score and Level - Professional Report Style */}
                <div className="rounded-xl bg-white shadow-sm border-t-4 border-indigo-600 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-indigo-600">
                                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm11.378-3.917c-.89-.777-2.366-.777-3.255 0a.75.75 0 01-.988-1.129c1.454-1.272 3.776-1.272 5.23 0 1.513 1.324 1.513 3.518 0 4.842a3.75 3.75 0 01-.837.552c-.676.328-1.028.774-1.028 1.152v.75a.75.75 0 01-1.5 0v-.75c0-.796.709-1.35 1.226-1.595.035-.015.068-.029.096-.042a2.25 2.25 0 00.558-4.032zM12 21a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                                </svg>
                                Risk Analysis Report
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Clinical assessment based on multiparametric analysis
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50 border border-gray-200 text-xs font-medium text-gray-600">
                                <span>Ref: {analysis.assessmentId?.substring(0, 8) || "N/A"}</span>
                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                <span>{new Date(analysis.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    {analysis.riskCalculation && (
                        <div className="p-8">
                            <div className="grid md:grid-cols-2 gap-12 items-center">
                                {/* Left Column: Score & Meter */}
                                <div className="text-center md:text-left space-y-6">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Overall Risk Score</p>
                                        <div className="flex items-baseline justify-center md:justify-start gap-3">
                                            <span className="text-7xl font-light text-gray-900 tracking-tighter">
                                                {analysis.riskCalculation.riskScore}
                                            </span>
                                            <span className="text-xl text-gray-400 font-normal">/ 100</span>
                                        </div>
                                    </div>

                                    {/* Visual Risk Meter */}
                                    <div className="relative pt-2">
                                        <div className="h-3 w-full rounded-full flex overflow-hidden bg-gray-100">
                                            <div className="w-1/4 h-full bg-emerald-400 opacity-80"></div>
                                            <div className="w-1/4 h-full bg-yellow-400 opacity-80"></div>
                                            <div className="w-1/4 h-full bg-orange-400 opacity-80"></div>
                                            <div className="w-1/4 h-full bg-rose-500 opacity-80"></div>
                                        </div>
                                        {/* Pointer */}
                                        <div
                                            className="absolute top-0 w-4 h-4 -ml-2 transition-all duration-1000 ease-out"
                                            style={{ left: `${Math.min(Math.max(analysis.riskCalculation.riskScore, 0), 100)}%` }}
                                        >
                                            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-gray-800 mx-auto mb-1"></div>
                                        </div>

                                        <div className="flex justify-between text-xs text-gray-400 font-medium mt-2 uppercase tracking-wide">
                                            <span>Low</span>
                                            <span>Moderate</span>
                                            <span>High</span>
                                            <span>Critical</span>
                                        </div>
                                    </div>

                                    <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-gray-50 rounded-lg border border-gray-100">
                                        <span className="text-sm text-gray-500">Current Status:</span>
                                        <span className={`text-base font-bold ${analysis.riskCalculation.riskLevel === "Very High" ? "text-rose-600" :
                                            analysis.riskCalculation.riskLevel === "High" ? "text-orange-600" :
                                                analysis.riskCalculation.riskLevel === "Moderate" ? "text-yellow-600" :
                                                    "text-emerald-600"
                                            }`}>
                                            {analysis.riskCalculation.riskLevel} Risk
                                        </span>
                                    </div>

                                    {/* Medical Recommendation */}
                                    <div className={`mt-6 p-4 rounded-lg border flex gap-3 ${analysis.riskCalculation.riskLevel === "Very High" ? "bg-rose-50 border-rose-100 text-rose-800" :
                                        analysis.riskCalculation.riskLevel === "High" ? "bg-orange-50 border-orange-100 text-orange-800" :
                                            analysis.riskCalculation.riskLevel === "Moderate" ? "bg-yellow-50 border-yellow-100 text-yellow-800" :
                                                "bg-emerald-50 border-emerald-100 text-emerald-800"
                                        }`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 flex-shrink-0 mt-0.5">
                                            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                                        </svg>
                                        <div>
                                            <h4 className="text-sm font-bold mb-1">Medical Recommendation</h4>
                                            <p className="text-sm opacity-90 leading-relaxed">
                                                {analysis.riskCalculation.riskLevel === "Very High"
                                                    ? "Critical alert. Immediate comprehensive medication review (CMR) and specialist consultation advised."
                                                    : analysis.riskCalculation.riskLevel === "High"
                                                        ? "Urgent medication review required. Consider deprescribing non-essential drugs."
                                                        : analysis.riskCalculation.riskLevel === "Moderate"
                                                            ? "Review medication list for potential optimization. Monitor renal/hepatic function."
                                                            : "Routine monitoring recommended. No immediate intervention required."
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Risk Factors List */}
                                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-indigo-500">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13.5a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V4.5z" clipRule="evenodd" />
                                        </svg>
                                        Contributing Risk Factors
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-2 rounded hover:bg-white hover:shadow-sm transition-all group">
                                            <span className="text-sm text-gray-600 group-hover:text-gray-900">Medication Load</span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-semibold text-gray-900">{analysis.drugCount} drugs</span>
                                                <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                    <div className="h-full bg-indigo-500" style={{ width: `${Math.min(analysis.riskCalculation.scores.s1, 100)}%` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between p-2 rounded hover:bg-white hover:shadow-sm transition-all group">
                                            <span className="text-sm text-gray-600 group-hover:text-gray-900">Patient Age</span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-semibold text-gray-900">{analysis.age} years</span>
                                                <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500" style={{ width: `${Math.min(analysis.riskCalculation.scores.s2, 100)}%` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between p-2 rounded hover:bg-white hover:shadow-sm transition-all group">
                                            <span className="text-sm text-gray-600 group-hover:text-gray-900">Drug Interactions</span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-semibold text-gray-900">{analysis.interactionsFound} detected</span>
                                                <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                    <div className="h-full bg-orange-500" style={{ width: `${Math.min(analysis.riskCalculation.scores.s3, 100)}%` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between p-2 rounded hover:bg-white hover:shadow-sm transition-all group">
                                            <span className="text-sm text-gray-600 group-hover:text-gray-900">Liver Function</span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-semibold text-gray-900">{analysis.liverFunction}</span>
                                                <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                    <div className="h-full bg-purple-500" style={{ width: `${Math.min(analysis.riskCalculation.scores.s4, 100)}%` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between p-2 rounded hover:bg-white hover:shadow-sm transition-all group">
                                            <span className="text-sm text-gray-600 group-hover:text-gray-900">Kidney Function</span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-semibold text-gray-900">{analysis.kidneyFunction}</span>
                                                <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                    <div className="h-full bg-teal-500" style={{ width: `${Math.min(analysis.riskCalculation.scores.s5, 100)}%` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Calculation Details */}
                {analysis.riskCalculation && (
                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <div
                            className="flex items-center justify-between cursor-pointer mb-4"
                            onClick={() => toggleSection('detailedCalculation')}
                        >
                            <h3 className="text-lg font-semibold text-gray-900">
                                Detailed Calculation
                            </h3>
                            {sections.detailedCalculation ? <ChevronUp /> : <ChevronDown />}
                        </div>

                        {sections.detailedCalculation && (
                            <div className="space-y-6">
                                {/* Sub-scores */}
                                <div>
                                    <h4 className="text-md font-medium text-gray-700 mb-3">
                                        Sub-Scores (S1-S5)
                                    </h4>


                                    <div className="grid gap-3 md:grid-cols-5 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                                            <p className="text-xs text-gray-500">
                                                S1 (Medication Count)
                                            </p>
                                            <p className="text-xl font-bold text-gray-900">
                                                {analysis.riskCalculation.scores.s1}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                From {analysis.drugCount} drugs
                                            </p>
                                            {analysis.riskCalculation.calculation.s1Explanation && (
                                                <p className="text-xs text-blue-600 mt-1 font-medium">
                                                    {analysis.riskCalculation.calculation.s1Explanation}
                                                </p>
                                            )}
                                        </div>
                                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                                            <p className="text-xs text-gray-500">S2 (Age)</p>
                                            <p className="text-xl font-bold text-gray-900">
                                                {analysis.riskCalculation.scores.s2}
                                            </p>
                                            {analysis.riskCalculation.calculation.s2Explanation && (
                                                <p className="text-xs text-green-600 mt-1 font-medium">
                                                    {analysis.riskCalculation.calculation.s2Explanation}
                                                </p>
                                            )}
                                        </div>
                                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                                            <p className="text-xs text-gray-500">S3 (DDI)</p>
                                            <p className="text-xl font-bold text-gray-900">
                                                {analysis.riskCalculation.scores.s3}
                                            </p>
                                            {analysis.riskCalculation.calculation.s3Explanation && (
                                                <p className="text-xs text-orange-600 mt-1 font-medium">
                                                    {analysis.riskCalculation.calculation.s3Explanation}
                                                </p>
                                            )}
                                        </div>
                                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                                            <p className="text-xs text-gray-500">S4 (Liver)</p>
                                            <p className="text-xl font-bold text-gray-900">
                                                {analysis.riskCalculation.scores.s4}
                                            </p>
                                            {analysis.riskCalculation.calculation.s4Explanation && (
                                                <p className="text-xs text-purple-600 mt-1 font-medium">
                                                    {analysis.riskCalculation.calculation.s4Explanation}
                                                </p>
                                            )}
                                        </div>
                                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                                            <p className="text-xs text-gray-500">S5 (Kidney)</p>
                                            <p className="text-xl font-bold text-gray-900">
                                                {analysis.riskCalculation.scores.s5}
                                            </p>
                                            {analysis.riskCalculation.calculation.s5Explanation && (
                                                <p className="text-xs text-teal-600 mt-1 font-medium">
                                                    {analysis.riskCalculation.calculation.s5Explanation}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                </div>

                                {/* Weights */}
                                <div>
                                    <h4 className="text-md font-medium text-gray-700 mb-3">
                                        Weights
                                    </h4>


                                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="grid gap-3 md:grid-cols-5">
                                            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                                                <p className="text-xs text-blue-600">Drug Weight</p>
                                                <p className="text-lg font-bold text-blue-900">
                                                    {analysis.riskCalculation.weights.drugWeight}
                                                </p>
                                            </div>
                                            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                                                <p className="text-xs text-blue-600">Age Weight</p>
                                                <p className="text-lg font-bold text-blue-900">
                                                    {analysis.riskCalculation.weights.ageWeight}
                                                </p>
                                            </div>
                                            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                                                <p className="text-xs text-blue-600">DDI Weight</p>
                                                <p className="text-lg font-bold text-blue-900">
                                                    {analysis.riskCalculation.weights.ddiWeight}
                                                </p>
                                            </div>
                                            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                                                <p className="text-xs text-blue-600">Liver Weight</p>
                                                <p className="text-lg font-bold text-blue-900">
                                                    {analysis.riskCalculation.weights.liverWeight}
                                                </p>
                                            </div>
                                            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                                                <p className="text-xs text-blue-600">Kidney Weight</p>
                                                <p className="text-lg font-bold text-blue-900">
                                                    {analysis.riskCalculation.weights.kidneyWeight}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="mt-2 text-xs text-gray-500">
                                            Total Weight:{" "}
                                            {Object.values(analysis.riskCalculation.weights).reduce(
                                                (a, b) => a + b,
                                                0
                                            )}
                                        </p>
                                    </div>

                                </div>

                                {/* S1 Calculation Breakdown */}
                                <div className="mb-6">
                                    <div
                                        className="flex items-center justify-between cursor-pointer mb-3"
                                        onClick={() => toggleSection('s1')}
                                    >
                                        <h4 className="text-md font-medium text-gray-700">
                                            S1 (Drug Sub-Score) Calculation
                                        </h4>
                                        {sections.s1 ? <ChevronUp /> : <ChevronDown />}
                                    </div>

                                    {sections.s1 && (
                                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-blue-900">
                                                        Drug Count:
                                                    </span>
                                                    <span className="text-lg font-bold text-blue-900">
                                                        {analysis.drugCount} drugs
                                                    </span>
                                                </div>
                                                <div className="border-t border-blue-200 pt-2 mt-2">
                                                    <p className="text-xs text-blue-700 mb-2">
                                                        S1 Calculation Rules:
                                                    </p>
                                                    <ul className="text-xs text-blue-600 space-y-1 ml-4 list-disc">
                                                        <li>Drug count &lt; 5: S1 = 0.0</li>
                                                        <li>Drug count 5-7: S1 = 0.7</li>
                                                        <li>Drug count 8-10: S1 = 1.0</li>
                                                        <li>
                                                            Drug count &gt; 10: S1 = 1.0 + (drug count - 10) ×
                                                            0.1
                                                        </li>
                                                    </ul>
                                                </div>
                                                {analysis.riskCalculation.calculation.s1Explanation && (
                                                    <div className="border-t border-blue-200 pt-2 mt-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm font-medium text-blue-900">
                                                                Calculated S1:
                                                            </span>
                                                            <span className="text-lg font-bold text-blue-900">
                                                                {analysis.riskCalculation.scores.s1}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-blue-600 mt-1 italic">
                                                            {analysis.riskCalculation.calculation.s1Explanation}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* S2 Calculation Breakdown */}
                                <div className="mb-6">
                                    <div
                                        className="flex items-center justify-between cursor-pointer mb-3"
                                        onClick={() => toggleSection('s2')}
                                    >
                                        <h4 className="text-md font-medium text-gray-700">
                                            S2 (Age Sub-Score) Calculation
                                        </h4>
                                        {sections.s2 ? <ChevronUp /> : <ChevronDown />}
                                    </div>

                                    {sections.s2 && (
                                        <div className="rounded-lg border border-green-200 bg-green-50 p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-green-900">
                                                        Age:
                                                    </span>
                                                    <span className="text-lg font-bold text-green-900">
                                                        {analysis.age} years
                                                    </span>
                                                </div>
                                                <div className="border-t border-green-200 pt-2 mt-2">
                                                    <p className="text-xs text-green-700 mb-2">
                                                        S2 Calculation Rules:
                                                    </p>
                                                    <ul className="text-xs text-green-600 space-y-1 ml-4 list-disc">
                                                        <li>Age &lt; 65: S2 = 0.0</li>
                                                        <li>Age 65-74: S2 = 0.5</li>
                                                        <li>Age 75-84: S2 = 0.7</li>
                                                        <li>Age ≥ 85: S2 = 1.0</li>
                                                    </ul>
                                                </div>
                                                {analysis.riskCalculation.calculation.s2Explanation && (
                                                    <div className="border-t border-green-200 pt-2 mt-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm font-medium text-green-900">
                                                                Calculated S2:
                                                            </span>
                                                            <span className="text-lg font-bold text-green-900">
                                                                {analysis.riskCalculation.scores.s2}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-green-600 mt-1 italic">
                                                            {analysis.riskCalculation.calculation.s2Explanation}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* S3 Calculation Breakdown */}
                                <div className="mb-6">
                                    <div
                                        className="flex items-center justify-between cursor-pointer mb-3"
                                        onClick={() => toggleSection('s3')}
                                    >
                                        <h4 className="text-md font-medium text-gray-700">
                                            S3 (DDI Sub-Score) Calculation
                                        </h4>
                                        {sections.s3 ? <ChevronUp /> : <ChevronDown />}
                                    </div>

                                    {sections.s3 && (
                                        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="space-y-2">
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div className="text-center">
                                                        <span className="text-xs text-orange-700">
                                                            Major DDI:
                                                        </span>
                                                        <p className="text-lg font-bold text-orange-900">
                                                            {severitySummary.Major || 0}
                                                        </p>
                                                    </div>
                                                    <div className="text-center">
                                                        <span className="text-xs text-orange-700">
                                                            Moderate DDI:
                                                        </span>
                                                        <p className="text-lg font-bold text-orange-900">
                                                            {severitySummary.Moderate || 0}
                                                        </p>
                                                    </div>
                                                    <div className="text-center">
                                                        <span className="text-xs text-orange-700">
                                                            Minor DDI:
                                                        </span>
                                                        <p className="text-lg font-bold text-orange-900">
                                                            {severitySummary.Minor || 0}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="border-t border-orange-200 pt-2 mt-2">
                                                    <p className="text-xs text-orange-700 mb-2">
                                                        S3 Calculation Rules:
                                                    </p>
                                                    <ul className="text-xs text-orange-600 space-y-1 ml-4 list-disc">
                                                        <li>Major DDI: 1.0 × Major DDI Count</li>
                                                        <li>Moderate DDI: 0.6 × Moderate DDI Count</li>
                                                        <li>Minor DDI: 0.3 × Minor DDI Count</li>
                                                        <li>
                                                            S3 = (Major × 1.0) + (Moderate × 0.6) + (Minor ×
                                                            0.3)
                                                        </li>
                                                        <li>No DDI: S3 = 0.0</li>
                                                    </ul>
                                                </div>
                                                {analysis.riskCalculation.calculation.s3Explanation && (
                                                    <div className="border-t border-orange-200 pt-2 mt-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm font-medium text-orange-900">
                                                                Calculated S3:
                                                            </span>
                                                            <span className="text-lg font-bold text-orange-900">
                                                                {analysis.riskCalculation.scores.s3}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-orange-600 mt-1 italic">
                                                            {analysis.riskCalculation.calculation.s3Explanation}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* S4 Calculation Breakdown */}
                                <div className="mb-6">
                                    <div
                                        className="flex items-center justify-between cursor-pointer mb-3"
                                        onClick={() => toggleSection('s4')}
                                    >
                                        <h4 className="text-md font-medium text-gray-700">
                                            S4 (Liver Function Sub-Score) Calculation
                                        </h4>
                                        {sections.s4 ? <ChevronUp /> : <ChevronDown />}
                                    </div>

                                    {sections.s4 && (
                                        <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-purple-900">
                                                        Liver Function:
                                                    </span>
                                                    <span className="text-lg font-bold text-purple-900">
                                                        {analysis.liverFunction}
                                                    </span>
                                                </div>
                                                <div className="border-t border-purple-200 pt-2 mt-2">
                                                    <p className="text-xs text-purple-700 mb-2">
                                                        S4 Calculation Rules:
                                                    </p>
                                                    <ul className="text-xs text-purple-600 space-y-1 ml-4 list-disc">
                                                        <li>Normal (&lt;40 IU/L): S4 = 0.0</li>
                                                        <li>Mild risk (40-80 IU/L): S4 = 0.3</li>
                                                        <li>Moderate risk (80-150 IU/L): S4 = 0.6</li>
                                                        <li>Severe risk (&gt;150 IU/L): S4 = 1.0</li>
                                                    </ul>
                                                </div>
                                                {analysis.riskCalculation.calculation.s4Explanation && (
                                                    <div className="border-t border-purple-200 pt-2 mt-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm font-medium text-purple-900">
                                                                Calculated S4:
                                                            </span>
                                                            <span className="text-lg font-bold text-purple-900">
                                                                {analysis.riskCalculation.scores.s4}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-purple-600 mt-1 italic">
                                                            {analysis.riskCalculation.calculation.s4Explanation}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* S5 Calculation Breakdown */}
                                <div className="mb-6">
                                    <div
                                        className="flex items-center justify-between cursor-pointer mb-3"
                                        onClick={() => toggleSection('s5')}
                                    >
                                        <h4 className="text-md font-medium text-gray-700">
                                            S5 (Kidney Function Sub-Score) Calculation
                                        </h4>
                                        {sections.s5 ? <ChevronUp /> : <ChevronDown />}
                                    </div>

                                    {sections.s5 && (
                                        <div className="rounded-lg border border-teal-200 bg-teal-50 p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-teal-900">
                                                        Kidney Function:
                                                    </span>
                                                    <span className="text-lg font-bold text-teal-900">
                                                        {analysis.kidneyFunction}
                                                    </span>
                                                </div>
                                                <div className="border-t border-teal-200 pt-2 mt-2">
                                                    <p className="text-xs text-teal-700 mb-2">
                                                        S5 Calculation Rules:
                                                    </p>
                                                    <ul className="text-xs text-teal-600 space-y-1 ml-4 list-disc">
                                                        <li>Stage 1 (eGFR 90): S5 = 0.0</li>
                                                        <li>Stage 2 (eGFR 60-89): S5 = 0.3</li>
                                                        <li>Stage 3a (eGFR 45-59): S5 = 0.5</li>
                                                        <li>Stage 3b (eGFR 30-44): S5 = 0.7</li>
                                                        <li>Stage 4 (eGFR 15-29): S5 = 0.9</li>
                                                        <li>Stage 5 (eGFR &lt;15): S5 = 1.0</li>
                                                    </ul>
                                                </div>
                                                {analysis.riskCalculation.calculation.s5Explanation && (
                                                    <div className="border-t border-teal-200 pt-2 mt-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm font-medium text-teal-900">
                                                                Calculated S5:
                                                            </span>
                                                            <span className="text-lg font-bold text-teal-900">
                                                                {analysis.riskCalculation.scores.s5}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-teal-600 mt-1 italic">
                                                            {analysis.riskCalculation.calculation.s5Explanation}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Calculation Components */}
                                <div>
                                    <h4 className="text-md font-medium text-gray-700 mb-3">
                                        Weighted Components
                                    </h4>


                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3">
                                            <span className="text-sm text-gray-600">
                                                Drug Component ={" "}
                                                {analysis.riskCalculation.weights.drugWeight} ×{" "}
                                                {analysis.riskCalculation.scores.s1} (S1 from{" "}
                                                {analysis.drugCount} drugs)
                                            </span>
                                            <span className="text-lg font-semibold text-gray-900">
                                                = {analysis.riskCalculation.calculation.drugComponent}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3">
                                            <span className="text-sm text-gray-600">
                                                Age Component ={" "}
                                                {analysis.riskCalculation.weights.ageWeight} ×{" "}
                                                {analysis.riskCalculation.scores.s2}
                                            </span>
                                            <span className="text-lg font-semibold text-gray-900">
                                                = {analysis.riskCalculation.calculation.ageComponent}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3">
                                            <span className="text-sm text-gray-600">
                                                DDI Component ={" "}
                                                {analysis.riskCalculation.weights.ddiWeight} ×{" "}
                                                {analysis.riskCalculation.scores.s3}
                                            </span>
                                            <span className="text-lg font-semibold text-gray-900">
                                                = {analysis.riskCalculation.calculation.ddiComponent}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3">
                                            <span className="text-sm text-gray-600">
                                                Liver Component ={" "}
                                                {analysis.riskCalculation.weights.liverWeight} ×{" "}
                                                {analysis.riskCalculation.scores.s4}
                                            </span>
                                            <span className="text-lg font-semibold text-gray-900">
                                                = {analysis.riskCalculation.calculation.liverComponent}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3">
                                            <span className="text-sm text-gray-600">
                                                Kidney Component ={" "}
                                                {analysis.riskCalculation.weights.kidneyWeight} ×{" "}
                                                {analysis.riskCalculation.scores.s5}
                                            </span>
                                            <span className="text-lg font-semibold text-gray-900">
                                                = {analysis.riskCalculation.calculation.kidneyComponent}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between rounded-lg border-2 border-indigo-300 bg-indigo-50 p-4 mt-3">
                                            <span className="text-base font-semibold text-indigo-900">
                                                Total Risk Score
                                            </span>
                                            <span className="text-2xl font-bold text-indigo-900">
                                                = {analysis.riskCalculation.riskScore}
                                            </span>
                                        </div>
                                    </div>

                                </div>

                                {/* Risk Categories */}
                                <div>
                                    <h4 className="text-md font-medium text-gray-700 mb-3">
                                        Risk Categories
                                    </h4>


                                    <div className="grid gap-2 md:grid-cols-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div
                                            className={`rounded-lg border p-3 ${analysis.riskCalculation.riskScore < 30
                                                ? "border-green-300 bg-green-50"
                                                : "border-gray-200 bg-gray-50"
                                                }`}
                                        >
                                            <p className="text-xs text-gray-600">Low</p>
                                            <p className="text-sm font-medium text-gray-900">
                                                0 - 29
                                            </p>
                                        </div>
                                        <div
                                            className={`rounded-lg border p-3 ${analysis.riskCalculation.riskScore >= 30 &&
                                                analysis.riskCalculation.riskScore < 60
                                                ? "border-yellow-300 bg-yellow-50"
                                                : "border-gray-200 bg-gray-50"
                                                }`}
                                        >
                                            <p className="text-xs text-gray-600">Moderate</p>
                                            <p className="text-sm font-medium text-gray-900">
                                                30 - 59
                                            </p>
                                        </div>
                                        <div
                                            className={`rounded-lg border p-3 ${analysis.riskCalculation.riskScore >= 60 &&
                                                analysis.riskCalculation.riskScore < 80
                                                ? "border-orange-300 bg-orange-50"
                                                : "border-gray-200 bg-gray-50"
                                                }`}
                                        >
                                            <p className="text-xs text-gray-600">High</p>
                                            <p className="text-sm font-medium text-gray-900">
                                                60 - 79
                                            </p>
                                        </div>
                                        <div
                                            className={`rounded-lg border p-3 ${analysis.riskCalculation.riskScore >= 80
                                                ? "border-red-300 bg-red-50"
                                                : "border-gray-200 bg-gray-50"
                                                }`}
                                        >
                                            <p className="text-xs text-gray-600">Very High</p>
                                            <p className="text-sm font-medium text-gray-900">≥ 80</p>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        )}
                    </div>
                )}


            </div>
        </div>
    );
};

export default DashboardPage;
