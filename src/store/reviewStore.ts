import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

// ── Domain Types ─────────────────────────────────────────────────────────────

export type Severity = 'critical' | 'warning' | 'info'

export type ReviewStatus =
  | 'idle'
  | 'waiting'
  | 'running'
  | 'paused_hitl'
  | 'resuming'
  | 'complete'
  | 'failed'

export interface NodeTelemetry {
  node_name: string
  agent?: string
  execution_time_ms: number
  input_tokens: number
  output_tokens: number
  tokens?: number
  total_tokens?: number
  cost_usd: number
}

export interface AgentFinding {
  file_path: string
  line_number: number
  start_line: number | null
  diff_citation: string
  severity: Severity
  description: string
  suggestion: string
  /** UI-only state – not sent to backend */
  _dismissed?: boolean
  _edited?: boolean
}

// ── Store Shape ───────────────────────────────────────────────────────────────

interface ReviewState {
  run_id: string | null
  pr_number: number | null
  repository: string | null
  status: ReviewStatus
  pr_quality_score: number
  telemetry: NodeTelemetry[]
  findings: AgentFinding[]
  total_cost_usd: number
  isSubmitting: boolean
  error: string | null
}

interface ReviewActions {
  /** Initialise store with a new review run */
  initRun: (run_id: string, pr_number: number, repository: string) => void

  /** Update the overall pipeline status */
  setStatus: (status: ReviewStatus) => void

  /** Append a single NodeTelemetry tick from Realtime */
  appendTelemetry: (tick: NodeTelemetry) => void

  /** Replace the entire findings array (from Realtime snapshot) */
  setFindings: (findings: AgentFinding[]) => void

  /** Edit the suggestion text for a specific finding in-place */
  editFindingSuggestion: (index: number, suggestion: string) => void

  /** Mark a finding as dismissed – it will be excluded from the approve payload */
  dismissFinding: (index: number) => void

  /** Accept the current suggestion (no-op visually, but marks _edited false) */
  acceptFinding: (index: number) => void

  /** Set quality score from Realtime update */
  setPrQualityScore: (score: number) => void

  /** Set error message */
  setError: (error: string | null) => void

  /** Toggle submitting state for the Approve button */
  setSubmitting: (value: boolean) => void

  /** Compute total USD cost across all telemetry nodes */
  recomputeCost: () => void

  /** Hard reset – clears all state */
  reset: () => void
}

// ── Initial State ─────────────────────────────────────────────────────────────

const initialState: ReviewState = {
  run_id: null,
  pr_number: null,
  repository: null,
  status: 'idle',
  pr_quality_score: 0,
  telemetry: [],
  findings: [],
  total_cost_usd: 0,
  isSubmitting: false,
  error: null,
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useReviewStore = create<ReviewState & ReviewActions>()(
  immer((set) => ({
    ...initialState,

    initRun: (run_id, pr_number, repository) =>
      set((state) => {
        state.run_id = run_id
        state.pr_number = pr_number
        state.repository = repository
        state.status = 'waiting'
        state.findings = []
        state.telemetry = []
        state.total_cost_usd = 0
        state.error = null
      }),

    setStatus: (status) =>
      set((state) => {
        state.status = status
      }),

    appendTelemetry: (tick) =>
      set((state) => {
        state.telemetry.push(tick)
        state.total_cost_usd = state.telemetry.reduce((acc, t) => acc + t.cost_usd, 0)
      }),

    setFindings: (findings) =>
      set((state) => {
        state.findings = findings
      }),

    editFindingSuggestion: (index, suggestion) =>
      set((state) => {
        if (state.findings[index]) {
          state.findings[index].suggestion = suggestion
          state.findings[index]._edited = true
          state.findings[index]._dismissed = false
        }
      }),

    dismissFinding: (index) =>
      set((state) => {
        if (state.findings[index]) {
          state.findings[index]._dismissed = true
        }
      }),

    acceptFinding: (index) =>
      set((state) => {
        if (state.findings[index]) {
          state.findings[index]._edited = false
          state.findings[index]._dismissed = false
        }
      }),

    setPrQualityScore: (score) =>
      set((state) => {
        state.pr_quality_score = score
      }),

    setError: (error) =>
      set((state) => {
        state.error = error
      }),

    setSubmitting: (value) =>
      set((state) => {
        state.isSubmitting = value
      }),

    recomputeCost: () =>
      set((state) => {
        state.total_cost_usd = state.telemetry.reduce((acc, t) => acc + t.cost_usd, 0)
      }),

    reset: () => set(() => ({ ...initialState })),
  }))
)

// ── Derived Selectors ─────────────────────────────────────────────────────────

/** Returns only non-dismissed findings for the approve payload */
export const selectActiveFindings = (state: ReviewState) =>
  state.findings.filter((f) => !f._dismissed)

/** Returns count of critical findings across active (non-dismissed) findings */
export const selectCriticalCount = (state: ReviewState) =>
  state.findings.filter((f) => !f._dismissed && f.severity === 'critical').length
