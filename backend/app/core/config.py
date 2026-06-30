from pydantic_settings import BaseSettings
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent  # project root


class Settings(BaseSettings):
    # App
    APP_NAME: str = "MediMind API"
    DEBUG: bool = True

    # Security
    SECRET_KEY: str = "medimind-super-secret-key-change-in-production-2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Database
    DATABASE_URL: str = f"sqlite:///{BASE_DIR}/medimind.db"

    # Dataset
    DATASET_PATH: str = str(BASE_DIR / "dataset" / "medimind_interactions_dataset.csv")

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
