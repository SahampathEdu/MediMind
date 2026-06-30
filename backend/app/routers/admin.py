from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
import shutil
from app.core.database import get_db
from app.models.user import User
from app.models.prediction_log import PredictionLog
from app.schemas import UserOut, UserUpdate, SystemStats, PredictionLogOut
from app.utils.deps import get_current_admin

router = APIRouter(prefix="/admin", tags=["Admin"])


# ─── Users ────────────────────────────────────────────────────────────────────

@router.get("/users", response_model=List[UserOut])
def list_users(skip: int = 0, limit: int = 50, db: Session = Depends(get_db), _: User = Depends(get_current_admin)):
    return db.query(User).order_by(User.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/users/{user_id}", response_model=UserOut)
def get_user(user_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return user


@router.put("/users/{user_id}", response_model=UserOut)
def update_user(user_id: int, payload: UserUpdate, db: Session = Depends(get_db), _: User = Depends(get_current_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if payload.name:
        user.name = payload.name.strip()
    if payload.role:
        user.role = payload.role.value
    if payload.status:
        user.status = payload.status.value
    db.commit(); db.refresh(user)
    return user


@router.post("/users/{user_id}/suspend", response_model=UserOut)
def suspend_user(user_id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot suspend yourself.")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    user.status = "suspended"; db.commit(); db.refresh(user)
    return user


@router.post("/users/{user_id}/activate", response_model=UserOut)
def activate_user(user_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    user.status = "active"; db.commit(); db.refresh(user)
    return user


@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself.")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    db.delete(user); db.commit()
    return {"message": f"User {user_id} deleted."}


# ─── Dataset ──────────────────────────────────────────────────────────────────

@router.post("/dataset/upload")
def upload_dataset(request: Request, file: UploadFile = File(...), _: User = Depends(get_current_admin)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files accepted.")
    from app.core.config import settings
    with open(settings.DATASET_PATH, "wb") as f:
        shutil.copyfileobj(file.file, f)
    service = request.app.state.interaction_service
    service.reload_dataset(settings.DATASET_PATH)
    return {"message": "Dataset uploaded and reloaded.", "rows": service.dataset_size()}


@router.get("/dataset/info")
def dataset_info(request: Request, _: User = Depends(get_current_admin)):
    service = request.app.state.interaction_service
    stats   = service.get_stats()
    return {
        "dataset_path":      service.csv_path,
        "total_pairs":       stats["total_pairs"],
        "with_interactions": stats["with_interactions"],
        "no_interaction":    stats["no_interaction"],
    }


# ─── Logs ─────────────────────────────────────────────────────────────────────

@router.get("/logs", response_model=List[PredictionLogOut])
def get_logs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), _: User = Depends(get_current_admin)):
    return db.query(PredictionLog).order_by(PredictionLog.created_at.desc()).offset(skip).limit(limit).all()


# ─── Stats ────────────────────────────────────────────────────────────────────

@router.get("/stats", response_model=SystemStats)
def system_stats(request: Request, db: Session = Depends(get_db), _: User = Depends(get_current_admin)):
    service = request.app.state.interaction_service
    return SystemStats(
        total_users      = db.query(func.count(User.id)).scalar() or 0,
        active_users     = db.query(func.count(User.id)).filter(User.status == "active").scalar() or 0,
        suspended_users  = db.query(func.count(User.id)).filter(User.status == "suspended").scalar() or 0,
        total_predictions= db.query(func.count(PredictionLog.id)).scalar() or 0,
        dataset_size     = service.dataset_size(),
    )


# ─── ML Model Metrics ─────────────────────────────────────────────────────────

@router.get("/metrics")
def model_metrics(request: Request, _: User = Depends(get_current_admin)):
    """Returns real ML model metrics from training, plus live prediction stats."""
    service = request.app.state.interaction_service
    ml_metrics = service.get_model_metrics()

    if ml_metrics:
        return {
            "model_trained":    True,
            "best_model":       ml_metrics.get("best_model"),
            "accuracy":         ml_metrics.get("accuracy"),
            "precision":        ml_metrics.get("precision"),
            "recall":           ml_metrics.get("recall"),
            "f1_score":         ml_metrics.get("f1_score"),
            "true_positives":   ml_metrics.get("true_positives"),
            "true_negatives":   ml_metrics.get("true_negatives"),
            "false_positives":  ml_metrics.get("false_positives"),
            "false_negatives":  ml_metrics.get("false_negatives"),
            "train_size":       ml_metrics.get("train_size"),
            "test_size":        ml_metrics.get("test_size"),
            "total_samples":    ml_metrics.get("total_samples"),
            "all_models":       ml_metrics.get("all_models", {}),
        }
    else:
        return {
            "model_trained": False,
            "message":       "No trained model found. Run train_model.py first.",
        }


@router.post("/model/reload")
def reload_model(request: Request, _: User = Depends(get_current_admin)):
    """Reload the ML model after retraining."""
    service = request.app.state.interaction_service
    service.reload_model()
    metrics = service.get_model_metrics()
    return {
        "message":       "Model reloaded successfully.",
        "model_trained": metrics is not None,
        "best_model":    metrics.get("best_model") if metrics else None,
    }
