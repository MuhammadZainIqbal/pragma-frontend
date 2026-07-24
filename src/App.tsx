import { useEffect, useMemo, useState } from 'react'
import { AppShell } from './components/AppShell'
import { useReviewStore } from './store/reviewStore'
import { useReviewStream } from './hooks/useReviewStream'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
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

    const onOpen = () => setConnected(true)
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
      <header className="w-full bg-surface border-b border-border py-32 px-6 sm:px-12 flex flex-col items-center text-center">
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
          <a href="https://github.com/apps/pragma-pr-analyzer" target="_blank" rel="noreferrer" className="px-6 py-3 bg-charcoal text-white rounded-lg font-medium hover:bg-opacity-90 transition-colors shadow-sm">
            Install GitHub App
          </a>
          <a href="/?run_id=demo-sample-run" className="px-6 py-3 bg-surface border border-border text-charcoal rounded-lg font-medium hover:bg-overlay transition-colors shadow-sm">
            Explore Live Sample Demo
          </a>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 sm:px-12 py-16 flex flex-col gap-16">

        {/* Section 1: Quickstart & Permissions Guide */}
        <section className="flex flex-col gap-8">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight">Installation &amp; Permissions Guide</h2>
            <div className="h-px bg-border flex-1 ml-4"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface border border-border p-6 rounded-xl flex flex-col gap-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 text-6xl font-black text-overlay opacity-50 select-none">1</div>
              <h3 className="font-bold text-lg z-10">Install PRAGMA App</h3>
              <p className="text-secondary text-sm z-10 leading-relaxed">Click [ Install GitHub App ] and select your target repositories to authorize access.</p>
            </div>
            <div className="bg-surface border border-border p-6 rounded-xl flex flex-col gap-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 text-6xl font-black text-overlay opacity-50 select-none">2</div>
              <h3 className="font-bold text-lg z-10">Granted Permissions</h3>
              <div className="text-secondary text-sm z-10 leading-relaxed space-y-2 mt-1">
                <p><strong>Pull Requests: Read &amp; Write</strong><br/>(Required to post automated review comments)</p>
                <p><strong>Contents: Read-Only</strong><br/>(Required to inspect code diffs)</p>
              </div>
            </div>
            <div className="bg-surface border border-border p-6 rounded-xl flex flex-col gap-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 text-6xl font-black text-overlay opacity-50 select-none">3</div>
              <h3 className="font-bold text-lg z-10">Enable Webhook Events</h3>
              <p className="text-secondary text-sm z-10 leading-relaxed">Ensure the <strong>Pull Request</strong> event is checked so PRAGMA intercepts new PRs automatically.</p>
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

        {/* Section 3: Interactive Architecture Workflow Diagram */}
        <section className="flex flex-col gap-8 pt-16">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight">How PRAGMA Works Under the Hood</h2>
            <div className="h-px bg-border flex-1 ml-4"></div>
          </div>
          <div className="bg-surface border border-border rounded-2xl p-8 font-mono text-sm overflow-visible">
            {/* Row 1: GitHub PR */}
            <div className="flex flex-col items-center gap-0">
              <div className="group relative bg-background border border-border rounded-xl px-6 py-4 w-72 text-center hover:border-charcoal transition-colors cursor-default">
                <div className="text-xs font-semibold text-muted uppercase tracking-widest mb-1">① Trigger</div>
                <div className="font-bold text-charcoal">GitHub Pull Request</div>
                <div className="text-xs text-secondary mt-1">Webhook POST Event → FastAPI</div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-charcoal text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-left leading-relaxed">
                  GitHub sends a signed <code>pull_request</code> webhook to your Render backend. PRAGMA reads the diff URL and queues a background analysis job.
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-px h-6 bg-border"></div>
                <div className="text-muted text-xs">▼</div>
              </div>

              {/* Row 2: FastAPI Gate */}
              <div className="group relative bg-background border border-border rounded-xl px-6 py-4 w-72 text-center hover:border-charcoal transition-colors cursor-default">
                <div className="text-xs font-semibold text-muted uppercase tracking-widest mb-1">② Security Gate</div>
                <div className="font-bold text-charcoal">FastAPI Backend</div>
                <div className="text-xs text-secondary mt-1">Event Validation &amp; Diff Fetching</div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-charcoal text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-left leading-relaxed">
                  Validates the <code>X-GitHub-Event</code> header, fetches the raw unified diff from the GitHub REST API, and spawns a LangGraph thread.
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-px h-6 bg-border"></div>
                <div className="text-muted text-xs">▼</div>
              </div>

              {/* Row 3: LangGraph */}
              <div className="group relative bg-charcoal text-white rounded-xl px-6 py-4 w-80 text-center hover:opacity-90 transition-opacity cursor-default">
                <div className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-1">③ Orchestration</div>
                <div className="font-bold">LangGraph State Machine</div>
                <div className="text-xs text-white/70 mt-1">Postgres Async Checkpointer · Parallel Fan-Out</div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-white text-charcoal text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-left leading-relaxed border border-border shadow-lg">
                  LangGraph compiles a typed <code>PRReviewState</code> graph. It uses <code>AsyncPostgresSaver</code> on Supabase to checkpoint state, enabling HITL interruption and resumption.
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-px h-6 bg-border"></div>
                <div className="text-muted text-xs">▼</div>
              </div>

              {/* Row 4: 3 Parallel Agents */}
              <div className="flex flex-col sm:flex-row items-start justify-center gap-4 w-full">
                {[
                  { step: '④a', emoji: '🛡️', name: 'Security Agent', color: 'border-red-300 hover:border-red-500', badge: 'bg-red-100 text-red-700', desc: 'Scans for OWASP Top 10: SQL injection, hardcoded secrets, SSRF, prototype pollution, and broken auth. Staggered 0s delay.' },
                  { step: '④b', emoji: '🏗️', name: 'Architecture Agent', color: 'border-blue-300 hover:border-blue-500', badge: 'bg-blue-100 text-blue-700', desc: 'Detects N+1 queries, blocking calls inside async functions, circular dependencies, and API anti-patterns. Staggered 1.5s delay.' },
                  { step: '④c', emoji: '🎨', name: 'Style Agent', color: 'border-purple-300 hover:border-purple-500', badge: 'bg-purple-100 text-purple-700', desc: 'Enforces logic safety, dead code elimination, off-by-one index checks, and naming convention standards. Staggered 3.0s delay.' },
                ].map(({ step, emoji, name, color, badge, desc }) => (
                  <div key={name} className={`group relative bg-background border ${color} rounded-xl px-4 py-4 flex-1 text-center transition-colors cursor-default`}>
                    <div className={`text-xs font-semibold uppercase tracking-widest mb-1 px-2 py-0.5 rounded-full inline-block ${badge}`}>{step}</div>
                    <div className="text-lg mb-1">{emoji}</div>
                    <div className="font-bold text-charcoal text-sm">{name}</div>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 bg-charcoal text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-left leading-relaxed">
                      {desc}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col items-center">
                <div className="w-px h-6 bg-border"></div>
                <div className="text-muted text-xs">▼</div>
              </div>

              {/* Row 5: Critic */}
              <div className="group relative bg-background border border-border rounded-xl px-6 py-4 w-80 text-center hover:border-charcoal transition-colors cursor-default">
                <div className="text-xs font-semibold text-muted uppercase tracking-widest mb-1">⑤ Consensus</div>
                <div className="font-bold text-charcoal">⚖️ Critic &amp; Aggregator Node</div>
                <div className="text-xs text-secondary mt-1">Deduplication · Hallucination Guard · Quality Score</div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-charcoal text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-left leading-relaxed">
                  Uses <code>unidiff</code> to verify every agent citation against real diff lines. Deduplicates by <code>(file_path, line_number)</code>, elevates severity, and scores PR quality 0.0–1.0.
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-px h-6 bg-border"></div>
                <div className="text-muted text-xs">▼</div>
              </div>

              {/* Row 6: Staging Gate */}
              <div className="group relative border-2 border-dashed border-charcoal rounded-xl px-6 py-4 w-80 text-center cursor-default">
                <div className="text-xs font-semibold text-muted uppercase tracking-widest mb-1">⑥ Human Gate</div>
                <div className="font-bold text-charcoal">💬 Interactive Staging Gate</div>
                <div className="text-xs text-secondary mt-1">GitHub Comment → This Dashboard → Approve</div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-charcoal text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-left leading-relaxed">
                  LangGraph interrupts before the publisher node. A GitHub comment links to this dashboard. You inspect findings, edit suggestions, dismiss noise, then Approve &amp; Resume to publish.
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-center">
            <a
              href="/?run_id=demo-sample-run"
              className="inline-flex items-center gap-2 px-8 py-3 bg-charcoal text-white rounded-xl font-medium hover:bg-secondary transition-colors shadow-sm"
            >
              <span>⚡</span>
              Explore Interactive Sample Run
            </a>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="w-full bg-charcoal text-white py-4 px-6 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs opacity-80">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
            <span>SYSTEM ACTIVE · $0 Infrastructure</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Model: Gemini 3.5 Flash</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Orchestrator: LangGraph Async State Graph</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ── Root App ──────────────────────────────────────────────────────────────────
export default function App() {
  const run_id = useRunIdFromUrl()
  const connected = useSupabaseConnectionStatus()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initRun = useReviewStore((s) => s.initRun)
  const setStatus = useReviewStore((s) => s.setStatus)
  const setFindings = useReviewStore((s) => s.setFindings)
  const setPrQualityScore = useReviewStore((s) => s.setPrQualityScore)
  const appendTelemetry = useReviewStore((s) => s.appendTelemetry)

  // Initialise store with the run context from the URL
  useEffect(() => {
    if (!run_id) return

    const fetchState = async () => {
      try {
        setIsLoading(true)
        setError(null)

        if (run_id === 'demo-sample-run' || run_id === 'demo') {
          const DEMO_SAMPLE_DATA = {
            status: "paused_hitl",
            quality_score: 88,
            critical_count: 1,
            total_cost: 0.000000,
            tokens_processed: 10260,
            telemetry: [
              {
                node_name: "security_agent",
                agent: "security agent",
                latency_ms: 1240,
                input_tokens: 3420,
                output_tokens: 410,
                tokens: 3830,
                total_tokens: 3830,
                cost_usd: 0.000000
              },
              {
                node_name: "architecture_agent",
                agent: "architecture agent",
                latency_ms: 980,
                input_tokens: 3100,
                output_tokens: 320,
                tokens: 3420,
                total_tokens: 3420,
                cost_usd: 0.000000
              },
              {
                node_name: "style_agent",
                agent: "style agent",
                latency_ms: 750,
                input_tokens: 2800,
                output_tokens: 210,
                tokens: 3010,
                total_tokens: 3010,
                cost_usd: 0.000000
              }
            ],
            findings: [
              {
                severity: "CRITICAL",
                file_path: "master.c",
                line_number: "898-910",
                description: "The 'unsafeMerge' utility function is vulnerable to Prototype Pollution. It recursively copies properties from an untrusted source object without key sanitization, allowing RCE via '__proto__'.",
                suggestion: "Sanitize keys before assignment or use Object.create(null) for unpollutable target dictionaries.",
                diff_citation: "+ function unsafeMerge(target, source) {\n+   for (let key in source) {\n+     if (source.hasOwnProperty(key)) {"
              },
              {
                severity: "WARNING",
                file_path: "telemetry.py",
                line_number: "42",
                description: "Second-order SQL injection potential in async background pipeline. Raw string interpolation detected on 'patch_notes'.",
                suggestion: "Use parameterized queries via SQLAlchemy text bind parameters: text('UPDATE device_logs SET logs = :status WHERE notes = :notes')",
                diff_citation: "- query = f\"UPDATE device_logs SET logs = 'Processed' WHERE notes = '{notes}'\""
              }
            ]
          }

          initRun(run_id, 1337, 'pragma-demo-repo')
          setStatus(DEMO_SAMPLE_DATA.status as any)
          setPrQualityScore(DEMO_SAMPLE_DATA.quality_score / 100)

          const mappedFindings = DEMO_SAMPLE_DATA.findings.map(f => ({
            file_path: f.file_path,
            line_number: parseInt(f.line_number.split('-')[0]) || parseInt(f.line_number),
            start_line: f.line_number.includes('-') ? parseInt(f.line_number.split('-')[0]) : null,
            diff_citation: f.diff_citation,
            severity: f.severity.toLowerCase() as any,
            description: f.description,
            suggestion: f.suggestion
          }))
          setFindings(mappedFindings)

          DEMO_SAMPLE_DATA.telemetry.forEach(tick => {
            appendTelemetry({
              node_name: tick.node_name,
              agent: tick.agent,
              execution_time_ms: tick.latency_ms,
              input_tokens: tick.input_tokens,
              output_tokens: tick.output_tokens,
              tokens: tick.tokens,
              total_tokens: tick.total_tokens,
              cost_usd: tick.cost_usd
            })
          })

          setIsLoading(false)
          return
        }

        const res = await fetch(`https://pragma-backend-sxvw.onrender.com/api/state?run_id=${run_id}`)

        if (!res.ok) {
          throw new Error(`Server returned status ${res.status}`)
        }

        const result = await res.json()

        if (result && result.values) {
          const values = result.values
          const pr_number = values.pr_number ?? 0
          const repository = values.repository ?? ''

          initRun(run_id, pr_number, repository)

          if (result.status) {
            const STATUS_MAP: Record<string, any> = {
              processing: 'running',
              interrupted: 'paused_hitl',
              completed: 'complete',
              error: 'failed'
            }
            const mapped = STATUS_MAP[result.status]
            if (mapped) setStatus(mapped)
          }

          if (values.human_edits && Array.isArray(values.human_edits)) {
            setFindings(values.human_edits)
          } else if (values.final_findings && Array.isArray(values.final_findings)) {
            setFindings(values.final_findings)
          }

          if (typeof values.pr_quality_score === 'number') {
            setPrQualityScore(values.pr_quality_score)
          }

          if (values.telemetry && Array.isArray(values.telemetry)) {
            values.telemetry.forEach((tick: any) => {
              appendTelemetry({
                node_name: String(tick.node_name ?? ''),
                agent: tick.agent ? String(tick.agent) : undefined,
                execution_time_ms: Number(tick.execution_time_ms ?? tick.latency_ms ?? 0),
                input_tokens: Number(tick.input_tokens ?? 0),
                output_tokens: Number(tick.output_tokens ?? 0),
                tokens: tick.tokens ? Number(tick.tokens) : undefined,
                total_tokens: tick.total_tokens ? Number(tick.total_tokens) : undefined,
                cost_usd: Number(tick.cost_usd ?? 0),
              })
            })
          }

        } else {
          initRun(run_id, 0, '')
          setError("No review findings found for this run ID.")
        }
      } catch (err: any) {
        console.error("Failed to fetch run state:", err)
        initRun(run_id, 0, '')
        setError(err.message || "Failed to load review state.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchState()
  }, [run_id])

  // Mount the Realtime subscription — strict teardown is handled inside the hook
  useReviewStream(run_id)

  // Show the no-run splash screen if there's no run_id in the URL
  if (!run_id) return <NoRunState />

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-4 border-charcoal/20 border-t-charcoal animate-spin" />
          <p className="text-secondary font-mono text-sm">Analyzing Pull Request...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4">
        <div className="bg-surface border border-critical/20 rounded-2xl px-8 py-10 max-w-md w-full text-center">
          <p className="font-mono font-bold text-critical text-lg tracking-tight mb-2">Error Loading State</p>
          <p className="text-sm text-secondary leading-relaxed">{error}</p>
        </div>
      </div>
    )
  }

  return <AppShell connected={connected} />
}
