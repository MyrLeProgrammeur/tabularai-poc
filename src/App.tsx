import { useState } from "react"
import axios from "axios"
import { Loader2, Download, Zap, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileDropzone } from "@/components/FileDropzone"
import { MetricsPanel } from "@/components/MetricsPanel"
import "./index.css"

type Stage = "idle" | "loading" | "done" | "error"

interface PredictResponse {
  metrics: {
    model: string
    auprc?: number
    auc_roc?: number
    f1?: number
    elapsed_s: number
    train_rows: number
    test_rows: number
    fraud_in_test?: number
  }
  download_token: string
  has_labels: boolean
}

function App() {
  const [trainFile, setTrainFile] = useState<File | null>(null)
  const [testFile, setTestFile] = useState<File | null>(null)
  const [targetCol, setTargetCol] = useState("")
  const [model, setModel] = useState<"seldon-flash" | "seldon-small" | "seldon-large">("seldon-small")
  const [stage, setStage] = useState<Stage>("idle")
  const [result, setResult] = useState<PredictResponse | null>(null)
  const [error, setError] = useState("")
  const [progress, setProgress] = useState("")

  const canRun = trainFile && testFile && targetCol.trim()

  async function handleRun() {
    if (!canRun) return
    setStage("loading")
    setError("")
    setResult(null)
    setProgress("Uploading files…")

    const fd = new FormData()
    fd.append("train_file", trainFile)
    fd.append("test_file", testFile)
    fd.append("target_column", targetCol.trim())
    fd.append("model", model)

    try {
      setProgress("Running predictions (this may take 30–60s)…")
      const res = await axios.post<PredictResponse>("/api/predict", fd, {
        timeout: 300_000,
      })
      setResult(res.data)
      setStage("done")
    } catch (e: unknown) {
      const msg =
        axios.isAxiosError(e) && e.response?.data?.detail
          ? e.response.data.detail
          : "Something went wrong. Is the backend running?"
      setError(msg)
      setStage("error")
    }
  }

  function handleDownload() {
    if (!result) return
    window.open(`/api/download/${result.download_token}`, "_blank")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-lg">TabularAI</span>
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">PoC</span>
          </div>
          <span className="text-sm text-muted-foreground hidden md:block">
            Instant tabular predictions — no training required
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Predict anything from a spreadsheet
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Upload your training data and a test file. Get predictions in seconds.
            No model training. No infrastructure.
          </p>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Run a prediction</CardTitle>
            <CardDescription>
              Train CSV must contain your target column. Test CSV can have it too — we'll compute metrics if so.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <FileDropzone
                label="Training data"
                hint="Must include your target column"
                file={trainFile}
                onFile={setTrainFile}
              />
              <FileDropzone
                label="Test data"
                hint="Include target column for evaluation metrics"
                file={testFile}
                onFile={setTestFile}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Target column name</label>
                <input
                  type="text"
                  placeholder="e.g. Class, churn, price…"
                  value={targetCol}
                  onChange={(e) => setTargetCol(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Model</label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value as typeof model)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="seldon-flash">seldon-flash — fastest</option>
                  <option value="seldon-small">seldon-small — balanced</option>
                  <option value="seldon-large">seldon-large — most accurate</option>
                </select>
              </div>
            </div>

            <Button
              className="w-full h-12 text-base"
              disabled={!canRun || stage === "loading"}
              onClick={handleRun}
            >
              {stage === "loading" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {progress}
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Run prediction
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Error */}
        {stage === "error" && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">Prediction failed</p>
                  <p className="text-sm text-muted-foreground mt-1">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {stage === "done" && result && (
          <div className="space-y-4">
            {result.has_labels && <MetricsPanel metrics={result.metrics} />}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Predictions ready</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {result.metrics.test_rows.toLocaleString()} rows scored
                    </p>
                  </div>
                  <Button onClick={handleDownload} variant="outline">
                    <Download className="h-4 w-4" />
                    Download CSV
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <footer className="text-center text-xs text-muted-foreground py-8">
        Powered by TabICLv2 &mdash; open-source tabular foundation model
      </footer>
    </div>
  )
}

export default App
