import os
import firebase_admin
from firebase_admin import credentials, firestore
from firebase_admin.exceptions import FirebaseError

# Global flag to track initialization
_firebase_initialized = False

def get_db():
    """Initialize Firestore client once and reuse."""
    global _firebase_initialized
    
    print("=" * 50)
    print("🔧 DEBUG: get_db() called")
    
    if not _firebase_initialized:
        print("⚙️ Firebase not initialized yet, initializing...")
        
        try:
            # Get the absolute path to the service account key
            current_dir = os.path.dirname(os.path.abspath(__file__))
            service_account_path = os.path.join(current_dir, "serviceAccountKey.json")
            
            print(f"📁 Looking for service account key at: {service_account_path}")
            
            if not os.path.exists(service_account_path):
                print(f"❌ ERROR: Service account key not found at {service_account_path}")
                raise FileNotFoundError(f"Service account key not found at {service_account_path}")
            
            print("✅ Service account key found, loading credentials...")
            cred = credentials.Certificate(service_account_path)
            
            print("🚀 Initializing Firebase app...")
            firebase_admin.initialize_app(cred)
            
            # Test connection
            print("🔌 Testing Firestore connection...")
            db = firestore.client()
            
            # Try a simple operation
            test_ref = db.collection('_test_connection').document()
            test_ref.set({'test': True, 'timestamp': firestore.SERVER_TIMESTAMP})
            test_ref.delete()
            
            print("✅ Firebase connected successfully!")
            _firebase_initialized = True
            
        except Exception as e:
            print(f"❌ Firebase connection failed: {e}")
            import traceback
            traceback.print_exc()
            raise
    
    print("✅ Returning Firestore client")
    return firestore.client()