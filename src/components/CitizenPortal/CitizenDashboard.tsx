import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useQueue } from '../../context/QueueContext';
import { DigitalToken } from '../../types/queue';
import { TokenGeneratorModal } from './TokenGeneratorModal';
import { TokenReceiptModal } from './TokenReceiptModal';
import { DocumentOcrModal } from './DocumentOcrModal';
import { OcrExtractedData } from '../../services/picnie';
import {
  Ticket,
  Clock,
  Users,
  CheckCircle2,
  AlertTriangle,
  Printer,
  FileSearch,
  Building2,
  Calendar,
  Sparkles,
  Coffee,
  XCircle,
  HelpCircle,
  Volume2,
  Volume1,
  VolumeX,
  Timer,
  Bell,
  ShieldAlert,
} from 'lucide-react';

export const CitizenDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    tokens,
    offices,
    counters,
    services,
    soundPreference,
    setSoundPreference,
    setActiveReceiptToken,
    activeReceiptToken,
    showOcrModal,
    setShowOcrModal,
    showNewTokenModal,
    setShowNewTokenModal,
  } = useQueue();

  const [prefilledOcr, setPrefilledOcr] = useState<OcrExtractedData | null>(null);
  const [nowTime, setNowTime] = useState(Date.now());

  // 1-second live ticker for dynamic wait countdown and 2-min auto-skip timer
  useEffect(() => {
    const timer = setInterval(() => setNowTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter tokens belonging to this logged in citizen
  const citizenTokens = tokens.filter((t) => t.citizenId === currentUser?.id);
  const activeToken = citizenTokens.find((t) => t.status === 'WAITING' || t.status === 'SERVING');
  const pastTokens = citizenTokens.filter((t) => t.status === 'COMPLETED' || t.status === 'SKIPPED');
  const lastSkippedToken = [...citizenTokens].reverse().find((t) => t.status === 'SKIPPED');

  // Currently serving token for the same service
  let currentlyServingSameService: DigitalToken | undefined;
  let currentlyServingElapsedSecs = 0;
  let peopleAhead = 0;
  let activeDesksCount = 0;
  let breakDesksCount = 0;
  const targetService = services.find((s) => s.id === activeToken?.serviceId);

  if (activeToken) {
    currentlyServingSameService = tokens.find(
      (t) => t.serviceId === activeToken.serviceId && t.status === 'SERVING'
    );
    if (currentlyServingSameService?.calledAt) {
      currentlyServingElapsedSecs = Math.max(
        0,
        Math.floor((nowTime - new Date(currentlyServingSameService.calledAt).getTime()) / 1000)
      );
    }

    peopleAhead = tokens.filter(
      (t) =>
        t.serviceId === activeToken.serviceId &&
        t.status === 'WAITING' &&
        new Date(t.createdAt).getTime() < new Date(activeToken.createdAt).getTime()
    ).length;

    const serviceCounters = counters.filter((c) => c.serviceIds.includes(activeToken.serviceId));
    activeDesksCount = serviceCounters.filter((c) => c.status === 'active').length;
    breakDesksCount = serviceCounters.filter((c) => c.status === 'break').length;
  }

  const handleApplyOcr = (ocrData: OcrExtractedData) => {
    setPrefilledOcr(ocrData);
    setShowNewTokenModal(true);
  };

  // Helper formatting mm:ss
  const formatSeconds = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Dynamic wait calculations for WAITING token:
  // LOGICAL & CONTINUALLY REDUCING LIVE EVERY SECOND
  let dynamicRemainingWaitSecs = 0;
  let next5MinPulseSecs = 0;

  if (activeToken && activeToken.status === 'WAITING') {
    const createdMs = new Date(activeToken.createdAt).getTime();
    const elapsedSecs = Math.max(0, Math.floor((nowTime - createdMs) / 1000));
    next5MinPulseSecs = 300 - (elapsedSecs % 300);

    const effectiveDesks = Math.max(1, activeDesksCount);
    const avgDurationSecs = (targetService?.avgDurationMinutes || 4) * 60;

    if (peopleAhead === 0) {
      // Citizen is #1 in line (first in queue)
      if (currentlyServingSameService) {
        // Someone is at the desk right now; remaining wait is whatever remains of their turn
        dynamicRemainingWaitSecs = Math.max(0, avgDurationSecs - currentlyServingElapsedSecs);
      } else {
        // Desk is currently idle & available!
        dynamicRemainingWaitSecs = 0;
      }
    } else {
      // People ahead in queue: calculate estimated wait based on queue depth and active desks
      // Smooth monotonic reduction every second without modulo reset jumps
      const totalEstimatedSecs = Math.round((peopleAhead / effectiveDesks) * avgDurationSecs);
      dynamicRemainingWaitSecs = Math.max(0, totalEstimatedSecs - elapsedSecs);
    }
  }

  // 2-minute reporting grace window calculations for SERVING token
  let reportingRemainingSecs = 0;
  let reportingPercent = 100;
  let isGraceWindowActive = false;

  if (activeToken && activeToken.status === 'SERVING') {
    if (!activeToken.arrivalConfirmedAt && activeToken.calledAt) {
      isGraceWindowActive = true;
      const calledMs = new Date(activeToken.calledAt).getTime();
      const elapsedCalledSecs = Math.max(0, Math.floor((nowTime - calledMs) / 1000));
      reportingRemainingSecs = Math.max(0, 120 - elapsedCalledSecs);
      reportingPercent = Math.min(100, Math.max(0, (reportingRemainingSecs / 120) * 100));
    }
  }

  return (
    <div className="space-y-8">
      {/* Citizen Welcome Card */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 text-white shadow-2xl">
        <div className="absolute inset-0 z-0">
          <img
            src="/src/assets/images/smartgov_hero_civic_1791864625216.jpg"
            alt="Civic Service Center"
            className="w-full h-full object-cover opacity-20"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-transparent" />
        </div>

        <div className="relative z-10 p-6 sm:p-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Authenticated Citizen Portal · {currentUser?.name}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-2 text-balance">
            Digital Token & Queue Management
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed mb-6">
            Generate digital service tokens, track real-time queue sequences, and view dynamic wait estimations calculated by active service desks.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setPrefilledOcr(null);
                setShowNewTokenModal(true);
              }}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-2 shadow-lg shadow-cyan-500/25 cursor-pointer"
            >
              <Ticket className="w-4 h-4" />
              <span>Get Digital Token</span>
            </button>

            <button
              onClick={() => setShowOcrModal(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-xs tracking-wide transition-colors flex items-center gap-2 cursor-pointer backdrop-blur-xs"
            >
              <FileSearch className="w-4 h-4 text-cyan-400" />
              <span>Scan Supporting Document (OCR)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sound Preference Quick Switcher Card */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white block">Queue Sound Alert Controls</span>
            <span className="text-slate-400 text-[11px]">
              Configure acoustic chimes for your digital token turn and 5-minute progress updates.
            </span>
          </div>
        </div>

        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 gap-1">
          <button
            onClick={() => setSoundPreference('turn-only')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              soundPreference === 'turn-only'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Volume1 className="w-3.5 h-3.5" />
            <span>Turn Call Only</span>
          </button>
          <button
            onClick={() => setSoundPreference('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              soundPreference === 'all'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Turn & 5-Min Pulse</span>
          </button>
          <button
            onClick={() => setSoundPreference('muted')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              soundPreference === 'muted'
                ? 'bg-slate-800 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <VolumeX className="w-3.5 h-3.5" />
            <span>Muted</span>
          </button>
        </div>
      </div>

      {/* Active Token Tracker Spotlight */}
      {activeToken ? (
        <div
          className={`rounded-2xl border p-6 sm:p-8 transition-all shadow-xl ${
            activeToken.status === 'SERVING'
              ? isGraceWindowActive
                ? 'bg-amber-950/20 border-amber-500 ring-2 ring-amber-500/30'
                : 'bg-emerald-950/20 border-emerald-500 ring-2 ring-emerald-500/30'
              : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-1">
                <span
                  className={
                    activeToken.status === 'SERVING'
                      ? isGraceWindowActive
                        ? 'text-amber-400 font-extrabold'
                        : 'text-emerald-400 font-extrabold'
                      : 'text-slate-400'
                  }
                >
                  Active Token Tracker
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-400 font-mono">
                  Issued {new Date(activeToken.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                {activeToken.serviceName}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>{activeToken.officeName}</span>
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-slate-950 border border-slate-800 text-white px-6 py-4 rounded-xl text-center shadow-lg">
                <span className="text-[10px] text-cyan-400 uppercase tracking-widest font-bold block">
                  Your Token
                </span>
                <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight block tabular-nums text-cyan-300">
                  {activeToken.tokenNumber}
                </span>
              </div>
              <button
                onClick={() => setActiveReceiptToken(activeToken)}
                className="px-4 py-3 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-cyan-400" />
                <span>View Receipt</span>
              </button>
            </div>
          </div>

          {/* Real-Time Callout Section */}
          {activeToken.status === 'SERVING' ? (
            isGraceWindowActive ? (
              /* 2-MINUTE REPORTING GRACE WINDOW ACTIVE */
              <div className="my-6 p-5 sm:p-6 rounded-2xl bg-amber-950/60 border-2 border-amber-500 text-white shadow-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xl shrink-0 animate-pulse">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base sm:text-lg text-amber-300 leading-tight">
                        YOUR TOKEN HAS BEEN CALLED TO COUNTER {activeToken.counterNumber || 1}!
                      </h3>
                      <p className="text-xs text-amber-100/90 mt-1 max-w-xl">
                        Please report immediately to Officer <strong>{activeToken.staffName || 'Staff Desk'}</strong> with your verification documents.
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-950 border border-amber-500/50 rounded-xl px-5 py-3 text-center shrink-0">
                    <span className="text-[10px] text-amber-400 uppercase tracking-widest font-bold block">
                      Reporting Window Remaining
                    </span>
                    <span className="text-3xl sm:text-4xl font-black font-mono text-amber-300 tabular-nums block">
                      {formatSeconds(reportingRemainingSecs)}
                    </span>
                  </div>
                </div>

                {/* Progress bar countdown */}
                <div className="space-y-1">
                  <div className="h-2.5 rounded-full bg-slate-950 overflow-hidden border border-amber-500/40">
                    <div
                      className="h-full bg-amber-400 transition-all duration-1000 ease-linear rounded-full"
                      style={{ width: `${reportingPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-amber-200/80 font-mono">
                    <span className="flex items-center gap-1">
                      <Timer className="w-3 h-3 text-amber-400" />
                      <span>Strict 2-minute arrival policy</span>
                    </span>
                    <span>{reportingRemainingSecs}s / 120s remaining</span>
                  </div>
                </div>

                <div className="bg-amber-900/40 rounded-xl p-3 border border-amber-600/40 flex items-center gap-2 text-xs text-amber-200">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    <strong>Auto-Skip Policy:</strong> If you do not present yourself at Counter {activeToken.counterNumber || 1} within the 2-minute grace window, your token will automatically be skipped to prevent queue blockage. Only the staff officer can confirm your arrival.
                  </span>
                </div>
              </div>
            ) : (
              /* ARRIVAL CONFIRMED - SERVICE IN PROGRESS */
              <div className="my-6 p-5 rounded-2xl bg-emerald-950/60 border-2 border-emerald-500 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-lg shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-emerald-300 leading-tight">
                      ARRIVAL CONFIRMED · IN ACTIVE SERVICE AT COUNTER {activeToken.counterNumber || 1}
                    </h3>
                    <p className="text-xs text-emerald-100/90 mt-0.5">
                      Officer {activeToken.staffName || 'Staff Desk'} has confirmed your presence at the counter. Your service request is currently being handled.
                    </p>
                  </div>
                </div>
                <span className="px-3.5 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-mono text-xs font-bold shrink-0">
                  ACTIVE AT DESK
                </span>
              </div>
            )
          ) : (
            /* WAITING IN QUEUE: DYNAMIC LIVE COUNTDOWN & 5-MIN PULSE */
            <div className="my-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Stat 1 (CSS Selector 3): Currently Serving */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 transition-all shadow-md">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400">Currently Serving</span>
                    <span
                      className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                        currentlyServingSameService
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {currentlyServingSameService ? 'Desk Active' : 'Desk Ready'}
                    </span>
                  </div>
                  <div className="text-2xl font-bold font-mono text-white tabular-nums">
                    {currentlyServingSameService ? (
                      <span className="text-cyan-300">{currentlyServingSameService.tokenNumber}</span>
                    ) : (
                      <span className="text-emerald-400 text-xl font-bold">Idle & Ready</span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    {currentlyServingSameService ? (
                      <span>
                        At Counter {currentlyServingSameService.counterNumber || 1}
                        {currentlyServingElapsedSecs > 0 && ` · in session ~${formatSeconds(currentlyServingElapsedSecs)}`}
                      </span>
                    ) : (
                      <span>Counter open · Preparing to call next token</span>
                    )}
                  </span>
                </div>

                {/* Stat 2 (CSS Selector 2): People Ahead */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 transition-all shadow-md">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400">People Ahead in Line</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Position #{peopleAhead + 1}
                    </span>
                  </div>
                  <div className="text-2xl font-bold font-mono text-white tabular-nums flex items-baseline gap-1.5">
                    <span className={peopleAhead === 0 ? 'text-emerald-400 font-extrabold' : 'text-white'}>
                      {peopleAhead}
                    </span>
                    <span className="text-xs font-normal text-slate-400">
                      {peopleAhead === 1 ? 'citizen' : 'citizens'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    {peopleAhead === 0 ? (
                      <span className="text-emerald-400 font-semibold">You are next in turn!</span>
                    ) : (
                      <span>Ahead of you in sequential queue</span>
                    )}
                  </span>
                </div>

                {/* Stat 3 (CSS Selector 1): Live Dynamic Estimated Wait Time */}
                <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/40 relative overflow-hidden transition-all shadow-md">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400">Live Dynamic Wait</span>
                    {breakDesksCount > 0 ? (
                      <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                        <Coffee className="w-3 h-3" />
                        <span>{breakDesksCount} on break</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-cyan-400 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        <span>REDUCING LIVE</span>
                      </span>
                    )}
                  </div>
                  <div className="text-2xl font-bold font-mono text-cyan-400 tabular-nums flex items-baseline gap-1.5">
                    <span>
                      {dynamicRemainingWaitSecs === 0 ? '0m 00s' : formatSeconds(dynamicRemainingWaitSecs)}
                    </span>
                    <span className="text-xs font-normal text-slate-400">live</span>
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    {dynamicRemainingWaitSecs === 0
                      ? 'Desks are ready — Turn approaching any moment!'
                      : `Ticking down live across ${activeDesksCount || 1} active desk(s)`}
                  </span>
                </div>
              </div>

              {/* 5-Minute Heartbeat Indicator Strip */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="text-slate-300">
                    Periodic Queue Heartbeat: In-app position update sent automatically every 5 minutes.
                  </span>
                </div>
                <div className="text-right font-mono text-slate-400 tabular-nums shrink-0">
                  Next alert in: <strong className="text-cyan-300 font-bold">{formatSeconds(next5MinPulseSecs)}</strong>
                </div>
              </div>
            </div>
          )}

          {/* Stepper Progress */}
          <div className="pt-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
              Queue Life-Cycle Progress
            </span>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="space-y-1">
                <div className="h-2 rounded-full bg-cyan-500" />
                <span className="font-semibold text-white block text-[11px]">1. Token Issued</span>
              </div>
              <div className="space-y-1">
                <div
                  className={`h-2 rounded-full ${
                    activeToken.status === 'WAITING' || activeToken.status === 'SERVING'
                      ? 'bg-cyan-500'
                      : 'bg-slate-800'
                  }`}
                />
                <span className={`block text-[11px] ${activeToken.status === 'WAITING' ? 'font-bold text-cyan-400' : 'text-slate-400'}`}>
                  2. Waiting in Line
                </span>
              </div>
              <div className="space-y-1">
                <div
                  className={`h-2 rounded-full ${
                    activeToken.status === 'SERVING' ? 'bg-cyan-500 animate-pulse' : 'bg-slate-800'
                  }`}
                />
                <span className={`block text-[11px] ${activeToken.status === 'SERVING' ? 'font-bold text-cyan-400' : 'text-slate-400'}`}>
                  3. Called to Desk
                </span>
              </div>
              <div className="space-y-1">
                <div className="h-2 rounded-full bg-slate-800" />
                <span className="text-slate-500 block text-[11px]">4. Completed</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="space-y-4">
          {lastSkippedToken && (
            <div className="rounded-2xl border border-rose-500/50 bg-rose-950/30 p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-black shrink-0">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wide">
                    Token {lastSkippedToken.tokenNumber} Marked as Skipped
                  </h4>
                  <p className="text-xs text-rose-100/90 mt-0.5">
                    {lastSkippedToken.skipReason || 'Citizen did not report to counter within the 2-minute arrival window.'} Your session was cleared and recorded in history below.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setActiveReceiptToken(lastSkippedToken)}
                  className="px-3 py-1.5 rounded-lg border border-rose-500/40 text-rose-200 hover:bg-rose-900/40 text-xs font-semibold cursor-pointer"
                >
                  View Skipped Pass
                </button>
                <button
                  onClick={() => {
                    setPrefilledOcr(null);
                    setShowNewTokenModal(true);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer shadow-md"
                >
                  Re-Issue Token
                </button>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/60 p-8 sm:p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto mb-4">
              <Ticket className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-white mb-1">
              No Active Queue Token Allocated
            </h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
              You do not currently have a token waiting in the queue. Select a government department and service below to obtain your digital pass.
            </p>
            <button
              onClick={() => {
                setPrefilledOcr(null);
                setShowNewTokenModal(true);
              }}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20"
            >
              <Ticket className="w-4 h-4" />
              <span>Generate New Token Now</span>
            </button>
          </div>
        </div>
      )}

      {/* Citizen Past Visits */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">
              Your Queue History & Completed Services
            </h3>
            <p className="text-xs text-slate-400">Historical records of your public administration visits</p>
          </div>
          <span className="text-xs text-slate-400 font-mono tabular-nums">
            {pastTokens.length} record(s) on file
          </span>
        </div>

        {pastTokens.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No previous token history on record for this citizen account.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-950 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Token</th>
                  <th className="py-2.5 px-3 font-semibold">Service</th>
                  <th className="py-2.5 px-3 font-semibold">Office</th>
                  <th className="py-2.5 px-3 font-semibold">Date & Time</th>
                  <th className="py-2.5 px-3 font-semibold">Status / Details</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {pastTokens.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-cyan-300 tabular-nums">
                      {t.tokenNumber}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-200">{t.serviceName}</td>
                    <td className="py-3 px-3 text-slate-400 truncate max-w-[200px]">{t.officeName}</td>
                    <td className="py-3 px-3 text-slate-400 font-mono tabular-nums">
                      {new Date(t.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                      <span className="text-[10px] text-slate-500">
                        {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div>
                        <span className={`text-[11px] font-bold uppercase ${t.status === 'COMPLETED' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {t.status}
                        </span>
                        {t.status === 'SKIPPED' && (
                          <span className="text-[10px] text-slate-400 block line-clamp-1">
                            {t.skipReason || 'Missed arrival window'}
                          </span>
                        )}
                        {t.status === 'COMPLETED' && t.staffName && (
                          <span className="text-[10px] text-slate-400 block line-clamp-1">
                            Served by {t.staffName}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => setActiveReceiptToken(t)}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
                        >
                          Receipt
                        </button>
                        {t.status === 'SKIPPED' && (
                          <button
                            onClick={() => {
                              setPrefilledOcr(null);
                              setShowNewTokenModal(true);
                            }}
                            className="px-2 py-1 text-[11px] font-bold rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition-colors cursor-pointer"
                            title="Re-issue token for this service"
                          >
                            Re-Queue
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <TokenGeneratorModal
        isOpen={showNewTokenModal}
        onClose={() => setShowNewTokenModal(false)}
        prefilledOcrData={prefilledOcr}
      />
      <DocumentOcrModal
        isOpen={showOcrModal}
        onClose={() => setShowOcrModal(false)}
        onApplyExtractedData={handleApplyOcr}
      />
      <TokenReceiptModal
        token={activeReceiptToken}
        onClose={() => setActiveReceiptToken(null)}
      />
    </div>
  );
};
