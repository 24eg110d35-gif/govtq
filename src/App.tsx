/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { QueueProvider } from './context/QueueContext';
import { Navbar } from './components/Navbar';
import { AuthPortal } from './components/Auth/AuthPortal';
import { CitizenDashboard } from './components/CitizenPortal/CitizenDashboard';
import { StaffDashboard } from './components/StaffPortal/StaffDashboard';
import { AdminDashboard } from './components/AdminPortal/AdminDashboard';
import { LiveDisplayBoard } from './components/PublicBoard/LiveDisplayBoard';
import { ArchitectureModal } from './components/Common/ArchitectureModal';
import { TestSuiteModal } from './components/Common/TestSuiteModal';
import { ScannedTokenPassView } from './components/CitizenPortal/ScannedTokenPassView';
import { ToastContainer } from './components/Common/ToastContainer';
import { Landmark } from 'lucide-react';

function AppContent() {
  const { isAuthenticated, role } = useAuth();
  const [activeTab, setActiveTab] = useState<'citizen' | 'staff' | 'admin' | 'live-board'>('citizen');
  const [showAuthGate, setShowAuthGate] = useState(!isAuthenticated);

  // Check if opened via QR scan from another device (?receipt=CERT-103 or ?token=CERT-103)
  const [scannedTokenNumber, setScannedTokenNumber] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const queryToken = params.get('receipt') || params.get('token');
      if (queryToken) return queryToken;

      // Also check hash fragments (#receipt=CERT-103)
      if (window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        return hashParams.get('receipt') || hashParams.get('token');
      }
    }
    return null;
  });
  const [scannedTokenId, setScannedTokenId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const queryId = params.get('id');
      if (queryId) return queryId;

      if (window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        return hashParams.get('id');
      }
    }
    return null;
  });

  // Synchronize view with authentication state
  useEffect(() => {
    if (!isAuthenticated) {
      if (activeTab !== 'live-board') {
        setShowAuthGate(true);
      }
    } else {
      setShowAuthGate(false);
      if (role === 'citizen') setActiveTab('citizen');
      else if (role === 'staff') setActiveTab('staff');
      else if (role === 'admin') setActiveTab('admin');
    }
  }, [isAuthenticated, role]);

  const handleOpenAuth = () => {
    setShowAuthGate(true);
  };

  const handleOpenPublicBoard = () => {
    setShowAuthGate(false);
    setActiveTab('live-board');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Bar Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setShowAuthGate(false);
          setActiveTab(tab);
        }}
        onOpenAuth={handleOpenAuth}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {scannedTokenNumber ? (
          <ScannedTokenPassView
            tokenNumber={scannedTokenNumber}
            tokenId={scannedTokenId || undefined}
            onExitScanView={() => {
              setScannedTokenNumber(null);
              setScannedTokenId(null);
              if (typeof window !== 'undefined') {
                window.history.replaceState({}, '', window.location.pathname);
              }
            }}
          />
        ) : showAuthGate ? (
          <AuthPortal onOpenPublicBoard={handleOpenPublicBoard} />
        ) : (
          <>
            {activeTab === 'live-board' && <LiveDisplayBoard />}
            {activeTab === 'citizen' && (isAuthenticated && role === 'citizen' ? <CitizenDashboard /> : <AuthPortal onOpenPublicBoard={handleOpenPublicBoard} />)}
            {activeTab === 'staff' && (isAuthenticated && role === 'staff' ? <StaffDashboard /> : <AuthPortal onOpenPublicBoard={handleOpenPublicBoard} />)}
            {activeTab === 'admin' && (isAuthenticated && role === 'admin' ? <AdminDashboard /> : <AuthPortal onOpenPublicBoard={handleOpenPublicBoard} />)}
          </>
        )}
      </main>

      {/* Global Modals & Floating Toasts */}
      <ToastContainer />
      <ArchitectureModal />
      <TestSuiteModal />

      {/* High-Contrast Civic Footer */}
      <footer className="no-print border-t border-slate-800/80 bg-slate-950 text-slate-500 text-xs mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center">
              <Landmark className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold text-slate-300 block leading-tight">
                SmartGov Queue — Public Civic Administration Queue System
              </span>
              <span className="text-[11px] text-slate-500 block">
                Role-Gated Architecture · Citizen Tokens · Desk Counter Telemetry
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 font-mono">
            <span>High-Contrast Slate & Cyan</span>
            <span>·</span>
            <span>Real-Time Desk States</span>
            <span>·</span>
            <span>TiDB Cloud Compatible</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <QueueProvider>
        <AppContent />
      </QueueProvider>
    </AuthProvider>
  );
}
