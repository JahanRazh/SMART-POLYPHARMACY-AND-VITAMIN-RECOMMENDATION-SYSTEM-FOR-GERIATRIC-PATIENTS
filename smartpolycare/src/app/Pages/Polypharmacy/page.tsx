'use client'

import { useAuth } from '@/app/components/Contexts/AuthContext'
import React, { FormEvent, useMemo, useState } from 'react'

type SeveritySummary = Record<string, number>

type Interaction = {
  drugA: string
  drugB: string
  severity: string
  ddinterIdA?: string
  ddinterIdB?: string
}

type AssessmentResponse = {
  assessmentId: string
  user: {
    firstName?: string
    lastName?: string
    displayName?: string
    age?: number
    gender?: string
    email?: string
  }
  drugCount: number
  drugs: string[]
  interactionsFound: number
  interactions: Interaction[]
  severitySummary: SeveritySummary
  createdAt: string
  source?: string
}

const MAX_DRUGS = 20
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'

const PolypharmacyPage = () => {
  const { user, userProfile } = useAuth()
  const [drugs, setDrugs] = useState<string[]>([''])
  const [analysis, setAnalysis] = useState<AssessmentResponse | null>(null)
  const [error, setError] = useState<string>('')
  const [successMessage, setSuccessMessage] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const displayName = useMemo(() => {
    if (!userProfile) return ''
    if (userProfile.displayName) return userProfile.displayName
    const first = userProfile.firstName || ''
    const last = userProfile.lastName || ''
    return `${first} ${last}`.trim()
  }, [userProfile])

  const handleDrugChange = (index: number, value: string) => {
    setDrugs((prev) => prev.map((drug, idx) => (idx === index ? value : drug)))
  }

  const addDrugField = () => {
    if (drugs.length >= MAX_DRUGS) return
    setDrugs((prev) => [...prev, ''])
  }

  const removeDrugField = (index: number) => {
    setDrugs((prev) => prev.filter((_, idx) => idx !== index))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSuccessMessage('')
    setAnalysis(null)

    if (!user) {
      setError('Please sign in to analyze polypharmacy risk.')
      return
    }

    const cleanedDrugs = drugs
      .map((drug) => drug.trim())
      .filter((drug, index, self) => drug && self.indexOf(drug) === index)

    if (cleanedDrugs.length < 2) {
      setError('Enter at least two different drugs to run the analysis.')
      return
    }

    if (cleanedDrugs.length > MAX_DRUGS) {
      setError(`You can analyze up to ${MAX_DRUGS} drugs at a time.`)
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`${API_BASE}/api/polypharmacy/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          drugs: cleanedDrugs,
        }),
      })

      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(data?.message || 'Unable to analyze polypharmacy risk.')
      }

      setAnalysis(data)
      setSuccessMessage('Polypharmacy risk analysis completed successfully.')
    } catch (submitError) {
      if (submitError instanceof Error) {
        setError(submitError.message)
      } else {
        setError('Unexpected error while analyzing polypharmacy risk.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderSeverityCard = (label: string, count: number, accent: string) => (
    <div className={`rounded-xl border p-4 ${accent}`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{count}</p>
    </div>
  )

  const severitySummary = analysis?.severitySummary || {}

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-xl">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-wide text-indigo-500">Polypharmacy Risk</p>
          <h1 className="text-3xl font-bold text-gray-900">Personalized Drug Interaction Checker</h1>
          <p className="mt-3 text-gray-600">
            Our engine cross-checks
            every combination against the curated Drug Interaction and highlights the severity in real time.
          </p>
        </div>

        {!user && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
            Please sign in to run a polypharmacy risk analysis.
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
            <h2 className="text-lg font-semibold text-gray-900">Patient Snapshot</h2>
            <p className="text-sm text-gray-500">We auto-fill what we know about you.</p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-600">First Name</label>
                <input
                  type="text"
                  readOnly
                  value={userProfile?.firstName || '—'}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Last Name</label>
                <input
                  type="text"
                  readOnly
                  value={userProfile?.lastName || '—'}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Display Name</label>
                <input
                  type="text"
                  readOnly
                  value={displayName || '—'}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Age</label>
                  <input
                    type="text"
                    readOnly
                    value={userProfile?.age ? `${userProfile.age}` : '—'}
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Gender</label>
                  <input
                    type="text"
                    readOnly
                    value={userProfile?.gender || '—'}
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-900"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Medication List</h2>
                <p className="text-sm text-gray-500">Add drugs you are currently taking use Format (ex; Conjugated estrogens).</p>
              </div>
              <button
                type="button"
                onClick={addDrugField}
                disabled={drugs.length >= MAX_DRUGS}
                className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-600 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                + Add Drug
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {drugs.map((drug, index) => (
                <div key={`drug-${index}`} className="flex gap-3">
                  <input
                    type="text"
                    value={drug}
                    onChange={(event) => handleDrugChange(index, event.target.value)}
                    placeholder={`Drug ${index + 1}`}
                    className="flex-1 rounded-xl border border-gray-200 px-4 py-2 focus:border-indigo-500 focus:outline-none"
                  />
                  {drugs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDrugField(index)}
                      className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-100"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-gray-500">We will check every drug pair (N*(N-1)/2 comparisons).</p>
            <button
              type="submit"
              disabled={!user || isSubmitting}
              className="rounded-2xl bg-indigo-600 px-6 py-3 text-white shadow-lg transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Analyzing...' : 'Analyze Drug Interactions'}
            </button>
          </div>
        </form>

        {analysis && (
          <section className="mt-10 space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-emerald-500">Latest Analysis</p>
                  <h2 className="text-2xl font-semibold text-gray-900">Risk Summary</h2>
                  <p className="text-sm text-gray-500">
                    {analysis.drugCount} drugs • {analysis.interactionsFound} interactions detected
                  </p>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p>ID: {analysis.assessmentId}</p>
                  <p>{new Date(analysis.createdAt).toLocaleString()}</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-4">
                {renderSeverityCard('Major', severitySummary.Major || 0, 'bg-rose-50 border-rose-100')}
                {renderSeverityCard('Moderate', severitySummary.Moderate || 0, 'bg-amber-50 border-amber-100')}
                {renderSeverityCard('Minor', severitySummary.Minor || 0, 'bg-emerald-50 border-emerald-100')}
                {renderSeverityCard('Other', severitySummary.Unknown || 0, 'bg-gray-50 border-gray-100')}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">Interaction Breakdown</h3>
              {analysis.interactions.length === 0 ? (
                <p className="mt-4 text-sm text-gray-500">No interactions were found for this drug list.</p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-600">
                    <thead>
                      <tr className="text-xs uppercase tracking-wide text-gray-500">
                        <th className="px-4 py-2">Drug A</th>
                        <th className="px-4 py-2">Drug B</th>
                        <th className="px-4 py-2">Severity</th>
                        <th className="px-4 py-2">Dataset IDs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.interactions.map((interaction, index) => (
                        <tr key={`${interaction.drugA}-${interaction.drugB}-${index}`} className="border-t">
                          <td className="px-4 py-3 font-medium text-gray-900">{interaction.drugA}</td>
                          <td className="px-4 py-3 font-medium text-gray-900">{interaction.drugB}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                interaction.severity === 'Major'
                                  ? 'bg-rose-100 text-rose-700'
                                  : interaction.severity === 'Moderate'
                                    ? 'bg-amber-100 text-amber-700'
                                    : interaction.severity === 'Minor'
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {interaction.severity}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            {interaction.ddinterIdA || '—'} / {interaction.ddinterIdB || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

export default PolypharmacyPage
