import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Landmark,
  User,
  ShieldCheck,
  Building2,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Monitor,
  Sparkles,
  KeyRound,
  FileText,
  UserPlus,
} from 'lucide-react';

interface AuthPortalProps {
  onOpenPublicBoard: () => void;
}

export const AuthPortal: React.FC<AuthPortalProps> = ({ onOpenPublicBoard }) => {
  const { loginAsCitizen, loginAsEmployee, loginAsAdmin, registerCitizen, loginError, setLoginError } = useAuth();

  // Mode: 'gateway' | 'citizen-login' | 'citizen-register' | 'staff-login' | 'admin-login'
  const [mode, setMode] = useState<'gateway' | 'citizen-login' | 'citizen-register' | 'staff-login' | 'admin-login'>('gateway');

  // Citizen form state
  const [citizenIdInput, setCitizenIdInput] = useState('');
  const [citizenPassword, setCitizenPassword] = useState('');

  // Citizen register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regNationalId, setRegNationalId] = useState('');

  // Staff form state
  const [staffIdInput, setStaffIdInput] = useState('');
  const [staffPassword, setStaffPassword] = useState('');

  // Admin form state
  const [adminKey, setAdminKey] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  // Quick Demo Auto-fills
  const handleAutoFillCitizen = () => {
    setCitizenIdInput('anjali.sharma@example.gov.in');
    setCitizenPassword('citizen@2026');
  };

  const handleAutoFillStaff = () => {
    setStaffIdInput('STAFF-CMC-409');
    setStaffPassword('officer@cmc');
  };

  const handleCitizenLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citizenIdInput) {
      setLoginError('Please enter your registered email, mobile number, or Citizen ID.');
      return;
    }
    setIsLoading(true);
    try {
      await loginAsCitizen(citizenIdInput, citizenPassword);
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCitizenRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regNationalId) {
      setLoginError('Please fill in your Full Name, Email, and National Identity number.');
      return;
    }
    setIsLoading(true);
    try {
      await registerCitizen({
        name: regName,
        email: regEmail,
        phone: regPhone || '+91 98000 00000',
        nationalId: regNationalId,
      });
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStaffLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffIdInput) {
      setLoginError('Please enter your official Government Employee / Staff ID.');
      return;
    }
    setIsLoading(true);
    try {
      await loginAsEmployee(staffIdInput, staffPassword);
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : 'Staff login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await loginAsAdmin(adminKey);
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : 'Admin login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-8">
      {/* Civic Emblem Header */}
      <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 shadow-lg shadow-cyan-950/50 mb-1">
          <Landmark className="w-7 h-7 text-cyan-300" />
        </div>
        <div>
          <span className="text-[11px] font-mono tracking-widest text-cyan-400 font-bold uppercase block">
            Government of Public Administration · Civic Queue Gateway
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mt-1">
            SmartGov Queue Portal
          </h1>
        </div>
        <p className="text-sm text-slate-400 leading-relaxed max-w-lg mx-auto">
          Secure digital access for citizens to obtain queue tokens, and for authorized government officers to manage desk services.
        </p>
      </div>

      {/* Gateway View: Separate Portal Selection Cards */}
      {mode === 'gateway' && (
        <div className="max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Citizen Portal */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-8 flex flex-col justify-between hover:border-cyan-500/50 transition-all duration-300 shadow-xl shadow-black/40 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold">
                  <User className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold tracking-wider">
                  Public Citizen Access
                </span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                  Citizen Portal
                </h2>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Generate digital appointment tokens, monitor real-time queue position and waiting time, and receive audio chime alerts when called to your counter.
                </p>
              </div>

              <div className="pt-2 space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center gap-2 text-slate-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Obtain instant tokens for Municipal, Revenue & Pension</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Rule-based estimated waiting times & status stepper</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Download and print official verification token receipts</span>
                </div>
              </div>
            </div>

            <div className="pt-8 space-y-2.5">
              <button
                onClick={() => {
                  setLoginError(null);
                  setMode('citizen-login');
                }}
                className="w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer"
              >
                <span>Citizen Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setLoginError(null);
                  setMode('citizen-register');
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-700 hover:border-slate-600 bg-slate-800/60 text-slate-300 hover:text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5 text-cyan-400" />
                <span>Register New Citizen Profile</span>
              </button>
            </div>
          </div>

          {/* Card 2: Government Employee Portal */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-8 flex flex-col justify-between hover:border-blue-500/50 transition-all duration-300 shadow-xl shadow-black/40 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-blue-950 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold">
                  <Building2 className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded-full bg-blue-950/80 border border-blue-500/40 text-blue-300 font-bold tracking-wider">
                  Authorized Officers Only
                </span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">
                  Government Employee Portal
                </h2>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Log in to your assigned government office and service counter to call waiting tokens, control counter statuses, and record completed or skipped services.
                </p>
              </div>

              <div className="pt-2 space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center gap-2 text-slate-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Single-click "Call Next" with queue prioritization</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Enforced counter states: Active, Short Break & Closed</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Live service session stopwatch & audit logging</span>
                </div>
              </div>
            </div>

            <div className="pt-8 space-y-2.5">
              <button
                onClick={() => {
                  setLoginError(null);
                  setMode('staff-login');
                }}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 cursor-pointer"
              >
                <span>Staff Officer Login</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setLoginError(null);
                  setMode('admin-login');
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-700 hover:border-slate-600 bg-slate-800/60 text-slate-400 hover:text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>Directorate Administration Login</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Citizen Login Form View */}
      {mode === 'citizen-login' && (
        <div className="max-w-md mx-auto w-full rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
            <div>
              <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold tracking-widest block">
                Citizen Authentication
              </span>
              <h2 className="text-xl font-bold text-white">Citizen Sign In</h2>
            </div>
            <button
              onClick={() => {
                setLoginError(null);
                setMode('gateway');
              }}
              className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Back
            </button>
          </div>

          {loginError && (
            <div className="mb-4 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl p-3 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleCitizenLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Citizen ID / Registered Email / Mobile Number
              </label>
              <input
                type="text"
                value={citizenIdInput}
                onChange={(e) => setCitizenIdInput(e.target.value)}
                placeholder="e.g. anjali.sharma@example.gov.in or CID-8842-9011"
                className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password / Secure Passcode
              </label>
              <input
                type="password"
                value={citizenPassword}
                onChange={(e) => setCitizenPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-medium"
              />
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-lg shadow-cyan-500/20"
              >
                {isLoading ? 'Verifying Citizen...' : 'Sign In to Citizen Dashboard'}
              </button>

              <button
                type="button"
                onClick={handleAutoFillCitizen}
                className="w-full py-2 rounded-xl border border-cyan-500/30 bg-cyan-950/30 text-cyan-300 hover:bg-cyan-950/50 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Fill Demo Citizen (Anjali Sharma)</span>
              </button>
            </div>

            <div className="border-t border-slate-800 pt-4 text-center">
              <p className="text-xs text-slate-400">
                Do not have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setLoginError(null);
                    setMode('citizen-register');
                  }}
                  className="text-cyan-400 hover:underline font-semibold cursor-pointer"
                >
                  Register here
                </button>
              </p>
            </div>
          </form>
        </div>
      )}

      {/* Citizen Register Form View */}
      {mode === 'citizen-register' && (
        <div className="max-w-md mx-auto w-full rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
            <div>
              <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold tracking-widest block">
                Citizen Enrollment
              </span>
              <h2 className="text-xl font-bold text-white">Register Citizen Account</h2>
            </div>
            <button
              onClick={() => {
                setLoginError(null);
                setMode('citizen-login');
              }}
              className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Sign In
            </button>
          </div>

          {loginError && (
            <div className="mb-4 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl p-3 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleCitizenRegisterSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Legal Name</label>
              <input
                type="text"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="e.g. Ramesh Chandra Verma"
                className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="e.g. ramesh.verma@example.com"
                className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Mobile Contact</label>
              <input
                type="tel"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                placeholder="e.g. +91 98450 12345"
                className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">National ID / Citizen Registration No.</label>
              <input
                type="text"
                required
                value={regNationalId}
                onChange={(e) => setRegNationalId(e.target.value)}
                placeholder="e.g. CID-9921-4401"
                className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                {isLoading ? 'Creating Citizen Profile...' : 'Complete Registration & Enter'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Staff / Employee Login Form View */}
      {mode === 'staff-login' && (
        <div className="max-w-md mx-auto w-full rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
            <div>
              <span className="text-[10px] font-mono text-blue-400 uppercase font-bold tracking-widest block">
                Official Staff Clearance
              </span>
              <h2 className="text-xl font-bold text-white">Government Employee Login</h2>
            </div>
            <button
              onClick={() => {
                setLoginError(null);
                setMode('gateway');
              }}
              className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Back
            </button>
          </div>

          {loginError && (
            <div className="mb-4 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl p-3 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleStaffLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Official Employee / Staff ID
              </label>
              <input
                type="text"
                value={staffIdInput}
                onChange={(e) => setStaffIdInput(e.target.value)}
                placeholder="e.g. STAFF-CMC-409"
                className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Department Security Password
              </label>
              <input
                type="password"
                value={staffPassword}
                onChange={(e) => setStaffPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-lg shadow-blue-600/20"
              >
                {isLoading ? 'Verifying Staff ID...' : 'Sign In to Service Desk'}
              </button>

              <button
                type="button"
                onClick={handleAutoFillStaff}
                className="w-full py-2 rounded-xl border border-blue-500/30 bg-blue-950/30 text-blue-300 hover:bg-blue-950/50 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Fill Demo Officer (Rajesh Kumar · Counter 1)</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Admin Login Form View */}
      {mode === 'admin-login' && (
        <div className="max-w-md mx-auto w-full rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
            <div>
              <span className="text-[10px] font-mono text-purple-400 uppercase font-bold tracking-widest block">
                Executive Directorate
              </span>
              <h2 className="text-xl font-bold text-white">Administration Console</h2>
            </div>
            <button
              onClick={() => {
                setLoginError(null);
                setMode('gateway');
              }}
              className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Back
            </button>
          </div>

          <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Director Clearance Key / Administrative Passphrase
              </label>
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Enter admin passcode"
                className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-lg shadow-purple-600/20"
              >
                {isLoading ? 'Verifying Directorate...' : 'Enter Administration Console'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Direct Link to Public Display Board (Always Available Without Login) */}
      <div className="mt-8 text-center">
        <button
          onClick={onOpenPublicBoard}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-xs text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
        >
          <Monitor className="w-4 h-4 text-cyan-400" />
          <span>Open Public Electronic Display Board (No Login Required)</span>
        </button>
      </div>
    </div>
  );
};
