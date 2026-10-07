# 🏭 Warehouse OS: Concurrent Robot Coordination & Process Synchronization
> **A Beginner-Friendly, Visual Guide to Real Operating Systems Concepts**

---

## 💡 What is this project in simple words?

Imagine an automated warehouse where 5 robots are zooming around picking up packages, charging their batteries, and delivering items to loading docks. 

Now, imagine what happens if:
- Two robots try to enter a tight 1-robot corridor at the exact same second? 💥 **Crash!**
- Robot A is waiting for Robot B to move, but Robot B is waiting for Robot A? 🛑 **Traffic Jam (Nobody can move)!**
- Big emergency robots always get served first, leaving a small delivery robot waiting forever? ⏳ **Starvation!**

In computer science, **computers face this exact same problem every day**. Programs have multiple threads and processes trying to use the same CPU, RAM, or files at once.

This project uses an **interactive, animated warehouse simulation** to turn abstract Operating System (OS) textbook theories into something you can **see with your own eyes** on screen.

---

## 🔄 The "Warehouse to Operating System" Cheat Sheet

Whenever you look at the screen, here is how the warehouse translates to computer science:

| What you see in the Warehouse | What it means in an Operating System | Why it matters |
| :--- | :--- | :--- |
| 🤖 **Robot (R01, R02...)** | **Process / Concurrent Thread** | An independent worker running tasks at the same time as others. |
| 🚪 **Narrow Corridor / Bay** | **Shared Resource / Critical Section** | A restricted piece of hardware or memory that only a few can use. |
| 💥 **Two robots in 1 slot** | **Race Condition / State Corruption** | When two threads write data simultaneously and break things. |
| 🚦 **Corridor Entry Lock** | **Mutex (Mutual Exclusion Lock)** | A "key" to the door: only 1 robot can hold it; others must wait outside. |
| 🎟️ **Charging Dock (2 slots)** | **Counting Semaphore** | A bucket of tickets: up to $N$ robots can enter until tickets run out. |
| 🧍‍♂️ **Robots waiting in line** | **Waiting Queue (Condition Variable)** | Threads put to sleep until someone calls "Your turn!" |
| 🔄 **Circular Traffic Jam** | **Deadlock** | Robot 1 holds Resource A and wants B; Robot 2 holds B and wants A. |
| ⏳ **Low-priority robot ignored** | **Starvation** | A low-priority thread never gets CPU time because high-priority tasks keep jumping the queue. |
| 📈 **Giving older robots a boost** | **Priority Aging** | Automatically promoting a waiting robot's priority so it finally gets served. |

---

## 🛠️ How It Works Under The Hood

* **Real Python Concurrency (Not Fake!)**: The backend isn't just faking delays. It spins up real Python worker threads using Python's native `threading.Lock`, `threading.Semaphore`, and `threading.Condition`.
* **High-Speed Live Communication**: The backend streams the warehouse state to the frontend 10 times every second using **WebSockets** (`ws://localhost:8000/ws`).
* **Visual Dashboard**: Built with React 19, Tailwind CSS v4, and SVG, showing moving robots, wait queues, resource slots, live graphs, and real-time conflict logs.

---

## 🚀 How to Run the Project (Step-by-Step)

### 1. Prerequisites
Make sure you have installed on your computer:
- **Python 3.10+** (Tested on Python 3.12/3.13)
- **Node.js 18+** & npm

---

### 2. Start the Backend (API Server)
Open your terminal inside the project root folder:
```powershell
# Navigate to the project root
cd "Ware-House-Operating-system"

# Start the FastAPI server
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
✅ **Check that it works**: Open [http://localhost:8000/health](http://localhost:8000/health) in your browser. You should see `status: healthy`.

---

### 3. Start the Frontend (Visual Dashboard)
Open a **second terminal** window:
```powershell
# Navigate into the frontend folder
cd "Ware-House-Operating-system/frontend"

# Install packages (only needed the first time)
npm install

# Start the UI dev server
npm run dev
```
✅ **Open the app**: Click or open [http://localhost:5173](http://localhost:5173) in your browser!

---

## 🎮 What to Try: 5 Cool Demonstrations

Once the app is open on your screen, try these experiments:

### 1️⃣ The "Chaos" Experiment (Race Conditions)
1. In the top bar, click **Configure** and choose **No Synchronization**.
2. Click **Start Simulation**.
3. **What happens:** Multiple robots charge into single-capacity corridors at the exact same moment. 
4. **Result:** Red warnings flash on screen, and the **Conflicts & Race Conditions** counter spikes rapidly. This shows why synchronization locks are mandatory!

---

### 2️⃣ The "Orderly Queue" Experiment (Mutex / Lock)
1. Click **Reset**, then select **Mutex / Lock**.
2. Click **Start Simulation**.
3. **What happens:** Only **one** robot is allowed into the corridor at a time. Other robots wait politely in the queue based on their priority.
4. **Result:** Exactly **zero** conflicts occur. Everything is safe and synchronized.

---

### 3️⃣ The "Ticket Gate" Experiment (Counting Semaphore)
1. Select **Counting Semaphore** (Capacity = 2).
2. Click **Start Simulation**.
3. **What happens:** The system allows up to **2** robots to enter simultaneously (e.g., two charging slots). When a third robot arrives, it is forced to wait until one of the first two leaves and releases a permit.

---

### 4️⃣ The "Stalemate" (Deadlock & Victim Recovery)
1. Go to the **OS Concept Demonstrations** tab.
2. Click **Trigger Deadlock**.
3. **What happens:**
   - Robot R01 locks Corridor 1 and waits for Loading Bay 1.
   - Robot R02 locks Loading Bay 1 and waits for Corridor 1.
   - Neither can move! Both flash red in the **BLOCKED** state.
   - A visual **Wait-For Graph (Cycle)** appears showing the circular wait condition.
4. Click **Recover Deadlock (Preempt Victim)**.
5. **What happens:** The algorithm finds the lower-priority robot, cancels its lock, moves it out of the way, and lets the other robot proceed!

---

### 5️⃣ The "Fairness" Experiment (Starvation & Priority Aging)
1. In **OS Concept Demonstrations**, click **Trigger Starvation**.
2. Robot R05 has **Low Priority (1)**, while new emergency robots with **High Priority (4 or 5)** keep jumping ahead of it.
3. R05 is stuck waiting and turns yellow/orange with a **Starvation Warning**.
4. Watch the **Aging Algorithm** kick in: as R05 waits, its priority level automatically increases:
   $$\text{Low (1)} \rightarrow \text{Normal (2)} \rightarrow \text{High (3)} \rightarrow \text{Emergency (5)}$$
5. Once elevated, R05 moves to the front of the line and gets served, proving that **aging guarantees bounded waiting**.

---

### 6️⃣ The "Technique Comparison" Suite
1. Navigate to the **Technique Comparison** tab.
2. Click **Run Experiment Suite**.
3. The system runs an identical workload through all four modes and charts them side-by-side:
   - **No Synchronization**: Fastest, but full of errors and collisions.
   - **Mutex**: Zero collisions, but longer wait times.
   - **Semaphore**: Zero collisions, higher throughput for multi-slot resources.
   - **Mutex + Semaphore**: Optimal real-world balance.

---

## 🧪 Running Automated Tests

Want to verify all algorithms using automated code tests? Run:
```powershell
python -m pytest tests/test_backend.py -v
```
You will see 6 passing tests:
1. `test_no_synchronization_detects_race_conditions` ✅
2. `test_mutex_enforces_mutual_exclusion` ✅
3. `test_semaphore_respects_capacity` ✅
4. `test_deadlock_detection_and_recovery` ✅
5. `test_starvation_and_priority_aging` ✅
6. `test_simulation_engine_lifecycle` ✅

---

## 🎓 Exam & Viva Quick Revision (Q&A)

### Q1: What is a Critical Section?
> **Answer:** A critical section is a part of code that accesses a shared resource (like shared memory, files, or a 1-lane corridor) that must not be accessed by more than one process at the same time.

### Q2: What is the difference between a Mutex and a Semaphore?
> **Answer:**
> - **Mutex (Binary Lock):** Has a capacity of 1. It has strict ownership—only the process that locked it is allowed to unlock it.
> - **Counting Semaphore:** Has a counter of $N$ permits ($N \ge 1$). Any thread can acquire or release a permit, allowing up to $N$ processes simultaneous access.

### Q3: What are Coffman's 4 Conditions for Deadlock?
> **Answer:** Deadlock can only happen if all 4 conditions exist simultaneously:
> 1. **Mutual Exclusion:** Resources cannot be shared at the same time.
> 2. **Hold and Wait:** A process holds one resource while waiting for another.
> 3. **No Preemption:** A resource cannot be taken away forcibly; it must be released voluntarily.
> 4. **Circular Wait:** Process A waits for Process B, which waits for Process A.

### Q4: How does this project detect and break deadlocks?
> **Answer:**
> - **Detection:** It builds a **Wait-For Graph (WFG)** and runs Depth-First Search (DFS) to find circular cycles.
> - **Recovery:** It selects a "victim" process (usually the lowest priority), preempts its resource, returns it to the ready state, and unblocks the remaining process.

### Q5: What is Starvation, and how does Aging solve it?
> **Answer:**
> - **Starvation (Indefinite Postponement):** When low-priority processes wait forever because high-priority processes keep arriving and taking resources.
> - **Aging:** A timer tracks how long a process has been waiting. If it waits too long, its priority is gradually increased until it reaches the front of the queue.

---

## 📁 File Structure at a Glance

```text
Ware-House-Operating-system/
├── backend/
│   ├── main.py                     # FastAPI app & WebSocket streamer
│   ├── api/                        # REST routes (start, pause, reset, presets, suite)
│   ├── core/
│   │   ├── simulation_engine.py    # Main multi-threaded engine loop
│   │   ├── synchronization_manager.py # Real Mutex and Semaphore primitives
│   │   ├── deadlock_manager.py     # Graph cycle detector & victim preemptor
│   │   ├── starvation_manager.py   # Wait timer & priority aging elevator
│   │   └── resource_manager.py     # Corridors, bays, and charging docks
│   └── models/                     # Data definitions (Robot, Task, Resource)
├── frontend/
│   ├── src/
│   │   ├── App.jsx                 # Dashboard layout & navigation
│   │   ├── components/             # Visual monitors (WarehouseView, EventLog, etc.)
│   │   ├── hooks/useSimulation.js  # Live WebSocket hook
│   │   └── services/api.js         # REST API fetch calls
│   └── package.json
└── tests/
    └── test_backend.py             # 6 Pytest automated validation tests
```
