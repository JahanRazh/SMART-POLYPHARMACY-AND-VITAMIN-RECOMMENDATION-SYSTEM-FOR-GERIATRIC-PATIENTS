## Troubleshooting Guide: "Incomplete advice data" Error

### Issue
After submitting the Patient Assessment form (adviceDetails page), users get redirected to the patientAdvice page but see:
```
Error Loading Advice
Incomplete advice data received from server.
```

### Root Causes & Fixes ✅

We've identified and fixed multiple issues:

---

## 1. **Patient Data Not Being Saved** ✅ FIXED

**Problem:** The adviceDetails page was calling `/api/save_patient_data` endpoint but it wasn't saving data with all required fields.

**Fix Applied:**
- Updated `/api/save_patient_data/route.ts` to:
  - ✅ Normalize email to lowercase for consistency
  - ✅ Log what data is being saved (emotion, mental health, occupation, etc.)
  - ✅ Use correct Firestore document ID format
  - ✅ Properly merge data using Firestore's merge option

**How to verify:** Check Next.js terminal for logs like:
```
💾 Saving patient data for user@example.com:
  - Emotion: Happy
  - Mental Health: Moderate
  - Occupation: Engineer
  - Name: John Doe
  - Age: 72
✅ Updated existing patient assessment for user@example.com
```

---

## 2. **Advice Endpoint Not Finding Patient Data** ✅ FIXED

**Problem:** The `/api/patient-advice` endpoint was querying patient_assessment collection but couldn't find the saved data.

**Fixes Applied:**
- Updated `/server/controllers/patient_advice_controller.py` to:
  - ✅ Try multiple query methods (docId format + email field queries)
  - ✅ Handle case-insensitive email lookups
  - ✅ Provide detailed debug information if data not found
  - ✅ Use default values for missing fields instead of rejecting completely
  - ✅ Add comprehensive logging for troubleshooting

**How to verify:** Check Flask terminal for logs like:
```
🔍 Trying to fetch patient data using docId format: user_at_example_dot_com
✅ Found patient data using docId: user_at_example_dot_com

📊 Extracted patient inputs for user@example.com:
  - Emotion: 'Happy'
  - Mental Health: 'Moderate'
  - Polypharmacy Risk: 'High'
  - Occupation: 'Engineer'

🤖 Generating new advice for user@example.com using Gemini API...
✅ Successfully generated advice for user@example.com
```

---

## 3. **Frontend Not Properly Handling Email Parameter** ✅ FIXED

**Problem:** The patientAdvice page was only using `patientId` parameter and ignoring the `email` parameter passed from adviceDetails.

**Fix Applied:**
- Updated `/smartpolycare/src/app/Pages/patientAdvice/page.tsx` to:
  - ✅ Accept both `patientId` and `email` query parameters
  - ✅ Prefer email parameter if provided
  - ✅ Show detailed debug information in error messages
  - ✅ Validate that week_1 and week_2 are arrays before displaying

---

## 4. **Missing Field Defaults** ✅ FIXED

**Problem:** If emotion detection didn't work or field was missing, the entire advice generation would fail.

**Fix Applied:**
- Updated advice controller to use sensible defaults:
  ```
  Emotion: "Not detected"
  Mental Health: "Not assessed"
  Polypharmacy Risk: "Unknown"
  Occupation: "Not specified"
  ```
- This allows advice generation to proceed even if some data is incomplete

---

## Testing Checklist

Follow these steps to verify everything works:

### Step 1: Check Browser Console
1. Go to adviceDetails page
2. Fill in the form completely
3. Click "Submit Assessment"
4. Open **Browser Console** (F12 → Console tab)
5. Look for API calls and responses

### Step 2: Check Next.js Terminal
1. Watch the Next.js terminal where you ran `npm run dev`
2. Look for logs like:
   ```
   💾 Saving patient data for user@example.com:
   ✅ Created new patient assessment for user@example.com
   ```
3. If you don't see these logs, the `/api/save_patient_data` endpoint isn't being called

### Step 3: Check Flask Terminal
1. Watch the Flask terminal where you ran `python app.py`
2. Look for logs like:
   ```
   🔍 Trying to fetch patient data using docId format: user_at_example_dot_com
   ✅ Found patient data using docId
   📊 Extracted patient inputs for user@example.com:
   🤖 Generating new advice for user@example.com using Gemini API...
   ✅ Successfully generated advice for user@example.com
   ```

### Step 4: Check Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to Firestore Database
4. Check the `patient_assessment` collection
5. Look for documents with your email (should be named like `user_at_example_dot_com`)
6. Verify it contains: email, name, age, occupation, detectedEmotion, mentalHealthLevel

---

## Common Issues & Solutions

### Issue: "Patient data not found for user@example.com"
**Check:**
1. Is the email being used to query **exactly the same** as what was saved?
2. Check Firebase console to see if document was actually created
3. Verify email field in Firestore document matches (should be lowercase)

**Solution:**
- Restart Next.js dev server: `npm run dev`
- Clear browser cache (Ctrl+Shift+Delete)
- Try again with a fresh form submission

---

### Issue: "GOOGLE_API_KEY environment variable not set"
**Solution:**
1. Set the environment variable:
   ```bash
   set GOOGLE_API_KEY=sk-...your_key_here
   ```
2. Restart Flask server: `python app.py`
3. Try again

---

### Issue: Emotion detection always shows "Not detected"
**Check:**
1. Camera is working (green indicator in camera preview)
2. Good lighting on face
3. Face is directly facing camera
4. Wait 3+ seconds after entering name and age for detection to start

**Solution:**
- Refresh page
- Try again with better lighting
- If still not working, emotion will default to "Not detected" and advice will still generate

---

### Issue: Form submits but page shows loading forever
**Check:**
1. Open browser console (F12) and check for errors
2. Check that Firebase credentials are correct
3. Verify Flask server is running: `http://127.0.0.1:5000/api/patient-advice?email=test@test.com`

**Solution:**
- Check both Flask and Next.js terminals for errors
- Restart both servers
- Try with a different browser

---

## Detailed Data Flow (For Debugging)

```
1. User submits adviceDetails form
   └─> Calls POST /api/save_patient_data
       └─> Saves to Firestore patient_assessment collection
           └─> Document ID: user_at_example_dot_com
           └─> Fields: email, name, age, occupation, detectedEmotion, mentalHealthLevel
       └─> Returns: { success: true, id: "user_at_example_dot_com", email: "user@example.com" }

2. Frontend redirects to patientAdvice page with query params
   └─> URL: /Pages/patientAdvice?email=user@example.com

3. PatientAdvice page loads
   └─> Calls GET /api/patient-advice?email=user@example.com

4. Backend searches for patient data
   └─> Method 1: Fetch document by ID (user_at_example_dot_com)
   └─> Method 2: Query with email field
   └─> Method 3: Case-insensitive search
   └─> Finds patient_assessment document

5. Backend calls Google Gemini API
   └─> Sends: emotion, mental_health_level, poly_risk, occupation, medications
   └─> Receives: week_1[], week_2[], summary

6. Backend stores result in Firestore patient_advice collection
   └─> Document fields: email, week_1, week_2, summary, inputs, generated_date, expires_date

7. Frontend receives response and displays 2-week plan
   └─> Shows Week 1 (Days 1-7)
   └─> Shows Week 2 (Days 8-14)
   └─> Shows generated date and expiry date (7 days)
```

---

## Files Modified

1. **[smartpolycare/src/app/api/save_patient_data/route.ts](smartpolycare/src/app/api/save_patient_data/route.ts)**
   - Added email normalization to lowercase
   - Added detailed logging of saved data
   - Fixed merge behavior

2. **[server/controllers/patient_advice_controller.py](server/controllers/patient_advice_controller.py)**
   - Added multiple query methods (docId + email queries)
   - Added case-insensitive lookups
   - Added default values for missing fields
   - Added comprehensive logging
   - Better error messages with debug info

3. **[smartpolycare/src/app/Pages/patientAdvice/page.tsx](smartpolycare/src/app/Pages/patientAdvice/page.tsx)**
   - Added email parameter handling
   - Improved error display with debug info
   - Better validation of response structure

---

## Still Having Issues?

1. **Check that all required fields are present:**
   - Form fills correctly (name, age, occupation)
   - Emotion detection runs (shows "Emotion: Happy, etc")
   - Mental health assessment returns a level

2. **Check logs in order:**
   - Browser Console (F12)
   - Next.js terminal (save_patient_data endpoint)
   - Firebase Console (check patient_assessment collection)
   - Flask terminal (advice generation)
   - Browser Console again (final response)

3. **Try a manual test:**
   ```bash
   # Test the endpoint directly
   curl "http://127.0.0.1:5000/api/patient-advice?email=test@example.com" | jq
   ```

4. **Check Firebase Rules:** Ensure your Firestore rules allow reads/writes to patient_assessment

---

**Last Updated:** March 6, 2026
**System Status:** All known issues fixed ✅
