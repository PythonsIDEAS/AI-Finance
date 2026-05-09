"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { api } from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format, parseISO } from "date-fns";
import { DollarSign, ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react";

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await api.get("/transactions/");
        setTransactions(res.data);
      } catch (err: any) {
        if (err.response?.status === 401) {
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [router]);

  if (loading) {
    return <div className="text-center py-10">Loading dashboard...</div>;
  }

  const income = transactions.filter((t) => t.type === "income").reduce((acc, t) => acc + t.amount, 0);
  const expenses = transactions.filter((t) => t.type === "expense").reduce((acc, t) => acc + t.amount, 0);
  const balance = income - expenses;

  // Process data for charts
  const categoryData = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc: any[], t) => {
      const existing = acc.find((c) => c.name === t.category);
      if (existing) {
        existing.value += t.amount;
      } else {
        acc.push({ name: t.category, value: t.amount });
      }
      return acc;
    }, []);

  const COLORS = ["#6d28d9", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#f5f3ff"];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${balance.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">${income.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">${expenses.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a" }}
                      itemStyle={{ color: "#fafafa" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No expenses recorded.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactions.slice(0, 5).map((t) => (
                <div key={t.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t.description || t.category}</p>
                    <p className="text-sm text-muted-foreground">{format(parseISO(t.date), "MMM dd, yyyy")}</p>
                  </div>
                  <div className={`font-bold ${t.type === "income" ? "text-green-500" : "text-red-500"}`}>
                    {t.type === "income" ? "+" : "-"}${t.amount.toFixed(2)}
                  </div>
                </div>
              ))}
              {transactions.length === 0 && (
                <div className="text-center text-muted-foreground py-4">No transactions found.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
