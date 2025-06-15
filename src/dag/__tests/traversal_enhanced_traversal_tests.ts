import { UnitTestBuilder } from "@elaraai/core";
import { Template } from "@elaraai/core";

import { graph_enhanced_traversal } from "../traversal/enhanced_traversal";

// === ENHANCED TRAVERSAL TESTS ===

// Enhanced BFS traversal test
const enhanced_bfs_test = new UnitTestBuilder("enhanced_bfs")
  .procedure(graph_enhanced_traversal)
  .test(
    {
      nodes: [
        { id: "A", type: "root" },
        { id: "B", type: "node" },
        { id: "C", type: "node" },
        { id: "D", type: "leaf" }
      ],
      edges: [
        { from: "A", to: "B", type: "flow" },
        { from: "A", to: "C", type: "process" },
        { from: "B", to: "D", type: "transfer" }
      ],
      source_node_id: "A",
      useBFS: true
    },
    [
      { id: "A", visited_order: 0n, depth: 0n, parent_id: null },
      { id: "B", visited_order: 1n, depth: 1n, parent_id: "A" },
      { id: "C", visited_order: 2n, depth: 1n, parent_id: "A" },
      { id: "D", visited_order: 3n, depth: 2n, parent_id: "B" }
    ]
  );

// Enhanced DFS traversal test  
const enhanced_dfs_test = new UnitTestBuilder("enhanced_dfs")
  .procedure(graph_enhanced_traversal)
  .test(
    {
      nodes: [
        { id: "A", type: "root" },
        { id: "B", type: "node" },
        { id: "C", type: "node" },
        { id: "D", type: "leaf" }
      ],
      edges: [
        { from: "A", to: "B", type: "flow" },
        { from: "A", to: "C", type: "process" },
        { from: "B", to: "D", type: "transfer" }
      ],
      source_node_id: "A",
      useBFS: false
    },
    [
      { id: "A", visited_order: 0n, depth: 0n, parent_id: null },
      { id: "C", visited_order: 1n, depth: 1n, parent_id: "A" },
      { id: "B", visited_order: 2n, depth: 1n, parent_id: "A" },
      { id: "D", visited_order: 3n, depth: 2n, parent_id: "B" }
    ]
  );

export default Template(
  enhanced_bfs_test,
  enhanced_dfs_test
);