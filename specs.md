# Specs

In-depth, per-feature breakdown of how each item in [`features.md`](./features.md) is
actually built — every file involved, the API surface, the DB tables touched, and
known gaps. Paths are relative to the repo root.

---

## 1. Account & Role-Based Access

**Backend**
- `backend/app/Http/Controllers/Api/AuthController.php` — `login()`, `logout()`, `me()`
- `backend/app/Models/User.php` — `role` (`student`/`counselor`), `patient_code`, `isCounselor()`/`isStudent()` helpers
- `backend/database/migrations/0001_01_01_000000_create_users_table.php`
- `backend/database/migrations/2026_01_01_000001_add_role_to_users_table.php`
- `backend/database/seeders/DemoUsersSeeder.php` — seeds one counselor and one sample student record
- `backend/routes/api.php` — `POST /login` (public); `POST /logout`, `GET /me` (auth:sanctum)
- Auth is token-based via **Laravel Sanctum** (`personal_access_tokens` table, migration `2026_08_05_045402_create_personal_access_tokens_table.php`)

**Frontend**
- `frontend/src/context/AuthContext.tsx` — holds the logged-in user, exposes `login`/`logout`
- `frontend/src/pages/auth/Welcome.tsx` — counselor-only login entry screen
- `frontend/src/pages/auth/AuthPage.tsx` — counselor login form
- `frontend/src/App.tsx` — `ProtectedRoute` wrapper that redirects based on `user.role`
- `frontend/src/api/client.ts` — Axios instance, attaches the Sanctum token to requests

**Known limitations**
- No password reset flow.
- No email verification.
- `patient_code` is generated but not currently shown anywhere the counselor can search by it.

---

## 2. Wristband Pairing ("Connect Device")

**Frontend only (simulated)**
- `frontend/src/pages/student/ConnectDevice.tsx` — entire feature. `handleConnect()` sets a `setTimeout` to fake a "connected" status; no Bluetooth/WiFi API is actually called.
- Route: `frontend/src/App.tsx` → `/student/connect`

**Known limitations**
- Not wired to any backend endpoint or real device API (Web Bluetooth, etc.).
- Nothing currently links to this screen from the rest of the student flow (e.g. Welcome/Dashboard don't route here first).

---

## 3. Live Stress Monitoring Dashboard (Student)

**Backend**
- `backend/app/Http/Controllers/Api/StressClassificationController.php` — `latestForStudent()`
- Route: `GET /students/{student}/stress/latest` (auth:sanctum)
- Table: `stress_classifications` (migration `2026_01_01_000003_create_stress_classifications_table.php`)

**Frontend**
- `frontend/src/pages/student/StudentDashboard.tsx` — polls `/students/{id}/stress/latest` every 5s, renders HRV/GSR figures, the high-stress banner, and the Start/Stop Monitoring + View History controls
- `frontend/src/components/PulseRing.tsx` — the signature breathing-ring visual; duration and color are keyed off `StressLevel`
- `frontend/src/components/StressBadge.tsx` — color-coded label (Non-Stress / Mild Stress / High Stress); pulses only on the `stress` level
- `frontend/src/api/client.ts` — `StressClassification`, `StressLevel` types

**Known limitations**
- "Start/Stop Monitoring" (`StudentDashboard.tsx`) only flips local component state — it does not call `/stress/classify`, start any polling of `sensor-readings`, or persist across a refresh.
- Polling is a plain 5-second `setInterval`, not a websocket/push — fine for a demo, not efficient at scale.

---

## 4. Stress History & Trends (Student)

**Backend**
- `backend/app/Http/Controllers/Api/StressClassificationController.php` — `historyForStudent()` (last 200 records)
- Route: `GET /students/{student}/stress/history` (auth:sanctum)

**Frontend**
- `frontend/src/pages/student/StressHistory.tsx` — fetches history, maps stress levels to numbers (0/1/2) for the chart, renders an `AreaChart` (Recharts) with a calm→alert gradient fill, plus a readings/flagged-count summary card

**Known limitations**
- No date-range filter — always the most recent 200 records.
- No CSV/PDF export.

---

## 5. Counselor Roster / Triage List

**Backend**
- `backend/app/Http/Controllers/Api/StudentController.php` — `index()`, eager-loads each student's single latest `stressClassifications` row
- `backend/app/Http/Controllers/Api/StudentController.php` — `store()` adds a new `student` user with `course`, `college`, and `age`, and generates an anonymized `patient_code`; no email/password is required from the counselor form.
- Routes: `GET /students`, `POST /students` (auth:sanctum, counselor-only via `abort_unless`)

**Frontend**
- `frontend/src/pages/counselor/CounselorDashboard.tsx` — the roster screen; renders a mood-colored edge strip + course/college info + `StressBadge` per student row, and an empty state when there are no students
- `frontend/src/pages/counselor/AddStudent.tsx` — counselor-facing student creation form; redirects back to the dashboard once the new student is saved

**Known limitations**
- No search, sort, or pagination — every student in the system is fetched in one request.
- "Most stressed first" sorting (mentioned as a suggestion) is not implemented.

---

## 6. Student Detail View (Counselor)

**Backend**
- `backend/app/Http/Controllers/Api/StudentController.php` — `show()`, eager-loads `stressClassifications`, `notesReceived`, `counselingSessionsAsStudent`
- `backend/app/Http/Controllers/Api/CounselorNoteController.php` — `store()`, `forStudent()`
- `backend/app/Models/CounselorNote.php`, `backend/app/Models/CounselingSession.php`
- Routes: `GET /students/{student}` · `GET /students/{student}/notes` · `POST /notes` (all auth:sanctum)
- Tables: `counselor_notes` (`2026_01_01_000004_create_counselor_notes_table.php`), `counseling_sessions` (`2026_01_01_000000_create_counseling_sessions_table.php`)

**Frontend**
- `frontend/src/pages/counselor/StudentDetail.tsx` — the whole screen: stress timeline bar strip (with legend + per-bar tooltip), the add-note form (note + optional recommendation), and the notes list (with an empty state).

**Known limitations**
- Notes list has no edit/delete.

**Prototype note**
- A separate responsive mockup page exists at `frontend/mockup-redesign.html` to demonstrate how the redesigned dashboard can scale to phone layouts, using a fixed left, URP-style collapsible sidebar on desktop and a mobile app-style hamburger drawer on phones.

---

## 7. Sensor Data Ingestion (Wristband → Server)

**Firmware**
- `firmware/stress_monitor_esp32/stress_monitor_esp32.ino` — reads PPG (MAX30102, via SparkFun MAX3010x library) and GSR (Grove sensor), batches ~20 samples (~4s @ 5Hz) and POSTs them; requires `WIFI_SSID`, `WIFI_PASSWORD`, `API_BASE_URL`, `STUDENT_ID` to be set before flashing

**Backend**
- `backend/app/Http/Controllers/Api/SensorReadingController.php` — `store()` (single reading), `storeBatch()` (array of readings)
- `backend/app/Models/SensorReading.php`
- Routes: `POST /sensor-readings`, `POST /sensor-readings/batch` — **public, no auth middleware yet** (see limitations)
- Table: `sensor_readings` (`2026_01_01_000002_create_sensor_readings_table.php`) — columns include `ppg_raw`, `gsr_raw`, `heart_rate_bpm`, `phase` (`resting`/`interaction`/`post_interaction`), `recorded_at`

**Known limitations**
- Ingest routes have no device-key/auth check — anyone who can reach the API can post fake readings for any `student_id`. The route comment flags this as intentional-for-now, to be added once past prototyping.
- Firmware's `recorded_at` timestamp is a hardcoded placeholder — real NTP sync (`configTime()`) is not yet wired in, so timestamps aren't trustworthy for the three-phase protocol timing.
- `heart_rate_bpm` from firmware is just a scaled raw IR value, not a real Pan-Tompkins-derived BPM.

---

## 8. Stress Classification Engine

**Backend**
- `backend/app/Http/Controllers/Api/StressClassificationController.php` — `classify()` is the entry point (`POST /stress/classify`); branches on whether `config('services.ml_service.url')` is set:
  - **`classifyWithRuleBasedStub()`** (active today) — flags `stress` if avg GSR > 0.7 **and** avg heart rate > 100; `mild_stress` if either exceeds a lower threshold; otherwise `non_stress`. This is a placeholder, **not** the Chapter 3 SVM.
  - **`classifyViaMlService()`** (the seam for later) — POSTs the last 50 raw readings to an external `ml-service` at `{ML_SERVICE_URL}/classify` and expects `{ stress_level, features }` back. Activated automatically once `ML_SERVICE_URL` is set in `.env` / `config/services.php` — no other backend or frontend code needs to change.
- `backend/app/Models/StressClassification.php` — `stress_level`, `feature_vector` (JSON-cast), `source` (`rule_based` or `svm`), `classified_at`
- `backend/config-services-snippet.php` — the `services.ml_service.url` config entry to merge into `config/services.php`

**Frontend**
- Consumes the output via `frontend/src/pages/student/StudentDashboard.tsx` and `StressHistory.tsx`; the frontend has no awareness of which classification source produced a given reading (that's `source` in the DB, not currently surfaced in the UI)

**Known limitations**
- The real SVM pipeline (Butterworth filter → NeuroKit2/cvxEDA → RBF-kernel SVM, Grid Search + RFE per the thesis) is not implemented anywhere in this repo — it's expected to live in a separate Python `ml-service` that doesn't exist yet.
- Nothing currently calls `POST /stress/classify` automatically after new sensor readings arrive — it has to be triggered manually/externally; the route comment notes this could later be a queued job.
- `source` field (`rule_based` vs `svm`) isn't shown anywhere in the UI, so a counselor/student can't currently tell whether a given reading came from the real model or the stub.

---

## 9. Counseling Session Scheduling

**Data model only — no working feature yet**
- `backend/app/Models/CounselingSession.php` — `student_id`, `counselor_id`, `scheduled_at`, `status`; relations to `sensorReadings`, `stressClassifications`, `notes`
- `backend/database/migrations/2026_01_01_000000_create_counseling_sessions_table.php`
- Referenced (as a nullable field) by: `SensorReadingController`, `StressClassificationController`, `CounselorNoteController`

**Known limitations**
- No controller, no route, and no frontend form actually creates a `counseling_sessions` row. This is the single largest gap between the data model and the working app.

---

## 10. Design System

**Tokens & shared styles**
- `frontend/tailwind.config.js` — color tokens (`base`, `surface`, `border`, `borderStrong`, `muted`, `ink`, `calm`, `mild`, `alert`), font families (`display`: Fraunces, `body`: Inter)
- `frontend/src/index.css` — `.glass-card`, `.btn-primary`, `.btn-ghost`, `.field` component classes; `@keyframes breathe` and `@keyframes drift` (used by the pulse ring / ambient backgrounds); `prefers-reduced-motion` override; `:focus-visible` ring styling

**Signature element**
- `frontend/src/components/PulseRing.tsx` — used on `Welcome.tsx` (calm, static branding use) and `StudentDashboard.tsx` (live, level-driven use)

**Known limitations**
- No light-mode variant — dark theme only.
- Ambient ("mood") background tint on `StudentDashboard.tsx` is inline-styled per-page rather than a reusable token/utility, so extending it to other screens means copy-pasting the `AMBIENT` map.

---

## 11. Live Data Simulator

**Python simulation**
- `simulate_data_fetch.py` — logs in as the counselor, fetches the roster, posts batched raw readings to `POST /sensor-readings/batch`, and triggers `POST /stress/classify`.
- It also polls `GET /students/{student}/stress/latest` and prints the latest classification so the frontend can show live graph motion during development without a physical wristband.

**Known limitations**
- The simulator is not a real firmware client, but it exercises the same backend ingest/classify endpoints that the production flow will.
- It uses randomized drift and stress-state transitions rather than actual biosignal processing, so the values are synthetic but useful for demoing live charts.
