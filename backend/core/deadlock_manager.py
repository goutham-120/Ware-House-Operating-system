import threading
import time
from typing import Dict, List, Optional, Tuple, Set, Any
from backend.models.simulation import DeadlockCycle

class DeadlockManager:
    """
    Maintains the Resource Allocation Graph (RAG) / Wait-For Graph (WFG),
    detects circular dependencies (deadlocks), and executes victim selection & preemption recovery.
    """
    def __init__(self):
        self.lock = threading.Lock()
        # robot_id -> set of resource_ids held
        self.holds: Dict[str, Set[str]] = {}
        # robot_id -> resource_id waiting for
        self.waiting_for: Dict[str, Optional[str]] = {}
        # resource_id -> list/set of holding robot_ids
        self.resource_holders: Dict[str, Set[str]] = {}
        
        self.active_deadlocks: List[DeadlockCycle] = []
        self.total_deadlocks_detected = 0
        self.total_deadlocks_resolved = 0

    def record_allocation(self, robot_id: str, resource_id: str):
        with self.lock:
            if robot_id not in self.holds:
                self.holds[robot_id] = set()
            self.holds[robot_id].add(resource_id)
            
            if resource_id not in self.resource_holders:
                self.resource_holders[resource_id] = set()
            self.resource_holders[resource_id].add(robot_id)
            
            # Robot got a resource, so it's not waiting for this one anymore
            if self.waiting_for.get(robot_id) == resource_id:
                self.waiting_for[robot_id] = None

    def record_request(self, robot_id: str, resource_id: str):
        with self.lock:
            self.waiting_for[robot_id] = resource_id

    def record_release(self, robot_id: str, resource_id: str):
        with self.lock:
            if robot_id in self.holds and resource_id in self.holds[robot_id]:
                self.holds[robot_id].remove(resource_id)
            if resource_id in self.resource_holders and robot_id in self.resource_holders[resource_id]:
                self.resource_holders[resource_id].remove(robot_id)
            if self.waiting_for.get(robot_id) == resource_id:
                self.waiting_for[robot_id] = None

    def unregister_robot(self, robot_id: str):
        with self.lock:
            if robot_id in self.holds:
                for res_id in list(self.holds[robot_id]):
                    if res_id in self.resource_holders:
                        self.resource_holders[res_id].discard(robot_id)
                del self.holds[robot_id]
            if robot_id in self.waiting_for:
                del self.waiting_for[robot_id]

    def detect_deadlock(self) -> Optional[DeadlockCycle]:
        """
        Builds the Wait-For Graph (WFG) between robots and searches for cycles.
        If Robot A is waiting for Resource R, and Robot B currently holds Resource R,
        there is a directed edge Robot A -> Robot B.
        """
        with self.lock:
            # Build adjacency list: robot_u -> list of robots it is waiting for
            adj: Dict[str, List[str]] = {}
            for robot_id, res_id in self.waiting_for.items():
                if not res_id:
                    continue
                holders = self.resource_holders.get(res_id, set())
                # Exclude self if already holding
                valid_holders = [h for h in holders if h != robot_id]
                adj[robot_id] = valid_holders

            # Cycle detection using DFS
            visited: Set[str] = set()
            rec_stack: Set[str] = set()
            parent_map: Dict[str, str] = {}
            cycle_found: List[str] = []

            def dfs(curr: str) -> bool:
                nonlocal cycle_found
                visited.add(curr)
                rec_stack.add(curr)

                for neighbor in adj.get(curr, []):
                    if neighbor not in visited:
                        parent_map[neighbor] = curr
                        if dfs(neighbor):
                            return True
                    elif neighbor in rec_stack:
                        # Cycle found! Reconstruct cycle from curr back to neighbor
                        path = [curr]
                        p = curr
                        while p != neighbor and p in parent_map:
                            p = parent_map[p]
                            path.append(p)
                        path.reverse()
                        cycle_found = path
                        return True

                rec_stack.remove(curr)
                return False

            for r_node in list(adj.keys()):
                if r_node not in visited:
                    if dfs(r_node):
                        break

            if cycle_found:
                # Cycle found!
                involved_resources = []
                for r in cycle_found:
                    needed_res = self.waiting_for.get(r)
                    if needed_res and needed_res not in involved_resources:
                        involved_resources.append(needed_res)

                cycle_desc = " -> ".join(cycle_found) + f" -> {cycle_found[0]}"
                deadlock_cycle = DeadlockCycle(
                    robots=cycle_found,
                    resources=involved_resources,
                    cycle_description=cycle_desc,
                    detected_at=time.time()
                )
                
                # Check if this cycle is already tracked
                existing = [d for d in self.active_deadlocks if set(d.robots) == set(cycle_found)]
                if not existing:
                    self.active_deadlocks.append(deadlock_cycle)
                    self.total_deadlocks_detected += 1
                return deadlock_cycle

            # No cycle active
            self.active_deadlocks.clear()
            return None

    def select_victim(self, cycle: DeadlockCycle, robot_priorities: Dict[str, int]) -> Tuple[str, str]:
        """
        Selects a victim robot to preempt.
        Criteria: Lowest priority robot in the cycle. If tie, select the one with fewer held resources.
        Returns: (victim_robot_id, resource_to_preempt)
        """
        with self.lock:
            # Sort cycle robots by priority ascending
            cycle_robots = sorted(
                cycle.robots,
                key=lambda rid: (robot_priorities.get(rid, 3), len(self.holds.get(rid, set())))
            )
            victim = cycle_robots[0]
            # Resource to preempt is one of the resources held by this victim
            held = list(self.holds.get(victim, set()))
            preempt_res = held[0] if held else (cycle.resources[0] if cycle.resources else "NC-01")
            return victim, preempt_res

    def record_resolution(self):
        with self.lock:
            self.total_deadlocks_resolved += 1
            self.active_deadlocks.clear()

    def get_wfg_graph(self) -> Dict[str, Any]:
        """
        Returns graph nodes and edges for visualization in UI
        """
        with self.lock:
            nodes = []
            edges = []
            
            # Robot nodes
            all_robots = set(self.holds.keys()) | set(self.waiting_for.keys())
            for r in all_robots:
                nodes.append({"id": r, "type": "robot", "label": r})
            
            # Resource nodes
            all_res = set(self.resource_holders.keys()) | {r for r in self.waiting_for.values() if r}
            for res in all_res:
                nodes.append({"id": res, "type": "resource", "label": res})
                
            # Edges: Robot -> Resource (waiting)
            for r, res in self.waiting_for.items():
                if res:
                    edges.append({"from": r, "to": res, "type": "waiting", "label": "waits for"})
            
            # Edges: Resource -> Robot (held)
            for res, holders in self.resource_holders.items():
                for r in holders:
                    edges.append({"from": res, "to": r, "type": "held", "label": "held by"})
                    
            return {"nodes": nodes, "edges": edges}

    def reset(self):
        with self.lock:
            self.holds.clear()
            self.waiting_for.clear()
            self.resource_holders.clear()
            self.active_deadlocks.clear()
            self.total_deadlocks_detected = 0
            self.total_deadlocks_resolved = 0
