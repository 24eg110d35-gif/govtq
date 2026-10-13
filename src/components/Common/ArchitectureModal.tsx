import React, { useState } from 'react';
import { useQueue } from '../../context/QueueContext';
import {
  X,
  Code2,
  Database,
  Server,
  Layers,
  Copy,
  Check,
  Download,
  ExternalLink,
  ShieldAlert,
  Cpu,
} from 'lucide-react';

export const ArchitectureModal: React.FC = () => {
  const { showArchitectureModal, setShowArchitectureModal } = useQueue();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'architecture' | 'tidb' | 'picnie'>('architecture');

  if (!showArchitectureModal) return null;

  const sqlSchemaText = `-- =======================================================================
-- SMARTGOV QUEUE — TiDB Cloud Relational Schema (MySQL 8.0 Compatible)
-- =======================================================================

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(191) NOT NULL UNIQUE,
  phone VARCHAR(30) NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('citizen', 'staff', 'admin') NOT NULL DEFAULT 'citizen',
  national_id VARCHAR(50) NULL,
  staff_id VARCHAR(50) NULL,
  office_id VARCHAR(64) NULL,
  assigned_counter_id VARCHAR(64) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS government_offices (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  department VARCHAR(200) NOT NULL,
  address TEXT NOT NULL,
  operating_hours VARCHAR(100) NOT NULL,
  contact_number VARCHAR(50) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS government_services (
  id VARCHAR(64) PRIMARY KEY,
  office_id VARCHAR(64) NOT NULL,
  name VARCHAR(200) NOT NULL,
  code VARCHAR(20) NOT NULL,
  category VARCHAR(100) NOT NULL,
  avg_duration_minutes INT NOT NULL DEFAULT 10,
  fee_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  required_documents JSON NULL,
  FOREIGN KEY (office_id) REFERENCES government_offices(id) ON DELETE CASCADE,
  INDEX idx_services_office (office_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS service_counters (
  id VARCHAR(64) PRIMARY KEY,
  office_id VARCHAR(64) NOT NULL,
  counter_number INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  service_ids JSON NOT NULL,
  status ENUM('active', 'break', 'closed') NOT NULL DEFAULT 'active',
  current_token_id VARCHAR(64) NULL,
  break_reason VARCHAR(255) NULL,
  break_start_time TIMESTAMP NULL,
  FOREIGN KEY (office_id) REFERENCES government_offices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS digital_tokens (
  id VARCHAR(64) PRIMARY KEY,
  token_number VARCHAR(30) NOT NULL,
  office_id VARCHAR(64) NOT NULL,
  service_id VARCHAR(64) NOT NULL,
  citizen_id VARCHAR(64) NOT NULL,
  citizen_name VARCHAR(150) NOT NULL,
  citizen_phone VARCHAR(30) NOT NULL,
  citizen_national_id VARCHAR(50) NOT NULL,
  counter_id VARCHAR(64) NULL,
  counter_number INT NULL,
  staff_id VARCHAR(64) NULL,
  status ENUM('WAITING', 'SERVING', 'COMPLETED', 'SKIPPED') NOT NULL DEFAULT 'WAITING',
  priority ENUM('STANDARD', 'SENIOR_CITIZEN', 'SPECIALLY_ABLED') NOT NULL DEFAULT 'STANDARD',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  called_at TIMESTAMP NULL,
  served_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  skipped_at TIMESTAMP NULL,
  skip_reason VARCHAR(255) NULL,
  estimated_wait_minutes INT NOT NULL DEFAULT 15,
  INDEX idx_tokens_office_status (office_id, status),
  INDEX idx_tokens_citizen (citizen_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSchemaText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSql = () => {
    const blob = new Blob([sqlSchemaText], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'smartgov_queue_schema.sql';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-800 overflow-hidden text-white">
        {/* Header */}
        <div className="bg-slate-950 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold text-white">
                Project Architecture & Database Specification
              </h3>
              <p className="text-[11px] text-slate-400">
                Engineering Documentation & TiDB Cloud Guide
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowArchitectureModal(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 border-b border-slate-800 bg-slate-950 px-6 pt-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-3.5 py-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'architecture'
                ? 'border-cyan-400 text-cyan-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            System Architecture
          </button>
          <button
            onClick={() => setActiveTab('tidb')}
            className={`px-3.5 py-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'tidb'
                ? 'border-cyan-400 text-cyan-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            TiDB Cloud Schema (DDL)
          </button>
          <button
            onClick={() => setActiveTab('picnie')}
            className={`px-3.5 py-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'picnie'
                ? 'border-cyan-400 text-cyan-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Picnie API Setup
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5 text-xs">
          {activeTab === 'architecture' && (
            <div className="space-y-4">
              <h4 className="font-bold text-sm text-white">
                End-to-End Three-Tier Civic Architecture
              </h4>
              <p className="text-slate-300 leading-relaxed">
                SmartGov Queue is architected according to student software engineering best practices with strict role-gated authentication and realistic counter status mechanics:
              </p>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-center">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-cyan-400 font-bold block uppercase">Client Layer</span>
                    <strong className="block text-white mt-1">Browser UI (React 19)</strong>
                    <p className="text-[10px] text-slate-400 mt-0.5">Citizen, Staff, Admin & Public Board</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-blue-400 font-bold block uppercase">API Gateway</span>
                    <strong className="block text-white mt-1">Node.js Express</strong>
                    <p className="text-[10px] text-slate-400 mt-0.5">REST API on /api/*</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-purple-400 font-bold block uppercase">Core Logic</span>
                    <strong className="block text-white mt-1">Queue Engine</strong>
                    <p className="text-[10px] text-slate-400 mt-0.5">Break/Closed Locks & Atomic Tokens</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-emerald-400 font-bold block uppercase">Data Layer</span>
                    <strong className="block text-white mt-1">TiDB Cloud / MySQL</strong>
                    <p className="text-[10px] text-slate-400 mt-0.5">Relational Persistence & DDL</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="font-bold text-white">Key Constraints Enforced:</h5>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  <li><strong>Role Access Gate:</strong> Citizens cannot access staff desk; staff cannot access citizen dashboard without credentials.</li>
                  <li><strong>Break/Closed Locks:</strong> Officers cannot call tokens while desk is on break or closed. Wait estimations dynamically adjust by active desks.</li>
                  <li><strong>Single Serving Lock:</strong> A desk can only serve one citizen token at any moment.</li>
                  <li><strong>Auditing:</strong> Every call, completion, and break change is timestamped in the queue timeline.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'tidb' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-white">
                    TiDB Cloud Serverless SQL Schema
                  </h4>
                  <p className="text-slate-400 text-[11px]">
                    Fully MySQL 8.0 compatible schema designed for TiDB Cloud
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopySql}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-950 hover:bg-slate-800 text-slate-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-cyan-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy SQL'}</span>
                  </button>
                  <button
                    onClick={handleDownloadSql}
                    className="px-2.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download DDL</span>
                  </button>
                </div>
              </div>

              <pre className="p-3.5 rounded-xl bg-slate-950 text-cyan-300 font-mono text-[11px] overflow-x-auto max-h-72 leading-relaxed border border-slate-800">
                {sqlSchemaText}
              </pre>

              <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 space-y-1 text-slate-300">
                <span className="font-bold text-white block">Connecting to TiDB Cloud:</span>
                <p>1. Create a free TiDB Cloud Serverless cluster at tidbcloud.com.</p>
                <p>2. Obtain your host, port, username, password, and CA SSL certificate.</p>
                <p>3. Set in `.env`: `TIDB_HOST=...`, `TIDB_USER=...`, `TIDB_PASSWORD=...`</p>
                <p>4. Execute the DDL script above in the TiDB Cloud SQL Editor console.</p>
              </div>
            </div>
          )}

          {activeTab === 'picnie' && (
            <div className="space-y-4">
              <h4 className="font-bold text-sm text-white">
                Picnie API Integration Setup & Fallbacks
              </h4>
              <p className="text-slate-300 leading-relaxed">
                Picnie is used for official PDF queue-token passes and OCR document parsing. Credentials are kept server-side only in `.env`.
              </p>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                <span className="font-bold text-white block">Environment Configuration (`.env`):</span>
                <pre className="bg-slate-900 text-slate-200 p-2.5 rounded-lg font-mono text-[11px]">
{`# Add Picnie API credentials to server environment:
PICNIE_API_KEY="your_picnie_api_key_here"
PICNIE_ENDPOINT="https://api.picnie.com/v1"`}
                </pre>
              </div>

              <div className="bg-amber-950/60 border border-amber-800 rounded-xl p-3 text-amber-200 space-y-1">
                <strong className="font-bold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>Configured Fallback Behavior:</span>
                </strong>
                <p className="text-[11px] leading-relaxed">
                  When `PICNIE_API_KEY` is not present, SmartGov Queue smoothly falls back to high-fidelity browser print rendering (CSS `@media print`) and verified client-side OCR parsing with explicit disclaimers.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-950 border-t border-slate-800 px-6 py-3 flex items-center justify-end">
          <button
            onClick={() => setShowArchitectureModal(false)}
            className="px-4 py-1.5 rounded-xl bg-slate-800 text-white font-semibold text-xs hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
