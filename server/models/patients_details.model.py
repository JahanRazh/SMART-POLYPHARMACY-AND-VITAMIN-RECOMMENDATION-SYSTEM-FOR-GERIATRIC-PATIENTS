"""
Personal Detail Model
Defines the data structure and validation for personal details
"""
from typing import Optional, Dict, Any
from datetime import datetime


class PatientsDetails:
    """Model for Personal Detail entity"""
    
    COLLECTION_NAME = "patients"
    
    def __init__(
        self,
        firstName: str,
        lastName: str,
        age: int,
        email: str,
        doc_id: Optional[str] = None,
        **kwargs
    ):
        self.id = doc_id
        self.firstName = firstName
        self.lastName = lastName
        self.age = age
        self.email = email
        self.createdAt = kwargs.get('createdAt', datetime.now())
        self.updatedAt = kwargs.get('updatedAt', datetime.now())
        
        # Optional fields
        for key, value in kwargs.items():
            if key not in ['id', 'doc_id', 'createdAt', 'updatedAt']:
                setattr(self, key, value)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any], doc_id: Optional[str] = None) -> 'PatientsDetails':
        """Create PatientsDetails instance from dictionary"""
        if doc_id:
            data['doc_id'] = doc_id
        return cls(**data)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert PersonalDetail instance to dictionary"""
        data = {
            'firstName': self.firstName,
            'lastName': self.lastName,
            'age': self.age,
            'email': self.email,
            'createdAt': self.createdAt,
            'updatedAt': self.updatedAt
        }
        
        # Add optional fields
        optional_fields = ['phoneNumber', 'address', 'city', 'zipCode', 'gender', 'dateOfBirth']
        for field in optional_fields:
            if hasattr(self, field) and getattr(self, field) is not None:
                data[field] = getattr(self, field)
        
        return data
    
    def validate(self) -> tuple[bool, Optional[str]]:
        """
        Validate the personal detail data
        Returns: (is_valid, error_message)
        """
        if not self.firstName or not self.firstName.strip():
            return False, "First name is required"
        
        if not self.lastName or not self.lastName.strip():
            return False, "Last name is required"
        
        if not isinstance(self.age, int) or self.age < 0 or self.age > 150:
            return False, "Age must be a valid number between 0 and 150"
        
        if not self.email or '@' not in self.email:
            return False, "Valid email is required"
        
        return True, None
    
    @staticmethod
    def validate_payload(payload: Dict[str, Any]) -> tuple[bool, Optional[str], Optional[list]]:
        """
        Validate payload for creating/updating personal detail
        Returns: (is_valid, error_message, missing_fields)
        """
        required_fields = ["firstName", "lastName", "age", "email"]
        missing = [f for f in required_fields if f not in payload or not payload[f]]
        
        if missing:
            return False, "Missing required fields", missing
        
        # Validate age
        try:
            age = int(payload["age"])
            if age < 0 or age > 150:
                return False, "Age must be between 0 and 150", None
        except (ValueError, TypeError):
            return False, "Age must be a valid number", None
        
        # Validate email
        email = payload.get("email", "")
        if not email or '@' not in email:
            return False, "Valid email is required", None
        
        return True, None, None

