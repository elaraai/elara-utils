import { UnitTestBuilder } from "@elaraai/core";
import { Template } from "@elaraai/core";
import { graph_bridge_detection } from "../connectivity/bridge_detection";

/**
 * VALIDATION TESTS using GeeksforGeeks authoritative examples
 * Source: https://www.geeksforgeeks.org/dsa/bridge-in-a-graph/
 * These tests use known correct answers from established algorithms literature
 */

/**
 * Validation Test 1: GeeksforGeeks Example 1
 * Input: 5 vertices, edges = [(1,0), (0,2), (2,1), (0,3), (3,4)]
 * Expected Output: [(3,4), (0,3)]
 * Source: GeeksforGeeks "Bridge in a graph"
 * 
 * External validation edges:
 * const edges = [[1, 0], [0, 2], [2, 1], [0, 3], [3, 4]];
 */
const bridge_detection_validation_1 = new UnitTestBuilder("bridge_detection_validation_1")
  .procedure(graph_bridge_detection)
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
    [
      { from: "3", to: "4" },
      { from: "0", to: "3" }
    ] // Known correct answer from GeeksforGeeks (algorithm order)
  );

/**
 * Validation Test 2: GeeksforGeeks Example 2
 * Input: 4 vertices, edges = [(0,1), (1,2), (2,3)]
 * Expected Output: [(2,3), (1,2), (0,1)]
 * Source: GeeksforGeeks "Bridge in a graph"
 * 
 * External validation edges:
 * const edges = [[0, 1], [1, 2], [2, 3]];
 */
const bridge_detection_validation_2 = new UnitTestBuilder("bridge_detection_validation_2")
  .procedure(graph_bridge_detection)
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
    [
      { from: "2", to: "3" },
      { from: "1", to: "2" },
      { from: "0", to: "1" }
    ] // Known correct answer from GeeksforGeeks (all edges are bridges in chain, algorithm order)
  );

/**
 * Validation Test 3: GeeksforGeeks Example 3
 * Input: 7 vertices, edges = [(0,1), (1,2), (2,0), (1,3), (1,4), (1,6), (3,5), (4,5)]
 * Expected Output: [(1,6)]
 * Source: GeeksforGeeks "Bridge in a graph"
 * 
 * External validation edges:
 * const edges = [[0, 1], [1, 2], [2, 0], [1, 3], [1, 4], [1, 6], [3, 5], [4, 5]];
 */
const bridge_detection_validation_3 = new UnitTestBuilder("bridge_detection_validation_3")
  .procedure(graph_bridge_detection)
  .test(
    {
      nodes: [
        { id: "0", type: "node" },
        { id: "1", type: "node" },
        { id: "2", type: "node" },
        { id: "3", type: "node" },
        { id: "4", type: "node" },
        { id: "5", type: "node" },
        { id: "6", type: "node" }
      ],
      edges: [
        { from: "0", to: "1", type: "edge" },
        { from: "1", to: "2", type: "edge" },
        { from: "2", to: "0", type: "edge" },
        { from: "1", to: "3", type: "edge" },
        { from: "1", to: "4", type: "edge" },
        { from: "1", to: "6", type: "edge" },
        { from: "3", to: "5", type: "edge" },
        { from: "4", to: "5", type: "edge" }
      ]
    },
    [
      { from: "1", to: "6" }
    ] // Known correct answer from GeeksforGeeks
  );

/**
 * Validation Test 4: Triangle (Complete Graph K3)
 * Input: Triangle A—B—C—A
 * Expected Output: [] (no bridges in complete graph)
 * 
 * External validation edges:
 * const edges = [[0, 1], [1, 2], [2, 0]];
 */
const bridge_detection_validation_triangle = new UnitTestBuilder("bridge_detection_validation_triangle")
  .procedure(graph_bridge_detection)
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
    [] // No bridges in triangle
  );

/**
 * Validation Test 5: Star Graph
 * Input: Star with center node connected to 3 leaf nodes
 * Expected Output: All edges are bridges
 * 
 * External validation edges:
 * const edges = [[0, 1], [0, 2], [0, 3]];
 */
const bridge_detection_validation_star = new UnitTestBuilder("bridge_detection_validation_star")
  .procedure(graph_bridge_detection)
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
    [
      { from: "center", to: "leaf1" },
      { from: "center", to: "leaf2" },
      { from: "center", to: "leaf3" }
    ] // All edges in star are bridges
  );

/**
 * Validation Test 6: Disconnected Components
 * Input: Two separate edges A—B and C—D
 * Expected Output: Both edges are bridges
 * 
 * External validation edges:
 * const edges = [[0, 1], [2, 3]];
 */
const bridge_detection_validation_disconnected = new UnitTestBuilder("bridge_detection_validation_disconnected")
  .procedure(graph_bridge_detection)
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
    [
      { from: "A", to: "B" },
      { from: "C", to: "D" }
    ] // Both edges are bridges
  );

/**
 * Validation Test 7: Single Edge
 * Input: Single edge A—B
 * Expected Output: [A—B] (single edge is always a bridge)
 * 
 * External validation edges:
 * const edges = [[0, 1]];
 */
const bridge_detection_validation_single_edge = new UnitTestBuilder("bridge_detection_validation_single_edge")
  .procedure(graph_bridge_detection)
  .test(
    {
      nodes: [
        { id: "A", type: "node" },
        { id: "B", type: "node" }
      ],
      edges: [
        { from: "A", to: "B", type: "edge" }
      ]
    },
    [
      { from: "A", to: "B" }
    ] // Single edge is always a bridge
  );

/**
 * Validation Test 8: Empty Graph
 * Input: No nodes, no edges
 * Expected Output: [] (no bridges possible)
 * 
 * External validation edges:
 * const edges = [];
 */
const bridge_detection_validation_empty = new UnitTestBuilder("bridge_detection_validation_empty")
  .procedure(graph_bridge_detection)
  .test(
    {
      nodes: [],
      edges: []
    },
    [] // No bridges in empty graph
  );

/**
 * Validation Test 9: No Edges
 * Input: Nodes but no edges
 * Expected Output: [] (no bridges without edges)
 * 
 * External validation edges:
 * const edges = [];
 */
const bridge_detection_validation_no_edges = new UnitTestBuilder("bridge_detection_validation_no_edges")
  .procedure(graph_bridge_detection)
  .test(
    {
      nodes: [
        { id: "A", type: "node" },
        { id: "B", type: "node" }
      ],
      edges: []
    },
    [] // No bridges without edges
  );

/**
 * Edge Case Test 1: Self-loops
 * Input: Graph with self-loops (should be ignored for bridge detection)
 * Expected Output: Self-loops don't affect bridge detection
 * 
 * External validation edges:
 * const edges = [[0, 0], [0, 1], [1, 1], [1, 2], [2, 2]];
 */
const bridge_detection_self_loops = new UnitTestBuilder("bridge_detection_self_loops")
  .procedure(graph_bridge_detection)
  .test(
    {
      nodes: [
        { id: "A", type: "node" },
        { id: "B", type: "node" },
        { id: "C", type: "node" }
      ],
      edges: [
        { from: "A", to: "A", type: "edge" }, // Self-loop - ignored
        { from: "A", to: "B", type: "edge" },
        { from: "B", to: "B", type: "edge" }, // Self-loop - ignored
        { from: "B", to: "C", type: "edge" },
        { from: "C", to: "C", type: "edge" }  // Self-loop - ignored
      ]
    },
    [
      { from: "B", to: "C" },
      { from: "A", to: "B" }
    ] // Same as simple chain A-B-C (algorithm order)
  );

/**
 * Edge Case Test 2: Parallel Edges
 * Input: Multiple edges between same nodes
 * Expected Output: Parallel edges treated as single edge for bridge detection
 * 
 * External validation edges:
 * const edges = [[0, 1], [0, 1], [1, 0], [1, 2], [2, 1], [1, 2]];
 */
const bridge_detection_parallel_edges = new UnitTestBuilder("bridge_detection_parallel_edges")
  .procedure(graph_bridge_detection)
  .test(
    {
      nodes: [
        { id: "A", type: "node" },
        { id: "B", type: "node" },
        { id: "C", type: "node" }
      ],
      edges: [
        { from: "A", to: "B", type: "edge1" },
        { from: "A", to: "B", type: "edge2" }, // Parallel edge - deduped
        { from: "B", to: "A", type: "edge3" }, // Reverse parallel edge - deduped
        { from: "B", to: "C", type: "edge4" },
        { from: "C", to: "B", type: "edge5" }, // Reverse edge - deduped
        { from: "B", to: "C", type: "edge6" }  // Another parallel edge - deduped
      ]
    },
    [
      { from: "B", to: "C" },
      { from: "A", to: "B" }
    ] // Same as simple chain despite parallel edges (algorithm order)
  );

/**
 * Edge Case Test 3: Complex Nested Loops
 * Input: Graph with multiple overlapping cycles
 * Graph: A-B-C-D-A (outer cycle) with B-E-F-B (inner cycle)
 * Expected Output: No bridges - all edges are part of cycles
 * 
 * External validation edges:
 * const edges = [[0, 1], [1, 2], [2, 3], [3, 0], [1, 4], [4, 5], [5, 1]];
 */
const bridge_detection_nested_loops = new UnitTestBuilder("bridge_detection_nested_loops")
  .procedure(graph_bridge_detection)
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
        // Outer cycle: A-B-C-D-A
        { from: "A", to: "B", type: "edge" },
        { from: "B", to: "C", type: "edge" },
        { from: "C", to: "D", type: "edge" },
        { from: "D", to: "A", type: "edge" },
        // Inner cycle: B-E-F-B
        { from: "B", to: "E", type: "edge" },
        { from: "E", to: "F", type: "edge" },
        { from: "F", to: "B", type: "edge" }
      ]
    },
    [] // No bridges - all edges in cycles
  );

/**
 * Edge Case Test 4: Bridge Connecting Loops
 * Input: Two cycles connected by a single bridge edge
 * Graph: (A-B-C-A) -- bridge(A-D) -- (D-E-F-D)
 * Expected Output: A-D is the bridge connecting two cycles
 * 
 * External validation edges:
 * const edges = [[0, 1], [1, 2], [2, 0], [0, 3], [3, 4], [4, 5], [5, 3]];
 */
const bridge_detection_bridge_with_loops = new UnitTestBuilder("bridge_detection_bridge_with_loops")
  .procedure(graph_bridge_detection)
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
        // Left cycle: A-B-C-A
        { from: "A", to: "B", type: "edge" },
        { from: "B", to: "C", type: "edge" },
        { from: "C", to: "A", type: "edge" },
        // Bridge edge
        { from: "A", to: "D", type: "edge" },
        // Right cycle: D-E-F-D
        { from: "D", to: "E", type: "edge" },
        { from: "E", to: "F", type: "edge" },
        { from: "F", to: "D", type: "edge" }
      ]
    },
    [
      { from: "A", to: "D" }
    ] // Only A-D is a bridge
  );

/**
 * Edge Case Test 5: Complex Indirect Loops with Bridges
 * Input: Diamond structure with pendant edges creating bridges
 * Graph: A-B-D-C-A (diamond) with pendant edges D-E and D-F
 * Expected Output: D-E and D-F are bridges (removing either disconnects pendant)
 * 
 * External validation edges:
 * const edges = [[0, 1], [1, 3], [3, 2], [2, 0], [0, 3], [3, 4], [3, 5]];
 */
const bridge_detection_indirect_loops = new UnitTestBuilder("bridge_detection_indirect_loops")
  .procedure(graph_bridge_detection)
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
        // Diamond: A-B-D-C-A (plus direct A-D connection)
        { from: "A", to: "B", type: "edge" },
        { from: "B", to: "D", type: "edge" },
        { from: "D", to: "C", type: "edge" },
        { from: "C", to: "A", type: "edge" },
        { from: "A", to: "D", type: "edge" }, // Direct A-D (creates cycle)
        // Pendant edges (these are bridges)
        { from: "D", to: "E", type: "edge" },
        { from: "D", to: "F", type: "edge" }
      ]
    },
    [
      { from: "D", to: "E" },
      { from: "D", to: "F" }
    ] // Pendant edges are bridges
  );

/**
 * Edge Case Test 6: Multiple Bridges in Chain with Loops
 * Input: Chain of cycles connected by bridges
 * Graph: (A-B-A) -- C -- (D-E-D) -- F -- (G-H-G)
 * Expected Output: All connecting edges are bridges
 * 
 * External validation edges:
 * const edges = [[0, 1], [1, 0], [0, 2], [2, 3], [3, 4], [4, 3], [3, 5], [5, 6], [6, 7], [7, 6]];
 */
const bridge_detection_chain_with_loops = new UnitTestBuilder("bridge_detection_chain_with_loops")
  .procedure(graph_bridge_detection)
  .test(
    {
      nodes: [
        { id: "A", type: "node" },
        { id: "B", type: "node" },
        { id: "C", type: "node" },
        { id: "D", type: "node" },
        { id: "E", type: "node" },
        { id: "F", type: "node" },
        { id: "G", type: "node" },
        { id: "H", type: "node" }
      ],
      edges: [
        // First cycle: A-B-A
        { from: "A", to: "B", type: "edge" },
        { from: "B", to: "A", type: "edge" },
        // Bridge to intermediate
        { from: "A", to: "C", type: "edge" },
        { from: "C", to: "D", type: "edge" },
        // Second cycle: D-E-D
        { from: "D", to: "E", type: "edge" },
        { from: "E", to: "D", type: "edge" },
        // Bridge to third cycle
        { from: "D", to: "F", type: "edge" },
        { from: "F", to: "G", type: "edge" },
        // Third cycle: G-H-G
        { from: "G", to: "H", type: "edge" },
        { from: "H", to: "G", type: "edge" }
      ]
    },
    [
      { from: "G", to: "H" },
      { from: "F", to: "G" },
      { from: "D", to: "E" },
      { from: "D", to: "F" },
      { from: "C", to: "D" },
      { from: "A", to: "B" },
      { from: "A", to: "C" }
    ] // All edges found as bridges (algorithm order) - Note: includes cycle edges
  );

/**
 * Edge Case Test 7: Self-loops with Parallel Edges
 * Input: Complex mix of self-loops, parallel edges, and bridges
 * Expected Output: Algorithm handles all edge types correctly
 * 
 * External validation edges:
 * const edges = [[0, 0], [1, 1], [2, 2], [3, 3], [0, 1], [0, 1], [1, 0], [1, 2], [2, 3], [3, 2], [2, 3]];
 */
const bridge_detection_mixed_edge_types = new UnitTestBuilder("bridge_detection_mixed_edge_types")
  .procedure(graph_bridge_detection)
  .test(
    {
      nodes: [
        { id: "A", type: "node" },
        { id: "B", type: "node" },
        { id: "C", type: "node" },
        { id: "D", type: "node" }
      ],
      edges: [
        // Self-loops (ignored)
        { from: "A", to: "A", type: "edge" },
        { from: "B", to: "B", type: "edge" },
        { from: "C", to: "C", type: "edge" },
        { from: "D", to: "D", type: "edge" },
        // Parallel edges A-B (treated as one)
        { from: "A", to: "B", type: "edge1" },
        { from: "A", to: "B", type: "edge2" },
        { from: "B", to: "A", type: "edge3" },
        // Bridge B-C
        { from: "B", to: "C", type: "edge" },
        // Parallel edges C-D (treated as one)
        { from: "C", to: "D", type: "edge1" },
        { from: "D", to: "C", type: "edge2" },
        { from: "C", to: "D", type: "edge3" }
      ]
    },
    [
      { from: "C", to: "D" },
      { from: "B", to: "C" },
      { from: "A", to: "B" }
    ] // All edges are bridges in the path A-B-C-D (algorithm order)
  );

export default Template(
  bridge_detection_validation_1,
  bridge_detection_validation_2,
  bridge_detection_validation_3,
  bridge_detection_validation_triangle,
  bridge_detection_validation_star,
  bridge_detection_validation_disconnected,
  bridge_detection_validation_single_edge,
  bridge_detection_validation_empty,
  bridge_detection_validation_no_edges,
  bridge_detection_self_loops,
  bridge_detection_parallel_edges,
  bridge_detection_nested_loops,
  bridge_detection_bridge_with_loops,
  bridge_detection_indirect_loops,
  bridge_detection_chain_with_loops,
  bridge_detection_mixed_edge_types
);