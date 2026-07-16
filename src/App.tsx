import React, { useEffect, useMemo, useState } from 'react'
import { AppShell } from './components/AppShell'
import { useReviewStore } from './store/reviewStore'
import { useReviewStream } from './hooks/useReviewStream'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// Shared supabase client for connection-state polling
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ── Parse run_id from URL query parameters (?run_id=…) ─────────────────────
function useRunIdFromUrl(): string | null {
  return useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('run_id')
  }, [])
}

// ── Track Supabase WebSocket connection state ──────────────────────────────
function useSupabaseConnectionStatus(): boolean {
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    // Supabase realtime exposes connection state via the underlying socket
    const { socket } = (supabase.realtime as unknown as { socket: { connectionState: () => string; onOpen: (cb: () => void) => void; onClose: (cb: () => void) => void; onError: (cb: () => void) => void } })
    
    if (!socket) {
      setConnected(false)
      return
    }

    // Sync initial state
    setConnected(socket.connectionState() === 'open')

    const onOpen  = () => setConnected(true)
    const onClose = () => setConnected(false)
    const onError = () => setConnected(false)

    socket.onOpen(onOpen)
    socket.onClose(onClose)
    socket.onError(onError)

    // No explicit teardown needed — socket is a singleton tied to supabase client lifetime
  }, [])

  return connected
}

// ── Empty state when no run_id is present in the URL ────────────────────────
function NoRunState() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4">
      <div className="bg-surface border border-border rounded-2xl px-8 py-10 max-w-md w-full text-center">
        <p className="font-mono font-bold text-charcoal text-lg tracking-tight mb-2">
          PRAGMA <span className="text-muted font-normal">//</span> Autonomous Code Review
        </p>
        <p className="text-sm text-secondary leading-relaxed mb-6">
          No active review session detected. Open this dashboard with a valid{' '}
          <code className="font-mono text-xs bg-overlay px-1.5 py-0.5 rounded-lg text-charcoal">?run_id=</code>{' '}
          query parameter to stream a live PR review.
        </p>
        <p className="text-xs text-muted font-mono">
          Example: <span className="text-secondary">/?run_id=550e8400-e29b-41d4-a716-446655440000</span>
        </p>
      </div>
    </div>
  )
}

// ── Root App ──────────────────────────────────────────────────────────────────
export default function App() {
  const run_id    = useRunIdFromUrl()
  const connected = useSupabaseConnectionStatus()
  const initRun           = useReviewStore((s) => s.initRun)
  const status            = useReviewStore((s) => s.status)
  const setStatus         = useReviewStore((s) => s.setStatus)
  const setFindings       = useReviewStore((s) => s.setFindings)
  const setPrQualityScore = useReviewStore((s) => s.setPrQualityScore)
  const appendTelemetry   = useReviewStore((s) => s.appendTelemetry)

  // Initialise store with the run context from the URL
  useEffect(() => {
    if (!run_id) return

    // Pull lightweight metadata from Supabase on mount to hydrate initial state
    const bootstrap = async () => {
      try {
        const { data } = await supabase
          .from('github_webhook_payloads')
          .select('run_id, repository, payload, status, final_findings, human_edits, pr_quality_score')
          .eq('run_id', run_id)
          .single()

        if (data) {
          const pr_number = data.payload?.pull_request?.number ?? 0
          const repository = data.repository ?? ''
          
          // Initialise the store
          initRun(run_id, pr_number, repository)

          // Hydrate historical state
          if (data.status) {
            // Map plain string to ReviewStatus
            const STATUS_MAP: Record<string, any> = {
              pending:     'waiting',
              running:     'running',
              paused_hitl: 'paused_hitl',
              resuming:    'resuming',
              complete:    'complete',
              failed:      'failed',
            }
            const mapped = STATUS_MAP[data.status]
            if (mapped) setStatus(mapped)
          }

          if (data.human_edits && Array.isArray(data.human_edits)) {
            setFindings(data.human_edits as any[])
          } else if (data.final_findings && Array.isArray(data.final_findings)) {
            setFindings(data.final_findings as any[])
          }

          if (typeof data.pr_quality_score === 'number') {
            setPrQualityScore(data.pr_quality_score)
          }

          // Hydrate historical telemetry ticks
          const { data: telemetryData } = await supabase
            .from('review_telemetry')
            .select('*')
            .eq('run_id', run_id)
            .order('timestamp', { ascending: true })

          if (telemetryData) {
            telemetryData.forEach((tick) => {
              appendTelemetry({
                node_name:         String(tick.node_name ?? ''),
                execution_time_ms: Number(tick.execution_time_ms ?? 0),
                input_tokens:      Number(tick.input_tokens ?? 0),
                output_tokens:     Number(tick.output_tokens ?? 0),
                cost_usd:          Number(tick.cost_usd ?? 0),
              })
            })
          }
          
        } else {
          // Unknown run_id — initialise with defaults; Realtime will hydrate the rest
          initRun(run_id, 0, '')
        }
      } catch {
        // Supabase unreachable — still initialise so Realtime hook can attach
        initRun(run_id, 0, '')
      }
    }

    bootstrap()
  }, [run_id])

  // Mount the Realtime subscription — strict teardown is handled inside the hook
  useReviewStream(run_id)

  // Show the no-run splash screen if there's no run_id in the URL
  if (!run_id) return <NoRunState />

  return <AppShell connected={connected} />
}
