from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


# ─── Enums ────────────────────────────────────────────────────────────────────

class UserRole(str, Enum):
    patient = "patient"
    healthcare_worker = "healthcare_worker"
    admin = "admin"


class UserStatus(str, Enum):
    pending = "pending"
    active = "active"
    suspended = "suspended"


# ─── Auth Schemas ──────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.patient

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip()


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    status: str
    is_admin: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class TokenData(BaseModel):
    user_id: Optional[int] = None
    email: Optional[str] = None


class UserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[UserRole] = None
    status: Optional[UserStatus] = None


# ─── Prediction Schemas ────────────────────────────────────────────────────────

class InteractionRequest(BaseModel):
    drug1: str
    drug2: str
    age: Optional[int] = None
    gender: Optional[str] = None
    health_conditions: Optional[List[str]] = None

    @field_validator("drug1", "drug2")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Drug name cannot be empty")
        return v.strip()


class InteractionResponse(BaseModel):
    found: bool
    drug1: str
    drug2: str
    risk_level: Optional[str] = None
    interaction_type: Optional[str] = None
    interaction_effect: Optional[str] = None
    interaction_description: Optional[str] = None
    confidence_score: Optional[float] = None
    source: Optional[str] = None
    prediction_source: Optional[str] = None
    message: Optional[str] = None
    patient_risk_note: Optional[str] = None


# ─── Prediction Log Schemas ────────────────────────────────────────────────────

class PredictionLogOut(BaseModel):
    id: int
    user_id: Optional[int]
    drug1: str
    drug2: str
    age: Optional[int]
    gender: Optional[str]
    risk_level: Optional[str]
    interaction_type: Optional[str]
    confidence_score: Optional[float]
    found: Optional[str]
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


# ─── Admin / Stats Schemas ─────────────────────────────────────────────────────

class ModelMetrics(BaseModel):
    total_predictions: int
    found_interactions: int
    not_found: int
    high_risk_count: int
    moderate_risk_count: int
    low_risk_count: int

class SystemStats(BaseModel):
    total_users: int
    active_users: int
    suspended_users: int
    total_predictions: int
    dataset_size: int


class DrugSearchResult(BaseModel):
    drugs: List[str]
    total: int
