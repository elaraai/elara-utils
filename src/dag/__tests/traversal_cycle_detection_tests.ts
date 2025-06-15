import { UnitTestBuilder } from "@elaraai/core";
import { Template } from "@elaraai/core";

import { graph_cycle_detection } from "../traversal/cycle_detection";

// === CYCLE DETECTION TESTS ===

// No cycle test
const cycle_detection_no_cycle_test = new UnitTestBuilder("cycle_detection_no_cycle")
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
      ]
    },
    {
      has_cycle: false,
      cycle_nodes: []
    }
  );

// Simple cycle test
const cycle_detection_simple_cycle_test = new UnitTestBuilder("cycle_detection_simple_cycle")
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
      ]
    },
    {
      has_cycle: true,
      cycle_nodes: ["A", "C"] // Back edge detected
    }
  );

// Self-loop cycle test
const cycle_detection_self_loop_test = new UnitTestBuilder("cycle_detection_self_loop")
  .procedure(graph_cycle_detection)
  .test(
    {
      nodes: [
        { id: "A", type: "self" }
      ],
      edges: [
        { from: "A", to: "A", type: "loop" }
      ]
    },
    {
      has_cycle: true,
      cycle_nodes: ["A", "A"]
    }
  );

// Complex graph that could expose infinite loop bugs in DFS
const cycle_detection_complex_stress_test = new UnitTestBuilder("cycle_detection_complex_stress")
  .procedure(graph_cycle_detection)
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
        // Create a complex graph with multiple cycles and shared paths
        { from: "A", to: "B", type: "flow" },
        { from: "B", to: "C", type: "process" },
        { from: "C", to: "D", type: "transfer" },
        { from: "D", to: "B", type: "feedback" }, // Cycle: B -> C -> D -> B
        { from: "A", to: "E", type: "branch" },
        { from: "E", to: "F", type: "flow" },
        { from: "F", to: "G", type: "process" },
        { from: "G", to: "E", type: "feedback" }, // Cycle: E -> F -> G -> E
        { from: "C", to: "H", type: "output" },
        { from: "H", to: "F", type: "connection" }, // Cross-connection between cycles
        { from: "G", to: "A", type: "return" }  // Back edge to root creating larger cycle
      ]
    },
    {
      has_cycle: true,
      cycle_nodes: ["E", "G"] // Early termination - stops at first cycle found
    }
  );

// Test case that reproduces the missing key error - nodes with no outgoing edges
const cycle_detection_missing_key_test = new UnitTestBuilder("cycle_detection_missing_key")
  .procedure(graph_cycle_detection)
  .test(
    {
      nodes: [
        { id: "NODE1", type: "source" },
        { id: "NODE2", type: "leaf" }, // This node has no outgoing edges
        { id: "NODE3", type: "leaf" }  // This node also has no outgoing edges
      ],
      edges: [
        { from: "NODE1", to: "NODE2", type: "distribute" },
        { from: "NODE1", to: "NODE3", type: "distribute" }
        // Note: NODE2 and NODE3 have no outgoing edges, so they won't be in adjacency list
      ]
    },
    {
      has_cycle: false,
      cycle_nodes: []
    }
  );

// Test case that reproduces edge referencing non-existent node
const cycle_detection_dangling_edge_test = new UnitTestBuilder("cycle_detection_dangling_edge")
  .procedure(graph_cycle_detection)
  .test(
    {
      nodes: [
        { id: "NODE1", type: "source" },
        { id: "NODE2", type: "target" }
      ],
      edges: [
        { from: "NODE1", to: "NODE2", type: "flow" },
        { from: "NODE2", to: "MISSING_NODE", type: "dangling" } // This references a node not in the nodes array
      ]
    },
    {
      has_cycle: false,
      cycle_nodes: []
    }
  );

export default Template(
  cycle_detection_no_cycle_test,
  cycle_detection_simple_cycle_test,
  cycle_detection_self_loop_test,
  cycle_detection_complex_stress_test,
  cycle_detection_missing_key_test,
  cycle_detection_dangling_edge_test
);