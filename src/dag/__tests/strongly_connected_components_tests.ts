import { UnitTestBuilder } from "@elaraai/core";
import { Template } from "@elaraai/core";
import { graph_strongly_connected_components } from "../connectivity/strongly_connected_components";

/**
 * VALIDATION TESTS using GeeksforGeeks authoritative examples
 * Source: https://www.geeksforgeeks.org/dsa/strongly-connected-components/
 * These tests use known correct answers from established algorithms literature
 */

/**
 * Validation Test 1: GeeksforGeeks Example 1
 * Input: V = 5, edges = [[1, 0], [0, 2], [2, 1], [0, 3], [3, 4]]
 * Expected Output: [["4"], ["3"], ["0", "1", "2"]]
 * Source: GeeksforGeeks "Strongly Connected Components"
 * 
 * External validation edges:
 * const edges = [[1, 0], [0, 2], [2, 1], [0, 3], [3, 4]];
 */
const scc_validation_1 = new UnitTestBuilder("scc_validation_1")
  .procedure(graph_strongly_connected_components)
  .test(
    {
      nodes: [
        { id: "0", type: "node" },
        { id: "1", type: "node" },
        { id: "2", type: "node" },
        { id: "3", type: "node" },
        { id: "4", type: "node" }
      ],
      edges: [
        { from: "1", to: "0", type: "edge" },
        { from: "0", to: "2", type: "edge" },
        { from: "2", to: "1", type: "edge" },
        { from: "0", to: "3", type: "edge" },
        { from: "3", to: "4", type: "edge" }
      ]
    },
    [["4"], ["3"], ["1", "2", "0"]] // Known correct SCCs from GeeksforGeeks (stack order)
  );

/**
 * Validation Test 2: GeeksforGeeks Example 2
 * Input: V = 4, edges = [[0, 1], [1, 2], [2, 3]]
 * Expected Output: [["3"], ["2"], ["1"], ["0"]]
 * Source: GeeksforGeeks "Strongly Connected Components"
 * 
 * External validation edges:
 * const edges = [[0, 1], [1, 2], [2, 3]];
 */
const scc_validation_2 = new UnitTestBuilder("scc_validation_2")
  .procedure(graph_strongly_connected_components)
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
        { from: "1", to: "2", type: "edge" },
        { from: "2", to: "3", type: "edge" }
      ]
    },
    [["3"], ["2"], ["1"], ["0"]] // Each node is its own SCC in acyclic graph
  );

/**
 * Validation Test 3: Simple Cycle
 * Input: Triangle A→B→C→A
 * Expected Output: [["A", "B", "C"]]
 * 
 * External validation edges:
 * const edges = [[0, 1], [1, 2], [2, 0]];
 */
const scc_validation_cycle = new UnitTestBuilder("scc_validation_cycle")
  .procedure(graph_strongly_connected_components)
  .test(
    {
      nodes: [
        { id: "A", type: "node" },
        { id: "B", type: "node" },
        { id: "C", type: "node" }
      ],
      edges: [
        { from: "A", to: "B", type: "edge" },
        { from: "B", to: "C", type: "edge" },
        { from: "C", to: "A", type: "edge" }
      ]
    },
    [["C", "B", "A"]] // All nodes in one SCC (stack order)
  );

/**
 * Validation Test 4: Single Node
 * Input: One isolated node
 * Expected Output: [["A"]]
 * 
 * External validation edges:
 * const edges = [];
 */
const scc_validation_single = new UnitTestBuilder("scc_validation_single")
  .procedure(graph_strongly_connected_components)
  .test(
    {
      nodes: [
        { id: "A", type: "node" }
      ],
      edges: []
    },
    [["A"]] // Single node forms its own SCC
  );

/**
 * Validation Test 5: Empty Graph
 * Input: No nodes, no edges
 * Expected Output: []
 * 
 * External validation edges:
 * const edges = [];
 */
const scc_validation_empty = new UnitTestBuilder("scc_validation_empty")
  .procedure(graph_strongly_connected_components)
  .test(
    {
      nodes: [],
      edges: []
    },
    [] // No SCCs in empty graph
  );

/**
 * Validation Test 6: Disconnected Components
 * Input: Two separate edges A→B and C→D
 * Expected Output: [["B"], ["A"], ["D"], ["C"]]
 * 
 * External validation edges:
 * const edges = [[0, 1], [2, 3]];
 */
const scc_validation_disconnected = new UnitTestBuilder("scc_validation_disconnected")
  .procedure(graph_strongly_connected_components)
  .test(
    {
      nodes: [
        { id: "A", type: "node" },
        { id: "B", type: "node" },
        { id: "C", type: "node" },
        { id: "D", type: "node" }
      ],
      edges: [
        { from: "A", to: "B", type: "edge" },
        { from: "C", to: "D", type: "edge" }
      ]
    },
    [["B"], ["A"], ["D"], ["C"]] // Each node is its own SCC
  );

/**
 * Edge Case Test 1: Self-loops
 * Input: Nodes with self-loops (create SCCs)
 * Expected Output: Each node with self-loop forms its own SCC
 * 
 * External validation edges:
 * const edges = [[0, 0], [0, 1], [1, 1], [1, 2], [2, 2]];
 */
const scc_self_loops = new UnitTestBuilder("scc_self_loops")
  .procedure(graph_strongly_connected_components)
  .test(
    {
      nodes: [
        { id: "A", type: "node" },
        { id: "B", type: "node" },
        { id: "C", type: "node" }
      ],
      edges: [
        { from: "A", to: "A", type: "edge" }, // Self-loop
        { from: "A", to: "B", type: "edge" },
        { from: "B", to: "B", type: "edge" }, // Self-loop
        { from: "B", to: "C", type: "edge" },
        { from: "C", to: "C", type: "edge" }  // Self-loop
      ]
    },
    [["C"], ["B"], ["A"]] // Each node is its own SCC due to self-loops
  );

/**
 * Edge Case Test 2: Complex Nested SCCs
 * Input: Graph with multiple overlapping cycles
 * Graph: (A→B→C→A) with additional edges creating complex structure
 * Expected Output: Multiple SCCs based on reachability
 * 
 * External validation edges:
 * const edges = [[0, 1], [1, 2], [2, 0], [1, 3], [3, 4], [4, 3], [3, 5]];
 */
const scc_nested_cycles = new UnitTestBuilder("scc_nested_cycles")
  .procedure(graph_strongly_connected_components)
  .test(
    {
      nodes: [
        { id: "A", type: "node" },
        { id: "B", type: "node" },
        { id: "C", type: "node" },
        { id: "D", type: "node" },
        { id: "E", type: "node" },
        { id: "F", type: "node" }
      ],
      edges: [
        // First cycle: A→B→C→A
        { from: "A", to: "B", type: "edge" },
        { from: "B", to: "C", type: "edge" },
        { from: "C", to: "A", type: "edge" },
        // Connection to second cycle
        { from: "B", to: "D", type: "edge" },
        // Second cycle: D→E→D
        { from: "D", to: "E", type: "edge" },
        { from: "E", to: "D", type: "edge" },
        // Isolated connection
        { from: "D", to: "F", type: "edge" }
      ]
    },
    [["F"], ["E", "D"], ["C", "B", "A"]] // Three SCCs: isolated F, cycle D-E, cycle A-B-C (stack order)
  );

/**
 * Edge Case Test 3: Chain with Bidirectional Connection
 * Input: Chain with one bidirectional connection creating SCC
 * Graph: A→B↔C→D (B and C form SCC)
 * Expected Output: [["D"], ["B", "C"], ["A"]]
 * 
 * External validation edges:
 * const edges = [[0, 1], [1, 2], [2, 1], [2, 3]];
 */
const scc_bidirectional = new UnitTestBuilder("scc_bidirectional")
  .procedure(graph_strongly_connected_components)
  .test(
    {
      nodes: [
        { id: "A", type: "node" },
        { id: "B", type: "node" },
        { id: "C", type: "node" },
        { id: "D", type: "node" }
      ],
      edges: [
        { from: "A", to: "B", type: "edge" },
        { from: "B", to: "C", type: "edge" },
        { from: "C", to: "B", type: "edge" }, // Bidirectional B↔C
        { from: "C", to: "D", type: "edge" }
      ]
    },
    [["D"], ["C", "B"], ["A"]] // B and C form SCC, A and D are isolated (stack order)
  );

/**
 * Edge Case Test 4: Star Graph (Directed)
 * Input: Directed star with center pointing to leaves
 * Expected Output: Each node is its own SCC (no cycles)
 * 
 * External validation edges:
 * const edges = [[0, 1], [0, 2], [0, 3]];
 */
const scc_directed_star = new UnitTestBuilder("scc_directed_star")
  .procedure(graph_strongly_connected_components)
  .test(
    {
      nodes: [
        { id: "center", type: "node" },
        { id: "leaf1", type: "node" },
        { id: "leaf2", type: "node" },
        { id: "leaf3", type: "node" }
      ],
      edges: [
        { from: "center", to: "leaf1", type: "edge" },
        { from: "center", to: "leaf2", type: "edge" },
        { from: "center", to: "leaf3", type: "edge" }
      ]
    },
    [["leaf3"], ["leaf2"], ["leaf1"], ["center"]] // Each node is its own SCC
  );

/**
 * Edge Case Test 5: Complex Graph with Multiple SCCs
 * Input: Complex structure with multiple strongly connected components
 * Graph: Multiple cycles and connections creating complex SCC structure
 * Expected Output: Multiple SCCs based on strong connectivity
 * 
 * External validation edges:
 * const edges = [[0, 1], [1, 2], [2, 0], [2, 3], [3, 4], [4, 5], [5, 3], [4, 6]];
 */
const scc_complex_multiple = new UnitTestBuilder("scc_complex_multiple")
  .procedure(graph_strongly_connected_components)
  .test(
    {
      nodes: [
        { id: "A", type: "node" },
        { id: "B", type: "node" },
        { id: "C", type: "node" },
        { id: "D", type: "node" },
        { id: "E", type: "node" },
        { id: "F", type: "node" },
        { id: "G", type: "node" }
      ],
      edges: [
        // First SCC: A→B→C→A
        { from: "A", to: "B", type: "edge" },
        { from: "B", to: "C", type: "edge" },
        { from: "C", to: "A", type: "edge" },
        // Connection to next component
        { from: "C", to: "D", type: "edge" },
        // Second SCC: D→E→F→D
        { from: "D", to: "E", type: "edge" },
        { from: "E", to: "F", type: "edge" },
        { from: "F", to: "D", type: "edge" },
        // Isolated connection
        { from: "E", to: "G", type: "edge" }
      ]
    },
    [["G"], ["F", "E", "D"], ["C", "B", "A"]] // Three SCCs: isolated G, cycle D-E-F, cycle A-B-C (stack order)
  );

export default Template(
  scc_validation_1,
  scc_validation_2,
  scc_validation_cycle,
  scc_validation_single,
  scc_validation_empty,
  scc_validation_disconnected,
  scc_self_loops,
  scc_nested_cycles,
  scc_bidirectional,
  scc_directed_star,
  scc_complex_multiple
);