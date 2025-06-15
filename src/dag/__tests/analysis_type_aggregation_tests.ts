import { UnitTestBuilder } from "@elaraai/core";
import { Template } from "@elaraai/core";
import { graph_aggregation_by_type } from "../analysis/type_aggregation";

// === GRAPH AGGREGATION BY TYPE TESTS ===

// Basic type aggregation test - only types that participate in edges should appear
const type_aggregation_basic_test = new UnitTestBuilder("type_aggregation_basic")
  .procedure(graph_aggregation_by_type)
  .test(
    {
      nodes: [
        { id: "A", type: "op1" },
        { id: "B", type: "op2" },
        { id: "C", type: "op1" },
        { id: "D", type: "op3" }
      ],
      edges: [
        { from: "A", to: "B", type: "process" },
        { from: "A", to: "C", type: "process" },
        { from: "C", to: "B", type: "process" }
      ]
    },
    {
      aggregate_nodes: [
        { type: "op1", node_count: 2n },
        { type: "op2", node_count: 1n }
        // Note: op3 is excluded because node D doesn't participate in any edges
      ],
      aggregate_edges: [
        { from_type: "op1", to_type: "op1", edge_type: "process", transition_count: 1n, transition_probability: 0.3333333333333333 },
        { from_type: "op1", to_type: "op2", edge_type: "process", transition_count: 2n, transition_probability: 0.6666666666666666 }
      ]
    }
  );

// Complex type aggregation test
const type_aggregation_complex_test = new UnitTestBuilder("type_aggregation_complex")
  .procedure(graph_aggregation_by_type)
  .test(
    {
      nodes: [
        { id: "A", type: "input" },
        { id: "B", type: "process" },
        { id: "C", type: "process" },
        { id: "D", type: "output" },
        { id: "E", type: "process" },
        { id: "F", type: "output" }
      ],
      edges: [
        { from: "A", to: "B", type: "input_to_process" },
        { from: "A", to: "C", type: "input_to_process" },
        { from: "B", to: "D", type: "process_to_output" },
        { from: "B", to: "E", type: "process_to_process" },
        { from: "C", to: "E", type: "process_to_process" },
        { from: "E", to: "F", type: "process_to_output" }
      ]
    },
    {
      aggregate_nodes: [
        { type: "input", node_count: 1n },
        { type: "output", node_count: 2n },
        { type: "process", node_count: 3n }
      ],
      aggregate_edges: [
        { from_type: "input", to_type: "process", edge_type: "input_to_process", transition_count: 2n, transition_probability: 1.0 },
        { from_type: "process", to_type: "output", edge_type: "process_to_output", transition_count: 2n, transition_probability: 0.5 },
        { from_type: "process", to_type: "process", edge_type: "process_to_process", transition_count: 2n, transition_probability: 0.5 }
      ]
    }
  );

// Single type test (all nodes same type)
const type_aggregation_single_type_test = new UnitTestBuilder("type_aggregation_single_type")
  .procedure(graph_aggregation_by_type)
  .test(
    {
      nodes: [
        { id: "A", type: "worker" },
        { id: "B", type: "worker" },
        { id: "C", type: "worker" }
      ],
      edges: [
        { from: "A", to: "B", type: "worker_flow" },
        { from: "B", to: "C", type: "worker_flow" },
        { from: "C", to: "A", type: "worker_flow" }
      ]
    },
    {
      aggregate_nodes: [
        { type: "worker", node_count: 3n }
      ],
      aggregate_edges: [
        { from_type: "worker", to_type: "worker", edge_type: "worker_flow", transition_count: 3n, transition_probability: 1.0 }
      ]
    }
  );

// No edges test (isolated nodes) - should produce no aggregate nodes since no types participate in edges
const type_aggregation_no_edges_test = new UnitTestBuilder("type_aggregation_no_edges")
  .procedure(graph_aggregation_by_type)
  .test(
    {
      nodes: [
        { id: "A", type: "type1" },
        { id: "B", type: "type2" },
        { id: "C", type: "type1" }
      ],
      edges: []
    },
    {
      aggregate_nodes: [], // No nodes since no types participate in edges
      aggregate_edges: []
    }
  );

// Empty graph test
const type_aggregation_empty_test = new UnitTestBuilder("type_aggregation_empty")
  .procedure(graph_aggregation_by_type)
  .test(
    {
      nodes: [],
      edges: []
    },
    {
      aggregate_nodes: [],
      aggregate_edges: []
    }
  );

// === NEW COMPREHENSIVE TESTS FOR ORPHANED NODES AND EDGE CASES ===

// Test case: Orphaned nodes should be excluded from aggregation
const type_aggregation_orphaned_nodes_test = new UnitTestBuilder("type_aggregation_orphaned_nodes")
  .procedure(graph_aggregation_by_type)
  .test(
    {
      nodes: [
        { id: "A", type: "connected" },
        { id: "B", type: "connected" },
        { id: "C", type: "orphaned" },
        { id: "D", type: "orphaned" },
        { id: "E", type: "connected" }
      ],
      edges: [
        { from: "A", to: "B", type: "flow" },
        { from: "B", to: "E", type: "flow" }
        // C and D are orphaned (not in any edges)
      ]
    },
    {
      aggregate_nodes: [
        { type: "connected", node_count: 3n } // Only connected type appears
        // orphaned type is excluded since those nodes don't participate in edges
      ],
      aggregate_edges: [
        { from_type: "connected", to_type: "connected", edge_type: "flow", transition_count: 2n, transition_probability: 1.0 }
      ]
    }
  );

// Test case: Mixed connected and disconnected components
const type_aggregation_mixed_components_test = new UnitTestBuilder("type_aggregation_mixed_components")
  .procedure(graph_aggregation_by_type)
  .test(
    {
      nodes: [
        { id: "A", type: "component1" },
        { id: "B", type: "component1" },
        { id: "C", type: "component2" },
        { id: "D", type: "component2" },
        { id: "E", type: "isolated" },
        { id: "F", type: "isolated" }
      ],
      edges: [
        { from: "A", to: "B", type: "internal" }, // component1 connects to itself
        { from: "C", to: "D", type: "internal" }  // component2 connects to itself
        // E and F are isolated (type "isolated" has no edges)
      ]
    },
    {
      aggregate_nodes: [
        { type: "component1", node_count: 2n },
        { type: "component2", node_count: 2n }
        // isolated type is excluded
      ],
      aggregate_edges: [
        { from_type: "component1", to_type: "component1", edge_type: "internal", transition_count: 1n, transition_probability: 1.0 },
        { from_type: "component2", to_type: "component2", edge_type: "internal", transition_count: 1n, transition_probability: 1.0 }
      ]
    }
  );

// Test case: Nodes with outgoing edges but no incoming edges (sources)
const type_aggregation_source_nodes_test = new UnitTestBuilder("type_aggregation_source_nodes")
  .procedure(graph_aggregation_by_type)
  .test(
    {
      nodes: [
        { id: "source1", type: "source" },
        { id: "source2", type: "source" },
        { id: "sink1", type: "sink" },
        { id: "sink2", type: "sink" },
        { id: "isolated", type: "isolated" }
      ],
      edges: [
        { from: "source1", to: "sink1", type: "flow" },
        { from: "source2", to: "sink2", type: "flow" }
        // isolated node has no edges
      ]
    },
    {
      aggregate_nodes: [
        { type: "sink", node_count: 2n },
        { type: "source", node_count: 2n }
        // isolated type is excluded
      ],
      aggregate_edges: [
        { from_type: "source", to_type: "sink", edge_type: "flow", transition_count: 2n, transition_probability: 1.0 }
      ]
    }
  );

// Test case: Nodes with incoming edges but no outgoing edges (sinks)  
const type_aggregation_sink_nodes_test = new UnitTestBuilder("type_aggregation_sink_nodes")
  .procedure(graph_aggregation_by_type)
  .test(
    {
      nodes: [
        { id: "input", type: "input" },
        { id: "terminal1", type: "terminal" },
        { id: "terminal2", type: "terminal" },
        { id: "unconnected", type: "unconnected" }
      ],
      edges: [
        { from: "input", to: "terminal1", type: "output" },
        { from: "input", to: "terminal2", type: "output" }
        // unconnected node has no edges
      ]
    },
    {
      aggregate_nodes: [
        { type: "input", node_count: 1n },
        { type: "terminal", node_count: 2n }
        // unconnected type is excluded
      ],
      aggregate_edges: [
        { from_type: "input", to_type: "terminal", edge_type: "output", transition_count: 2n, transition_probability: 1.0 }
      ]
    }
  );

// Test case: Self-loop with orphaned nodes
const type_aggregation_self_loop_with_orphans_test = new UnitTestBuilder("type_aggregation_self_loop_with_orphans")
  .procedure(graph_aggregation_by_type)
  .test(
    {
      nodes: [
        { id: "self_loop", type: "self_referencing" },
        { id: "normal1", type: "normal" },
        { id: "normal2", type: "normal" },
        { id: "orphan1", type: "orphaned" },
        { id: "orphan2", type: "orphaned" }
      ],
      edges: [
        { from: "self_loop", to: "self_loop", type: "self_reference" }, // self-loop
        { from: "normal1", to: "normal2", type: "normal_flow" }
        // orphan1 and orphan2 have no edges
      ]
    },
    {
      aggregate_nodes: [
        { type: "normal", node_count: 2n },
        { type: "self_referencing", node_count: 1n }
        // orphaned type is excluded
      ],
      aggregate_edges: [
        { from_type: "normal", to_type: "normal", edge_type: "normal_flow", transition_count: 1n, transition_probability: 1.0 },
        { from_type: "self_referencing", to_type: "self_referencing", edge_type: "self_reference", transition_count: 1n, transition_probability: 1.0 }
      ]
    }
  );

// Test case: Validate behavior matches graph_validate + aggregation pipeline
const type_aggregation_validation_pipeline_test = new UnitTestBuilder("type_aggregation_validation_pipeline")
  .procedure(graph_aggregation_by_type)
  .test(
    {
      nodes: [
        { id: "valid1", type: "valid_type" },
        { id: "valid2", type: "valid_type" },
        { id: "valid3", type: "another_valid" },
        { id: "orphan", type: "orphan_type" } // This should be excluded
      ],
      edges: [
        { from: "valid1", to: "valid2", type: "valid_transition" },
        { from: "valid2", to: "valid3", type: "valid_transition" }
        // orphan node doesn't participate in any edges
      ]
    },
    {
      aggregate_nodes: [
        { type: "another_valid", node_count: 1n },
        { type: "valid_type", node_count: 2n }
        // orphan_type is excluded - this prevents the orphaned nodes issue
      ],
      aggregate_edges: [
        { from_type: "valid_type", to_type: "another_valid", edge_type: "valid_transition", transition_count: 1n, transition_probability: 0.5 },
        { from_type: "valid_type", to_type: "valid_type", edge_type: "valid_transition", transition_count: 1n, transition_probability: 0.5 }
      ]
    }
  );

// Test case: Complex graph with multiple orphaned types
const type_aggregation_multiple_orphaned_types_test = new UnitTestBuilder("type_aggregation_multiple_orphaned_types")
  .procedure(graph_aggregation_by_type)
  .test(
    {
      nodes: [
        { id: "active1", type: "active" },
        { id: "active2", type: "active" },
        { id: "processor", type: "processor" },
        { id: "orphan_a1", type: "orphan_a" },
        { id: "orphan_a2", type: "orphan_a" },
        { id: "orphan_b", type: "orphan_b" },
        { id: "orphan_c", type: "orphan_c" }
      ],
      edges: [
        { from: "active1", to: "processor", type: "processing" },
        { from: "active2", to: "processor", type: "processing" }
        // Multiple orphaned types: orphan_a, orphan_b, orphan_c
      ]
    },
    {
      aggregate_nodes: [
        { type: "active", node_count: 2n },
        { type: "processor", node_count: 1n }
        // All orphan types (orphan_a, orphan_b, orphan_c) are excluded
      ],
      aggregate_edges: [
        { from_type: "active", to_type: "processor", edge_type: "processing", transition_count: 2n, transition_probability: 1.0 }
      ]
    }
  );

// === NEW EDGE TYPE SPECIFIC TESTS ===

// Test multiple edge types between same node types
const type_aggregation_multiple_edge_types_test = new UnitTestBuilder("type_aggregation_multiple_edge_types")
  .procedure(graph_aggregation_by_type)
  .test(
    {
      nodes: [
        { id: "A", type: "processing" },
        { id: "B", type: "processing" },
        { id: "C", type: "quality" }
      ],
      edges: [
        { from: "A", to: "B", type: "material_flow" },
        { from: "A", to: "B", type: "information_flow" },
        { from: "A", to: "C", type: "quality_check" },
        { from: "B", to: "C", type: "quality_check" }
      ]
    },
    {
      aggregate_nodes: [
        { type: "processing", node_count: 2n },
        { type: "quality", node_count: 1n }
      ],
      aggregate_edges: [
        { from_type: "processing", to_type: "processing", edge_type: "information_flow", transition_count: 1n, transition_probability: 0.25 },
        { from_type: "processing", to_type: "processing", edge_type: "material_flow", transition_count: 1n, transition_probability: 0.25 },
        { from_type: "processing", to_type: "quality", edge_type: "quality_check", transition_count: 2n, transition_probability: 0.5 }
      ]
    }
  );

// Test complex edge type patterns with cycles
const type_aggregation_edge_type_cycles_test = new UnitTestBuilder("type_aggregation_edge_type_cycles")
  .procedure(graph_aggregation_by_type)
  .test(
    {
      nodes: [
        { id: "A", type: "process" },
        { id: "B", type: "process" },
        { id: "C", type: "quality" },
        { id: "D", type: "storage" }
      ],
      edges: [
        { from: "A", to: "B", type: "processing" },
        { from: "B", to: "D", type: "storage" },
        { from: "A", to: "C", type: "quality_check" },
        { from: "B", to: "C", type: "quality_check" },
        { from: "C", to: "A", type: "quality_feedback" },
        { from: "C", to: "B", type: "quality_feedback" },
        { from: "D", to: "A", type: "reprocess" }
      ]
    },
    {
      aggregate_nodes: [
        { type: "process", node_count: 2n },
        { type: "quality", node_count: 1n },
        { type: "storage", node_count: 1n }
      ],
      aggregate_edges: [
        { from_type: "process", to_type: "process", edge_type: "processing", transition_count: 1n, transition_probability: 0.25 },
        { from_type: "process", to_type: "quality", edge_type: "quality_check", transition_count: 2n, transition_probability: 0.5 },
        { from_type: "process", to_type: "storage", edge_type: "storage", transition_count: 1n, transition_probability: 0.25 },
        { from_type: "quality", to_type: "process", edge_type: "quality_feedback", transition_count: 2n, transition_probability: 1.0 },
        { from_type: "storage", to_type: "process", edge_type: "reprocess", transition_count: 1n, transition_probability: 1.0 }
      ]
    }
  );

// Test empty edge type handling
const type_aggregation_empty_edge_type_test = new UnitTestBuilder("type_aggregation_empty_edge_type")
  .procedure(graph_aggregation_by_type)
  .test(
    {
      nodes: [
        { id: "A", type: "node_type" },
        { id: "B", type: "node_type" }
      ],
      edges: [
        { from: "A", to: "B", type: "" },
        { from: "B", to: "A", type: "normal_edge" }
      ]
    },
    {
      aggregate_nodes: [
        { type: "node_type", node_count: 2n }
      ],
      aggregate_edges: [
        { from_type: "node_type", to_type: "node_type", edge_type: "", transition_count: 1n, transition_probability: 0.5 },
        { from_type: "node_type", to_type: "node_type", edge_type: "normal_edge", transition_count: 1n, transition_probability: 0.5 }
      ]
    }
  );

export default Template(
  type_aggregation_basic_test,
  type_aggregation_complex_test,
  type_aggregation_single_type_test,
  type_aggregation_no_edges_test,
  type_aggregation_empty_test,
  type_aggregation_orphaned_nodes_test,
  type_aggregation_mixed_components_test,
  type_aggregation_source_nodes_test,
  type_aggregation_sink_nodes_test,
  type_aggregation_self_loop_with_orphans_test,
  type_aggregation_validation_pipeline_test,
  type_aggregation_multiple_orphaned_types_test,
  type_aggregation_multiple_edge_types_test,
  type_aggregation_edge_type_cycles_test,
  type_aggregation_empty_edge_type_test
);