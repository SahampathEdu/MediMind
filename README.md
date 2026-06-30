# MediMind – Backend Setup & Run Guide

## Project Structure

```
MediMind/
├── backend/
│   ├── app/
│   │   ├── core/           # config, database, security
│   │   ├── models/         # SQLAlchemy DB models
│   │   ├── routers/        # API route handlers
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Helpers (deps, normalizer)
│   │   ├── schemas.py      # Pydantic request/response models
│   │   └── main.py         # FastAPI app entry point
│   ├── .env
│   ├── run.py
│   └── requirements.txt
├── dataset/
│   └── medimind_interactions_balanced.csv   ← your Kaggle CSV goes here
└── README.md
```

---

## Prerequisites

- Python 3.10+ installed
- VS Code with Python extension

---

## Step 1 – Open Project in VS Code

Open the `MediMind` folder in VS Code:
```
File → Open Folder → select MediMind/
```

---

## Step 2 – Open Terminal in VS Code

```
Terminal → New Terminal
```

---

## Step 3 – Navigate to Backend

```bash
cd backend
```

---

## Step 4 – Create a Virtual Environment

```bash
python -m venv venv
```

Activate it:

- **Windows:**
  ```bash
  venv\Scripts\activate
  ```
- **Mac/Linux:**
  ```bash
  source venv/bin/activate
  ```

You should see `(venv)` in your terminal.

---

## Step 5 – Install Dependencies

```bash
pip install -r requirements.txt
```

---

## Step 6 – Add Your Dataset

Place your Kaggle CSV file here:
```
MediMind/dataset/medimind_interactions_balanced.csv
```

The file must have these columns:
```
drug1, drug2, interaction_description, interaction_effect, interaction_type, label, source, pair_key
```

> A sample dataset is already included so you can test without Kaggle data.

---

## Step 7 – Run the Backend

```bash
python run.py
```

Or alternatively:
```bash
uvicorn app.main:app --reload
```

You should see:
```
✅ MediMind API started | Dataset: N rows
✅ Default admin created: admin@medimind.com / Admin@1234
INFO:     Uvicorn running on http://0.0.0.0:8000
```

---

## Step 8 – Test the API

Open your browser: **http://localhost:8000/docs**

This opens the interactive Swagger UI where you can test all endpoints.

---

## Default Admin Account

| Field    | Value                  |
|----------|------------------------|
| Email    | admin@medimind.com     |
| Password | Admin@1234             |

> ⚠️ Change this password before deploying to production!

---

## API Endpoints Summary

### Authentication
| Method | Endpoint         | Description        |
|--------|------------------|--------------------|
| POST   | /auth/register   | Register new user  |
| POST   | /auth/login      | Login, get JWT     |

### Users (requires login)
| Method | Endpoint         | Description             |
|--------|------------------|-------------------------|
| GET    | /users/me        | Get your profile        |
| PUT    | /users/me        | Update your name        |
| GET    | /users/my-history| Your prediction history |

### Predictions
| Method | Endpoint                    | Description              |
|--------|-----------------------------|--------------------------|
| POST   | /predict/interaction        | Check drug interaction   |
| GET    | /predict/drugs/search?q=    | Autocomplete drug names  |

### Admin (requires admin account)
| Method | Endpoint                    | Description              |
|--------|-----------------------------|--------------------------|
| GET    | /admin/users                | List all users           |
| PUT    | /admin/users/{id}           | Update user role/status  |
| POST   | /admin/users/{id}/suspend   | Suspend a user           |
| POST   | /admin/users/{id}/activate  | Activate a user          |
| DELETE | /admin/users/{id}           | Delete a user            |
| POST   | /admin/dataset/upload       | Upload new dataset CSV   |
| GET    | /admin/dataset/info         | Dataset info             |
| GET    | /admin/logs                 | All prediction logs      |
| GET    | /admin/stats                | System statistics        |
| GET    | /admin/metrics              | Model metrics dashboard  |

---

## Example: Predict Interaction

**POST** `/predict/interaction`

```json
{
  "drug1": "aspirin",
  "drug2": "warfarin",
  "age": 70,
  "gender": "male",
  "health_conditions": ["kidney disease"]
}
```

**Response:**
```json
{
  "found": true,
  "drug1": "aspirin",
  "drug2": "warfarin",
  "risk_level": "High",
  "interaction_type": "increase_effect",
  "interaction_effect": "increase the anticoagulant activities",
  "interaction_description": "Aspirin increases the anticoagulant effect of Warfarin",
  "confidence_score": 0.92,
  "source": "db_drug_interactions",
  "message": "Interaction found.",
  "patient_risk_note": "⚠️ High-risk interaction detected. Consult a doctor immediately. Elderly patients may be more sensitive to this interaction. Renal impairment may intensify this interaction."
}
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `ModuleNotFoundError` | Make sure venv is activated and `pip install -r requirements.txt` ran |
| Port 8000 in use | Run `uvicorn app.main:app --reload --port 8001` |
| Dataset not found | Add your CSV to `MediMind/dataset/medimind_interactions_balanced.csv` |
| Login fails | Use the default admin credentials above, or register a new user first |

