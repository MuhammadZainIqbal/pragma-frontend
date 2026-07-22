import { useEffect, useMemo, useState } from 'react'
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
    <div className="min-h-screen bg-background text-charcoal flex flex-col font-sans">
      {/* Header / Hero Section */}
      <header className="w-full bg-surface border-b border-border py-16 px-6 sm:px-12 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-overlay border border-border rounded-full text-xs font-mono font-medium text-secondary mb-6">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          PRAGMA ENGINE v1.0 // ACTIVE
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6 max-w-4xl">
          Autonomous Code Review &amp; Security Gate
        </h1>
        <p className="text-lg text-secondary max-w-3xl leading-relaxed mb-10">
          Multi-agent AI code analysis engine powered by LangGraph &amp; Gemini. Intercepting pull requests, detecting security vulnerabilities, and streaming real-time review metrics.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <a href="https://github.com/apps/pragma-review" target="_blank" rel="noreferrer" className="px-6 py-3 bg-charcoal text-white rounded-lg font-medium hover:bg-opacity-90 transition-colors shadow-sm">
            Install GitHub App
          </a>
          <a href="/?run_id=demo-sample-run" className="px-6 py-3 bg-surface border border-border text-charcoal rounded-lg font-medium hover:bg-overlay transition-colors shadow-sm">
            Explore Live Sample Demo
          </a>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 sm:px-12 py-16 flex flex-col gap-16">
        
        {/* Section 1: Quickstart User Manual */}
        <section className="flex flex-col gap-8">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight">How to Integrate PRAGMA in 60 Seconds</h2>
            <div className="h-px bg-border flex-1 ml-4"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-surface border border-border p-6 rounded-xl flex flex-col gap-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 text-6xl font-black text-overlay opacity-50 select-none">1</div>
              <h3 className="font-bold text-lg z-10">Install GitHub App</h3>
              <p className="text-secondary text-sm z-10 leading-relaxed">Authorize PRAGMA on your target repositories to grant webhook access.</p>
            </div>
            <div className="bg-surface border border-border p-6 rounded-xl flex flex-col gap-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 text-6xl font-black text-overlay opacity-50 select-none">2</div>
              <h3 className="font-bold text-lg z-10">Open a Pull Request</h3>
              <p className="text-secondary text-sm z-10 leading-relaxed">Push code or open a PR against any protected branch to trigger analysis.</p>
            </div>
            <div className="bg-surface border border-border p-6 rounded-xl flex flex-col gap-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 text-6xl font-black text-overlay opacity-50 select-none">3</div>
              <h3 className="font-bold text-lg z-10">Automated Analysis</h3>
              <p className="text-secondary text-sm z-10 leading-relaxed">PRAGMA intercepts the webhook, analyzes diffs across 3 specialized AI agents.</p>
            </div>
            <div className="bg-surface border border-border p-6 rounded-xl flex flex-col gap-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 text-6xl font-black text-overlay opacity-50 select-none">4</div>
              <h3 className="font-bold text-lg z-10">Interactive Dashboard</h3>
              <p className="text-secondary text-sm z-10 leading-relaxed">Click the link on your PR to review streaming telemetry, inspect AST flaws, and approve the build.</p>
            </div>
          </div>
        </section>

        {/* Section 2: Multi-Agent Intelligence Ecosystem */}
        <section className="flex flex-col gap-8">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight">Multi-Agent Intelligence Ecosystem</h2>
            <div className="h-px bg-border flex-1 ml-4"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface border border-border p-6 rounded-xl flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center border border-red-200">
                  <span className="text-red-600 font-bold">S</span>
                </div>
                <h3 className="font-bold text-lg">Security Agent</h3>
              </div>
              <p className="text-secondary text-sm leading-relaxed">
                Scans for SQL injections, command execution flaws, prototype pollution, and exposed secrets.
              </p>
            </div>
            <div className="bg-surface border border-border p-6 rounded-xl flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center border border-blue-200">
                  <span className="text-blue-600 font-bold">A</span>
                </div>
                <h3 className="font-bold text-lg">Architecture Agent</h3>
              </div>
              <p className="text-secondary text-sm leading-relaxed">
                Evaluates state management, async flow, database connection pools, and API structural anti-patterns.
              </p>
            </div>
            <div className="bg-surface border border-border p-6 rounded-xl flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center border border-purple-200">
                  <span className="text-purple-600 font-bold">Q</span>
                </div>
                <h3 className="font-bold text-lg">Style &amp; Standards Agent</h3>
              </div>
              <p className="text-secondary text-sm leading-relaxed">
                Enforces naming conventions, type safety, and clean code principles.
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* Section 3: System Telemetry Stats Bar */}
      <footer className="w-full bg-charcoal text-white py-4 px-6 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs opacity-80">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
            <span>Latency: ~2.4s</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            <span>Model: Gemini 3.5 Flash</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
            <span>Orchestrator: LangGraph Async State Graph</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ── Root App ──────────────────────────────────────────────────────────────────
export default function App() {
  const run_id    = useRunIdFromUrl()
  const connected = useSupabaseConnectionStatus()
  const initRun           = useReviewStore((s) => s.initRun)
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
          .maybeSingle()

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
