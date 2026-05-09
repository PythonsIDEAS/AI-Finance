"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { Brain, TrendingUp, Sparkles, Loader2 } from "lucide-react";

export default function InsightsPage() {
  const [prediction, setPrediction] = useState<any>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingPrediction, setLoadingPrediction] = useState(true);

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        const res = await api.get("/insights/predict");
        setPrediction(res.data);
      } catch (err) {
        console.error("Failed to load predictions", err);
      } finally {
        setLoadingPrediction(false);
      }
    };
    fetchPrediction();
  }, []);

  const handleGenerateSummary = async () => {
    setLoadingSummary(true);
    try {
      const res = await api.get("/insights/ai-summary");
      setAiSummary(res.data.summary);
    } catch (err) {
      setAiSummary("An error occurred while communicating with the AI service. Please try again.");
    } finally {
      setLoadingSummary(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Brain className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">AI Insights & Forecasting</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Forecast Card */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <span>Next Month Forecast</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center items-center text-center p-6 space-y-4">
            {loadingPrediction ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : prediction ? (
              <>
                <div className="text-5xl font-bold text-primary">
                  ${prediction.predicted_expense.toFixed(2)}
                </div>
                <p className="text-muted-foreground max-w-sm">
                  {prediction.message}
                </p>
                <div className="text-xs text-muted-foreground bg-accent px-3 py-1 rounded-full mt-4">
                  Based on historical linear trends
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">Unable to generate prediction.</p>
            )}
          </CardContent>
        </Card>

        {/* AI Summary Card */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              <span>Smart Financial Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="flex-1 bg-accent/50 rounded-md p-4 mb-4 overflow-y-auto min-h-[150px]">
              {loadingSummary ? (
                <div className="h-full flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <p className="text-sm">Analyzing your recent transactions...</p>
                </div>
              ) : aiSummary ? (
                <div className="prose prose-sm dark:prose-invert">
                  {aiSummary}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-center text-muted-foreground text-sm">
                  Click the button below to generate a personalized AI summary of your last 30 days of spending.
                </div>
              )}
            </div>
            
            <Button 
              onClick={handleGenerateSummary} 
              disabled={loadingSummary}
              className="w-full"
            >
              {loadingSummary ? "Generating..." : "Generate AI Summary"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
