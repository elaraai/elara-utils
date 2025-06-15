import { UnitTestBuilder } from "@elaraai/core";
import { Template } from "@elaraai/core";
import { graph_type_statistics } from "../analysis/type_statistics";

// === GRAPH TYPE STATISTICS TESTS ===

// Basic type statistics test - simple graph with multiple types
const type_statistics_basic_test = new UnitTestBuilder("type_statistics_basic")
  .procedure(graph_type_statistics)
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
      node_types: ["input", "output", "process"], // Should be sorted by type
      unique_node_types_count: 3n,
      source_node_types: ["input"],
      target_node_types: ["output"],
      edge_types: ["flow", "transfer"],
      unique_edge_types_count: 2n,
      aggregate_nodes: [
        { type: "input", node_count: 1n },
        { type: "output", node_count: 1n },
        { type: "process", node_count: 2n }
      ],
      aggregate_edges: [
        { from_type: "input", to_type: "process", edge_type: "flow", transition_count: 2n, transition_probability: 1.0 },
        { from_type: "process", to_type: "output", edge_type: "transfer", transition_count: 2n, transition_probability: 1.0 }
      ]
    }
  );

// Complex type statistics test - multiple sources, targets, and complex structure
const type_statistics_complex_test = new UnitTestBuilder("type_statistics_complex")
  .procedure(graph_type_statistics)
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
        { from: "S1", to: "P1", type: "supply" },
        { from: "S1", to: "P2", type: "supply" },
        { from: "S2", to: "P2", type: "supply" },
        { from: "S2", to: "P3", type: "supply" },
        { from: "P1", to: "T1", type: "delivery" },
        { from: "P2", to: "T1", type: "delivery" },
        { from: "P2", to: "T2", type: "delivery" },
        { from: "P3", to: "T2", type: "delivery" }
      ]
    },
    {
      node_count: 7n,
      edge_count: 8n,
      node_types: ["processor", "source", "terminal"], // Should be sorted by type
      unique_node_types_count: 3n,
      source_node_types: ["source"],
      target_node_types: ["terminal"],
      edge_types: ["delivery", "supply"],
      unique_edge_types_count: 2n,
      aggregate_nodes: [
        { type: "processor", node_count: 3n },
        { type: "source", node_count: 2n },
        { type: "terminal", node_count: 2n }
      ],
      aggregate_edges: [
        { from_type: "processor", to_type: "terminal", edge_type: "delivery", transition_count: 4n, transition_probability: 1.0 },
        { from_type: "source", to_type: "processor", edge_type: "supply", transition_count: 4n, transition_probability: 1.0 }
      ]
    }
  );

// Single node test - edge case
const type_statistics_single_node_test = new UnitTestBuilder("type_statistics_single_node")
  .procedure(graph_type_statistics)
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
      node_types: ["isolated"], // Node type exists but no edges
      unique_node_types_count: 1n,
      source_node_types: ["isolated"], // No incoming edges
      target_node_types: ["isolated"], // No outgoing edges
      edge_types: [],
      unique_edge_types_count: 0n,
      aggregate_nodes: [], // Empty because no edges
      aggregate_edges: []
    }
  );

// Empty graph test - edge case
const type_statistics_empty_test = new UnitTestBuilder("type_statistics_empty")
  .procedure(graph_type_statistics)
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
      source_node_types: [],
      target_node_types: [],
      edge_types: [],
      unique_edge_types_count: 0n,
      aggregate_nodes: [],
      aggregate_edges: []
    }
  );

// Self-loop test - node connects to itself
const type_statistics_self_loop_test = new UnitTestBuilder("type_statistics_self_loop")
  .procedure(graph_type_statistics)
  .test(
    {
      nodes: [
        { id: "loop", type: "recursive" },
        { id: "start", type: "input" }
      ],
      edges: [
        { from: "start", to: "loop", type: "initiate" },
        { from: "loop", to: "loop", type: "iterate" } // self-loop
      ]
    },
    {
      node_count: 2n,
      edge_count: 2n,
      node_types: ["input", "recursive"],
      unique_node_types_count: 2n,
      source_node_types: ["input"],
      target_node_types: [], // recursive type has outgoing edges (self-loop)
      edge_types: ["initiate", "iterate"],
      unique_edge_types_count: 2n,
      aggregate_nodes: [
        { type: "input", node_count: 1n },
        { type: "recursive", node_count: 1n }
      ],
      aggregate_edges: [
        { from_type: "input", to_type: "recursive", edge_type: "initiate", transition_count: 1n, transition_probability: 1.0 },
        { from_type: "recursive", to_type: "recursive", edge_type: "iterate", transition_count: 1n, transition_probability: 1.0 }
      ]
    }
  );

// === NEW EDGE TYPE SPECIFIC TESTS ===

// Test edge type distribution and diversity
const type_statistics_edge_type_diversity_test = new UnitTestBuilder("type_statistics_edge_type_diversity")
  .procedure(graph_type_statistics)
  .test(
    {
      nodes: [
        { id: "source1", type: "input" },
        { id: "proc1", type: "processing" },
        { id: "store1", type: "storage" },
        { id: "store2", type: "storage" },
        { id: "proc2", type: "processing" },
        { id: "output1", type: "output" }
      ],
      edges: [
        { from: "source1", to: "proc1", type: "initial" },
        { from: "proc1", to: "store1", type: "data_flow" },
        { from: "proc1", to: "store2", type: "data_flow" },
        { from: "store1", to: "proc2", type: "data_flow" },
        { from: "store2", to: "proc2", type: "data_flow" },
        { from: "proc2", to: "output1", type: "final_process" },
        { from: "proc1", to: "proc2", type: "control_flow" },
        { from: "store1", to: "store2", type: "sync" }
      ]
    },
    {
      node_count: 6n,
      edge_count: 8n,
      node_types: ["input", "output", "processing", "storage"],
      unique_node_types_count: 4n,
      source_node_types: ["input"],
      target_node_types: ["output"],
      edge_types: ["control_flow", "data_flow", "final_process", "initial", "sync"],
      unique_edge_types_count: 5n,
      aggregate_nodes: [
        { type: "input", node_count: 1n },
        { type: "output", node_count: 1n },
        { type: "processing", node_count: 2n },
        { type: "storage", node_count: 2n }
      ],
      aggregate_edges: [
        { from_type: "input", to_type: "processing", edge_type: "initial", transition_count: 1n, transition_probability: 1.0 },
        { from_type: "processing", to_type: "processing", edge_type: "control_flow", transition_count: 1n, transition_probability: 0.25 },
        { from_type: "processing", to_type: "storage", edge_type: "data_flow", transition_count: 2n, transition_probability: 0.5 },
        { from_type: "processing", to_type: "output", edge_type: "final_process", transition_count: 1n, transition_probability: 0.25 },
        { from_type: "storage", to_type: "processing", edge_type: "data_flow", transition_count: 2n, transition_probability: 0.6666666666666666 },
        { from_type: "storage", to_type: "storage", edge_type: "sync", transition_count: 1n, transition_probability: 0.3333333333333333 }
      ]
    }
  );

// Test edge type uniqueness and sorting
const type_statistics_edge_type_sorting_test = new UnitTestBuilder("type_statistics_edge_type_sorting")
  .procedure(graph_type_statistics)
  .test(
    {
      nodes: [
        { id: "A", type: "alpha" },
        { id: "B", type: "beta" },
        { id: "C", type: "gamma" }
      ],
      edges: [
        { from: "A", to: "B", type: "zebra_flow" },
        { from: "B", to: "C", type: "alpha_flow" },
        { from: "C", to: "A", type: "zebra_flow" }, // Duplicate edge type
        { from: "A", to: "C", type: "beta_flow" }
      ]
    },
    {
      node_count: 3n,
      edge_count: 4n,
      node_types: ["alpha", "beta", "gamma"],
      unique_node_types_count: 3n,
      source_node_types: [],
      target_node_types: [],
      edge_types: ["alpha_flow", "beta_flow", "zebra_flow"], // Should be sorted alphabetically
      unique_edge_types_count: 3n, // Only unique edge types counted
      aggregate_nodes: [
        { type: "alpha", node_count: 1n },
        { type: "beta", node_count: 1n },
        { type: "gamma", node_count: 1n }
      ],
      aggregate_edges: [
        { from_type: "alpha", to_type: "gamma", edge_type: "beta_flow", transition_count: 1n, transition_probability: 0.5 },
        { from_type: "alpha", to_type: "beta", edge_type: "zebra_flow", transition_count: 1n, transition_probability: 0.5 },
        { from_type: "beta", to_type: "gamma", edge_type: "alpha_flow", transition_count: 1n, transition_probability: 1.0 },
        { from_type: "gamma", to_type: "alpha", edge_type: "zebra_flow", transition_count: 1n, transition_probability: 1.0 }
      ]
    }
  );

// Test high edge type diversity with hub pattern
const type_statistics_edge_type_hub_test = new UnitTestBuilder("type_statistics_edge_type_hub")
  .procedure(graph_type_statistics)
  .test(
    {
      nodes: [
        { id: "hub", type: "central" },
        { id: "A", type: "peripheral" },
        { id: "B", type: "peripheral" },
        { id: "C", type: "peripheral" }
      ],
      edges: [
        { from: "hub", to: "A", type: "type_alpha" },
        { from: "hub", to: "B", type: "type_beta" },
        { from: "hub", to: "C", type: "type_gamma" },
        { from: "A", to: "hub", type: "type_delta" },
        { from: "B", to: "hub", type: "type_epsilon" },
        { from: "C", to: "hub", type: "type_zeta" }
      ]
    },
    {
      node_count: 4n,
      edge_count: 6n,
      node_types: ["central", "peripheral"],
      unique_node_types_count: 2n,
      source_node_types: [],
      target_node_types: [],
      edge_types: ["type_alpha", "type_beta", "type_delta", "type_epsilon", "type_gamma", "type_zeta"],
      unique_edge_types_count: 6n,
      aggregate_nodes: [
        { type: "central", node_count: 1n },
        { type: "peripheral", node_count: 3n }
      ],
      aggregate_edges: [
        { from_type: "central", to_type: "peripheral", edge_type: "type_alpha", transition_count: 1n, transition_probability: 0.3333333333333333 },
        { from_type: "central", to_type: "peripheral", edge_type: "type_beta", transition_count: 1n, transition_probability: 0.3333333333333333 },
        { from_type: "central", to_type: "peripheral", edge_type: "type_gamma", transition_count: 1n, transition_probability: 0.3333333333333333 },
        { from_type: "peripheral", to_type: "central", edge_type: "type_delta", transition_count: 1n, transition_probability: 0.3333333333333333 },
        { from_type: "peripheral", to_type: "central", edge_type: "type_epsilon", transition_count: 1n, transition_probability: 0.3333333333333333 },
        { from_type: "peripheral", to_type: "central", edge_type: "type_zeta", transition_count: 1n, transition_probability: 0.3333333333333333 }
      ]
    }
  );

export default Template(
  type_statistics_basic_test,
  type_statistics_complex_test,
  type_statistics_single_node_test,
  type_statistics_empty_test,
  type_statistics_self_loop_test,
  type_statistics_edge_type_diversity_test,
  type_statistics_edge_type_sorting_test,
  type_statistics_edge_type_hub_test
);