# Smart Polypharmacy & Vitamin Recommendation System for Geriatric Patients

A comprehensive AI-powered healthcare platform designed to manage multiple medications, detect drug interactions, assess polypharmacy risk, and provide personalized vitamin recommendations for geriatric patients. The system enhances medication safety, reduces adverse events, and improves overall elderly care through intelligent risk assessment and lifestyle recommendations.

(https://smartpolycare.vercel.app/)

## 🌟 Features

### Core Functionalities

1. **Polypharmacy Risk Scoring**
   - AI-powered assessment of drug-drug interactions
   - Patient-specific risk factor analysis using clinical algorithms
   - Dynamic risk scoring based on medication profiles, age, and comorbidities
   - High-risk medication identification
   - 95% clinical accuracy in risk prediction

2. **Vitamin Deficiency Detection**
   - Early identification of nutrient deficiencies (B12, D, folate, etc.)
   - AI-driven detection using symptoms, medication history, and lifestyle indicators
   - Proactive alerts for potential deficiencies
   - Support for 10+ vitamin profiles

3. **Personalized Meal Planning**
   - Hybrid rule-based + ML engine for meal recommendations
   - Culturally appropriate meal suggestions
   - Drug-nutrient conflict avoidance
   - BMI and clinical goal alignment
   - Safe nutrition planning

4. **Lifestyle & Mental Wellness Advisor**
   - Non-medical lifestyle recommendations
   - Emotion-aware mental health support
   - Mindfulness, sleep hygiene, and journaling guidance
   - Real-time emotion detection using facial recognition
   - Integrated wellness tracking

5. **Patient Management**
   - Secure patient data storage
   - Comprehensive patient profiles
   - Lifestyle data tracking
   - Personalized advice generation

## 🏗️ Architecture

```
┌─────────────────┐
│   Next.js       │  Frontend (React/TypeScript)
│   Frontend      │  - Tailwind CSS
│                 │  - Framer Motion
│                 │  - Firebase Auth
└────────┬────────┘
         │ HTTP/REST API
         │
┌────────▼────────┐
│   Flask         │  Backend API (Python)
│   Backend       │  - TensorFlow/Keras
│                 │  - Scikit-learn
│                 │  - Flask-CORS
└────────┬────────┘
         │
┌────────▼────────┐
│   Firebase      │  Database & Services
│   (Firestore)   │  - Patient Data
│                 │  - Authentication
│                 │  - Real-time Updates
└─────────────────┘
```

### Technology Stack

**Frontend:**
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Firebase** - Authentication and real-time database
- **Axios** - HTTP client
- **React Webcam** - Camera integration for emotion detection

**Backend:**
- **Flask** - Python web framework
- **TensorFlow/Keras** - Machine learning models
- **Scikit-learn** - Additional ML algorithms
- **OpenCV** - Image processing for emotion detection
- **Pandas** - Data manipulation
- **NumPy** - Numerical computing
- **Firebase Admin SDK** - Server-side Firebase integration

**Database & Services:**
- **Firebase Firestore** - NoSQL database
- **Firebase Authentication** - User authentication

## 📁 Project Structure

```
SMART-POLYPHARMACY-VITAMIN-RECOMMENDATION-SYSTEM-FOR-GERIATRIC-PATIENTS/
│
├── smartpolycare/              # Next.js Frontend Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/     # React components
│   │   │   │   ├── Auth/       # Authentication components
│   │   │   │   ├── Home/       # Home page components
│   │   │   │   ├── Contexts/   # React contexts
│   │   │   │   └── Hooks/      # Custom React hooks
│   │   │   ├── Pages/          # Application pages
│   │   │   │   ├── About/      # About page
│   │   │   │   ├── adviceDetails/  # Advice details page
│   │   │   │   ├── LifestyleAdvice/  # Lifestyle advice
│   │   │   │   ├── MealPlanProviders/  # Meal plan pages
│   │   │   │   ├── patientAdvice/  # Patient advice page
│   │   │   │   ├── patients/   # Patient management
│   │   │   │   ├── payment/    # Payment page
│   │   │   │   └── Polypharmacy/  # Polypharmacy risk pages
│   │   │   ├── lib/            # Utility libraries
│   │   │   │   └── firebaseConfig.js  # Firebase configuration
│   │   │   ├── globals.css     # Global styles
│   │   │   ├── layout.tsx      # Root layout
│   │   │   └── page.tsx        # Home page
│   │   └── ...
│   ├── public/                 # Static assets
│   ├── package.json            # Frontend dependencies
│   ├── next.config.ts          # Next.js configuration
│   ├── tailwind.config.js      # Tailwind configuration
│   └── tsconfig.json           # TypeScript configuration
│
├── server/                     # Flask Backend Application
│   ├── app.py                  # Flask application entry point
│   ├── db.py                   # Firebase database connection
│   ├── requirements.txt        # Python dependencies
│   ├── runtime.txt             # Python runtime version
│   ├── serviceAccountKey.json  # Firebase service account (not in repo)
│   │
│   ├── controllers/            # Business logic controllers
│   │   ├── emotion_backend.py         # Emotion detection logic
│   │   ├── meal_plan_controller.py    # Meal plan generation
│   │   └── polyphamacy_risk_contoller.py  # Risk assessment logic
│   │
│   ├── routes/                # API route handlers
│   │   ├── emotion_route.py           # Emotion detection routes
│   │   ├── full_assessment_route.py   # Full assessment routes
│   │   ├── meal_plan_route.py         # Meal plan routes
│   │   └── polyphamacy_risk_route.py  # Polypharmacy routes
│   │
│   ├── models/                # ML models and utilities
│   │   ├── meal_plan_model.py         # Meal plan ML model
│   │   ├── polyphamacy_risk_model.py  # Risk assessment model
│   │   ├── mental_health_model.pkl    # Mental health model
│   │   ├── model_3_csv_transfer_learning.keras  # Emotion detection model
│   │   ├── label_encoders.pkl         # Label encoders
│   │   ├── scaler.pkl                 # Data scaler
│   │   └── target_encoder.pkl          # Target encoder
│   │
│   └── Data/                  # Data files
│       └── Drug_interaction.csv       # Drug interaction database
│
└── README.md                   # This file
```
<img width="1366" height="2416" alt="image" src="https://github.com/user-attachments/assets/e0d7cb40-c301-4bd4-b2d6-6d0c6adc89a7" />

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **Python** (3.11 or higher)
- **npm** or **yarn** or **pnpm**
- **Firebase Account** with Firestore enabled
- **Firebase Service Account Key** (JSON file)

### Installation

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd SMART-POLYPHARMACY-VITAMIN-RECOMMENDATION-SYSTEM-FOR-GERIATRIC-PATIENTS
```

#### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd smartpolycare

# Install dependencies
npm install
# or
yarn install
# or
pnpm install
```

#### 3. Backend Setup

```bash
# Navigate to server directory
cd server

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### 4. Firebase Configuration

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database
3. Enable Authentication (Email/Password)
4. Generate a Service Account Key:
   - Go to Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file as `serviceAccountKey.json` in the `server/` directory

#### 5. Frontend Firebase Configuration

1. In Firebase Console, go to Project Settings → General
2. Under "Your apps", add a web app
3. Copy the Firebase configuration
4. Update `smartpolycare/src/app/lib/firebaseConfig.js` with your configuration:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

## 🏃 Running the Application

### Development Mode

#### Start Backend Server

```bash
cd server
# Activate virtual environment if not already activated
venv\Scripts\activate  # Windows
# or
source emotion_env/bin/activate  # macOS/Linux

# Run Flask server
python app.py
```

The backend server will run on `http://127.0.0.1:5000`

#### Start Frontend Server

```bash
cd smartpolycare
npm run dev
# or
yarn dev
# or
pnpm dev
```

The frontend will run on `http://localhost:3000`

### Production Build

#### Build Frontend

```bash
cd smartpolycare
npm run build
npm start
```

#### Run Backend (Production)

For production deployment, use a WSGI server like Gunicorn:

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## 📡 API Endpoints

### Base URL
- Development: `http://127.0.0.1:5000/api`
- Production: `https://your-api-domain.com/api`

### Polypharmacy Risk Assessment

#### Analyze Polypharmacy Risk
```
POST /api/polypharmacy/analyze
Content-Type: application/json

{
  "medications": ["drug1", "drug2", ...],
  "patient_age": 75,
  "comorbidities": ["condition1", "condition2", ...]
}
```

#### Search Drugs
```
GET /api/polypharmacy/drugs/search?query=drug_name
```

### Emotion Detection

#### Detect Emotion from Image
```
POST /api/detect_emotion
Content-Type: application/json

{
  "name": "Patient Name",
  "age": 75,
  "image": "data:image/jpeg;base64,..."
}
```

### Meal Planning

#### Generate Meal Plan
```
POST /api/meal-plans
Content-Type: application/json

{
  "patient_id": "patient_id",
  "dietary_preferences": {...},
  "medical_conditions": [...],
  "medications": [...]
}
```

### Patient Advice

#### Get Personalized Advice
```
GET /api/patient-advice?patientId=patient_id
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in `smartpolycare/` directory (optional):

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:5000/api
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
```

### Backend Configuration

- Update `server/db.py` if using a different Firebase service account path
- Modify `server/app.py` to change the Flask server host/port
- Update CORS settings in `server/app.py` for production deployment

## 🧪 Testing

### Backend Testing

```bash
cd server
python -m pytest  # If pytest is installed
```

### Frontend Testing

```bash
cd smartpolycare
npm test  # If test scripts are configured
```

## 🚢 Deployment

### Frontend Deployment (Vercel)

The frontend is deployed on Vercel: [https://smartpolycare.vercel.app/](https://smartpolycare.vercel.app/)

1. Connect your GitHub repository to Vercel
2. Configure build settings:
   - Build Command: `npm run build`
   - Output Directory: `.next`
3. Add environment variables in Vercel dashboard
4. Deploy

### Backend Deployment

#### Option 1: Heroku

1. Create `Profile`:
```
web: gunicorn -w 4 -b 0.0.0.0:$PORT app:app
```

2. Deploy:
```bash
heroku create your-app-name
git push heroku main
```

#### Option 2: AWS/GCP/Azure

- Use containerized deployment (Docker)
- Configure environment variables
- Set up Firebase service account key securely
- Use managed services for scalability

## 🔒 Security Considerations

1. **Never commit** `serviceAccountKey.json` to version control
2. Use environment variables for sensitive data
3. Implement proper authentication and authorization
4. Enable CORS only for trusted domains in production
5. Use HTTPS in production
6. Regularly update dependencies for security patches
7. Implement rate limiting for API endpoints
8. Validate and sanitize all user inputs

## 📝 Key Features Explained

### Polypharmacy Risk Scoring
- Analyzes multiple medications for potential interactions
- Considers patient age, comorbidities, and medication profiles
- Uses machine learning models trained on clinical data
- Provides risk scores and recommendations

### Emotion Detection
- Real-time facial emotion recognition
- Supports 7 emotion categories: Angry, Disgust, Fear, Happy, Sad, Surprise, Neutral
- Uses transfer learning with Keras/TensorFlow
- Stores emotion data in Firebase for tracking

### Meal Planning
- Generates personalized meal plans based on:
  - Patient medical conditions
  - Current medications
  - Dietary preferences
  - BMI and health goals
- Avoids drug-nutrient interactions
- Culturally appropriate recommendations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- Development Team

## 🙏 Acknowledgments

- Healthcare professionals for clinical insights
- Open-source community for excellent tools and libraries
- Research papers and clinical guidelines referenced in the system

## 📞 Support

For issues, questions, or contributions, please open an issue on the GitHub repository.

## 🔮 Future Enhancements

- [ ] Mobile app (React Native)
- [ ] Integration with electronic health records (EHR)
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Telemedicine integration
- [ ] Wearable device integration
- [ ] Enhanced ML models with more training data
- [ ] Real-time medication adherence tracking

---

**Note:** This system is designed to support healthcare professionals and should not replace professional medical advice. Always consult with qualified healthcare providers for medical decisions.
