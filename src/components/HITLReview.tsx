import { useState, useEffect } from 'react'
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued'
import { useReviewStore, selectActiveFindings, selectCriticalCount } from '../store/reviewStore'
import type { AgentFinding, Severity } from '../store/reviewStore'

// ── Custom diff viewer styles matching our Industrial Command Center palette ──
const API_BASE_URL = import.meta.env.PROD 
  ? "https://pragma-backend-sxvw.onrender.com" 
  : ""; // Vite dev proxy targets localhost:8000

const diffStyles = {
  variables: {
    light: {
      diffViewerBackground:         '#E8E9E1',
      diffViewerColor:              '#1F1F1F',
      addedBackground:              '#d4e8da',
      addedColor:                   '#1F1F1F',
      removedBackground:            '#eadada',
      removedColor:                 '#1F1F1F',
      wordAddedBackground:          '#b5d8bf',
      wordRemovedBackground:        '#d8b5b5',
      addedGutterBackground:        '#c8dece',
      removedGutterBackground:      '#decec8',
      gutterBackground:             '#DDDDD5',
      gutterBackgroundDark:         '#CECEC5',
      highlightBackground:          '#F4F3EE',
      highlightGutterBackground:    '#E8E9E1',
      codeFoldGutterBackground:     '#DDDDD5',
      codeFoldBackground:           '#E8E9E1',
      emptyLineBackground:          '#F4F3EE',
      gutterColor:                  '#7A7871',
      addedGutterColor:             '#3A6B48',
      removedGutterColor:           '#8C3130',
      codeFoldContentColor:         '#7A7871',
      diffViewerTitleBackground:    '#DDDDD5',
      diffViewerTitleColor:         '#1F1F1F',
      diffViewerTitleBorderColor:   '#CECEC5',
    },
  },
  line: { fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: '12px' },
  gutter: { minWidth: '2rem' },
}

// ── Severity badge component ──────────────────────────────────────────────────
const SEVERITY_CONFIG: Record<Severity, { bg: string; text: string; label: string }> = {
  critical: { bg: 'bg-critical-surface', text: 'text-critical', label: 'CRITICAL' },
  warning:  { bg: 'bg-warning-surface',  text: 'text-warning',  label: 'WARNING'  },
  info:     { bg: 'bg-info-surface',     text: 'text-info',     label: 'INFO'     },
}

function SeverityBadge({ severity }: { severity: Severity }) {
  const cfg = SEVERITY_CONFIG[severity] ?? SEVERITY_CONFIG.info
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-pill text-2xs font-mono font-semibold tracking-widest ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  )
}

// ── Single finding card ───────────────────────────────────────────────────────
interface FindingCardProps {
  finding: AgentFinding
  index: number
}

function FindingCard({ finding, index }: FindingCardProps) {
  const { editFindingSuggestion, dismissFinding, acceptFinding } = useReviewStore()
  const [isEditingLocally, setIsEditingLocally] = useState(false)
  const [localEdit, setLocalEdit] = useState(finding.suggestion)

  if (finding._dismissed) return null

  const handleSaveEdit = () => {
    editFindingSuggestion(index, localEdit)
    setIsEditingLocally(false)
  }

  const handleDiscard = () => {
    setLocalEdit(finding.suggestion)
    setIsEditingLocally(false)
  }

  const lineRange = finding.start_line && finding.start_line < finding.line_number
    ? `L${finding.start_line}–${finding.line_number}`
    : `L${finding.line_number}`

  return (
    <article className="bg-surface rounded-2xl overflow-hidden border border-border mb-4">
      {/* Card Header */}
      <header className="flex items-start justify-between gap-4 px-5 py-4 border-b border-border">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <SeverityBadge severity={finding.severity} />
            <span className="font-mono text-xs text-muted truncate">
              {finding.file_path}
              <span className="ml-1 text-secondary">{lineRange}</span>
            </span>
          </div>
          <p className="text-sm text-charcoal font-medium leading-snug mt-1">{finding.description}</p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => { acceptFinding(index); setIsEditingLocally(false) }}
            title="Accept suggestion as-is"
            className="px-3 py-1.5 text-xs font-medium rounded-xl bg-success-surface text-success hover:bg-success hover:text-white transition-colors"
          >
            Accept
          </button>
          <button
            onClick={() => setIsEditingLocally((v) => !v)}
            title="Edit suggestion inline"
            className="px-3 py-1.5 text-xs font-medium rounded-xl bg-overlay text-secondary hover:bg-border transition-colors"
          >
            {isEditingLocally ? 'Cancel' : 'Edit'}
          </button>
          <button
            onClick={() => dismissFinding(index)}
            title="Dismiss finding"
            className="px-3 py-1.5 text-xs font-medium rounded-xl bg-overlay text-muted hover:bg-critical-surface hover:text-critical transition-colors"
          >
            Dismiss
          </button>
        </div>
      </header>

      {/* Diff viewer */}
      <div className="overflow-x-auto">
        <ReactDiffViewer
          oldValue=""
          newValue={finding.diff_citation}
          splitView={false}
          compareMethod={DiffMethod.WORDS}
          styles={diffStyles}
          hideLineNumbers={false}
          showDiffOnly={false}
        />
      </div>

      {/* Suggestion panel */}
      <div className="px-5 py-4 border-t border-border bg-background">
        <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Agent Suggestion</p>
        {isEditingLocally ? (
          <div className="flex flex-col gap-2">
            <textarea
              value={localEdit}
              onChange={(e) => setLocalEdit(e.target.value)}
              rows={4}
              className="w-full font-mono text-xs text-charcoal bg-surface border border-border rounded-xl px-3 py-2 resize-y focus:outline-none focus:ring-2 focus:ring-charcoal/20"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveEdit}
                className="px-3 py-1.5 text-xs font-medium rounded-xl bg-charcoal text-background hover:bg-secondary transition-colors"
              >
                Save Edit
              </button>
              <button
                onClick={handleDiscard}
                className="px-3 py-1.5 text-xs font-medium rounded-xl bg-overlay text-muted hover:bg-border transition-colors"
              >
                Discard
              </button>
            </div>
          </div>
        ) : (
          <p className={`text-sm leading-relaxed ${finding._edited ? 'text-charcoal italic' : 'text-secondary'}`}>
            {finding.suggestion}
            {finding._edited && (
              <span className="ml-2 text-2xs text-muted font-mono not-italic">[edited]</span>
            )}
          </p>
        )}
      </div>
    </article>
  )
}

// ── HITLReview main component ─────────────────────────────────────────────────
export function HITLReview() {
  const run_id        = useReviewStore((s) => s.run_id)
  const findings      = useReviewStore((s) => s.findings)
  const status        = useReviewStore((s) => s.status)
  const quality       = useReviewStore((s) => s.pr_quality_score)
  const totalCost     = useReviewStore((s) => s.total_cost_usd)
  const telemetry     = useReviewStore((s) => s.telemetry)
  const isSubmitting  = useReviewStore((s) => s.isSubmitting)
  const setSubmitting = useReviewStore((s) => s.setSubmitting)
  const setStatus     = useReviewStore((s) => s.setStatus)
  const setError      = useReviewStore((s) => s.setError)

  const [isApproved, setIsApproved] = useState(false)

  useEffect(() => {
    if (run_id) {
      const locallyApproved = localStorage.getItem(`pragma_approved_${run_id}`) === 'true'
      if (status === 'completed' || locallyApproved) {
        setIsApproved(true)
      }
    }
  }, [run_id, status])

  const isDemoMode = run_id === 'demo-sample-run'

  // Total tokens across all nodes
  const totalTokens = telemetry.reduce((acc, t) => acc + t.input_tokens + t.output_tokens, 0)

  const activeFindings = selectActiveFindings({ findings } as Parameters<typeof selectActiveFindings>[0])
  const criticalCount  = selectCriticalCount({ findings } as Parameters<typeof selectCriticalCount>[0])

  const handleApprove = async () => {
    if (!run_id || isSubmitting || isApproved || isDemoMode) return
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`${API_BASE_URL}/api/reviews/${run_id}/approve`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ findings: activeFindings }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.detail ?? `HTTP ${res.status}`)
      }

      localStorage.setItem(`pragma_approved_${run_id}`, 'true')
      setIsApproved(true)
      setStatus('resuming')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error during approval')
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'waiting' || status === 'running') {
    return (
      <section className="w-full max-w-4xl mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[40vh] text-center">
        <span className="inline-block w-8 h-8 border-4 border-muted border-t-charcoal rounded-full animate-spin mb-4" />
        <h2 className="text-lg font-semibold text-charcoal">Analyzing Pull Request</h2>
        <p className="text-sm text-muted mt-2">The PRAGMA intelligence engine is processing the diff and verifying structural changes. This may take a few moments...</p>
      </section>
    )
  }

  if (status !== 'paused_hitl' && status !== 'resuming' && status !== 'complete') return null

  return (
    <section className="w-full max-w-4xl mx-auto px-4 py-8">
      {/* Review header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold text-charcoal tracking-tight">Human Review</h2>
          <p className="text-sm text-muted mt-0.5">
            {findings.length} finding{findings.length !== 1 ? 's' : ''} detected ·{' '}
            {criticalCount} critical · Quality score{' '}
            <span className={quality >= 0.7 ? 'text-success font-medium' : 'text-critical font-medium'}>
              {(quality * 100).toFixed(0)}%
            </span>
            {' '}·{' '}
            {totalCost > 0
              ? <><span className="font-mono">${totalCost.toFixed(6)}</span> · {totalTokens.toLocaleString()} tokens processed</>
              : <span className="font-mono text-success">$0.0000 (Free Tier)</span>
            }
          </p>
          {isDemoMode && (
            <p className="text-xs text-warning font-mono mt-1">⚠ Read-only demo mode — actions are simulated</p>
          )}
        </div>

        {/* Approve button — locked after first success or in demo mode */}
        {isApproved ? (
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-pill text-sm font-semibold bg-success-surface text-success border border-success/20">
            <span>✅ Review Approved &amp; Pipeline Resumed</span>
          </div>
        ) : isDemoMode ? (
          <div className="flex flex-col items-end gap-1">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-pill text-sm font-semibold bg-overlay text-muted border border-border cursor-not-allowed">
              Read-Only Demo Mode
            </div>
            <span className="text-2xs text-muted font-mono">Action simulated for demonstration purposes.</span>
          </div>
        ) : (
          <button
            onClick={handleApprove}
            disabled={isSubmitting || (activeFindings.length === 0 && findings.length > 0)}
            className={[
              'inline-flex items-center gap-2 px-6 py-2.5 rounded-pill text-sm font-semibold transition-all',
              isSubmitting
                ? 'bg-overlay text-muted cursor-not-allowed'
                : 'bg-charcoal text-background hover:bg-secondary active:scale-95',
            ].join(' ')}
          >
            {isSubmitting ? (
              <>
                <span className="inline-block w-3.5 h-3.5 border-2 border-muted border-t-transparent rounded-full animate-spin" />
                Submitting Approval Gate…
              </>
            ) : (
              'Approve & Resume →'
            )}
          </button>
        )}
      </div>

      {/* Finding cards */}
      {findings.length === 0 ? (
        <div className="bg-surface rounded-2xl px-6 py-10 text-center text-muted text-sm">
          No findings to review. The pipeline detected no issues in this PR.
        </div>
      ) : (
        findings.map((finding, idx) => (
          <FindingCard key={`${finding.file_path}-${finding.line_number}-${idx}`} finding={finding} index={idx} />
        ))
      )}
    </section>
  )
}
