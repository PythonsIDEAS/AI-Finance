"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { api } from "@/lib/api";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#64748b'];

export default function AnalyticsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTx = async () => {
      try {
        const res = await api.get("/transactions/");
        setTransactions(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTx();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate category distribution (expenses only)
  const categoryDataMap: Record<string, number> = {};
  transactions.forEach(tx => {
    if (tx.type === "expense") {
      categoryDataMap[tx.category] = (categoryDataMap[tx.category] || 0) + tx.amount;
    }
  });

  const pieData = Object.keys(categoryDataMap).map(key => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value: categoryDataMap[key]
  })).sort((a, b) => b.value - a.value);

  // Calculate Monthly Trends (Income vs Expense)
  const monthlyDataMap: Record<string, { name: string, expense: number, income: number }> = {};
  
  transactions.forEach(tx => {
    // tx.date is "YYYY-MM-DD"
    const monthPrefix = tx.date.substring(0, 7); // "YYYY-MM"
    if (!monthlyDataMap[monthPrefix]) {
      const d = new Date(tx.date);
      monthlyDataMap[monthPrefix] = { 
        name: format(d, 'MMM yy'), 
        expense: 0, 
        income: 0 
      };
    }
    if (tx.type === "expense") {
      monthlyDataMap[monthPrefix].expense += tx.amount;
    } else {
      monthlyDataMap[monthPrefix].income += tx.amount;
    }
  });

  const barData = Object.values(monthlyDataMap).reverse(); // Oldest to newest (since tx might be sorted desc)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Advanced Analytics</h1>
        <p className="text-muted-foreground mt-1">Deep dive into your financial data and spending trends.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => `$${value.toFixed(2)}`}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No expense data available.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cash Flow Trends</CardTitle>
          </CardHeader>
          <CardContent>
            {barData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                    <Tooltip 
                      formatter={(value: number) => `$${value.toFixed(2)}`}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                    />
                    <Legend />
                    <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
               <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No transaction data available.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
