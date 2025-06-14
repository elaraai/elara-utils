import { UnitTestBuilder } from "@elaraai/core";
import { Template } from "@elaraai/core";

import { graph_bfs } from "../traversal/breadth_first";

// === BFS TESTS ===

// Basic BFS test - linear chain
const bfs_linear_test = new UnitTestBuilder("bfs_linear")
  .procedure(graph_bfs)
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
      ],
      startId: "A"
    },
    ["A", "B", "C"]
  );

// BFS test - tree structure
const bfs_tree_test = new UnitTestBuilder("bfs_tree")
  .procedure(graph_bfs)
  .test(
    {
      nodes: [
        { id: "A", type: "root" },
        { id: "B", type: "node" },
        { id: "C", type: "node" },
        { id: "D", type: "leaf" },
        { id: "E", type: "leaf" }
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "A", to: "C" },
        { from: "B", to: "D" },
        { from: "B", to: "E" }
      ],
      startId: "A"
    },
    ["A", "B", "C", "D", "E"] // Level-order traversal
  );

// BFS test - diamond structure
const bfs_diamond_test = new UnitTestBuilder("bfs_diamond")
  .procedure(graph_bfs)
  .test(
    {
      nodes: [
        { id: "A", type: "top" },
        { id: "B", type: "left" },
        { id: "C", type: "right" },
        { id: "D", type: "bottom" }
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "A", to: "C" },
        { from: "B", to: "D" },
        { from: "C", to: "D" }
      ],
      startId: "A"
    },
    ["A", "B", "C", "D"] // Should visit D only once
  );

// Empty graph test (BFS)
const bfs_empty_test = new UnitTestBuilder("bfs_empty")
  .procedure(graph_bfs)
  .test(
    {
      nodes: [],
      edges: [],
      startId: "A"
    },
    ["A"] // Should return just the start node even if not in graph
  );

// Single node test (BFS)
const bfs_single_node_test = new UnitTestBuilder("bfs_single_node")
  .procedure(graph_bfs)
  .test(
    {
      nodes: [
        { id: "A", type: "isolated" }
      ],
      edges: [],
      startId: "A"
    },
    ["A"] // Just the single node
  );

// Self-loop test (BFS)
const bfs_self_loop_test = new UnitTestBuilder("bfs_self_loop")
  .procedure(graph_bfs)
  .test(
    {
      nodes: [
        { id: "A", type: "self" },
        { id: "B", type: "normal" }
      ],
      edges: [
        { from: "A", to: "A" }, // Self-loop
        { from: "A", to: "B" }
      ],
      startId: "A"
    },
    ["A", "B"] // Should handle self-loop without infinite loop
  );

// Disconnected graph test (BFS) - only reachable nodes
const bfs_disconnected_test = new UnitTestBuilder("bfs_disconnected")
  .procedure(graph_bfs)
  .test(
    {
      nodes: [
        { id: "A", type: "component1" },
        { id: "B", type: "component1" },
        { id: "C", type: "component2" },
        { id: "D", type: "component2" }
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "C", to: "D" } // Separate component
      ],
      startId: "A"
    },
    ["A", "B"] // Should only visit connected component
  );

// Cycle test (BFS) - ensure no infinite loop
const bfs_cycle_test = new UnitTestBuilder("bfs_cycle")
  .procedure(graph_bfs)
  .test(
    {
      nodes: [
        { id: "A", type: "cycle" },
        { id: "B", type: "cycle" },
        { id: "C", type: "cycle" }
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "B", to: "C" },
        { from: "C", to: "A" } // Creates cycle
      ],
      startId: "A"
    },
    ["A", "B", "C"] // Should visit each node exactly once
  );

// Duplicate edges test (BFS)
const bfs_duplicate_edges_test = new UnitTestBuilder("bfs_duplicate_edges")
  .procedure(graph_bfs)
  .test(
    {
      nodes: [
        { id: "A", type: "node" },
        { id: "B", type: "node" }
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "A", to: "B" }, // Duplicate edge
        { from: "A", to: "B" }  // Another duplicate
      ],
      startId: "A"
    },
    ["A", "B"] // Should handle duplicates correctly
  );

// Large branching factor test (BFS)
const bfs_large_branching_test = new UnitTestBuilder("bfs_large_branching")
  .procedure(graph_bfs)
  .test(
    {
      nodes: [
        { id: "root", type: "root" },
        { id: "child1", type: "child" },
        { id: "child2", type: "child" },
        { id: "child3", type: "child" },
        { id: "child4", type: "child" },
        { id: "child5", type: "child" }
      ],
      edges: [
        { from: "root", to: "child1" },
        { from: "root", to: "child2" },
        { from: "root", to: "child3" },
        { from: "root", to: "child4" },
        { from: "root", to: "child5" }
      ],
      startId: "root"
    },
    ["root", "child1", "child2", "child3", "child4", "child5"] // Level-order
  );

export default Template(
  bfs_linear_test,
  bfs_tree_test,
  bfs_diamond_test,
  bfs_empty_test,
  bfs_single_node_test,
  bfs_self_loop_test,
  bfs_disconnected_test,
  bfs_cycle_test,
  bfs_duplicate_edges_test,
  bfs_large_branching_test
);