import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface AdminContextType {
  isAdmin: boolean;
  login: (password: string) => boolean;
  logout: () => void;
  showAdminPanel: boolean;
  setShowAdminPanel: (show: boolean) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

// You can change this password - default is "viral2025"
const ADMIN_PASSWORD = 'viral2025';
const STORAGE_KEY = 'viral_calendar_admin';

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [isAdmin, setIsAdmin] = useState(() => {
    // Check if already logged in
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    }
    return false;
  });
  
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  const login = useCallback((password: string): boolean => {
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true);
      localStorage.setItem(STORAGE_KEY, 'true');
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setIsAdmin(false);
    localStorage.removeItem(STORAGE_KEY);
    setShowAdminPanel(false);
  }, []);

  return (
    <AdminContext.Provider value={{
      isAdmin,
      login,
      logout,
      showAdminPanel,
      setShowAdminPanel
    }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return context;
};

export { ADMIN_PASSWORD };
