import { createContext, useContext, useState } from 'react';

/* ── Demo credentials (no backend auth needed) ─────────────── */
const DEMO_USERS = [
  {
    email: 'admin@visitorms.com',
    password: 'admin123',
    role: 'Admin',
    name: 'Admin User',
    avatar: 'A',
  },
  {
    email: 'staff@visitorms.com',
    password: 'staff123',
    role: 'Staff',
    name: 'Reception Staff',
    avatar: 'S',
  },
];

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('vms_user')) || null;
    } catch {
      return null;
    }
  });

  const login = (email, password) => {
    const found = DEMO_USERS.find(
      (u) =>
        u.email.toLowerCase() === email.trim().toLowerCase() &&
        u.password === password,
    );
    if (found) {
      const { password: _pw, ...safeUser } = found;
      setUser(safeUser);
      localStorage.setItem('vms_user', JSON.stringify(safeUser));
      return { success: true };
    }
    return { success: false, error: 'Invalid email or password. Please try again.' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('vms_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
