import React from 'react';
import { BookOpen, CheckCircle2, ShieldAlert, Cpu, HelpCircle } from 'lucide-react';

export const VivaGuide = () => {
  const mappings = [
    { warehouse: 'Autonomous Robot', os: 'Process / Concurrent Worker Thread', desc: 'Active execution unit performing state transitions and requesting resources' },
    { warehouse: 'Narrow Corridor / Docking Bay', os: 'Shared Hardware Resource / Critical Section', desc: 'Limited capacity structure requiring synchronization' },
    { warehouse: 'Simultaneous entry collision', os: 'Race Condition / Data Inconsistency', desc: 'Occurs when multiple processes write/enter shared state without locks' },
    { warehouse: 'Corridor Single Entry Guard', os: 'Mutex / Binary Lock (threading.Lock)', desc: 'Guarantees strict mutual exclusion for 1 process at a time' },
    { warehouse: 'Multi-slot Bay Allocation', os: 'Counting Semaphore (threading.Semaphore)', desc: 'Controls bounded access up to capacity N permits' },
    { warehouse: 'Robot waiting in line', os: 'Process Waiting Queue (Condition Variable)', desc: 'Thread yields CPU and sleeps on condition variable until notified' },
    { warehouse: 'Two robots mutually blocking paths', os: 'Deadlock (Coffman Circular Wait)', desc: 'Two or more processes cycle-waiting for resources held by each other' },
    { warehouse: 'Low priority robot waiting forever', os: 'Process Starvation', desc: 'Higher priority threads repeatedly monopolize shared bottlenecks' },
    { warehouse: 'Bumping low priority over time', os: 'Priority Aging (Aging Algorithm)', desc: 'Incrementing priority proportionally to wait time to guarantee progress' },
  ];

  const vivaQuestions = [
    {
      q: '1. What is the fundamental difference between a Mutex and a Counting Semaphore in this project?',
      a: 'A Mutex enforces strict Mutual Exclusion (effective capacity = 1) and ownership semantics: only the holding thread can release it. A Counting Semaphore manages a pool of N permits (capacity > 1); up to N robots can access simultaneously, with decrementing on acquire and incrementing on release.'
    },
    {
      q: '2. How does the "No Synchronization" mode prove the necessity of synchronization?',
      a: 'By deliberately bypassing mutexes and semaphore acquisition, multiple threads enter critical resources simultaneously. The simulation engine detects and logs race conditions and capacity breaches, showing that unsynchronized concurrent execution leads to corrupted state and unsafe operations.'
    },
    {
      q: '3. What are Coffman\'s 4 conditions for Deadlock, and how are they simulated?',
      a: '1) Mutual Exclusion (resources cannot be shared), 2) Hold and Wait (R01 holds Corridor while requesting Bay), 3) No Preemption (resources cannot be forcibly taken), 4) Circular Wait (R01 waits for Bay held by R02, while R02 waits for Corridor held by R01). Our Deadlock Demo creates this exact cycle and detects it via DFS on the Wait-For Graph.'
    },
    {
      q: '4. How does Deadlock Recovery work in the system?',
      a: 'Upon cycle detection, the system applies Victim Selection based on process priority and resource holdings. It preempts the victim\'s held resource, resets the victim to READY, and unblocks the waiting beneficiary process.'
    },
    {
      q: '5. How does Priority Aging prevent Starvation?',
      a: 'Without aging, high-priority processes repeatedly preempt low-priority processes, causing indefinite postponement (starvation). The aging manager monitors wait times; once wait duration exceeds threshold T, the robot\'s priority is periodically elevated (e.g., Low -> Normal -> High -> Emergency) until it acquires the resource.'
    }
  ];

  return (
    <div className="bg-navy-800 rounded-xl border border-navy-600 p-5 shadow-xl space-y-6">
      <div className="flex items-center gap-2 pb-3 border-b border-navy-700">
        <BookOpen className="w-5 h-5 text-cyan-400" />
        <div>
          <h2 className="text-base font-bold text-white">
            Academic Operating Systems Viva & Presentation Guide
          </h2>
          <p className="text-xs text-slate-400">
            Theoretical concepts, warehouse-to-OS entity mapping, and examiner question preparation
          </p>
        </div>
      </div>

      {/* Concept Mapping Table */}
      <div>
        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Cpu className="w-4 h-4 text-blue-400" />
          <span>Warehouse Model to OS Concept Mapping</span>
        </h3>
        <div className="overflow-x-auto rounded-lg border border-navy-700 bg-navy-900/60">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-navy-700 text-slate-400 text-[11px] uppercase bg-navy-900">
                <th className="py-2.5 px-3">Warehouse Domain</th>
                <th className="py-2.5 px-3">Operating Systems Equivalent</th>
                <th className="py-2.5 px-3">Academic Principle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-700/60">
              {mappings.map((m, idx) => (
                <tr key={idx} className="hover:bg-navy-800/40 transition-colors">
                  <td className="py-2 px-3 font-medium text-white">{m.warehouse}</td>
                  <td className="py-2 px-3 font-mono text-cyan-300 font-bold">{m.os}</td>
                  <td className="py-2 px-3 text-slate-400 text-[11px]">{m.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Critical Section 3 Requirements Card */}
      <div className="p-4 rounded-lg bg-navy-900/90 border border-blue-900/60 space-y-2 text-xs">
        <h3 className="font-bold text-white flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>The Three Requirements of a Valid Critical Section Solution</span>
        </h3>
        <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed">
          <li><strong>1. Mutual Exclusion:</strong> If process Pi is executing in its critical section, no other processes can execute in their critical sections.</li>
          <li><strong>2. Progress:</strong> If no process is executing in its critical section and some processes wish to enter, only those processes not in remainder sections participate in selecting the next entry, and this selection cannot be postponed indefinitely.</li>
          <li><strong>3. Bounded Waiting:</strong> There must exist a bound on the number of times other processes are allowed to enter their critical sections after a process has made a request and before that request is granted.</li>
        </ul>
      </div>

      {/* Viva Q&A Accordion/Cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-amber-400" />
          <span>Core Viva Examination Questions & Model Answers</span>
        </h3>
        {vivaQuestions.map((qa, idx) => (
          <div key={idx} className="p-3.5 rounded-lg bg-navy-900/70 border border-navy-700 space-y-1.5 text-xs">
            <div className="font-bold text-blue-300">{qa.q}</div>
            <div className="text-slate-300 leading-relaxed text-[11px]">{qa.a}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
