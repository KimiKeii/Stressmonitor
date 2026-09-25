/*
 * Wristband Stress Monitor — ESP32-S3 firmware (stub)
 *
 * Reads raw PPG (MAX30102) and GSR (Grove) samples and POSTs them, batched, to the
 * Laravel API's /sensor-readings/batch endpoint. Intentionally does NOT filter,
 * extract features, or classify anything on-device — all of that stays server-side
 * (and eventually in the Python ml-service) so the microcontroller stays lightweight
 * and the battery lasts.
 *
 * Libraries needed (Arduino IDE > Library Manager):
 *   - MAX30105 by SparkFun (works with MAX30102)
 *   - ArduinoJson
 *   - WiFi (bundled with ESP32 board package)
 *   - HTTPClient (bundled with ESP32 board package)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include "MAX30105.h"

// ---- Configuration ----
const char *WIFI_SSID = "YOUR_WIFI_SSID";
const char *WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char *API_BASE_URL = "http://192.168.1.100:8000/api"; // your Laravel host, LAN IP while prototyping

const int STUDENT_ID = 1;          // matches a seeded student user's id for now
const int GSR_PIN = A0;            // Grove GSR sensor analog pin
const int BATCH_SIZE = 20;         // samples buffered before a single HTTP POST
const unsigned long SAMPLE_INTERVAL_MS = 200; // ~5 Hz, matches paper's real-time monitoring intent

MAX30105 ppgSensor;

struct Sample {
  float ppgRaw;
  float gsrRaw;
  float heartRateBpm;
  unsigned long millisAtCapture;
};

Sample buffer[BATCH_SIZE];
int bufferIndex = 0;
unsigned long lastSampleAt = 0;

void connectWifi() {
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(400);
    Serial.print(".");
  }
  Serial.println("\nConnected. IP: " + WiFi.localIP().toString());
}

void setup() {
  Serial.begin(115200);
  connectWifi();

  Wire.begin();
  if (!ppgSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("MAX30102 not found — check wiring.");
  }
  ppgSensor.setup(); // default sensor configuration; tune sample rate/LED power later

  pinMode(GSR_PIN, INPUT);
}

float readHeartRateEstimate() {
  // Placeholder: SparkFun's library exposes raw IR/RED values; a real heart-rate
  // estimate needs peak detection (Pan-Tompkins-style, per Ch.3) which will live
  // server-side once the ml-service exists. For now this just returns the raw IR
  // reading scaled down so the dashboard has *something* numeric to show.
  long irValue = ppgSensor.getIR();
  return irValue / 1000.0;
}

void captureSample() {
  Sample s;
  s.ppgRaw = ppgSensor.getIR();
  s.gsrRaw = analogRead(GSR_PIN) / 4095.0; // normalize 12-bit ADC to 0-1
  s.heartRateBpm = readHeartRateEstimate();
  s.millisAtCapture = millis();

  buffer[bufferIndex++] = s;

  if (bufferIndex >= BATCH_SIZE) {
    sendBatch();
    bufferIndex = 0;
  }
}

void sendBatch() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi dropped — skipping batch send.");
    return;
  }

  HTTPClient http;
  http.begin(String(API_BASE_URL) + "/sensor-readings/batch");
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<4096> doc;
  doc["student_id"] = STUDENT_ID;
  doc["phase"] = "resting"; // swap to "interaction" / "post_interaction" based on session state
  JsonArray readings = doc.createNestedArray("readings");

  unsigned long nowEpochMs = millis(); // replace with NTP-synced time for real recorded_at values
  for (int i = 0; i < bufferIndex; i++) {
    JsonObject r = readings.createNestedObject();
    r["ppg_raw"] = buffer[i].ppgRaw;
    r["gsr_raw"] = buffer[i].gsrRaw;
    r["heart_rate_bpm"] = buffer[i].heartRateBpm;
    r["recorded_at"] = "2026-01-01T00:00:00Z"; // TODO: use a real RTC/NTP timestamp
  }

  String payload;
  serializeJson(doc, payload);

  int statusCode = http.POST(payload);
  Serial.printf("Batch sent (%d samples) -> HTTP %d\n", bufferIndex, statusCode);
  http.end();
}

void loop() {
  unsigned long now = millis();
  if (now - lastSampleAt >= SAMPLE_INTERVAL_MS) {
    lastSampleAt = now;
    captureSample();
  }
}
