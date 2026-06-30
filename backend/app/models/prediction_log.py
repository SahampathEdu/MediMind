from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class PredictionLog(Base):
    __tablename__ = "prediction_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    drug1 = Column(String(150), nullable=False)
    drug2 = Column(String(150), nullable=False)
    age = Column(Integer, nullable=True)
    gender = Column(String(20), nullable=True)
    health_conditions = Column(Text, nullable=True)
    risk_level = Column(String(30), nullable=True)
    interaction_type = Column(String(100), nullable=True)
    interaction_effect = Column(Text, nullable=True)
    interaction_description = Column(Text, nullable=True)
    confidence_score = Column(Float, nullable=True)
    found = Column(String(10), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", backref="prediction_logs")
