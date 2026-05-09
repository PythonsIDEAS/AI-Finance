from typing import List
import csv
import io
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import extract, func
from .. import models, schemas, database, deps

router = APIRouter(prefix="/api/transactions", tags=["transactions"])

@router.post("/", response_model=schemas.TransactionResponse)
def create_transaction(
    transaction: schemas.TransactionCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    new_tx = models.Transaction(**transaction.model_dump(), user_id=current_user.id)
    db.add(new_tx)
    db.commit()
    db.refresh(new_tx)
    
    # Check budget overflow if it's an expense
    if transaction.type == "expense":
        tx_month = new_tx.date.strftime("%Y-%m")
        budget = db.query(models.Budget).filter(
            models.Budget.user_id == current_user.id,
            models.Budget.category == transaction.category,
            models.Budget.month == tx_month
        ).first()
        
        if budget:
            # Calculate total spent in this category this month
            start_date = new_tx.date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            # Rough end date calculation (next month's 1st)
            if start_date.month == 12:
                end_date = start_date.replace(year=start_date.year + 1, month=1)
            else:
                end_date = start_date.replace(month=start_date.month + 1)
                
            total_spent = db.query(models.Transaction).filter(
                models.Transaction.user_id == current_user.id,
                models.Transaction.category == transaction.category,
                models.Transaction.type == "expense",
                models.Transaction.date >= start_date,
                models.Transaction.date < end_date
            ).with_entities(func.sum(models.Transaction.amount)).scalar() or 0
            
            if total_spent > budget.amount:
                # Create notification
                notif = models.Notification(
                    user_id=current_user.id,
                    type="budget_alert",
                    message=f"You have exceeded your {transaction.category} budget for {tx_month}!"
                )
                db.add(notif)
                db.commit()

    return new_tx

@router.get("/", response_model=List[schemas.TransactionResponse])
def get_transactions(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    transactions = db.query(models.Transaction).filter(models.Transaction.user_id == current_user.id).order_by(models.Transaction.date.desc()).all()
    return transactions

@router.post("/upload", response_model=dict)
async def upload_transactions(
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")

    contents = await file.read()
    decoded = contents.decode('utf-8')
    reader = csv.DictReader(io.StringIO(decoded))

    required_fields = {"amount", "type", "category", "date"}
    if not required_fields.issubset(set(reader.fieldnames or [])):
        raise HTTPException(status_code=400, detail=f"CSV must contain headers: {required_fields}")

    inserted_count = 0
    for row in reader:
        try:
            amount = float(row["amount"])
            type = row["type"]
            category = row["category"]
            date_obj = datetime.strptime(row["date"], "%Y-%m-%d")
            description = row.get("description", "")
            
            new_tx = models.Transaction(
                amount=amount,
                type=type,
                category=category,
                date=date_obj,
                description=description,
                user_id=current_user.id
            )
            db.add(new_tx)
            inserted_count += 1
        except Exception as e:
            # Skip invalid rows or handle error
            print(f"Skipping row due to error: {e}")
            continue

    db.commit()
    return {"message": f"Successfully imported {inserted_count} transactions"}

@router.put("/{tx_id}", response_model=schemas.TransactionResponse)
def update_transaction(
    tx_id: int,
    transaction: schemas.TransactionUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    tx_query = db.query(models.Transaction).filter(models.Transaction.id == tx_id, models.Transaction.user_id == current_user.id)
    db_tx = tx_query.first()
    
    if not db_tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    update_data = transaction.model_dump(exclude_unset=True)
    tx_query.update(update_data, synchronize_session=False)
    db.commit()
    db.refresh(db_tx)
    return db_tx

@router.delete("/{tx_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(
    tx_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    tx_query = db.query(models.Transaction).filter(models.Transaction.id == tx_id, models.Transaction.user_id == current_user.id)
    db_tx = tx_query.first()
    
    if not db_tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    tx_query.delete(synchronize_session=False)
    db.commit()
    return None
