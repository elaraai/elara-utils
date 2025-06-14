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
        { from: "A", to: "B" },
        { from: "B", to: "C" }
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
        { from: "A", to: "B" },
        { from: "B", to: "C" },
        { from: "C", to: "A" }
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
        { from: "A", to: "A" }
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
        { from: "A", to: "B" },
        { from: "B", to: "C" },
        { from: "C", to: "D" },
        { from: "D", to: "B" }, // Cycle: B -> C -> D -> B
        { from: "A", to: "E" },
        { from: "E", to: "F" },
        { from: "F", to: "G" },
        { from: "G", to: "E" }, // Cycle: E -> F -> G -> E
        { from: "C", to: "H" },
        { from: "H", to: "F" }, // Cross-connection between cycles
        { from: "G", to: "A" }  // Back edge to root creating larger cycle
      ]
    },
    {
      has_cycle: true,
      cycle_nodes: ["E", "G"] // Early termination - stops at first cycle found
    }
  );

export default Template(
  cycle_detection_no_cycle_test,
  cycle_detection_simple_cycle_test,
  cycle_detection_self_loop_test,
  cycle_detection_complex_stress_test
);