import { UnitTestBuilder } from "@elaraai/core";
import { Template } from "@elaraai/core";

import { graph_all_paths } from "../paths/all_paths";

// === ALL PATHS TESTS ===

// Basic linear path test
const all_paths_linear_test = new UnitTestBuilder("all_paths_linear")
  .procedure(graph_all_paths)
  .test(
    {
      nodes: [
        { id: "A", type: "start" },
        { id: "B", type: "middle" },
        { id: "C", type: "end" }
      ],
      edges: [
        { from: "A", to: "B", type: "flow" },
        { from: "B", to: "C", type: "process" }
      ],
      source_node_id: "A",
      endId: "C"
    },
    {
      paths: [["A", "B", "C"]],
      path_count: 1n
    }
  );

// Multiple paths test
const all_paths_multiple_test = new UnitTestBuilder("all_paths_multiple")
  .procedure(graph_all_paths)
  .test(
    {
      nodes: [
        { id: "A", type: "start" },
        { id: "B", type: "path1" },
        { id: "C", type: "path2" },
        { id: "D", type: "end" }
      ],
      edges: [
        { from: "A", to: "B", type: "branch" },
        { from: "A", to: "C", type: "branch" },
        { from: "B", to: "D", type: "merge" },
        { from: "C", to: "D", type: "merge" }
      ],
      source_node_id: "A",
      endId: "D"
    },
    {
      paths: [["A", "C", "D"], ["A", "B", "D"]],
      path_count: 2n
    }
  );

// Complex graph with multiple paths
const all_paths_complex_test = new UnitTestBuilder("all_paths_complex")
  .procedure(graph_all_paths)
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
        { from: "A", to: "B", type: "branch" },
        { from: "A", to: "C", type: "branch" },
        { from: "B", to: "D", type: "process" },
        { from: "C", to: "D", type: "process" },
        { from: "B", to: "E", type: "direct" },
        { from: "D", to: "E", type: "transfer" }
      ],
      source_node_id: "A",
      endId: "E"
    },
    {
      paths: [["A", "C", "D", "E"], ["A", "B", "E"], ["A", "B", "D", "E"]],
      path_count: 3n
    }
  );

// No path exists test
const all_paths_no_path_test = new UnitTestBuilder("all_paths_no_path")
  .procedure(graph_all_paths)
  .test(
    {
      nodes: [
        { id: "A", type: "start" },
        { id: "B", type: "isolated" },
        { id: "C", type: "end" }
      ],
      edges: [
        { from: "A", to: "B", type: "flow" }
      ],
      source_node_id: "A",
      endId: "C"
    },
    {
      paths: [],
      path_count: 0n
    }
  );

export default Template(
  all_paths_linear_test,
  all_paths_multiple_test,
  all_paths_complex_test,
  all_paths_no_path_test
);