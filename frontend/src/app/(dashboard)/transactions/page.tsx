"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api";
import { format, parseISO } from "date-fns";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Form state
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("food");
  const [description, setDescription] = useState("");

  const fetchTransactions = async () => {
    try {
      const res = await api.get("/transactions/");
      setTransactions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/transactions/", {
        amount: parseFloat(amount),
        type,
        category,
        description,
      });
      setShowAddForm(false);
      setAmount("");
      setDescription("");
      fetchTransactions();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    try {
      await api.delete(`/transactions/${id}`);
      fetchTransactions();
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    try {
      await api.post("/transactions/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      fetchTransactions();
      alert("Transactions imported successfully!");
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to import transactions.");
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = ''; // Reset file input
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
        <div className="flex space-x-2">
          <div>
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              id="csv-upload" 
              onChange={handleFileUpload}
              disabled={isUploading}
            />
            <label 
              htmlFor="csv-upload" 
              className={`cursor-pointer inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors bg-secondary text-secondary-foreground hover:bg-secondary/80 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
            >
              {isUploading ? "Importing..." : "Import CSV"}
            </label>
          </div>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? "Cancel" : "Add Transaction"}
          </Button>
        </div>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddTransaction} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm">Amount</label>
                <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm">Type</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={type} onChange={(e) => setType(e.target.value)}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm">Category</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={category} onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="food">Food</option>
                  <option value="transport">Transport</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="education">Education</option>
                  <option value="subscriptions">Subscriptions</option>
                  <option value="salary">Salary</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm">Description (Optional)</label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="col-span-1 md:col-span-2 pt-2">
                <Button type="submit">Save Transaction</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b border-border">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Description</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Category</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Amount</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {transactions.map((t) => (
                  <tr key={t.id} className="border-b border-border transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <td className="p-4 align-middle">{format(parseISO(t.date), "MMM dd, yyyy")}</td>
                    <td className="p-4 align-middle">{t.description || "-"}</td>
                    <td className="p-4 align-middle capitalize">{t.category}</td>
                    <td className={`p-4 align-middle font-medium ${t.type === "income" ? "text-green-500" : "text-red-500"}`}>
                      {t.type === "income" ? "+" : "-"}${t.amount.toFixed(2)}
                    </td>
                    <td className="p-4 align-middle">
                      <Button variant="danger" className="h-8 px-2 py-1 text-xs" onClick={() => handleDelete(t.id)}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="h-24 text-center align-middle text-muted-foreground">
                      No transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
