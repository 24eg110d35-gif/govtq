import React, { useState, useEffect } from 'react';
import { useQueue } from '../../context/QueueContext';
import { useAuth } from '../../context/AuthContext';
import { OcrExtractedData } from '../../services/picnie';
import {
  X,
  Building2,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  FileSearch,
  Sparkles,
} from 'lucide-react';

interface TokenGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefilledOcrData?: OcrExtractedData | null;
}

export const TokenGeneratorModal: React.FC<TokenGeneratorModalProps> = ({
  isOpen,
  onClose,
  prefilledOcrData,
}) => {
  const { offices, services, generateToken, setActiveReceiptToken, setShowOcrModal } = useQueue();
  const { currentUser } = useAuth();

  const [selectedOfficeId, setSelectedOfficeId] = useState<string>('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [priority, setPriority] = useState<'STANDARD' | 'SENIOR_CITIZEN' | 'SPECIALLY_ABLED'>('STANDARD');
  const [citizenNotes, setCitizenNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (offices.length > 0 && !selectedOfficeId) {
      setSelectedOfficeId(offices[0].id);
    }
  }, [offices, selectedOfficeId]);

  const availableServices = services.filter((s) => s.officeId === selectedOfficeId);
  useEffect(() => {
    if (availableServices.length > 0) {
      const currentServiceStillValid = availableServices.some((s) => s.id === selectedServiceId);
      if (!currentServiceStillValid) {
        setSelectedServiceId(availableServices[0].id);
      }
    } else {
      setSelectedServiceId('');
    }
  }, [selectedOfficeId, availableServices, selectedServiceId]);

  if (!isOpen) return null;

  const currentOffice = offices.find((o) => o.id === selectedOfficeId);
  const currentService = services.find((s) => s.id === selectedServiceId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOfficeId || !selectedServiceId) {
      setError('Please select both a government office and the requested service.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const token = await generateToken({
        officeId: selectedOfficeId,
        serviceId: selectedServiceId,
        priority,
        notes: citizenNotes,
        ocrProcessed: Boolean(prefilledOcrData),
      });

      onClose();
      setActiveReceiptToken(token);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not generate token. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 text-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">
                Generate Digital Queue Token
              </h3>
              <p className="text-[11px] text-slate-400">
                Direct Appointment & Queue Allocation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {prefilledOcrData && (
            <div className="bg-cyan-950/60 border border-cyan-800 text-cyan-300 rounded-xl p-3 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="font-semibold">
                  Pre-filled via OCR: {prefilledOcrData.documentType} ({prefilledOcrData.documentNumber})
                </span>
              </div>
              <span className="text-[10px] bg-cyan-900/80 px-2 py-0.5 rounded font-mono">
                Verified
              </span>
            </div>
          )}

          {/* Step 1: Office */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              1. Select Government Office / Administrative Center
            </label>
            <select
              value={selectedOfficeId}
              onChange={(e) => setSelectedOfficeId(e.target.value)}
              className="w-full text-xs font-semibold rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {offices.map((off) => (
                <option key={off.id} value={off.id}>
                  {off.name} ({off.code})
                </option>
              ))}
            </select>
            {currentOffice && (
              <p className="text-[11px] text-slate-400 mt-1">
                {currentOffice.address} · {currentOffice.operatingHours}
              </p>
            )}
          </div>

          {/* Step 2: Service */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                2. Select Required Public Service
              </label>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setShowOcrModal(true);
                }}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <FileSearch className="w-3.5 h-3.5" />
                <span>Upload Document (OCR)</span>
              </button>
            </div>
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              disabled={availableServices.length === 0}
              className="w-full text-xs font-semibold rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-40"
            >
              {availableServices.length === 0 ? (
                <option value="">No services available for this office</option>
              ) : (
                availableServices.map((srv) => (
                  <option key={srv.id} value={srv.id}>
                    {srv.name} — ({srv.category})
                  </option>
                ))
              )}
            </select>

            {currentService && (
              <div className="mt-2.5 bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Avg handling duration: ~{currentService.avgDurationMinutes} mins/person</span>
                  </span>
                  <span className="font-semibold text-cyan-300">
                    Fee: {currentService.feeAmount > 0 ? `₹${currentService.feeAmount}` : 'Free Civic Service'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-300 block mb-1">
                    Required Supporting Documents:
                  </span>
                  <ul className="list-disc list-inside text-[11px] text-slate-400 space-y-0.5">
                    {currentService.requiredDocuments.map((doc, idx) => (
                      <li key={idx}>{doc}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Step 3: Priority */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              3. Citizen Queue Priority Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPriority('STANDARD')}
                className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-colors cursor-pointer ${
                  priority === 'STANDARD'
                    ? 'border-cyan-500 bg-cyan-950/80 text-cyan-300 font-bold'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                Standard
              </button>
              <button
                type="button"
                onClick={() => setPriority('SENIOR_CITIZEN')}
                className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-colors cursor-pointer ${
                  priority === 'SENIOR_CITIZEN'
                    ? 'border-cyan-500 bg-cyan-950/80 text-cyan-300 font-bold'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                Senior (60+)
              </button>
              <button
                type="button"
                onClick={() => setPriority('SPECIALLY_ABLED')}
                className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-colors cursor-pointer ${
                  priority === 'SPECIALLY_ABLED'
                    ? 'border-cyan-500 bg-cyan-950/80 text-cyan-300 font-bold'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                Specially-Abled
              </button>
            </div>
          </div>

          {/* Step 4: Notes */}
          <div className="border-t border-slate-800 pt-3">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-400">Registering Citizen:</span>
              <span className="font-semibold text-cyan-300">
                {currentUser?.name} ({currentUser?.nationalId || 'CID-8842-9011'})
              </span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Optional Notes for Officer
              </label>
              <input
                type="text"
                placeholder="e.g. Need duplicate copy for passport verification"
                value={citizenNotes}
                onChange={(e) => setCitizenNotes(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          {error && (
            <div className="bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl p-3 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="bg-slate-950 -mx-6 -mb-6 px-6 py-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Immediate digital queue allocation</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !selectedServiceId}
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-colors flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 disabled:opacity-40 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{isSubmitting ? 'Allocating...' : 'Generate My Token'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
