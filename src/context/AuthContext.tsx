import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, ResetRequest, UserRole, UserStatus } from '../types';
import { ALL_PERMS, ROLE_PRESETS } from '../data/constants';

const USERS_KEY = 'credlock_ts_users_v1';
const SESSION_KEY = 'credlock_ts_session_v1';
const RESET_KEY = 'credlock_ts_resets_v1';

export interface AuthContextType {
  currentUser: User | null;
  users: User[];
  resets: ResetRequest[];
  login: (email: string, pin: string) => User;
  logout: () => void;
  register: (data: { name: string; email: string; pin: string; role: UserRole }) => void;
  requestOrResetPin: (data: { email: string; pin?: string; token?: string }) => { message: string };
  issueResetToken: (email: string) => string;
  approveUser: (userId: string) => void;
  rejectUser: (userId: string) => void;
  updateUser: (userId: string, patch: Partial<User>) => void;
  addUser: (data: { name: string; email: string; pin: string; role: UserRole; status?: UserStatus; permissions?: string[] }) => User;
  deleteUser: (userId: string) => void;
  resetUserPin: (userId: string, newPin: string) => void;
  setUserPermissions: (userId: string, perms: string[]) => void;
  can: (perm: string) => boolean;
  isLead: () => boolean;
  isAdmin: () => boolean;
  pendingUsers: () => User[];
  openResets: () => ResetRequest[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function loadUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: User[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function loadResets(): ResetRequest[] {
  try {
    const raw = localStorage.getItem(RESET_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveResets(resets: ResetRequest[]) {
  localStorage.setItem(RESET_KEY, JSON.stringify(resets));
}

function defaultPerms(role: string): string[] {
  return (ROLE_PRESETS[role] || ROLE_PRESETS.officer).slice();
}

function ensureSeedUsers(currentList: User[]): User[] {
  const users = [...currentList];
  const leadEmail = 'techsupport.int@gmail.com';
  let changed = false;

  const leadIndex = users.findIndex(u => u.email.toLowerCase() === leadEmail.toLowerCase() || u.id === 'u-lead-joseph');
  if (leadIndex === -1) {
    users.unshift({
      id: 'u-lead-joseph',
      name: 'Joseph Olayemi',
      email: leadEmail,
      role: 'lead',
      pin: '6424',
      status: 'approved',
      permissions: defaultPerms('lead'),
      createdAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      approvedBy: 'system'
    });
    changed = true;
  } else {
    const lead = users[leadIndex];
    if (lead.pin !== '6424' || lead.status !== 'approved' || lead.role !== 'lead') {
      lead.pin = '6424';
      lead.status = 'approved';
      lead.role = 'lead';
      lead.name = 'Joseph Olayemi';
      lead.permissions = defaultPerms('lead');
      changed = true;
    }
  }

  // Also ensure standard officers Tosin, Peter, Zainab exist for immediate team readiness if not present
  const defaultOfficers = [
    { id: 'u-tosin', name: 'Tosin', email: 'tosin@credlock.africa', role: 'officer' as UserRole, pin: '1111' },
    { id: 'u-peter', name: 'Peter', email: 'peter@credlock.africa', role: 'officer' as UserRole, pin: '2222' },
    { id: 'u-zainab', name: 'Zainab', email: 'zainab@credlock.africa', role: 'officer' as UserRole, pin: '3333' }
  ];

  defaultOfficers.forEach(off => {
    if (!users.some(u => u.email.toLowerCase() === off.email.toLowerCase())) {
      users.push({
        id: off.id,
        name: off.name,
        email: off.email,
        role: off.role,
        pin: off.pin,
        status: 'approved',
        permissions: defaultPerms(off.role),
        createdAt: new Date().toISOString(),
        approvedAt: new Date().toISOString(),
        approvedBy: 'Joseph Olayemi'
      });
      changed = true;
    }
  });

  if (changed) {
    saveUsers(users);
  }
  return users;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => ensureSeedUsers(loadUsers()));
  const [resets, setResets] = useState<ResetRequest[]>(() => loadResets());
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      const all = loadUsers();
      const found = all.find(u => u.id === s.id);
      return found && found.status === 'approved' ? found : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    // ensure seed
    setUsers(prev => ensureSeedUsers(prev));
  }, []);

  const login = (email: string, pin: string): User => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPin = String(pin).trim();
    const all = loadUsers();
    const user = all.find(u => u.email.toLowerCase() === cleanEmail);
    if (!user) throw new Error('Invalid email or PIN');
    if (user.status === 'pending') throw new Error('Account pending Team Lead approval');
    if (user.status === 'rejected') throw new Error('Access rejected. Contact Team Lead.');
    if (user.status === 'disabled') throw new Error('Account disabled by admin');
    if (String(user.pin) !== cleanPin) throw new Error('Invalid email or PIN');

    const fullUser = {
      ...user,
      permissions: user.permissions && user.permissions.length ? user.permissions : defaultPerms(user.role)
    };
    setCurrentUser(fullUser);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(fullUser));
    return fullUser;
  };

  const logout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem(SESSION_KEY);
  };

  const register = ({ name, email, pin, role }: { name: string; email: string; pin: string; role: UserRole }) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanPin = String(pin).trim();
    if (!cleanName || !cleanEmail || !cleanPin) throw new Error('All fields are required');
    if (!/^\d{4,6}$/.test(cleanPin)) throw new Error('PIN must be 4–6 digits');

    const all = loadUsers();
    if (all.some(u => u.email.toLowerCase() === cleanEmail)) throw new Error('Email is already registered');

    const newUser: User = {
      id: 'u-' + Date.now().toString(36),
      name: cleanName,
      email: cleanEmail,
      role: role === 'viewer' ? 'viewer' : 'officer',
      pin: cleanPin,
      status: 'pending',
      permissions: defaultPerms(role),
      createdAt: new Date().toISOString(),
      approvedAt: null,
      approvedBy: null
    };

    const updated = [...all, newUser];
    setUsers(updated);
    saveUsers(updated);
  };

  const requestOrResetPin = ({ email, pin, token }: { email: string; pin?: string; token?: string }) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPin = pin ? String(pin).trim() : '';
    const cleanToken = token ? token.trim() : '';

    const all = loadUsers();
    const user = all.find(u => u.email.toLowerCase() === cleanEmail);
    if (!user) throw new Error('No account found with that email');

    if (!cleanToken) {
      const curResets = loadResets();
      const t = 'RST-' + Math.random().toString(36).slice(2, 10).toUpperCase();
      const updated = [...curResets, { email: cleanEmail, token: t, createdAt: new Date().toISOString(), used: false }];
      setResets(updated);
      saveResets(updated);
      return { message: 'Reset token generated. Ask Team Lead for your token, then submit again with token and new PIN.' };
    }

    const curResets = loadResets();
    const req = curResets.find(r => r.email === cleanEmail && r.token === cleanToken && !r.used);
    if (!req) throw new Error('Invalid or already used reset token');
    if (!/^\d{4,6}$/.test(cleanPin)) throw new Error('PIN must be 4–6 digits');

    user.pin = cleanPin;
    req.used = true;
    setUsers([...all]);
    saveUsers(all);
    setResets([...curResets]);
    saveResets(curResets);

    return { message: 'PIN updated successfully! You can now sign in.' };
  };

  const issueResetToken = (email: string): string => {
    const cleanEmail = email.trim().toLowerCase();
    const all = loadUsers();
    if (!all.some(u => u.email.toLowerCase() === cleanEmail)) throw new Error('User not found');

    const curResets = loadResets();
    const t = 'RST-' + Math.random().toString(36).slice(2, 10).toUpperCase();
    const updated = [...curResets, { email: cleanEmail, token: t, createdAt: new Date().toISOString(), used: false, issuedBy: currentUser?.name || 'Team Lead' }];
    setResets(updated);
    saveResets(updated);
    return t;
  };

  const approveUser = (userId: string) => {
    const all = loadUsers();
    const u = all.find(x => x.id === userId);
    if (!u) throw new Error('User not found');
    u.status = 'approved';
    u.approvedAt = new Date().toISOString();
    u.approvedBy = currentUser?.name || 'Team Lead';
    if (!u.permissions || !u.permissions.length) u.permissions = defaultPerms(u.role);

    setUsers([...all]);
    saveUsers(all);
  };

  const rejectUser = (userId: string) => {
    const all = loadUsers();
    const u = all.find(x => x.id === userId);
    if (!u) throw new Error('User not found');
    u.status = 'rejected';
    u.approvedBy = currentUser?.name || 'Team Lead';

    setUsers([...all]);
    saveUsers(all);
  };

  const updateUser = (userId: string, patch: Partial<User>) => {
    const all = loadUsers();
    const u = all.find(x => x.id === userId);
    if (!u) throw new Error('User not found');
    if (patch.name) u.name = patch.name.trim();
    if (patch.email) u.email = patch.email.trim().toLowerCase();
    if (patch.role) {
      u.role = patch.role;
      if (!patch.permissions) u.permissions = defaultPerms(patch.role);
    }
    if (patch.pin !== undefined && patch.pin !== '') {
      if (!/^\d{4,6}$/.test(String(patch.pin))) throw new Error('PIN must be 4–6 digits');
      u.pin = String(patch.pin);
    }
    if (patch.status) u.status = patch.status;
    if (patch.permissions) u.permissions = [...patch.permissions];

    setUsers([...all]);
    saveUsers(all);

    if (currentUser && currentUser.id === u.id) {
      setCurrentUser({ ...u });
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(u));
    }
  };

  const addUser = (userData: {
    name: string;
    email: string;
    pin: string;
    role: UserRole;
    status?: UserStatus;
    permissions?: string[];
  }): User => {
    const cleanEmail = userData.email.trim().toLowerCase();
    const cleanName = userData.name.trim();
    const cleanPin = String(userData.pin).trim();
    if (!cleanName || !cleanEmail || !cleanPin) throw new Error('Full name, email, and PIN are required');
    if (!/^\d{4,6}$/.test(cleanPin)) throw new Error('PIN must be 4–6 digits');

    const all = loadUsers();
    if (all.some(u => u.email.toLowerCase() === cleanEmail)) {
      throw new Error(`A user with email ${cleanEmail} already exists`);
    }

    const newUser: User = {
      id: 'u-' + Date.now().toString(36),
      name: cleanName,
      email: cleanEmail,
      role: userData.role,
      pin: cleanPin,
      status: userData.status || 'approved',
      permissions: userData.permissions || defaultPerms(userData.role),
      createdAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      approvedBy: currentUser?.name || 'Admin'
    };

    const updated = [...all, newUser];
    setUsers(updated);
    saveUsers(updated);
    return newUser;
  };

  const deleteUser = (userId: string) => {
    const all = loadUsers();
    const u = all.find(x => x.id === userId);
    if (!u) throw new Error('User not found');
    if (u.id === 'u-lead-joseph' || u.email.toLowerCase() === 'techsupport.int@gmail.com') {
      throw new Error('Cannot delete primary Team Lead account');
    }
    const updated = all.filter(x => x.id !== userId);
    setUsers(updated);
    saveUsers(updated);

    if (currentUser && currentUser.id === userId) {
      logout();
    }
  };

  const resetUserPin = (userId: string, newPin: string) => {
    const cleanPin = String(newPin).trim();
    if (!/^\d{4,6}$/.test(cleanPin)) throw new Error('PIN must be 4–6 digits');
    updateUser(userId, { pin: cleanPin });
  };

  const setUserPermissions = (userId: string, perms: string[]) => {
    updateUser(userId, { permissions: perms });
  };

  const isLead = (): boolean => {
    return !!currentUser && (currentUser.role === 'lead' || currentUser.role === 'admin');
  };

  const isAdmin = (): boolean => isLead();

  const can = (perm: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'lead' || currentUser.role === 'admin') return true;
    return (currentUser.permissions || []).includes(perm);
  };

  const pendingUsers = (): User[] => {
    return users.filter(u => u.status === 'pending');
  };

  const openResets = (): ResetRequest[] => {
    return resets.filter(r => !r.used);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        resets,
        login,
        logout,
        register,
        requestOrResetPin,
        issueResetToken,
        approveUser,
        rejectUser,
        updateUser,
        addUser,
        deleteUser,
        resetUserPin,
        setUserPermissions,
        can,
        isLead,
        isAdmin,
        pendingUsers,
        openResets
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
