import { UnitTestBuilder } from "@elaraai/core";
import { Template } from "@elaraai/core";

import { graph_dfs } from "../traversal/depth_first";

// === DFS TESTS ===

// Basic DFS test - linear chain
const dfs_linear_test = new UnitTestBuilder("dfs_linear")
  .procedure(graph_dfs)
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

// DFS test - tree structure (different order than BFS)
const dfs_tree_test = new UnitTestBuilder("dfs_tree")
  .procedure(graph_dfs)
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
    ["A", "C", "B", "E", "D"] // Depth-first traversal (stack reverses order)
  );

// DFS test - diamond structure
const dfs_diamond_test = new UnitTestBuilder("dfs_diamond")
  .procedure(graph_dfs)
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
    ["A", "C", "D", "B"] // Should visit D only once via first path
  );

// Empty graph test (DFS)
const dfs_empty_test = new UnitTestBuilder("dfs_empty")
  .procedure(graph_dfs)
  .test(
    {
      nodes: [],
      edges: [],
      startId: "A"
    },
    ["A"] // Should return just the start node even if not in graph
  );

// Single node test (DFS)
const dfs_single_node_test = new UnitTestBuilder("dfs_single_node")
  .procedure(graph_dfs)
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

// Self-loop test (DFS)
const dfs_self_loop_test = new UnitTestBuilder("dfs_self_loop")
  .procedure(graph_dfs)
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

// Disconnected graph test (DFS) - only reachable nodes
const dfs_disconnected_test = new UnitTestBuilder("dfs_disconnected")
  .procedure(graph_dfs)
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

// Cycle test (DFS) - ensure no infinite loop
const dfs_cycle_test = new UnitTestBuilder("dfs_cycle")
  .procedure(graph_dfs)
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

// Duplicate edges test (DFS)
const dfs_duplicate_edges_test = new UnitTestBuilder("dfs_duplicate_edges")
  .procedure(graph_dfs)
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

// Large branching factor test (DFS)
const dfs_large_branching_test = new UnitTestBuilder("dfs_large_branching")
  .procedure(graph_dfs)
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
    ["root", "child5", "child4", "child3", "child2", "child1"] // Reverse order due to stack
  );

export default Template(
  dfs_linear_test,
  dfs_tree_test,
  dfs_diamond_test,
  dfs_empty_test,
  dfs_single_node_test,
  dfs_self_loop_test,
  dfs_disconnected_test,
  dfs_cycle_test,
  dfs_duplicate_edges_test,
  dfs_large_branching_test
);