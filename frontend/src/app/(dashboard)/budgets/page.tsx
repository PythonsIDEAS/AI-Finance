"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api";

const CATEGORIES = ["food", "transport", "entertainment", "education", "subscriptions", "other"];

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form state
  const [category, setCategory] = useState("food");
  const [amount, setAmount] = useState("");

  const currentMonth = format(new Date(), "yyyy-MM");

  const fetchData = async () => {
    try {
      const [budgetsRes, txRes] = await Promise.all([
        api.get(`/budgets/${currentMonth}`),
        api.get("/transactions/")
      ]);
      setBudgets(budgetsRes.data);
      setTransactions(txRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/budgets/", {
        category,
        amount: parseFloat(amount),
        month: currentMonth
      });
      setShowAddForm(false);
      setAmount("");
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Calculate spent amounts per category for the current month
  const categorySpending = transactions.reduce((acc: any, tx: any) => {
    if (tx.type === "expense" && tx.date.startsWith(currentMonth)) {
      acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
    }
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Monthly Budgets</h1>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? "Cancel" : "Set Budget"}
        </Button>
      </div>

      <div className="text-muted-foreground text-sm">
        Viewing budgets for <span className="font-semibold text-foreground">{format(new Date(), "MMMM yyyy")}</span>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Set Category Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveBudget} className="flex flex-col md:flex-row gap-4 items-end">
              <div className="space-y-2 w-full md:w-1/3">
                <label className="text-sm">Category</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={category} onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c} className="capitalize">{c}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 w-full md:w-1/3">
                <label className="text-sm">Monthly Limit ($)</label>
                <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              </div>
              <div className="w-full md:w-1/3 pt-2">
                <Button type="submit" className="w-full">Save Budget</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {budgets.length === 0 ? (
          <div className="col-span-full text-center text-muted-foreground py-10 bg-card rounded-xl border border-border border-dashed">
            No budgets set for this month. Click "Set Budget" to start tracking.
          </div>
        ) : (
          budgets.map(budget => {
            const spent = categorySpending[budget.category] || 0;
            const percentage = Math.min((spent / budget.amount) * 100, 100);
            const isOver = spent > budget.amount;

            return (
              <Card key={budget.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="capitalize flex justify-between items-center">
                    {budget.category}
                    <span className="text-sm font-normal text-muted-foreground">
                      ${spent.toFixed(2)} / ${budget.amount.toFixed(2)}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-4 w-full bg-secondary rounded-full overflow-hidden mt-2">
                    <div 
                      className={`h-full transition-all duration-500 ease-in-out ${isOver ? 'bg-red-500' : percentage > 80 ? 'bg-yellow-500' : 'bg-primary'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  {isOver && (
                    <p className="text-xs text-red-500 mt-2 font-medium">Budget exceeded by ${(spent - budget.amount).toFixed(2)}!</p>
                  )}
                  {!isOver && (
                    <p className="text-xs text-muted-foreground mt-2">${(budget.amount - spent).toFixed(2)} remaining</p>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
