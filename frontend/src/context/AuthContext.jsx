import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

// AuthProvider wraps the entire app and provides auth state globally
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null); // 'vendor' | 'admin'
  const [loading, setLoading] = useState(true);

  // On mount, restore session from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('ss_token');
    const savedUser = localStorage.getItem('ss_user');
    const savedRole = localStorage.getItem('ss_role');

    if (savedToken && savedUser && savedRole) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      setRole(savedRole);
    }
    setLoading(false);
  }, []);

  // Call this after a successful login API response
  function login(userData, userToken, userRole) {
    setUser(userData);
    setToken(userToken);
    setRole(userRole);
    localStorage.setItem('ss_token', userToken);
    localStorage.setItem('ss_user', JSON.stringify(userData));
    localStorage.setItem('ss_role', userRole);
  }

  // Call this on logout button click
  function logout() {
    setUser(null);
    setToken(null);
    setRole(null);
    localStorage.removeItem('ss_token');
    localStorage.removeItem('ss_user');
    localStorage.removeItem('ss_role');
  }

  const value = {
    user,
    token,
    role,
    loading,
    login,
    logout,
    isVendor: role === 'vendor',
    isAdmin: role === 'admin',
    isAuthenticated: !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook for consuming auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
