import React, { useState } from 'react'
import { useReviewStore } from '../store/reviewStore'
import { HITLReview } from './HITLReview'
import { ObsDashboard } from './ObsDashboard'

type Tab = 'review' | 'telemetry'

// ── Static system status badge ─────────────────────────────────────────────────
function SystemActiveBadge() {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill text-xs font-mono font-semibold border bg-success-surface text-success border-success/20">
      <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
      SYSTEM ACTIVE
    </div>
  )
}

// ── Tab button ─────────────────────────────────────────────────────────────────
function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
        active
          ? 'bg-charcoal text-background'
          : 'text-muted hover:text-secondary hover:bg-overlay'
      }`}
    >
      {children}
    </button>
  )
}

// ── AppShell ───────────────────────────────────────────────────────────────────
interface AppShellProps {
  connected: boolean
}

export function AppShell({ connected: _connected }: AppShellProps) {
  const [activeTab, setActiveTab] = useState<Tab>('review')
  const status     = useReviewStore((s) => s.status)
  const run_id     = useReviewStore((s) => s.run_id)
  const repository = useReviewStore((s) => s.repository)
  const pr_number  = useReviewStore((s) => s.pr_number)

  // Status pill config
  const STATUS_LABEL: Record<string, string> = {
    idle:        'Idle',
    waiting:     'Waiting…',
    running:     'Running',
    paused_hitl: 'Awaiting Review',
    resuming:    'Resuming…',
    complete:    'Complete',
    failed:      'Failed',
  }
  const STATUS_CLASSES: Record<string, string> = {
    idle:        'bg-overlay text-muted',
    waiting:     'bg-info-surface text-info',
    running:     'bg-warning-surface text-warning',
    paused_hitl: 'bg-critical-surface text-critical',
    resuming:    'bg-warning-surface text-warning',
    complete:    'bg-success-surface text-success',
    failed:      'bg-critical-surface text-critical',
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Top Header ────────────────────────────────────────────────────── */}
      <header className="bg-surface border-b border-border sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">

          {/* Wordmark */}
          <div className="flex flex-col leading-tight">
            <span className="font-mono font-bold text-charcoal tracking-tight text-base">
              PRAGMA <span className="text-muted font-normal">//</span> Autonomous Code Review
            </span>
            {run_id && (
              <span className="text-2xs font-mono text-muted">
                {repository ?? '—'} · PR #{pr_number ?? '—'} · <span className="opacity-60">{run_id.slice(0, 8)}…</span>
              </span>
            )}
          </div>

          {/* Right cluster: run status + connection badge */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {status !== 'idle' && (
              <span className={`px-2.5 py-1 rounded-pill text-2xs font-mono font-semibold ${STATUS_CLASSES[status] ?? STATUS_CLASSES.idle}`}>
                {STATUS_LABEL[status] ?? status}
              </span>
            )}
            <SystemActiveBadge />
          </div>
        </div>
      </header>

      {/* ── Tab Bar ───────────────────────────────────────────────────────── */}
      <nav className="bg-background border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-2 flex items-center gap-1">
          <TabButton active={activeTab === 'review'} onClick={() => setActiveTab('review')}>
            Live Pull Request Staging Gate
          </TabButton>
          <TabButton active={activeTab === 'telemetry'} onClick={() => setActiveTab('telemetry')}>
            System Telemetry &amp; Monitoring
          </TabButton>
        </div>
      </nav>

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <main className="flex-1">
        {activeTab === 'review' && <HITLReview />}
        {activeTab === 'telemetry' && <ObsDashboard />}
      </main>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-4">
        <p className="text-center text-2xs font-mono text-muted">
          PRAGMA · $0 Infrastructure · LangGraph + Supabase + Vercel + GitHub Actions
        </p>
      </footer>
    </div>
  )
}
