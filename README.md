# Smart Polypharmacy & Vitamin Recommendation System for Geriatric Patients

A comprehensive AI-powered healthcare platform designed to manage multiple medications, detect drug interactions, assess polypharmacy risk, and provide personalized vitamin recommendations for geriatric patients. The system enhances medication safety, reduces adverse events, and improves overall elderly care through intelligent risk assessment and lifestyle recommendations.

Repository Link - https://github.com/JahanRazh/SMART-POLYPHARMACY-AND-VITAMIN-RECOMMENDATION-SYSTEM-FOR-GERIATRIC-PATIENTS.git

Deployment Link - https://smartpolycare.vercel.app/

## 🌟 Features

### Core Functionalities

1. **Polypharmacy Risk Scoring**
   - AI-powered assessment of drug-drug interactions
   - Patient-specific risk factor analysis using clinical algorithms
   - Dynamic risk scoring based on medication profiles, age, and comorbidities
   - High-risk medication identification
   - High clinical accuracy in risk prediction

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
   - Mindfulness, sleep hygiene
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

### Directory Overview with Comments

```
SMART-POLYPHARMACY-VITAMIN-RECOMMENDATION-SYSTEM-FOR-GERIATRIC-PATIENTS/
│
│ ================ GIT & PROJECT CONFIG ================
├── .git/                       # Git repository metadata
├── .github/                    # GitHub workflows and configurations
├── .gitignore                  # Git ignore rules (includes serviceAccountKey.json)
├── .gitattributes             # Git attributes for consistency
├── .vscode/                    # VS Code workspace settings
├── .qodo/                      # Qodo AI code review configuration
├── README.md                   # Project documentation
│
│ ================ FRONTEND: NEXT.JS APPLICATION ================
├── smartpolycare/              # Next.js Frontend Application
│   │
│   ├── 🔧 Configuration Files
│   ├── .env.local              # Local environment variables (Firebase config, API URLs)
│   ├── .gitignore              # Frontend-specific git ignore rules
│   ├── .next/                  # Next.js build output (auto-generated)
│   ├── eslint.config.mjs       # ESLint configuration for code linting
│   ├── next-env.d.ts           # Next.js TypeScript definitions (auto-generated)
│   ├── next.config.ts          # Next.js configuration (build, rewrites, redirects)
│   ├── package.json            # Frontend dependencies and scripts
│   ├── package-lock.json       # Dependency lock file for reproducible installs
│   ├── postcss.config.mjs      # PostCSS configuration (for Tailwind CSS)
│   ├── tailwind.config.js      # Tailwind CSS styling configuration
│   ├── tsconfig.json           # TypeScript compiler configuration
│   ├── README.md               # Frontend-specific documentation
│   │
│   ├── 📦 Dependencies
│   ├── node_modules/           # NPM packages (auto-generated, not committed)
│   │
│   ├── 🎨 Public Assets
│   ├── public/                 # Static files served directly to browser
│   │   ├── images/             # Image assets (favicons, logos, screenshots)
│   │   │   ├── favicon.ico     # Browser favicon
│   │   │   ├── polycare.jpg    # Application logo/image
│   │   │   └── NotFound.png    # 404 error page image
│   │   ├── file.svg, globe.svg # SVG icons
│   │   ├── next.svg, vercel.svg, window.svg  # Framework logos
│   │   └── firebase-debug.log  # Firebase debug logs
│   │
│   └── 📄 Source Code (src/)
│       └── app/                # Next.js App Router structure
│           │
│           ├── 🏠 Global Layouts & Styles
│           ├── layout.tsx      # Root layout wrapper (applies to all pages)
│           ├── page.tsx        # Home page component (/)
│           ├── not-found.tsx   # 404 not found page
│           ├── favicon.ico     # Page favicon
│           ├── globals.css     # Global CSS styles applied to entire app
│           │
│           ├── 🔑 Authentication & Configuration
│           ├── lib/            # Utility libraries and configurations
│           │   └── firebaseConfig.js  # Firebase initialization and setup
│           │
│           ├── 🔌 API Integration
│           ├── api/            # API route handlers (Next.js API routes)
│           │   └── save_patient_data/
│           │       └── route.ts  # API endpoint for saving patient data to Firebase
│           │
│           ├── 🧩 Reusable Components
│           ├── components/     # React components used across pages
│           │   ├── HeaderWithAuth.jsx    # Header with authentication display
│           │   ├── UserProfile.jsx       # User profile component
│           │   │
│           │   ├── Auth/       # Authentication-related components
│           │   │   ├── AgeGenderModal.jsx    # Modal for age/gender input
│           │   │   ├── AuthModal.jsx         # Main authentication modal
│           │   │   ├── LoginForm.jsx         # Login form component
│           │   │   ├── ProfileModal.jsx      # User profile edit modal
│           │   │   └── SignupForm.jsx        # Sign up form component
│           │   │
│           │   ├── Contexts/   # React Context API providers
│           │   │   └── AuthContext.js  # Global authentication state management
│           │   │
│           │   ├── Home/       # Home page specific components
│           │   │   └── page.tsx  # Home page layout
│           │   │
│           │   ├── Hooks/      # Custom React hooks
│           │   │   └── useAuth.js  # Hook for accessing auth context
│           │   │
│           │   └── Ui/         # UI component library
│           │
│           └── 📄 Pages (Page Components)
│               └── Pages/      # Main application pages
│                   ├── About/        # About page
│                   │   └── page.tsx
│                   │
│                   ├── adviceDetails/    # Detailed view of patient advice
│                   │   └── page.tsx
│                   │
│                   ├── LifestyleAdvice/  # Lifestyle and wellness advice
│                   │   └── page.tsx
│                   │
│                   ├── MealPlanProviders/  # Meal planning interface
│                   │   ├── page.tsx           # Main meal plan page
│                   │   ├── mealdetailsform.tsx  # Form for entering meal preferences
│                   │   ├── MealPlanResult.tsx   # Display generated meal plan
│                   │   └── results/            # Meal plan results storage
│                   │
│                   ├── patientAdvice/    # Patient-specific advice page
│                   │   └── page.tsx
│                   │
│                   ├── patients/         # Patient management page
│                   │   └── page.tsx
│                   │
│                   ├── payment/          # Payment/subscription page
│                   │   └── page.tsx
│                   │
│                   ├── Polypharmacy/     # Polypharmacy risk assessment pages
│                   │   ├── page.tsx              # Main polypharmacy page
│                   │   ├── DashBoard/           # Risk assessment dashboard
│                   │   ├── Homepage/            # Polypharmacy welcome page
│                   │   └── Polyform/            # Drug input form
│                   │
│                   └── others/           # Additional/misc pages
│
│ ================ BACKEND: FLASK APPLICATION ================
└── server/                     # Flask Backend Python Application
    │
    ├── 🔧 Configuration Files
    ├── .gitignore              # Backend git ignore (excludes venv, serviceAccountKey.json)
    ├── app.py                  # Flask application entry point - initializes routes and middleware
    ├── db.py                   # Firebase Firestore database connection and utilities
    ├── food.py                 # Food database utilities and lookups
    ├── requirements.txt        # Python package dependencies (pip install -r requirements.txt)
    ├── runtime.txt             # Python version specification (for Heroku deployment)
    ├── serviceAccountKey.json  # Firebase service account credentials (NOT in repo - add to .gitignore)
    ├── webcam_test_model_3.py  # Testing script for emotion detection model with webcam
    ├── patient_emotions.csv    # Dataset/history of patient emotion records
    │
    ├── 🤖 ML Models & Encoders
    ├── venv/                   # Python virtual environment (auto-generated, not committed)
    ├── __pycache__/            # Python cache files (auto-generated, not committed)
    │
    ├── 🧠 Controllers (Business Logic Layer)
    ├── controllers/            # Business logic and processing controllers
    │   ├── emotion_backend.py              # Emotion detection algorithm and processing
    │   ├── meal_plan_controller.py         # Meal plan generation and optimization logic
    │   ├── patient_advice_controller.py    # Patient advice generation based on profile
    │   ├── polyphamacy_risk_contoller.py  # Polypharmacy risk calculation and scoring
    │   └── __pycache__/                   # Python cache for controllers
    │
    ├── 🛣️ Routes (API Endpoints)
    ├── routes/                 # API route definitions and handlers
    │   ├── emotion_route.py           # POST/GET emotion detection endpoints
    │   ├── full_assessment_route.py   # Comprehensive patient assessment endpoints
    │   ├── meal_plan_route.py         # Meal plan generation and retrieval endpoints
    │   ├── occupation_route.py        # Occupation-related endpoints
    │   ├── advice_route.py            # Advice retrieval endpoints
    │   ├── polyphamacy_risk_route.py # Drug interaction and risk analysis endpoints
    │   └── __pycache__/               # Python cache for routes
    │
    ├── 🤖 Models (Machine Learning)
    ├── models/                 # ML models, pre-trained weights, and training scripts
    │   │
    │   ├── 📊 ML Model Files
    │   ├── meal_plan_model.py          # ML model for meal plan recommendations
    │   ├── polyphamacy_risk_model.py   # ML model for polypharmacy risk assessment
    │   ├── model_3_csv_transfer_learning.keras  # Emotion detection model (Keras/TensorFlow)
    │   ├── mental_health_model.pkl     # Pickled mental health prediction model
    │   │
    │   ├── 🔧 Encoders & Scalers
    │   ├── label_encoders.pkl          # Sklearn label encoders for categorical variables
    │   ├── scaler.pkl                  # Sklearn StandardScaler for feature normalization
    │   ├── target_encoder.pkl          # Target encoder for encoding target variables
    │   │
    │   ├── 🤗 Transformer Models (Hugging Face)
    │   ├── geriatric_Advice_model/     # Fine-tuned NLP transformer for geriatric advice
    │   │   ├── config.json                 # Model configuration
    │   │   ├── model.safetensors           # Model weights (safe format)
    │   │   ├── special_tokens_map.json     # Special token mappings
    │   │   ├── tokenizer_config.json       # Tokenizer configuration
    │   │   └── vocab.txt                   # Vocabulary file
    │   │
    │   ├── 📋 Meal Plan Module
    │   ├── MealPlan/                   # Meal planning logic and utilities
    │   │   ├── __init__.py             # Package initialization
    │   │   ├── meal_logic.py           # Core meal planning algorithm
    │   │   ├── food.csv                # Database of nutritional foods (Sri Lankan focus)
    │   │   ├── meal_model.pkl          # Pre-trained meal recommendation model
    │   │   ├── scaler.pkl              # Scaler for meal plan features
    │   │   ├── test_result.json        # Test results/validation data
    │   │   └── __pycache__/            # Python cache
    │   │
    │   ├── 💊 Drug Interaction ML
    │   ├── drug_interaction_ml/        # Drug interaction detection models and databases
    │   │   ├── drug_interactions_index.pkl  # Index for fast drug lookup
    │   │   ├── drug_list.pkl                # Comprehensive drug list database
    │   │   ├── drug_name_map.pkl            # Drug name mapping (synonyms, generic names)
    │   │   ├── interaction_db.pkl           # Drug interaction knowledge base
    │   │   ├── metadata.pkl                 # Metadata about drugs (dosage, warnings)
    │   │   └── severity_levels.pkl          # Severity classification for interactions
    │   │
    │   ├── 📚 Training Scripts
    │   ├── scripts/                    # Model training and development scripts
    │   │   └── train_drug_interaction_model.py  # Script to train drug interaction model
    │   │
    │   └── __pycache__/               # Python cache files
    │
    ├── 📊 Data (Datasets & CSVs)
    ├── Data/                   # CSV datasets for system training and reference
    │   ├── Drug_interaction.csv                         # Drug interactions database
    │   ├── FINAL_400_UNIQUE_SRI_LANKAN_FOODS_ALL_VITAMINS.csv  # Food nutrition data (400 Sri Lankan foods)
    │   ├── geriatric_non_medical_advice_dataset.csv     # Lifestyle advice dataset for elderly
    │   └── occupation.csv                               # Occupational data for patient profiling
    │
    ├── 🛠️ Scripts (Utilities)
    ├── scripts/                # Utility and management scripts
    │   └── list_routes.py      # Script to list all available API routes
    │
    ├── 📦 Utilities
    ├── utils/                  # Utility functions and helper modules (currently empty - can add helpers here)
    │
    └── __pycache__/            # Python cache files (auto-generated, not committed)
```

### Quick Reference Guide:

| Layer | Location | Purpose |
|-------|----------|---------|
| **Frontend** | `smartpolycare/` | React UI with Next.js, TypeScript, Tailwind |
| **Backend** | `server/app.py` | Flask REST API server |
| **Controllers** | `server/controllers/` | Business logic for core features |
| **Routes** | `server/routes/` | API endpoint definitions |
| **ML Models** | `server/models/` | Pre-trained models and weights |
| **Datasets** | `server/Data/` | CSV files for drugs, foods, advice |
| **Database** | Firebase Firestore | Cloud storage for patient data |
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

# Run frontend development server
npm run dev
# or
yarn dev
# or
pnpm dev
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

# Run Flask server
python app.py
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
source venv/bin/activate  # macOS/Linux

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

## 🌳 Git Branching Strategy

This project follows the **Git Flow** branching model for organized development and releases.

### 📌 Main Branches

| Branch | Purpose | Protection | Merge From |
|--------|---------|-----------|-----------|
| `main` | Production-ready code | ✅ Protected | `release/` branches only |
| `develop` | Integration branch for features | ✅ Protected | `feature/`, `bugfix/` branches |

#### Related Feature and Bugfix Branches

| Branch | Purpose | Protection | Merge Into |
|--------|---------|-----------|-----------|
| feature/Jahan's Dev Branch| Polypharmacy Risk Analysis module | ❌ Not protected | develop |
| feature/Pathum's Branch | AI Lifestyle & Mental Wellness Advisory System | ❌ Not protected | develop |
| feature/Nevin's Branch| Personalized Food Recommendation System | ❌ Not protected | develop | 
| feature/Reshmi's Branch| Early Vitamin Deficiency Warning System | ❌ Not protected | develop |
| bugfix/* | Fix bugs identified during testing | ❌ Not protected | develop |
PERSONALIZED FOOD RECOMMENDATION  
SYSTEM

### 🔀 Branch Types

#### 1. **Feature Branches** (`feature/*`)
For developing new features or enhancements
```bash
# Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/polypharmacy-dashboard

# Work on feature
git add .
git commit -m "feat: Add polypharmacy risk dashboard visualization"

# Push and create Pull Request
git push origin feature/polypharmacy-dashboard
```

**Naming Convention:**
- `feature/meal-plan-optimization` - Feature implementation
- `feature/emotion-detection-ui` - UI enhancements
- `feature/drug-database-update` - Data updates

#### 2. **Bugfix Branches** (`bugfix/*`)
For fixing bugs in the develop branch
```bash
# Create bugfix branch from develop
git checkout develop
git checkout -b bugfix/firebase-auth-issue

# Fix the bug
git add .
git commit -m "fix: Resolve Firebase authentication timeout"

# Push and create Pull Request
git push origin bugfix/firebase-auth-issue
```

**Naming Convention:**
- `bugfix/meal-calc-error` - Bug fixes
- `bugfix/emotion-model-crash` - Critical issues

#### 3. **Release Branches** (`release/*`)
For preparing production releases
```bash
# Create release branch from develop
git checkout develop
git checkout -b release/v1.2.0

# Update version numbers and changelog
# Only critical bug fixes allowed here

git add .
git commit -m "chore: Release version 1.2.0"
git push origin release/v1.2.0

# After testing and approval, merge to main
git checkout main
git merge --no-ff release/v1.2.0
git tag -a v1.2.0 -m "Release v1.2.0"
git push origin main --tags

# Merge back to develop
git checkout develop
git merge --no-ff release/v1.2.0
git push origin develop
```

**Naming Convention:**
- `release/v1.0.0` - Major release
- `release/v1.2.3` - Patch release

#### 4. **Hotfix Branches** (`hotfix/*`)
For critical production bugs (created from main)
```bash
# Create hotfix branch from main
git checkout main
git checkout -b hotfix/critical-drug-interaction-bug

# Fix critical issue
git add .
git commit -m "fix: Critical drug interaction detection bug"
git push origin hotfix/critical-drug-interaction-bug

# Merge to main
git checkout main
git merge --no-ff hotfix/critical-drug-interaction-bug
git tag -a v1.2.1 -m "Hotfix v1.2.1"
git push origin main --tags

# Merge back to develop
git checkout develop
git merge --no-ff hotfix/critical-drug-interaction-bug
git push origin develop
```

**Naming Convention:**
- `hotfix/auth-crash` - Critical production bugs
- `hotfix/data-loss-issue` - Data integrity issues

### 📋 Commit Message Convention

Follow the format: `<type>: <subject>`

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style (formatting, semicolons)
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `test:` - Adding tests
- `chore:` - Maintenance tasks

**Examples:**
```
feat(meal-plan): Add nutritional optimization algorithm
fix(polypharmacy): Resolve drug interaction detection
docs(readme): Update installation instructions
refactor(backend): Simplify emotion detection model
perf(database): Optimize Firestore queries
test(models): Add unit tests for risk scoring
chore(deps): Update TensorFlow to v2.13
```

### 🔄 Typical Workflow

```
┌─ develop (main integration branch)
│   ├─ feature/new-feature ──→ (PR) ──→ merge to develop
│   ├─ bugfix/issue-fix ────→ (PR) ──→ merge to develop
│   └─ release/v1.2.0 ──────→ (PR) ──→ merge to main + tag
│                          └────→ merge back to develop
│
└─ main (production release)
    ├─ Tag: v1.0.0 ✓
    ├─ Tag: v1.1.0 ✓
    ├─ Tag: v1.2.0 ✓
    └─ hotfix/critical-bug → (PR) → merge to main + tag
```

### ✅ Pull Request Process

1. **Create PR** from your branch to target branch (develop or main)
2. **Fill PR Template** with:
   - Description of changes
   - Related issues
   - Testing performed
   - Screenshots (if UI changes)
3. **Request Code Review** from team members
4. **Address Review Comments** in commits
5. **Squash & Merge** when approved (keeping commit history clean)

### 🚫 Branch Protection Rules

The following rules are enforced on `main` and `develop`:

- ✅ Require pull request reviews before merging (minimum 1 reviewer)
- ✅ Require status checks to pass (linting, tests)
- ✅ Dismiss stale pull request approvals when new commits are pushed
- ✅ Require branches to be up to date before merging
- ✅ Enforce all conversations to be resolved before merging
- ✅ Require commit signatures (recommended)

### 📝 Useful Git Commands

```bash
# List all branches
git branch -a

# Delete local branch
git branch -d feature/old-feature

# Delete remote branch
git push origin --delete feature/old-feature

# Fetch latest changes
git fetch origin

# Rebase feature branch on develop
git checkout feature/my-feature
git rebase develop

# Create and switch to new branch in one command
git checkout -b feature/new-feature

# View commit log with graph
git log --oneline --graph --all --decorate

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Check branch status
git status
```

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
