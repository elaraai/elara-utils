import { UnitTestBuilder } from "@elaraai/core";
import { Template } from "@elaraai/core";

import { graph_shortest_path } from "../paths/shortest_path";

// === SHORTEST PATH TESTS ===

// Basic shortest path test
const shortest_path_basic_test = new UnitTestBuilder("shortest_path_basic")
  .procedure(graph_shortest_path)
  .test(
    {
      nodes: [
        { id: "A", type: "start" },
        { id: "B", type: "middle" },
        { id: "C", type: "end" }
      ],
      edges: [
        { from: "A", to: "B", weight: 5.0, delay: null },
        { from: "B", to: "C", weight: 3.0, delay: null }
      ],
      source_node_id: "A",
      endId: "C"
    },
    {
      shortest_path: ["A", "B", "C"],
      total_cost: 8.0
    }
  );

// Multiple paths with different costs
const shortest_path_multiple_test = new UnitTestBuilder("shortest_path_multiple")
  .procedure(graph_shortest_path)
  .test(
    {
      nodes: [
        { id: "A", type: "start" },
        { id: "B", type: "expensive" },
        { id: "C", type: "cheap" },
        { id: "D", type: "end" }
      ],
      edges: [
        { from: "A", to: "B", weight: 10.0, delay: null },
        { from: "A", to: "C", weight: 2.0, delay: null },
        { from: "B", to: "D", weight: 1.0, delay: null },
        { from: "C", to: "D", weight: 3.0, delay: null }
      ],
      source_node_id: "A",
      endId: "D"
    },
    {
      shortest_path: ["A", "C", "D"],
      total_cost: 5.0
    }
  );

// Complex shortest path test
const shortest_path_complex_test = new UnitTestBuilder("shortest_path_complex")
  .procedure(graph_shortest_path)
  .test(
    {
      nodes: [
        { id: "A", type: "start" },
        { id: "B", type: "node" },
        { id: "C", type: "node" },
        { id: "D", type: "node" },
        { id: "E", type: "end" }
      ],
      edges: [
        { from: "A", to: "B", weight: 4.0, delay: null },
        { from: "A", to: "C", weight: 2.0, delay: null },
        { from: "B", to: "D", weight: 3.0, delay: null },
        { from: "C", to: "B", weight: 1.0, delay: null },
        { from: "C", to: "D", weight: 4.0, delay: null },
        { from: "D", to: "E", weight: 2.0, delay: null }
      ],
      source_node_id: "A",
      endId: "E"
    },
    {
      shortest_path: ["A", "C", "D", "E"],
      total_cost: 8.0
    }
  );

export default Template(
  shortest_path_basic_test,
  shortest_path_multiple_test,
  shortest_path_complex_test
);