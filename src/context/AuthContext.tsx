import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types/queue';
import { DEMO_USERS } from '../data/initialData';
import { QueueApi } from '../services/api';

interface AuthContextType {
  currentUser: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  loginAsCitizen: (identifier: string, password?: string) => Promise<User>;
  loginAsEmployee: (staffId: string, password?: string) => Promise<User>;
  loginAsAdmin: (passcode?: string) => Promise<User>;
  registerCitizen: (data: { name: string; email: string; phone: string; nationalId: string }) => Promise<User>;
  logout: () => void;
  allUsers: User[];
  loginError: string | null;
  setLoginError: (err: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('smartgov_current_user_v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    // Default to null so user arrives at the dedicated Login / Gateway screen!
    return null;
  });

  const [allUsers, setAllUsers] = useState<User[]>(DEMO_USERS);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    QueueApi.getUsers().then(setAllUsers).catch(console.error);
  }, []);

  const loginAsCitizen = async (identifier: string, _password?: string): Promise<User> => {
    setLoginError(null);
    const users = await QueueApi.getUsers();
    const cleanId = identifier.trim().toLowerCase();

    // Match by email, phone, national ID, or name
    const citizen = users.find(
      (u) =>
        u.role === 'citizen' &&
        (u.email.toLowerCase() === cleanId ||
          u.phone?.replace(/\s+/g, '') === cleanId.replace(/\s+/g, '') ||
          u.nationalId?.toLowerCase() === cleanId ||
          u.name.toLowerCase().includes(cleanId))
    );

    if (!citizen) {
      const demoCitizen = DEMO_USERS.find((u) => u.role === 'citizen')!;
      // If user typed 'demo' or clicked demo fill
      if (cleanId.includes('demo') || cleanId.includes('anjali')) {
        setCurrentUser(demoCitizen);
        localStorage.setItem('smartgov_current_user_v2', JSON.stringify(demoCitizen));
        return demoCitizen;
      }
      throw new Error('Citizen account not found. Please register or enter a valid Citizen ID / Email.');
    }

    setCurrentUser(citizen);
    localStorage.setItem('smartgov_current_user_v2', JSON.stringify(citizen));
    return citizen;
  };

  const loginAsEmployee = async (staffId: string, _password?: string): Promise<User> => {
    setLoginError(null);
    const users = await QueueApi.getUsers();
    const cleanId = staffId.trim().toUpperCase();

    const staff = users.find(
      (u) =>
        u.role === 'staff' &&
        (u.staffId?.toUpperCase() === cleanId ||
          u.email.toUpperCase() === cleanId ||
          u.name.toUpperCase().includes(cleanId))
    );

    if (!staff) {
      const demoStaff = DEMO_USERS.find((u) => u.role === 'staff')!;
      if (cleanId.includes('STAFF') || cleanId.includes('RAJESH') || cleanId.includes('DEMO')) {
        setCurrentUser(demoStaff);
        localStorage.setItem('smartgov_current_user_v2', JSON.stringify(demoStaff));
        return demoStaff;
      }
      throw new Error('Unauthorized Employee ID. Only authorized public officers may log in to Staff Desk.');
    }

    setCurrentUser(staff);
    localStorage.setItem('smartgov_current_user_v2', JSON.stringify(staff));
    return staff;
  };

  const loginAsAdmin = async (_passcode?: string): Promise<User> => {
    setLoginError(null);
    const users = await QueueApi.getUsers();
    const admin = users.find((u) => u.role === 'admin') || DEMO_USERS.find((u) => u.role === 'admin')!;
    setCurrentUser(admin);
    localStorage.setItem('smartgov_current_user_v2', JSON.stringify(admin));
    return admin;
  };

  const registerCitizen = async (data: { name: string; email: string; phone: string; nationalId: string }): Promise<User> => {
    setLoginError(null);
    const newUser = await QueueApi.registerCitizen(data);
    setCurrentUser(newUser);
    localStorage.setItem('smartgov_current_user_v2', JSON.stringify(newUser));
    setAllUsers((prev) => [...prev, newUser]);
    return newUser;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('smartgov_current_user_v2');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role: currentUser?.role || null,
        isAuthenticated: !!currentUser,
        loginAsCitizen,
        loginAsEmployee,
        loginAsAdmin,
        registerCitizen,
        logout,
        allUsers,
        loginError,
        setLoginError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
