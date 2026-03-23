import { useState, useEffect } from 'react';
import { checkInVisitor, getAllVisitors } from '../api/visitorApi';
import { saveExtra, mergeExtras } from '../utils/visitorExtras';
import { useToast } from '../context/ToastContext';

const PURPOSES = [
  'Client Meeting', 'Job Interview', 'Delivery / Courier',
  'Vendor Visit', 'Personal Visit', 'Maintenance / Repair', 'Other',
];

const initialForm = {
  fullName: '', email: '', phoneNumber: '', purposeOfVisit: '',
  hostName: '', badgeId: '', notes: '',
};

/* ── Browser Notification helper ────────────────────────────── */
const notifyBrowser = (name) => {
  if (!('Notification' in window)) return;
  const send = () => new Notification('VisitorMS — New Check-In', {
    body: `${name} has been checked in successfully.`,
    icon: '/vite.svg',
  });
  if (Notification.permission === 'granted')       send();
  else if (Notification.permission !== 'denied')
    Notification.requestPermission().then(p => p === 'granted' && send());
};

export default function CheckInForm({ onSuccess }) {
  const { addToast }               = useToast();
  const [form, setForm]            = useState(initialForm);
  const [loading, setLoading]      = useState(false);
  const [error, setError]          = useState('');
  const [returningInfo, setReturning] = useState(null); // { count, visits }

  /* ── Returning visitor detection (debounced) ──────────────── */
  useEffect(() => {
    if (!form.email || !form.email.includes('@')) { setReturning(null); return; }
    const timer = setTimeout(async () => {
      try {
        const res   = await getAllVisitors();
        const all   = mergeExtras(res.data);
        const matches = all.filter(v => v.email.toLowerCase() === form.email.trim().toLowerCase());
        if (matches.length > 0) {
          const latest = [...matches].sort((a, b) => new Date(b.checkInTime) - new Date(a.checkInTime))[0];
          setReturning({ count: matches.length, name: latest.fullName, phone: latest.phoneNumber });
          // Auto-fill name and phone if still empty
          setForm(prev => ({
            ...prev,
            fullName:    prev.fullName    || latest.fullName,
            phoneNumber: prev.phoneNumber || latest.phoneNumber,
          }));
        } else {
          setReturning(null);
        }
      } catch { /* silent */ }
    }, 600);
    return () => clearTimeout(timer);
  }, [form.email]);

  /* ── Request notification permission on mount ─────────────── */
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const validate = () => {
    if (!form.fullName.trim())       return 'Full name is required.';
    if (!form.email.trim())          return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Please enter a valid email.';
    if (!form.phoneNumber.trim())    return 'Phone number is required.';
    if (!/^\d{7,15}$/.test(form.phoneNumber.replace(/[\s\-+]/g, ''))) return 'Please enter a valid phone number.';
    if (!form.purposeOfVisit)        return 'Please select a purpose of visit.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); addToast(err, 'error'); return; }
    setLoading(true);
    setError('');
    try {
      const { hostName, badgeId, notes, ...apiData } = form;
      const result = await checkInVisitor(apiData);
      if (hostName || badgeId || notes) saveExtra(result.data.id, { hostName, badgeId, notes });

      addToast(`✅ ${form.fullName} checked in successfully!`, 'success');
      notifyBrowser(form.fullName);
      setForm(initialForm);
      setReturning(null);
      if (onSuccess) onSuccess();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Check-in failed. Is the backend running?';
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Visitor Check-In</h1>
        <p className="text-slate-400 mt-1.5 text-sm">Fill in the details below to register a new visitor.</p>
      </div>

      <div className="card p-8 max-w-2xl">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 flex items-center gap-3 bg-rose-500/10 border border-rose-500/30
                          text-rose-400 rounded-xl px-4 py-3 text-sm font-medium animate-fade-in">
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            {/* Full Name */}
            <div className="sm:col-span-2">
              <label htmlFor="fullName" className="label">Full Name</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                <input id="fullName" name="fullName" type="text" value={form.fullName}
                       onChange={handleChange} placeholder="e.g. Rahul Sharma"
                       className="input-field pl-10" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="label">Email Address</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <input id="email" name="email" type="email" value={form.email}
                       onChange={handleChange} placeholder="rahul@example.com"
                       className="input-field pl-10" />
              </div>
              {/* Returning visitor badge */}
              {returningInfo && (
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-sky-400 animate-fade-in">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Returning visitor — <strong>{returningInfo.count} previous visit{returningInfo.count > 1 ? 's' : ''}</strong>. Details auto-filled.</span>
                </div>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phoneNumber" className="label">Phone Number</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498A1 1 0 0121 15.72V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </span>
                <input id="phoneNumber" name="phoneNumber" type="tel" value={form.phoneNumber}
                       onChange={handleChange} placeholder="9876543210"
                       className="input-field pl-10" />
              </div>
            </div>

            {/* Purpose */}
            <div className="sm:col-span-2">
              <label htmlFor="purposeOfVisit" className="label">Purpose of Visit</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </span>
                <select id="purposeOfVisit" name="purposeOfVisit" value={form.purposeOfVisit}
                        onChange={handleChange} className="input-field pl-10 appearance-none cursor-pointer">
                  <option value="" disabled>Select a purpose...</option>
                  {PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="sm:col-span-2 flex items-center gap-3 pt-1">
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Optional Details</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            {/* Host */}
            <div>
              <label htmlFor="hostName" className="label">
                Host / Person to Meet <span className="ml-1.5 text-slate-600 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
                <input id="hostName" name="hostName" type="text" value={form.hostName}
                       onChange={handleChange} placeholder="e.g. Priya Mehta"
                       className="input-field pl-10" />
              </div>
            </div>

            {/* Badge */}
            <div>
              <label htmlFor="badgeId" className="label">
                Badge / Pass ID <span className="ml-1.5 text-slate-600 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </span>
                <input id="badgeId" name="badgeId" type="text" value={form.badgeId}
                       onChange={handleChange} placeholder="e.g. VB-042"
                       className="input-field pl-10" />
              </div>
            </div>

            {/* Notes */}
            <div className="sm:col-span-2">
              <label htmlFor="notes" className="label">
                Notes / Remarks <span className="ml-1.5 text-slate-600 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-slate-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </span>
                <textarea id="notes" name="notes" rows={3} value={form.notes} onChange={handleChange}
                          placeholder="e.g. Brought a laptop bag, escorted to 3rd floor…"
                          className="input-field pl-10 resize-none" />
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-4">
            <button id="btn-checkin-submit" type="submit" disabled={loading}
                    className="btn-primary flex items-center gap-2 min-w-[140px] justify-center">
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Checking In...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Check In Visitor
                </>
              )}
            </button>
            <button type="button"
                    onClick={() => { setForm(initialForm); setError(''); setReturning(null); }}
                    className="btn-ghost">
              Clear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
