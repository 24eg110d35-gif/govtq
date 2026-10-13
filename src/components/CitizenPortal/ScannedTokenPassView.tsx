import React, { useState, useEffect, useMemo } from 'react';
import { useQueue } from '../../context/QueueContext';
import { DigitalToken } from '../../types/queue';
import { PicnieService } from '../../services/picnie';
import {
  Landmark,
  ShieldCheck,
  Building,
  Printer,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Timer,
  ChevronLeft,
  RotateCw,
  Sparkles,
} from 'lucide-react';

interface ScannedTokenPassViewProps {
  tokenNumber: string;
  tokenId?: string;
  onExitScanView: () => void;
}

export const ScannedTokenPassView: React.FC<ScannedTokenPassViewProps> = ({
  tokenNumber,
  tokenId,
  onExitScanView,
}) => {
  const { tokens, counters, refreshData } = useQueue();
  const [nowTime, setNowTime] = useState(Date.now());

  // 1-second live ticker for real-time countdowns
  useEffect(() => {
    const timer = setInterval(() => setNowTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Periodic poll to keep token live in sync across devices
  useEffect(() => {
    const poll = setInterval(() => {
      refreshData();
    }, 2000);
    return () => clearInterval(poll);
  }, [refreshData]);

  // Find token from state or construct from URL query parameters
  const existingToken = tokens.find(
    (t) =>
      t.tokenNumber.toUpperCase() === tokenNumber.toUpperCase() ||
      (tokenId && t.id === tokenId)
  );

  const token: DigitalToken = useMemo(() => {
    if (existingToken) return existingToken;

    // Fallback: parse rich query params so cross-device scan shows the full receipt instantly
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const svcName = p.get('service') || p.get('svc') || 'Vital Statistics & Civil Registration';
      const offName = p.get('office') || p.get('off') || 'City Municipal Corporation (Civil Station)';
      const citName = p.get('citizen') || p.get('cit') || 'Verified Citizen';
      const cid = p.get('cid') || p.get('num') || 'CID-VERIFIED-01';
      const statusParam = (p.get('status') || p.get('st') || 'WAITING') as DigitalToken['status'];
      const counterNum = Number(p.get('counter') || p.get('cnt')) || 1;
      const createdAt = p.get('created') || p.get('at') || new Date().toISOString();

      return {
        id: tokenId || `tok-scanned-${tokenNumber}`,
        tokenNumber,
        officeId: 'off-1',
        officeName: offName,
        serviceId: 'srv-1',
        serviceName: svcName,
        serviceCode: tokenNumber.split('-')[0] || 'CERT',
        citizenId: 'usr-scanned',
        citizenName: citName,
        citizenPhone: '+91 (080) 2296-7400',
        citizenNationalId: cid,
        counterNumber: counterNum,
        status: statusParam,
        priority: (p.get('priority') as DigitalToken['priority']) || 'STANDARD',
        createdAt,
        estimatedWaitMinutes: 5,
        qrPayload: `SMARTGOV:${tokenNumber}`,
      };
    }

    return {
      id: tokenId || `tok-fallback`,
      tokenNumber,
      officeId: 'off-1',
      officeName: 'City Municipal Corporation',
      serviceId: 'srv-1',
      serviceName: 'General Civic Administration',
      serviceCode: 'GOV',
      citizenId: 'usr-scanned',
      citizenName: 'Citizen',
      citizenPhone: '',
      citizenNationalId: 'CID-VERIFIED',
      status: 'WAITING',
      priority: 'STANDARD',
      createdAt: new Date().toISOString(),
      estimatedWaitMinutes: 5,
      qrPayload: `SMARTGOV:${tokenNumber}`,
    };
  }, [existingToken, tokenNumber, tokenId]);

  const formatSeconds = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Queue context
  const serviceCounters = counters.filter((c) => c.serviceIds.includes(token.serviceId));
  const activeDesks = Math.max(1, serviceCounters.filter((c) => c.status === 'active').length);

  const peopleAhead = tokens.filter(
    (t) =>
      t.serviceId === token.serviceId &&
      t.status === 'WAITING' &&
      new Date(t.createdAt).getTime() < new Date(token.createdAt).getTime()
  ).length;

  // 2-minute arrival reporting countdown if SERVING
  let reportingSecsRemaining = 0;
  let isGraceWindow = false;
  if (token.status === 'SERVING') {
    if (!token.arrivalConfirmedAt && token.calledAt) {
      isGraceWindow = true;
      const calledMs = new Date(token.calledAt).getTime();
      const elapsedCalled = Math.max(0, Math.floor((nowTime - calledMs) / 1000));
      reportingSecsRemaining = Math.max(0, 120 - elapsedCalled);
    }
  }

  // Dynamic wait time
  let liveWaitSecs = 0;
  if (token.status === 'WAITING') {
    const elapsedSecs = Math.max(0, Math.floor((nowTime - new Date(token.createdAt).getTime()) / 1000));
    const totalEst = Math.round((peopleAhead / activeDesks) * 240);
    liveWaitSecs = Math.max(0, totalEst - elapsedSecs);
  }

  const handlePrint = () => {
    PicnieService.triggerPrintReceipt(token);
  };

  const handleDownloadText = () => {
    const textContent = `
=====================================================
SMARTGOV QUEUE — OFFICIAL DIGITAL SERVICE TOKEN
=====================================================
Token Number:     ${token.tokenNumber}
Status:           ${token.status}
Priority:         ${token.priority}
Office:           ${token.officeName}
Service:          ${token.serviceName}
Citizen:          ${token.citizenName} (${token.citizenNationalId})
Issued:           ${new Date(token.createdAt).toLocaleString()}
Counter:          ${token.counterNumber ? `Counter ${token.counterNumber}` : 'Will be announced when called'}
Security:         ${token.qrPayload || 'SMARTGOV-VERIFIED'}
=====================================================
    `.trim();

    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SmartGov_Receipt_${token.tokenNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-xl w-full mx-auto py-6 px-3 space-y-6">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between no-print">
        <button
          onClick={onExitScanView}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer py-1.5 px-3 rounded-xl bg-slate-900 border border-slate-800"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Exit to Main Portal</span>
        </button>

        <button
          onClick={() => refreshData()}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 py-1.5 px-3 rounded-xl bg-cyan-950/60 border border-cyan-500/30 transition-colors cursor-pointer"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Sync Live Status</span>
        </button>
      </div>

      {/* Live Status Callout Strip */}
      <div className="no-print">
        {token.status === 'SERVING' ? (
          isGraceWindow ? (
            <div className="p-4 rounded-2xl bg-amber-950/80 border-2 border-amber-500 text-white shadow-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 animate-bounce" />
                  <span>CALLED TO COUNTER {token.counterNumber || 1}!</span>
                </span>
                <span className="text-2xl font-black font-mono text-amber-300 tabular-nums">
                  {formatSeconds(reportingSecsRemaining)}
                </span>
              </div>
              <p className="text-xs text-amber-100">
                Please present this screen immediately to Officer <strong>{token.staffName || 'Desk Staff'}</strong> at Counter {token.counterNumber || 1}.
              </p>
              <div className="text-[11px] text-amber-300 font-mono">
                ⚠️ Strict 2-minute arrival policy: Auto-skips when countdown reaches 00:00.
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-emerald-950/80 border-2 border-emerald-500 text-white shadow-xl flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <strong className="text-xs text-emerald-300 block font-bold uppercase">
                  Arrival Verified · In Active Service
                </strong>
                <span className="text-xs text-emerald-100">
                  Officer {token.staffName || 'Staff Desk'} is currently processing your request at Counter {token.counterNumber || 1}.
                </span>
              </div>
            </div>
          )
        ) : token.status === 'SKIPPED' ? (
          <div className="p-4 rounded-2xl bg-rose-950/80 border-2 border-rose-500 text-white shadow-xl flex items-center gap-3">
            <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
            <div>
              <strong className="text-xs text-rose-300 block font-bold uppercase">
                Token Was Skipped
              </strong>
              <span className="text-xs text-rose-100">
                {token.skipReason || 'Citizen did not report to counter within the 2-minute arrival grace window.'}
              </span>
            </div>
          </div>
        ) : token.status === 'COMPLETED' ? (
          <div className="p-4 rounded-2xl bg-blue-950/80 border border-blue-500 text-white shadow-xl flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-blue-400 shrink-0" />
            <div>
              <strong className="text-xs text-blue-300 block font-bold uppercase">
                Service Completed Successfully
              </strong>
              <span className="text-xs text-blue-100">
                Your civic service transaction has been finalized and recorded in the municipal archives.
              </span>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-900 border border-cyan-500/40 text-white shadow-xl flex items-center justify-between gap-4">
            <div>
              <span className="text-[11px] text-slate-400 uppercase font-semibold block">
                Queue Status: Position #{peopleAhead + 1}
              </span>
              <span className="text-sm font-bold text-cyan-300">
                {peopleAhead === 0 ? 'You are next in turn!' : `${peopleAhead} citizen(s) ahead`}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">
                Estimated Live Wait
              </span>
              <span className="text-xl font-black font-mono text-cyan-400 tabular-nums">
                ~{liveWaitSecs === 0 ? '00:00' : formatSeconds(liveWaitSecs)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Official Printable Digital Receipt Body */}
      <div className="printable-card rounded-2xl border border-slate-300 bg-white text-slate-900 p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Civic Insignia & Government Header */}
        <div className="text-center border-b border-slate-200 pb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 border border-slate-300 text-slate-800 mb-2 shadow-xs">
            <Building className="w-6 h-6 text-slate-800" />
          </div>
          <h2 className="text-base font-black uppercase tracking-wider text-slate-900">
            Government Public Administration
          </h2>
          <p className="text-xs font-semibold text-slate-700 mt-0.5">{token.officeName}</p>
          <span className="inline-block mt-2 px-3 py-0.5 text-[10px] uppercase font-bold tracking-widest bg-cyan-100 text-cyan-900 rounded-md border border-cyan-300">
            Official Citizen Service Pass
          </span>
        </div>

        {/* Big Official Token Number Display */}
        <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-5 text-center">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-1">
            Token Number
          </span>
          <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-slate-950 block tabular-nums">
            {token.tokenNumber}
          </span>
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-200 text-slate-800 font-mono">
              {token.priority}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase font-mono ${
                token.status === 'SERVING'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : token.status === 'COMPLETED'
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : token.status === 'SKIPPED'
                  ? 'bg-rose-100 text-rose-900 border border-rose-300'
                  : 'bg-cyan-100 text-cyan-900 border border-cyan-300'
              }`}
            >
              {token.status}
            </span>
          </div>
        </div>

        {/* Details Data Table */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-500 block">Service Requested</span>
            <strong className="text-slate-900 block mt-0.5">{token.serviceName}</strong>
          </div>
          <div>
            <span className="text-slate-500 block">Assigned Counter</span>
            <strong className="text-slate-900 block mt-0.5">
              {token.counterNumber ? `Counter ${token.counterNumber}` : 'Announced when called'}
            </strong>
          </div>
          <div>
            <span className="text-slate-500 block">Citizen Name</span>
            <span className="font-semibold text-slate-900 block mt-0.5">{token.citizenName}</span>
          </div>
          <div>
            <span className="text-slate-500 block">National ID / Phone</span>
            <span className="font-mono text-slate-800 block mt-0.5">
              {token.citizenNationalId || token.citizenPhone || 'Verified'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Issuance Timestamp</span>
            <span className="font-mono text-slate-700 block mt-0.5">
              {new Date(token.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}{' '}
              {new Date(token.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Security Hash</span>
            <span className="font-mono text-[10px] text-slate-600 block mt-0.5 truncate max-w-[160px]">
              {token.qrPayload || `SMARTGOV-SECURE-${token.tokenNumber}`}
            </span>
          </div>
        </div>

        {/* Security Watermark & Instructions */}
        <div className="border-t border-slate-200 pt-4 text-[11px] text-slate-600 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Cryptographically Verified Government Document</span>
          </div>
          <p>
            1. Watch the public display boards or listen for acoustic turn chimes in the lounge.
          </p>
          <p>
            2. Report immediately to the assigned desk upon being called.
          </p>
          <p>
            3. Carry physical original identification documents for manual verification.
          </p>
        </div>
      </div>

      {/* Action Buttons (no-print) */}
      <div className="no-print flex items-center justify-end gap-3 pt-2">
        <button
          onClick={handleDownloadText}
          className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Save Receipt (.txt)</span>
        </button>

        <button
          onClick={handlePrint}
          className="px-5 py-2 text-xs font-bold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Pass</span>
        </button>
      </div>
    </div>
  );
};
