from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import models, schemas, database, deps

router = APIRouter(prefix="/api/budgets", tags=["budgets"])

@router.post("/", response_model=schemas.BudgetResponse)
def create_or_update_budget(
    budget: schemas.BudgetCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    # Check if budget for this category and month already exists
    existing_budget = db.query(models.Budget).filter(
        models.Budget.user_id == current_user.id,
        models.Budget.category == budget.category,
        models.Budget.month == budget.month
    ).first()

    if existing_budget:
        existing_budget.amount = budget.amount
        db.commit()
        db.refresh(existing_budget)
        return existing_budget
    else:
        new_budget = models.Budget(**budget.model_dump(), user_id=current_user.id)
        db.add(new_budget)
        db.commit()
        db.refresh(new_budget)
        return new_budget

@router.get("/{month}", response_model=List[schemas.BudgetResponse])
def get_budgets_by_month(
    month: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    budgets = db.query(models.Budget).filter(
        models.Budget.user_id == current_user.id,
        models.Budget.month == month
    ).all()
    return budgets

@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget(
    budget_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    budget = db.query(models.Budget).filter(
        models.Budget.id == budget_id,
        models.Budget.user_id == current_user.id
    ).first()
    
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
        
    db.delete(budget)
    db.commit()
    return None
