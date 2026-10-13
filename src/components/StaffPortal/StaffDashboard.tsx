import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useQueue } from '../../context/QueueContext';
import { DigitalToken } from '../../types/queue';
import {
  Users,
  Play,
  CheckCircle2,
  SkipForward,
  Clock,
  AlertCircle,
  Building2,
  Search,
  Timer,
  AlertTriangle,
  Coffee,
  XCircle,
  X,
  PlayCircle,
  ShieldCheck,
  UserCheck,
  Hourglass,
} from 'lucide-react';

export const StaffDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    counters,
    offices,
    services,
    tokens,
    callNext,
    callSpecific,
    confirmCitizenArrival,
    completeService,
    skipToken,
    updateCounterStatus,
  } = useQueue();

  const [selectedOfficeId, setSelectedOfficeId] = useState<string>(
    currentUser?.officeId || offices[0]?.id || 'off-1'
  );
  const [selectedCounterId, setSelectedCounterId] = useState<string>(
    currentUser?.assignedCounterId || counters[0]?.id || 'cnt-1'
  );

  const [skipTargetToken, setSkipTargetToken] = useState<DigitalToken | null>(null);
  const [skipReason, setSkipReason] = useState<string>('Citizen absent at counter when called');

  const [completeTargetToken, setCompleteTargetToken] = useState<DigitalToken | null>(null);
  const [serviceNotes, setServiceNotes] = useState<string>('');

  const [searchFilter, setSearchFilter] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isCallingNext, setIsCallingNext] = useState(false);
  const [isConfirmingArrival, setIsConfirmingArrival] = useState(false);

  const [nowTime, setNowTime] = useState(Date.now());

  // 1-second live ticker for arrival countdown and service duration
  useEffect(() => {
    const timer = setInterval(() => setNowTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const officeCounters = counters.filter((c) => c.officeId === selectedOfficeId);
  const currentCounter = counters.find((c) => c.id === selectedCounterId);

  const activeServingToken = tokens.find(
    (t) => t.counterId === selectedCounterId && t.status === 'SERVING'
  );

  const eligibleServices = currentCounter ? currentCounter.serviceIds : [];
  const waitingTokens = tokens
    .filter(
      (t) =>
        t.officeId === selectedOfficeId &&
        eligibleServices.includes(t.serviceId) &&
        t.status === 'WAITING'
    )
    .sort((a, b) => {
      const weight = { SPECIALLY_ABLED: 3, SENIOR_CITIZEN: 2, STANDARD: 1 };
      const diff = (weight[b.priority] || 1) - (weight[a.priority] || 1);
      if (diff !== 0) return diff;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

  const filteredWaiting = waitingTokens.filter(
    (t) =>
      t.tokenNumber.toLowerCase().includes(searchFilter.toLowerCase()) ||
      t.citizenName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      t.serviceName.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const completedTodayAtCounter = tokens.filter(
    (t) => t.counterId === selectedCounterId && t.status === 'COMPLETED'
  ).length;
  const skippedTodayAtCounter = tokens.filter(
    (t) => t.counterId === selectedCounterId && t.status === 'SKIPPED'
  ).length;

  // 2-minute arrival reporting countdown & service stopwatch
  let isAwaitingArrival = false;
  let remainingGraceSecs = 120;
  let elapsedServiceSecs = 0;

  if (activeServingToken) {
    if (!activeServingToken.arrivalConfirmedAt && activeServingToken.calledAt) {
      isAwaitingArrival = true;
      const calledMs = new Date(activeServingToken.calledAt).getTime();
      const elapsedCalled = Math.max(0, Math.floor((nowTime - calledMs) / 1000));
      remainingGraceSecs = Math.max(0, 120 - elapsedCalled);
    } else {
      const startMs = new Date(
        activeServingToken.arrivalConfirmedAt || activeServingToken.servedAt || activeServingToken.calledAt || nowTime
      ).getTime();
      elapsedServiceSecs = Math.max(0, Math.floor((nowTime - startMs) / 1000));
    }
  }

  const handleCallNext = async () => {
    if (!currentCounter) return;
    setErrorMessage(null);
    setActionSuccess(null);

    // Enforce realistic counter state checks
    if (currentCounter.status === 'break') {
      setErrorMessage(`Counter ${currentCounter.counterNumber} is on break. Click "Resume Active Duty" to resume serving.`);
      return;
    }
    if (currentCounter.status === 'closed') {
      setErrorMessage(`Counter ${currentCounter.counterNumber} is closed. Please re-open the counter to serve waiting citizens.`);
      return;
    }

    setIsCallingNext(true);
    try {
      const res = await callNext(currentCounter.id);
      setActionSuccess(res.message);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error calling next token.');
    } finally {
      setIsCallingNext(false);
    }
  };

  const handleCallSpecific = async (tokenId: string) => {
    if (!currentCounter) return;
    setErrorMessage(null);
    setActionSuccess(null);

    if (currentCounter.status !== 'active') {
      setErrorMessage(`Counter ${currentCounter.counterNumber} must be in ACTIVE status before calling tokens.`);
      return;
    }

    try {
      const token = await callSpecific(tokenId, currentCounter.id);
      setActionSuccess(`Called token ${token.tokenNumber} to Counter ${currentCounter.counterNumber}.`);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error calling token.');
    }
  };

  const handleConfirmArrival = async () => {
    if (!activeServingToken || !currentCounter) return;
    setErrorMessage(null);
    setActionSuccess(null);
    setIsConfirmingArrival(true);

    try {
      await confirmCitizenArrival(activeServingToken.id, currentCounter.id);
      setActionSuccess(
        `Arrival confirmed for citizen ${activeServingToken.citizenName} (${activeServingToken.tokenNumber}). 2-minute timer stopped, service session commenced.`
      );
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error confirming citizen arrival.');
    } finally {
      setIsConfirmingArrival(false);
    }
  };

  const handleStatusChange = async (newStatus: 'active' | 'break' | 'closed') => {
    if (!currentCounter) return;
    setErrorMessage(null);
    setActionSuccess(null);

    // Practical check: If actively serving a token, prevent break or close without finishing
    if (activeServingToken && (newStatus === 'break' || newStatus === 'closed')) {
      setErrorMessage(
        `Action Denied: You are actively handling citizen token ${activeServingToken.tokenNumber}. Please complete the service or record resolution before placing Counter ${currentCounter.counterNumber} on break or closed.`
      );
      return;
    }

    try {
      await updateCounterStatus(currentCounter.id, newStatus);
      setActionSuccess(`Counter ${currentCounter.counterNumber} status updated to ${newStatus.toUpperCase()}`);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error updating counter status.');
    }
  };

  const handleConfirmComplete = async () => {
    if (!completeTargetToken || !currentCounter) return;
    setErrorMessage(null);
    try {
      await completeService(completeTargetToken.id, currentCounter.id, serviceNotes);
      setCompleteTargetToken(null);
      setServiceNotes('');
      setActionSuccess(`Service completed for token ${completeTargetToken.tokenNumber}. Counter is now idle.`);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error completing service.');
    }
  };

  const handleConfirmSkip = async () => {
    if (!skipTargetToken || !currentCounter) return;
    setErrorMessage(null);
    try {
      await skipToken(skipTargetToken.id, currentCounter.id, skipReason);
      setSkipTargetToken(null);
      setSkipReason('Citizen absent at counter when called');
      setActionSuccess(`Token ${skipTargetToken.tokenNumber} marked as SKIPPED. Counter is now idle.`);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error skipping token.');
    }
  };

  const formatElapsed = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Officer Desk Workspace Banner */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-950 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white leading-tight">
                  Staff Service Desk Operations
                </h1>
                <span className="text-[11px] font-mono bg-blue-950 border border-blue-800 text-blue-300 px-2 py-0.5 rounded font-bold">
                  Officer: {currentUser?.name}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Staff ID: {currentUser?.staffId || 'STAFF-CMC-409'} · Government Authorized Handler
              </p>
            </div>
          </div>

          {/* Office, Counter & Practical Status Switcher */}
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={selectedOfficeId}
              onChange={(e) => {
                setSelectedOfficeId(e.target.value);
                const matchingCounters = counters.filter((c) => c.officeId === e.target.value);
                if (matchingCounters.length > 0) {
                  setSelectedCounterId(matchingCounters[0].id);
                }
              }}
              className="text-xs font-semibold rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {offices.map((off) => (
                <option key={off.id} value={off.id}>
                  {off.name}
                </option>
              ))}
            </select>

            <select
              value={selectedCounterId}
              onChange={(e) => setSelectedCounterId(e.target.value)}
              className="text-xs font-bold rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-cyan-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {officeCounters.map((cnt) => (
                <option key={cnt.id} value={cnt.id}>
                  Counter {cnt.counterNumber} ({cnt.name})
                </option>
              ))}
            </select>

            {/* Practical Status Buttons */}
            {currentCounter && (
              <div className="flex items-center border border-slate-700 rounded-xl overflow-hidden bg-slate-950 p-0.5 text-xs">
                <button
                  onClick={() => handleStatusChange('active')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                    currentCounter.status === 'active'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => handleStatusChange('break')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                    currentCounter.status === 'break'
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  On Break
                </button>
                <button
                  onClick={() => handleStatusChange('closed')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                    currentCounter.status === 'closed'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Closed
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Feedback alerts */}
        {errorMessage && (
          <div className="mt-4 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl p-3 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-rose-200 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {actionSuccess && (
          <div className="mt-4 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-xl p-3 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
            <button onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-emerald-200 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Break or Closed Notice Banner */}
      {currentCounter?.status === 'break' && (
        <div className="p-4 rounded-xl bg-amber-950/50 border border-amber-600/50 text-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2.5">
            <Coffee className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <strong className="font-bold text-sm block">Counter {currentCounter.counterNumber} is Currently on Short Break</strong>
              <span className="text-xs text-amber-300">
                Queue calls are paused. Citizens in the waiting lounge see this counter as temporarily resting.
              </span>
            </div>
          </div>
          <button
            onClick={() => handleStatusChange('active')}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wide cursor-pointer shrink-0"
          >
            Resume Active Duty
          </button>
        </div>
      )}

      {currentCounter?.status === 'closed' && (
        <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-600/50 text-rose-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2.5">
            <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <strong className="font-bold text-sm block">Counter {currentCounter.counterNumber} is Closed</strong>
              <span className="text-xs text-rose-300">
                This desk is currently inactive. Waiting citizens are routed to other open counters.
              </span>
            </div>
          </div>
          <button
            onClick={() => handleStatusChange('active')}
            className="px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs uppercase tracking-wide cursor-pointer shrink-0"
          >
            Re-Open Counter
          </button>
        </div>
      )}

      {/* Main Grid: Active Serving Spotlight & Counter Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div
            className={`rounded-2xl border p-6 transition-all ${
              activeServingToken
                ? isAwaitingArrival
                  ? 'bg-slate-900 border-amber-500 shadow-xl ring-2 ring-amber-500/20'
                  : 'bg-slate-900 border-emerald-500 shadow-xl ring-2 ring-emerald-500/20'
                : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${currentCounter?.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <h2 className="text-sm font-bold uppercase tracking-wide text-white">
                  Currently at Counter {currentCounter?.counterNumber || 1}
                </h2>
              </div>

              {activeServingToken && (
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold ${
                    isAwaitingArrival
                      ? 'bg-amber-950 border border-amber-800 text-amber-300'
                      : 'bg-emerald-950 border border-emerald-800 text-emerald-300'
                  }`}
                >
                  <Timer className="w-3.5 h-3.5" />
                  <span className="tabular-nums">
                    {isAwaitingArrival
                      ? `Grace: ${formatElapsed(remainingGraceSecs)}`
                      : `Service: ${formatElapsed(elapsedServiceSecs)}`}
                  </span>
                </div>
              )}
            </div>

            {activeServingToken ? (
              <div className="py-6 space-y-6">
                {/* AWAITING CITIZEN ARRIVAL BANNER */}
                {isAwaitingArrival ? (
                  <div className="p-4 rounded-xl bg-amber-950/60 border border-amber-600/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-lg shrink-0 animate-pulse">
                        <Hourglass className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] text-amber-400 uppercase tracking-widest font-bold block">
                          Citizen Reporting Window (2 Minutes)
                        </span>
                        <h4 className="font-bold text-white text-sm">
                          Citizen called. Waiting for {activeServingToken.citizenName} to approach desk.
                        </h4>
                        <span className="text-[11px] text-amber-300/80">
                          Auto-skip triggers in {formatElapsed(remainingGraceSecs)} if citizen is absent.
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={handleConfirmArrival}
                      disabled={isConfirmingArrival}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wide transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/25 shrink-0"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>{isConfirmingArrival ? 'Confirming...' : 'Confirm Citizen Arrived'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-600/40 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <span className="text-emerald-300 font-bold text-xs block">
                        Citizen Present at Counter · Active Service Session
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        Officer verified citizen attendance. Service delivery is underway.
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold block">
                      Active Citizen Token
                    </span>
                    <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight block tabular-nums text-cyan-300">
                      {activeServingToken.tokenNumber}
                    </span>
                    <span className="text-xs font-bold text-white mt-1 block">
                      {activeServingToken.serviceName}
                    </span>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs space-y-1.5 min-w-[240px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Citizen:</span>
                      <span className="font-bold text-white">{activeServingToken.citizenName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">National ID:</span>
                      <span className="font-mono text-cyan-400">{activeServingToken.citizenNationalId}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Contact:</span>
                      <span className="text-slate-300 font-mono">{activeServingToken.citizenPhone}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Priority:</span>
                      <span className="font-bold text-cyan-400 text-[11px] uppercase">
                        {activeServingToken.priority}
                      </span>
                    </div>
                  </div>
                </div>

                {activeServingToken.notes && (
                  <div className="bg-slate-950 rounded-xl p-3 text-xs text-slate-300 border border-slate-800">
                    <strong className="text-cyan-400 font-semibold">Citizen Request: </strong>
                    {activeServingToken.notes}
                  </div>
                )}

                {/* Desk Action Controls */}
                <div className="pt-2 flex flex-wrap items-center gap-3 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setCompleteTargetToken(activeServingToken);
                      setServiceNotes('Verification completed and citizen documents verified.');
                    }}
                    className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Complete Service (Frees Desk)</span>
                  </button>

                  <button
                    onClick={() => setSkipTargetToken(activeServingToken)}
                    className="py-3 px-4 rounded-xl border border-slate-700 hover:bg-rose-950/60 hover:text-rose-300 hover:border-rose-700 text-slate-300 font-semibold text-xs tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <SkipForward className="w-4 h-4" />
                    <span>Skip Token</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 text-slate-500 flex items-center justify-center mx-auto">
                  <Users className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Counter {currentCounter?.counterNumber || 1} is Currently Idle & Ready
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                    {currentCounter?.status !== 'active'
                      ? `Counter is set to ${currentCounter?.status.toUpperCase()}. Switch to Active to call citizens.`
                      : 'Zero lingering tokens at desk. Ready to admit the next waiting citizen immediately.'}
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleCallNext}
                    disabled={isCallingNext || waitingTokens.length === 0 || currentCounter?.status !== 'active'}
                    className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-2 shadow-lg shadow-blue-600/25 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>{isCallingNext ? 'Calling Queue...' : 'Call Next Waiting Token'}</span>
                  </button>
                  <p className="text-[11px] text-slate-500 mt-2">
                    {waitingTokens.length} citizen(s) currently waiting in queue for this counter
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Counter Stats & Assigned Services */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-4 shadow-md">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
              Counter {currentCounter?.counterNumber || 1} Today's Record
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[11px] text-slate-400 block">Served Today</span>
                <span className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
                  {completedTodayAtCounter}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[11px] text-slate-400 block">Skipped</span>
                <span className="text-2xl font-bold font-mono text-rose-400 tabular-nums">
                  {skippedTodayAtCounter}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <span className="text-slate-400 block text-[11px]">Assigned Services:</span>
              <ul className="text-white font-semibold list-disc list-inside space-y-0.5">
                {eligibleServices.map((sid) => {
                  const s = services.find((x) => x.id === sid);
                  return <li key={sid}>{s?.name || sid}</li>;
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Waiting Queue Table for This Desk */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                Waiting Queue for Counter {currentCounter?.counterNumber || 1}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-700 text-cyan-300 text-xs font-mono font-bold tabular-nums">
                {waitingTokens.length} in line
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Chronological line for services handled at this desk. Priority citizens ordered first.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search token or name..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-700 bg-slate-950 text-white w-48 sm:w-60 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={handleCallNext}
              disabled={isCallingNext || waitingTokens.length === 0 || !!activeServingToken || currentCounter?.status !== 'active'}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs tracking-wide transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Call Next</span>
            </button>
          </div>
        </div>

        {filteredWaiting.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No citizens currently waiting for services assigned to Counter {currentCounter?.counterNumber || 1}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-950 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Position</th>
                  <th className="py-2.5 px-3 font-semibold">Token</th>
                  <th className="py-2.5 px-3 font-semibold">Priority</th>
                  <th className="py-2.5 px-3 font-semibold">Citizen Name</th>
                  <th className="py-2.5 px-3 font-semibold">Service</th>
                  <th className="py-2.5 px-3 font-semibold">Waiting Time</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredWaiting.map((token, idx) => {
                  const waitMinutes = Math.max(1, Math.floor((nowTime - new Date(token.createdAt).getTime()) / 60000));
                  return (
                    <tr key={token.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-400 tabular-nums">#{idx + 1}</td>
                      <td className="py-3 px-3 font-mono font-bold text-cyan-300 tabular-nums">{token.tokenNumber}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                            token.priority === 'SPECIALLY_ABLED'
                              ? 'bg-purple-950 text-purple-300 border border-purple-800'
                              : token.priority === 'SENIOR_CITIZEN'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-slate-950 text-slate-300 border border-slate-800'
                          }`}
                        >
                          {token.priority}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-medium text-white">
                        <div>{token.citizenName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{token.citizenNationalId}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-300">{token.serviceName}</td>
                      <td className="py-3 px-3 font-mono tabular-nums text-slate-400">{waitMinutes}m ago</td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleCallSpecific(token.id)}
                          disabled={!!activeServingToken || currentCounter?.status !== 'active'}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                          Call This Token
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Complete Service Modal */}
      {completeTargetToken && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Complete Service — {completeTargetToken.tokenNumber}</h3>
              <button onClick={() => setCompleteTargetToken(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-300">
              Confirm resolution for <strong>{completeTargetToken.citizenName}</strong> ({completeTargetToken.serviceName}).
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Resolution & Delivery Notes</label>
              <textarea
                rows={3}
                value={serviceNotes}
                onChange={(e) => setServiceNotes(e.target.value)}
                placeholder="e.g. Verification verified, certificate handed over."
                className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={() => setCompleteTargetToken(null)} className="px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-700 text-slate-400 hover:text-white cursor-pointer">
                Cancel
              </button>
              <button onClick={handleConfirmComplete} className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer">
                Confirm Completion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Skip Token Modal */}
      {skipTargetToken && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Mark Token as Skipped — {skipTargetToken.tokenNumber}</h3>
              <button onClick={() => setSkipTargetToken(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-300">
              Select the reason why token <strong>{skipTargetToken.tokenNumber}</strong> was skipped.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Reason for Skipping</label>
              <select
                value={skipReason}
                onChange={(e) => setSkipReason(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 p-2 text-white focus:ring-2 focus:ring-rose-500"
              >
                <option value="Citizen absent at counter when called">Citizen absent at counter when called</option>
                <option value="Citizen did not report within 2-minute grace window">Citizen did not report within 2-minute grace window</option>
                <option value="Incomplete or missing required documents">Incomplete or missing required documents</option>
                <option value="Citizen requested later time / re-queued">Citizen requested later time / re-queued</option>
                <option value="Wrong department or service requested">Wrong department or service requested</option>
              </select>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={() => setSkipTargetToken(null)} className="px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-700 text-slate-400 hover:text-white cursor-pointer">
                Cancel
              </button>
              <button onClick={handleConfirmSkip} className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-500 text-white cursor-pointer">
                Confirm Skip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
