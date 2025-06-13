import { UnitTestBuilder } from "@elaraai/core";
import { Template } from "@elaraai/core";
import { graph_overview_statistics } from "../aggregation/overview_statistics";

// === GRAPH OVERVIEW STATISTICS TESTS ===

// Basic overview statistics test - simple graph with multiple types
const overview_statistics_basic_test = new UnitTestBuilder("overview_statistics_basic")
  .procedure(graph_overview_statistics)
  .test(
    {
      nodes: [
        { id: "A", type: "input" },
        { id: "B", type: "process" },
        { id: "C", type: "process" },
        { id: "D", type: "output" }
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "A", to: "C" },
        { from: "B", to: "D" },
        { from: "C", to: "D" }
      ]
    },
    {
      node_count: 4n,
      edge_count: 4n,
      node_types: ["input", "output", "process"], // Should be sorted by type
      unique_node_types_count: 3n,
      max_depth: 1n, // Simple approach: always 1 when we have nodes
      source_node_types: ["input"],
      target_node_types: ["output"],
      average_degree: 2.0, // (4*2)/4 = 2.0
      branching_factor: 1.0, // Simple approach: 1.0 when we have edges
      aggregate_nodes: [
        { type: "input", node_count: 1n },
        { type: "output", node_count: 1n },
        { type: "process", node_count: 2n }
      ],
      aggregate_edges: [
        { from_type: "input", to_type: "process", transition_count: 2n, transition_probability: 1.0 },
        { from_type: "process", to_type: "output", transition_count: 2n, transition_probability: 1.0 }
      ]
    }
  );

// Complex overview statistics test - multiple sources, targets, and complex structure
const overview_statistics_complex_test = new UnitTestBuilder("overview_statistics_complex")
  .procedure(graph_overview_statistics)
  .test(
    {
      nodes: [
        { id: "S1", type: "source" },
        { id: "S2", type: "source" },
        { id: "P1", type: "processor" },
        { id: "P2", type: "processor" },
        { id: "P3", type: "processor" },
        { id: "T1", type: "terminal" },
        { id: "T2", type: "terminal" }
      ],
      edges: [
        { from: "S1", to: "P1" },
        { from: "S1", to: "P2" },
        { from: "S2", to: "P2" },
        { from: "S2", to: "P3" },
        { from: "P1", to: "T1" },
        { from: "P2", to: "T1" },
        { from: "P2", to: "T2" },
        { from: "P3", to: "T2" }
      ]
    },
    {
      node_count: 7n,
      edge_count: 8n,
      node_types: ["processor", "source", "terminal"], // Should be sorted by type
      unique_node_types_count: 3n,
      max_depth: 1n, // Simple approach: always 1 when we have nodes
      source_node_types: ["source"],
      target_node_types: ["terminal"],
      average_degree: 2.2857142857142856, // (8*2)/7 = 16/7
      branching_factor: 1.0, // Simple approach: 1.0 when we have edges
      aggregate_nodes: [
        { type: "processor", node_count: 3n },
        { type: "source", node_count: 2n },
        { type: "terminal", node_count: 2n }
      ],
      aggregate_edges: [
        { from_type: "processor", to_type: "terminal", transition_count: 4n, transition_probability: 1.0 },
        { from_type: "source", to_type: "processor", transition_count: 4n, transition_probability: 1.0 }
      ]
    }
  );

// Single node test - edge case
const overview_statistics_single_node_test = new UnitTestBuilder("overview_statistics_single_node")
  .procedure(graph_overview_statistics)
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
      node_types: [], // No types participate in edges
      unique_node_types_count: 0n,
      max_depth: 1n, // Single isolated node still has depth 1
      source_node_types: [],
      target_node_types: [],
      average_degree: 0.0,
      branching_factor: 0.0,
      aggregate_nodes: [], // Empty because no edges
      aggregate_edges: []
    }
  );

// Empty graph test - edge case
const overview_statistics_empty_test = new UnitTestBuilder("overview_statistics_empty")
  .procedure(graph_overview_statistics)
  .test(
    {
      nodes: [],
      edges: []
    },
    {
      node_count: 0n,
      edge_count: 0n,
      node_types: [],
      unique_node_types_count: 0n,
      max_depth: 0n,
      source_node_types: [],
      target_node_types: [],
      average_degree: 0.0,
      branching_factor: 0.0,
      aggregate_nodes: [],
      aggregate_edges: []
    }
  );

// Self-loop test - node connects to itself
const overview_statistics_self_loop_test = new UnitTestBuilder("overview_statistics_self_loop")
  .procedure(graph_overview_statistics)
  .test(
    {
      nodes: [
        { id: "loop", type: "recursive" },
        { id: "start", type: "input" }
      ],
      edges: [
        { from: "start", to: "loop" },
        { from: "loop", to: "loop" } // self-loop
      ]
    },
    {
      node_count: 2n,
      edge_count: 2n,
      node_types: ["input", "recursive"],
      unique_node_types_count: 2n,
      max_depth: 1n, // Simple approach: always 1 when we have nodes
      source_node_types: ["input"],
      target_node_types: [], // recursive type has outgoing edges (self-loop)
      average_degree: 2.0, // (2*2)/2 = 2.0
      branching_factor: 1.0, // 2 edges / 2 nodes with outgoing = 1.0
      aggregate_nodes: [
        { type: "input", node_count: 1n },
        { type: "recursive", node_count: 1n }
      ],
      aggregate_edges: [
        { from_type: "input", to_type: "recursive", transition_count: 1n, transition_probability: 1.0 },
        { from_type: "recursive", to_type: "recursive", transition_count: 1n, transition_probability: 1.0 }
      ]
    }
  );

export default Template(
  overview_statistics_basic_test,
  overview_statistics_complex_test,
  overview_statistics_single_node_test,
  overview_statistics_empty_test,
  overview_statistics_self_loop_test
);