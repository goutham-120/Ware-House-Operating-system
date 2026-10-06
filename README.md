# Warehouse Operating System: Concurrent Robot Coordination and Process Synchronization

An academic **Operating Systems** project demonstrating **Process Synchronization**, **Resource Allocation**, **Race Conditions**, **Mutual Exclusion**, **Counting Semaphores**, **Deadlock Detection & Recovery**, and **Starvation Prevention via Priority Aging** through a simulated automated warehouse.

---

## 1. Project Objective & Academic Mapping

In real operating systems, processes and threads execute concurrently, competing for limited hardware and memory resources. Without proper synchronization primitives, race conditions, deadlocks, and starvation can corrupt data or freeze the system.

This project maps core Operating System primitives to an automated warehouse:

| Warehouse Entity | Operating System Equivalent | Academic Concept |
| :--- | :--- | :--- |
| **Virtual Robot** | **Process / Concurrent Thread** | Autonomous execution unit performing tasks and state transitions |
| **Warehouse Structure** (Bay, Corridor, Station) | **Shared Resource / Critical Section** | Hardware devices, memory buffers, or I/O channels requiring concurrency control |
| **Simultaneous Entry Conflict** | **Race Condition / State Inconsistency** | Unsafe concurrent read-modify-write without mutual exclusion |
| **Narrow Corridor Entry Lock** | **Mutex / Binary Lock** (`threading.Lock`) | Guarantees mutual exclusion (only 1 thread can enter at a time) |
| **Multi-Slot Zone Permits** | **Counting Semaphore** (`threading.Semaphore`) | Bounded access to resources with capacity $N > 1$ |
| **Robots in Wait Line** | **Waiting Queue** (`threading.Condition`) | Blocked threads yielding execution until notified |
| **Circular Mutual Blocking** | **Deadlock** | Circular wait condition over the Resource Allocation Graph (RAG) |
| **Low-Priority Stalling** | **Starvation (Indefinite Postponement)** | High-priority threads monopolizing resources |
| **Priority Elevation over Time** | **Priority Aging** | Mitigating starvation by dynamically bumping priority |

---

## 2. Technology Stack

* **Backend:**
  * Python 3.12
  * **FastAPI** — High-performance REST API for simulation configuration, triggers, and benchmarks
  * **Uvicorn** — ASGI production server
  * **Python `threading`** — Real execution units (`Thread`), genuine primitives (`Lock`, `Semaphore`, `Condition`, `Event`)
  * **Pydantic v2** — Data models and validation
* **Frontend:**
  * **React 19** + **Vite**
  * Pure **JavaScript / JSX** (minimal, clean, and viva-ready)
  * **Tailwind CSS v4** — Dark system palette (navy, slate, cyan, green, and red alerts)
  * **HTML5 Canvas / SVG** — Real-time 2D warehouse layout with animated process units
  * **Recharts** — KPI metrics and time-series analytics charts
  * **Lucide React** — Clean systems iconography
* **Communication:**
  * Native **WebSocket** (`/ws`) streaming simulation states at ~10 Hz (100ms intervals)

---

## 3. Project Directory Structure

```text
OS-caseStudy/
├── backend/
│   ├── main.py                          # FastAPI server, WebSocket broadcaster, routes mounting
│   ├── models/                          # Pydantic data schemas
│   │   ├── robot.py                     # Robot process state, battery, priority models
│   │   ├── task.py                      # Workload tasks and lifecycle
│   │   ├── resource.py                  # Resource models, capacities, queues
│   │   └── simulation.py                # Simulation configs, event logs, metrics
│   ├── core/                            # Core OS simulation subsystems
│   │   ├── synchronization_manager.py   # Real Lock, Semaphore, No-Sync implementations
│   │   ├── resource_manager.py          # Warehouse resources and slot occupancy
│   │   ├── task_manager.py              # Workload task generator
│   │   ├── deadlock_manager.py          # Wait-For Graph (WFG) cycle detection & victim recovery
│   │   ├── starvation_manager.py        # Wait timer monitoring & priority aging
│   │   ├── metrics_manager.py           # Aggregate KPIs and time-series collector
│   │   └── simulation_engine.py         # Thread orchestrator and simulation loops
│   ├── api/                             # REST API endpoints
│   │   ├── simulation_routes.py         # /simulation/start, /pause, /reset, /triggers
│   │   ├── preset_routes.py             # /presets (1-click scenarios)
│   │   └── experiment_routes.py         # /experiment/run-suite (identical workload comparison)
│   └── websocket/
│       └── manager.py                   # WebSocket connection pool and broadcasts
├── frontend/
│   ├── src/
│   │   ├── App.jsx                      # Main dashboard layout
│   │   ├── index.css                    # Tailwind CSS v4 design tokens
│   │   ├── components/
│   │   │   ├── Header.jsx               # Control bar, speed selector, tabs
│   │   │   ├── SummaryCards.jsx         # Live KPI metric cards
│   │   │   ├── WarehouseView.jsx        # 2D SVG warehouse floor layout
│   │   │   ├── RobotMonitor.jsx         # Robot process thread monitor (table/cards)
│   │   │   ├── ResourceAndSyncMonitor.jsx # Resource capacity & synchronization primitives
│   │   │   ├── DemonstrationMode.jsx    # 1-click demos, deadlock cycle & recovery
│   │   │   ├── TechniqueComparison.jsx  # Empirical benchmark suite & charts
│   │   │   ├── PerformanceAnalytics.jsx # Recharts time-series analytics
│   │   │   ├── EventLog.jsx             # Filterable and searchable OS event log
│   │   │   ├── SimulationConfigModal.jsx# Workload configuration modal
│   │   │   └── VivaGuide.jsx            # OS theory and viva Q&A cheat sheet
│   │   ├── hooks/
│   │   │   └── useSimulation.js         # Real-time WebSocket hook with fallback polling
│   │   └── services/
│   │       └── api.js                   # REST API client
│   ├── vite.config.js
│   └── package.json
├── tests/
│   └── test_backend.py                  # Pytest verification for synchronization, deadlock, & aging
└── README.md
```

---

## 4. How to Run the Application

### Prerequisites
* Python 3.10+ (tested on Python 3.12)
* Node.js v18+ & npm

### A. Start the Backend
1. Open a terminal in `OS-caseStudy`:
   ```bash
   python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
   ```
2. Verify backend health by opening `http://localhost:8000/health` in your browser.

### B. Start the Frontend
1. Open a second terminal in `OS-caseStudy/frontend`:
   ```bash
   npm run dev
   ```
2. Open the URL displayed in the terminal (typically `http://localhost:5173`) in your browser.

---

## 5. Demonstration Walkthrough (Step-by-Step for Viva)

### Step 1: Demonstrate Race Condition (No Synchronization)
1. In the top bar, click **CONFIGURE** (or navigate to **OS Concept Demonstrations**).
2. Select **Preset: 2. Race Condition Demo** (or set Synchronization Technique to `No Synchronization` with 5 robots competing for a single-capacity corridor).
3. Click **START SIMULATION**.
4. **Observation:** Multiple robot threads enter the single-capacity corridor simultaneously. The UI highlights **RACE CONDITION DETECTED**, and the **CONFLICTS** counter increases rapidly in the summary cards and event log.

### Step 2: Demonstrate Mutual Exclusion (Mutex / Lock)
1. Click **RESET**, then load **Preset: 3. Mutex Demo**.
2. Click **START SIMULATION**.
3. **Observation:** Exactly one robot acquires the lock and enters the critical section. Subsequent robots enter the **WAITING** state and queue up in priority order. When the active robot finishes, it releases the lock and wakes the next waiter. Zero race conditions occur.

### Step 3: Demonstrate Counting Semaphore
1. Load **Preset: 4. Semaphore Demo** (Corridor capacity = 2).
2. Click **START SIMULATION**.
3. **Observation:** Exactly two robots access the corridor concurrently (`active_holders = 2`, `available_permits = 0`). A 3rd robot is queued. When one robot finishes, the permit is returned and the 3rd robot enters immediately.

### Step 4: Demonstrate Deadlock & Recovery
1. Navigate to the **OS Concept Demonstrations** tab.
2. Click **TRIGGER DEADLOCK**.
3. **Observation:**
   * Robot R01 holds the Corridor (`NC-01`) and requests the Loading Bay (`LB-01`).
   * Robot R02 holds the Loading Bay (`LB-01`) and requests the Corridor (`NC-01`).
   * The Deadlock Manager detects a circular wait in the Wait-For Graph:
     $$\text{R01} \rightarrow \text{LB-01} \rightarrow \text{R02} \rightarrow \text{NC-01} \rightarrow \text{R01}$$
   * Both robots transition to the **BLOCKED** state with red pulsing indicators.
4. Click **RECOVER DEADLOCK (PREEMPT VICTIM)**.
5. **Observation:** The system selects the lower-priority victim, preempts its held resource, resets it to `READY`, and allocates the freed resource to the unblocked beneficiary. Execution resumes smoothly.

### Step 5: Demonstrate Starvation Prevention (Priority Aging)
1. In the **OS Concept Demonstrations** tab, click **TRIGGER STARVATION**.
2. Robot R05 (Priority 1 - Low) is placed in the waiting queue while high-priority robots (Emergency P5 / High P4) acquire resources.
3. Once R05's waiting time exceeds the starvation threshold (e.g., 5.0 seconds), a **STARVATION WARNING** is raised.
4. Priority Aging elevates R05's priority:
   $$\text{Low (1)} \rightarrow \text{Normal (2)} \rightarrow \text{High (3)} \rightarrow \text{Emergency (5)}$$
5. With elevated priority, R05 moves to the front of the queue and acquires the resource, preventing indefinite postponement.

### Step 6: Compare All 4 Techniques
1. Navigate to the **Technique Comparison** tab.
2. Click **RUN EXPERIMENT SUITE**.
3. An identical test workload runs across all 4 modes under identical conditions.
4. An empirical comparison matrix and bar charts display:
   * **No Synchronization:** High conflicts, corrupted resource ownership.
   * **Mutex:** Zero conflicts, strict mutual exclusion, higher average wait time.
   * **Semaphore:** Zero conflicts, high throughput for multi-slot resources.
   * **Mutex + Semaphore:** Balanced protection and concurrency.

---

## 6. Running Automated Tests

To run the backend test suite verifying all synchronization primitives, deadlock detection, and priority aging:

```bash
python -m pytest tests/test_backend.py -v
```

All 6 test cases verify that:
1. `test_no_synchronization_detects_race_conditions` passes.
2. `test_mutex_enforces_mutual_exclusion` passes.
3. `test_semaphore_respects_capacity` passes.
4. `test_deadlock_detection_and_recovery` passes.
5. `test_starvation_and_priority_aging` passes.
6. `test_simulation_engine_lifecycle` passes.

---

## 7. Viva Cheat Sheet: Key OS Concepts

* **Critical Section:** A segment of code accessing shared resources that must not be concurrently accessed by more than one process.
* **Three Requirements for Critical Section Problem:**
  1. **Mutual Exclusion:** Only one process can execute in its critical section at a time.
  2. **Progress:** Selection of the next process to enter cannot be postponed indefinitely.
  3. **Bounded Waiting:** A bound exists on how many times other processes can enter before a requesting process is granted entry.
* **Coffman's 4 Conditions for Deadlock:**
  1. Mutual Exclusion
  2. Hold and Wait
  3. No Preemption
  4. Circular Wait
