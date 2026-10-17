import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

export const AuthShell: React.FC = () => {
  const { login, register, requestOrResetPin } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('techsupport.int@gmail.com');
  const [loginPin, setLoginPin] = useState('6424');
  const [loginError, setLoginError] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('officer');
  const [regPin, setRegPin] = useState('');
  const [regPin2, setRegPin2] = useState('');
  const [regError, setRegError] = useState('');
  const [regOk, setRegOk] = useState('');

  // Reset form state
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetPin, setResetPin] = useState('');
  const [resetPin2, setResetPin2] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetOk, setResetOk] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      login(loginEmail, loginPin);
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegOk('');
    if (regPin !== regPin2) {
      setRegError('PINs do not match');
      return;
    }
    try {
      register({
        name: regName,
        email: regEmail,
        pin: regPin,
        role: regRole
      });
      setRegOk('Submitted for approval! Team Lead can approve in Approvals.');
      setRegName('');
      setRegEmail('');
      setRegPin('');
      setRegPin2('');
    } catch (err: unknown) {
      setRegError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetOk('');
    if (resetPin && resetPin !== resetPin2) {
      setResetError('PINs do not match');
      return;
    }
    try {
      const res = requestOrResetPin({
        email: resetEmail,
        pin: resetPin,
        token: resetToken
      });
      setResetOk(res.message);
    } catch (err: unknown) {
      setResetError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-gradient-to-br from-[#060527] via-[#1a1a4e] to-[#0f172a] min-h-screen p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl p-7 sm:p-9 w-full max-w-[420px] shadow-2xl my-auto">
        {/* Brand */}
        <div className="mb-6 flex items-center gap-3">
          <img
            src="https://credlockng.com/brand/credlock-logo.png"
            alt="Credlock"
            className="h-9 w-auto max-w-[160px] object-contain"
          />
        </div>

        {/* ── LOGIN ── */}
        {mode === 'login' && (
          <div>
            <h2 className="text-2xl font-extrabold text-[#060527] mb-1">Sign in</h2>
            <p className="text-xs text-[#64748B] mb-5 leading-relaxed">
              Tech Support Operations Portal<br />
              <span className="font-semibold text-slate-500">Team Lead: techsupport.int@gmail.com · PIN 6424</span>
            </p>

            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  placeholder="techsupport.int@gmail.com"
                  className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#3B5BDB] focus:ring-2 focus:ring-[#3B5BDB]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">
                  PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  required
                  value={loginPin}
                  onChange={e => setLoginPin(e.target.value)}
                  placeholder="4-6 digit PIN"
                  className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#3B5BDB] focus:ring-2 focus:ring-[#3B5BDB]/20"
                />
              </div>

              {loginError && (
                <div className="text-xs text-[#DC2626] font-medium bg-red-50 p-2.5 rounded-lg border border-red-100">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                className="w-full mt-2 py-3 bg-[#3B5BDB] hover:bg-[#2A3FBF] text-white font-bold text-sm rounded-lg shadow-md hover:shadow-lg transition-all"
              >
                Sign in
              </button>
            </form>

            <div className="flex justify-between items-center mt-5 text-xs">
              <button
                type="button"
                onClick={() => { setMode('register'); setLoginError(''); }}
                className="text-[#3B5BDB] hover:underline font-semibold"
              >
                Register
              </button>
              <button
                type="button"
                onClick={() => { setMode('reset'); setLoginError(''); }}
                className="text-[#3B5BDB] hover:underline font-semibold"
              >
                Forgot PIN
              </button>
            </div>
          </div>
        )}

        {/* ── REGISTER ── */}
        {mode === 'register' && (
          <div>
            <h2 className="text-2xl font-extrabold text-[#060527] mb-1">Register</h2>
            <p className="text-xs text-[#64748B] mb-5">
              Team Lead must approve before you can sign in.
            </p>

            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">Full name</label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  placeholder="e.g. Oluwaseun Akanbi"
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#3B5BDB]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  placeholder="officer@credlock.africa"
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#3B5BDB]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">Role</label>
                <select
                  value={regRole}
                  onChange={e => setRegRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#3B5BDB]"
                >
                  <option value="officer">Support Officer</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">PIN (4-6 digits)</label>
                <input
                  type="password"
                  inputMode="numeric"
                  required
                  value={regPin}
                  onChange={e => setRegPin(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#3B5BDB]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">Confirm PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  required
                  value={regPin2}
                  onChange={e => setRegPin2(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#3B5BDB]"
                />
              </div>

              {regError && (
                <div className="text-xs text-[#DC2626] font-medium bg-red-50 p-2.5 rounded-lg border border-red-100">
                  {regError}
                </div>
              )}

              {regOk && (
                <div className="text-xs text-[#16A34A] font-medium bg-green-50 p-2.5 rounded-lg border border-green-100">
                  {regOk}
                </div>
              )}

              <button
                type="submit"
                className="w-full mt-2 py-2.5 bg-[#3B5BDB] hover:bg-[#2A3FBF] text-white font-bold text-sm rounded-lg shadow-md transition-all"
              >
                Submit registration
              </button>
            </form>

            <div className="mt-5 text-center text-xs">
              <button
                type="button"
                onClick={() => { setMode('login'); setRegError(''); setRegOk(''); }}
                className="text-[#3B5BDB] hover:underline font-semibold"
              >
                Back to sign in
              </button>
            </div>
          </div>
        )}

        {/* ── RESET PIN ── */}
        {mode === 'reset' && (
          <div>
            <h2 className="text-2xl font-extrabold text-[#060527] mb-1">Reset PIN</h2>
            <p className="text-xs text-[#64748B] mb-5 leading-relaxed">
              Submit email only to request a token. Once the Team Lead gives you the token, enter token + new PIN.
            </p>

            <form onSubmit={handleReset} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  placeholder="Your registered email"
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#3B5BDB]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">Reset token (from Team Lead)</label>
                <input
                  type="text"
                  value={resetToken}
                  onChange={e => setResetToken(e.target.value)}
                  placeholder="Leave blank to request"
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#3B5BDB]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">New PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  value={resetPin}
                  onChange={e => setResetPin(e.target.value)}
                  placeholder="4-6 digits"
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#3B5BDB]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">Confirm PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  value={resetPin2}
                  onChange={e => setResetPin2(e.target.value)}
                  placeholder="Confirm new PIN"
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#3B5BDB]"
                />
              </div>

              {resetError && (
                <div className="text-xs text-[#DC2626] font-medium bg-red-50 p-2.5 rounded-lg border border-red-100">
                  {resetError}
                </div>
              )}

              {resetOk && (
                <div className="text-xs text-[#16A34A] font-medium bg-green-50 p-2.5 rounded-lg border border-green-100">
                  {resetOk}
                </div>
              )}

              <button
                type="submit"
                className="w-full mt-2 py-2.5 bg-[#3B5BDB] hover:bg-[#2A3FBF] text-white font-bold text-sm rounded-lg shadow-md transition-all"
              >
                Submit
              </button>
            </form>

            <div className="mt-5 text-center text-xs">
              <button
                type="button"
                onClick={() => { setMode('login'); setResetError(''); setResetOk(''); }}
                className="text-[#3B5BDB] hover:underline font-semibold"
              >
                Back to sign in
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
