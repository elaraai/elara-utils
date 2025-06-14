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
        { from: "A", to: "B" },
        { from: "B", to: "C" }
      ],
      startId: "A",
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
        { from: "A", to: "B" },
        { from: "A", to: "C" },
        { from: "B", to: "D" },
        { from: "C", to: "D" }
      ],
      startId: "A",
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
        { from: "A", to: "B" },
        { from: "A", to: "C" },
        { from: "B", to: "D" },
        { from: "C", to: "D" },
        { from: "B", to: "E" },
        { from: "D", to: "E" }
      ],
      startId: "A",
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
        { from: "A", to: "B" }
      ],
      startId: "A",
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