import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useQueue } from '../context/QueueContext';
import {
  Landmark,
  Bell,
  Volume1,
  Volume2,
  VolumeX,
  Code2,
  CheckCircle2,
  LogOut,
  User,
  Building2,
  ShieldCheck,
  Monitor,
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'citizen' | 'staff' | 'admin' | 'live-board';
  setActiveTab: (tab: 'citizen' | 'staff' | 'admin' | 'live-board') => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenAuth }) => {
  const { currentUser, role, isAuthenticated, logout } = useAuth();
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    soundPreference,
    setSoundPreference,
    setShowArchitectureModal,
    setShowTestSuiteModal,
  } = useQueue();

  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const cycleSoundPreference = () => {
    if (soundPreference === 'turn-only') setSoundPreference('all');
    else if (soundPreference === 'all') setSoundPreference('muted');
    else setSoundPreference('turn-only');
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950 border-b border-slate-800 text-slate-100 shadow-md">
      {/* Strict Top Bar Contract: 3 Zones separated by gap-8 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Title (single text element wordmark with civic emblem) */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Landmark className="w-5 h-5" />
          </div>
          <button
            onClick={() => {
              if (isAuthenticated) {
                if (role === 'citizen') setActiveTab('citizen');
                else if (role === 'staff') setActiveTab('staff');
                else if (role === 'admin') setActiveTab('admin');
              } else {
                onOpenAuth();
              }
            }}
            className="text-left group cursor-pointer focus:outline-none"
          >
            <span className="text-base font-bold tracking-tight text-white group-hover:text-cyan-300 transition-colors whitespace-nowrap block">
              SmartGov Queue
            </span>
            <span className="text-[10px] font-mono text-cyan-400/90 block whitespace-nowrap -mt-0.5 uppercase tracking-wider">
              Civic Token & Counter System
            </span>
          </button>
        </div>

        {/* Zone 2: Navigation Links (Strictly Role-Enforced!) */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold uppercase tracking-wider text-slate-400 shrink-0">
          {isAuthenticated && role === 'citizen' && (
            <button
              onClick={() => setActiveTab('citizen')}
              className={`transition-colors py-1 cursor-pointer whitespace-nowrap ${
                activeTab === 'citizen'
                  ? 'text-cyan-400 border-b-2 border-cyan-400 font-bold'
                  : 'hover:text-white'
              }`}
            >
              My Citizen Portal
            </button>
          )}

          {isAuthenticated && role === 'staff' && (
            <button
              onClick={() => setActiveTab('staff')}
              className={`transition-colors py-1 cursor-pointer whitespace-nowrap ${
                activeTab === 'staff'
                  ? 'text-blue-400 border-b-2 border-blue-400 font-bold'
                  : 'hover:text-white'
              }`}
            >
              My Service Desk
            </button>
          )}

          {isAuthenticated && role === 'admin' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`transition-colors py-1 cursor-pointer whitespace-nowrap ${
                activeTab === 'admin'
                  ? 'text-purple-400 border-b-2 border-purple-400 font-bold'
                  : 'hover:text-white'
              }`}
            >
              Administration Console
            </button>
          )}

          <button
            onClick={() => setActiveTab('live-board')}
            className={`transition-colors py-1 cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'live-board'
                ? 'text-cyan-400 border-b-2 border-cyan-400 font-bold'
                : 'hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Public Display Board</span>
          </button>
        </nav>

        {/* Zone 3: Actions & Auth State */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Sound Alert Toggle (3-way cycling) */}
          <button
            onClick={cycleSoundPreference}
            title={
              soundPreference === 'turn-only'
                ? 'Sound: Turn Alert Only (Click to enable 5-Min Pulse)'
                : soundPreference === 'all'
                ? 'Sound: Turn & 5-Min Pulse (Click to Mute)'
                : 'Sound: Muted (Click to enable Turn Alert)'
            }
            className="h-9 px-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer text-xs font-semibold"
            aria-label="Cycle sound preference"
          >
            {soundPreference === 'turn-only' && (
              <>
                <Volume1 className="w-4 h-4 text-cyan-400" />
                <span className="hidden xl:inline text-[11px] text-cyan-300 font-mono">Turn Call</span>
              </>
            )}
            {soundPreference === 'all' && (
              <>
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span className="hidden xl:inline text-[11px] text-emerald-300 font-mono">All Alerts</span>
              </>
            )}
            {soundPreference === 'muted' && (
              <>
                <VolumeX className="w-4 h-4 text-slate-500" />
                <span className="hidden xl:inline text-[11px] text-slate-400 font-mono">Muted</span>
              </>
            )}
          </button>

          {/* Architecture / DB Documentation */}
          <button
            onClick={() => setShowArchitectureModal(true)}
            title="System Architecture & Database Specification"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:border-slate-700 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Code2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Architecture</span>
          </button>

          {/* Automated Test Suite Trigger */}
          <button
            onClick={() => setShowTestSuiteModal(true)}
            title="Run 12-point automated verification tests"
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-950/70 transition-colors cursor-pointer whitespace-nowrap"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Test Suite</span>
          </button>

          {/* In-App Notifications (Only if authenticated) */}
          {isAuthenticated && (
            <div className="relative">
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="relative w-9 h-9 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:border-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 text-[10px] font-bold text-slate-950 flex items-center justify-center tabular-nums">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl z-50 overflow-hidden text-slate-100">
                  <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        Turn Alerts
                      </h3>
                      <p className="text-[11px] text-slate-400">Real-time counter calls & token updates</p>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => markAllNotificationsRead()}
                        className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500">
                        No notifications currently.
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => markNotificationRead(notif.id)}
                          className={`p-3 text-xs cursor-pointer hover:bg-slate-800/50 transition-colors ${
                            !notif.read ? 'bg-slate-800/40' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className={`font-semibold ${
                                notif.type === 'alert'
                                  ? 'text-cyan-400'
                                  : notif.type === 'success'
                                  ? 'text-emerald-400'
                                  : 'text-slate-200'
                              }`}
                            >
                              {notif.title}
                            </span>
                            <span className="text-[10px] text-slate-500 tabular-nums">
                              {new Date(notif.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-slate-300 text-[11px] leading-relaxed">{notif.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Auth State Button */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2 pl-1">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-white leading-tight">
                  {currentUser?.name}
                </span>
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
                  {role === 'staff' ? `${currentUser?.staffId || 'Staff'}` : `${role} account`}
                </span>
              </div>

              <button
                onClick={() => {
                  logout();
                  onOpenAuth();
                }}
                title="Sign out of current account"
                className="px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-rose-950/50 hover:border-rose-800/60 text-slate-300 hover:text-rose-300 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-md shadow-cyan-500/20"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
