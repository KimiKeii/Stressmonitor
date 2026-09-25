#!/usr/bin/env python3
"""Simulate live sensor data and classification for the counselor app.

This script logs in as the counselor, fetches the student roster, then
continually posts simulated sensor readings and triggers classification.
It also prints the latest live classification for each student.

Run:
    python simulate_data_fetch.py

Environment variables:
    API_BASE_URL, COACH_EMAIL, COACH_PASSWORD,
    SIM_INTERVAL_SECONDS, SIM_BATCH_SIZE, SIM_DURATION_SECONDS,
    SIM_STUDENT_IDS
"""

import json
import os
import random
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional, Tuple

BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:8000/api')
COACH_EMAIL = os.getenv('COACH_EMAIL', 'counselor@ue.edu.ph')
COACH_PASSWORD = os.getenv('COACH_PASSWORD', 'password')
SIM_INTERVAL_SECONDS = int(os.getenv('SIM_INTERVAL_SECONDS', '5'))
SIM_BATCH_SIZE = int(os.getenv('SIM_BATCH_SIZE', '5'))
SIM_DURATION_SECONDS = int(os.getenv('SIM_DURATION_SECONDS', '0'))
SIM_STUDENT_IDS = os.getenv('SIM_STUDENT_IDS', '')

READING_PHASES = ['resting', 'interaction', 'post_interaction']


def build_url(path: str) -> str:
    return urllib.parse.urljoin(BASE_URL.rstrip('/') + '/', path.lstrip('/'))


def api_request(method: str, path: str, token: Optional[str] = None, payload: Optional[Dict[str, Any]] = None):
    url = build_url(path)
    data = None
    headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    }
    if token:
        headers['Authorization'] = f'Bearer {token}'

    if payload is not None:
        data = json.dumps(payload).encode('utf-8')

    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            body = res.read().decode('utf-8')
            if not body:
                return None
            return json.loads(body)
    except urllib.error.HTTPError as http_err:
        error_body = http_err.read().decode('utf-8')
        print(f'HTTP {http_err.code} {http_err.reason} for {method} {path}')
        if error_body:
            try:
                print(json.dumps(json.loads(error_body), indent=2))
            except ValueError:
                print(error_body)
        raise
    except urllib.error.URLError as url_err:
        raise RuntimeError(f'Failed to reach {url}: {url_err}') from url_err


def login(email: str, password: str) -> Tuple[str, Dict[str, Any]]:
    print(f'Logging in as counselor: {email}')
    payload = {'email': email, 'password': password}
    data = api_request('POST', '/login', payload=payload)
    if not isinstance(data, dict):
        raise RuntimeError('Unexpected login response format')
    token = data.get('token')
    user = data.get('user')
    if not token:
        raise RuntimeError('No auth token received from /login')
    print('Login successful. Token received.')
    return token, user


def fetch_students(token: str) -> List[Dict[str, Any]]:
    print('Fetching student roster...')
    students = api_request('GET', '/students', token=token)
    if not isinstance(students, list):
        raise RuntimeError('Expected a list of students')
    print(f'Found {len(students)} student record(s).')
    return students


def fetch_history(token: str, student_id: int) -> List[Dict[str, Any]]:
    history = api_request('GET', f'/students/{student_id}/stress/history', token=token)
    if not isinstance(history, list):
        raise RuntimeError('Expected a list of stress history entries')
    return history


def fetch_latest(token: str, student_id: int) -> Optional[Dict[str, Any]]:
    return api_request('GET', f'/students/{student_id}/stress/latest', token=token)


def post_sensor_batch(token: str, student_id: int, batch: List[Dict[str, Any]]) -> int:
    response = api_request('POST', '/sensor-readings/batch', token=token, payload={
        'student_id': student_id,
        'phase': batch[0].get('phase', 'resting'),
        'readings': [
            {
                'ppg_raw': item['ppg_raw'],
                'gsr_raw': item['gsr_raw'],
                'heart_rate_bpm': item['heart_rate_bpm'],
                'recorded_at': item['recorded_at'],
            }
            for item in batch
        ],
    })
    if not isinstance(response, dict) or 'inserted' not in response:
        raise RuntimeError('Unexpected batch response format')
    return int(response['inserted'])


def classify_student(token: str, student_id: int, session_id: Optional[int] = None) -> Dict[str, Any]:
    payload: Dict[str, Any] = {'student_id': student_id}
    if session_id is not None:
        payload['session_id'] = session_id
    response = api_request('POST', '/stress/classify', token=token, payload=payload)
    if not isinstance(response, dict):
        raise RuntimeError('Unexpected classify response format')
    return response


def format_level(level: Optional[str]) -> str:
    if not level:
        return 'unknown'
    return level.replace('_', ' ').title()


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def baseline_for_student(student_id: int) -> Dict[str, float]:
    random.seed(student_id)
    return {
        'gsr': random.uniform(0.18, 0.35),
        'hr': random.uniform(70, 80),
    }


def make_simulator_state(student_id: int) -> Dict[str, Any]:
    baseline = baseline_for_student(student_id)
    return {
        'student_id': student_id,
        'phase': random.choice(READING_PHASES),
        'stress_state': 'non_stress',
        'baseline': baseline,
        'current_gsr': baseline['gsr'],
        'current_hr': baseline['hr'],
        'step': 0,
    }


def advance_state(state: Dict[str, Any]) -> None:
    state['step'] += 1
    drift = random.uniform(-0.03, 0.03)
    state['current_gsr'] = max(0.05, state['current_gsr'] + drift + random.uniform(-0.01, 0.01))
    state['current_hr'] = max(55, state['current_hr'] + random.uniform(-2.5, 2.5))

    if state['step'] % 3 == 0:
        current = state['stress_state']
        roll = random.random()
        if current == 'non_stress':
            if state['current_gsr'] > 0.55 or state['current_hr'] > 92:
                state['stress_state'] = 'mild_stress'
            elif roll < 0.15:
                state['stress_state'] = 'mild_stress'
        elif current == 'mild_stress':
            if state['current_gsr'] > 0.8 or state['current_hr'] > 105:
                state['stress_state'] = 'stress'
            elif roll < 0.3:
                state['stress_state'] = 'non_stress'
        else:
            if state['current_gsr'] < 0.6 and state['current_hr'] < 95:
                state['stress_state'] = 'mild_stress'
            elif roll < 0.25:
                state['stress_state'] = 'mild_stress'
        if random.random() < 0.4:
            state['phase'] = random.choice(READING_PHASES)


def generate_batch(state: Dict[str, Any], batch_size: int) -> List[Dict[str, Any]]:
    stress_state = state['stress_state']
    phase = state['phase']
    batch: List[Dict[str, Any]] = []
    for idx in range(batch_size):
        timestamp = datetime.now(timezone.utc) - timedelta(seconds=(batch_size - idx - 1))
        if stress_state == 'non_stress':
            gsr = max(0.12, state['current_gsr'] + random.uniform(-0.04, 0.05))
            hr = max(60, state['current_hr'] + random.uniform(-4, 4))
        elif stress_state == 'mild_stress':
            gsr = max(0.35, state['current_gsr'] + random.uniform(-0.05, 0.06))
            hr = max(76, state['current_hr'] + random.uniform(-5, 5))
        else:
            gsr = max(0.65, state['current_gsr'] + random.uniform(-0.07, 0.08))
            hr = max(90, state['current_hr'] + random.uniform(-6, 6))

        batch.append({
            'student_id': state['student_id'],
            'session_id': None,
            'phase': phase,
            'ppg_raw': round(random.uniform(800, 1100), 1),
            'gsr_raw': round(gsr, 3),
            'heart_rate_bpm': round(hr, 1),
            'recorded_at': timestamp.isoformat(),
        })

    return batch


def render_summary(student: Dict[str, Any], latest: Optional[Dict[str, Any]], inserted: int) -> str:
    if latest is None:
        return f"Student {student['id']}: inserted={inserted}, latest=none"
    level = format_level(latest.get('stress_level'))
    classified_at = latest.get('classified_at') or 'unknown'
    source = latest.get('source', 'unknown')
    return (
        f"Student {student['id']} ({student.get('patient_code', 'N/A')}): "
        f"inserted={inserted}, latest={level} @ {classified_at}, source={source}"
    )


def main() -> None:
    print('Live sensor data simulator for counselor app')
    print('-------------------------------------------')
    print(f'API_BASE_URL={BASE_URL}')
    print(f'SIM_INTERVAL_SECONDS={SIM_INTERVAL_SECONDS} SIM_BATCH_SIZE={SIM_BATCH_SIZE}')
    if SIM_DURATION_SECONDS:
        print(f'SIM_DURATION_SECONDS={SIM_DURATION_SECONDS}')
    if SIM_STUDENT_IDS:
        print(f'SIM_STUDENT_IDS={SIM_STUDENT_IDS}')
    print()

    token, user = login(COACH_EMAIL, COACH_PASSWORD)
    print(f"Counselor: {user.get('email')} (role={user.get('role')})")
    print()

    students = fetch_students(token)
    if not students:
        print('No student records available yet.')
        return

    if SIM_STUDENT_IDS:
        allowed_ids = {int(x.strip()) for x in SIM_STUDENT_IDS.split(',') if x.strip().isdigit()}
        students = [s for s in students if s.get('id') in allowed_ids]
        if not students:
            print('No matching students found for SIM_STUDENT_IDS.')
            return

    states = {student['id']: make_simulator_state(student['id']) for student in students}

    print('Initial student history summary:')
    for student in students:
        history = fetch_history(token, int(student['id']))
        print(
            f"  Student {student['id']} ({student.get('patient_code', 'N/A')}): "
            f"history={len(history)}, latest={format_level(history[0].get('stress_level')) if history else 'none'}"
        )

    print('\nStarting live data stream. Press Ctrl-C to stop.\n')

    start_time = time.monotonic()
    iteration = 0
    while True:
        iteration += 1
        for student in students:
            state = states[student['id']]
            batch = generate_batch(state, SIM_BATCH_SIZE)
            try:
                inserted = post_sensor_batch(token, state['student_id'], batch)
            except Exception as exc:
                print(f'ERROR posting batch for student {student["id"]}: {exc}')
                continue

            try:
                classify_student(token, state['student_id'])
                latest = fetch_latest(token, state['student_id'])
            except Exception as exc:
                print(f'ERROR classifying/fetching latest for student {student["id"]}: {exc}')
                latest = None

            print(render_summary(student, latest, inserted))
            advance_state(state)

        if SIM_DURATION_SECONDS and time.monotonic() - start_time >= SIM_DURATION_SECONDS:
            print('\nSimulation duration complete.')
            break

        iteration += 1
        time.sleep(SIM_INTERVAL_SECONDS)


if __name__ == '__main__':
    main()
