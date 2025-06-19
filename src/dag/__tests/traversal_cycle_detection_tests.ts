import { UnitTestBuilder } from "@elaraai/core";
import { Template } from "@elaraai/core";

import { graph_cycle_detection } from "../traversal/cycle_detection";

/**
 * VALIDATION TESTS using GeeksforGeeks authoritative examples
 * Source: https://www.geeksforgeeks.org/dsa/detect-cycle-in-a-graph/
 * These tests use known correct answers from established algorithms literature
 */

/**
 * Validation Test 1: GeeksforGeeks Example 1 (Has Cycle)
 * Input: V = 4, edges = [[0, 1], [0, 2], [1, 2], [2, 0], [2, 3]]
 * Expected Output: true (contains cycle 0 → 2 → 0)
 * Source: GeeksforGeeks "Detect Cycle in a Graph"
 * 
 * External validation edges:
 * const edges = [[0, 1], [0, 2], [1, 2], [2, 0], [2, 3]];
 */
const cycle_detection_geeks_example_1 = new UnitTestBuilder("cycle_detection_geeks_example_1")
  .procedure(graph_cycle_detection)
  .test(
    {
      nodes: [
        { id: "0", type: "node" },
        { id: "1", type: "node" },
        { id: "2", type: "node" },
        { id: "3", type: "node" }
      ],
      edges: [
        { from: "0", to: "1", type: "edge" },
        { from: "0", to: "2", type: "edge" },
        { from: "1", to: "2", type: "edge" },
        { from: "2", to: "0", type: "edge" }, // Creates cycle: 0 → 2 → 0
        { from: "2", to: "3", type: "edge" }
      ],
      find_all_cycles: false
    },
    {
      has_cycle: true,
      cycle_nodes: ["0", "2"] // Back edge detected
    }
  );

/**
 * Validation Test 2: GeeksforGeeks Example 2 (No Cycle)
 * Input: V = 4, edges = [[0, 1], [0, 2], [1, 2], [2, 3]]
 * Expected Output: false (no cycle exists)
 * Source: GeeksforGeeks "Detect Cycle in a Graph"
 * 
 * External validation edges:
 * const edges = [[0, 1], [0, 2], [1, 2], [2, 3]];
 */
const cycle_detection_geeks_example_2 = new UnitTestBuilder("cycle_detection_geeks_example_2")
  .procedure(graph_cycle_detection)
  .test(
    {
      nodes: [
        { id: "0", type: "node" },
        { id: "1", type: "node" },
        { id: "2", type: "node" },
        { id: "3", type: "node" }
      ],
      edges: [
        { from: "0", to: "1", type: "edge" },
        { from: "0", to: "2", type: "edge" },
        { from: "1", to: "2", type: "edge" },
        { from: "2", to: "3", type: "edge" }
      ],
      find_all_cycles: false
    },
    {
      has_cycle: false,
      cycle_nodes: []
    }
  );

/**
 * Validation Test 3: Self-loop (Simple Cycle)
 * Input: Single node with self-loop
 * Expected Output: true (self-loop creates cycle)
 * 
 * External validation edges:
 * const edges = [[0, 0]];
 */
const cycle_detection_self_loop = new UnitTestBuilder("cycle_detection_self_loop")
  .procedure(graph_cycle_detection)
  .test(
    {
      nodes: [
        { id: "A", type: "node" }
      ],
      edges: [
        { from: "A", to: "A", type: "loop" }
      ],
      find_all_cycles: false
    },
    {
      has_cycle: true,
      cycle_nodes: ["A", "A"]
    }
  );

/**
 * Validation Test 4: Simple Triangle Cycle
 * Input: Triangle cycle A → B → C → A
 * Expected Output: true (triangle forms cycle)
 * 
 * External validation edges:
 * const edges = [[0, 1], [1, 2], [2, 0]];
 */
const cycle_detection_triangle = new UnitTestBuilder("cycle_detection_triangle")
  .procedure(graph_cycle_detection)
  .test(
    {
      nodes: [
        { id: "A", type: "node" },
        { id: "B", type: "node" },
        { id: "C", type: "node" }
      ],
      edges: [
        { from: "A", to: "B", type: "flow" },
        { from: "B", to: "C", type: "process" },
        { from: "C", to: "A", type: "feedback" }
      ],
      find_all_cycles: false
    },
    {
      has_cycle: true,
      cycle_nodes: ["A", "C"] // Back edge detected during DFS
    }
  );

/**
 * Edge Case Test 1: Empty Graph
 * Input: No nodes, no edges
 * Expected Output: false (no cycles possible)
 * 
 * External validation edges:
 * const edges = [];
 */
const cycle_detection_empty = new UnitTestBuilder("cycle_detection_empty")
  .procedure(graph_cycle_detection)
  .test(
    {
      nodes: [],
      edges: [],
      find_all_cycles: false
    },
    {
      has_cycle: false,
      cycle_nodes: []
    }
  );

/**
 * Edge Case Test 2: Single Node (No Edges)
 * Input: One isolated node
 * Expected Output: false (no cycle without edges)
 * 
 * External validation edges:
 * const edges = [];
 */
const cycle_detection_single_node = new UnitTestBuilder("cycle_detection_single_node")
  .procedure(graph_cycle_detection)
  .test(
    {
      nodes: [
        { id: "A", type: "node" }
      ],
      edges: [],
      find_all_cycles: false
    },
    {
      has_cycle: false,
      cycle_nodes: []
    }
  );

/**
 * Edge Case Test 3: Linear Chain (No Cycle)
 * Input: A → B → C (directed chain)
 * Expected Output: false (no cycles in linear chain)
 * 
 * External validation edges:
 * const edges = [[0, 1], [1, 2]];
 */
const cycle_detection_linear_chain = new UnitTestBuilder("cycle_detection_linear_chain")
  .procedure(graph_cycle_detection)
  .test(
    {
      nodes: [
        { id: "A", type: "node" },
        { id: "B", type: "node" },
        { id: "C", type: "node" }
      ],
      edges: [
        { from: "A", to: "B", type: "flow" },
        { from: "B", to: "C", type: "process" }
      ],
      find_all_cycles: false
    },
    {
      has_cycle: false,
      cycle_nodes: []
    }
  );

/**
 * Edge Case Test 4: Disconnected Components (No Cycles)
 * Input: Two separate linear chains
 * Expected Output: false (no cycles in disconnected components)
 * 
 * External validation edges:
 * const edges = [[0, 1], [2, 3]];
 */
const cycle_detection_disconnected = new UnitTestBuilder("cycle_detection_disconnected")
  .procedure(graph_cycle_detection)
  .test(
    {
      nodes: [
        { id: "A", type: "node" },
        { id: "B", type: "node" },
        { id: "C", type: "node" },
        { id: "D", type: "node" }
      ],
      edges: [
        { from: "A", to: "B", type: "flow" },
        { from: "C", to: "D", type: "flow" }
      ],
      find_all_cycles: false
    },
    {
      has_cycle: false,
      cycle_nodes: []
    }
  );

/**
 * Complex Test 1: Multiple Cycles with Early Termination
 * Input: Graph with multiple cycles, early termination enabled
 * Expected Output: true (stops at first cycle found)
 * 
 * External validation edges:
 * const edges = [[0, 1], [1, 2], [2, 0], [1, 3], [3, 4], [4, 1]];
 */
const cycle_detection_multiple_cycles_early = new UnitTestBuilder("cycle_detection_multiple_cycles_early")
  .procedure(graph_cycle_detection)
  .test(
    {
      nodes: [
        { id: "A", type: "node" },
        { id: "B", type: "node" },
        { id: "C", type: "node" },
        { id: "D", type: "node" },
        { id: "E", type: "node" }
      ],
      edges: [
        // First cycle: A → B → C → A
        { from: "A", to: "B", type: "flow" },
        { from: "B", to: "C", type: "process" },
        { from: "C", to: "A", type: "feedback" },
        // Second cycle: B → D → E → B
        { from: "B", to: "D", type: "branch" },
        { from: "D", to: "E", type: "process" },
        { from: "E", to: "B", type: "feedback" }
      ],
      find_all_cycles: false
    },
    {
      has_cycle: true,
      cycle_nodes: ["B", "E"] // Early termination at first cycle found (DFS order dependent)
    }
  );

/**
 * Complex Test 2: Multiple Cycles with Full Detection
 * Input: Same graph as above, but find all cycles enabled
 * Expected Output: true (finds nodes from multiple cycles)
 * 
 * External validation edges:
 * const edges = [[0, 1], [1, 2], [2, 0], [1, 3], [3, 4], [4, 1]];
 */
const cycle_detection_multiple_cycles_all = new UnitTestBuilder("cycle_detection_multiple_cycles_all")
  .procedure(graph_cycle_detection)
  .test(
    {
      nodes: [
        { id: "A", type: "node" },
        { id: "B", type: "node" },
        { id: "C", type: "node" },
        { id: "D", type: "node" },
        { id: "E", type: "node" }
      ],
      edges: [
        // First cycle: A → B → C → A
        { from: "A", to: "B", type: "flow" },
        { from: "B", to: "C", type: "process" },
        { from: "C", to: "A", type: "feedback" },
        // Second cycle: B → D → E → B
        { from: "B", to: "D", type: "branch" },
        { from: "D", to: "E", type: "process" },
        { from: "E", to: "B", type: "feedback" }
      ],
      find_all_cycles: true
    },
    {
      has_cycle: true,
      cycle_nodes: ["B", "E", "A", "C"] // Multiple cycles detected (DFS order dependent)
    }
  );

/**
 * Edge Case Test 5: Dangling Edges
 * Input: Edges referencing non-existent nodes
 * Expected Output: false (dangling edges ignored)
 * 
 * External validation edges:
 * const edges = [[0, 1], [1, "MISSING"]];
 */
const cycle_detection_dangling_edges = new UnitTestBuilder("cycle_detection_dangling_edges")
  .procedure(graph_cycle_detection)
  .test(
    {
      nodes: [
        { id: "A", type: "node" },
        { id: "B", type: "node" }
      ],
      edges: [
        { from: "A", to: "B", type: "flow" },
        { from: "B", to: "MISSING", type: "dangling" } // References non-existent node
      ],
      find_all_cycles: false
    },
    {
      has_cycle: false,
      cycle_nodes: []
    }
  );

/**
 * Edge Case Test 6: Nodes with No Outgoing Edges
 * Input: Graph where some nodes have no outgoing edges
 * Expected Output: false (no cycles possible)
 * 
 * External validation edges:
 * const edges = [[0, 1], [0, 2]];
 */
const cycle_detection_leaf_nodes = new UnitTestBuilder("cycle_detection_leaf_nodes")
  .procedure(graph_cycle_detection)
  .test(
    {
      nodes: [
        { id: "ROOT", type: "source" },
        { id: "LEAF1", type: "leaf" },
        { id: "LEAF2", type: "leaf" }
      ],
      edges: [
        { from: "ROOT", to: "LEAF1", type: "distribute" },
        { from: "ROOT", to: "LEAF2", type: "distribute" }
        // LEAF1 and LEAF2 have no outgoing edges
      ],
      find_all_cycles: false
    },
    {
      has_cycle: false,
      cycle_nodes: []
    }
  );

export default Template(
  cycle_detection_geeks_example_1,
  cycle_detection_geeks_example_2,
  cycle_detection_self_loop,
  cycle_detection_triangle,
  cycle_detection_empty,
  cycle_detection_single_node,
  cycle_detection_linear_chain,
  cycle_detection_disconnected,
  cycle_detection_multiple_cycles_early,
  cycle_detection_multiple_cycles_all,
  cycle_detection_dangling_edges,
  cycle_detection_leaf_nodes
);