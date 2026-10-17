import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { ALL_PERMS, ROLE_PRESETS } from '../../data/constants';
import { Modal } from '../common/Modal';
import { User, UserRole, UserStatus } from '../../types';

export const AdminView: React.FC = () => {
  const {
    currentUser,
    isLead,
    can,
    users,
    updateUser,
    addUser,
    deleteUser,
    resetUserPin,
    approveUser,
    rejectUser,
    setUserPermissions
  } = useAuth();
  const { addToast } = useData();

  // Search & Filter state for Users & Access Directory
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showPins, setShowPins] = useState<Record<string, boolean>>({});

  // Modals state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('officer');
  const [editStatus, setEditStatus] = useState<UserStatus>('approved');
  const [editPin, setEditPin] = useState('');

  const [pinResetTarget, setPinResetTarget] = useState<User | null>(null);
  const [newQuickPin, setNewQuickPin] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const [permsUser, setPermsUser] = useState<User | null>(null);
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);

  // Add User modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPin, setAddPin] = useState('');
  const [addRole, setAddRole] = useState<UserRole>('officer');
  const [addStatus, setAddStatus] = useState<UserStatus>('approved');

  // Matrix edits state
  const [matrixState, setMatrixState] = useState<Record<string, string[]>>(() => {
    const map: Record<string, string[]> = {};
    users.forEach(u => {
      map[u.id] = u.permissions || (ROLE_PRESETS[u.role] || []);
    });
    return map;
  });

  const hasAdminAccess = isLead() || can('admin');

  if (!hasAdminAccess) {
    return (
      <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
        <h3 className="font-bold text-lg text-slate-800">Admin Privileges Required</h3>
        <p className="text-xs text-slate-500 mt-1">
          Only the Team Lead or users with administrative access may access the system administration panel.
        </p>
      </div>
    );
  }

  const activeUsers = users.filter(u => u.status === 'approved');
  const pendingUsers = users.filter(u => u.status === 'pending');
  const disabledUsers = users.filter(u => u.status === 'disabled' || u.status === 'rejected');

  // Filtered users for the Directory
  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q);

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const generateRandomPin = () => {
    const random = Math.floor(1000 + Math.random() * 9000).toString();
    return random;
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditStatus(user.status);
    setEditPin(''); // leave blank unless changing
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (!editName.trim()) {
      addToast('Full name is required', 'warn');
      return;
    }
    if (!editEmail.trim()) {
      addToast('Email address is required', 'warn');
      return;
    }
    if (editPin.trim() && !/^\d{4,6}$/.test(editPin.trim())) {
      addToast('PIN must be 4–6 digits', 'warn');
      return;
    }

    try {
      const patch: Partial<User> = {
        name: editName.trim(),
        email: editEmail.trim().toLowerCase(),
        role: editRole,
        status: editStatus
      };
      if (editPin.trim()) {
        patch.pin = editPin.trim();
      }

      updateUser(editingUser.id, patch);
      addToast(`Updated user profile for ${editName.trim()}`, 'success');
      setEditingUser(null);
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : String(err), 'error');
    }
  };

  const handleOpenQuickResetPin = (user: User) => {
    setPinResetTarget(user);
    setNewQuickPin(generateRandomPin());
  };

  const handleConfirmResetPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinResetTarget) return;

    if (!/^\d{4,6}$/.test(newQuickPin.trim())) {
      addToast('PIN must be 4–6 digits', 'warn');
      return;
    }

    try {
      resetUserPin(pinResetTarget.id, newQuickPin.trim());
      addToast(`PIN for ${pinResetTarget.name} reset to ${newQuickPin.trim()}`, 'success');
      setPinResetTarget(null);
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : String(err), 'error');
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    try {
      deleteUser(deleteTarget.id);
      addToast(`Deleted user account: ${deleteTarget.name}`, 'warn');
      setDeleteTarget(null);
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : String(err), 'error');
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim() || !addEmail.trim() || !addPin.trim()) {
      addToast('All fields are required', 'warn');
      return;
    }
    if (!/^\d{4,6}$/.test(addPin.trim())) {
      addToast('PIN must be 4–6 digits', 'warn');
      return;
    }

    try {
      addUser({
        name: addName.trim(),
        email: addEmail.trim().toLowerCase(),
        pin: addPin.trim(),
        role: addRole,
        status: addStatus,
        permissions: (ROLE_PRESETS[addRole] || ROLE_PRESETS.officer).slice()
      });

      addToast(`Successfully created ${addName.trim()} (${addRole})`, 'success');
      setShowAddModal(false);
      setAddName('');
      setAddEmail('');
      setAddPin('');
      setAddRole('officer');
      setAddStatus('approved');
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : String(err), 'error');
    }
  };

  const handleSaveMatrix = () => {
    let count = 0;
    Object.keys(matrixState).forEach(userId => {
      const u = users.find(x => x.id === userId);
      if (u && u.role !== 'lead' && u.role !== 'admin') {
        setUserPermissions(userId, matrixState[userId]);
        count++;
      }
    });
    addToast(`Permission matrix updated for ${count} users`, 'success');
  };

  const toggleMatrixPerm = (userId: string, perm: string) => {
    setMatrixState(prev => {
      const current = prev[userId] || [];
      const updated = current.includes(perm)
        ? current.filter(p => p !== perm)
        : [...current, perm];
      return { ...prev, [userId]: updated };
    });
  };

  const openPermsModal = (u: User) => {
    setPermsUser(u);
    setSelectedPerms(u.permissions || (ROLE_PRESETS[u.role] || []));
  };

  const handleSavePermsModal = () => {
    if (!permsUser) return;
    setUserPermissions(permsUser.id, selectedPerms);
    setMatrixState(prev => ({ ...prev, [permsUser.id]: selectedPerms }));
    setPermsUser(null);
    addToast(`Permissions updated for ${permsUser.name}`, 'success');
  };

  const togglePinVisibility = (userId: string) => {
    setShowPins(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const copyToClipboard = (text: string, label: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      addToast(`${label} copied to clipboard`, 'info');
    }
  };

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="bg-[#EEF2FF] border border-[#C7D2FE] rounded-xl p-3.5 sm:p-4 text-xs sm:text-[13px] text-[#312E81] leading-relaxed shadow-xs flex items-center justify-between flex-wrap gap-2">
        <div>
          <strong className="font-bold">Admin Panel:</strong> Manage user credentials, permissions, authentication PINs, and RBAC security rules for all technical support staff.
        </div>
        <div className="text-[11px] font-semibold bg-indigo-100 text-indigo-900 px-2.5 py-1 rounded-md">
          Logged in as: {currentUser?.name} ({currentUser?.role})
        </div>
      </div>

      {/* 3 KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Total System Users</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#060527]">{users.length}</div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-1">Pending Approval</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#D97706]">{pendingUsers.length}</div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-1">Active Accounts</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{activeUsers.length}</div>
        </div>
      </div>

      {/* Users & Access Directory Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
        {/* Card Header */}
        <div className="px-5 py-3.5 border-b border-[#E2E8F0] bg-[#FAFBFC] flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="font-bold text-sm sm:text-base text-[#060527]">Users &amp; Access Directory</h2>
            <p className="text-[11px] text-slate-500">
              Manage accounts, reset security PINs, assign roles, grant capabilities, or deactivate users.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setAddPin(generateRandomPin());
              setShowAddModal(true);
            }}
            className="px-3.5 py-2 bg-[#3B5BDB] hover:bg-[#2A3FBF] text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <span>+</span> Add User
          </button>
        </div>

        {/* Directory Controls: Search & Filters */}
        <div className="p-3.5 bg-slate-50 border-b border-[#E2E8F0] flex flex-wrap items-center gap-2.5 text-xs">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or role..."
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3B5BDB]/20 focus:border-[#3B5BDB]"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Role:</span>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="all">All Roles</option>
              <option value="lead">Team Lead</option>
              <option value="admin">Admin</option>
              <option value="officer">Support Officer</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="disabled">Disabled</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {(searchQuery || roleFilter !== 'all' || statusFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setRoleFilter('all');
                setStatusFilter('all');
              }}
              className="px-2.5 py-1.5 text-slate-500 hover:text-slate-800 text-xs font-semibold underline"
            >
              Reset Filters
            </button>
          )}

          <div className="ml-auto text-[11px] text-slate-500">
            Showing <strong className="font-semibold text-slate-800">{filteredUsers.length}</strong> of {users.length} users
          </div>
        </div>

        {/* Directory Table */}
        <div className="overflow-x-auto">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No users match the search or filter criteria.
            </div>
          ) : (
            <table className="w-full text-left text-xs sm:text-[13px]">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-3">User</th>
                  <th className="py-3 px-3">Email</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">PIN</th>
                  <th className="py-3 px-3">Permissions</th>
                  <th className="py-3 px-3 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map(u => {
                  const isPrimaryLead = u.id === 'u-lead-joseph' || u.email.toLowerCase() === 'techsupport.int@gmail.com';
                  const isCurrent = currentUser?.id === u.id;
                  const permsCount = (u.permissions || []).length;
                  const pinShown = !!showPins[u.id];

                  return (
                    <tr key={u.id} className={`hover:bg-slate-50/80 transition-colors ${isCurrent ? 'bg-indigo-50/30' : ''}`}>
                      {/* Name / User */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full font-bold grid place-items-center text-xs text-white shrink-0 shadow-xs ${
                            u.role === 'lead' ? 'bg-purple-700' :
                            u.role === 'admin' ? 'bg-[#3B5BDB]' :
                            u.role === 'officer' ? 'bg-emerald-600' : 'bg-slate-500'
                          }`}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded">
                                  You
                                </span>
                              )}
                              {isPrimaryLead && (
                                <span className="px-1.5 py-0.2 bg-purple-100 text-purple-800 text-[10px] font-bold rounded" title="Primary System Owner">
                                  Owner
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400">ID: {u.id}</div>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3 px-3 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs">{u.email}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(u.email, 'Email')}
                            title="Copy email"
                            className="text-slate-400 hover:text-slate-700 p-0.5"
                          >
                            📋
                          </button>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase ${
                          u.role === 'lead' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                          u.role === 'admin' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                          u.role === 'officer' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                          'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {u.role === 'lead' ? 'Team Lead' : u.role}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                          u.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                          u.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                          u.status === 'disabled' ? 'bg-slate-100 text-slate-600' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            u.status === 'approved' ? 'bg-emerald-600' :
                            u.status === 'pending' ? 'bg-amber-600 animate-pulse' :
                            u.status === 'disabled' ? 'bg-slate-400' :
                            'bg-rose-600'
                          }`} />
                          {u.status}
                        </span>
                      </td>

                      {/* PIN */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 font-mono text-xs text-slate-700">
                          <span>{pinShown ? u.pin : '••••'}</span>
                          <button
                            type="button"
                            onClick={() => togglePinVisibility(u.id)}
                            title={pinShown ? 'Hide PIN' : 'View PIN'}
                            className="text-slate-400 hover:text-slate-700 p-0.5"
                          >
                            {pinShown ? '🙈' : '👁'}
                          </button>
                        </div>
                      </td>

                      {/* Permissions */}
                      <td className="py-3 px-3">
                        <button
                          type="button"
                          onClick={() => openPermsModal(u)}
                          className="inline-flex items-center gap-1 text-slate-600 hover:text-[#3B5BDB] hover:underline font-medium text-xs"
                          title="Click to view/edit permissions"
                        >
                          <span className="font-semibold text-slate-800">{permsCount}</span>
                          <span className="text-slate-400">/ {ALL_PERMS.length}</span>
                          <span className="text-[10px] text-slate-400">✎</span>
                        </button>
                      </td>

                      {/* Admin Actions */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {/* Edit User Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(u)}
                            className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-md text-xs font-semibold transition-colors shadow-2xs"
                            title="Edit User Details (Name, Email, Role, Status, PIN)"
                          >
                            Edit
                          </button>

                          {/* Permissions Button */}
                          <button
                            type="button"
                            onClick={() => openPermsModal(u)}
                            className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-md text-xs font-semibold transition-colors shadow-2xs"
                            title="Manage Permissions Matrix"
                          >
                            Perms
                          </button>

                          {/* Quick Reset PIN Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenQuickResetPin(u)}
                            className="px-2 py-1 bg-white hover:bg-amber-50 border border-amber-200 text-amber-700 rounded-md text-xs font-semibold transition-colors shadow-2xs"
                            title="Reset Security PIN"
                          >
                            PIN
                          </button>

                          {/* Status Actions */}
                          {u.status === 'pending' && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  approveUser(u.id);
                                  addToast(`User ${u.name} approved`, 'success');
                                }}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold transition-colors"
                                title="Approve Registration"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  rejectUser(u.id);
                                  addToast(`User ${u.name} registration rejected`, 'warn');
                                }}
                                className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-semibold transition-colors"
                                title="Reject Registration"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {u.status === 'approved' && !isPrimaryLead && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Deactivate account for ${u.name}? They will not be able to log in.`)) {
                                  updateUser(u.id, { status: 'disabled' });
                                  addToast(`Account for ${u.name} disabled`, 'warn');
                                }
                              }}
                              className="px-2 py-1 text-amber-700 hover:bg-amber-50 border border-amber-200 rounded-md text-xs font-semibold transition-colors"
                              title="Disable Account"
                            >
                              Disable
                            </button>
                          )}

                          {u.status === 'disabled' && (
                            <button
                              type="button"
                              onClick={() => {
                                updateUser(u.id, { status: 'approved' });
                                addToast(`Account for ${u.name} re-enabled`, 'success');
                              }}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold transition-colors"
                              title="Enable Account"
                            >
                              Enable
                            </button>
                          )}

                          {/* Delete Action (guarded against primary lead) */}
                          {!isPrimaryLead && (
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(u)}
                              className="px-2 py-1 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-md text-xs font-semibold transition-colors"
                              title="Delete Account"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Permission Matrix Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E2E8F0] bg-[#FAFBFC] flex items-center justify-between flex-wrap gap-2">
          <div>
            <span className="font-bold text-xs sm:text-sm text-[#060527]">Granular Permission Matrix</span>
            <p className="text-[11px] text-slate-400">Toggle capabilities across all support officers and click Save Matrix Changes</p>
          </div>
          <button
            type="button"
            onClick={handleSaveMatrix}
            className="px-3.5 py-1.5 bg-[#3B5BDB] hover:bg-[#2A3FBF] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            Save Matrix Changes
          </button>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] sticky top-0 z-20">
              <tr>
                <th className="py-2.5 px-3 sticky left-0 bg-[#F8FAFC] z-30 font-bold text-slate-800">User</th>
                <th className="py-2.5 px-2 font-bold text-slate-600">Role</th>
                {ALL_PERMS.map(p => (
                  <th key={p} className="py-2 px-1 text-center font-bold text-[10px] text-slate-500 whitespace-nowrap">
                    {p}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => {
                const isLeadRole = u.role === 'lead' || u.role === 'admin';
                const userPerms = matrixState[u.id] || u.permissions || [];

                return (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 sticky left-0 bg-white font-semibold text-slate-800 z-10 whitespace-nowrap">
                      {u.name}
                    </td>
                    <td className="py-2 px-2 text-[11px] uppercase text-slate-400">{u.role}</td>
                    {ALL_PERMS.map(p => {
                      const isChecked = isLeadRole || userPerms.includes(p);
                      return (
                        <td key={p} className="py-2 px-1 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isLeadRole}
                            onChange={() => toggleMatrixPerm(u.id, p)}
                            className="rounded text-[#3B5BDB] focus:ring-[#3B5BDB] disabled:opacity-60 cursor-pointer"
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <Modal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          title={`Edit User: ${editingUser.name}`}
        >
          <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs sm:text-[13px]">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={editName}
                onChange={e => setEditName(e.target.value)}
                placeholder="e.g. Damilola Aderinto"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-[#3B5BDB]/20 focus:border-[#3B5BDB]"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={editEmail}
                onChange={e => setEditEmail(e.target.value)}
                placeholder="officer@credlock.africa"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-[#3B5BDB]/20 focus:border-[#3B5BDB]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">System Role *</label>
                <select
                  value={editRole}
                  onChange={e => setEditRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-[#3B5BDB]/20 focus:border-[#3B5BDB]"
                >
                  <option value="officer">Support Officer</option>
                  <option value="admin">Administrator</option>
                  <option value="lead">Team Lead</option>
                  <option value="viewer">Viewer (Read Only)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Account Status *</label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value as UserStatus)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-[#3B5BDB]/20 focus:border-[#3B5BDB]"
                >
                  <option value="approved">Approved (Active)</option>
                  <option value="pending">Pending Approval</option>
                  <option value="disabled">Disabled (Deactivated)</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700">Change PIN (Leave blank to keep existing)</label>
                <button
                  type="button"
                  onClick={() => setEditPin(generateRandomPin())}
                  className="text-[11px] text-[#3B5BDB] hover:underline font-semibold"
                >
                  Generate 4-Digit PIN
                </button>
              </div>
              <input
                type="text"
                inputMode="numeric"
                value={editPin}
                onChange={e => setEditPin(e.target.value)}
                placeholder="Enter new 4-6 digit numeric PIN"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-[#3B5BDB]/20 focus:border-[#3B5BDB]"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Current PIN is: <strong className="font-mono text-slate-600">{editingUser.pin}</strong>
              </span>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => openPermsModal(editingUser)}
                className="text-xs text-indigo-700 hover:underline font-semibold"
              >
                Configure Permissions Matrix &rarr;
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#3B5BDB] hover:bg-[#2A3FBF] text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Add New Support User"
        >
          <form onSubmit={handleCreateUser} className="space-y-3 text-xs sm:text-[13px]">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={addName}
                onChange={e => setAddName(e.target.value)}
                placeholder="e.g. Damilola Aderinto"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-[#3B5BDB]/20 focus:border-[#3B5BDB]"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={addEmail}
                onChange={e => setAddEmail(e.target.value)}
                placeholder="officer@credlock.africa"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-[#3B5BDB]/20 focus:border-[#3B5BDB]"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Role *</label>
                <select
                  value={addRole}
                  onChange={e => setAddRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-[#3B5BDB]/20 focus:border-[#3B5BDB]"
                >
                  <option value="officer">Support Officer</option>
                  <option value="admin">Administrator</option>
                  <option value="lead">Team Lead</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status *</label>
                <select
                  value={addStatus}
                  onChange={e => setAddStatus(e.target.value as UserStatus)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-[#3B5BDB]/20 focus:border-[#3B5BDB]"
                >
                  <option value="approved">Approved (Immediate Access)</option>
                  <option value="pending">Pending Approval</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700">Security PIN (4–6 digits) *</label>
                <button
                  type="button"
                  onClick={() => setAddPin(generateRandomPin())}
                  className="text-[11px] text-[#3B5BDB] hover:underline font-semibold"
                >
                  Generate PIN
                </button>
              </div>
              <input
                type="text"
                inputMode="numeric"
                required
                value={addPin}
                onChange={e => setAddPin(e.target.value)}
                placeholder="e.g. 5566"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-[#3B5BDB]/20 focus:border-[#3B5BDB]"
              />
            </div>
            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#3B5BDB] hover:bg-[#2A3FBF] text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                Create Account
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Quick Reset PIN Modal */}
      {pinResetTarget && (
        <Modal
          isOpen={!!pinResetTarget}
          onClose={() => setPinResetTarget(null)}
          title={`Reset PIN: ${pinResetTarget.name}`}
        >
          <form onSubmit={handleConfirmResetPin} className="space-y-3.5 text-xs sm:text-[13px]">
            <p className="text-slate-600 leading-relaxed">
              Set a new security PIN for <strong className="text-slate-900">{pinResetTarget.name}</strong> ({pinResetTarget.email}). The user will use this PIN to sign in.
            </p>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700">New PIN (4–6 digits) *</label>
                <button
                  type="button"
                  onClick={() => setNewQuickPin(generateRandomPin())}
                  className="text-[11px] text-[#3B5BDB] hover:underline font-semibold"
                >
                  Random PIN
                </button>
              </div>
              <input
                type="text"
                inputMode="numeric"
                required
                value={newQuickPin}
                onChange={e => setNewQuickPin(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-base font-mono font-bold tracking-widest text-slate-900 focus:ring-2 focus:ring-[#3B5BDB]/20 focus:border-[#3B5BDB]"
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-[11px] text-amber-800">
              💡 Current PIN is: <strong className="font-mono">{pinResetTarget.pin}</strong>. Make sure to share the new PIN with the user securely.
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPinResetTarget(null)}
                className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                Apply New PIN
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete User Modal */}
      {deleteTarget && (
        <Modal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title={`Confirm Deletion: ${deleteTarget.name}`}
        >
          <div className="space-y-3.5 text-xs sm:text-[13px]">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 leading-relaxed">
              ⚠️ Are you sure you want to permanently delete user <strong className="font-bold">{deleteTarget.name}</strong> ({deleteTarget.email})?
              All saved credentials, session access, and custom permissions for this user will be removed.
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                Permanently Delete User
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Permissions RBAC Modal */}
      {permsUser && (
        <Modal
          isOpen={!!permsUser}
          onClose={() => setPermsUser(null)}
          title={`Edit Permissions: ${permsUser.name}`}
          maxWidth="max-w-[640px]"
          footer={
            <>
              <button
                type="button"
                onClick={() => setPermsUser(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePermsModal}
                className="px-4 py-1.5 rounded-lg bg-[#3B5BDB] hover:bg-[#2A3FBF] text-white text-xs font-semibold shadow-xs"
              >
                Save Permissions
              </button>
            </>
          }
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>
                Capabilities for <strong>{permsUser.name}</strong> ({permsUser.email})
              </span>
              <span className="font-semibold text-indigo-700">
                {selectedPerms.length} of {ALL_PERMS.length} selected
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-80 overflow-y-auto p-1 text-xs">
              {ALL_PERMS.map(p => {
                const checked = selectedPerms.includes(p);
                return (
                  <label
                    key={p}
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                      checked
                        ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setSelectedPerms(prev =>
                          checked ? prev.filter(x => x !== p) : [...prev, p]
                        );
                      }}
                      className="rounded text-[#3B5BDB] focus:ring-[#3B5BDB]"
                    />
                    <span className="truncate">{p}</span>
                  </label>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
              <div className="flex gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSelectedPerms(ROLE_PRESETS.lead.slice())}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[11px] font-semibold text-slate-700"
                >
                  Preset: Lead
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPerms(ROLE_PRESETS.admin?.slice() || ROLE_PRESETS.lead.slice())}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[11px] font-semibold text-slate-700"
                >
                  Preset: Admin
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPerms(ROLE_PRESETS.officer.slice())}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[11px] font-semibold text-slate-700"
                >
                  Preset: Officer
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPerms(ROLE_PRESETS.viewer.slice())}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[11px] font-semibold text-slate-700"
                >
                  Preset: Viewer
                </button>
              </div>

              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedPerms([...ALL_PERMS])}
                  className="px-2 py-1 text-[11px] font-semibold text-[#3B5BDB] hover:underline"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPerms([])}
                  className="px-2 py-1 text-[11px] font-semibold text-rose-600 hover:underline"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
