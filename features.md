# Features

This is a plain-language overview of what the app does. For file-by-file detail on
how each feature is built, see [`specs.md`](./specs.md).

Status legend: ✅ implemented · 🟡 implemented as a stand-in / stub · ⛔ UI only, not wired up yet

---

## 1. Account & Role-Based Access ✅
This app is counselor-only. Guidance counselors sign in to the dashboard, and they
create anonymized student records from the roster screen. Students do not have a
login or sign-up flow in the deployed app.

## 2. Wristband Pairing ("Connect Device") 🟡
A screen where a student confirms their patient code and "connects" their wristband.
Right now this is a simulated handshake (a timed status change) rather than a real
Bluetooth/WiFi pairing flow — it exists so the rest of the app has a natural entry
point once real pairing is built.

## 3. Live Stress Monitoring Dashboard (Student) ✅ / 🟡
The student's home screen. Shows the most recent stress classification as a
color-coded badge plus a **breathing pulse ring** — a signature visual whose speed
and color track the live reading (slow green at rest, fast red under load), so the
student gets an at-a-glance "how am I doing right now" the same way a smartwatch
would show a heart rate. Also shows the raw HRV/GSR numbers behind that reading and
when they were last updated. A high-stress reading triggers a banner alert.
"Start/Stop Monitoring" is currently a local UI toggle only — see specs.md for what's
missing to make it real.

## 4. Stress History & Trends (Student) ✅
A chart of the student's stress level over time (Calm / Mild / Stress), plus a quick
summary of how many readings were flagged as high stress. Meant to help a student
notice their own patterns between counseling sessions.

## 5. Counselor Roster / Triage List ✅
The counselor's home screen — every student they oversee, each row tinted by that
student's most recent stress level so a counselor can scan a whole caseload and see
who needs attention first, without opening each profile.

Counselors can also add a new student directly from the dashboard using the
Add student button, which creates a student profile with an anonymized patient code.
The form only collects course, college, and age for privacy reasons; no student login account information is collected in the app.

## 6. Student Detail View (Counselor) ✅ / ⛔
Drilling into one student shows their recent stress timeline as a bar strip, their
full classification history, and a form for the counselor to log session notes and
optional recommendations. The scheduling stub has been removed from the UI.

## 7. Sensor Data Ingestion (Wristband → Server) ✅
The ESP32-S3 firmware reads raw PPG (heart-rate sensor) and GSR (skin conductance)
values and streams them to the backend, either one reading at a time or batched
(to save battery/radio use). Each reading is tagged with a `phase`
(`resting` / `interaction` / `post_interaction`) matching the paper's three-phase
data collection protocol.

## 8. Stress Classification Engine 🟡
Turns a student's recent raw readings into one of three labels — Non-Stress, Mild
Stress, Stress. **This is currently a simple threshold rule, not the SVM described in
Chapter 3** (Butterworth filter → NeuroKit2/cvxEDA feature extraction → RBF-kernel
SVM). The rule-based stub exists purely so the rest of the app (dashboards, alerts,
charts) can be built and demoed before the real model is ready. The seam to swap in
the real model is already built — see specs.md.

## 9. Counseling Session Scheduling ⛔
Referenced in the data model (a session can group sensor readings, classifications,
and notes together) and has a "Schedule Session" button in the UI, but there is no
actual scheduling screen, endpoint, or notification flow yet.

## 10. Design System ✅
A dark, glassmorphism-style visual identity (deep navy background, translucent
cards, Fraunces display type + Inter body type) shared across every screen, with the
breathing pulse ring (see #3) as the one signature element tying the wearable's live
signal to the interface itself.

- A mobile-friendly responsive mockup has been created to show how the redesigned
  counselor dashboard can adapt to phone screens, including a fixed left sidebar
  with a URP-style collapsible desktop panel and a mobile app-style hamburger drawer.

## 11. Live Data Simulator ✅
A Python script (`simulate_data_fetch.py`) runs a live sensor simulation against the
backend, posting batched raw readings, triggering `/stress/classify`, and then
fetching the latest classification every few seconds so the counselor view can show
real-time graph motion without a physical device.
