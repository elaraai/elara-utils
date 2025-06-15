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
        { from: "A", to: "B", type: "flow" },
        { from: "B", to: "C", type: "flow" }
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
        { from: "A", to: "B", type: "process" },
        { from: "A", to: "C", type: "process" },
        { from: "B", to: "D", type: "transfer" },
        { from: "B", to: "E", type: "transfer" }
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
        { from: "A", to: "B", type: "branch" },
        { from: "A", to: "C", type: "branch" },
        { from: "B", to: "D", type: "merge" },
        { from: "C", to: "D", type: "merge" }
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
        { from: "A", to: "A", type: "loop" }, // Self-loop
        { from: "A", to: "B", type: "flow" }
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
        { from: "A", to: "B", type: "connect" },
        { from: "C", to: "D", type: "connect" } // Separate component
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
        { from: "A", to: "B", type: "cycle" },
        { from: "B", to: "C", type: "cycle" },
        { from: "C", to: "A", type: "cycle" } // Creates cycle
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
        { from: "A", to: "B", type: "duplicate" },
        { from: "A", to: "B", type: "duplicate" }, // Duplicate edge
        { from: "A", to: "B", type: "duplicate" }  // Another duplicate
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
        { from: "root", to: "child1", type: "spawn" },
        { from: "root", to: "child2", type: "spawn" },
        { from: "root", to: "child3", type: "spawn" },
        { from: "root", to: "child4", type: "spawn" },
        { from: "root", to: "child5", type: "spawn" }
      ],
      startId: "root"
    },
    ["root", "child1", "child2", "child3", "child4", "child5"] // Level-order
  );

// Sibling endpoints test - testing the network extraction edge case
// This tests if BFS from F can find sibling endpoint G via common upstream network
const bfs_sibling_endpoints_test = new UnitTestBuilder("bfs_sibling_endpoints")
  .procedure(graph_bfs)
  .test(
    {
      nodes: [
        { id: "A", type: "source" },
        { id: "B", type: "process" },
        { id: "C", type: "mixer" },
        { id: "E", type: "splitter" },
        { id: "F", type: "target" },
        { id: "G", type: "target" },
        { id: "X", type: "external" },
        { id: "D", type: "process" }
      ],
      edges: [
        { from: "A", to: "B", type: "flow" },
        { from: "B", to: "C", type: "input" },
        { from: "C", to: "E", type: "flow" },
        { from: "X", to: "D", type: "supply" },
        { from: "D", to: "E", type: "input" },
        { from: "E", to: "F", type: "output" },
        { from: "E", to: "G", type: "output" }
      ],
      startId: "F"
    },
    ["F"] // BFS from F should only find F (no outgoing edges from F)
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
  bfs_large_branching_test,
  bfs_sibling_endpoints_test
);