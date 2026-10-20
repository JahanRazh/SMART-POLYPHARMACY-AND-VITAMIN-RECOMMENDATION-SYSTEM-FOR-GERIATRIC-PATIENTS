# 🚀 Smart Polycare Deployment Guide (ඩිප්ලෝයි කිරීමේ මාර්ගෝපදේශය)

මෙම ලියවිල්ල මගින් Smart Polycare (Next.js Frontend සහ Flask Backend) සාර්ථකව Deploy කරගන්නා ආකාරය පියවරෙන් පියවර විස්තර කෙරේ.

---

## 📁 1. සිදු කරන ලද වෙනස්කම් සහ File Management (File Updates Summary)

1. **Frontend API URL Centralization (`smartpolycare/src/app/lib/apiConfig.ts`)**:
   - මීට පෙර පිටු කිහිපයක `http://127.0.0.1:5000` hardcode කර තිබූ අතර, Cloud එකට Deploy කළ විට Client Browser එකෙන් Server එකට සම්බන්ධ වීමට නොහැකි විය.
   - දැන් සියලුම පිටු `NEXT_PUBLIC_API_URL` හරහා ස්වයංක්‍රීයව backend එකට සම්බන්ධ වේ. (Local dev වලදී fallback ලෙස `http://127.0.0.1:5000` ක්‍රියාත්මක වේ).

2. **Requirements Encoding Fix (`server/requirements.txt`)**:
   - මීට පෙර `requirements.txt` UTF-16LE encoding වලින් තිබූ නිසා Linux/Render/Docker build වලදී `UnicodeDecodeError` ඇතිවිය.
   - එය පිරිසිදු UTF-8 බවට පරිවර්තනය කර `gunicorn`, `opencv-python-headless`, `tensorflow`, `firebase-admin`, `google-generativeai` ඇතුළත් කර ඇත.

3. **Dynamic Host & Port Binding (`server/app.py`)**:
   - Server එක `127.0.0.1:5000` වෙනුවට `0.0.0.0` සහ Cloud Platform එකෙන් ලැබෙන `$PORT` එකට bind වන පරිදි සකස් කරන ලදී.

4. **Production Database Credential Support (`server/db.py`)**:
   - `serviceAccountKey.json` Git එකට push නොකර, Cloud Dashboard එකේ `FIREBASE_SERVICE_ACCOUNT_KEY` පරිසර විචල්‍යය (Environment Variable) මගින් කෙලින්ම credentials ලබා දීමට පහසුකම එක් කරන ලදී.

5. **Deployment Configs එකතු කිරීම**:
   - `server/Procfile`: Gunicorn production WSGI server startup command.
   - `render.yaml`: Render 1-click blueprint.
   - `server/.env.example` & `smartpolycare/.env.example`: අවශ්‍ය Environment Variables වල templates.
   - `.gitignore` යාවත්කාලීන කර credentials සහ temporary logs ආරක්ෂා කර ඇත.

---

## 🌐 2. Backend Deployment (Render හෝ Railway මත)

### Recommended Platform: **Render.com** (Web Service)

1. [Render.com](https://render.com) වෙත ගොස් Login වන්න.
2. **New +** -> **Web Service** තෝරන්න.
3. ඔබගේ GitHub Repository එක සම්බන්ධ කරන්න.
4. පහත Settings ඇතුළත් කරන්න:
   - **Name**: `smartpolycare-server`
   - **Root Directory**: `server`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn --bind 0.0.0.0:$PORT --workers 1 --threads 4 --timeout 120 app:app`
5. **Environment Variables** (පහත අගයන් එක් කරන්න):
   - `PYTHON_VERSION`: `3.11.9`
   - `GOOGLE_API_KEY`: ඔබගේ Google Gemini API Key එක.
   - `FIREBASE_SERVICE_ACCOUNT_KEY`: ඔබගේ `server/serviceAccountKey.json` ගොනුවේ සම්පූර්ණ JSON content එක copy කර paste කරන්න.
6. **Deploy Web Service** ක්ලික් කරන්න.
7. Deploy වූ පසු ලැබෙන URL එක (උදා: `https://smartpolycare-server.onrender.com`) සටහන් කරගන්න.

---

## 💻 3. Frontend Deployment (Vercel මත)

### Recommended Platform: **Vercel.com**

1. [Vercel.com](https://vercel.com) වෙත ගොස් Login වන්න.
2. **Add New...** -> **Project** තෝරා GitHub Repository එක Import කරන්න.
3. **Configure Project**:
   - **Root Directory**: Edit කර `smartpolycare` ලෙස තෝරන්න.
   - **Framework Preset**: `Next.js` (ස්වයංක්‍රීයව හඳුනාගනී).
4. **Environment Variables** (පහත අගයන් එක් කරන්න):
   - `NEXT_PUBLIC_API_URL`: Backend එකෙන් ලැබුණු Render URL එක (උදා: `https://smartpolycare-server.onrender.com` - අගට `/` නොමැතිව).
   - `NEXT_PUBLIC_FIREBASE_API_KEY`: ඔබගේ Firebase API Key
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: `smart-polycare-free.firebaseapp.com`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: `smart-polycare-free`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: `smart-polycare-free.firebasestorage.app`
   - `NEXT_PUBLIC_FIREBASE_SENDER_ID`: `124316309033`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`: `1:124316309033:web:378173b793362f61792e38`
5. **Deploy** ක්ලික් කරන්න.

---

## 🔒 4. ආරක්ෂාව (Security Checklist)

- [x] `serviceAccountKey.json` කිසි විටෙකත් GitHub වෙත push නොකරන්න (`.gitignore` මගින් ignore කර ඇත).
- [x] API Keys සියල්ලම `.env` හෝ Hosting Dashboard Environment Variables මගින් පමණක් භාවිතා කරන්න.
- [x] Production build සඳහා `gunicorn` WSGI worker timeouts (120s) සකසා ඇත (TensorFlow/ML predictions වලට කාලය ප්‍රමාණවත් වීම සඳහා).

---

## 🧪 5. Local එකේ Test කරන්නේ කෙසේද? (Local Testing)

### Backend:
```bash
cd server
python app.py
```
*(Server runs on `http://127.0.0.1:5000`)*

### Frontend:
```bash
cd smartpolycare
npm run dev
```
*(Next.js runs on `http://localhost:3000`)*
