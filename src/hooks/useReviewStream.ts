import { useEffect, useRef } from 'react'
import { createClient, RealtimeChannel } from '@supabase/supabase-js'
import { useReviewStore } from '../store/reviewStore'
import type { AgentFinding, NodeTelemetry, ReviewStatus } from '../store/reviewStore'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const STATUS_MAP: Record<string, ReviewStatus> = {
  pending:     'waiting',
  running:     'running',
  paused_hitl: 'paused_hitl',
  resuming:    'resuming',
  complete:    'complete',
  failed:      'failed',
}

/**
 * Supabase Realtime hook.
 *
 * Data sources (both carry clean JSON — NOT LangGraph binary bytecode):
 *  1. `github_webhook_payloads` — status transitions, final findings, quality score.
 *  2. `review_telemetry`        — per-node telemetry ticks written by the backend agents.
 *
 * NOTE: We deliberately do NOT listen to the LangGraph `checkpoints` table.
 * That table stores state as serialized binary bytecode and is unreadable by a
 * Supabase Realtime frontend client without a custom deserializer.
 */
export function useReviewStream(run_id: string | null) {
  const { setStatus, setFindings, appendTelemetry, setPrQualityScore, setError } = useReviewStore()
  // Stable ref — avoids orphaned channels on re-render
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!run_id) return

    const channel = supabase
      .channel(`pragma-review-${run_id}`)

      // ── Source 1: github_webhook_payloads ──────────────────────────────────
      // Written by webhook.py (INSERT) and reviews.py PATCH (UPDATE).
      // Carries: status, final consolidated findings, quality score.
      .on(
        'postgres_changes',
        {
          event:  '*',
          schema: 'public',
          table:  'github_webhook_payloads',
          filter: `run_id=eq.${run_id}`,
        },
        (event) => {
          const record = event.new as Record<string, unknown>

          // Status transition
          if (typeof record.status === 'string') {
            const mapped = STATUS_MAP[record.status]
            if (mapped) setStatus(mapped)
          }

          // Final consolidated findings (written by critic node via backend update)
          if (Array.isArray(record.final_findings)) {
            setFindings(record.final_findings as AgentFinding[])
          }

          // Human-edited findings after HITL approval (written by reviews.py PATCH)
          if (Array.isArray(record.human_edits)) {
            setFindings(record.human_edits as AgentFinding[])
          }

          // PR quality score
          if (typeof record.pr_quality_score === 'number') {
            setPrQualityScore(record.pr_quality_score)
          }
        }
      )

      // ── Source 2: review_telemetry ─────────────────────────────────────────
      // Each agent node INSERTs a clean JSON row on completion:
      //   { run_id, node_name, execution_time_ms, input_tokens, output_tokens, cost_usd }
      // This avoids any dependency on the binary LangGraph checkpointer format.
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'review_telemetry',
          filter: `run_id=eq.${run_id}`,
        },
        (event) => {
          const record = event.new as Record<string, unknown>

          const tick: NodeTelemetry = {
            node_name:          String(record.node_name ?? ''),
            execution_time_ms:  Number(record.execution_time_ms ?? 0),
            input_tokens:       Number(record.input_tokens ?? 0),
            output_tokens:      Number(record.output_tokens ?? 0),
            cost_usd:           Number(record.cost_usd ?? 0),
          }

          appendTelemetry(tick)
        }
      )

      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setError(`Realtime error: ${err instanceof Error ? err.message : 'connection lost'}`)
        }
      })

    channelRef.current = channel

    // CRITICAL: Explicit unsubscribe on cleanup.
    // React Strict Mode double-mounts effects — without this, two WebSocket channels
    // are spawned per component mount, exhausting the Supabase free-tier connection limit.
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [run_id])
}
