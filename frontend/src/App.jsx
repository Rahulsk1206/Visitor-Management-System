import { NavLink, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import CheckInForm      from './components/CheckInForm';
import VisitorDashboard from './components/VisitorDashboard';
import ProtectedRoute   from './components/ProtectedRoute';
import LoginPage        from './pages/LoginPage';
import AnalyticsPage    from './pages/AnalyticsPage';
import KioskPage        from './pages/KioskPage';
import { useState }     from 'react';
import { useVisitorContext } from './context/VisitorContext';
import { useAuth }      from './context/AuthContext';

export default function App() {
  const [mobileOpen, setMobileOpen]       = useState(false);
  const { activeCount }                   = useVisitorContext();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate                          = useNavigate();
  const isAdmin                           = user?.role === 'Admin';

  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  const NAV_ITEMS = [
    {
      to: '/checkin', id: 'nav-checkin', label: 'Check In', badge: null,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
    },
    {
      to: '/dashboard', id: 'nav-dashboard', label: 'Dashboard',
      badge: activeCount > 0 ? activeCount : null,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
      ),
    },
    // Analytics — Admin only
    ...(isAdmin ? [{
      to: '/analytics', id: 'nav-analytics', label: 'Analytics', badge: null,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    }] : []),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">

      {/* ── Nav (only when authenticated) ───────────────── */}
      {isAuthenticated && (
        <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">

              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700
                                flex items-center justify-center shadow-lg shadow-brand-900/50">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5
                             M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-white text-sm leading-tight">VisitorMS</p>
                  <p className="text-slate-500 text-[10px] leading-tight">Management System</p>
                </div>
              </div>

              {/* Desktop Nav */}
              <nav className="hidden sm:flex items-center gap-1">
                {NAV_ITEMS.map(({ to, id, label, icon, badge }) => (
                  <NavLink key={to} to={to} id={id}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                       ${isActive ? 'bg-brand-600 text-white shadow shadow-brand-900/50'
                                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'}`
                    }>
                    {icon}{label}
                    {badge !== null && (
                      <span className="ml-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500
                                       text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                        {badge}
                      </span>
                    )}
                  </NavLink>
                ))}

                {/* Kiosk Mode button */}
                <button onClick={() => navigate('/kiosk')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                                   text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all duration-200">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Kiosk
                </button>
              </nav>

              {/* Right: live indicator + user + logout */}
              <div className="hidden sm:flex items-center gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  System Online
                </div>
                {user && (
                  <div className="flex items-center gap-2 border-l border-slate-800 pl-3">
                    <div className="w-7 h-7 rounded-full bg-brand-600/20 border border-brand-500/30
                                    flex items-center justify-center text-brand-400 font-bold text-xs">
                      {user.avatar}
                    </div>
                    <div className="text-right leading-tight">
                      <p className="text-xs font-semibold text-slate-200">{user.name}</p>
                      <p className="text-[10px] text-slate-500">{user.role}</p>
                    </div>
                    <button id="btn-logout" onClick={handleLogout} title="Sign out"
                            className="ml-1 p-1.5 rounded-lg text-slate-500 hover:text-rose-400
                                       hover:bg-rose-500/10 transition-all duration-200">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile hamburger */}
              <button id="btn-mobile-menu" onClick={() => setMobileOpen(o => !o)}
                      className="sm:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {mobileOpen
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
                </svg>
              </button>
            </div>

            {/* Mobile dropdown */}
            {mobileOpen && (
              <nav className="sm:hidden pb-4 flex flex-col gap-1 animate-fade-in">
                {NAV_ITEMS.map(({ to, id, label, icon, badge }) => (
                  <NavLink key={to} to={to} id={`mobile-${id}`} onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                       ${isActive ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'}`
                    }>
                    {icon}{label}
                    {badge !== null && (
                      <span className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500
                                       text-white text-[10px] font-bold flex items-center justify-center">{badge}</span>
                    )}
                  </NavLink>
                ))}
                <button onClick={() => { setMobileOpen(false); navigate('/kiosk'); }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                                   text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all duration-200">
                  🖥️ Kiosk Mode
                </button>
                <button onClick={() => { setMobileOpen(false); handleLogout(); }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                                   text-rose-400 hover:bg-rose-500/10 transition-all duration-200 mt-1">
                  🚪 Sign Out
                </button>
              </nav>
            )}
          </div>
        </header>
      )}

      {/* ── Main Content ─────────────────────────────────── */}
      <main className={`flex-1 w-full mx-auto ${isAuthenticated ? 'max-w-7xl px-4 sm:px-6 lg:px-8 py-10' : ''}`}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/kiosk" element={<KioskPage />} />

          {/* Protected routes */}
          <Route path="/checkin"   element={<ProtectedRoute><CheckInForm /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><VisitorDashboard /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />

          {/* Defaults */}
          <Route path="/"  element={<Navigate to="/checkin" replace />} />
          <Route path="*"  element={<Navigate to="/checkin" replace />} />
        </Routes>
      </main>

      {/* Footer */}
      {isAuthenticated && (
        <footer className="border-t border-slate-800 py-5 text-center text-xs text-slate-600">
          © {new Date().getFullYear()} VisitorMS · Built with React + Spring Boot
        </footer>
      )}
    </div>
  );
}
