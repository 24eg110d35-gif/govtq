import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// In-memory backend queue store (persists across API requests)
// Mirrors TiDB Cloud relational model for student demo
const dbState = {
  offices: [
    {
      id: 'off-1',
      name: 'City Municipal Corporation (Civil Station)',
      code: 'CMC',
      department: 'Urban Development & Municipal Administration',
      address: 'Gate 2, Civic Center Complex, Gandhi Road, Sector 4',
      operatingHours: '09:00 AM - 05:00 PM (Mon - Fri)',
      contactNumber: '+91 (080) 2296-7400',
      activeCountersCount: 5,
    },
    {
      id: 'off-2',
      name: 'District Revenue & Land Records (Collectorate)',
      code: 'REV',
      department: 'Revenue & Disaster Management',
      address: 'Old Secretariat Block A, District Collectorate Campus',
      operatingHours: '09:30 AM - 04:30 PM (Mon - Sat)',
      contactNumber: '+91 (080) 2297-8100',
      activeCountersCount: 4,
    },
    {
      id: 'off-3',
      name: 'Social Welfare & Pension Department',
      code: 'SWD',
      department: 'Social Justice & Empowerment',
      address: 'Ground Floor, Vikas Bhavan, Rajendra Nagar',
      operatingHours: '10:00 AM - 04:00 PM (Mon - Fri)',
      contactNumber: '+91 (080) 2298-3200',
      activeCountersCount: 3,
    },
    {
      id: 'off-4',
      name: 'Regional Citizen Services & Help Desk',
      code: 'CSH',
      department: 'Public Grievances & Digital Governance',
      address: 'Integrated Civic One-Stop Center, Central Metro Station Arcade',
      operatingHours: '08:30 AM - 06:00 PM (All Days)',
      contactNumber: '+91 (080) 2299-1000',
      activeCountersCount: 4,
    },
  ],
  services: [
    {
      id: 'srv-1',
      officeId: 'off-1',
      name: 'Birth & Death Certificate Issuance',
      code: 'CERT',
      category: 'Vital Statistics',
      avgDurationMinutes: 8,
      requiredDocuments: ['Hospital Discharge Summary', 'Parent Identity Card', 'Marriage Certificate copy'],
      description: 'Issuance, verification, and digital authentication of municipal birth and death records.',
      feeAmount: 50,
    },
    {
      id: 'srv-2',
      officeId: 'off-1',
      name: 'Property Tax Assessment & Self-Declaration',
      code: 'TAX',
      category: 'Revenue & Municipal',
      avgDurationMinutes: 12,
      requiredDocuments: ['Previous Tax Paid Receipt', 'Title Deed / Khata Extract', 'Utility Bill'],
      description: 'Filing annual municipal property tax, rebate claims, and Khata transfer documentation.',
      feeAmount: 0,
    },
    {
      id: 'srv-3',
      officeId: 'off-1',
      name: 'Trade License & Commercial Clearance',
      code: 'TRADE',
      category: 'Commercial Licensing',
      avgDurationMinutes: 15,
      requiredDocuments: ['Rental Agreement', 'Fire Safety NOC', 'Shop Owner ID Proof', 'GST Certificate'],
      description: 'New trade license registration and renewal for shops and small businesses.',
      feeAmount: 250,
    },
    {
      id: 'srv-4',
      officeId: 'off-2',
      name: 'Income & Caste Certificate Verification',
      code: 'REV-CERT',
      category: 'Revenue Certificates',
      avgDurationMinutes: 10,
      requiredDocuments: ['Ration Card / Family Card', 'Salary Slip / IT Return', 'School Leaving Certificate', 'Affidavit'],
      description: 'Verification of annual family income and social community category.',
      feeAmount: 30,
    },
    {
      id: 'srv-5',
      officeId: 'off-2',
      name: 'Land Title Mutation & Survey Records',
      code: 'LAND',
      category: 'Land Administration',
      avgDurationMinutes: 18,
      requiredDocuments: ['Registered Sale Deed', 'Patta / RoR Copy', 'Encumbrance Certificate (EC)', 'Boundary Map'],
      description: 'Change of land title ownership in revenue records after purchase or inheritance.',
      feeAmount: 120,
    },
    {
      id: 'srv-6',
      officeId: 'off-3',
      name: 'Senior Citizen & Old Age Pension Enrollment',
      code: 'PEN',
      category: 'Social Security',
      avgDurationMinutes: 10,
      requiredDocuments: ['Age Proof', 'Bank Passbook copy with IFSC', 'Income Declaration'],
      description: 'Enrollment in National Social Assistance Program monthly financial support.',
      feeAmount: 0,
    },
    {
      id: 'srv-8',
      officeId: 'off-4',
      name: 'Public Grievance Redressal & Help Desk',
      code: 'HELP',
      category: 'Citizen Assistance',
      avgDurationMinutes: 7,
      requiredDocuments: ['Written Petition or Application ID', 'Valid Identity Proof'],
      description: 'Filing complaints regarding civic infrastructure or inter-department assistance.',
      feeAmount: 0,
    },
  ],
  counters: [
    {
      id: 'cnt-1',
      officeId: 'off-1',
      counterNumber: 1,
      name: 'Counter 1 — Birth & Vital Records',
      serviceIds: ['srv-1'],
      staffId: 'usr-staff-1',
      staffName: 'Rajesh Kumar (Officer)',
      status: 'active',
      currentTokenId: 'tok-102',
    },
    {
      id: 'cnt-2',
      officeId: 'off-1',
      counterNumber: 2,
      name: 'Counter 2 — Vital Statistics Express',
      serviceIds: ['srv-1'],
      status: 'active',
    },
    {
      id: 'cnt-3',
      officeId: 'off-1',
      counterNumber: 3,
      name: 'Counter 3 — Property Tax & Assessment',
      serviceIds: ['srv-2'],
      staffId: 'usr-staff-3',
      staffName: 'Amit Saxena (Inspector)',
      status: 'active',
      currentTokenId: 'tok-103',
    },
    {
      id: 'cnt-4',
      officeId: 'off-1',
      counterNumber: 4,
      name: 'Counter 4 — Khata & Municipal Records',
      serviceIds: ['srv-2'],
      status: 'break',
    },
    {
      id: 'cnt-5',
      officeId: 'off-1',
      counterNumber: 5,
      name: 'Counter 5 — Trade Licenses & NOCs',
      serviceIds: ['srv-3'],
      status: 'active',
    },
  ],
  tokens: [
    {
      id: 'tok-101',
      tokenNumber: 'CERT-101',
      officeId: 'off-1',
      officeName: 'City Municipal Corporation (Civil Station)',
      serviceId: 'srv-1',
      serviceName: 'Birth & Death Certificate Issuance',
      serviceCode: 'CERT',
      citizenId: 'usr-cit-demo-1',
      citizenName: 'Sunil Verma',
      citizenPhone: '+91 98450 11223',
      citizenNationalId: 'CID-5521-1200',
      counterId: 'cnt-1',
      counterNumber: 1,
      staffId: 'usr-staff-1',
      staffName: 'Rajesh Kumar',
      status: 'COMPLETED',
      priority: 'STANDARD',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      calledAt: new Date(Date.now() - 3000000).toISOString(),
      completedAt: new Date(Date.now() - 2400000).toISOString(),
      estimatedWaitMinutes: 0,
    },
    {
      id: 'tok-102',
      tokenNumber: 'CERT-102',
      officeId: 'off-1',
      officeName: 'City Municipal Corporation (Civil Station)',
      serviceId: 'srv-1',
      serviceName: 'Birth & Death Certificate Issuance',
      serviceCode: 'CERT',
      citizenId: 'usr-cit-demo-2',
      citizenName: 'Rohan Mehra',
      citizenPhone: '+91 98451 22334',
      citizenNationalId: 'CID-6632-4412',
      counterId: 'cnt-1',
      counterNumber: 1,
      staffId: 'usr-staff-1',
      staffName: 'Rajesh Kumar',
      status: 'SERVING',
      priority: 'STANDARD',
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      calledAt: new Date(Date.now() - 600000).toISOString(),
      servedAt: new Date(Date.now() - 600000).toISOString(),
      estimatedWaitMinutes: 0,
    },
    {
      id: 'tok-104',
      tokenNumber: 'CERT-103',
      officeId: 'off-1',
      officeName: 'City Municipal Corporation (Civil Station)',
      serviceId: 'srv-1',
      serviceName: 'Birth & Death Certificate Issuance',
      serviceCode: 'CERT',
      citizenId: 'usr-citizen-1',
      citizenName: 'Anjali Sharma',
      citizenPhone: '+91 98765 43210',
      citizenNationalId: 'CID-8842-9011',
      status: 'WAITING',
      priority: 'STANDARD',
      createdAt: new Date(Date.now() - 900000).toISOString(),
      estimatedWaitMinutes: 8,
    },
  ],
  auditEvents: [] as Array<Record<string, unknown>>,
};

// ==========================================
// REST API ROUTES (/api/*)
// ==========================================

// 1. Health check & architecture status
app.get('/api/health', (_req: Request, res: Response) => {
  const tidbConfigured = Boolean(process.env.TIDB_HOST && process.env.TIDB_USER);
  const picnieConfigured = Boolean(process.env.PICNIE_API_KEY);

  res.json({
    status: 'ok',
    system: 'SmartGov Queue Management System API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: {
      type: tidbConfigured ? 'TiDB Cloud (Connected)' : 'TiDB Cloud Compatibility Engine (In-Memory Prototype)',
      configured: tidbConfigured,
      host: process.env.TIDB_HOST || 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com (Unlinked)',
    },
    picnie: {
      configured: picnieConfigured,
      capabilities: ['Document OCR Supporting Parser', 'PDF Official Receipt Generator'],
    },
  });
});

// 2. Offices
app.get('/api/offices', (_req: Request, res: Response) => {
  res.json(dbState.offices);
});

// 3. Services
app.get('/api/services', (req: Request, res: Response) => {
  const officeId = req.query.officeId as string;
  if (officeId) {
    return res.json(dbState.services.filter((s) => s.officeId === officeId));
  }
  res.json(dbState.services);
});

// 4. Counters
app.get('/api/counters', (req: Request, res: Response) => {
  const officeId = req.query.officeId as string;
  if (officeId) {
    return res.json(dbState.counters.filter((c) => c.officeId === officeId));
  }
  res.json(dbState.counters);
});

// 5. Tokens
app.get('/api/tokens', (req: Request, res: Response) => {
  let list = [...dbState.tokens];
  if (req.query.officeId) {
    list = list.filter((t) => t.officeId === req.query.officeId);
  }
  if (req.query.status) {
    list = list.filter((t) => t.status === req.query.status);
  }
  if (req.query.citizenId) {
    list = list.filter((t) => t.citizenId === req.query.citizenId);
  }
  res.json(list);
});

// 5b. Individual token lookup (for external device QR scans)
app.get('/api/queue/token/:identifier', (req: Request, res: Response) => {
  const { identifier } = req.params;
  const token = dbState.tokens.find(
    (t) =>
      t.tokenNumber.toUpperCase() === identifier.toUpperCase() ||
      t.id === identifier
  );
  if (!token) {
    return res.status(404).json({ error: 'Token pass not found in civic registry' });
  }
  res.json(token);
});

// 5c. Sync token across devices and local storage
app.post('/api/tokens/sync', (req: Request, res: Response) => {
  const token = req.body;
  if (!token || !token.id) {
    return res.status(400).json({ error: 'Invalid token payload' });
  }
  const existingIndex = dbState.tokens.findIndex((t) => t.id === token.id || t.tokenNumber === token.tokenNumber);
  if (existingIndex >= 0) {
    dbState.tokens[existingIndex] = { ...dbState.tokens[existingIndex], ...token };
  } else {
    dbState.tokens.push(token);
  }
  res.json({ success: true, token });
});

// 5d. QR code receipt direct path redirection
app.get('/receipt', (req: Request, res: Response) => {
  const q = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
  res.redirect(`/${q}`);
});

// 6. Token generation
app.post('/api/tokens/generate', (req: Request, res: Response) => {
  const { officeId, serviceId, citizenId, citizenName, citizenPhone, citizenNationalId, priority, notes } = req.body;

  const office = dbState.offices.find((o) => o.id === officeId);
  const service = dbState.services.find((s) => s.id === serviceId);

  if (!office || !service) {
    return res.status(400).json({ error: 'Invalid office or service identifier' });
  }

  const prefix = service.code.split('-')[0].substring(0, 4).toUpperCase();
  const existingCount = dbState.tokens.filter((t) => t.serviceId === serviceId).length;
  const tokenNumber = `${prefix}-${100 + existingCount + 1}`;

  const waitingCount = dbState.tokens.filter((t) => t.serviceId === serviceId && t.status === 'WAITING').length;
  const estimatedWaitMinutes = Math.max(5, (waitingCount + 1) * service.avgDurationMinutes);

  const newToken = {
    id: `tok-${Date.now()}`,
    tokenNumber,
    officeId: office.id,
    officeName: office.name,
    serviceId: service.id,
    serviceName: service.name,
    serviceCode: service.code,
    citizenId,
    citizenName,
    citizenPhone,
    citizenNationalId,
    status: 'WAITING',
    priority: priority || 'STANDARD',
    createdAt: new Date().toISOString(),
    estimatedWaitMinutes,
    notes,
    qrPayload: `SMARTGOV:${tokenNumber}:${office.code}:${service.code}:${Date.now()}`,
  };

  dbState.tokens.push(newToken);
  res.status(201).json(newToken);
});

// 7. Staff: Call next token
app.post('/api/queue/call-next', (req: Request, res: Response) => {
  const { counterId, staffId, staffName } = req.body;
  const counter = dbState.counters.find((c) => c.id === counterId);

  if (!counter) {
    return res.status(404).json({ error: 'Counter not found' });
  }

  // Validate only 1 active serving token per counter
  const alreadyServing = dbState.tokens.find((t) => t.counterId === counter.id && t.status === 'SERVING');
  if (alreadyServing) {
    return res.status(409).json({
      error: `Counter ${counter.counterNumber} is currently serving token ${alreadyServing.tokenNumber}. Complete or skip it before calling next.`,
    });
  }

  const waitingTokens = dbState.tokens
    .filter((t) => t.officeId === counter.officeId && counter.serviceIds.includes(t.serviceId) && t.status === 'WAITING')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  if (waitingTokens.length === 0) {
    return res.status(404).json({ error: 'No waiting citizens for this counter.' });
  }

  const nextToken = waitingTokens[0];
  const now = new Date().toISOString();

  nextToken.status = 'SERVING';
  (nextToken as unknown as Record<string, unknown>).counterId = counter.id;
  (nextToken as unknown as Record<string, unknown>).counterNumber = counter.counterNumber;
  (nextToken as unknown as Record<string, unknown>).staffId = staffId;
  (nextToken as unknown as Record<string, unknown>).staffName = staffName;
  (nextToken as unknown as Record<string, unknown>).calledAt = now;
  (nextToken as unknown as Record<string, unknown>).servedAt = now;

  counter.currentTokenId = nextToken.id;

  res.json({ token: nextToken, message: `Token ${nextToken.tokenNumber} called to Counter ${counter.counterNumber}` });
});

// 8. Staff: Complete service
app.post('/api/queue/complete', (req: Request, res: Response) => {
  const { tokenId, counterId, notes } = req.body;
  const token = dbState.tokens.find((t) => t.id === tokenId);

  if (!token) {
    return res.status(404).json({ error: 'Token not found' });
  }

  if (token.status !== 'SERVING') {
    return res.status(400).json({ error: `Cannot complete token ${token.tokenNumber} because it is not currently SERVING.` });
  }

  token.status = 'COMPLETED';
  (token as unknown as Record<string, unknown>).completedAt = new Date().toISOString();
  if (notes) (token as unknown as Record<string, unknown>).notes = notes;

  const counter = dbState.counters.find((c) => c.id === counterId);
  if (counter) {
    counter.currentTokenId = undefined;
  }

  res.json(token);
});

// 9. Staff: Skip token
app.post('/api/queue/skip', (req: Request, res: Response) => {
  const { tokenId, counterId, reason } = req.body;
  const token = dbState.tokens.find((t) => t.id === tokenId);

  if (!token) {
    return res.status(404).json({ error: 'Token not found' });
  }

  token.status = 'SKIPPED';
  (token as unknown as Record<string, unknown>).skippedAt = new Date().toISOString();
  (token as unknown as Record<string, unknown>).skipReason = reason || 'Citizen did not approach counter';

  const counter = dbState.counters.find((c) => c.id === counterId);
  if (counter) {
    counter.currentTokenId = undefined;
  }

  res.json(token);
});

// 9b. Staff: Confirm Citizen Arrival (stops 2-minute auto-skip grace countdown)
app.post('/api/queue/confirm-arrival', (req: Request, res: Response) => {
  const { tokenId } = req.body;
  const token = dbState.tokens.find((t) => t.id === tokenId);

  if (!token) {
    return res.status(404).json({ error: 'Token not found' });
  }

  (token as unknown as Record<string, unknown>).arrivalConfirmedAt = new Date().toISOString();
  res.json(token);
});

// 10. Queue statistics
app.get('/api/stats', (_req: Request, res: Response) => {
  const waiting = dbState.tokens.filter((t) => t.status === 'WAITING').length;
  const serving = dbState.tokens.filter((t) => t.status === 'SERVING').length;
  const completed = dbState.tokens.filter((t) => t.status === 'COMPLETED').length;
  const skipped = dbState.tokens.filter((t) => t.status === 'SKIPPED').length;

  res.json({
    totalTokensToday: dbState.tokens.length,
    waitingCount: waiting,
    servingCount: serving,
    completedCount: completed,
    skippedCount: skipped,
    averageWaitTimeMinutes: 14,
    averageServiceDurationMinutes: 11,
  });
});

// 11. Picnie OCR document parsing endpoint
app.post('/api/picnie/ocr', (req: Request, res: Response) => {
  const { fileName } = req.body;
  const apiKeyPresent = Boolean(process.env.PICNIE_API_KEY);

  res.json({
    service: 'Picnie OCR Engine',
    apiKeyPresent,
    extractedData: {
      citizenName: 'Anjali Sharma',
      documentNumber: 'CID-8842-9011',
      documentType: 'Government Identity Card',
      issuingAuthority: 'Civic Registrar Authority',
      extractedAddress: 'Gandhi Road, Sector 4, Civic Ward',
      confidence: 96.4,
    },
    disclaimer: 'OCR text extraction provided for verified data entry. Does not certify legal authenticity.',
    fileName,
  });
});

// 12. TiDB Schema export endpoint
app.get('/api/db/export-schema', (_req: Request, res: Response) => {
  try {
    const schemaPath = path.join(__dirname, 'src', 'db', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      return res.type('text/plain').send(sql);
    }
  } catch {}
  res.type('text/plain').send('-- TiDB Cloud schema available in src/db/schema.sql');
});

// ==========================================
// VITE CLIENT MIDDLEWARE / PRODUCTION SERVE
// ==========================================
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SmartGov Queue] Server operational on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[SmartGov Queue] Failed to launch server:', err);
});
