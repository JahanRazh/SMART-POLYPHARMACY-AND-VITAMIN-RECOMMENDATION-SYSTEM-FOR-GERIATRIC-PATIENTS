# 2-Week Personalized Advice System - Setup Guide

This document explains how to set up and use the new **Google Gemini-powered** 2-week personalized health advice system.

## Overview

The system generates personalized 14-day health recommendations using **Google Gemini API** based on:
- **Facial Emotion Detection** (from emotion model)
- **Mental Health Assessment** (ML-based)
- **Polypharmacy Risk** (drug interaction analysis)
- **Occupation/Lifestyle Context**
- **Medications** (if available)

The advice is cached in Firestore for 7 days to optimize API usage.

---

## Quick Start

### 1. Get Google Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click **"Create API Key"**
3. Copy your API key

### 2. Set Environment Variable

#### **Windows (Command Prompt)**
```bash
set GOOGLE_API_KEY=your_api_key_here
```

#### **Windows (PowerShell)**
```powershell
$env:GOOGLE_API_KEY = "your_api_key_here"
```

#### **Windows (Permanent - System Env)**
1. Open **Environment Variables** (search in Start menu)
2. Click **New** under User variables
3. Variable name: `GOOGLE_API_KEY`
4. Variable value: `your_api_key_here`
5. Click OK and restart your terminal

#### **Linux/Mac**
```bash
export GOOGLE_API_KEY=your_api_key_here
```

To make it permanent, add to `~/.bash_profile` or `~/.zshrc`:
```bash
echo 'export GOOGLE_API_KEY=your_api_key_here' >> ~/.bash_profile
```

### 3. Install Updated Dependencies

```bash
pip install -r requirements.txt
```

This installs the new `google-generativeai==0.7.2` package.

### 4. Restart Backend Server

```bash
python app.py
```

---

## Architecture

### Backend Flow

```
GET /api/patient-advice?patientId=user@example.com
    ↓
1. Fetch patient data from Firestore
   - detectedEmotion, mental_health_level
   - polypharmacy_risk, occupation
   - medications (if available)
    ↓
2. Check Firestore cache (patient_advice collection)
   - If fresh (< 7 days old) → Return cached advice ✅
   - If stale/missing → Generate new advice
    ↓
3. Call Google Gemini API
   - Uses system prompt for geriatric health context
   - Returns structured JSON with week_1 and week_2
    ↓
4. Store result in Firestore
   - Expires in 7 days
   - Stores input features for audit trail
    ↓
5. Return to frontend
```

### Frontend Flow

```
PatientAdvice Page
    ↓
Fetch /api/patient-advice?patientId=...
    ↓
Display Two Sections:
- Week 1 (Days 1-7) with daily recommendations
- Week 2 (Days 8-14) with daily recommendations
    ↓
Show summary, inputs, generation date, expiry date
    ↓
Allow manual refresh (force_regenerate=true)
```

---

## API Endpoints

### GET /api/patient-advice

**Request:**
```
GET http://127.0.0.1:5000/api/patient-advice?patientId=user@example.com
GET http://127.0.0.1:5000/api/patient-advice?patientId=user@example.com&force_regenerate=true
```

**Response (Success - 200):**
```json
{
  "week_1": [
    {
      "day": 1,
      "recommendation": "Start your morning with 15 minutes of light stretching. This will help reduce stiffness..."
    },
    {
      "day": 2,
      "recommendation": "Practice a 10-minute guided meditation focusing on your breathing..."
    },
    ...
  ],
  "week_2": [
    {
      "day": 8,
      "recommendation": "Increase your daily walk to 20 minutes, incorporating gentle hill climbs..."
    },
    ...
  ],
  "summary": "This two-week plan is designed to gradually build your physical activity and mental wellness...",
  "source": "gemini_api",
  "generated_date": "2026-03-06T14:32:45.123456",
  "expires_date": "2026-03-13T14:32:45.123456",
  "inputs": {
    "emotion": "Happy",
    "mental_health_level": "Moderate",
    "polypharmacy_risk": "High",
    "occupation": "Retired"
  }
}
```

**Response (Cached - 200):**
Same as above, but `"source": "cached"`

**Response (Error - 500):**
```json
{
  "message": "Error generating advice: GOOGLE_API_KEY environment variable not set",
  "week_1": [],
  "week_2": [],
  "summary": "",
  "source": "error"
}
```

---

## Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `patientId` or `email` | string (required) | Patient identifier (email or ID) |
| `force_regenerate` | boolean (optional) | Set to `true` to ignore cache and generate new advice |

---

## Firestore Schema

### Collection: `patient_advice`

```javascript
{
  email: "user@example.com",
  patient_name: "John Doe",
  age: 72,
  week_1: [
    { day: 1, recommendation: "..." },
    { day: 2, recommendation: "..." },
    ...
  ],
  week_2: [
    { day: 8, recommendation: "..." },
    ...
  ],
  summary: "...",
  advice_generated_date: "2026-03-06T14:32:45.123456",
  advice_expires_date: "2026-03-13T14:32:45.123456",
  inputs: {
    emotion: "Happy",
    mental_health_level: "Moderate",
    polypharmacy_risk: "High",
    occupation: "Retired"
  },
  source: "gemini_api",
  medications: ["Metformin", "Lisinopril", ...]
}
```

**Index Recommendation:**
- Create a composite index on `(email, advice_generated_date)` for faster queries

---

## Frontend Display

The **PatientAdvice Page** displays:

1. **Plan Overview Card**
   - Summary of the 2-week plan
   - Patient profile (emotion, mental health, medication risk, occupation)
   - Timeline (generated date, expiry date, source)

2. **Week Selection Buttons**
   - Week 1 (Days 1-7)
   - Week 2 (Days 8-14)

3. **Daily Recommendations**
   - Each day shown with Day number and actionable recommendation
   - Smooth animations between week switches

4. **Action Buttons**
   - "Update Patient Data" → Links to adviceDetails page
   - "Regenerate Advice" → Forces new generation (ignores 7-day cache)

5. **Disclaimer**
   - Clear warning that advice is non-medical and AI-generated
   - Recommendation to consult healthcare providers

---

## Google Gemini API Costs

- **Free Tier**: 50 requests per minute, 1.5M tokens daily
- **Paid Tier**: $0.075 per million input tokens, $0.30 per million output tokens

For ~2,000 patients with weekly regeneration:
- ~2,000 × 52 weeks = ~104,000 API calls/year
- Each call uses ~300-500 input tokens + ~500-800 output tokens
- **Estimated cost**: $3-8/month at paid tier (very reasonable for enterprise)

---

## Troubleshooting

### Error: "GOOGLE_API_KEY environment variable not set"

**Solution:**
1. Verify GOOGLE_API_KEY is set in your environment
2. Restart the Flask server after setting the variable
3. Check spelling: exactly `GOOGLE_API_KEY` (case-sensitive on Linux/Mac)

### Error: "Failed to parse response"

**Solution:**
1. Check that the Gemini API is responding (network/API issues)
2. Verify API key is valid (test at https://aistudio.google.com/app/apikey)
3. Check backend logs for detailed error message

### Advice always shows as "cached"

**Solution:**
- The 7-day cache is working as intended
- To regenerate, click **"Regenerate Advice"** button on frontend
- Or call API with `?force_regenerate=true` parameter

### No advice generated for new patients

**Solution:**
1. Verify patient has completed emotional assessment (emotion_route)
2. Verify patient has completed full assessment (mental_health_level)
3. Verify patient has polypharmacy assessment
4. Check Firestore for missing data in patient_assessment collection

---

## Files Modified

1. **[server/requirements.txt](server/requirements.txt)**
   - Added: `google-generativeai==0.7.2`

2. **[server/services/advice_generator.py](server/services/advice_generator.py)** ✨ NEW
   - Main service for calling Gemini API
   - Handles prompt engineering for 2-week advice
   - Parses JSON response

3. **[server/controllers/patient_advice_controller.py](server/controllers/patient_advice_controller.py)** 🔄 UPDATED
   - Replaced CSV fuzzy matching with Gemini API
   - Implements Firestore caching (7-day TTL)
   - Supports force_regenerate parameter

4. **[smartpolycare/src/app/Pages/patientAdvice/page.tsx](smartpolycare/src/app/Pages/patientAdvice/page.tsx)** 🔄 UPDATED
   - Complete redesign for week-based layout
   - Displays day-by-day recommendations
   - Shows generation dates, expiry, and inputs
   - Added refresh button for manual regeneration

---

## Next Steps (Optional Enhancements)

1. **Add Medication Warnings**
   - Parse medications list and add interaction warnings to recommendations
   - Example: "If taking blood thinners, avoid high-impact exercise"

2. **A/B Testing**
   - Store Gemini quality scores (1-5) from users
   - Compare against old CSV system

3. **Streaming Recommendations**
   - Stream advice generation to frontend in real-time
   - Better UX for slower networks

4. **Multi-Language Support**
   - Translate advice based on patient language preference
   - Use Gemini's translation API

5. **Analytics Dashboard**
   - Track which recommendations users follow
   - Monitor advice quality metrics
   - Optimize prompts based on user feedback

---

## Support

For issues or questions:
1. Check error logs: `flask debug mode` prints detailed errors
2. Review Gemini API status at https://status.ai.google.dev/
3. Test API key at https://aistudio.google.com/app/apikey
4. Review Firebase Firestore for data consistency

---

**Last Updated**: March 6, 2026
**System Version**: 1.0 - Gemini-powered 2-week advice
