from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
import pandas as pd
from .. import models, database, deps
from ..services.ai_service import generate_financial_summary

router = APIRouter(prefix="/api/insights", tags=["insights"])

@router.get("/predict")
def predict_spending(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    """
    Predict next month's spending based on historical data.
    Uses simple linear extrapolation if enough data, or just an average.
    """
    # Get all expenses
    expenses = db.query(models.Transaction).filter(
        models.Transaction.user_id == current_user.id,
        models.Transaction.type == "expense"
    ).all()

    if not expenses:
        return {"predicted_expense": 0, "message": "Not enough data to predict."}

    # Convert to pandas DataFrame for easy grouping
    df = pd.DataFrame([{
        "amount": t.amount,
        "date": t.date,
        "category": t.category
    } for t in expenses])

    # Group by month
    df['month'] = df['date'].dt.to_period('M')
    monthly_totals = df.groupby('month')['amount'].sum().reset_index()

    if len(monthly_totals) < 2:
        # Just use the current month's total if only 1 month exists
        prediction = float(monthly_totals['amount'].iloc[0])
    else:
        # Simple moving average of the last 3 months
        recent_months = monthly_totals.tail(3)
        prediction = float(recent_months['amount'].mean())

    return {
        "predicted_expense": round(prediction, 2),
        "message": "Based on your recent history, this is your forecasted expense."
    }

@router.get("/ai-summary")
async def get_ai_summary(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    """
    Generates a natural language summary of the last 30 days of transactions.
    """
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    recent_txs = db.query(models.Transaction).filter(
        models.Transaction.user_id == current_user.id,
        models.Transaction.date >= thirty_days_ago
    ).all()

    if not recent_txs:
        return {"summary": "You have no transactions in the last 30 days to analyze."}

    # Format data compactly to save token space
    tx_strings = []
    for t in recent_txs:
        tx_strings.append(f"{t.date.strftime('%Y-%m-%d')}: {t.type} ${t.amount} ({t.category})")
    
    tx_data = "\n".join(tx_strings)
    
    # This call might take a few seconds
    summary = await generate_financial_summary(tx_data)
    
    return {"summary": summary}
