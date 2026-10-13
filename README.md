# SmartGov Queue: Smart Government Queue Management System

A production-grade, multi-role web platform designed for civic and public administration offices. SmartGov Queue replaces chaotic, crowded physical lines with transparent digital tokens, real-time waiting estimations, desk allocation, and auditory turn notifications.

---

## 1. System Overview & Problem Solved

Citizens visiting government offices often face uncertainty regarding queue progress, long wait times, and confusion about assigned counters. **SmartGov Queue** provides:

1. **For Citizens:** Digital token generation, real-time wait estimation `(Ahead + 1) × AvgDuration`, automated audio chimes when their token is called, and official printable PDF receipts with verification QR codes.
2. **For Staff Officers:** Single-click "Call Next" operations, counter status management (Active, Break, Closed), handling timers, and verified completion or skip tracking with recorded reasons.
3. **For Administrators:** City-wide queue monitoring, office load balancing, service catalog configuration, and an immutable real-time audit event timeline.

---

## 2. Technology Stack & Architecture

- **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide Icons, Web Audio API chime synthesizer.
- **Backend:** Node.js, Express (`server.ts`), REST API (`/api/*`).
- **Database:** TiDB Cloud Serverless (MySQL 8.0 Compatible DDL schema provided in `src/db/schema.sql`).
- **Document OCR & PDF Engine:** Picnie API integration with robust offline fallbacks.

```
┌─────────────────────────┐
│       Browser UI        │ (React 19 + Tailwind CSS)
│ (Citizen / Staff/ Admin)│
└────────────┬────────────┘
             │ HTTP / JSON
             ▼
┌─────────────────────────┐
│     Express REST API    │ (Node.js backend in server.ts)
│     /api/queue/*        │
└────────────┬────────────┘
             │
      ┌──────┴──────┐
      ▼             ▼
┌───────────┐ ┌──────────────┐
│TiDB Cloud │ │  Picnie API  │ (PDF receipts &
│(MySQL DDL)│ │ (OCR Parser) │  document intake)
└───────────┘ └──────────────┘
```

---

## 3. Project Directory Structure

```
├── .env.example              # Environment variables template
├── index.html                # Entry HTML with civic metadata & Google Fonts
├── metadata.json             # AI Studio applet metadata
├── package.json              # Project scripts and dependencies
├── server.ts                 # Full Node.js Express API & Vite server
├── tsconfig.json             # TypeScript compiler configuration
├── vite.config.ts            # Vite 8 configuration
└── src/
    ├── assets/images/        # High-fidelity civic photography & kiosk renders
    ├── components/
    │   ├── Navbar.tsx        # Top navigation with 3-zone contract & role switcher
    │   ├── CitizenPortal/
    │   │   ├── CitizenDashboard.tsx    # Active token tracker & department queues
    │   │   ├── TokenGeneratorModal.tsx # Office & service selection wizard
    │   │   ├── TokenReceiptModal.tsx   # Official printable pass with QR code
    │   │   └── DocumentOcrModal.tsx    # Picnie supporting document scanner
    │   ├── StaffPortal/
    │   │   └── StaffDashboard.tsx      # Desk controls, call next & serving timer
    │   ├── AdminPortal/
    │   │   └── AdminDashboard.tsx      # Cross-office analytics & audit trail
    │   ├── PublicBoard/
    │   │   └── LiveDisplayBoard.tsx    # Wall-mounted electronic queue board
    │   └── Common/
    │       ├── ArchitectureModal.tsx   # TiDB DDL schema & system architecture
    │       └── TestSuiteModal.tsx      # 12-point automated verification runner
    ├── context/
    │   ├── AuthContext.tsx   # Multi-role authentication & user sessions
    │   └── QueueContext.tsx  # State synchronization, polling & audio chimes
    ├── data/
    │   └── initialData.ts    # Seed data for offices, services & test users
    ├── db/
    │   └── schema.sql        # Full TiDB Cloud MySQL DDL statements
    ├── services/
    │   ├── api.ts            # API client with automatic synchronization
    │   └── picnie.ts         # Picnie OCR and PDF integration service
    ├── types/
    │   └── queue.ts          # Complete TypeScript domain contracts
    ├── utils/
    │   └── audioChime.ts     # Web Audio API civic desk chime synthesizer
    ├── App.tsx               # Root application view
    ├── index.css             # Tailwind CSS & print media stylesheets
    └── main.tsx              # React DOM bootstrap
```

---

## 4. Test Accounts & Pre-Configured Roles

| Persona | Name | Role | Test Functionality |
| :--- | :--- | :--- | :--- |
| **Citizen** | Anjali Sharma | Citizen | Generates tokens, monitors wait time, prints receipts |
| **Staff Officer** | Rajesh Kumar | Staff (Counter 1) | Calls next citizen, serves active token, completes/skips |
| **Administrator** | Dr. Aruna Patel | Admin | Cross-office oversight, counters, services, and audit log |

*(Use the persona switcher in the top navigation bar to switch between roles instantly during demonstrations.)*

---

## 5. Local Setup & Running Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the local server:**
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:3000`.

3. **Production build:**
   ```bash
   npm run build
   npm start
   ```

---

## 6. TiDB Cloud Relational Database Setup

1. Create a free TiDB Cloud Serverless cluster at [tidbcloud.com](https://tidbcloud.com).
2. Open the SQL Editor on TiDB Cloud and execute the complete DDL script in `src/db/schema.sql`.
3. Add your connection credentials in `.env`:
   ```env
   TIDB_HOST="gateway01.ap-southeast-1.prod.aws.tidbcloud.com"
   TIDB_PORT=4000
   TIDB_USER="your_cluster_user.root"
   TIDB_PASSWORD="your_cluster_password"
   TIDB_DATABASE="smartgov_queue"
   ```

---

## 7. Picnie Integration & Fallbacks

- To enable the official Picnie remote API, set `PICNIE_API_KEY="your_key"` in `.env`.
- **Built-in Fallback:** If `PICNIE_API_KEY` is not provided, the application runs seamlessly using high-fidelity browser print templates (`window.print()`) and verified simulated client OCR parsing.

---

## 8. Automated Test Suite

Click **"Run Tests"** in the top navigation bar to launch the built-in 12-point automated verification runner. It programmatically validates:
1. Citizen authentication & session isolation
2. Office-to-service mapping integrity
3. Atomic token numbering & duplicate prevention
4. Rule-based wait calculation formula
5. Single-serving counter lock enforcement
6. Staff "Call Next" state transitions
7. Notification dispatch & Web Audio chime triggering
8. Service completion lifecycle
9. Token skip with mandatory rationale logging
10. Citizen history query isolation
11. Real database derived statistics
12. Graceful fallback on unconfigured external APIs
