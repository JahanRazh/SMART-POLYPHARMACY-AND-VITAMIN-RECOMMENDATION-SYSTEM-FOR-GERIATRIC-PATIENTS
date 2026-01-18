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
                            <div className="flex justify-between">
                                <span className="text-gray-500">Kidney Function</span>
                                <span className="font-medium text-gray-900 text-right max-w-[60%]">
                                    {analysis.kidneyFunction}
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
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p className="text-xs uppercase tracking-wide text-emerald-500">
                                Risk Assessment
                            </p>
                            <h2 className="text-2xl font-semibold text-gray-900">
                                Risk Prediction
                            </h2>
                            <p className="text-sm text-gray-500">
                                {analysis.drugCount} drugs • {analysis.interactionsFound}{" "}
                                interactions detected
                            </p>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                            <p>ID: {analysis.assessmentId}</p>
                            <p>{new Date(analysis.createdAt).toLocaleString()}</p>
                        </div>
                    </div>

                    {analysis.riskCalculation && (
                        <div className="mt-6">
                            <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50 p-6">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div>
                                        <p className="text-sm text-indigo-600">
                                            Polypharmacy Risk Score
                                        </p>
                                        <p className="text-4xl font-bold text-indigo-900">
                                            {analysis.riskCalculation.riskScore} %
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-indigo-600">Risk Level</p>
                                        <p
                                            className={`text-2xl font-bold ${analysis.riskCalculation.riskLevel === "Very High"
                                                ? "text-red-600"
                                                : analysis.riskCalculation.riskLevel === "High"
                                                    ? "text-orange-600"
                                                    : analysis.riskCalculation.riskLevel ===
                                                        "Moderate"
                                                        ? "text-yellow-600"
                                                        : "text-green-600"
                                                }`}
                                        >
                                            {analysis.riskCalculation.riskLevel}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                        {renderSeverityCard(
                            "Major",
                            severitySummary.Major || 0,
                            "bg-rose-50 border-rose-100"
                        )}
                        {renderSeverityCard(
                            "Moderate",
                            severitySummary.Moderate || 0,
                            "bg-amber-50 border-amber-100"
                        )}
                        {renderSeverityCard(
                            "Minor",
                            severitySummary.Minor || 0,
                            "bg-emerald-50 border-emerald-100"
                        )}
                    </div>
                </div>

                {/* Calculation Details */}
                {analysis.riskCalculation && (
                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Detailed Calculation
                        </h3>

                        {/* Sub-scores */}
                        <div className="mb-6">
                            <h4 className="text-md font-medium text-gray-700 mb-3">
                                Sub-Scores (S1-S5)
                            </h4>
                            <div className="grid gap-3 md:grid-cols-5">
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
                        <div className="mb-6">
                            <h4 className="text-md font-medium text-gray-700 mb-3">
                                Weights
                            </h4>
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

                        {/* S1 Calculation Breakdown */}
                        <div className="mb-6">
                            <h4 className="text-md font-medium text-gray-700 mb-3">
                                S1 (Drug Sub-Score) Calculation
                            </h4>
                            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
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
                        </div>

                        {/* S2 Calculation Breakdown */}
                        <div className="mb-6">
                            <h4 className="text-md font-medium text-gray-700 mb-3">
                                S2 (Age Sub-Score) Calculation
                            </h4>
                            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
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
                        </div>

                        {/* S3 Calculation Breakdown */}
                        <div className="mb-6">
                            <h4 className="text-md font-medium text-gray-700 mb-3">
                                S3 (DDI Sub-Score) Calculation
                            </h4>
                            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
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
                        </div>

                        {/* S4 Calculation Breakdown */}
                        <div className="mb-6">
                            <h4 className="text-md font-medium text-gray-700 mb-3">
                                S4 (Liver Function Sub-Score) Calculation
                            </h4>
                            <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
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
                        </div>

                        {/* S5 Calculation Breakdown */}
                        <div className="mb-6">
                            <h4 className="text-md font-medium text-gray-700 mb-3">
                                S5 (Kidney Function Sub-Score) Calculation
                            </h4>
                            <div className="rounded-lg border border-teal-200 bg-teal-50 p-4">
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
                        </div>

                        {/* Calculation Components */}
                        <div className="mb-6">
                            <h4 className="text-md font-medium text-gray-700 mb-3">
                                Weighted Components
                            </h4>
                            <div className="space-y-2">
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
                            <div className="grid gap-2 md:grid-cols-4">
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
        </div>
    );
};

export default DashboardPage;
