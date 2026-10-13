import { DigitalToken, GovernmentOffice, GovernmentService, InAppNotification, QueueEvent, QueueStatistics, ServiceCounter, User, CounterStatus } from '../types/queue';
import { DEMO_COUNTERS, DEMO_OFFICES, DEMO_SERVICES, DEMO_TOKENS, DEMO_USERS } from '../data/initialData';

const STORAGE_KEYS = {
  USERS: 'smartgov_users_v2',
  OFFICES: 'smartgov_offices_v2',
  SERVICES: 'smartgov_services_v2',
  COUNTERS: 'smartgov_counters_v2',
  TOKENS: 'smartgov_tokens_v2',
  EVENTS: 'smartgov_events_v2',
  NOTIFICATIONS: 'smartgov_notifications_v2',
  CURRENT_USER: 'smartgov_current_user_v2',
};

function getStorage<T>(key: string, fallback: T): T {
  try {
    const val = localStorage.getItem(key);
    if (!val) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(val) as T;
  } catch {
    return fallback;
  }
}

function setStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new Event('smartgov_storage_update'));
  } catch (e) {
    console.error('Storage write error', e);
  }
}

export function initLocalStorageIfEmpty() {
  getStorage(STORAGE_KEYS.USERS, DEMO_USERS);
  getStorage(STORAGE_KEYS.OFFICES, DEMO_OFFICES);
  getStorage(STORAGE_KEYS.SERVICES, DEMO_SERVICES);
  getStorage(STORAGE_KEYS.COUNTERS, DEMO_COUNTERS);
  getStorage(STORAGE_KEYS.TOKENS, DEMO_TOKENS);
  getStorage<QueueEvent[]>(STORAGE_KEYS.EVENTS, [
    {
      id: 'evt-1',
      tokenId: 'tok-101',
      tokenNumber: 'CERT-101',
      officeId: 'off-1',
      eventType: 'COMPLETED',
      counterNumber: 1,
      performedBy: 'Rajesh Kumar (Officer)',
      timestamp: '2026-10-12T09:32:00.000Z',
      details: 'Service delivered: Birth certificate duplicate issued.',
    },
    {
      id: 'evt-2',
      tokenId: 'tok-102',
      tokenNumber: 'CERT-102',
      officeId: 'off-1',
      eventType: 'SERVING_STARTED',
      counterNumber: 1,
      performedBy: 'Rajesh Kumar (Officer)',
      timestamp: '2026-10-12T09:34:00.000Z',
      details: 'Citizen admitted and currently being served at Counter 1.',
    },
  ]);
  getStorage<InAppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, [
    {
      id: 'notif-1',
      userId: 'usr-citizen-1',
      tokenId: 'tok-104',
      tokenNumber: 'CERT-103',
      title: 'Token Queued in System',
      message: 'Your token CERT-103 for Birth Certificate is active. 1 citizen ahead.',
      type: 'info',
      createdAt: '2026-10-12T09:36:00.000Z',
      read: false,
    },
  ]);
}

if (typeof window !== 'undefined') {
  initLocalStorageIfEmpty();
}

const syncTokenToServer = (token: DigitalToken) => {
  if (typeof window === 'undefined') return;
  fetch('/api/tokens/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(token),
  }).catch(() => {});
};

export const QueueApi = {
  // Offices
  async getOffices(): Promise<GovernmentOffice[]> {
    return getStorage<GovernmentOffice[]>(STORAGE_KEYS.OFFICES, DEMO_OFFICES);
  },

  // Services
  async getServices(officeId?: string): Promise<GovernmentService[]> {
    const all = getStorage<GovernmentService[]>(STORAGE_KEYS.SERVICES, DEMO_SERVICES);
    if (officeId) {
      return all.filter((s) => s.officeId === officeId);
    }
    return all;
  },

  // Counters
  async getCounters(officeId?: string): Promise<ServiceCounter[]> {
    const all = getStorage<ServiceCounter[]>(STORAGE_KEYS.COUNTERS, DEMO_COUNTERS);
    if (officeId) {
      return all.filter((c) => c.officeId === officeId);
    }
    return all;
  },

  // Practical Counter Status Update (Active, Break, Closed)
  async updateCounterStatus(
    counterId: string,
    status: CounterStatus,
    reason?: string,
    staffName?: string
  ): Promise<ServiceCounter> {
    const counters = await this.getCounters();
    const tokens = await this.getTokens();

    const targetCounter = counters.find((c) => c.id === counterId);
    if (!targetCounter) throw new Error('Counter not found.');

    // Logic safety: If staff is trying to take a break or close while serving a token, warn or require clearing
    const isServing = tokens.find((t) => t.counterId === counterId && t.status === 'SERVING');
    if ((status === 'break' || status === 'closed') && isServing) {
      throw new Error(`Cannot set Counter ${targetCounter.counterNumber} to ${status.toUpperCase()} while actively serving token ${isServing.tokenNumber}. Please complete the citizen service first.`);
    }

    const updated = counters.map((c) => {
      if (c.id === counterId) {
        return {
          ...c,
          status,
          breakReason: status === 'break' ? reason || 'Routine Staff Break (10m)' : undefined,
          breakStartTime: status === 'break' ? new Date().toISOString() : undefined,
        };
      }
      return c;
    });

    setStorage(STORAGE_KEYS.COUNTERS, updated);

    await this.recordEvent({
      tokenId: targetCounter.currentTokenId || 'system',
      tokenNumber: `COUNTER-${targetCounter.counterNumber}`,
      officeId: targetCounter.officeId,
      eventType: 'COUNTER_STATUS_CHANGE',
      counterNumber: targetCounter.counterNumber,
      performedBy: staffName || targetCounter.staffName || 'Officer',
      details: `Counter ${targetCounter.counterNumber} status changed to ${status.toUpperCase()}${reason ? ` (${reason})` : ''}`,
    });

    return updated.find((c) => c.id === counterId)!;
  },

  // Tokens
  async getTokens(filters?: { officeId?: string; status?: string; citizenId?: string }): Promise<DigitalToken[]> {
    let localTokens = getStorage<DigitalToken[]>(STORAGE_KEYS.TOKENS, DEMO_TOKENS);
    try {
      const res = await fetch('/api/tokens');
      if (res.ok) {
        const serverTokens: DigitalToken[] = await res.json();
        const map = new Map<string, DigitalToken>();
        for (const t of serverTokens) {
          map.set(t.id, t);
        }
        for (const localT of localTokens) {
          if (!map.has(localT.id)) {
            map.set(localT.id, localT);
            syncTokenToServer(localT);
          } else {
            const serverT = map.get(localT.id)!;
            if (serverT.status === 'WAITING' && localT.status !== 'WAITING') {
              map.set(localT.id, localT);
              syncTokenToServer(localT);
            }
          }
        }
        localTokens = Array.from(map.values());
        setStorage(STORAGE_KEYS.TOKENS, localTokens);
      }
    } catch {
      // offline / local mode
    }

    let tokens = localTokens;
    if (filters?.officeId) {
      tokens = tokens.filter((t) => t.officeId === filters.officeId);
    }
    if (filters?.status) {
      tokens = tokens.filter((t) => t.status === filters.status);
    }
    if (filters?.citizenId) {
      tokens = tokens.filter((t) => t.citizenId === filters.citizenId);
    }
    return tokens;
  },

  // Realistic dynamic waiting calculation based on active open desks
  async calculateEstimatedWait(serviceId: string): Promise<{ waitMinutes: number; activeDesks: number; peopleAhead: number }> {
    const services = await this.getServices();
    const counters = await this.getCounters();
    const tokens = await this.getTokens();

    const service = services.find((s) => s.id === serviceId);
    if (!service) return { waitMinutes: 10, activeDesks: 1, peopleAhead: 0 };

    const waiting = tokens.filter((t) => t.serviceId === serviceId && t.status === 'WAITING').length;
    // Count ONLY counters that handle this service AND are 'active'
    const activeDesks = counters.filter((c) => c.serviceIds.includes(serviceId) && c.status === 'active').length;

    const effectiveDesks = Math.max(1, activeDesks);
    const calculatedMinutes = Math.max(3, Math.round(((waiting + 1) / effectiveDesks) * service.avgDurationMinutes));

    return {
      waitMinutes: calculatedMinutes,
      activeDesks,
      peopleAhead: waiting,
    };
  },

  // Generate new token
  async generateToken(params: {
    officeId: string;
    serviceId: string;
    citizenId: string;
    citizenName: string;
    citizenPhone: string;
    citizenNationalId: string;
    priority?: 'STANDARD' | 'SENIOR_CITIZEN' | 'SPECIALLY_ABLED';
    notes?: string;
    ocrProcessed?: boolean;
  }): Promise<DigitalToken> {
    const offices = await this.getOffices();
    const services = await this.getServices();
    const tokens = await this.getTokens();

    const office = offices.find((o) => o.id === params.officeId);
    const service = services.find((s) => s.id === params.serviceId);

    if (!office || !service) {
      throw new Error('Invalid Government Office or Service selection.');
    }

    const servicePrefix = service.code.split('-')[0].substring(0, 4).toUpperCase();
    const existingForPrefix = tokens.filter((t) => t.serviceId === service.id);
    const sequenceNumber = 100 + existingForPrefix.length + 1;
    const tokenNumber = `${servicePrefix}-${sequenceNumber}`;

    const { waitMinutes, peopleAhead } = await this.calculateEstimatedWait(service.id);

    const newToken: DigitalToken = {
      id: `tok-${Date.now()}`,
      tokenNumber,
      officeId: office.id,
      officeName: office.name,
      serviceId: service.id,
      serviceName: service.name,
      serviceCode: service.code,
      citizenId: params.citizenId,
      citizenName: params.citizenName,
      citizenPhone: params.citizenPhone,
      citizenNationalId: params.citizenNationalId,
      status: 'WAITING',
      priority: params.priority || 'STANDARD',
      createdAt: new Date().toISOString(),
      estimatedWaitMinutes: waitMinutes,
      notes: params.notes,
      ocrProcessed: params.ocrProcessed || false,
      qrPayload: `SMARTGOV:${tokenNumber}:${office.code}:${service.code}:${Date.now()}`,
    };

    const updatedTokens = [...tokens, newToken];
    setStorage(STORAGE_KEYS.TOKENS, updatedTokens);
    syncTokenToServer(newToken);

    await this.recordEvent({
      tokenId: newToken.id,
      tokenNumber: newToken.tokenNumber,
      officeId: office.id,
      eventType: 'GENERATED',
      performedBy: params.citizenName,
      details: `Citizen generated digital token for ${service.name}. Priority: ${newToken.priority}`,
    });

    await this.createNotification({
      userId: params.citizenId,
      tokenId: newToken.id,
      tokenNumber: newToken.tokenNumber,
      title: 'Digital Token Issued',
      message: `Your token ${newToken.tokenNumber} is confirmed. ${peopleAhead} citizen(s) ahead. Estimated wait: ~${waitMinutes} mins.`,
      type: 'info',
    });

    return newToken;
  },

  // Staff Call Next with Break/Closed Lock
  async callNextToken(params: {
    counterId: string;
    staffId: string;
    staffName: string;
  }): Promise<{ token: DigitalToken; message: string }> {
    const counters = await this.getCounters();
    const tokens = await this.getTokens();

    const counter = counters.find((c) => c.id === params.counterId);
    if (!counter) throw new Error('Assigned counter not found.');

    // Practical check: Staff CANNOT call if counter is on break or closed
    if (counter.status === 'break') {
      throw new Error(`Counter ${counter.counterNumber} is currently ON BREAK (${counter.breakReason || 'Break'}). Please set status to ACTIVE before calling next.`);
    }
    if (counter.status === 'closed') {
      throw new Error(`Counter ${counter.counterNumber} is currently CLOSED. Please set status to ACTIVE to begin serving.`);
    }

    const activeServingToken = tokens.find((t) => t.counterId === counter.id && t.status === 'SERVING');
    if (activeServingToken) {
      throw new Error(`Counter ${counter.counterNumber} is currently serving token ${activeServingToken.tokenNumber}. Complete or skip it before calling the next token.`);
    }

    const eligibleWaiting = tokens
      .filter((t) => t.officeId === counter.officeId && counter.serviceIds.includes(t.serviceId) && t.status === 'WAITING')
      .sort((a, b) => {
        const priorityWeight = { SPECIALLY_ABLED: 3, SENIOR_CITIZEN: 2, STANDARD: 1 };
        const weightDiff = (priorityWeight[b.priority] || 1) - (priorityWeight[a.priority] || 1);
        if (weightDiff !== 0) return weightDiff;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

    if (eligibleWaiting.length === 0) {
      throw new Error(`No waiting tokens in queue for services assigned to Counter ${counter.counterNumber}.`);
    }

    const nextToken = eligibleWaiting[0];
    const now = new Date().toISOString();

    const updatedTokens = tokens.map((t) => {
      if (t.id === nextToken.id) {
        return {
          ...t,
          status: 'SERVING' as const,
          counterId: counter.id,
          counterNumber: counter.counterNumber,
          staffId: params.staffId,
          staffName: params.staffName,
          calledAt: now,
          servedAt: now,
          estimatedWaitMinutes: 0,
        };
      }
      return t;
    });

    const updatedCounters = counters.map((c) => (c.id === counter.id ? { ...c, currentTokenId: nextToken.id, staffId: params.staffId, staffName: params.staffName } : c));

    setStorage(STORAGE_KEYS.TOKENS, updatedTokens);
    setStorage(STORAGE_KEYS.COUNTERS, updatedCounters);
    const calledToken = updatedTokens.find((t) => t.id === nextToken.id);
    if (calledToken) syncTokenToServer(calledToken);

    await this.recordEvent({
      tokenId: nextToken.id,
      tokenNumber: nextToken.tokenNumber,
      officeId: counter.officeId,
      eventType: 'CALLED',
      counterNumber: counter.counterNumber,
      performedBy: params.staffName,
      details: `Staff ${params.staffName} called token ${nextToken.tokenNumber} to Counter ${counter.counterNumber}`,
    });

    await this.createNotification({
      userId: nextToken.citizenId,
      tokenId: nextToken.id,
      tokenNumber: nextToken.tokenNumber,
      title: 'It is Your Turn! Proceed to Counter',
      message: `Your token ${nextToken.tokenNumber} is now being served at Counter ${counter.counterNumber} by ${params.staffName}. Please proceed immediately.`,
      type: 'alert',
    });

    return {
      token: updatedTokens.find((t) => t.id === nextToken.id)!,
      message: `Token ${nextToken.tokenNumber} called to Counter ${counter.counterNumber}.`,
    };
  },

  async callSpecificToken(params: {
    tokenId: string;
    counterId: string;
    staffId: string;
    staffName: string;
  }): Promise<DigitalToken> {
    const counters = await this.getCounters();
    const tokens = await this.getTokens();

    const counter = counters.find((c) => c.id === params.counterId);
    if (!counter) throw new Error('Assigned counter not found.');

    if (counter.status === 'break') {
      throw new Error(`Counter ${counter.counterNumber} is on break. Set status to ACTIVE before calling.`);
    }
    if (counter.status === 'closed') {
      throw new Error(`Counter ${counter.counterNumber} is closed. Set status to ACTIVE to begin serving.`);
    }

    const targetToken = tokens.find((t) => t.id === params.tokenId);
    if (!targetToken) throw new Error('Selected token not found.');
    if (targetToken.status !== 'WAITING') {
      throw new Error(`Token ${targetToken.tokenNumber} cannot be called because it is already ${targetToken.status}.`);
    }

    const activeServingToken = tokens.find((t) => t.counterId === counter.id && t.status === 'SERVING');
    if (activeServingToken) {
      throw new Error(`Counter ${counter.counterNumber} is currently serving token ${activeServingToken.tokenNumber}. Complete or skip it first.`);
    }

    const now = new Date().toISOString();
    const updatedTokens = tokens.map((t) => {
      if (t.id === targetToken.id) {
        return {
          ...t,
          status: 'SERVING' as const,
          counterId: counter.id,
          counterNumber: counter.counterNumber,
          staffId: params.staffId,
          staffName: params.staffName,
          calledAt: now,
          servedAt: now,
          estimatedWaitMinutes: 0,
        };
      }
      return t;
    });

    const updatedCounters = counters.map((c) => (c.id === counter.id ? { ...c, currentTokenId: targetToken.id } : c));

    setStorage(STORAGE_KEYS.TOKENS, updatedTokens);
    setStorage(STORAGE_KEYS.COUNTERS, updatedCounters);
    const calledToken = updatedTokens.find((t) => t.id === targetToken.id);
    if (calledToken) syncTokenToServer(calledToken);

    await this.recordEvent({
      tokenId: targetToken.id,
      tokenNumber: targetToken.tokenNumber,
      officeId: counter.officeId,
      eventType: 'CALLED',
      counterNumber: counter.counterNumber,
      performedBy: params.staffName,
      details: `Staff specifically called token ${targetToken.tokenNumber} to Counter ${counter.counterNumber}`,
    });

    await this.createNotification({
      userId: targetToken.citizenId,
      tokenId: targetToken.id,
      tokenNumber: targetToken.tokenNumber,
      title: 'Your Token Called to Counter',
      message: `Your token ${targetToken.tokenNumber} has been called directly to Counter ${counter.counterNumber}. Please proceed now.`,
      type: 'alert',
    });

    return updatedTokens.find((t) => t.id === targetToken.id)!;
  },

  async confirmCitizenArrival(params: {
    tokenId: string;
    counterId: string;
    staffName: string;
  }): Promise<DigitalToken> {
    const tokens = await this.getTokens();
    const targetToken = tokens.find((t) => t.id === params.tokenId);
    if (!targetToken) throw new Error('Token not found.');

    const now = new Date().toISOString();
    const updatedTokens = tokens.map((t) => {
      if (t.id === params.tokenId) {
        return {
          ...t,
          arrivalConfirmedAt: now,
        };
      }
      return t;
    });

    setStorage(STORAGE_KEYS.TOKENS, updatedTokens);
    const confirmedToken = updatedTokens.find((t) => t.id === params.tokenId);
    if (confirmedToken) syncTokenToServer(confirmedToken);

    await this.recordEvent({
      tokenId: targetToken.id,
      tokenNumber: targetToken.tokenNumber,
      officeId: targetToken.officeId,
      eventType: 'ARRIVAL_CONFIRMED',
      counterNumber: targetToken.counterNumber,
      performedBy: params.staffName,
      details: `Staff confirmed citizen arrival at Counter ${targetToken.counterNumber || 1}. 2-minute reporting grace window closed. Service commenced.`,
    });

    await this.createNotification({
      userId: targetToken.citizenId,
      tokenId: targetToken.id,
      tokenNumber: targetToken.tokenNumber,
      title: 'Arrival Confirmed at Desk',
      message: `Officer ${params.staffName} confirmed your arrival at Counter ${targetToken.counterNumber || 1}. Service session started.`,
      type: 'success',
    });

    return updatedTokens.find((t) => t.id === params.tokenId)!;
  },

  async checkAndAutoSkipUnreportedTokens(): Promise<DigitalToken[]> {
    const tokens = await this.getTokens();
    const counters = await this.getCounters();
    const now = Date.now();
    const skippedTokens: DigitalToken[] = [];

    let updatedTokens = [...tokens];
    let updatedCounters = [...counters];

    for (const token of tokens) {
      if (token.status === 'SERVING' && !token.arrivalConfirmedAt && token.calledAt) {
        const elapsed = now - new Date(token.calledAt).getTime();
        // 2 minutes = 120,000 ms
        if (elapsed >= 120000) {
          const timestamp = new Date().toISOString();
          updatedTokens = updatedTokens.map((t) =>
            t.id === token.id
              ? {
                  ...t,
                  status: 'SKIPPED' as const,
                  skippedAt: timestamp,
                  skipReason: 'Auto-skipped: Citizen did not report to counter within 2-minute window',
                }
              : t
          );

          if (token.counterId) {
            updatedCounters = updatedCounters.map((c) =>
              c.id === token.counterId && c.currentTokenId === token.id
                ? { ...c, currentTokenId: undefined }
                : c
            );
          }

          skippedTokens.push(token);

          await this.recordEvent({
            tokenId: token.id,
            tokenNumber: token.tokenNumber,
            officeId: token.officeId,
            eventType: 'SKIPPED',
            counterNumber: token.counterNumber,
            performedBy: 'System Auto-Skip Engine',
            details: `Token ${token.tokenNumber} automatically skipped after exceeding 2-minute reporting grace window without staff arrival confirmation.`,
          });

          await this.createNotification({
            userId: token.citizenId,
            tokenId: token.id,
            tokenNumber: token.tokenNumber,
            title: 'Token Auto-Skipped',
            message: `Your token ${token.tokenNumber} was marked as skipped because you did not report to Counter ${token.counterNumber || 1} within the 2-minute window.`,
            type: 'warning',
          });
        }
      }
    }

    if (skippedTokens.length > 0) {
      setStorage(STORAGE_KEYS.TOKENS, updatedTokens);
      setStorage(STORAGE_KEYS.COUNTERS, updatedCounters);
      for (const skipped of skippedTokens) {
        const found = updatedTokens.find((t) => t.id === skipped.id);
        if (found) syncTokenToServer(found);
      }
    }

    return skippedTokens;
  },

  // Complete Service
  async completeService(params: {
    tokenId: string;
    counterId: string;
    staffName: string;
    serviceNotes?: string;
  }): Promise<DigitalToken> {
    const counters = await this.getCounters();
    const tokens = await this.getTokens();

    const targetToken = tokens.find((t) => t.id === params.tokenId);
    if (!targetToken) throw new Error('Token not found.');
    if (targetToken.status !== 'SERVING') {
      throw new Error(`Cannot complete token ${targetToken.tokenNumber} because it is not actively being served.`);
    }

    const now = new Date().toISOString();
    const updatedTokens = tokens.map((t) => {
      if (t.id === targetToken.id) {
        return {
          ...t,
          status: 'COMPLETED' as const,
          completedAt: now,
          notes: params.serviceNotes || t.notes || 'Service delivered successfully.',
        };
      }
      return t;
    });

    const updatedCounters = counters.map((c) => (c.id === params.counterId ? { ...c, currentTokenId: undefined } : c));

    setStorage(STORAGE_KEYS.TOKENS, updatedTokens);
    setStorage(STORAGE_KEYS.COUNTERS, updatedCounters);
    const completedToken = updatedTokens.find((t) => t.id === targetToken.id);
    if (completedToken) syncTokenToServer(completedToken);

    await this.recordEvent({
      tokenId: targetToken.id,
      tokenNumber: targetToken.tokenNumber,
      officeId: targetToken.officeId,
      eventType: 'COMPLETED',
      counterNumber: targetToken.counterNumber,
      performedBy: params.staffName,
      details: `Service completed for token ${targetToken.tokenNumber}. ${params.serviceNotes || ''}`,
    });

    await this.createNotification({
      userId: targetToken.citizenId,
      tokenId: targetToken.id,
      tokenNumber: targetToken.tokenNumber,
      title: 'Government Service Completed',
      message: `Your service request under token ${targetToken.tokenNumber} has been successfully completed.`,
      type: 'success',
    });

    return updatedTokens.find((t) => t.id === targetToken.id)!;
  },

  // Skip Token
  async skipToken(params: {
    tokenId: string;
    counterId: string;
    staffName: string;
    reason: string;
  }): Promise<DigitalToken> {
    const counters = await this.getCounters();
    const tokens = await this.getTokens();

    const targetToken = tokens.find((t) => t.id === params.tokenId);
    if (!targetToken) throw new Error('Token not found.');

    const now = new Date().toISOString();
    const updatedTokens = tokens.map((t) => {
      if (t.id === targetToken.id) {
        return {
          ...t,
          status: 'SKIPPED' as const,
          skippedAt: now,
          skipReason: params.reason || 'Citizen absent at counter when called.',
        };
      }
      return t;
    });

    const updatedCounters = counters.map((c) => (c.id === params.counterId ? { ...c, currentTokenId: undefined } : c));

    setStorage(STORAGE_KEYS.TOKENS, updatedTokens);
    setStorage(STORAGE_KEYS.COUNTERS, updatedCounters);
    const skippedToken = updatedTokens.find((t) => t.id === targetToken.id);
    if (skippedToken) syncTokenToServer(skippedToken);

    await this.recordEvent({
      tokenId: targetToken.id,
      tokenNumber: targetToken.tokenNumber,
      officeId: targetToken.officeId,
      eventType: 'SKIPPED',
      counterNumber: targetToken.counterNumber,
      performedBy: params.staffName,
      details: `Token ${targetToken.tokenNumber} marked as SKIPPED. Reason: ${params.reason}`,
    });

    await this.createNotification({
      userId: targetToken.citizenId,
      tokenId: targetToken.id,
      tokenNumber: targetToken.tokenNumber,
      title: 'Token Skipped',
      message: `Your token ${targetToken.tokenNumber} was skipped: ${params.reason}.`,
      type: 'warning',
    });

    return updatedTokens.find((t) => t.id === targetToken.id)!;
  },

  // Audit Events
  async getEvents(limit = 20): Promise<QueueEvent[]> {
    const events = getStorage<QueueEvent[]>(STORAGE_KEYS.EVENTS, []);
    return events.slice(-limit).reverse();
  },

  async recordEvent(event: Omit<QueueEvent, 'id' | 'timestamp'>): Promise<void> {
    const events = getStorage<QueueEvent[]>(STORAGE_KEYS.EVENTS, []);
    const newEvent: QueueEvent = {
      ...event,
      id: `evt-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    setStorage(STORAGE_KEYS.EVENTS, [...events, newEvent]);
  },

  // Notifications
  async getNotifications(userId: string): Promise<InAppNotification[]> {
    const notifs = getStorage<InAppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    return notifs.filter((n) => n.userId === userId).reverse();
  },

  async createNotification(notif: Omit<InAppNotification, 'id' | 'createdAt' | 'read'>): Promise<InAppNotification> {
    const notifs = getStorage<InAppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    const newNotif: InAppNotification = {
      ...notif,
      id: `notif-${Date.now()}`,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setStorage(STORAGE_KEYS.NOTIFICATIONS, [...notifs, newNotif]);
    return newNotif;
  },

  async markNotificationRead(notifId: string): Promise<void> {
    const notifs = getStorage<InAppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    const updated = notifs.map((n) => (n.id === notifId ? { ...n, read: true } : n));
    setStorage(STORAGE_KEYS.NOTIFICATIONS, updated);
  },

  async markAllNotificationsRead(userId: string): Promise<void> {
    const notifs = getStorage<InAppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    const updated = notifs.map((n) => (n.userId === userId ? { ...n, read: true } : n));
    setStorage(STORAGE_KEYS.NOTIFICATIONS, updated);
  },

  // Statistics
  async getStatistics(): Promise<QueueStatistics> {
    const tokens = await this.getTokens();
    const offices = await this.getOffices();
    const counters = await this.getCounters();

    const waiting = tokens.filter((t) => t.status === 'WAITING').length;
    const serving = tokens.filter((t) => t.status === 'SERVING').length;
    const completed = tokens.filter((t) => t.status === 'COMPLETED').length;
    const skipped = tokens.filter((t) => t.status === 'SKIPPED').length;

    const activeCounters = counters.filter((c) => c.status === 'active').length;
    const breakCounters = counters.filter((c) => c.status === 'break').length;
    const closedCounters = counters.filter((c) => c.status === 'closed').length;

    const officeBreakdown = offices.map((off) => {
      const offTokens = tokens.filter((t) => t.officeId === off.id);
      const offCounters = counters.filter((c) => c.officeId === off.id);
      return {
        officeId: off.id,
        officeName: off.name,
        waiting: offTokens.filter((t) => t.status === 'WAITING').length,
        serving: offTokens.filter((t) => t.status === 'SERVING').length,
        completed: offTokens.filter((t) => t.status === 'COMPLETED').length,
        activeCounters: offCounters.filter((c) => c.status === 'active').length,
      };
    });

    return {
      totalTokensToday: tokens.length,
      waitingCount: waiting,
      servingCount: serving,
      completedCount: completed,
      skippedCount: skipped,
      activeCountersCount: activeCounters,
      breakCountersCount: breakCounters,
      closedCountersCount: closedCounters,
      averageWaitTimeMinutes: 12,
      averageServiceDurationMinutes: 10,
      officeBreakdown,
    };
  },

  // Users & Auth
  async getUsers(): Promise<User[]> {
    return getStorage<User[]>(STORAGE_KEYS.USERS, DEMO_USERS);
  },

  async registerCitizen(data: { name: string; email: string; phone: string; nationalId: string }): Promise<User> {
    const users = await this.getUsers();
    if (users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
      throw new Error('An account with this email address is already registered.');
    }
    const newUser: User = {
      id: `usr-cit-${Date.now()}`,
      name: data.name,
      email: data.email,
      phone: data.phone,
      nationalId: data.nationalId,
      role: 'citizen',
    };
    setStorage(STORAGE_KEYS.USERS, [...users, newUser]);
    return newUser;
  },

  resetDemoData(): void {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEMO_USERS));
    localStorage.setItem(STORAGE_KEYS.OFFICES, JSON.stringify(DEMO_OFFICES));
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(DEMO_SERVICES));
    localStorage.setItem(STORAGE_KEYS.COUNTERS, JSON.stringify(DEMO_COUNTERS));
    localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(DEMO_TOKENS));
    window.dispatchEvent(new Event('smartgov_storage_update'));
  },
};
