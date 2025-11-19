"""
Personal Detail Controller
Handles business logic for personal details operations
"""
from typing import Dict, Any, List, Optional, Tuple
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
try:
    # Prefer absolute import when running as a script or in non-package contexts
    from models.personal_detail.model import PersonalDetail
except Exception:
    # Fallback to relative import when running as a package
    try:
        from ..models.personal_detail.model import PersonalDetail
    except Exception:
        # As a last resort, add the project root to sys.path and retry absolute import
        sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        from models.personal_detail.model import PersonalDetail


class PersonalDetailController:
    """Controller for Personal Detail operations"""
    
    def __init__(self, db):
        """
        Initialize controller with Firestore database instance
        
        Args:
            db: Firestore client instance
        """
        self.db = db
        self.collection_name = PersonalDetail.COLLECTION_NAME
    
    def get_all(self) -> Tuple[bool, List[Dict[str, Any]], Optional[str]]:
        """
        Get all personal details
        
        Returns:
            Tuple of (success, data, error_message)
        """
        try:
            docs = self.db.collection(self.collection_name).stream()
            items = []
            for doc in docs:
                data = doc.to_dict() or {}
                data["id"] = doc.id
                items.append(data)
            return True, items, None
        except Exception as e:
            return False, [], f"Server error: {str(e)}"
    
    def get_by_id(self, doc_id: str) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """
        Get personal detail by document ID
        
        Args:
            doc_id: Document ID
            
        Returns:
            Tuple of (success, data, error_message)
        """
        try:
            doc_ref = self.db.collection(self.collection_name).document(doc_id)
            doc = doc_ref.get()
            
            if not doc.exists:
                return False, None, "Document not found"
            
            data = doc.to_dict() or {}
            data["id"] = doc.id
            return True, data, None
        except Exception as e:
            return False, None, f"Server error: {str(e)}"
    
    def create(self, payload: Dict[str, Any]) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """
        Create a new personal detail
        
        Args:
            payload: Dictionary containing personal detail data
            
        Returns:
            Tuple of (success, data, error_message)
        """
        try:
            # Validate payload
            is_valid, error_msg, missing_fields = PersonalDetail.validate_payload(payload)
            if not is_valid:
                return False, None, error_msg or f"Missing fields: {missing_fields}"
            
            # Create personal detail instance
            personal_detail = PersonalDetail.from_dict(payload)
            
            # Validate instance
            is_valid, error_msg = personal_detail.validate()
            if not is_valid:
                return False, None, error_msg
            
            # Convert to dict for Firestore (handle datetime)
            data = personal_detail.to_dict()
            
            # Add to Firestore
            result = self.db.collection(self.collection_name).add(data)
            doc_ref = result[1] if isinstance(result, (list, tuple)) and len(result) > 1 else result
            created = doc_ref.get()
            
            created_data = created.to_dict() or {}
            created_data["id"] = created.id
            return True, created_data, None
        except Exception as e:
            return False, None, f"Server error: {str(e)}"
    
    def update(self, doc_id: str, payload: Dict[str, Any]) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """
        Update an existing personal detail
        
        Args:
            doc_id: Document ID
            payload: Dictionary containing fields to update
            
        Returns:
            Tuple of (success, data, error_message)
        """
        try:
            if not payload:
                return False, None, "Empty request body"
            
            ref = self.db.collection(self.collection_name).document(doc_id)
            doc = ref.get()
            
            if not doc.exists:
                return False, None, "Document not found"
            
            # Update timestamp
            from datetime import datetime
            payload["updatedAt"] = datetime.now()
            
            # Update document
            ref.update(payload)
            
            # Get updated document
            updated = ref.get()
            data = updated.to_dict() or {}
            data["id"] = updated.id
            return True, data, None
        except Exception as e:
            return False, None, f"Server error: {str(e)}"
    
    def delete(self, doc_id: str) -> Tuple[bool, Optional[str]]:
        """
        Delete a personal detail
        
        Args:
            doc_id: Document ID
            
        Returns:
            Tuple of (success, error_message)
        """
        try:
            ref = self.db.collection(self.collection_name).document(doc_id)
            doc = ref.get()
            
            if not doc.exists:
                return False, "Document not found"
            
            ref.delete()
            return True, None
        except Exception as e:
            return False, f"Server error: {str(e)}"

