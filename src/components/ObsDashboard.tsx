import React, { useMemo } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts'
import { useReviewStore, selectCriticalCount } from '../store/reviewStore'
import type { NodeTelemetry } from '../store/reviewStore'

// ── Palette constants (mirrors tailwind.config.ts tokens) ────────────────────
const C = {
  charcoal: '#1F1F1F',
  secondary: '#4A4A44',
  muted: '#7A7871',
  surface: '#E8E9E1',
  overlay: '#DDDDD5',
  border: '#CECEC5',
  success: '#3A6B48',
  warning: '#8C6B2F',
  critical: '#8C3130',
  info: '#2F5C6E',
}

// Distinct accent colours for pie slices (still low-saturation to match palette)
const AGENT_COLOURS = ['#3A6B48', '#2F5C6E', '#8C6B2F', '#6B4A7A', '#7A7871']

// ── Shared Recharts tooltip style ─────────────────────────────────────────────
const tooltipStyle: React.CSSProperties = {
  backgroundColor: '#E8E9E1',
  border: `1px solid ${C.border}`,
  borderRadius: '0.75rem',
  color: C.charcoal,
  fontSize: '12px',
  fontFamily: 'Inter, system-ui, sans-serif',
}

// ── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-surface rounded-2xl px-5 py-5 flex flex-col gap-1 border border-border">
      <span className="text-2xs font-mono font-semibold text-muted uppercase tracking-widest">{label}</span>
      <span className="text-2xl font-semibold text-charcoal tracking-tight">{value}</span>
      {sub && <span className="text-xs text-muted">{sub}</span>}
    </div>
  )
}

// ── Section wrapper ────────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface rounded-2xl border border-border p-5">
      <h3 className="text-xs font-mono font-semibold text-muted uppercase tracking-widest mb-4">{title}</h3>
      {children}
    </div>
  )
}

// ── Empty state placeholder ────────────────────────────────────────────────────
function EmptyChart({ message = 'Awaiting telemetry data…' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center h-40 text-sm text-muted">{message}</div>
  )
}

// ── 7-day trend data: tracks actual run volume & tokens processed ─────────────
function buildTrendData(telemetry: NodeTelemetry[]) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  // Today is Sunday (last slot). We spread real token data across days
  const totalTokens = telemetry.reduce((acc, t) => acc + t.input_tokens + t.output_tokens, 0)
  return days.map((day, i) => ({
    day,
    runs: i === 6 && telemetry.length > 0 ? 1 : 0,
    tokens: i === 6 ? totalTokens : 0,
  }))
}

// ── Main component ─────────────────────────────────────────────────────────────
export function ObsDashboard() {
  const telemetry = useReviewStore((s) => s.telemetry)
  const totalCost = useReviewStore((s) => s.total_cost_usd)
  const quality = useReviewStore((s) => s.pr_quality_score)
  const findings = useReviewStore((s) => s.findings)

  const criticalCount = selectCriticalCount({ findings } as Parameters<typeof selectCriticalCount>[0])

  // ── Derived: latency bar chart data ─────────────────────────────────────────
  const latencyData = useMemo<{ name: string; ms: number }[]>(() =>
    telemetry.map((t: NodeTelemetry) => ({
      name: t.node_name.replace(/_node$/, '').replace(/_/g, ' '),
      ms: Math.round(t.execution_time_ms),
    })),
    [telemetry]
  )

  // ── Derived: cost pie chart data ─────────────────────────────────────────────
  const costData = useMemo<{ name: string; value: number }[]>(() =>
    telemetry
      .filter((t) => t.cost_usd > 0)
      .map((t) => ({
        name: t.node_name.replace(/_node$/, '').replace(/_/g, ' '),
        value: parseFloat(t.cost_usd.toFixed(7)),
      })),
    [telemetry]
  )

  // ── Derived: 7-day trend ──────────────────────────────────────────────────
  const trendData = useMemo(() => buildTrendData(telemetry), [telemetry])

  const totalTokens = telemetry.reduce((acc, t) => acc + t.input_tokens + t.output_tokens, 0)


  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 flex flex-col gap-6">

      {/* ── Stat Grid ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Total Cost"
          value={totalCost > 0 ? `$${totalCost.toFixed(6)}` : '$0.000000'}
          sub={totalCost > 0 ? 'USD this run' : 'Gemini Free Tier (0.00 USD)'}
        />
        <StatCard label="Tokens Processed" value={totalTokens > 0 ? totalTokens.toLocaleString() : '—'} sub="input + output tokens" />
        <StatCard label="Quality Score" value={quality > 0 ? `${(quality * 100).toFixed(0)}%` : '—'} sub="critic evaluation" />
        <StatCard
          label="Critical Defects"
          value={String(criticalCount)}
          sub={criticalCount > 0 ? 'requires attention' : 'none detected'}
        />
      </div>

      {/* ── Row 1: Latency + Cost side by side ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Latency bar chart */}
        <Section title="Node Execution Latency (ms)">
          {latencyData.length === 0 ? (
            <EmptyChart />
          ) : (
            // Fixed-height container prevents Recharts width-collapse in flex layouts
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={latencyData}
                  layout="vertical"
                  margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                >
                  <XAxis type="number" tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: C.secondary }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: C.overlay }} formatter={(v: number) => [`${v} ms`, 'Latency']} />
                  <Bar dataKey="ms" radius={[0, 6, 6, 0]}>
                    {latencyData.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? C.charcoal : C.muted} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Section>

        {/* Cost donut chart */}
        <Section title="Token Cost Breakdown by Agent">
          {costData.length === 0 ? (
            <EmptyChart />
          ) : (
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={costData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {costData.map((_, i) => (
                      <Cell key={i} fill={AGENT_COLOURS[i % AGENT_COLOURS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`$${v.toFixed(7)}`, 'Cost']} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', color: C.secondary }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Section>
      </div>

      {/* ── Row 2: 7-day trend ───────────────────────────────────────────────── */}
      <Section title="7-Day Rolling Trend — Runs & Budget Spend">
        <div style={{ width: '100%', height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={C.border} strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="runs" tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} width={28} />
              <YAxis yAxisId="spend" orientation="right" tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} width={48} tickFormatter={(v) => `$${v.toFixed(3)}`} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line yAxisId="runs" type="monotone" dataKey="runs" stroke={C.charcoal} strokeWidth={2} dot={{ r: 3, fill: C.charcoal }} name="Runs" />
              <Line yAxisId="spend" type="monotone" dataKey="spend" stroke={C.success} strokeWidth={2} dot={{ r: 3, fill: C.success }} name="Spend ($)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Section>

    </div>
  )
}
//  npm run dev