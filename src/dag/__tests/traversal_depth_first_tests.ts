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
        { from: "A", to: "B", type: "flow" },
        { from: "B", to: "C", type: "flow" }
      ],
      source_node_id: "A"
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
        { from: "A", to: "B", type: "branch" },
        { from: "A", to: "C", type: "branch" },
        { from: "B", to: "D", type: "process" },
        { from: "B", to: "E", type: "process" }
      ],
      source_node_id: "A"
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
        { from: "A", to: "B", type: "branch" },
        { from: "A", to: "C", type: "branch" },
        { from: "B", to: "D", type: "merge" },
        { from: "C", to: "D", type: "merge" }
      ],
      source_node_id: "A"
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
      source_node_id: "A"
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
      source_node_id: "A"
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
        { from: "A", to: "A", type: "loop" }, // Self-loop
        { from: "A", to: "B", type: "flow" }
      ],
      source_node_id: "A"
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
        { from: "A", to: "B", type: "flow" },
        { from: "C", to: "D", type: "flow" } // Separate component
      ],
      source_node_id: "A"
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
        { from: "A", to: "B", type: "flow" },
        { from: "B", to: "C", type: "flow" },
        { from: "C", to: "A", type: "cycle" } // Creates cycle
      ],
      source_node_id: "A"
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
        { from: "A", to: "B", type: "flow" },
        { from: "A", to: "B", type: "flow" }, // Duplicate edge
        { from: "A", to: "B", type: "flow" }  // Another duplicate
      ],
      source_node_id: "A"
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
        { from: "root", to: "child1", type: "branch" },
        { from: "root", to: "child2", type: "branch" },
        { from: "root", to: "child3", type: "branch" },
        { from: "root", to: "child4", type: "branch" },
        { from: "root", to: "child5", type: "branch" }
      ],
      source_node_id: "root"
    },
    ["root", "child5", "child4", "child3", "child2", "child1"] // Reverse order due to stack
  );

/**
 * Test 11: Invalid Start Node (Production Error)
 * Input: Start node not in graph | Output: Empty result, no crash
 */
const dfs_invalid_start_test = new UnitTestBuilder("dfs_invalid_start")
  .procedure(graph_dfs)
  .test(
    {
      nodes: [
        { id: "A", type: "valid" },
        { id: "B", type: "valid" }
      ],
      edges: [
        { from: "A", to: "B", type: "connection" }
      ],
      source_node_id: "NONEXISTENT"
    },
    ["NONEXISTENT"]  // Basic DFS returns source_node_id even if it doesn't exist in edges
  );

/**
 * Test 12: Dangling Edges (Bad Data)
 * Input: Edges reference non-existent nodes | Output: Should ignore gracefully
 */
const dfs_dangling_edges_test = new UnitTestBuilder("dfs_dangling_edges")
  .procedure(graph_dfs)
  .test(
    {
      nodes: [
        { id: "A", type: "valid" },
        { id: "B", type: "valid" }
      ],
      edges: [
        { from: "A", to: "B", type: "valid" },
        { from: "A", to: "MISSING", type: "dangling" },  // Target doesn't exist
        { from: "GHOST", to: "B", type: "dangling" },    // Source doesn't exist
        { from: "VOID", to: "NULL", type: "both_missing" } // Both missing
      ],
      source_node_id: "A"
    },
    ["A", "MISSING", "B"]  // Basic DFS follows all edges, even to non-existent nodes
  );

/**
 * Test 13: Complex Interconnected Cycles
 * Input: Multiple overlapping cycles | Output: Visit each node exactly once
 */
const dfs_complex_cycles_test = new UnitTestBuilder("dfs_complex_cycles")
  .procedure(graph_dfs)
  .test(
    {
      nodes: [
        { id: "A", type: "hub" },
        { id: "B", type: "cycle1" },
        { id: "C", type: "cycle1" },
        { id: "D", type: "cycle2" },
        { id: "E", type: "cycle2" }
      ],
      edges: [
        { from: "A", to: "B", type: "start" },
        { from: "A", to: "C", type: "start" },
        { from: "B", to: "C", type: "cycle1" },
        { from: "C", to: "B", type: "back1" },  // Cycle 1: B↔C
        { from: "B", to: "D", type: "bridge" },
        { from: "D", to: "E", type: "cycle2" },
        { from: "E", to: "D", type: "back2" },  // Cycle 2: D↔E
        { from: "C", to: "A", type: "return" }  // Back to start
      ],
      source_node_id: "A"
    },
    ["A", "C", "B", "D", "E"]  // DFS depth-first traversal order
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
  dfs_large_branching_test,
  dfs_invalid_start_test,
  dfs_dangling_edges_test,
  dfs_complex_cycles_test
);