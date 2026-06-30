from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.schemas import UserOut, UserUpdate, UserRole
from app.utils.deps import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserOut)
def update_me(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.name is not None:
        current_user.name = payload.name.strip()
    # Users can only update name; role/status changes are admin-only
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/my-history")
def my_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = 20,
    skip: int = 0,
):
    from app.models.prediction_log import PredictionLog
    from app.schemas import PredictionLogOut
    logs = (
        db.query(PredictionLog)
        .filter(PredictionLog.user_id == current_user.id)
        .order_by(PredictionLog.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [PredictionLogOut.model_validate(l) for l in logs]
