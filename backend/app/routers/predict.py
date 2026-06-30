from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.prediction_log import PredictionLog
from app.schemas import InteractionRequest, InteractionResponse
from app.utils.deps import get_optional_user

router = APIRouter(prefix="/predict", tags=["Predictions"])


@router.post("/interaction", response_model=InteractionResponse)
def predict_interaction(
    payload: InteractionRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user=Depends(get_optional_user),
):
    # Get service from app state
    service = request.app.state.interaction_service

    result = service.find_interaction(
        drug1=payload.drug1,
        drug2=payload.drug2,
        age=payload.age,
        gender=payload.gender,
        health_conditions=payload.health_conditions,
    )

    # Log prediction
    log = PredictionLog(
        user_id=current_user.id if current_user else None,
        drug1=result["drug1"],
        drug2=result["drug2"],
        age=payload.age,
        gender=payload.gender,
        health_conditions=", ".join(payload.health_conditions) if payload.health_conditions else None,
        risk_level=result.get("risk_level"),
        interaction_type=result.get("interaction_type"),
        interaction_effect=result.get("interaction_effect"),
        interaction_description=result.get("interaction_description"),
        confidence_score=result.get("confidence_score"),
        found=str(result.get("found")),
    )
    db.add(log)
    db.commit()

    return result


@router.get("/drugs/search")
def search_drugs(q: str, request: Request, limit: int = 20):
    """Autocomplete endpoint — returns matching drug names."""
    service = request.app.state.interaction_service
    drugs = service.search_drugs(q, limit=limit)
    return {"drugs": drugs, "total": len(drugs)}
