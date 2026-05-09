from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import auth, transactions, budgets, notifications, insights

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Personal Finance Dashboard API")

# Configure CORS
origins = [
    "http://localhost:3000", # Next.js frontend
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(transactions.router)
app.include_router(budgets.router)
app.include_router(notifications.router)
app.include_router(insights.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to AI Personal Finance Dashboard API"}
