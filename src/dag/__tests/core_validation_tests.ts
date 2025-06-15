import { UnitTestBuilder } from "@elaraai/core";
import { Template } from "@elaraai/core";
import { graph_validate } from "../core/validation";

// Test 1: Clean graph (no issues) - Basic statistics test
const validate_clean_test = new UnitTestBuilder("validate_clean")
  .procedure(graph_validate)
  .test(
    {
      nodes: [
        { id: "A", type: "start" },
        { id: "B", type: "middle" },
        { id: "C", type: "end" }
      ],
      edges: [
        { from: "A", to: "B", type: "flow" },
        { from: "B", to: "C", type: "flow" }
      ]
    },
    {
      total_node_count: 3n,
      total_edge_count: 2n,
      valid_node_count: 3n,
      valid_edge_count: 2n,
      orphaned_node_count: 0n,
      dangling_edge_count: 0n,
      duplicate_node_count: 0n,
      duplicate_edge_count: 0n,
      node_validity_ratio: 1.0,
      edge_validity_ratio: 1.0,
      connectivity_ratio: 1.0,
      problematic_node_types: [
        { node_type: "end", orphaned_count: 0n, total_count: 1n, orphaned_percentage: 0.0 },
        { node_type: "middle", orphaned_count: 0n, total_count: 1n, orphaned_percentage: 0.0 },
        { node_type: "start", orphaned_count: 0n, total_count: 1n, orphaned_percentage: 0.0 }
      ],
      problematic_edge_patterns: [
        { from_type: "middle", to_type: "end", dangling_count: 0n, valid_count: 1n, failure_rate: 0.0 },
        { from_type: "start", to_type: "middle", dangling_count: 0n, valid_count: 1n, failure_rate: 0.0 }
      ]
    }
  );

// Test 2: Duplicate nodes - Count statistics
const validate_duplicate_nodes_test = new UnitTestBuilder("validate_duplicate_nodes")
  .procedure(graph_validate)
  .test(
    {
      nodes: [
        { id: "A", type: "start" },
        { id: "A", type: "start_copy" }, // Duplicate
        { id: "B", type: "middle" },
        { id: "B", type: "middle_copy" }, // Duplicate
        { id: "C", type: "end" }
      ],
      edges: [
        { from: "A", to: "B", type: "flow" },
        { from: "B", to: "C", type: "flow" }
      ]
    },
    {
      total_node_count: 5n,
      total_edge_count: 2n,
      valid_node_count: 3n,
      valid_edge_count: 2n,
      orphaned_node_count: 0n,
      dangling_edge_count: 0n,
      duplicate_node_count: 2n, // A and B are duplicated
      duplicate_edge_count: 0n,
      node_validity_ratio: 0.6, // 3 valid out of 5 total
      edge_validity_ratio: 1.0,
      connectivity_ratio: 1.0,
      problematic_node_types: [
        { node_type: "end", orphaned_count: 0n, total_count: 1n, orphaned_percentage: 0.0 },
        { node_type: "middle", orphaned_count: 0n, total_count: 1n, orphaned_percentage: 0.0 },
        { node_type: "start", orphaned_count: 0n, total_count: 1n, orphaned_percentage: 0.0 }
      ],
      problematic_edge_patterns: [
        { from_type: "middle", to_type: "end", dangling_count: 0n, valid_count: 1n, failure_rate: 0.0 },
        { from_type: "start", to_type: "middle", dangling_count: 0n, valid_count: 1n, failure_rate: 0.0 }
      ]
    }
  );

// Test 3: Duplicate edges - Count statistics
const validate_duplicate_edges_test = new UnitTestBuilder("validate_duplicate_edges")
  .procedure(graph_validate)
  .test(
    {
      nodes: [
        { id: "A", type: "start" },
        { id: "B", type: "middle" },
        { id: "C", type: "end" }
      ],
      edges: [
        { from: "A", to: "B", type: "flow" },
        { from: "A", to: "B", type: "flow" }, // Duplicate
        { from: "B", to: "C", type: "flow" },
        { from: "B", to: "C", type: "flow" }, // Duplicate
        { from: "B", to: "C", type: "flow" }  // Triple
      ]
    },
    {
      total_node_count: 3n,
      total_edge_count: 5n,
      valid_node_count: 3n,
      valid_edge_count: 2n, // Only unique edges counted
      orphaned_node_count: 0n,
      dangling_edge_count: 0n,
      duplicate_node_count: 0n,
      duplicate_edge_count: 2n, // A->B and B->C patterns are duplicated
      node_validity_ratio: 1.0,
      edge_validity_ratio: 0.4, // 2 valid out of 5 total
      connectivity_ratio: 1.0,
      problematic_node_types: [
        { node_type: "end", orphaned_count: 0n, total_count: 1n, orphaned_percentage: 0.0 },
        { node_type: "middle", orphaned_count: 0n, total_count: 1n, orphaned_percentage: 0.0 },
        { node_type: "start", orphaned_count: 0n, total_count: 1n, orphaned_percentage: 0.0 }
      ],
      problematic_edge_patterns: [
        { from_type: "middle", to_type: "end", dangling_count: 0n, valid_count: 1n, failure_rate: 0.0 },
        { from_type: "start", to_type: "middle", dangling_count: 0n, valid_count: 1n, failure_rate: 0.0 }
      ]
    }
  );

// Test 4: Dangling edges - Count statistics
const validate_dangling_edges_test = new UnitTestBuilder("validate_dangling_edges")
  .procedure(graph_validate)
  .test(
    {
      nodes: [
        { id: "A", type: "start" },
        { id: "B", type: "middle" }
      ],
      edges: [
        { from: "A", to: "B", type: "flow" },        // Valid
        { from: "A", to: "C", type: "flow" },        // Dangling: C doesn't exist
        { from: "D", to: "B", type: "flow" },        // Dangling: D doesn't exist
        { from: "E", to: "F", type: "flow" }         // Dangling: Both E and F don't exist
      ]
    },
    {
      total_node_count: 2n,
      total_edge_count: 4n,
      valid_node_count: 2n,
      valid_edge_count: 1n,
      orphaned_node_count: 0n,
      dangling_edge_count: 3n,
      duplicate_node_count: 0n,
      duplicate_edge_count: 0n,
      node_validity_ratio: 1.0,
      edge_validity_ratio: 0.25, // 1 valid out of 4 total
      connectivity_ratio: 1.0, // Both nodes are connected
      problematic_node_types: [
        { node_type: "middle", orphaned_count: 0n, total_count: 1n, orphaned_percentage: 0.0 },
        { node_type: "start", orphaned_count: 0n, total_count: 1n, orphaned_percentage: 0.0 }
      ],
      problematic_edge_patterns: [
        { from_type: "start", to_type: "middle", dangling_count: 0n, valid_count: 1n, failure_rate: 0.0 },
        { from_type: "start", to_type: "unknown", dangling_count: 1n, valid_count: 0n, failure_rate: 100.0 },
        { from_type: "unknown", to_type: "middle", dangling_count: 1n, valid_count: 0n, failure_rate: 100.0 }
      ]
    }
  );

// Test 5: Orphaned nodes - Count statistics
const validate_orphaned_nodes_test = new UnitTestBuilder("validate_orphaned_nodes")
  .procedure(graph_validate)
  .test(
    {
      nodes: [
        { id: "A", type: "start" },
        { id: "B", type: "middle" },
        { id: "C", type: "end" },
        { id: "D", type: "orphan1" }, // Not referenced by any edges
        { id: "E", type: "orphan2" }  // Not referenced by any edges
      ],
      edges: [
        { from: "A", to: "B", type: "flow" },
        { from: "B", to: "C", type: "flow" }
      ]
    },
    {
      total_node_count: 5n,
      total_edge_count: 2n,
      valid_node_count: 5n,
      valid_edge_count: 2n,
      orphaned_node_count: 2n, // D and E are orphaned
      dangling_edge_count: 0n,
      duplicate_node_count: 0n,
      duplicate_edge_count: 0n,
      node_validity_ratio: 1.0,
      edge_validity_ratio: 1.0,
      connectivity_ratio: 0.6, // 3 out of 5 nodes are connected
      problematic_node_types: [
        { node_type: "end", orphaned_count: 0n, total_count: 1n, orphaned_percentage: 0.0 },
        { node_type: "middle", orphaned_count: 0n, total_count: 1n, orphaned_percentage: 0.0 },
        { node_type: "orphan1", orphaned_count: 1n, total_count: 1n, orphaned_percentage: 100.0 },
        { node_type: "orphan2", orphaned_count: 1n, total_count: 1n, orphaned_percentage: 100.0 },
        { node_type: "start", orphaned_count: 0n, total_count: 1n, orphaned_percentage: 0.0 }
      ],
      problematic_edge_patterns: [
        { from_type: "middle", to_type: "end", dangling_count: 0n, valid_count: 1n, failure_rate: 0.0 },
        { from_type: "start", to_type: "middle", dangling_count: 0n, valid_count: 1n, failure_rate: 0.0 }
      ]
    }
  );

// Test 6: Empty graph - Baseline test
const validate_empty_test = new UnitTestBuilder("validate_empty")
  .procedure(graph_validate)
  .test(
    {
      nodes: [],
      edges: []
    },
    {
      total_node_count: 0n,
      total_edge_count: 0n,
      valid_node_count: 0n,
      valid_edge_count: 0n,
      orphaned_node_count: 0n,
      dangling_edge_count: 0n,
      duplicate_node_count: 0n,
      duplicate_edge_count: 0n,
      node_validity_ratio: 0.0, // DivideSafe returns 0.0 for 0/0
      edge_validity_ratio: 0.0, // DivideSafe returns 0.0 for 0/0
      connectivity_ratio: 0.0,   // DivideSafe returns 0.0 for 0/0
      problematic_node_types: [],
      problematic_edge_patterns: []
    }
  );

// Test 7: Complex mixed issues - Comprehensive statistics test
const validate_complex_issues_test = new UnitTestBuilder("validate_complex_issues")
  .procedure(graph_validate)
  .test(
    {
      nodes: [
        { id: "A", type: "start" },
        { id: "A", type: "start_duplicate" }, // Duplicate
        { id: "B", type: "middle" },
        { id: "C", type: "end" },
        { id: "D", type: "orphan" } // Orphaned
      ],
      edges: [
        { from: "A", to: "B", type: "flow" },
        { from: "A", to: "B", type: "flow" }, // Duplicate edge
        { from: "B", to: "C", type: "flow" },
        { from: "B", to: "E", type: "flow" }, // Dangling: E doesn't exist
        { from: "F", to: "C", type: "flow" }  // Dangling: F doesn't exist
      ]
    },
    {
      total_node_count: 5n,
      total_edge_count: 5n,
      valid_node_count: 4n, // A, B, C, D (first A kept)
      valid_edge_count: 2n, // A->B and B->C (duplicates removed)
      orphaned_node_count: 1n, // D is orphaned
      dangling_edge_count: 2n, // B->E and F->C
      duplicate_node_count: 1n, // A is duplicated
      duplicate_edge_count: 1n, // A->B is duplicated
      node_validity_ratio: 0.8, // 4 valid out of 5 total
      edge_validity_ratio: 0.4, // 2 valid out of 5 total
      connectivity_ratio: 0.75, // 3 out of 4 valid nodes are connected
      problematic_node_types: [
        { node_type: "end", orphaned_count: 0n, total_count: 1n, orphaned_percentage: 0.0 },
        { node_type: "middle", orphaned_count: 0n, total_count: 1n, orphaned_percentage: 0.0 },
        { node_type: "orphan", orphaned_count: 1n, total_count: 1n, orphaned_percentage: 100.0 },
        { node_type: "start", orphaned_count: 0n, total_count: 1n, orphaned_percentage: 0.0 }
      ],
      problematic_edge_patterns: [
        { from_type: "middle", to_type: "end", dangling_count: 0n, valid_count: 1n, failure_rate: 0.0 },
        { from_type: "middle", to_type: "unknown", dangling_count: 1n, valid_count: 0n, failure_rate: 100.0 },
        { from_type: "start", to_type: "middle", dangling_count: 0n, valid_count: 1n, failure_rate: 0.0 },
        { from_type: "unknown", to_type: "end", dangling_count: 1n, valid_count: 0n, failure_rate: 100.0 }
      ]
    }
  );

// P0 CRITICAL EDGE CASES

// Test: Special characters in node IDs - tests string operation robustness
const validate_special_char_ids_test = new UnitTestBuilder("validate_special_char_ids")
  .procedure(graph_validate)
  .test(
    {
      nodes: [
        { id: ":", type: "separator" },      // Contains separator character used in edge keys
        { id: "\n\t", type: "whitespace" },  // Whitespace characters
        { id: "🚀", type: "unicode" },       // Unicode characters
        { id: "null", type: "keyword" },     // Reserved word
        { id: "", type: "empty" }            // Empty string (already tested but included)
      ],
      edges: [
        { from: ":", to: "\n\t", type: "flow" },
        { from: "🚀", to: "null", type: "flow" },
        { from: "null", to: "", type: "flow" }
      ]
    },
    {
      total_node_count: 5n,
      total_edge_count: 3n,
      valid_node_count: 5n,
      valid_edge_count: 3n,
      orphaned_node_count: 0n,
      dangling_edge_count: 0n,
      duplicate_node_count: 0n,
      duplicate_edge_count: 0n,
      node_validity_ratio: 1.0,
      edge_validity_ratio: 1.0,
      connectivity_ratio: 1.0,
      problematic_node_types: [
        { node_type: "empty", orphaned_count: 0n, total_count: 1n, orphaned_percentage: 0.0 },
        { node_type: "keyword", orphaned_count: 0n, total_count: 1n, orphaned_percentage: 0.0 },
        { node_type: "separator", orphaned_count: 0n, total_count: 1n, orphaned_percentage: 0.0 },
        { node_type: "unicode", orphaned_count: 0n, total_count: 1n, orphaned_percentage: 0.0 },
        { node_type: "whitespace", orphaned_count: 0n, total_count: 1n, orphaned_percentage: 0.0 }
      ],
      problematic_edge_patterns: [
        { from_type: "keyword", to_type: "empty", dangling_count: 0n, valid_count: 1n, failure_rate: 0.0 },
        { from_type: "separator", to_type: "whitespace", dangling_count: 0n, valid_count: 1n, failure_rate: 0.0 },
        { from_type: "unicode", to_type: "keyword", dangling_count: 0n, valid_count: 1n, failure_rate: 0.0 }
      ]
    }
  );

// Test: All disconnected graph - every node is isolated (worst case for connectivity)
const validate_all_disconnected_test = new UnitTestBuilder("validate_all_disconnected")
  .procedure(graph_validate)
  .test(
    {
      nodes: [
        { id: "A", type: "isolated" },
        { id: "B", type: "isolated" },
        { id: "C", type: "isolated" },
        { id: "D", type: "isolated" },
        { id: "E", type: "isolated" }
      ],
      edges: [] // No edges - complete disconnection
    },
    {
      total_node_count: 5n,
      total_edge_count: 0n,
      valid_node_count: 5n,
      valid_edge_count: 0n,
      orphaned_node_count: 5n, // All nodes are orphaned
      dangling_edge_count: 0n,
      duplicate_node_count: 0n,
      duplicate_edge_count: 0n,
      node_validity_ratio: 1.0,
      edge_validity_ratio: 0.0, // 0/0 = 0.0 with DivideSafe
      connectivity_ratio: 0.0,   // No nodes connected
      problematic_node_types: [
        { node_type: "isolated", orphaned_count: 5n, total_count: 5n, orphaned_percentage: 100.0 }
      ],
      problematic_edge_patterns: []
    }
  );

// Test: Hub pattern - all edges point to one central node
const validate_hub_pattern_test = new UnitTestBuilder("validate_hub_pattern")
  .procedure(graph_validate)
  .test(
    {
      nodes: [
        { id: "HUB", type: "central" },
        { id: "A", type: "spoke" },
        { id: "B", type: "spoke" },
        { id: "C", type: "spoke" },
        { id: "D", type: "spoke" }
      ],
      edges: [
        { from: "A", to: "HUB", type: "flow" },
        { from: "B", to: "HUB", type: "flow" },
        { from: "C", to: "HUB", type: "flow" },
        { from: "D", to: "HUB", type: "flow" }
      ]
    },
    {
      total_node_count: 5n,
      total_edge_count: 4n,
      valid_node_count: 5n,
      valid_edge_count: 4n,
      orphaned_node_count: 0n,
      dangling_edge_count: 0n,
      duplicate_node_count: 0n,
      duplicate_edge_count: 0n,
      node_validity_ratio: 1.0,
      edge_validity_ratio: 1.0,
      connectivity_ratio: 1.0,
      problematic_node_types: [
        { node_type: "central", orphaned_count: 0n, total_count: 1n, orphaned_percentage: 0.0 },
        { node_type: "spoke", orphaned_count: 0n, total_count: 4n, orphaned_percentage: 0.0 }
      ],
      problematic_edge_patterns: [
        { from_type: "spoke", to_type: "central", dangling_count: 0n, valid_count: 4n, failure_rate: 0.0 }
      ]
    }
  );

// Test: Star pattern - all edges emanate from one central node
const validate_star_pattern_test = new UnitTestBuilder("validate_star_pattern")
  .procedure(graph_validate)
  .test(
    {
      nodes: [
        { id: "CENTER", type: "source" },
        { id: "A", type: "target" },
        { id: "B", type: "target" },
        { id: "C", type: "target" },
        { id: "D", type: "target" }
      ],
      edges: [
        { from: "CENTER", to: "A", type: "flow" },
        { from: "CENTER", to: "B", type: "flow" },
        { from: "CENTER", to: "C", type: "flow" },
        { from: "CENTER", to: "D", type: "flow" }
      ]
    },
    {
      total_node_count: 5n,
      total_edge_count: 4n,
      valid_node_count: 5n,
      valid_edge_count: 4n,
      orphaned_node_count: 0n,
      dangling_edge_count: 0n,
      duplicate_node_count: 0n,
      duplicate_edge_count: 0n,
      node_validity_ratio: 1.0,
      edge_validity_ratio: 1.0,
      connectivity_ratio: 1.0,
      problematic_node_types: [
        { node_type: "source", orphaned_count: 0n, total_count: 1n, orphaned_percentage: 0.0 },
        { node_type: "target", orphaned_count: 0n, total_count: 4n, orphaned_percentage: 0.0 }
      ],
      problematic_edge_patterns: [
        { from_type: "source", to_type: "target", dangling_count: 0n, valid_count: 4n, failure_rate: 0.0 }
      ]
    }
  );

// P1 HIGH PRIORITY EDGE CASES

// Test: Massive duplicates - programmatically generate many same-ID nodes
const validate_massive_duplicates_test = new UnitTestBuilder("validate_massive_duplicates")
  .procedure(graph_validate)
  .test(
    {
      nodes: [
        // Create 50 duplicate nodes with same ID (manageable for testing, represents the pattern)
        ...Array.from({length: 50}, (_, i) => ({ id: "DUPLICATE", type: `type_${i}` })),
        { id: "B", type: "unique" }
      ],
      edges: [
        { from: "DUPLICATE", to: "B", type: "flow" }
      ]
    },
    {
      total_node_count: 51n,
      total_edge_count: 1n,
      valid_node_count: 2n, // Only first DUPLICATE + B kept
      valid_edge_count: 1n,
      orphaned_node_count: 0n,
      dangling_edge_count: 0n,
      duplicate_node_count: 1n, // DUPLICATE has duplicates
      duplicate_edge_count: 0n,
      node_validity_ratio: 0.0392156862745098, // 2/51 ≈ 0.039
      edge_validity_ratio: 1.0,
      connectivity_ratio: 1.0,
      problematic_node_types: [
        { node_type: "type_0", orphaned_count: 0n, total_count: 1n, orphaned_percentage: 0.0 },
        { node_type: "unique", orphaned_count: 0n, total_count: 1n, orphaned_percentage: 0.0 }
      ],
      problematic_edge_patterns: [
        { from_type: "type_0", to_type: "unique", dangling_count: 0n, valid_count: 1n, failure_rate: 0.0 }
      ]
    }
  );

// Test: Dense self-loop scenarios - multiple self-loops per node
const validate_dense_self_loops_test = new UnitTestBuilder("validate_dense_self_loops")
  .procedure(graph_validate)
  .test(
    {
      nodes: [
        { id: "A", type: "self_ref" },
        { id: "B", type: "self_ref" },
        { id: "C", type: "normal" }
      ],
      edges: [
        // Multiple self-loops on A
        { from: "A", to: "A", type: "self_loop" },
        { from: "A", to: "A", type: "self_loop" },
        { from: "A", to: "A", type: "self_loop" },
        // Multiple self-loops on B  
        { from: "B", to: "B", type: "self_loop" },
        { from: "B", to: "B", type: "self_loop" },
        // Normal edge
        { from: "A", to: "C", type: "flow" }
      ]
    },
    {
      total_node_count: 3n,
      total_edge_count: 6n,
      valid_node_count: 3n,
      valid_edge_count: 3n, // A->A, B->B, A->C (duplicates removed)
      orphaned_node_count: 0n, // All nodes referenced by valid edges
      dangling_edge_count: 0n,
      duplicate_node_count: 0n,
      duplicate_edge_count: 2n, // A->A and B->B patterns duplicated
      node_validity_ratio: 1.0,
      edge_validity_ratio: 0.5, // 3/6 = 0.5
      connectivity_ratio: 1.0,
      problematic_node_types: [
        { node_type: "normal", orphaned_count: 0n, total_count: 1n, orphaned_percentage: 0.0 },
        { node_type: "self_ref", orphaned_count: 0n, total_count: 2n, orphaned_percentage: 0.0 }
      ],
      problematic_edge_patterns: [
        { from_type: "self_ref", to_type: "normal", dangling_count: 0n, valid_count: 1n, failure_rate: 0.0 },
        { from_type: "self_ref", to_type: "self_ref", dangling_count: 0n, valid_count: 2n, failure_rate: 0.0 }
      ]
    }
  );

// P2 MEDIUM PRIORITY EDGE CASES

// Test: Asymmetric edge patterns - edges only go one direction in bipartite-like structure
const validate_asymmetric_edges_test = new UnitTestBuilder("validate_asymmetric_edges")
  .procedure(graph_validate)
  .test(
    {
      nodes: [
        { id: "L1", type: "left" },
        { id: "L2", type: "left" },
        { id: "R1", type: "right" },
        { id: "R2", type: "right" },
        { id: "ISO", type: "isolated" }
      ],
      edges: [
        // All edges go left->right, none go right->left (asymmetric)
        { from: "L1", to: "R1", type: "flow" },
        { from: "L1", to: "R2", type: "flow" },
        { from: "L2", to: "R1", type: "flow" },
        { from: "L2", to: "R2", type: "flow" }
        // ISO has no edges (isolated node)
      ]
    },
    {
      total_node_count: 5n,
      total_edge_count: 4n,
      valid_node_count: 5n,
      valid_edge_count: 4n,
      orphaned_node_count: 1n, // ISO is orphaned
      dangling_edge_count: 0n,
      duplicate_node_count: 0n,
      duplicate_edge_count: 0n,
      node_validity_ratio: 1.0,
      edge_validity_ratio: 1.0,
      connectivity_ratio: 0.8, // 4/5 nodes connected
      problematic_node_types: [
        { node_type: "isolated", orphaned_count: 1n, total_count: 1n, orphaned_percentage: 100.0 },
        { node_type: "left", orphaned_count: 0n, total_count: 2n, orphaned_percentage: 0.0 },
        { node_type: "right", orphaned_count: 0n, total_count: 2n, orphaned_percentage: 0.0 }
      ],
      problematic_edge_patterns: [
        { from_type: "left", to_type: "right", dangling_count: 0n, valid_count: 4n, failure_rate: 0.0 }
      ]
    }
  );

export default Template(
  validate_clean_test,
  validate_duplicate_nodes_test,
  validate_duplicate_edges_test,
  validate_dangling_edges_test,
  validate_orphaned_nodes_test,
  validate_empty_test,
  validate_complex_issues_test,
  
  // P0 Critical Edge Cases
  validate_special_char_ids_test,
  validate_all_disconnected_test,
  validate_hub_pattern_test,
  validate_star_pattern_test,
  
  // P1 High Priority Edge Cases
  validate_massive_duplicates_test,
  validate_dense_self_loops_test,
  
  // P2 Medium Priority Edge Cases
  validate_asymmetric_edges_test
);