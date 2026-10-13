import React, { useState } from 'react';
import { PicnieService, OcrExtractedData } from '../../services/picnie';
import {
  X,
  Upload,
  FileCheck2,
  AlertTriangle,
  Loader2,
  FileText,
  CheckCircle2,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

interface DocumentOcrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyExtractedData: (data: OcrExtractedData) => void;
}

export const DocumentOcrModal: React.FC<DocumentOcrModalProps> = ({
  isOpen,
  onClose,
  onApplyExtractedData,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedResult, setExtractedResult] = useState<OcrExtractedData | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setExtractedResult(null);
    }
  };

  const handleRunOcr = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setError(null);
    try {
      const result = await PicnieService.scanSupportingDocument({
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
      });
      setExtractedResult(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'OCR parsing failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApply = () => {
    if (extractedResult) {
      onApplyExtractedData(extractedResult);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 text-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">
                Supporting Document OCR Scanner
              </h3>
              <p className="text-[11px] text-slate-400">
                Powered by Picnie API Integration Engine
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

        {/* Content */}
        <div className="p-6 space-y-5">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-cyan-300">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Smart Document Intake</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Upload an official citizen identification card, tax bill, or certificate. The system will
              automatically extract your name and document registration number to expedite token generation.
            </p>
          </div>

          {/* Upload Zone */}
          <div className="border-2 border-dashed border-slate-700 rounded-xl p-6 text-center hover:border-cyan-500 transition-colors bg-slate-950/60">
            <input
              type="file"
              id="ocr-file-input"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="ocr-file-input"
              className="cursor-pointer flex flex-col items-center justify-center space-y-2"
            >
              <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-xs font-semibold text-white">
                {selectedFile ? selectedFile.name : 'Click to select supporting document'}
              </div>
              <p className="text-[11px] text-slate-400">
                Supported: Aadhaar, PAN, Voter ID, Passport, Utility Bill (JPG, PNG, PDF up to 10MB)
              </p>
            </label>
          </div>

          {error && (
            <div className="bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl p-3 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Extracted Details Card */}
          {extractedResult && (
            <div className="bg-slate-950 border border-cyan-800/80 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-cyan-300 uppercase tracking-wide">
                    Extracted Document Fields
                  </span>
                </div>
                <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800 tabular-nums">
                  Confidence: {extractedResult.confidenceScore}%
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Detected Document</span>
                  <span className="font-semibold text-white block mt-0.5">
                    {extractedResult.documentType}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Citizen Full Name</span>
                  <span className="font-semibold text-white block mt-0.5">
                    {extractedResult.citizenName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Registration Number</span>
                  <span className="font-mono font-bold text-cyan-400 block mt-0.5">
                    {extractedResult.documentNumber}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Issuing Authority</span>
                  <span className="font-medium text-slate-300 block mt-0.5 truncate" title={extractedResult.issuingAuthority}>
                    {extractedResult.issuingAuthority}
                  </span>
                </div>
              </div>

              {extractedResult.extractedAddress && (
                <div className="pt-1 text-xs">
                  <span className="text-slate-400 block text-[11px]">Address on Record</span>
                  <span className="font-medium text-slate-300 block mt-0.5">
                    {extractedResult.extractedAddress}
                  </span>
                </div>
              )}

              <div className="bg-amber-950/60 border border-amber-800 text-amber-300 rounded-xl p-2.5 text-[10px] flex items-start gap-2 mt-2">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <p>{extractedResult.disclaimer}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-950 border-t border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB selected` : 'No file chosen'}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {!extractedResult ? (
              <button
                onClick={handleRunOcr}
                disabled={!selectedFile || isProcessing}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 disabled:opacity-40 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing Document...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-3.5 h-3.5" />
                    <span>Scan Document</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleApply}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Pre-Fill & Take Token</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
