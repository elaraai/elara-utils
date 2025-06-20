import { UnitTestBuilder } from "@elaraai/core";
import { Template } from "@elaraai/core";
import { graph_strong_subgraphs } from "../connectivity/strong_subgraphs";

/**
 * VALIDATION TESTS using GeeksforGeeks authoritative examples
 * Source: https://www.geeksforgeeks.org/dsa/strongly-connected-components/
 * These tests extend the SCC validation to include complete subgraph structures
 * with nodes, edges, source/target detection, and type filtering capabilities
 */

/**
 * Validation Test 1: GeeksforGeeks Example 1 - Complete Subgraph Structure
 * Input: V = 5, edges = [[1, 0], [0, 2], [2, 1], [0, 3], [3, 4]]
 * Expected SCCs: [["4"], ["3"], ["0", "1", "2"]]
 * Expected Subgraphs: Three complete subgraphs with proper edge inclusion
 * Source: GeeksforGeeks "Strongly Connected Components"
 */
const strong_subgraphs_validation_1 = new UnitTestBuilder("strong_subgraphs_validation_1")
  .procedure(graph_strong_subgraphs)
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
      ],
      node_types: [], // No filtering
      edge_types: []  // No filtering
    },
    [
      // SCC 1: Single node "4" (isolated)
      {
        nodes: [{ id: "4", type: "node" }],
        edges: [],
        source_nodes: ["4"], // No incoming edges within SCC
        target_nodes: ["4"], // No outgoing edges within SCC
        node_types: new Set(["node"]),
        edge_types: new Set([])
      },
      // SCC 2: Single node "3" (intermediate)
      {
        nodes: [{ id: "3", type: "node" }],
        edges: [],
        source_nodes: ["3"], // No incoming edges within SCC
        target_nodes: ["3"], // No outgoing edges within SCC
        node_types: new Set(["node"]),
        edge_types: new Set([])
      },
      // SCC 3: Cycle "1" ↔ "2" ↔ "0" (strongly connected)
      {
        nodes: [
          { id: "1", type: "node" },
          { id: "2", type: "node" },
          { id: "0", type: "node" }
        ],
        edges: [
          { from: "1", to: "0", type: "edge" },
          { from: "2", to: "1", type: "edge" },
          { from: "0", to: "2", type: "edge" }
        ],
        source_nodes: [], // All nodes have incoming edges within SCC
        target_nodes: [], // All nodes have outgoing edges within SCC
        node_types: new Set(["node"]),
        edge_types: new Set(["edge"])
      }
    ]
  );

/**
 * Validation Test 2: GeeksforGeeks Example 2 - Acyclic Graph
 * Input: V = 4, edges = [[0, 1], [1, 2], [2, 3]]
 * Expected SCCs: [["3"], ["2"], ["1"], ["0"]] (each node is its own SCC)
 * Expected Subgraphs: Four single-node subgraphs with no internal edges
 */
const strong_subgraphs_validation_2 = new UnitTestBuilder("strong_subgraphs_validation_2")
  .procedure(graph_strong_subgraphs)
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
      ],
      node_types: [],
      edge_types: []
    },
    [
      {
        nodes: [{ id: "3", type: "node" }],
        edges: [],
        source_nodes: ["3"],
        target_nodes: ["3"],
        node_types: new Set(["node"]),
        edge_types: new Set([])
      },
      {
        nodes: [{ id: "2", type: "node" }],
        edges: [],
        source_nodes: ["2"],
        target_nodes: ["2"],
        node_types: new Set(["node"]),
        edge_types: new Set([])
      },
      {
        nodes: [{ id: "1", type: "node" }],
        edges: [],
        source_nodes: ["1"],
        target_nodes: ["1"],
        node_types: new Set(["node"]),
        edge_types: new Set([])
      },
      {
        nodes: [{ id: "0", type: "node" }],
        edges: [],
        source_nodes: ["0"],
        target_nodes: ["0"],
        node_types: new Set(["node"]),
        edge_types: new Set([])
      }
    ]
  );

/**
 * Validation Test 3: Simple Cycle - All Nodes Strongly Connected
 * Input: Triangle A→B→C→A
 * Expected SCCs: [["A", "B", "C"]]
 * Expected Subgraphs: Single subgraph with all three nodes and edges
 */
const strong_subgraphs_cycle = new UnitTestBuilder("strong_subgraphs_cycle")
  .procedure(graph_strong_subgraphs)
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
      ],
      node_types: [],
      edge_types: []
    },
    [
      {
        nodes: [
          { id: "C", type: "node" },
          { id: "B", type: "node" },
          { id: "A", type: "node" }
        ],
        edges: [
          { from: "C", to: "A", type: "edge" },
          { from: "B", to: "C", type: "edge" },
          { from: "A", to: "B", type: "edge" }
        ],
        source_nodes: [], // All nodes have incoming edges
        target_nodes: [], // All nodes have outgoing edges
        node_types: new Set(["node"]),
        edge_types: new Set(["edge"])
      }
    ]
  );

/**
 * Test 4: Empty Graph
 * Input: No nodes, no edges
 * Expected Output: Empty array
 */
const strong_subgraphs_empty = new UnitTestBuilder("strong_subgraphs_empty")
  .procedure(graph_strong_subgraphs)
  .test(
    {
      nodes: [],
      edges: [],
      node_types: [],
      edge_types: []
    },
    []
  );

/**
 * Test 5: Single Node
 * Input: One isolated node
 * Expected Output: Single subgraph with one node
 */
const strong_subgraphs_single = new UnitTestBuilder("strong_subgraphs_single")
  .procedure(graph_strong_subgraphs)
  .test(
    {
      nodes: [{ id: "A", type: "node" }],
      edges: [],
      node_types: [],
      edge_types: []
    },
    [
      {
        nodes: [{ id: "A", type: "node" }],
        edges: [],
        source_nodes: ["A"],
        target_nodes: ["A"],
        node_types: new Set(["node"]),
        edge_types: new Set([])
      }
    ]
  );

/**
 * Test 6: Self-loops - Each Node Forms Its Own SCC
 * Input: Nodes with self-loops
 * Expected Output: Each node with self-loop forms its own SCC with self-edge
 */
const strong_subgraphs_self_loops = new UnitTestBuilder("strong_subgraphs_self_loops")
  .procedure(graph_strong_subgraphs)
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
      ],
      node_types: [],
      edge_types: []
    },
    [
      {
        nodes: [{ id: "C", type: "node" }],
        edges: [{ from: "C", to: "C", type: "edge" }],
        source_nodes: [], // Has incoming edge (self-loop)
        target_nodes: [], // Has outgoing edge (self-loop)
        node_types: new Set(["node"]),
        edge_types: new Set(["edge"])
      },
      {
        nodes: [{ id: "B", type: "node" }],
        edges: [{ from: "B", to: "B", type: "edge" }],
        source_nodes: [],
        target_nodes: [],
        node_types: new Set(["node"]),
        edge_types: new Set(["edge"])
      },
      {
        nodes: [{ id: "A", type: "node" }],
        edges: [{ from: "A", to: "A", type: "edge" }],
        source_nodes: [],
        target_nodes: [],
        node_types: new Set(["node"]),
        edge_types: new Set(["edge"])
      }
    ]
  );

/**
 * Test 7: Complex Multiple SCCs with Different Types
 * Input: Graph with multiple cycles and node types for filtering
 * Expected Output: Multiple SCCs with proper type tracking
 */
const strong_subgraphs_complex_types = new UnitTestBuilder("strong_subgraphs_complex_types")
  .procedure(graph_strong_subgraphs)
  .test(
    {
      nodes: [
        { id: "A", type: "input" },
        { id: "B", type: "process" },
        { id: "C", type: "process" },
        { id: "D", type: "output" },
        { id: "E", type: "process" },
        { id: "F", type: "output" }
      ],
      edges: [
        // First SCC: A→B→C→A (input-process cycle)
        { from: "A", to: "B", type: "flow" },
        { from: "B", to: "C", type: "process" },
        { from: "C", to: "A", type: "feedback" },
        // Connection to second SCC
        { from: "C", to: "D", type: "flow" },
        // Second SCC: D→E→D (output-process cycle)
        { from: "D", to: "E", type: "control" },
        { from: "E", to: "D", type: "feedback" },
        // Isolated connection
        { from: "E", to: "F", type: "output" }
      ],
      node_types: [],
      edge_types: []
    },
    [
      {
        nodes: [{ id: "F", type: "output" }],
        edges: [],
        source_nodes: ["F"],
        target_nodes: ["F"],
        node_types: new Set(["output"]),
        edge_types: new Set([])
      },
      {
        nodes: [
          { id: "E", type: "process" },
          { id: "D", type: "output" }
        ],
        edges: [
          { from: "E", to: "D", type: "feedback" },
          { from: "D", to: "E", type: "control" }
        ],
        source_nodes: [],
        target_nodes: [],
        node_types: new Set(["process", "output"]),
        edge_types: new Set(["control", "feedback"])
      },
      {
        nodes: [
          { id: "C", type: "process" },
          { id: "B", type: "process" },
          { id: "A", type: "input" }
        ],
        edges: [
          { from: "C", to: "A", type: "feedback" },
          { from: "B", to: "C", type: "process" },
          { from: "A", to: "B", type: "flow" }
        ],
        source_nodes: [],
        target_nodes: [],
        node_types: new Set(["input", "process"]),
        edge_types: new Set(["flow", "process", "feedback"])
      }
    ]
  );

/**
 * Test 8: Node Type Filtering
 * Input: Same complex graph but filter for SCCs containing "process" nodes
 * Expected Output: Only SCCs that contain process nodes
 */
const strong_subgraphs_node_filtering = new UnitTestBuilder("strong_subgraphs_node_filtering")
  .procedure(graph_strong_subgraphs)
  .test(
    {
      nodes: [
        { id: "A", type: "input" },
        { id: "B", type: "process" },
        { id: "C", type: "process" },
        { id: "D", type: "output" },
        { id: "E", type: "process" },
        { id: "F", type: "output" }
      ],
      edges: [
        { from: "A", to: "B", type: "flow" },
        { from: "B", to: "C", type: "process" },
        { from: "C", to: "A", type: "feedback" },
        { from: "C", to: "D", type: "flow" },
        { from: "D", to: "E", type: "control" },
        { from: "E", to: "D", type: "feedback" },
        { from: "E", to: "F", type: "output" }
      ],
      node_types: [new Set(["process"])], // Filter for SCCs containing process nodes
      edge_types: []
    },
    [
      // Only the two SCCs that contain process nodes
      {
        nodes: [
          { id: "E", type: "process" },
          { id: "D", type: "output" }
        ],
        edges: [
          { from: "E", to: "D", type: "feedback" },
          { from: "D", to: "E", type: "control" }
        ],
        source_nodes: [],
        target_nodes: [],
        node_types: new Set(["process", "output"]),
        edge_types: new Set(["control", "feedback"])
      },
      {
        nodes: [
          { id: "C", type: "process" },
          { id: "B", type: "process" },
          { id: "A", type: "input" }
        ],
        edges: [
          { from: "C", to: "A", type: "feedback" },
          { from: "B", to: "C", type: "process" },
          { from: "A", to: "B", type: "flow" }
        ],
        source_nodes: [],
        target_nodes: [],
        node_types: new Set(["input", "process"]),
        edge_types: new Set(["flow", "process", "feedback"])
      }
    ]
  );

/**
 * Test 9: Edge Type Filtering
 * Input: Filter for SCCs containing "feedback" edges
 * Expected Output: Only SCCs with feedback loops
 */
const strong_subgraphs_edge_filtering = new UnitTestBuilder("strong_subgraphs_edge_filtering")
  .procedure(graph_strong_subgraphs)
  .test(
    {
      nodes: [
        { id: "A", type: "input" },
        { id: "B", type: "process" },
        { id: "C", type: "process" },
        { id: "D", type: "output" },
        { id: "E", type: "process" },
        { id: "F", type: "output" }
      ],
      edges: [
        { from: "A", to: "B", type: "flow" },
        { from: "B", to: "C", type: "process" },
        { from: "C", to: "A", type: "feedback" },
        { from: "C", to: "D", type: "flow" },
        { from: "D", to: "E", type: "control" },
        { from: "E", to: "D", type: "feedback" },
        { from: "E", to: "F", type: "output" }
      ],
      node_types: [],
      edge_types: [new Set(["feedback"])] // Filter for SCCs containing feedback edges
    },
    [
      // Only the two SCCs that contain feedback edges
      {
        nodes: [
          { id: "E", type: "process" },
          { id: "D", type: "output" }
        ],
        edges: [
          { from: "E", to: "D", type: "feedback" },
          { from: "D", to: "E", type: "control" }
        ],
        source_nodes: [],
        target_nodes: [],
        node_types: new Set(["process", "output"]),
        edge_types: new Set(["control", "feedback"])
      },
      {
        nodes: [
          { id: "C", type: "process" },
          { id: "B", type: "process" },
          { id: "A", type: "input" }
        ],
        edges: [
          { from: "C", to: "A", type: "feedback" },
          { from: "B", to: "C", type: "process" },
          { from: "A", to: "B", type: "flow" }
        ],
        source_nodes: [],
        target_nodes: [],
        node_types: new Set(["input", "process"]),
        edge_types: new Set(["flow", "process", "feedback"])
      }
    ]
  );

/**
 * Test 10: Combined Filtering
 * Input: Filter for SCCs containing both "process" nodes AND "feedback" edges
 * Expected Output: Only SCCs that satisfy both criteria
 */
const strong_subgraphs_combined_filtering = new UnitTestBuilder("strong_subgraphs_combined_filtering")
  .procedure(graph_strong_subgraphs)
  .test(
    {
      nodes: [
        { id: "A", type: "input" },
        { id: "B", type: "process" },
        { id: "C", type: "process" },
        { id: "D", type: "output" },
        { id: "E", type: "process" },
        { id: "F", type: "output" }
      ],
      edges: [
        { from: "A", to: "B", type: "flow" },
        { from: "B", to: "C", type: "process" },
        { from: "C", to: "A", type: "feedback" },
        { from: "C", to: "D", type: "flow" },
        { from: "D", to: "E", type: "control" },
        { from: "E", to: "D", type: "feedback" },
        { from: "E", to: "F", type: "output" }
      ],
      node_types: [new Set(["process"])],
      edge_types: [new Set(["feedback"])]
    },
    [
      // Both SCCs satisfy both criteria
      {
        nodes: [
          { id: "E", type: "process" },
          { id: "D", type: "output" }
        ],
        edges: [
          { from: "E", to: "D", type: "feedback" },
          { from: "D", to: "E", type: "control" }
        ],
        source_nodes: [],
        target_nodes: [],
        node_types: new Set(["process", "output"]),
        edge_types: new Set(["control", "feedback"])
      },
      {
        nodes: [
          { id: "C", type: "process" },
          { id: "B", type: "process" },
          { id: "A", type: "input" }
        ],
        edges: [
          { from: "C", to: "A", type: "feedback" },
          { from: "B", to: "C", type: "process" },
          { from: "A", to: "B", type: "flow" }
        ],
        source_nodes: [],
        target_nodes: [],
        node_types: new Set(["input", "process"]),
        edge_types: new Set(["flow", "process", "feedback"])
      }
    ]
  );

export default Template(
  strong_subgraphs_validation_1,
  strong_subgraphs_validation_2,
  strong_subgraphs_cycle,
  strong_subgraphs_empty,
  strong_subgraphs_single,
  strong_subgraphs_self_loops,
  strong_subgraphs_complex_types,
  strong_subgraphs_node_filtering,
  strong_subgraphs_edge_filtering,
  strong_subgraphs_combined_filtering
);