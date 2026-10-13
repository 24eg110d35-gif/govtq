import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { DigitalToken } from '../../types/queue';
import { PicnieService } from '../../services/picnie';
import {
  X,
  Printer,
  FileText,
  QrCode,
  ShieldCheck,
  Building,
  AlertCircle,
  Download,
  Copy,
  Check,
  ExternalLink,
  Smartphone,
} from 'lucide-react';

interface TokenReceiptModalProps {
  token: DigitalToken | null;
  onClose: () => void;
}

export const TokenReceiptModal: React.FC<TokenReceiptModalProps> = ({ token, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Compute robust live verification link for external devices and QR scanners
  const getPublicBase = () => {
    const PUBLIC_SHARED_URL = 'https://ais-pre-ccaisirftehyzfzo3dbsuu-494064981743.asia-southeast1.run.app';
    if (typeof window === 'undefined') return PUBLIC_SHARED_URL;
    const origin = window.location.origin;

    // In AI Studio preview: 'ais-dev-*' requires Google developer auth and returns 404/403 to external smartphones.
    // 'ais-pre-*' is the public shared environment accessible by any smartphone QR scanner!
    if (origin.includes('ais-dev-')) {
      return origin.replace('ais-dev-', 'ais-pre-');
    }
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return PUBLIC_SHARED_URL;
    }
    return origin;
  };

  const baseOrigin = getPublicBase();
  // Include both ?receipt= and ?token= so any scanner or query parser resolves immediately
  const verificationUrl = token && baseOrigin
    ? `${baseOrigin}/?receipt=${encodeURIComponent(token.tokenNumber)}&token=${encodeURIComponent(token.tokenNumber)}&id=${encodeURIComponent(token.id)}&service=${encodeURIComponent(token.serviceName)}&office=${encodeURIComponent(token.officeName)}&citizen=${encodeURIComponent(token.citizenName)}&cid=${encodeURIComponent(token.citizenNationalId)}&priority=${encodeURIComponent(token.priority)}&status=${encodeURIComponent(token.status)}&counter=${encodeURIComponent(token.counterNumber || '')}&created=${encodeURIComponent(token.createdAt)}`
    : '';

  useEffect(() => {
    if (!token || !verificationUrl) return;

    let isMounted = true;
    QRCode.toDataURL(verificationUrl, {
      width: 280,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#020617',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (isMounted) setQrDataUrl(url);
      })
      .catch((err) => {
        console.warn('QR code generation failed, using fallback:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [token, verificationUrl]);

  if (!token) return null;

  const handlePrint = () => {
    PicnieService.triggerPrintReceipt(token);
  };

  const handleCopyLink = async () => {
    if (!verificationUrl) return;
    try {
      await navigator.clipboard.writeText(verificationUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // ignore
    }
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
Service:          ${token.serviceName} (${token.serviceCode})
Citizen Name:     ${token.citizenName}
Citizen ID:       ${token.citizenNationalId}
Phone:            ${token.citizenPhone}
Issuance Time:    ${new Date(token.createdAt).toLocaleString()}
Estimated Wait:   ~${token.estimatedWaitMinutes} minutes
Assigned Desk:    ${token.counterNumber ? `Counter ${token.counterNumber}` : 'Will be announced when called'}
Mobile Live URL:  ${verificationUrl}
Security Payload: ${token.qrPayload || 'SMARTGOV-SECURE-TOKEN'}
=====================================================
INSTRUCTIONS:
1. Please wait in the designated public waiting lounge.
2. Watch the central display screen or listen for your token chime.
3. Scan the QR code with any smartphone to track your turn on mobile.
4. Carry original identity and supporting verification documents.
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 text-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-800 overflow-hidden relative">
        {/* Header toolbar (no-print) */}
        <div className="no-print bg-slate-950 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <span className="text-sm font-bold tracking-tight">Official Token Pass & Live QR</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Official Receipt Body */}
        <div className="printable-card p-6 sm:p-8 space-y-5 bg-white text-slate-900">
          {/* Government Emblem / Heading */}
          <div className="text-center border-b border-slate-200 pb-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 border border-slate-300 text-slate-800 mb-2">
              <Building className="w-6 h-6 text-slate-800" />
            </div>
            <h2 className="text-base font-extrabold uppercase tracking-wider text-slate-900">
              Government Public Administration
            </h2>
            <p className="text-xs font-semibold text-slate-700 mt-0.5">{token.officeName}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">SmartGov Central Queue Allocation Service</p>
          </div>

          {/* Token Number Spotlight */}
          <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-4 text-center">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest block">
              Your Digital Token Number
            </span>
            <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-slate-900 my-1 block tabular-nums">
              {token.tokenNumber}
            </span>
            <div className="flex items-center justify-center gap-2 text-xs font-semibold mt-1.5">
              <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 uppercase text-[11px]">
                {token.priority}
              </span>
              <span className="text-slate-400">·</span>
              <span
                className={`uppercase text-[11px] font-bold ${
                  token.status === 'SERVING'
                    ? 'text-cyan-700'
                    : token.status === 'COMPLETED'
                    ? 'text-blue-700'
                    : 'text-amber-700'
                }`}
              >
                Status: {token.status}
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3.5 text-xs">
            <div>
              <span className="text-slate-500 block">Requested Service</span>
              <span className="font-bold text-slate-900 block mt-0.5 leading-snug">
                {token.serviceName}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Assigned Destination</span>
              <span className="font-bold text-slate-900 block mt-0.5">
                {token.counterNumber ? `Counter ${token.counterNumber}` : 'Waiting Call'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Citizen Name</span>
              <span className="font-semibold text-slate-900 block mt-0.5">{token.citizenName}</span>
              <span className="text-[10px] text-slate-500">{token.citizenNationalId}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Issuance Date & Time</span>
              <span className="font-semibold text-slate-900 block mt-0.5 tabular-nums">
                {new Date(token.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>

          {/* Real Functional Verification QR Code Section */}
          <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl">
            <div className="space-y-1.5 text-left flex-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <Smartphone className="w-4 h-4 text-cyan-700 shrink-0" />
                <span>Scan to View on Another Device</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Scan with any smartphone camera or QR scanner to open and follow your live queue progress on your phone.
              </p>
              <div className="pt-1 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-600" />}
                  <span>{copiedLink ? 'Link Copied!' : 'Copy Mobile Link'}</span>
                </button>
                {verificationUrl && (
                  <a
                    href={verificationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-700/10 hover:bg-cyan-700/20 text-cyan-800 text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Open Mobile View</span>
                  </a>
                )}
              </div>
            </div>

            {/* Real QR Image */}
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <a
                href={verificationUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                title="Click to preview or scan with phone camera"
                className="w-28 h-28 bg-white border-2 border-slate-300 hover:border-cyan-600 rounded-xl p-1.5 shadow-md flex items-center justify-center transition-all cursor-pointer group"
              >
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR Pass for ${token.tokenNumber}`}
                    className="w-full h-full object-contain rounded-lg group-hover:scale-[1.02] transition-transform"
                  />
                ) : (
                  <QrCode className="w-14 h-14 text-slate-400 animate-pulse" />
                )}
              </a>
              <span className="text-[10px] font-mono font-medium text-slate-500">
                Scan with phone camera
              </span>
            </div>
          </div>

          {/* Important Civic Notice */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-lg p-3 text-[11px] text-amber-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold">Notice for Citizens:</strong> Please proceed to the assigned counter promptly when called. Carry original documents for verification.
            </div>
          </div>
        </div>

        {/* Action Buttons (no-print) */}
        <div className="no-print bg-slate-950 border-t border-slate-800 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>Picnie PDF / Direct Print Ready</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleDownloadText}
              className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save Text</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Official Receipt</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
