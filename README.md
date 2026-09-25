# Wearable Wristband Stress Monitor — App Layer (URP-style)

This is the **software/app layer only** — Laravel API + React frontend, structured
like the URP project. The ML pipeline from Chapter 3 (Butterworth filter, NeuroKit2,
cvxEDA, SVM) is **not implemented yet on purpose**. A rule-based stub stands in for it
so you can build and demo the full app now, then swap in the real model later without
touching the database schema, routes, or React code.

## Documentation

- **[`features.md`](./features.md)** — plain-language overview of what the app does
  today, feature by feature, with a status flag (implemented / stubbed / UI-only).
- **[`specs.md`](./specs.md)** — in-depth breakdown per feature: every backend
  controller, model, migration, route, and frontend file involved, plus known
  limitations. Start here when you need to find "which files touch X."

## Folder structure

```
thesis-project/
├── backend/     # Laravel API — drop these files into a fresh `laravel new backend`
├── frontend/    # React + Vite + TypeScript + Tailwind — ready to run as-is
└── firmware/    # ESP32-S3 Arduino sketch — reads sensors, streams raw data to Laravel
```

## Setting up the backend

The `backend/` folder here only contains the files specific to this project (migrations,
models, controllers, routes) — not a full Laravel install, since that needs Composer/Packagist
access which isn't available in the environment that generated these files.

1. On your machine, create a fresh Laravel app:
   ```bash
   composer create-project laravel/laravel backend
   ```
2. Copy everything from this `backend/` folder into the new Laravel app, **merging**
   rather than overwriting `config/services.php` — see `config-services-snippet.php`
   for the one array entry to add.
3. Install Sanctum (used for the login token API):
   ```bash
   composer require laravel/sanctum
   php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
   ```
4. **Laravel 11 doesn't auto-load `routes/api.php` or enable Sanctum's stateful API
   middleware out of the box** — open `bootstrap/app.php` in your new project and add
   the two lines shown in `bootstrap-app-snippet.php`.
5. Point `.env` at your MySQL database (XAMPP works fine, like your other projects),
   then run:
   ```bash
   php artisan migrate
   php artisan db:seed --class=DemoUsersSeeder
   php artisan serve
   ```
   This seeds one counselor account (password is `password`) and one sample student record:
   - Counselor: `counselor@ue.edu.ph`

## Flashing the ESP32 firmware

`firmware/stress_monitor_esp32/stress_monitor_esp32.ino` is a starting point, not a
finished product — it reads raw PPG (MAX30102) and GSR (Grove) values and batches them
to `/api/sensor-readings/batch` every 20 samples (~4 seconds at 5Hz). Before flashing:

1. Install the **SparkFun MAX3010x** and **ArduinoJson** libraries via Library Manager.
2. Set `WIFI_SSID`, `WIFI_PASSWORD`, and `API_BASE_URL` (your machine's LAN IP while
   prototyping, e.g. `http://192.168.1.100:8000/api`).
3. Set `STUDENT_ID` to match a seeded student's actual `id` (check your `users` table
   after seeding — the demo student may not be id `1`).
4. The `recorded_at` timestamp is hardcoded as a placeholder — wire up NTP
   (`configTime()`) before you rely on this for real data collection, since your
   three-phase protocol (resting / interaction / post-interaction) depends on accurate
   timestamps.
5. Heart rate is currently just the raw IR value, scaled — real BPM extraction
   (Pan-Tompkins peak detection) is meant to happen server-side later, not here.

## Setting up the frontend

```bash
cd frontend
npm install
cp .env.example .env    # points at http://localhost:8000/api by default
npm run dev
```

Visit `http://localhost:5173`. The Welcome page lets you pick Student or Guidance
Counselor, matching Figs. 12–18 in your Chapter 3.

The UI uses a dark glassmorphism theme (Fraunces display + Inter body type) with a
breathing "pulse ring" as its signature visual — its speed and color follow the
student's live stress reading, standing in for a real heart-rate signal. See the
**Design System** section of `specs.md` for the token/file breakdown.

## Known gaps before this is defense/demo-ready

These are called out in detail (with exact files) in `specs.md`, but the short list:

- **Start/Stop Monitoring** on the student dashboard is a local UI toggle only — it
  doesn't call `/stress/classify` or persist across a refresh.
- **Schedule Session** button on the counselor's student detail page has no handler —
  the `counseling_sessions` table/model exist, but no controller or route creates one.
- **Sensor ingest routes** (`/sensor-readings`, `/sensor-readings/batch`) have no
  device-key auth yet — anyone who can reach the API can post readings for any
  student ID.
- **Classification is a threshold rule**, not the Chapter 3 SVM — see "Swapping in the
  real SVM later" below for how to activate the real pipeline once it exists.

## How this maps to your paper's Conceptual Framework (Fig. 1)

| Paper's component | This implementation |
|---|---|
| ESP32 → raw HRV/GSR | `POST /api/sensor-readings` or `/sensor-readings/batch` |
| SVM classification | `StressClassificationController@classify` — **currently a rule-based stub** |
| Firebase database | MySQL via Laravel Eloquent (`sensor_readings`, `stress_classifications`, `counselor_notes`, `counseling_sessions` tables) |
| Guidance counselor dashboard | `frontend/src/pages/counselor/*` |
| Student dashboard + alerts | `frontend/src/pages/student/*` |

## Swapping in the real SVM later

`StressClassificationController::classify()` already has the seam built in:
if `ML_SERVICE_URL` is set in `.env`, it calls out to your future Python service
(FastAPI + scikit-learn) instead of the stub — no other code changes needed.
This is also *why* the ESP32 firmware should stay dumb: it should just stream raw
samples over WiFi/BLE to Laravel, not run any filtering or classification itself,
so all the heavy lifting stays off the microcontroller.
