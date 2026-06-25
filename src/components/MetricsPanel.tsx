import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Clock, Database } from "lucide-react"

interface Metrics {
  auprc?: number
  auc_roc?: number
  f1?: number
  elapsed_s: number
  train_rows: number
  test_rows: number
  fraud_in_test?: number
  model: string
}

interface Props {
  metrics: Metrics
}

function MetricTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border bg-muted/30 p-4">
      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</span>
      <span className="text-2xl font-bold text-foreground">{value}</span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  )
}

export function MetricsPanel({ metrics }: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Results</CardTitle>
          <Badge variant="success">Done</Badge>
        </div>
        <p className="text-xs text-muted-foreground">Model: {metrics.model}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {metrics.auprc !== undefined && (
            <MetricTile label="AUPRC" value={(metrics.auprc * 100).toFixed(1) + "%"} sub="Primary metric" />
          )}
          {metrics.auc_roc !== undefined && (
            <MetricTile label="AUC-ROC" value={(metrics.auc_roc * 100).toFixed(1) + "%"} />
          )}
          {metrics.f1 !== undefined && (
            <MetricTile label="F1 Score" value={(metrics.f1 * 100).toFixed(1) + "%"} sub="threshold 0.5" />
          )}
          <MetricTile
            label="Inference time"
            value={metrics.elapsed_s.toFixed(1) + "s"}
          />
        </div>

        <div className="flex gap-4 text-xs text-muted-foreground pt-1">
          <span className="flex items-center gap-1">
            <Database className="h-3 w-3" />
            {metrics.train_rows.toLocaleString()} train rows
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {metrics.test_rows.toLocaleString()} test rows
          </span>
          {metrics.fraud_in_test !== undefined && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {metrics.fraud_in_test} positive cases
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
