from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import engine, Base
from app.services.interaction_service import InteractionService

# Import all models so SQLAlchemy creates tables
from app.models import user, prediction_log  # noqa: F401

from app.routers import auth, users, predict, admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create DB tables + load dataset
    Base.metadata.create_all(bind=engine)
    app.state.interaction_service = InteractionService(settings.DATASET_PATH)
    _create_default_admin()
    print(f"✅ MediMind API started | Dataset: {app.state.interaction_service.dataset_size()} rows")
    yield
    # Shutdown (nothing to clean up for SQLite)
    print("MediMind API shutting down.")


def _create_default_admin():
    """Create a default admin account if none exists."""
    from app.core.database import SessionLocal
    from app.models.user import User
    from app.core.security import hash_password

    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.is_admin == True).first()
        if not existing:
            admin = User(
                name="MediMind Admin",
                email="admin@medimind.com",
                hashed_password=hash_password("Admin@1234"),
                role="admin",
                status="active",
                is_admin=True,
            )
            db.add(admin)
            db.commit()
            print("✅ Default admin created: admin@medimind.com / Admin@1234")
    finally:
        db.close()


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="AI-powered Drug Interaction & ADR Prediction API",
    lifespan=lifespan,
)

# CORS — allow React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(predict.router)
app.include_router(admin.router)


@app.get("/", tags=["Health"])
def root():
    return {
        "message": "MediMind API is running 🚀",
        "docs": "/docs",
        "version": "1.0.0",
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
