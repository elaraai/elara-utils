import { UnitTestBuilder } from "@elaraai/core";
import { Template } from "@elaraai/core";
import { graph_articulation_points } from "../connectivity/articulation_points";

/**
 * VALIDATION TESTS using GeeksforGeeks authoritative examples
 * Source: https://www.geeksforgeeks.org/dsa/articulation-points-or-cut-vertices-in-a-graph/
 * These tests use known correct answers from established algorithms literature
 */

/**
 * Validation Test 1: GeeksforGeeks Example 1
 * Input: V = 5, edges = [[0, 1], [1, 4], [2, 3], [2, 4], [3, 4]]
 * Expected Output: [1, 4] 
 * Source: GeeksforGeeks "Articulation Points (or Cut Vertices) in a Graph"
 * 
 * External validation edges:
 * const edges = [[0, 1], [1, 4], [2, 3], [2, 4], [3, 4]];
 */
const articulation_points_validation_1 = new UnitTestBuilder("articulation_points_validation_1")
  .procedure(graph_articulation_points)
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
        { from: "0", to: "1", type: "edge" },
        { from: "1", to: "4", type: "edge" },
        { from: "2", to: "3", type: "edge" },
        { from: "2", to: "4", type: "edge" },
        { from: "3", to: "4", type: "edge" }
      ]
    },
    ["1", "4"] // Known correct answer from GeeksforGeeks
  );

/**
 * Validation Test 2: GeeksforGeeks Example 2  
 * Input: V = 4, edges = [[0, 1], [0, 2]]
 * Expected Output: [0]
 * Source: GeeksforGeeks "Articulation Points (or Cut Vertices) in a Graph"
 * 
 * External validation edges:
 * const edges = [[0, 1], [0, 2]];
 */
const articulation_points_validation_2 = new UnitTestBuilder("articulation_points_validation_2")
  .procedure(graph_articulation_points)
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
        { from: "0", to: "2", type: "edge" }
      ]
    },
    ["0"] // Known correct answer from GeeksforGeeks
  );

/**
 * Validation Test 3: Simple Chain
 * Input: A—B—C (linear chain)
 * Expected Output: [B] (middle node is articulation point)
 * 
 * External validation edges:
 * const edges = [[0, 1], [1, 2]];
 */
const articulation_points_validation_chain = new UnitTestBuilder("articulation_points_validation_chain")
  .procedure(graph_articulation_points)
  .test(
    {
      nodes: [
        { id: "A", type: "node" },
        { id: "B", type: "node" },
        { id: "C", type: "node" }
      ],
      edges: [
        { from: "A", to: "B", type: "edge" },
        { from: "B", to: "C", type: "edge" }
      ]
    },
    ["B"] // Middle node in chain is articulation point
  );

/**
 * Validation Test 4: Triangle (Complete Graph K3)
 * Input: Triangle A—B—C—A
 * Expected Output: [] (no articulation points in complete graph)
 * 
 * External validation edges:
 * const edges = [[0, 1], [1, 2], [2, 0]];
 */
const articulation_points_validation_triangle = new UnitTestBuilder("articulation_points_validation_triangle")
  .procedure(graph_articulation_points)
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
    [] // No articulation points in triangle
  );

/**
 * Validation Test 5: Star Graph
 * Input: Star with center node connected to 3 leaf nodes
 * Expected Output: [center] (center is articulation point)
 * 
 * External validation edges:
 * const edges = [[0, 1], [0, 2], [0, 3]];
 */
const articulation_points_validation_star = new UnitTestBuilder("articulation_points_validation_star")
  .procedure(graph_articulation_points)
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
    ["center"] // Center of star is articulation point
  );

/**
 * Validation Test 6: Disconnected Components
 * Input: Two separate edges A—B and C—D
 * Expected Output: [] (no articulation points in disconnected graph)
 * 
 * External validation edges:
 * const edges = [[0, 1], [2, 3]];
 */
const articulation_points_validation_disconnected = new UnitTestBuilder("articulation_points_validation_disconnected")
  .procedure(graph_articulation_points)
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
    [] // No articulation points in disconnected components
  );

/**
 * Validation Test 7: Single Node
 * Input: One isolated node
 * Expected Output: [] (single node cannot be articulation point)
 * 
 * External validation edges:
 * const edges = [];
 */
const articulation_points_validation_single = new UnitTestBuilder("articulation_points_validation_single")
  .procedure(graph_articulation_points)
  .test(
    {
      nodes: [
        { id: "A", type: "node" }
      ],
      edges: []
    },
    [] // Single node cannot be articulation point
  );

/**
 * Validation Test 8: Empty Graph
 * Input: No nodes, no edges
 * Expected Output: [] (no articulation points possible)
 * 
 * External validation edges:
 * const edges = [];
 */
const articulation_points_validation_empty = new UnitTestBuilder("articulation_points_validation_empty")
  .procedure(graph_articulation_points)
  .test(
    {
      nodes: [],
      edges: []
    },
    [] // No articulation points in empty graph
  );

/**
 * Edge Case Test 1: Self-loops
 * Input: Nodes with self-loops (should be ignored)
 * Expected Output: Self-loops don't affect articulation point detection
 * 
 * External validation edges:
 * const edges = [[0, 0], [0, 1], [1, 1], [1, 2], [2, 2]];
 */
const articulation_points_self_loops = new UnitTestBuilder("articulation_points_self_loops")
  .procedure(graph_articulation_points)
  .test(
    {
      nodes: [
        { id: "A", type: "node" },
        { id: "B", type: "node" },
        { id: "C", type: "node" }
      ],
      edges: [
        { from: "A", to: "A", type: "edge" }, // Self-loop - should be ignored
        { from: "A", to: "B", type: "edge" },
        { from: "B", to: "B", type: "edge" }, // Self-loop - should be ignored
        { from: "B", to: "C", type: "edge" },
        { from: "C", to: "C", type: "edge" }  // Self-loop - should be ignored
      ]
    },
    ["B"] // Same as simple chain A-B-C
  );

/**
 * Edge Case Test 2: Parallel Edges
 * Input: Multiple edges between same nodes
 * Expected Output: Parallel edges treated as single edge
 * 
 * External validation edges:
 * const edges = [[0, 1], [0, 1], [1, 0], [1, 2], [2, 1]];
 */
const articulation_points_parallel_edges = new UnitTestBuilder("articulation_points_parallel_edges")
  .procedure(graph_articulation_points)
  .test(
    {
      nodes: [
        { id: "A", type: "node" },
        { id: "B", type: "node" },
        { id: "C", type: "node" }
      ],
      edges: [
        { from: "A", to: "B", type: "edge1" },
        { from: "A", to: "B", type: "edge2" }, // Parallel edge
        { from: "B", to: "A", type: "edge3" }, // Reverse parallel edge
        { from: "B", to: "C", type: "edge4" },
        { from: "C", to: "B", type: "edge5" }  // Reverse edge
      ]
    },
    ["B"] // Same as simple chain despite parallel edges
  );

/**
 * Edge Case Test 3: Complex Nested Loops
 * Input: Graph with multiple overlapping cycles
 * Graph: A-B-C-D-A (outer cycle) with B-E-F-C (inner cycle sharing two nodes)
 * Expected Output: No articulation points - both cycles share multiple nodes
 * 
 * External validation edges:
 * const edges = [[0, 1], [1, 2], [2, 3], [3, 0], [1, 4], [4, 5], [5, 2]];
 */
const articulation_points_nested_loops = new UnitTestBuilder("articulation_points_nested_loops")
  .procedure(graph_articulation_points)
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
        // Inner cycle: B-E-F-C (shares two nodes with outer cycle)
        { from: "B", to: "E", type: "edge" },
        { from: "E", to: "F", type: "edge" },
        { from: "F", to: "C", type: "edge" }
      ]
    },
    [] // No articulation points - all nodes in cycles
  );

/**
 * Edge Case Test 4: Bridge with Loops
 * Input: Two cycles connected by a bridge through articulation point
 * Graph: (A-B-C-A) with multiple connections to D, D connects to (E-F-G-E)
 * Expected Output: D is articulation point connecting two cycles
 * 
 * External validation edges:
 * const edges = [[0, 1], [1, 2], [2, 0], [0, 3], [2, 3], [3, 4], [3, 6], [4, 5], [5, 6], [6, 4]];
 */
const articulation_points_bridge_with_loops = new UnitTestBuilder("articulation_points_bridge_with_loops")
  .procedure(graph_articulation_points)
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
        // Left cycle: A-B-C-A
        { from: "A", to: "B", type: "edge" },
        { from: "B", to: "C", type: "edge" },
        { from: "C", to: "A", type: "edge" },
        // Bridge through D with redundant connections
        { from: "A", to: "D", type: "edge" },
        { from: "C", to: "D", type: "edge" }, // Additional connection from left cycle
        { from: "D", to: "E", type: "edge" },
        { from: "D", to: "G", type: "edge" }, // Additional connection to right cycle
        // Right cycle: E-F-G-E
        { from: "E", to: "F", type: "edge" },
        { from: "F", to: "G", type: "edge" },
        { from: "G", to: "E", type: "edge" }
      ]
    },
    ["D"] // D is the articulation point connecting two cycles
  );

/**
 * Edge Case Test 5: Complex Indirect Loops
 * Input: Multiple paths between same nodes creating complex connectivity
 * Graph: Diamond with extra connections forming multiple cycles
 * 
 * External validation edges:
 * const edges = [[0, 1], [1, 3], [3, 2], [2, 0], [0, 3], [1, 2], [3, 4]];
 */
const articulation_points_indirect_loops = new UnitTestBuilder("articulation_points_indirect_loops")
  .procedure(graph_articulation_points)
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
        // Diamond: A-B-D-C-A
        { from: "A", to: "B", type: "edge" },
        { from: "B", to: "D", type: "edge" },
        { from: "D", to: "C", type: "edge" },
        { from: "C", to: "A", type: "edge" },
        // Additional connections creating indirect loops
        { from: "A", to: "D", type: "edge" }, // Direct A-D connection
        { from: "B", to: "C", type: "edge" }, // Direct B-C connection
        // Pendant node
        { from: "D", to: "E", type: "edge" }
      ]
    },
    ["D"] // D is articulation point - removing it disconnects E
  );

/**
 * Edge Case Test 6: Large Star with Self-loops
 * Input: Star network with self-loops on all nodes
 * Expected Output: Center remains articulation point despite self-loops
 * 
 * External validation edges:
 * const edges = [[0, 1], [0, 2], [0, 3], [0, 4], [0, 0], [1, 1], [2, 2], [3, 3], [4, 4]];
 */
const articulation_points_star_with_self_loops = new UnitTestBuilder("articulation_points_star_with_self_loops")
  .procedure(graph_articulation_points)
  .test(
    {
      nodes: [
        { id: "center", type: "node" },
        { id: "leaf1", type: "node" },
        { id: "leaf2", type: "node" },
        { id: "leaf3", type: "node" },
        { id: "leaf4", type: "node" }
      ],
      edges: [
        // Star connections
        { from: "center", to: "leaf1", type: "edge" },
        { from: "center", to: "leaf2", type: "edge" },
        { from: "center", to: "leaf3", type: "edge" },
        { from: "center", to: "leaf4", type: "edge" },
        // Self-loops on all nodes (should be ignored)
        { from: "center", to: "center", type: "edge" },
        { from: "leaf1", to: "leaf1", type: "edge" },
        { from: "leaf2", to: "leaf2", type: "edge" },
        { from: "leaf3", to: "leaf3", type: "edge" },
        { from: "leaf4", to: "leaf4", type: "edge" }
      ]
    },
    ["center"] // Center is still articulation point
  );

export default Template(
  articulation_points_validation_1,
  articulation_points_validation_2,
  articulation_points_validation_chain,
  articulation_points_validation_triangle,
  articulation_points_validation_star,
  articulation_points_validation_disconnected,
  articulation_points_validation_single,
  articulation_points_validation_empty,
  articulation_points_self_loops,
  articulation_points_parallel_edges,
  articulation_points_nested_loops,
  articulation_points_bridge_with_loops,
  articulation_points_indirect_loops,
  articulation_points_star_with_self_loops
);