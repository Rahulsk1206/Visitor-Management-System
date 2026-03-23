import { useState } from 'react';
import { checkInVisitor } from '../api/visitorApi';
import AIChatbot from '../components/AIChatbot';

const PURPOSES = [
  'Client Meeting', 'Job Interview', 'Delivery / Courier',
  'Vendor Visit', 'Personal Visit', 'Maintenance / Repair', 'Other',
];

const init = { fullName: '', email: '', phoneNumber: '', purposeOfVisit: '' };

export default function KioskPage() {
  const [form, setForm]       = useState(init);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error,   setError]   = useState('');

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError(''); setSuccess('');
  };

  const validate = () => {
    if (!form.fullName.trim())    return 'Full name is required.';
    if (!form.email.trim())       return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Please enter a valid email.';
    if (!form.phoneNumber.trim()) return 'Phone number is required.';
    if (!form.purposeOfVisit)     return 'Please select a purpose.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    try {
      await checkInVisitor(form);
      setSuccess(`Welcome, ${form.fullName}! You are now checked in. ✅`);
      setForm(init);
      // Auto-clear after 8 seconds
      setTimeout(() => setSuccess(''), 8000);
    } catch {
      setError('Check-in failed. Please ask reception for help.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 py-10 relative overflow-hidden">

      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-brand-700/15 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-brand-600/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg animate-fade-in">

        {/* Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700
                          items-center justify-center shadow-xl shadow-brand-900/50 mb-4">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white">Visitor Self Check-In</h1>
          <p className="text-slate-400 mt-2">Please fill in your details below</p>
        </div>

        {/* Success */}
        {success && (
          <div className="mb-6 bg-emerald-500/15 border border-emerald-500/40 text-emerald-300
                          rounded-2xl px-6 py-5 text-center animate-fade-in">
            <p className="text-2xl mb-1">🎉</p>
            <p className="text-lg font-semibold">{success}</p>
            <p className="text-sm text-emerald-500 mt-2">This screen will reset automatically.</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 bg-rose-500/15 border border-rose-500/40 text-rose-300
                          rounded-xl px-4 py-3 text-sm text-center animate-fade-in">
            {error}
          </div>
        )}

        {!success && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
            <form onSubmit={handleSubmit} noValidate className="space-y-5">

              {/* Full Name */}
              <div>
                <label className="label text-base">Full Name</label>
                <input name="fullName" type="text" value={form.fullName} onChange={handleChange}
                       placeholder="Your full name" autoFocus
                       className="input-field text-lg py-4" />
              </div>

              {/* Email + Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label text-base">Email</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange}
                         placeholder="you@email.com" className="input-field py-4" />
                </div>
                <div>
                  <label className="label text-base">Phone</label>
                  <input name="phoneNumber" type="tel" value={form.phoneNumber} onChange={handleChange}
                         placeholder="9876543210" className="input-field py-4" />
                </div>
              </div>

              {/* Purpose */}
              <div>
                <label className="label text-base">Purpose of Visit</label>
                <select name="purposeOfVisit" value={form.purposeOfVisit} onChange={handleChange}
                        className="input-field py-4 appearance-none cursor-pointer text-base">
                  <option value="" disabled>Select a purpose…</option>
                  {PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading}
                      className="btn-primary w-full py-5 text-lg flex items-center justify-center gap-2 mt-2">
                {loading ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Checking You In…
                  </>
                ) : (
                  <>✅ Check Me In</>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Back link */}
        <p className="text-center text-xs text-slate-600 mt-6">
          Having trouble? Please ask the reception desk for assistance.
        </p>
      </div>
      
      {/* ── AI Concierge ── */}
      <AIChatbot />
      
    </div>
  );
}
