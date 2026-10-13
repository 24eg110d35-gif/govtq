import React, { useState, useEffect } from 'react';
import { useQueue } from '../../context/QueueContext';
import {
  Monitor,
  Volume2,
  VolumeX,
  Building2,
  Clock,
  Sparkles,
  Maximize2,
  Coffee,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Radio,
} from 'lucide-react';

export const LiveDisplayBoard: React.FC = () => {
  const { offices, counters, tokens, soundEnabled, setSoundEnabled } = useQueue();

  // Live ticking clock updated every second
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const servingTokens = tokens.filter((t) => t.status === 'SERVING');

  const nextWaiting = tokens
    .filter((t) => t.status === 'WAITING')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .slice(0, 6);

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const activeCount = counters.filter((c) => c.status === 'active').length;
  const breakCount = counters.filter((c) => c.status === 'break').length;

  return (
    <div className="space-y-4">
      {/* Electronic Wall Board Frame */}
      <div className="bg-slate-950 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Top Header: Civic Identity + Live Clock & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
              <Monitor className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tracking-widest text-cyan-400 font-bold uppercase">
                  Central Public Waiting Hall
                </span>
                <span className="flex items-center gap-1 text-[10px] font-mono bg-cyan-950 border border-cyan-800 text-cyan-300 px-2 py-0.5 rounded-full font-bold">
                  <Radio className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
                  <span>LIVE REFRESHING</span>
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-0.5">
                Electronic Token Call Board
              </h1>
            </div>
          </div>

          {/* Real-Time Live Clock + Board Action Buttons */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="text-left md:text-right bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl">
              <div className="text-lg font-black font-mono text-cyan-300 tracking-wider tabular-nums leading-none">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-mono mt-1">
                {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="px-3.5 py-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
                <span>{soundEnabled ? 'Chime ON' : 'Chime Muted'}</span>
              </button>

              <button
                onClick={handleFullscreen}
                className="px-3.5 py-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-cyan-400 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Fullscreen</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Ticker Announcement Strip */}
        <div className="my-4 py-2 px-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs overflow-hidden">
          <div className="flex items-center gap-2 font-mono text-slate-300">
            <span className="font-bold text-cyan-400 uppercase tracking-wider text-[11px] shrink-0">
              [CIVIC HALL NOTICE]
            </span>
            <span className="truncate">
              Please watch your token number · Keep original verification documents ready · {activeCount} Counters Active · {breakCount > 0 ? `${breakCount} Counter(s) on Short Break · ` : ''} Audio chime alerts sound on every new call
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest shrink-0 hidden sm:inline">
            SYSTEM ONLINE
          </span>
        </div>

        {/* Split Board: Left (NOW SERVING) vs Right (COUNTER STATUS MATRIX) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-6">
          {/* Left Column (7 cols): Large LED Now Serving Cards */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-extrabold tracking-widest uppercase text-cyan-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>NOW SERVING AT DESKS</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {servingTokens.length} Citizen(s) being served
              </span>
            </div>

            {servingTokens.length === 0 ? (
              <div className="py-16 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 text-slate-400 text-xs space-y-2">
                <Clock className="w-8 h-8 mx-auto text-slate-600" />
                <p className="font-bold text-sm text-slate-300">All Desks Preparing for Next Call</p>
                <p className="text-[11px] text-slate-500">
                  Please remain seated in the public waiting hall. Your token will flash here when announced.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {servingTokens.map((st) => {
                  let isGrace = false;
                  let remainingGrace = 0;
                  if (!st.arrivalConfirmedAt && st.calledAt) {
                    const elapsed = Math.max(0, Math.floor((currentTime.getTime() - new Date(st.calledAt).getTime()) / 1000));
                    remainingGrace = Math.max(0, 120 - elapsed);
                    isGrace = true;
                  }

                  return (
                    <div
                      key={st.id}
                      className={`rounded-2xl border p-5 shadow-2xl relative overflow-hidden transition-all ${
                        isGrace
                          ? 'border-amber-500/70 bg-gradient-to-br from-slate-900 to-amber-950/40 ring-1 ring-amber-500/30'
                          : 'border-emerald-500/50 bg-gradient-to-br from-slate-900 to-emerald-950/30'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                        <span className={`font-bold uppercase tracking-wider text-[11px] ${isGrace ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {isGrace ? 'PROCEED TO COUNTER' : 'IN SESSION AT DESK'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {isGrace ? (
                            <span className="font-mono text-[10px] bg-amber-950 border border-amber-600 text-amber-300 px-2 py-0.5 rounded font-bold uppercase animate-pulse">
                              {Math.floor(remainingGrace / 60)}:{String(remainingGrace % 60).padStart(2, '0')} LEFT
                            </span>
                          ) : (
                            <span className="font-mono text-[10px] bg-emerald-950 border border-emerald-600 text-emerald-300 px-2 py-0.5 rounded font-bold uppercase">
                              IN SERVICE
                            </span>
                          )}
                          <span className="font-mono text-[10px] bg-cyan-950 border border-cyan-800 text-cyan-300 px-1.5 py-0.5 rounded font-bold uppercase">
                            {st.priority.slice(0, 3)}
                          </span>
                        </div>
                      </div>

                      <div className="my-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">
                          Citizen Token
                        </span>
                        <span className={`text-4xl sm:text-5xl font-black font-mono tracking-tight tabular-nums block ${isGrace ? 'text-amber-300' : 'text-cyan-300'}`}>
                          {st.tokenNumber}
                        </span>
                      </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                          Assigned Destination
                        </span>
                        <span className="text-xl font-black text-white font-mono tabular-nums">
                          Counter {st.counterNumber || 1}
                        </span>
                      </div>
                      <div className="text-right max-w-[130px]">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                          Service
                        </span>
                        <span className="text-[11px] font-semibold text-slate-200 block truncate">
                          {st.serviceName}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </div>

          {/* Right Column (5 cols): Real-Time Counter & Desk Status Matrix */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-extrabold tracking-widest uppercase text-slate-300">
                DESK OPERATIONAL STATUS
              </span>
              <span className="text-[11px] font-mono text-cyan-400">
                {activeCount} Active / {counters.length} Total
              </span>
            </div>

            <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
              {counters.map((cnt) => {
                const servingToken = tokens.find((t) => t.id === cnt.currentTokenId);

                return (
                  <div
                    key={cnt.id}
                    className={`p-3.5 rounded-xl border transition-all text-xs flex items-center justify-between gap-3 ${
                      cnt.status === 'active'
                        ? 'border-slate-800 bg-slate-900/90'
                        : cnt.status === 'break'
                        ? 'border-amber-700/60 bg-amber-950/30'
                        : 'border-slate-800 bg-slate-950/60 opacity-60'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{cnt.name}</span>
                        <span
                          className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded ${
                            cnt.status === 'active'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : cnt.status === 'break'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-rose-950 text-rose-300 border border-rose-800'
                          }`}
                        >
                          {cnt.status === 'break' ? 'Short Break' : cnt.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Officer: {cnt.staffName || 'Open Desk'}
                      </p>
                    </div>

                    <div className="text-right">
                      {cnt.status === 'active' ? (
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase block">Serving</span>
                          <span className="font-mono font-bold text-cyan-300 text-sm tabular-nums">
                            {servingToken ? servingToken.tokenNumber : 'Idle (Ready)'}
                          </span>
                        </div>
                      ) : cnt.status === 'break' ? (
                        <div className="text-amber-400 font-semibold text-[11px] flex items-center gap-1 justify-end">
                          <Coffee className="w-3.5 h-3.5" />
                          <span>Resting (10m)</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 font-mono text-[11px]">Closed</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Bar: Upcoming Queue Ticker & Estimates */}
        <div className="border-t border-slate-800 pt-5">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <span>UPCOMING TOKENS IN QUEUE</span>
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Tokens called sequentially by priority & arrival
            </span>
          </div>

          {nextWaiting.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500 rounded-xl bg-slate-900 border border-slate-800">
              The waiting queue is currently clear. No citizen tokens pending.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {nextWaiting.map((token, idx) => (
                <div
                  key={token.id}
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-1 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>#{idx + 1} NEXT</span>
                    <span className="text-cyan-400 font-bold uppercase">{token.priority.slice(0, 3)}</span>
                  </div>
                  <span className="font-mono font-bold text-base text-white block tabular-nums text-cyan-300">
                    {token.tokenNumber}
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate" title={token.serviceName}>
                    {token.serviceName}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono block">
                    ~{token.estimatedWaitMinutes}m wait
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
