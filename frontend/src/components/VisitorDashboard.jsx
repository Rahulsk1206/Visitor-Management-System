import { useState, useEffect, useCallback } from 'react';
import { getAllVisitors, checkOutVisitor, deleteVisitor } from '../api/visitorApi';
import { mergeExtras, deleteExtra } from '../utils/visitorExtras';
import { useVisitorContext } from '../context/VisitorContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

/* ── Constants ─────────────────────────────────────────────── */
const OVERSTAY_MINS = 120; // 2 hours

/* ── Helpers ───────────────────────────────────────────────── */
const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
};

const getMinutes = (checkIn, checkOut) => {
  const end   = checkOut ? new Date(checkOut) : new Date();
  return Math.max(0, Math.floor((end - new Date(checkIn)) / 60000));
};

const formatDuration = (mins) => {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const isOverstay = (v) => !v.checkOutTime && getMinutes(v.checkInTime) > OVERSTAY_MINS;

/* ── Animated Number ───────────────────────────────────────── */
function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let cur = 0;
    if (value === 0) { setDisplay(0); return; }
    const step = Math.max(1, Math.ceil(value / 24));
    const id = setInterval(() => {
      cur = Math.min(cur + step, value);
      setDisplay(cur);
      if (cur >= value) clearInterval(id);
    }, 28);
    return () => clearInterval(id);
  }, [value]);
  return <>{display}</>;
}

/* ── Date filter helpers ───────────────────────────────────── */
const startOfDay  = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
const endOfDay    = (d) => { const x = new Date(d); x.setHours(23,59,59,999); return x; };
const startOfWeek = (d) => { const x = new Date(d); x.setDate(d.getDate() - d.getDay()); x.setHours(0,0,0,0); return x; };

const matchesDate = (v, dateFilter, dateFrom, dateTo) => {
  if (dateFilter === 'all')     return true;
  const ci  = new Date(v.checkInTime);
  const now = new Date();
  if (dateFilter === 'today')   return ci >= startOfDay(now) && ci <= endOfDay(now);
  if (dateFilter === 'week')    return ci >= startOfWeek(now);
  if (dateFilter === 'month')   return ci.getMonth() === now.getMonth() && ci.getFullYear() === now.getFullYear();
  if (dateFilter === 'custom') {
    const from = dateFrom ? startOfDay(new Date(dateFrom)) : null;
    const to   = dateTo   ? endOfDay(new Date(dateTo))     : null;
    if (from && ci < from) return false;
    if (to   && ci > to)   return false;
    return true;
  }
  return true;
};

/* ── CSV Export ────────────────────────────────────────────── */
const exportCSV = (visitors) => {
  const headers = ['#','Name','Email','Phone','Purpose','Host','Badge','CheckIn','CheckOut','Duration','Status','Notes'];
  const rows = visitors.map((v, i) => [
    i+1, v.fullName, v.email, v.phoneNumber, v.purposeOfVisit,
    v.hostName||'', v.badgeId||'',
    formatDateTime(v.checkInTime), formatDateTime(v.checkOutTime),
    formatDuration(getMinutes(v.checkInTime, v.checkOutTime)),
    v.checkOutTime ? 'Checked Out' : 'Active',
    v.notes||'',
  ]);
  const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const url  = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const a    = Object.assign(document.createElement('a'), { href: url, download: `visitors_${new Date().toISOString().split('T')[0]}.csv` });
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
};

/* ── Print Pass ────────────────────────────────────────────── */
const printPass = (v) => {
  const w = window.open('', '_blank', 'width=440,height=560');
  const fmt = (s) => new Date(s).toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit', hour12:true });
  w.document.write(`<!DOCTYPE html><html><head><title>Visitor Pass — ${v.fullName}</title>
  <style>
    *{box-sizing:border-box} body{font-family:'Segoe UI',sans-serif;margin:0;padding:20px;background:#f8fafc}
    .pass{max-width:380px;margin:0 auto;border:2px solid #6366f1;border-radius:14px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.15)}
    .hd{background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;padding:20px 24px;text-align:center}
    .hd h1{margin:0;font-size:20px;letter-spacing:.5px} .hd p{margin:4px 0 0;font-size:11px;opacity:.8}
    .body{padding:20px 24px}.name{font-size:22px;font-weight:700;color:#111;margin:0 0 4px}
    .badge{display:inline-block;background:#f3f4f6;border:1px solid #d1d5db;border-radius:6px;padding:2px 10px;font-family:monospace;font-size:13px;margin:6px 0 12px}
    .row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px}
    .row:last-child{border:none} .lbl{color:#64748b} .val{font-weight:600;color:#111;text-align:right;max-width:200px}
    .ft{background:#f8fafc;padding:12px 24px;text-align:center;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0}
    @media print{body{margin:0;padding:0} .pass{box-shadow:none;border-radius:0;border-color:#333}}
  </style></head><body>
  <div class="pass">
    <div class="hd"><h1>🏢 VisitorMS</h1><p>Official Visitor Pass</p></div>
    <div class="body">
      <p class="name">${v.fullName}</p>
      ${v.badgeId ? `<div class="badge">🪪 ${v.badgeId}</div>` : ''}
      <div class="row"><span class="lbl">Purpose</span><span class="val">${v.purposeOfVisit}</span></div>
      ${v.hostName ? `<div class="row"><span class="lbl">Meeting With</span><span class="val">${v.hostName}</span></div>` : ''}
      <div class="row"><span class="lbl">Email</span><span class="val">${v.email}</span></div>
      <div class="row"><span class="lbl">Phone</span><span class="val">${v.phoneNumber}</span></div>
      <div class="row"><span class="lbl">Check-In</span><span class="val">${fmt(v.checkInTime)}</span></div>
      ${v.notes ? `<div class="row"><span class="lbl">Notes</span><span class="val">${v.notes}</span></div>` : ''}
    </div>
    <div class="ft">Generated by VisitorMS · ${new Date().toLocaleDateString('en-IN')}</div>
  </div>
  <script>window.onload=()=>{window.print();}</script>
  </body></html>`);
  w.document.close();
};

/* ── Filter constants ──────────────────────────────────────── */
const STATUS_FILTERS = [
  { key: 'all', label: 'All' }, { key: 'active', label: '🟢 Active' }, { key: 'out', label: '⚫ Checked Out' },
];
const DATE_FILTERS = [
  { key: 'all', label: 'All Time' }, { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' }, { key: 'month', label: 'This Month' }, { key: 'custom', label: 'Custom…' },
];

/* ── Component ─────────────────────────────────────────────── */
export default function VisitorDashboard() {
  const { setActiveCount } = useVisitorContext();
  const { user }           = useAuth();
  const { addToast }       = useToast();
  const isAdmin            = user?.role === 'Admin';

  const [visitors,    setVisitors]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [checkingOut, setCheckingOut] = useState(null);
  const [deleting,    setDeleting]    = useState(null);
  const [copied,      setCopied]      = useState(null);

  // filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter,   setDateFilter]   = useState(isAdmin ? 'all' : 'today');
  const [dateFrom,     setDateFrom]     = useState('');
  const [dateTo,       setDateTo]       = useState('');
  const [search,       setSearch]       = useState('');

  // Live ticker — force re-render every second for active visitors
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  /* Fetch ───────────────────────────────────────────────────── */
  const fetchVisitors = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res    = await getAllVisitors();
      const sorted = mergeExtras(res.data).sort((a,b) => new Date(b.checkInTime) - new Date(a.checkInTime));
      setVisitors(sorted);
      setActiveCount(sorted.filter(v => !v.checkOutTime).length);
    } catch {
      setError('Failed to load visitor data. Is the backend running on port 8080?');
    } finally {
      setLoading(false);
    }
  }, [setActiveCount]);

  useEffect(() => { fetchVisitors(); }, [fetchVisitors]);

  /* Actions ─────────────────────────────────────────────────── */
  const handleCheckOut = async (id) => {
    setCheckingOut(id);
    try {
      await checkOutVisitor(id);
      setVisitors(prev => {
        const next = prev.map(v => v.id === id ? { ...v, checkOutTime: new Date().toISOString() } : v);
        setActiveCount(next.filter(v => !v.checkOutTime).length);
        return next;
      });
      addToast('Visitor checked out successfully.', 'info');
    } catch {
      addToast('Check-out failed. Please try again.', 'error');
    } finally { setCheckingOut(null); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this visitor record permanently?')) return;
    setDeleting(id);
    try {
      await deleteVisitor(id);
      deleteExtra(id);
      setVisitors(prev => {
        const next = prev.filter(v => v.id !== id);
        setActiveCount(next.filter(v => !v.checkOutTime).length);
        return next;
      });
      addToast('Visitor record deleted.', 'warning');
    } catch {
      addToast('Deletion failed.', 'error');
    } finally { setDeleting(null); }
  };

  const copyToClipboard = async (text, key) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    addToast(`Copied: ${text}`, 'info', 1800);
    setTimeout(() => setCopied(null), 2000);
  };

  /* Filtering ───────────────────────────────────────────────── */
  const displayed = visitors.filter(v => {
    const st = statusFilter === 'all' ? true : statusFilter === 'active' ? !v.checkOutTime : !!v.checkOutTime;
    const dt = matchesDate(v, dateFilter, dateFrom, dateTo);
    const q  = search.toLowerCase();
    const sr = !q || v.fullName.toLowerCase().includes(q) || v.email.toLowerCase().includes(q) ||
               v.purposeOfVisit.toLowerCase().includes(q) || (v.hostName||'').toLowerCase().includes(q) ||
               (v.badgeId||'').toLowerCase().includes(q);
    return st && dt && sr;
  });

  const activeCount     = visitors.filter(v => !v.checkOutTime).length;
  const checkedOutCount = visitors.filter(v =>  !!v.checkOutTime).length;
  const overstayCount   = visitors.filter(v => isOverstay(v)).length;

  // Today stats
  const today    = new Date().toDateString();
  const todayVis = visitors.filter(v => new Date(v.checkInTime).toDateString() === today);
  const completed= todayVis.filter(v => v.checkOutTime);
  const avgToday = completed.length
    ? Math.round(completed.reduce((s,v) => s + getMinutes(v.checkInTime, v.checkOutTime), 0) / completed.length)
    : 0;
  const topPurposeToday = (() => {
    const m = todayVis.reduce((a, v) => { a[v.purposeOfVisit] = (a[v.purposeOfVisit]||0)+1; return a; }, {});
    const e = Object.entries(m).sort((a,b)=>b[1]-a[1]);
    return e[0]?.[0] || '—';
  })();

  /* ── Render ────────────────────────────────────────────────── */
  return (
    <div className="animate-fade-in">

      {/* Page Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Visitor Dashboard</h1>
          <p className="text-slate-400 mt-1.5 text-sm">Live log of all visitor activity in your facility.</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isAdmin && (
            <button id="btn-export-csv" onClick={() => exportCSV(displayed)} disabled={displayed.length === 0}
                    className="btn-ghost flex items-center gap-2 border border-slate-700 disabled:opacity-40">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
          )}
          <button id="btn-refresh" onClick={fetchVisitors} disabled={loading}
                  className="btn-ghost flex items-center gap-2 border border-slate-700">
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* ── Today's Summary Card ─────────────────────────── */}
      <div className="card border border-sky-500/20 bg-sky-500/5 p-5 mb-6">
        <p className="text-xs text-sky-400 font-semibold uppercase tracking-wider mb-3">📅 Today at a Glance</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { label: "Check-ins",    value: todayVis.length,                  color: 'text-white'        },
            { label: "Avg Stay",     value: avgToday ? `${avgToday}m` : '—', color: 'text-sky-300'      },
            { label: "Top Purpose",  value: topPurposeToday,                  color: 'text-amber-300', small: true },
            { label: "Overstays",    value: overstayCount,                    color: overstayCount > 0 ? 'text-rose-400' : 'text-emerald-400' },
          ].map(({ label, value, color, small }) => (
            <div key={label}>
              <p className={`${small ? 'text-sm' : 'text-2xl'} font-bold ${color}`}>{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Visitors',   value: visitors.length,   color: 'text-brand-400',   bg: 'bg-brand-500/10 border-brand-500/20'     },
          { label: 'Currently Inside', value: activeCount,        color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Checked Out',      value: checkedOutCount,   color: 'text-slate-300',   bg: 'bg-slate-700/40 border-slate-600/40'     },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`card border ${bg} p-5`}>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
            <p className={`text-4xl font-bold mt-1 ${color}`}>
              <AnimatedNumber value={value} />
            </p>
          </div>
        ))}
      </div>

      {/* Overstay Alert */}
      {overstayCount > 0 && (
        <div className="mb-4 flex items-center gap-3 bg-rose-500/10 border border-rose-500/30
                        text-rose-400 rounded-xl px-4 py-3 text-sm font-medium animate-fade-in">
          <svg className="w-5 h-5 shrink-0 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          ⏰ <strong>{overstayCount} visitor{overstayCount > 1 ? 's' : ''}</strong> {overstayCount > 1 ? 'have' : 'has'} been inside for more than 2 hours — rows highlighted below.
        </div>
      )}

      {/* Staff notice */}
      {!isAdmin && (
        <div className="mb-4 flex items-center gap-3 bg-amber-500/10 border border-amber-500/30
                        text-amber-400 rounded-xl px-4 py-3 text-sm animate-fade-in">
          ℹ️ <span><strong>Staff view</strong> — Delete and Export CSV are available to <strong>Admins only</strong>.</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-center gap-3 bg-rose-500/10 border border-rose-500/30
                        text-rose-400 rounded-xl px-4 py-3 text-sm font-medium animate-fade-in">
          {error}
        </div>
      )}

      {/* ── Filter Bar ───────────────────────────────────── */}
      <div className="card p-4 mb-4 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex gap-1 bg-slate-800 p-1 rounded-xl shrink-0">
            {STATUS_FILTERS.map(({ key, label }) => (
              <button key={key} id={`filter-${key}`} onClick={() => setStatusFilter(key)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
                        ${statusFilter === key ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="relative flex-1 w-full">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input id="search-visitors" type="text" value={search} onChange={e => setSearch(e.target.value)}
                   placeholder="Search name, email, purpose, host or badge…"
                   className="input-field pl-10 py-2 w-full" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider shrink-0">Date:</span>
          <div className="flex gap-1 bg-slate-800 p-1 rounded-xl flex-wrap">
            {DATE_FILTERS.map(({ key, label }) => (
              <button key={key} id={`date-filter-${key}`} onClick={() => setDateFilter(key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap
                        ${dateFilter === key ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}>
                {label}
              </button>
            ))}
          </div>
          {dateFilter === 'custom' && (
            <div className="flex items-center gap-2 animate-fade-in flex-wrap">
              <input id="date-from" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                     className="input-field py-1.5 px-3 text-xs" style={{ colorScheme: 'dark' }} />
              <span className="text-slate-500 text-xs">to</span>
              <input id="date-to" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                     className="input-field py-1.5 px-3 text-xs" style={{ colorScheme: 'dark' }} />
              {(dateFrom || dateTo) && (
                <button onClick={() => { setDateFrom(''); setDateTo(''); }}
                        className="text-xs text-slate-500 hover:text-slate-300 transition">Clear</button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────── */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <svg className="animate-spin w-8 h-8 text-brand-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500">
            <svg className="w-12 h-12 mb-3 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="font-medium">No visitors found</p>
            <p className="text-sm mt-1">Try adjusting your filters or search term.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/50">
                  {['#','Visitor','Contact','Purpose & Host','Check In','Check Out','Duration','Status','Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold uppercase tracking-wider
                                          text-slate-400 px-5 py-3.5 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.map((v, i) => {
                  const overstay = isOverstay(v);
                  const mins     = getMinutes(v.checkInTime, v.checkOutTime);
                  return (
                    <tr key={v.id}
                        className={`border-b border-slate-800/60 transition-colors duration-150
                          ${overstay ? 'bg-rose-500/5 hover:bg-rose-500/10' : 'hover:bg-slate-800/40'}`}>

                      {/* # */}
                      <td className="px-5 py-4 text-slate-500 font-mono text-xs">{i + 1}</td>

                      {/* Visitor */}
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full border flex items-center justify-center
                                           font-bold text-xs shrink-0 mt-0.5
                                           ${overstay ? 'bg-rose-600/20 border-rose-500/30 text-rose-400'
                                                      : 'bg-brand-600/20 border-brand-500/30 text-brand-400'}`}>
                            {v.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-slate-100">{v.fullName}</span>
                              {overstay && (
                                <span title="Overstay! Inside 2+ hours"
                                      className="text-rose-400 text-xs animate-pulse">⏰</span>
                              )}
                            </div>
                            {v.badgeId && (
                              <span className="inline-flex items-center gap-1 mt-0.5 text-[11px] font-mono
                                               text-amber-400 bg-amber-500/10 border border-amber-500/20
                                               rounded px-1.5 py-0.5">🪪 {v.badgeId}</span>
                            )}
                            {v.notes && (
                              <p className="text-[11px] text-slate-500 italic mt-0.5 max-w-[160px] truncate"
                                 title={v.notes}>{v.notes}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact — copy on click */}
                      <td className="px-5 py-4">
                        <button onClick={() => copyToClipboard(v.email, `email-${v.id}`)}
                                className="block text-left text-slate-300 hover:text-sky-400 transition text-xs group"
                                title="Click to copy email">
                          {v.email}
                          <span className="ml-1 text-slate-600 group-hover:text-sky-400 text-[10px]">
                            {copied === `email-${v.id}` ? '✓' : '⎘'}
                          </span>
                        </button>
                        <button onClick={() => copyToClipboard(v.phoneNumber, `phone-${v.id}`)}
                                className="block text-left text-slate-500 hover:text-sky-400 transition text-[11px] mt-0.5 group"
                                title="Click to copy phone">
                          {v.phoneNumber}
                          <span className="ml-1 text-slate-600 group-hover:text-sky-400 text-[10px]">
                            {copied === `phone-${v.id}` ? '✓' : '⎘'}
                          </span>
                        </button>
                      </td>

                      {/* Purpose + Host */}
                      <td className="px-5 py-4">
                        <div className="text-slate-300 whitespace-nowrap">{v.purposeOfVisit}</div>
                        {v.hostName && (
                          <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5 whitespace-nowrap">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {v.hostName}
                          </div>
                        )}
                      </td>

                      {/* Check In */}
                      <td className="px-5 py-4 text-slate-400 whitespace-nowrap text-xs">
                        {formatDateTime(v.checkInTime)}
                      </td>

                      {/* Check Out */}
                      <td className="px-5 py-4 text-slate-400 whitespace-nowrap text-xs">
                        {formatDateTime(v.checkOutTime)}
                      </td>

                      {/* Duration — live ticker for active */}
                      <td className="px-5 py-4 text-xs whitespace-nowrap">
                        <span className={overstay ? 'text-rose-400 font-semibold' : 'text-slate-400'}>
                          {formatDuration(mins)}
                        </span>
                        {!v.checkOutTime && (
                          <span className={`ml-1 text-[10px] ${overstay ? 'text-rose-500' : 'text-emerald-500'} animate-pulse`}>
                            ● {overstay ? 'OVERSTAY' : 'live'}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        {!v.checkOutTime ? (
                          <span className={`badge-active ${overstay ? '!bg-rose-500/20 !border-rose-500/40 !text-rose-400' : ''}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${overstay ? 'bg-rose-400' : 'bg-emerald-400'} animate-pulse`} />
                            {overstay ? 'Overstay' : 'Active'}
                          </span>
                        ) : (
                          <span className="badge-checkedout">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                            Checked Out
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          {!v.checkOutTime && (
                            <button id={`btn-checkout-${v.id}`} onClick={() => handleCheckOut(v.id)}
                                    disabled={checkingOut === v.id} className="btn-danger text-xs">
                              {checkingOut === v.id ? (
                                <svg className="animate-spin w-3 h-3 inline mr-1" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                </svg>
                              ) : null}
                              Check Out
                            </button>
                          )}

                          {/* Print pass */}
                          <button onClick={() => printPass(v)} title="Print visitor pass"
                                  className="p-1.5 text-slate-600 hover:text-sky-400 hover:bg-sky-500/10 rounded-lg transition-all duration-200">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                          </button>

                          {/* Delete — Admin only */}
                          {isAdmin && (
                            <button id={`btn-delete-${v.id}`} onClick={() => handleDelete(v.id)}
                                    disabled={deleting === v.id} title="Delete record"
                                    className="p-1.5 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all duration-200">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && displayed.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-800 text-xs text-slate-500">
            Showing {displayed.length} of {visitors.length} visitors
            {overstayCount > 0 && (
              <span className="ml-3 text-rose-400 font-medium">⏰ {overstayCount} overstay alert{overstayCount > 1 ? 's' : ''}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
