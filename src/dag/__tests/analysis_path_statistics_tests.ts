import { UnitTestBuilder } from "@elaraai/core";
import { Template } from "@elaraai/core";
import { graph_path_statistics } from "../analysis/path_statistics";

// === GRAPH PATH STATISTICS TESTS ===

// Basic path statistics test - simple graph with multiple types
const path_statistics_basic_test = new UnitTestBuilder("path_statistics_basic")
  .procedure(graph_path_statistics)
  .test(
    {
      nodes: [
        { id: "A", type: "input" },
        { id: "B", type: "process" },
        { id: "C", type: "process" },
        { id: "D", type: "output" }
      ],
      edges: [
        { from: "A", to: "B", type: "flow" },
        { from: "A", to: "C", type: "flow" },
        { from: "B", to: "D", type: "transfer" },
        { from: "C", to: "D", type: "transfer" }
      ]
    },
    {
      node_count: 4n,
      edge_count: 4n,
      longest_path_length: 3n, // A -> B/C -> D (4 nodes reachable, 3 edges)
      longest_path_depth: 4n, // 4 nodes in longest chain
      total_reachable_nodes: 4.0, // All 4 nodes reachable from A
      connectivity_span: 3n, // 3 edges in spanning tree
      branching_factor: 1.0, // 4 edges / 4 nodes = 1.0
      node_type_sequence: ["input", "process", "output"] // BFS from A
    }
  );

// Linear path test - straight chain
const path_statistics_linear_test = new UnitTestBuilder("path_statistics_linear")
  .procedure(graph_path_statistics)
  .test(
    {
      nodes: [
        { id: "A", type: "start" },
        { id: "B", type: "middle" },
        { id: "C", type: "end" }
      ],
      edges: [
        { from: "A", to: "B", type: "process" },
        { from: "B", to: "C", type: "process" }
      ]
    },
    {
      node_count: 3n,
      edge_count: 2n,
      longest_path_length: 2n, // A -> B -> C (2 edges)
      longest_path_depth: 3n, // 3 nodes in chain
      total_reachable_nodes: 3.0, // All 3 nodes reachable
      connectivity_span: 2n, // 2 edges in linear chain
      branching_factor: 0.6666666666666666, // 2 edges / 3 nodes
      node_type_sequence: ["start", "middle", "end"]
    }
  );

// Complex branching test
const path_statistics_branching_test = new UnitTestBuilder("path_statistics_branching")
  .procedure(graph_path_statistics)
  .test(
    {
      nodes: [
        { id: "root", type: "source" },
        { id: "branch1", type: "processor" },
        { id: "branch2", type: "processor" },
        { id: "leaf1", type: "terminal" },
        { id: "leaf2", type: "terminal" },
        { id: "leaf3", type: "terminal" }
      ],
      edges: [
        { from: "root", to: "branch1", type: "split" },
        { from: "root", to: "branch2", type: "split" },
        { from: "branch1", to: "leaf1", type: "output" },
        { from: "branch1", to: "leaf2", type: "output" },
        { from: "branch2", to: "leaf3", type: "output" }
      ]
    },
    {
      node_count: 6n,
      edge_count: 5n,
      longest_path_length: 5n, // All 6 nodes reachable, 5 edges
      longest_path_depth: 6n, // All 6 nodes in traversal
      total_reachable_nodes: 6.0, // All 6 nodes reachable from root
      connectivity_span: 5n, // 5 edges in spanning tree
      branching_factor: 0.8333333333333334, // 5 edges / 6 nodes
      node_type_sequence: ["source", "processor", "terminal"] // BFS from root
    }
  );

// Single node test - edge case
const path_statistics_single_node_test = new UnitTestBuilder("path_statistics_single_node")
  .procedure(graph_path_statistics)
  .test(
    {
      nodes: [
        { id: "alone", type: "isolated" }
      ],
      edges: []
    },
    {
      node_count: 1n,
      edge_count: 0n,
      longest_path_length: 0n, // No edges
      longest_path_depth: 1n, // Single node
      total_reachable_nodes: 1.0, // Single node reachable
      connectivity_span: 0n, // No edges
      branching_factor: 0.0, // No edges
      node_type_sequence: ["isolated"] // Single node traversal
    }
  );

// Empty graph test - edge case
const path_statistics_empty_test = new UnitTestBuilder("path_statistics_empty")
  .procedure(graph_path_statistics)
  .test(
    {
      nodes: [],
      edges: []
    },
    {
      node_count: 0n,
      edge_count: 0n,
      longest_path_length: 0n,
      longest_path_depth: 0n,
      total_reachable_nodes: 0.0,
      connectivity_span: 0n,
      branching_factor: 0.0,
      node_type_sequence: [] // No nodes to traverse
    }
  );

export default Template(
  path_statistics_basic_test,
  path_statistics_linear_test,
  path_statistics_branching_test,
  path_statistics_single_node_test,
  path_statistics_empty_test
);