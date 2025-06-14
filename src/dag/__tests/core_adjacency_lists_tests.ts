import { UnitTestBuilder } from "@elaraai/core";
import { Template } from "@elaraai/core";
import { graph_build_adjacency_lists } from "../core/adjacency_lists";

// Basic adjacency list building test
const basic_adjacency_test = new UnitTestBuilder("basic_adjacency")
  .procedure(graph_build_adjacency_lists)
  .test(
    {
      edges: [
        { from: "A", to: "B" },
        { from: "A", to: "C" },
        { from: "B", to: "D" }
      ]
    },
    {
      adjacency_list: new Map([
        ["A", ["B", "C"]],
        ["B", ["D"]]
      ]),
      reverse_adjacency_list: new Map([
        ["B", ["A"]],
        ["C", ["A"]],
        ["D", ["B"]]
      ])
    }
  );

// Empty graph test
const empty_adjacency_test = new UnitTestBuilder("empty_adjacency")
  .procedure(graph_build_adjacency_lists)
  .test(
    {
      edges: []
    },
    {
      adjacency_list: new Map(),
      reverse_adjacency_list: new Map()
    }
  );

// Self-loop test
const self_loop_test = new UnitTestBuilder("self_loop_adjacency")
  .procedure(graph_build_adjacency_lists)
  .test(
    {
      edges: [
        { from: "A", to: "A" },
        { from: "A", to: "B" }
      ]
    },
    {
      adjacency_list: new Map([
        ["A", ["A", "B"]]
      ]),
      reverse_adjacency_list: new Map([
        ["A", ["A"]],
        ["B", ["A"]]
      ])
    }
  );

// Multiple edges between same nodes test - duplicate edges are deduplicated
const multiple_edges_test = new UnitTestBuilder("multiple_edges_adjacency")
  .procedure(graph_build_adjacency_lists)
  .test(
    {
      edges: [
        { from: "A", to: "B" },
        { from: "A", to: "B" }, // Duplicate edge (will be deduplicated)
        { from: "B", to: "A" }
      ]
    },
    {
      adjacency_list: new Map([
        ["A", ["B"]],  // Only one B, duplicates removed
        ["B", ["A"]]
      ]),
      reverse_adjacency_list: new Map([
        ["B", ["A"]],  // Only one A, duplicates removed
        ["A", ["B"]]
      ])
    }
  );

export default Template(
  basic_adjacency_test,
  empty_adjacency_test,
  self_loop_test,
  multiple_edges_test
);