import { useState, useEffect } from 'react';
import { getAllVisitors } from '../api/visitorApi';
import { mergeExtras } from '../utils/visitorExtras';

/* ── Helpers ───────────────────────────────────────────────── */
const fmtDuration = (mins) => {
  if (mins < 1)   return '< 1m';
  if (mins < 60)  return `${Math.round(mins)}m`;
  const h = Math.floor(mins / 60), m = Math.round(mins % 60);
  return m ? `${h}h ${m}m` : `${h}h`;
};

const last7Days = () => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toDateString());
  }
  return days;
};

const shortDate = (ds) => {
  const d = new Date(ds);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

/* ── SVG Charts ────────────────────────────────────────────── */

function LineChart({ points, labels }) {
  const W = 480, H = 110, PX = 30, PY = 15;
  const max = Math.max(...points, 1);
  const coords = points.map((v, i) => ({
    x: PX + (i / Math.max(points.length - 1, 1)) * (W - 2 * PX),
    y: PY + (1 - v / max) * (H - 2 * PY),
    v,
  }));
  const linePath  = coords.map((c, i) => `${i ? 'L' : 'M'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');
  const areaPath  = `${linePath} L ${coords[coords.length - 1].x} ${H - PY} L ${coords[0].x} ${H - PY} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#6366f1" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0"    />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#ag)" />
      <path d={linePath} fill="none" stroke="#818cf8" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" />
      {coords.map((c, i) => (
        <g key={i}>
          <circle cx={c.x} cy={c.y} r="4" fill="#6366f1" />
          {c.v > 0 && (
            <text x={c.x} y={c.y - 8} textAnchor="middle"
                  fontSize="9" fill="#a5b4fc">{c.v}</text>
          )}
          <text x={c.x} y={H + 2} textAnchor="middle"
                fontSize="8" fill="#475569">{labels[i]}</text>
        </g>
      ))}
    </svg>
  );
}

function HBarChart({ data }) {
  const COLORS = ['#6366f1','#10b981','#f59e0b','#3b82f6','#ec4899','#8b5cf6','#14b8a6'];
  if (!data.length) return <p className="text-slate-500 text-sm text-center py-4">No data</p>;
  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={d.label}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-300 truncate max-w-[180px]">{d.label}</span>
            <span className="text-slate-400 shrink-0 ml-2">{d.count} ({d.pct}%)</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
                 style={{ width: `${d.pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function HourBars({ data }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-0.5 h-14">
      {data.map((v, h) => (
        <div key={h} className="flex-1 flex flex-col items-center gap-0.5">
          <div className="w-full rounded-t-sm transition-all duration-500"
               style={{
                 height: `${Math.max((v / max) * 44, 2)}px`,
                 backgroundColor: v > 0 ? '#6366f1' : '#1e293b',
                 opacity: v > 0 ? 0.4 + (v / max) * 0.6 : 1,
               }} />
          {h % 6 === 0 && (
            <span className="text-[7px] text-slate-600">{h}h</span>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Component ─────────────────────────────────────────────── */

export default function AnalyticsPage() {
  const [visitors, setVisitors] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await getAllVisitors();
        setVisitors(mergeExtras(res.data));
      } catch {
        setError('Failed to load analytics data.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ── Computed data ─────────────────────────────────────── */
  const today = new Date().toDateString();

  const todayVisitors  = visitors.filter(v => new Date(v.checkInTime).toDateString() === today);
  const completed      = visitors.filter(v => v.checkOutTime);
  const avgStayMins    = completed.length
    ? completed.reduce((s, v) =>
        s + (new Date(v.checkOutTime) - new Date(v.checkInTime)) / 60000, 0) / completed.length
    : 0;
  const activeNow    = visitors.filter(v => !v.checkOutTime).length;

  // 7-day trend
  const days7     = last7Days();
  const trend7    = days7.map(ds => visitors.filter(v => new Date(v.checkInTime).toDateString() === ds).length);
  const labels7   = days7.map(shortDate);

  // Purpose breakdown
  const purposeMap = visitors.reduce((a, v) => { a[v.purposeOfVisit] = (a[v.purposeOfVisit] || 0) + 1; return a; }, {});
  const purposeData = Object.entries(purposeMap)
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, count, pct: Math.round(count / Math.max(visitors.length, 1) * 100) }));

  // Hourly distribution
  const hourData = Array.from({ length: 24 }, (_, h) =>
    visitors.filter(v => new Date(v.checkInTime).getHours() === h).length
  );
  const peakHour = hourData.indexOf(Math.max(...hourData));

  // Most popular purpose
  const topPurpose = purposeData[0]?.label || '—';

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Analytics</h1>
        <p className="text-slate-400 mt-1.5 text-sm">
          Visitor insights and trends for your facility.
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-32">
          <svg className="animate-spin w-8 h-8 text-brand-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* ── KPI Summary Cards ───────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Visitors',   value: visitors.length,            color: 'text-brand-400',   icon: '👥' },
              { label: 'Today\'s Check-ins', value: todayVisitors.length,     color: 'text-emerald-400', icon: '📅' },
              { label: 'Currently Inside', value: activeNow,                  color: 'text-sky-400',     icon: '🏢' },
              { label: 'Avg Stay',         value: fmtDuration(avgStayMins),   color: 'text-amber-400',   icon: '⏱️', isText: true },
            ].map(({ label, value, color, icon, isText }) => (
              <div key={label} className="card p-5 border border-slate-800">
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
                  {icon} {label}
                </p>
                <p className={`text-3xl font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* ── Charts Row ─────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

            {/* 7-Day Trend (takes 2 cols) */}
            <div className="card p-6 lg:col-span-2">
              <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">
                📈 Visitors — Last 7 Days
              </h3>
              {trend7.every(v => v === 0) ? (
                <p className="text-slate-500 text-sm text-center py-8">No visit data for last 7 days</p>
              ) : (
                <LineChart points={trend7} labels={labels7} />
              )}
            </div>

            {/* Hourly Distribution */}
            <div className="card p-6">
              <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">
                🕐 Hourly Distribution
              </h3>
              <HourBars data={hourData} />
              <p className="text-xs text-slate-500 mt-3 text-center">
                Peak: <span className="text-sky-400 font-semibold">
                  {hourData[peakHour] > 0 ? `${peakHour}:00–${peakHour + 1}:00 (${hourData[peakHour]} visits)` : '—'}
                </span>
              </p>
            </div>
          </div>

          {/* ── Purpose Breakdown + Extra Stats ────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Purpose Breakdown (2 cols) */}
            <div className="card p-6 lg:col-span-2">
              <h3 className="text-sm font-semibold text-slate-300 mb-5 uppercase tracking-wider">
                🎯 Visit Purpose Breakdown
              </h3>
              <HBarChart data={purposeData} />
            </div>

            {/* Quick Stats */}
            <div className="card p-6">
              <h3 className="text-sm font-semibold text-slate-300 mb-5 uppercase tracking-wider">
                📊 Quick Facts
              </h3>
              <div className="space-y-4">
                {[
                  { label: 'Most Common',  value: topPurpose,                 color: 'text-brand-400'   },
                  { label: 'Peak Hour',    value: hourData[peakHour] > 0
                      ? `${peakHour}:00 – ${peakHour+1}:00`
                      : '—',                                                  color: 'text-sky-400'     },
                  { label: 'Completed',    value: `${completed.length} visits`, color: 'text-emerald-400' },
                  { label: 'Still Inside', value: `${activeNow} visitor${activeNow !== 1 ? 's' : ''}`,
                                                                              color: 'text-amber-400'   },
                  { label: 'Today',        value: `${todayVisitors.length} check-in${todayVisitors.length !== 1 ? 's' : ''}`,
                                                                              color: 'text-rose-400'    },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex justify-between items-center
                                              border-b border-slate-800 pb-3 last:border-0">
                    <span className="text-xs text-slate-500">{label}</span>
                    <span className={`text-xs font-semibold ${color}`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
