# db.py
import os
import firebase_admin
from firebase_admin import credentials, firestore

def get_db():
    """Initialize Firestore client once and reuse."""
    if not firebase_admin._apps:
        # Get the absolute path to the service account key
        current_dir = os.path.dirname(os.path.abspath(__file__))
        service_account_path = os.path.join(current_dir, "serviceAccountKey.json")
        
        cred = credentials.Certificate(service_account_path)
        firebase_admin.initialize_app(cred)

        # ✅ Connection check at startup
        try:
            db = firestore.client()
            # Try reading a small test query
            db.collection('test').limit(1).get()
            print("✅ Firebase connected successfully!")
        except Exception as e:
            print("❌ Firebase connection failed:", e)
    return firestore.client()