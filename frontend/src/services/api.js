const API_BASE = 'http://localhost:8000';

export async function fetchState() {
  const res = await fetch(`${API_BASE}/simulation/state`);
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return res.json();
}

export async function startSimulation() {
  const res = await fetch(`${API_BASE}/simulation/start`, { method: 'POST' });
  return res.json();
}

export async function pauseSimulation() {
  const res = await fetch(`${API_BASE}/simulation/pause`, { method: 'POST' });
  return res.json();
}

export async function resumeSimulation() {
  const res = await fetch(`${API_BASE}/simulation/resume`, { method: 'POST' });
  return res.json();
}

export async function resetSimulation() {
  const res = await fetch(`${API_BASE}/simulation/reset`, { method: 'POST' });
  return res.json();
}

export async function configureSimulation(config) {
  const res = await fetch(`${API_BASE}/simulation/configure`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  return res.json();
}

export async function setSpeed(speed) {
  const res = await fetch(`${API_BASE}/simulation/speed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ speed })
  });
  return res.json();
}

export async function triggerRaceCondition() {
  const res = await fetch(`${API_BASE}/simulation/trigger/race-condition`, { method: 'POST' });
  return res.json();
}

export async function triggerDeadlock() {
  const res = await fetch(`${API_BASE}/simulation/trigger/deadlock`, { method: 'POST' });
  return res.json();
}

export async function recoverDeadlock() {
  const res = await fetch(`${API_BASE}/simulation/recover/deadlock`, { method: 'POST' });
  return res.json();
}

export async function triggerStarvation() {
  const res = await fetch(`${API_BASE}/simulation/trigger/starvation`, { method: 'POST' });
  return res.json();
}

export async function fetchPresets() {
  const res = await fetch(`${API_BASE}/presets`);
  return res.json();
}

export async function loadPreset(presetId) {
  const res = await fetch(`${API_BASE}/presets/${presetId}/load`, { method: 'POST' });
  return res.json();
}

export async function fetchComparisonResults() {
  const res = await fetch(`${API_BASE}/experiment/results`);
  return res.json();
}

export async function runComparisonSuite(robotCount = 5, iterations = 4) {
  const res = await fetch(`${API_BASE}/experiment/run-suite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ robot_count: robotCount, task_iterations_per_robot: iterations })
  });
  return res.json();
}
