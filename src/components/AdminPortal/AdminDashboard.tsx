import React, { useState } from 'react';
import { useQueue } from '../../context/QueueContext';
import {
  ShieldCheck,
  Building2,
  Users,
  CheckCircle2,
  Clock,
  Layers,
  Search,
  RefreshCw,
  Coffee,
  XCircle,
  Activity,
  UserCheck,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { offices, services, counters, tokens, events, refreshData, resetToDemoState } = useQueue();

  const [activeSection, setActiveSection] = useState<'overview' | 'counters' | 'departments'>('overview');
  const [searchTerm, setSearchTerm] = useState('');

  const totalTokens = tokens.length;
  const waitingTokens = tokens.filter((t) => t.status === 'WAITING').length;
  const servingTokens = tokens.filter((t) => t.status === 'SERVING').length;
  const completedTokens = tokens.filter((t) => t.status === 'COMPLETED').length;
  const skippedTokens = tokens.filter((t) => t.status === 'SKIPPED').length;

  const activeCounters = counters.filter((c) => c.status === 'active').length;
  const breakCounters = counters.filter((c) => c.status === 'break').length;
  const closedCounters = counters.filter((c) => c.status === 'closed').length;

  return (
    <div className="space-y-6">
      {/* Simple Administrative Header */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-950 border border-purple-500/30 text-purple-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">
                Simple Administration Console
              </h1>
              <p className="text-xs text-slate-400">
                City-wide civic offices, counter allocation, and real-time public queue health
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => resetToDemoState()}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
            >
              Reset Demo Data
            </button>
            <button
              onClick={() => refreshData()}
              className="p-2 text-xs rounded-xl border border-slate-700 bg-slate-950 hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
              aria-label="Refresh"
            >
              <RefreshCw className="w-4 h-4 text-cyan-400" />
            </button>
          </div>
        </div>

        {/* 4 Simple, High-Clarity Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-xs font-semibold text-slate-400 block mb-1">Total Citizens Today</span>
            <span className="text-2xl sm:text-3xl font-black font-mono text-white tabular-nums">
              {totalTokens}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">Tokens registered</span>
          </div>

          <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-800/60">
            <span className="text-xs font-semibold text-cyan-300 block mb-1">Waiting in Line</span>
            <span className="text-2xl sm:text-3xl font-black font-mono text-cyan-300 tabular-nums">
              {waitingTokens}
            </span>
            <span className="text-[11px] text-cyan-400/80 mt-1 block">Awaiting desk call</span>
          </div>

          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60">
            <span className="text-xs font-semibold text-emerald-300 block mb-1">Desks on Duty</span>
            <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-300 tabular-nums flex items-baseline gap-1.5">
              <span>{activeCounters}</span>
              <span className="text-xs font-normal text-slate-400">of {counters.length} open</span>
            </div>
            <span className="text-[11px] text-amber-400 mt-1 block">
              {breakCounters} on break · {closedCounters} closed
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-xs font-semibold text-slate-400 block mb-1">Services Completed</span>
            <span className="text-2xl sm:text-3xl font-black font-mono text-white tabular-nums">
              {completedTokens}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">
              {skippedTokens} citizen no-shows
            </span>
          </div>
        </div>
      </div>

      {/* Simple View Navigation */}
      <div className="flex items-center gap-1 border-b border-slate-800 pb-px text-xs font-semibold">
        <button
          onClick={() => setActiveSection('overview')}
          className={`px-4 py-2 border-b-2 transition-colors cursor-pointer ${
            activeSection === 'overview'
              ? 'border-cyan-400 text-cyan-300 font-bold'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Department Queue Health
        </button>
        <button
          onClick={() => setActiveSection('counters')}
          className={`px-4 py-2 border-b-2 transition-colors cursor-pointer ${
            activeSection === 'counters'
              ? 'border-cyan-400 text-cyan-300 font-bold'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Counter Staff Roster ({counters.length})
        </button>
        <button
          onClick={() => setActiveSection('departments')}
          className={`px-4 py-2 border-b-2 transition-colors cursor-pointer ${
            activeSection === 'departments'
              ? 'border-cyan-400 text-cyan-300 font-bold'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Public Services Catalog ({services.length})
        </button>
      </div>

      {/* Section 1: Department Queue Health (Easy to Understand!) */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {offices.map((off) => {
              const offTokens = tokens.filter((t) => t.officeId === off.id);
              const offWaiting = offTokens.filter((t) => t.status === 'WAITING').length;
              const offServing = offTokens.filter((t) => t.status === 'SERVING').length;
              const offDone = offTokens.filter((t) => t.status === 'COMPLETED').length;
              const offCounters = counters.filter((c) => c.officeId === off.id);
              const offActive = offCounters.filter((c) => c.status === 'active').length;

              const isHealthy = offWaiting < 5;

              return (
                <div key={off.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-4 shadow-md">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-white">{off.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{off.department}</p>
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                        isHealthy ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {isHealthy ? 'Normal Flow' : 'Elevated Wait'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Waiting</span>
                      <span className="font-bold font-mono text-cyan-300 text-base tabular-nums">{offWaiting}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Serving Now</span>
                      <span className="font-bold font-mono text-emerald-300 text-base tabular-nums">{offServing}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Completed</span>
                      <span className="font-bold font-mono text-white text-base tabular-nums">{offDone}</span>
                    </div>
                  </div>

                  <div className="text-xs border-t border-slate-800 pt-3 flex items-center justify-between text-slate-400">
                    <span>{offActive} active desk(s) handling citizens</span>
                    <span className="font-mono text-[11px] text-slate-500">{off.operatingHours}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Simple Recent Activity Stream */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-3 shadow-md">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Recent Queue Timeline Events
            </h3>
            <div className="divide-y divide-slate-800/60 text-xs">
              {events.slice(0, 6).map((evt) => (
                <div key={evt.id} className="py-2.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                        evt.eventType === 'COMPLETED'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : evt.eventType === 'CALLED'
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                          : evt.eventType === 'COUNTER_STATUS_CHANGE'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-slate-950 text-slate-300'
                      }`}
                    >
                      {evt.eventType.replace(/_/g, ' ')}
                    </span>
                    <span className="text-white font-medium">{evt.details}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 tabular-nums shrink-0">
                    {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Section 2: Counter Staff Roster */}
      {activeSection === 'counters' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                Counter Staff Roster & Operational Status
              </h3>
              <p className="text-xs text-slate-400">View which desk is active, on break, or closed</p>
            </div>
            <span className="text-xs font-mono text-slate-500">{counters.length} desks</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {counters.map((cnt) => {
              const off = offices.find((o) => o.id === cnt.officeId);
              const servingToken = tokens.find((t) => t.id === cnt.currentTokenId);

              return (
                <div key={cnt.id} className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">{cnt.name}</span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                        cnt.status === 'active'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : cnt.status === 'break'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}
                    >
                      {cnt.status}
                    </span>
                  </div>

                  <div className="text-xs space-y-1">
                    <div className="text-slate-400 text-[11px] truncate">{off?.name}</div>
                    <div className="font-semibold text-cyan-300">
                      Officer: {cnt.staffName || 'Open Desk (Unstaffed)'}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Currently Serving:</span>
                    <span className="font-mono font-bold text-cyan-400">
                      {servingToken ? servingToken.tokenNumber : 'None (Idle)'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Section 3: Services Catalog */}
      {activeSection === 'departments' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                Authorized Public Services Catalog
              </h3>
              <p className="text-xs text-slate-400">Public service handling times, document requirements, and fees</p>
            </div>
            <span className="text-xs font-mono text-slate-500">{services.length} services</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((srv) => {
              const off = offices.find((o) => o.id === srv.officeId);
              return (
                <div key={srv.id} className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">{srv.name}</span>
                    <span className="font-mono text-[10px] bg-cyan-950 border border-cyan-800 text-cyan-300 px-1.5 py-0.5 rounded font-bold">
                      {srv.code}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{srv.description}</p>
                  <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800 pt-2">
                    <span>Department: {off?.code}</span>
                    <span className="font-mono text-cyan-300">~{srv.avgDurationMinutes} mins/person</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
