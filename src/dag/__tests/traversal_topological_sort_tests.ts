import { UnitTestBuilder } from "@elaraai/core";
import { Template } from "@elaraai/core";

import { graph_topological_sort } from "../traversal/topological_sort";

// === TOPOLOGICAL SORT TESTS ===

// Basic topological sort test
const topo_sort_basic_test = new UnitTestBuilder("topo_sort_basic")
  .procedure(graph_topological_sort)
  .test(
    {
      nodes: [
        { id: "A", type: "start" },
        { id: "B", type: "middle" },
        { id: "C", type: "middle" },
        { id: "D", type: "end" }
      ],
      edges: [
        { from: "A", to: "B", type: "flow" },
        { from: "A", to: "C", type: "flow" },
        { from: "B", to: "D", type: "process" },
        { from: "C", to: "D", type: "process" }
      ]
    },
    [
      { id: "A", topo_order: 0n, layer: 0n },
      { id: "B", topo_order: 1n, layer: 1n },
      { id: "C", topo_order: 2n, layer: 1n },
      { id: "D", topo_order: 3n, layer: 2n }
    ]
  );

// Topological sort with multiple roots
const topo_sort_multiple_roots_test = new UnitTestBuilder("topo_sort_multiple_roots")
  .procedure(graph_topological_sort)
  .test(
    {
      nodes: [
        { id: "A", type: "root1" },
        { id: "B", type: "root2" },
        { id: "C", type: "merge" }
      ],
      edges: [
        { from: "A", to: "C", type: "transfer" },
        { from: "B", to: "C", type: "transfer" }
      ]
    },
    [
      { id: "A", topo_order: 0n, layer: 0n },
      { id: "B", topo_order: 1n, layer: 0n },
      { id: "C", topo_order: 2n, layer: 1n }
    ]
  );

export default Template(
  topo_sort_basic_test,
  topo_sort_multiple_roots_test
);