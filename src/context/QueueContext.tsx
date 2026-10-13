import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  DigitalToken,
  GovernmentOffice,
  GovernmentService,
  InAppNotification,
  QueueEvent,
  QueueStatistics,
  ServiceCounter,
  SoundPreference,
} from '../types/queue';
import { QueueApi } from '../services/api';
import { useAuth } from './AuthContext';
import { playQueueChime } from '../utils/audioChime';

export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'urgent';
  title: string;
  message: string;
  timestamp: number;
}

interface QueueContextType {
  offices: GovernmentOffice[];
  services: GovernmentService[];
  counters: ServiceCounter[];
  tokens: DigitalToken[];
  events: QueueEvent[];
  notifications: InAppNotification[];
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id' | 'timestamp'>) => void;
  removeToast: (id: string) => void;
  stats: QueueStatistics | null;
  loading: boolean;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  soundPreference: SoundPreference;
  setSoundPreference: (pref: SoundPreference) => void;
  refreshData: () => Promise<void>;

  // Token operations
  generateToken: (params: {
    officeId: string;
    serviceId: string;
    priority?: 'STANDARD' | 'SENIOR_CITIZEN' | 'SPECIALLY_ABLED';
    notes?: string;
    ocrProcessed?: boolean;
  }) => Promise<DigitalToken>;
  callNext: (counterId: string) => Promise<{ token: DigitalToken; message: string }>;
  callSpecific: (tokenId: string, counterId: string) => Promise<DigitalToken>;
  confirmCitizenArrival: (tokenId: string, counterId: string) => Promise<DigitalToken>;
  completeService: (tokenId: string, counterId: string, notes?: string) => Promise<DigitalToken>;
  skipToken: (tokenId: string, counterId: string, reason: string) => Promise<DigitalToken>;
  updateCounterStatus: (counterId: string, status: 'active' | 'break' | 'closed') => Promise<void>;
  markNotificationRead: (notifId: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  resetToDemoState: () => void;

  // Active Modals & Overlays
  activeReceiptToken: DigitalToken | null;
  setActiveReceiptToken: (token: DigitalToken | null) => void;
  showOcrModal: boolean;
  setShowOcrModal: (show: boolean) => void;
  showArchitectureModal: boolean;
  setShowArchitectureModal: (show: boolean) => void;
  showTestSuiteModal: boolean;
  setShowTestSuiteModal: (show: boolean) => void;
  showNewTokenModal: boolean;
  setShowNewTokenModal: (show: boolean) => void;
}

const QueueContext = createContext<QueueContextType | undefined>(undefined);

export const QueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [offices, setOffices] = useState<GovernmentOffice[]>([]);
  const [services, setServices] = useState<GovernmentService[]>([]);
  const [counters, setCounters] = useState<ServiceCounter[]>([]);
  const [tokens, setTokens] = useState<DigitalToken[]>([]);
  const [events, setEvents] = useState<QueueEvent[]>([]);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [stats, setStats] = useState<QueueStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  // Sound preference: 'turn-only' | 'all' | 'muted'
  const [soundPreference, setSoundPreferenceState] = useState<SoundPreference>(() => {
    const saved = localStorage.getItem('smartgov_sound_pref');
    if (saved === 'turn-only' || saved === 'all' || saved === 'muted') return saved;
    return 'turn-only';
  });

  const setSoundPreference = (pref: SoundPreference) => {
    setSoundPreferenceState(pref);
    localStorage.setItem('smartgov_sound_pref', pref);
  };

  const soundEnabled = soundPreference !== 'muted';
  const setSoundEnabled = (enabled: boolean) => {
    setSoundPreference(enabled ? 'turn-only' : 'muted');
  };

  // Modals
  const [activeReceiptToken, setActiveReceiptToken] = useState<DigitalToken | null>(null);
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [showArchitectureModal, setShowArchitectureModal] = useState(false);
  const [showTestSuiteModal, setShowTestSuiteModal] = useState(false);
  const [showNewTokenModal, setShowNewTokenModal] = useState(false);

  // Floating Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id' | 'timestamp'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setToasts((prev) => [
      { ...toast, id, timestamp: Date.now() },
      ...prev.slice(0, 4), // max 5
    ]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Track previous tokens for user to trigger audio chime and toasts when called/skipped
  const prevTokensRef = useRef<DigitalToken[]>([]);
  // Track 5-minute milestone notifications already sent for tokens: `${tokenId}-${milestoneMins}`
  const sent5MinMilestonesRef = useRef<Set<string>>(new Set());

  const refreshData = useCallback(async () => {
    try {
      const [allOffices, allServices, allCounters, allTokens, allEvents, allStats] = await Promise.all([
        QueueApi.getOffices(),
        QueueApi.getServices(),
        QueueApi.getCounters(),
        QueueApi.getTokens(),
        QueueApi.getEvents(),
        QueueApi.getStatistics(),
      ]);

      setOffices(allOffices);
      setServices(allServices);
      setCounters(allCounters);
      setTokens(allTokens);
      setEvents(allEvents);
      setStats(allStats);

      if (currentUser?.id) {
        const userNotifs = await QueueApi.getNotifications(currentUser.id);
        setNotifications(userNotifs);

        // Check if any token for the current user just changed to SERVING or SKIPPED
        if (prevTokensRef.current.length > 0) {
          const userServingToken = allTokens.find(
            (t) => t.citizenId === currentUser.id && t.status === 'SERVING'
          );
          const wasAlreadyServing = prevTokensRef.current.some(
            (pt) => pt.id === userServingToken?.id && pt.status === 'SERVING'
          );

          if (userServingToken && !wasAlreadyServing) {
            if (soundPreference !== 'muted') {
              playQueueChime('called');
            }
            addToast({
              type: 'urgent',
              title: `Token ${userServingToken.tokenNumber} Called!`,
              message: `Please report to Counter ${userServingToken.counterNumber || 1} immediately. 2-minute arrival timer is running.`,
            });
          }

          // Check if any token just changed to SKIPPED
          const userSkippedToken = allTokens.find(
            (t) => t.citizenId === currentUser.id && t.status === 'SKIPPED'
          );
          const wasAlreadySkipped = prevTokensRef.current.some(
            (pt) => pt.id === userSkippedToken?.id && pt.status === 'SKIPPED'
          );
          if (userSkippedToken && !wasAlreadySkipped) {
            addToast({
              type: 'warning',
              title: `Token ${userSkippedToken.tokenNumber} Skipped`,
              message: userSkippedToken.skipReason || 'Token skipped due to reporting window expiration. Recorded in history.',
            });
          }
        }
      }

      prevTokensRef.current = allTokens;
    } catch (err) {
      console.error('Error refreshing queue state:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, soundPreference, addToast]);

  // Initial load and periodic polling
  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 3000);

    const handleStorageUpdate = () => {
      refreshData();
    };

    window.addEventListener('smartgov_storage_update', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('smartgov_storage_update', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, [refreshData]);

  // Real-time 1-second background engine for:
  // 1. 2-minute auto-skip check for called tokens without staff arrival confirmation
  // 2. 5-minute periodic status heartbeat notifications for waiting citizens
  useEffect(() => {
    const bgTimer = setInterval(async () => {
      try {
        // 1. Check auto-skip for tokens exceeding 120s without arrival confirmation
        const skipped = await QueueApi.checkAndAutoSkipUnreportedTokens();
        if (skipped.length > 0) {
          refreshData();
        }

        // 2. Check 5-minute periodic progress heartbeat for logged in citizen
        if (currentUser?.id) {
          const userWaitingTokens = tokens.filter(
            (t) => t.citizenId === currentUser.id && t.status === 'WAITING'
          );

          for (const token of userWaitingTokens) {
            const createdMs = new Date(token.createdAt).getTime();
            const elapsedSecs = Math.floor((Date.now() - createdMs) / 1000);

            // 5 minutes = 300 seconds; milestone 1 = 5m (300s), milestone 2 = 10m (600s), etc.
            const milestoneMins = Math.floor(elapsedSecs / 300) * 5;
            if (milestoneMins >= 5) {
              const milestoneKey = `${token.id}-${milestoneMins}`;
              if (!sent5MinMilestonesRef.current.has(milestoneKey)) {
                sent5MinMilestonesRef.current.add(milestoneKey);

                // Calculate current position ahead
                const ahead = tokens.filter(
                  (t) =>
                    t.serviceId === token.serviceId &&
                    t.status === 'WAITING' &&
                    new Date(t.createdAt).getTime() < createdMs
                ).length;

                const estRemaining = Math.max(1, token.estimatedWaitMinutes - milestoneMins);

                await QueueApi.createNotification({
                  userId: currentUser.id,
                  tokenId: token.id,
                  tokenNumber: token.tokenNumber,
                  title: `5-Min Queue Progress Update (${milestoneMins}m in line)`,
                  message: `Token ${token.tokenNumber}: You are currently #${ahead + 1} in line for ${token.serviceName}. Estimated remaining wait: ~${estRemaining} min(s). Keep your documents ready.`,
                  type: 'info',
                });

                addToast({
                  type: 'info',
                  title: `5-Min Queue Pulse: Token ${token.tokenNumber}`,
                  message: `Position #${ahead + 1} in line for ${token.serviceName}. Estimated remaining wait: ~${estRemaining} min(s).`,
                });

                if (soundPreference === 'all') {
                  playQueueChime('heartbeat');
                }

                refreshData();
              }
            }
          }
        }
      } catch (err) {
        // Ignore background timer errors to prevent disruptions
      }
    }, 1500);

    return () => clearInterval(bgTimer);
  }, [currentUser?.id, tokens, refreshData, soundPreference]);

  const generateToken = async (params: {
    officeId: string;
    serviceId: string;
    priority?: 'STANDARD' | 'SENIOR_CITIZEN' | 'SPECIALLY_ABLED';
    notes?: string;
    ocrProcessed?: boolean;
  }): Promise<DigitalToken> => {
    if (!currentUser) throw new Error('Citizen must be logged in to generate a token.');
    const token = await QueueApi.generateToken({
      ...params,
      citizenId: currentUser.id,
      citizenName: currentUser.name,
      citizenPhone: currentUser.phone || '+91 98765 00000',
      citizenNationalId: currentUser.nationalId || 'CID-DEMO-001',
    });
    if (soundPreference !== 'muted') {
      playQueueChime('generated');
    }
    await refreshData();
    return token;
  };

  const callNext = async (counterId: string) => {
    if (!currentUser) throw new Error('Staff credentials required.');
    const result = await QueueApi.callNextToken({
      counterId,
      staffId: currentUser.staffId || currentUser.id,
      staffName: currentUser.name,
    });
    if (soundPreference !== 'muted') {
      playQueueChime('called');
    }
    await refreshData();
    return result;
  };

  const callSpecific = async (tokenId: string, counterId: string) => {
    if (!currentUser) throw new Error('Staff credentials required.');
    const result = await QueueApi.callSpecificToken({
      tokenId,
      counterId,
      staffId: currentUser.staffId || currentUser.id,
      staffName: currentUser.name,
    });
    if (soundPreference !== 'muted') {
      playQueueChime('called');
    }
    await refreshData();
    return result;
  };

  const confirmCitizenArrival = async (tokenId: string, counterId: string) => {
    if (!currentUser) throw new Error('Staff credentials required.');
    const result = await QueueApi.confirmCitizenArrival({
      tokenId,
      counterId,
      staffName: currentUser.name,
    });
    await refreshData();
    return result;
  };

  const completeService = async (tokenId: string, counterId: string, notes?: string) => {
    if (!currentUser) throw new Error('Staff credentials required.');
    const result = await QueueApi.completeService({
      tokenId,
      counterId,
      staffName: currentUser.name,
      serviceNotes: notes,
    });
    if (soundPreference !== 'muted') {
      playQueueChime('completed');
    }
    await refreshData();
    return result;
  };

  const skipToken = async (tokenId: string, counterId: string, reason: string) => {
    if (!currentUser) throw new Error('Staff credentials required.');
    const result = await QueueApi.skipToken({
      tokenId,
      counterId,
      staffName: currentUser.name,
      reason,
    });
    await refreshData();
    return result;
  };

  const updateCounterStatus = async (counterId: string, status: 'active' | 'break' | 'closed') => {
    await QueueApi.updateCounterStatus(counterId, status);
    await refreshData();
  };

  const markNotificationRead = async (notifId: string) => {
    await QueueApi.markNotificationRead(notifId);
    if (currentUser?.id) {
      const updated = await QueueApi.getNotifications(currentUser.id);
      setNotifications(updated);
    }
  };

  const markAllNotificationsRead = async () => {
    if (!currentUser?.id) return;
    await QueueApi.markAllNotificationsRead(currentUser.id);
    const updated = await QueueApi.getNotifications(currentUser.id);
    setNotifications(updated);
  };

  const resetToDemoState = () => {
    QueueApi.resetDemoData();
    sent5MinMilestonesRef.current.clear();
    refreshData();
  };

  return (
    <QueueContext.Provider
      value={{
        offices,
        services,
        counters,
        tokens,
        events,
        notifications,
        toasts,
        addToast,
        removeToast,
        stats,
        loading,
        soundEnabled,
        setSoundEnabled,
        soundPreference,
        setSoundPreference,
        refreshData,
        generateToken,
        callNext,
        callSpecific,
        confirmCitizenArrival,
        completeService,
        skipToken,
        updateCounterStatus,
        markNotificationRead,
        markAllNotificationsRead,
        resetToDemoState,
        activeReceiptToken,
        setActiveReceiptToken,
        showOcrModal,
        setShowOcrModal,
        showArchitectureModal,
        setShowArchitectureModal,
        showTestSuiteModal,
        setShowTestSuiteModal,
        showNewTokenModal,
        setShowNewTokenModal,
      }}
    >
      {children}
    </QueueContext.Provider>
  );
};

export const useQueue = (): QueueContextType => {
  const context = useContext(QueueContext);
  if (!context) {
    throw new Error('useQueue must be used within a QueueProvider');
  }
  return context;
};
