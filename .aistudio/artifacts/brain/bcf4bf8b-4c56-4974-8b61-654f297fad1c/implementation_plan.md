# SmartGov Queue — Live Queue Synchronicity, QR Receipt Fix & Simplified Notification Engine

A comprehensive architectural plan to harmonize the 3 live queue indicators (Currently Serving, Line Position, and Live Reducing Wait), provide explicit skipped token tracking in history while resetting the active view to idle, transition alerts into clean floating auto-dismiss toasts, and fix the cross-device QR receipt scan to display the full official digital receipt without 404 errors.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions were confirmed through interactive requirements clarification:
> - **Skipped Token Handling**: When a token is skipped (e.g. upon missing the 2-minute call window or officer skip), the active status card immediately transitions to idle ("No active token in queue"), and the skipped token is prominently recorded in the Citizen's Token History with a dedicated timestamp, counter info, and skip reason.
> - **QR Code Multi-Device Scanning**: Scanning the QR code on a mobile device or separate browser directly displays the full official digital receipt pass featuring verified civic security stamps, live status badges, counter routing, and issuance timestamps, with no authentication gate or 404 error.
> - **Notification UX**: Replaced dense in-app alert banners with lightweight floating toast notifications in the top-right corner that auto-dismiss after 4 seconds (for officer calls, 5-minute queue heartbeat pulses, and skip notices).

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **Simultaneous Real-Time Queue Metrics**: Unifies the three citizen indicators—Currently Serving session elapsed timer, Sequential Line Position, and Live Estimated Wait Time—so they run concurrently with monotonic countdowns that decrease every second toward 0 (eliminating erratic modulo resets).
  2. **Skipped Token History Lifecycle**: When a citizen's token is skipped, the active card smoothly clears to idle while immediately updating the history table with a clear "SKIPPED" status tag, skip reason ("Exceeded 2-min arrival window" or staff note), and a "Re-Issue Token" shortcut.
  3. **Universal Cross-Device QR Receipt (Fixing 404s)**: Fixes QR generation by detecting the public origin (`window.location.origin` or external app hostname), providing a public receipt lookup endpoint (`/?receipt=<tokenNumber>`), and rendering the full printable/official receipt pass with live refresh.
  4. **Floating Auto-Dismiss Toasts**: Replaces intrusive popups with sleek, lightweight toast alerts that slide in on token events and auto-dismiss.

- **Target Audience**: Citizens tracking service tokens on desktop and mobile, and municipal officers calling tokens.
- **Key Value**: Predictable, intuitive wait calculations with reliable multi-device token verification and clean civic alert mechanics.

---

## 2. User Experience & Visual Design

### Targeted Styling (`CSS selector 1: div#root > div > main > div > div:nth-of-type(3)`)
The targeted element is the citizen active token status section:
- **Card Hierarchy**: Styled in high-contrast slate-900 with a subtle cyan-500/20 glow, crisp border discipline, and unboxed typographic metadata.
- **3-Metric Synchronized Row**:
  1. *Currently Serving*: Shows active serving token number, counter number, and live serving duration (`in session ~MM:SS`). If counter is idle, displays "Desk Idle & Ready".
  2. *Line Position*: Displays citizens ahead (`Position #X`, `X citizens ahead`) and highlights in emerald when "You are next in turn!".
  3. *Live Dynamic Wait*: Displays monotonically decreasing countdown (`MM:SS`) toward turn, synchronized with the active desks count.
- **Zero-Pill Compliance**: Metadata formatted with typography and muted dot separators (`·`) rather than rounded capsules.

### Key User Flows
1. **Active Queueing**: Citizen sees all 3 metrics ticking live every second. The wait countdown ticks down continuously without sudden increases.
2. **Citizen Called**: 120-second arrival countdown starts. A floating toast appears: *"Token CERT-103 called to Counter 1"*.
3. **Citizen Skipped**: If skipped, a floating amber toast informs the user (*"Token CERT-103 was skipped: Grace window expired"*), the active dashboard resets to idle, and the history table updates with the skipped record.
4. **QR Code Receipt Scanning**:
   - The citizen clicks "View Receipt". The QR code is generated with a valid public receipt URL (`window.location.origin + '?receipt=' + tokenNumber`).
   - Any smartphone scanning the QR code opens the standalone Official Digital Receipt directly, with civic insignia, security hash, verification check, and real-time status.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Monotonic Linear Countdown vs. Modulo Periodic Reset**
  - *Chosen Approach*: Replace the previous `(elapsedSecs % totalEstimatedSecs)` formula with a linear decay model: `Math.max(0, estimatedWaitSecs - elapsedSecs)`. Once zero is reached, display `"Ready at any second"`.
  - *Why*: Eliminates confusing jumps where wait times would suddenly cycle back up.

- **Decision 2: Public QR Receipt Route (`?receipt=TOKEN-NUM` / `?token=TOKEN-NUM`)**
  - *Chosen Approach*: Handle `?receipt=` and `?token=` query parameters directly in `App.tsx` and serve the full official receipt modal view with zero auth requirement, fetching live token details from `/api/queue/tokens`.
  - *Why*: Prevents 404 errors caused by arbitrary subpaths in single-page apps on static hosts.

- **Decision 3: Floating Toast Notifications Container**
  - *Chosen Approach*: Render an unobtrusive toast container at `top-4 right-4` with 4-second auto-dismissal, supporting info, success, warning, and urgent alerts.
  - *Why*: User explicitly requested simple floating toast notifications with auto-dismiss.

---

## 4. Technical Architecture & Data Strategy

### System Component Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Citizen Browser                              │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ CitizenDashboard (div:nth-of-type(3))                          │   │
│   │ ┌──────────────────┬──────────────────┬──────────────────────┐ │   │
│   │ │ CurrentlyServing │  Line Position   │  Live Dynamic Wait   │ │   │
│   │ │ [Counter 1: ~1m] │  [Ahead: 0]      │  [Countdown: 02:14]  │ │   │
│   │ └──────────────────┴──────────────────┴──────────────────────┘ │   │
│   └────────────────────────────────────────────────────────────────┘   │
│                                                                        │
│   ┌───────────────────────────────────┐  ┌───────────────────────────┐ │
│   │ Floating Toast Hub (auto-dismiss) │  │ TokenReceiptModal (QR)    │ │
│   └───────────────────────────────────┘  └─────────────┬─────────────┘ │
└────────────────────────────────────────────────────────┼───────────────┘
                                                         │ Scanned by
                                                         ▼ Mobile Device
┌────────────────────────────────────────────────────────────────────────┐
│               Mobile Smartphone (External Browser)                     │
│                                                                        │
│   URL: https://<domain>/?receipt=CERT-103                              │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ ScannedTokenReceiptView (No Auth Gate, Official Civic Pass)    │   │
│   │ - Official Emblem, Token Number, Service, Counter, Status Badge│   │
│   │ - Live auto-refreshing polling (every 2s)                      │   │
│   └────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

### File Modification Targets (Deferred to Execution Phase)
1. `src/components/CitizenPortal/CitizenDashboard.tsx`: Fix 3-metric synchronicity, monotonic countdown, and skipped token transition.
2. `src/components/CitizenPortal/TokenReceiptModal.tsx`: Generate bulletproof public QR code URLs.
3. `src/components/CitizenPortal/ScannedTokenPassView.tsx`: Render full official digital receipt layout matching the printable pass.
4. `src/components/Common/ToastContainer.tsx`: Add lightweight floating toast notifications system.
5. `src/context/QueueContext.tsx`: Expose toast trigger actions and sync skipped tokens with history.
6. `server.ts`: Ensure public token resolution endpoint supports query by token number or ID for mobile scanners.
