import { UnitTestBuilder } from "@elaraai/core";
import { Template } from "@elaraai/core";
import { graph_aggregation_by_type } from "../aggregation/aggregation_by_type";

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
        { from: "A", to: "B" },
        { from: "A", to: "C" },
        { from: "C", to: "B" }
      ]
    },
    {
      aggregate_nodes: [
        { type: "op1", node_count: 2n },
        { type: "op2", node_count: 1n }
        // Note: op3 is excluded because node D doesn't participate in any edges
      ],
      aggregate_edges: [
        { from_type: "op1", to_type: "op1", transition_count: 1n, transition_probability: 0.3333333333333333 },
        { from_type: "op1", to_type: "op2", transition_count: 2n, transition_probability: 0.6666666666666666 }
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
        { from: "A", to: "B" },
        { from: "A", to: "C" },
        { from: "B", to: "D" },
        { from: "B", to: "E" },
        { from: "C", to: "E" },
        { from: "E", to: "F" }
      ]
    },
    {
      aggregate_nodes: [
        { type: "input", node_count: 1n },
        { type: "output", node_count: 2n },
        { type: "process", node_count: 3n }
      ],
      aggregate_edges: [
        { from_type: "input", to_type: "process", transition_count: 2n, transition_probability: 1.0 },
        { from_type: "process", to_type: "output", transition_count: 2n, transition_probability: 0.5 },
        { from_type: "process", to_type: "process", transition_count: 2n, transition_probability: 0.5 }
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
        { from: "A", to: "B" },
        { from: "B", to: "C" },
        { from: "C", to: "A" }
      ]
    },
    {
      aggregate_nodes: [
        { type: "worker", node_count: 3n }
      ],
      aggregate_edges: [
        { from_type: "worker", to_type: "worker", transition_count: 3n, transition_probability: 1.0 }
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
        { from: "A", to: "B" },
        { from: "B", to: "E" }
        // C and D are orphaned (not in any edges)
      ]
    },
    {
      aggregate_nodes: [
        { type: "connected", node_count: 3n } // Only connected type appears
        // orphaned type is excluded since those nodes don't participate in edges
      ],
      aggregate_edges: [
        { from_type: "connected", to_type: "connected", transition_count: 2n, transition_probability: 1.0 }
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
        { from: "A", to: "B" }, // component1 connects to itself
        { from: "C", to: "D" }  // component2 connects to itself
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
        { from_type: "component1", to_type: "component1", transition_count: 1n, transition_probability: 1.0 },
        { from_type: "component2", to_type: "component2", transition_count: 1n, transition_probability: 1.0 }
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
        { from: "source1", to: "sink1" },
        { from: "source2", to: "sink2" }
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
        { from_type: "source", to_type: "sink", transition_count: 2n, transition_probability: 1.0 }
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
        { from: "input", to: "terminal1" },
        { from: "input", to: "terminal2" }
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
        { from_type: "input", to_type: "terminal", transition_count: 2n, transition_probability: 1.0 }
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
        { from: "self_loop", to: "self_loop" }, // self-loop
        { from: "normal1", to: "normal2" }
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
        { from_type: "normal", to_type: "normal", transition_count: 1n, transition_probability: 1.0 },
        { from_type: "self_referencing", to_type: "self_referencing", transition_count: 1n, transition_probability: 1.0 }
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
        { from: "valid1", to: "valid2" },
        { from: "valid2", to: "valid3" }
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
        { from_type: "valid_type", to_type: "another_valid", transition_count: 1n, transition_probability: 0.5 },
        { from_type: "valid_type", to_type: "valid_type", transition_count: 1n, transition_probability: 0.5 }
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
        { from: "active1", to: "processor" },
        { from: "active2", to: "processor" }
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
        { from_type: "active", to_type: "processor", transition_count: 2n, transition_probability: 1.0 }
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
  type_aggregation_multiple_orphaned_types_test
);