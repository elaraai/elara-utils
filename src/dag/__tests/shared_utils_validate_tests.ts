import { UnitTestBuilder } from "@elaraai/core";
import { Template } from "@elaraai/core";
import { graph_validate } from "../shared_utils/graph_validate";

// Test 1: Clean graph (no issues)
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
        { from: "A", to: "B" },
        { from: "B", to: "C" }
      ]
    },
    {
      valid_nodes: [
        { id: "A", type: "start" },
        { id: "B", type: "middle" },
        { id: "C", type: "end" }
      ],
      valid_edges: [
        { from: "A", to: "B" },
        { from: "B", to: "C" }
      ],
      orphaned_nodes: [],
      dangling_edges: [],
      duplicate_nodes: [],
      duplicate_edges: []
    }
  );

// Test 2: Duplicate nodes
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
        { from: "A", to: "B" },
        { from: "B", to: "C" }
      ]
    },
    {
      valid_nodes: [
        { id: "A", type: "start" }, // First occurrence kept
        { id: "B", type: "middle" }, // First occurrence kept
        { id: "C", type: "end" }
      ],
      valid_edges: [
        { from: "A", to: "B" },
        { from: "B", to: "C" }
      ],
      orphaned_nodes: [],
      dangling_edges: [],
      duplicate_nodes: [
        {
          id: "A",
          count: 2n,
          instances: [
            { id: "A", type: "start" },
            { id: "A", type: "start_copy" }
          ]
        },
        {
          id: "B",
          count: 2n,
          instances: [
            { id: "B", type: "middle" },
            { id: "B", type: "middle_copy" }
          ]
        }
      ],
      duplicate_edges: []
    }
  );

// Test 3: Duplicate edges
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
        { from: "A", to: "B" },
        { from: "A", to: "B" }, // Duplicate
        { from: "B", to: "C" },
        { from: "B", to: "C" }, // Duplicate
        { from: "B", to: "C" }  // Triple
      ]
    },
    {
      valid_nodes: [
        { id: "A", type: "start" },
        { id: "B", type: "middle" },
        { id: "C", type: "end" }
      ],
      valid_edges: [
        { from: "A", to: "B" }, // Only one kept
        { from: "B", to: "C" }  // Only one kept
      ],
      orphaned_nodes: [],
      dangling_edges: [],
      duplicate_nodes: [],
      duplicate_edges: [
        { from: "A", from_type: "start", to: "B", to_type: "middle", count: 2n },
        { from: "B", from_type: "middle", to: "C", to_type: "end", count: 3n }
      ]
    }
  );

// Test 4: Dangling edges
const validate_dangling_edges_test = new UnitTestBuilder("validate_dangling_edges")
  .procedure(graph_validate)
  .test(
    {
      nodes: [
        { id: "A", type: "start" },
        { id: "B", type: "middle" }
      ],
      edges: [
        { from: "A", to: "B" },        // Valid
        { from: "A", to: "C" },        // Dangling: C doesn't exist
        { from: "D", to: "B" },        // Dangling: D doesn't exist
        { from: "E", to: "F" }         // Dangling: Both E and F don't exist
      ]
    },
    {
      valid_nodes: [
        { id: "A", type: "start" },
        { id: "B", type: "middle" }
      ],
      valid_edges: [
        { from: "A", to: "B" }
      ],
      orphaned_nodes: [],
      dangling_edges: [
        { from: "A", from_type: "start", to: "C", to_type: null },
        { from: "D", from_type: null, to: "B", to_type: "middle" },
        { from: "E", from_type: null, to: "F", to_type: null }
      ],
      duplicate_nodes: [],
      duplicate_edges: []
    }
  );

// Test 5: Orphaned nodes
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
        { from: "A", to: "B" },
        { from: "B", to: "C" }
      ]
    },
    {
      valid_nodes: [
        { id: "A", type: "start" },
        { id: "B", type: "middle" },
        { id: "C", type: "end" },
        { id: "D", type: "orphan1" },
        { id: "E", type: "orphan2" }
      ],
      valid_edges: [
        { from: "A", to: "B" },
        { from: "B", to: "C" }
      ],
      orphaned_nodes: [
        { id: "D", type: "orphan1" },
        { id: "E", type: "orphan2" }
      ],
      dangling_edges: [],
      duplicate_nodes: [],
      duplicate_edges: []
    }
  );

// Test 6: Complex graph with all types of issues
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
        { from: "A", to: "B" },
        { from: "A", to: "B" }, // Duplicate edge
        { from: "B", to: "C" },
        { from: "B", to: "E" }, // Dangling: E doesn't exist
        { from: "F", to: "C" }  // Dangling: F doesn't exist
      ]
    },
    {
      valid_nodes: [
        { id: "A", type: "start" }, // First occurrence
        { id: "B", type: "middle" },
        { id: "C", type: "end" },
        { id: "D", type: "orphan" }
      ],
      valid_edges: [
        { from: "A", to: "B" }, // Only one kept
        { from: "B", to: "C" }
      ],
      orphaned_nodes: [
        { id: "D", type: "orphan" }
      ],
      dangling_edges: [
        { from: "B", from_type: "middle", to: "E", to_type: null },
        { from: "F", from_type: null, to: "C", to_type: "end" }
      ],
      duplicate_nodes: [
        {
          id: "A",
          count: 2n,
          instances: [
            { id: "A", type: "start" },
            { id: "A", type: "start_duplicate" }
          ]
        }
      ],
      duplicate_edges: [
        { from: "A", from_type: "start", to: "B", to_type: "middle", count: 2n }
      ]
    }
  );

// Test 7: Empty graph
const validate_empty_test = new UnitTestBuilder("validate_empty")
  .procedure(graph_validate)
  .test(
    {
      nodes: [],
      edges: []
    },
    {
      valid_nodes: [],
      valid_edges: [],
      orphaned_nodes: [],
      dangling_edges: [],
      duplicate_nodes: [],
      duplicate_edges: []
    }
  );

// Test 8: Single node (always orphaned unless self-loop)
const validate_single_node_test = new UnitTestBuilder("validate_single_node")
  .procedure(graph_validate)
  .test(
    {
      nodes: [
        { id: "A", type: "lonely" }
      ],
      edges: []
    },
    {
      valid_nodes: [
        { id: "A", type: "lonely" }
      ],
      valid_edges: [],
      orphaned_nodes: [
        { id: "A", type: "lonely" }
      ],
      dangling_edges: [],
      duplicate_nodes: [],
      duplicate_edges: []
    }
  );

// Test 9: Edges without any nodes (all dangling) - CRITICAL EDGE CASE
const validate_edges_no_nodes_test = new UnitTestBuilder("validate_edges_no_nodes")
  .procedure(graph_validate)
  .test(
    {
      nodes: [],
      edges: [
        { from: "A", to: "B" },
        { from: "B", to: "C" },
        { from: "A", to: "A" } // Self-loop on non-existent node
      ]
    },
    {
      valid_nodes: [],
      valid_edges: [],
      orphaned_nodes: [],
      dangling_edges: [
        { from: "A", from_type: null, to: "B", to_type: null },
        { from: "B", from_type: null, to: "C", to_type: null },
        { from: "A", from_type: null, to: "A", to_type: null }
      ],
      duplicate_nodes: [],
      duplicate_edges: []
    }
  );

// Test 10: Duplicate edges with missing nodes - CRITICAL EDGE CASE
const validate_duplicate_edges_missing_nodes_test = new UnitTestBuilder("validate_duplicate_edges_missing_nodes")
  .procedure(graph_validate)
  .test(
    {
      nodes: [
        { id: "A", type: "start" }
      ],
      edges: [
        { from: "A", to: "B" }, // B doesn't exist
        { from: "A", to: "B" }, // Duplicate of above
        { from: "C", to: "D" }, // Both don't exist
        { from: "C", to: "D" }, // Duplicate of above
        { from: "C", to: "D" }  // Triple of above
      ]
    },
    {
      valid_nodes: [
        { id: "A", type: "start" }
      ],
      valid_edges: [],
      orphaned_nodes: [
        { id: "A", type: "start" } // No valid edges reference A
      ],
      dangling_edges: [
        { from: "A", from_type: "start", to: "B", to_type: null },
        { from: "A", from_type: "start", to: "B", to_type: null },
        { from: "C", from_type: null, to: "D", to_type: null },
        { from: "C", from_type: null, to: "D", to_type: null },
        { from: "C", from_type: null, to: "D", to_type: null }
      ],
      duplicate_nodes: [],
      duplicate_edges: [
        { from: "A", from_type: "start", to: "B", to_type: null, count: 2n },
        { from: "C", from_type: null, to: "D", to_type: null, count: 3n }
      ]
    }
  );

// Test 11: Mixed scenario - some nodes exist, some don't, with duplicates
const validate_mixed_existence_test = new UnitTestBuilder("validate_mixed_existence")
  .procedure(graph_validate)
  .test(
    {
      nodes: [
        { id: "A", type: "real" },
        { id: "C", type: "real" }
      ],
      edges: [
        { from: "A", to: "B" }, // B doesn't exist
        { from: "B", to: "C" }, // B doesn't exist but C does
        { from: "X", to: "Y" }, // Neither exists
        { from: "A", to: "C" }  // Both exist - valid edge
      ]
    },
    {
      valid_nodes: [
        { id: "A", type: "real" },
        { id: "C", type: "real" }
      ],
      valid_edges: [
        { from: "A", to: "C" }
      ],
      orphaned_nodes: [], // Both A and C are referenced by valid edge
      dangling_edges: [
        { from: "A", from_type: "real", to: "B", to_type: null },
        { from: "B", from_type: null, to: "C", to_type: "real" },
        { from: "X", from_type: null, to: "Y", to_type: null }
      ],
      duplicate_nodes: [],
      duplicate_edges: []
    }
  );

// Test 12: Empty string node IDs - CRITICAL EDGE CASE
const validate_empty_string_ids_test = new UnitTestBuilder("validate_empty_string_ids")
  .procedure(graph_validate)
  .test(
    {
      nodes: [
        { id: "", type: "empty" },
        { id: "A", type: "normal" }
      ],
      edges: [
        { from: "", to: "A" },
        { from: "A", to: "" },
        { from: "", to: "" } // Self-loop on empty ID
      ]
    },
    {
      valid_nodes: [
        { id: "", type: "empty" },
        { id: "A", type: "normal" }
      ],
      valid_edges: [
        { from: "", to: "A" },
        { from: "A", to: "" },
        { from: "", to: "" }
      ],
      orphaned_nodes: [],
      dangling_edges: [],
      duplicate_nodes: [],
      duplicate_edges: []
    }
  );

// Test 13: Node IDs containing separator character - CRITICAL EDGE CASE
const validate_separator_in_ids_test = new UnitTestBuilder("validate_separator_in_ids")
  .procedure(graph_validate)
  .test(
    {
      nodes: [
        { id: "A:B", type: "colon_id" },
        { id: "A", type: "normal" },
        { id: "B:C", type: "colon_id2" }
      ],
      edges: [
        { from: "A:B", to: "A" },
        { from: "A", to: "B:C" },
        { from: "A:B", to: "B:C" } // Both IDs have colons
      ]
    },
    {
      valid_nodes: [
        { id: "A", type: "normal" },
        { id: "A:B", type: "colon_id" },
        { id: "B:C", type: "colon_id2" }
      ],
      valid_edges: [
        { from: "A:B", to: "A" },
        { from: "A", to: "B:C" },
        { from: "A:B", to: "B:C" }
      ],
      orphaned_nodes: [],
      dangling_edges: [],
      duplicate_nodes: [],
      duplicate_edges: []
    }
  );

// Test 14: Self-loops with non-existent nodes - EDGE CASE
const validate_self_loop_missing_node_test = new UnitTestBuilder("validate_self_loop_missing_node")
  .procedure(graph_validate)
  .test(
    {
      nodes: [
        { id: "A", type: "real" }
      ],
      edges: [
        { from: "A", to: "A" }, // Valid self-loop
        { from: "B", to: "B" }, // Self-loop on missing node
        { from: "C", to: "C" }  // Another self-loop on missing node
      ]
    },
    {
      valid_nodes: [
        { id: "A", type: "real" }
      ],
      valid_edges: [
        { from: "A", to: "A" }
      ],
      orphaned_nodes: [], // A is referenced by its own self-loop
      dangling_edges: [
        { from: "B", from_type: null, to: "B", to_type: null },
        { from: "C", from_type: null, to: "C", to_type: null }
      ],
      duplicate_nodes: [],
      duplicate_edges: []
    }
  );

// Test 15: Extreme duplicate counts - STRESS TEST
const validate_extreme_duplicates_test = new UnitTestBuilder("validate_extreme_duplicates")
  .procedure(graph_validate)
  .test(
    {
      nodes: [
        { id: "A", type: "first" },
        { id: "A", type: "second" },
        { id: "A", type: "third" },
        { id: "A", type: "fourth" },
        { id: "A", type: "fifth" }
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "A", to: "B" },
        { from: "A", to: "B" },
        { from: "A", to: "B" },
        { from: "A", to: "B" },
        { from: "A", to: "B" }
      ]
    },
    {
      valid_nodes: [
        { id: "A", type: "first" } // First occurrence kept
      ],
      valid_edges: [],
      orphaned_nodes: [
        { id: "A", type: "first" } // A is orphaned since B doesn't exist
      ],
      dangling_edges: [
        { from: "A", from_type: "first", to: "B", to_type: null },
        { from: "A", from_type: "first", to: "B", to_type: null },
        { from: "A", from_type: "first", to: "B", to_type: null },
        { from: "A", from_type: "first", to: "B", to_type: null },
        { from: "A", from_type: "first", to: "B", to_type: null },
        { from: "A", from_type: "first", to: "B", to_type: null }
      ],
      duplicate_nodes: [
        {
          id: "A",
          count: 5n,
          instances: [
            { id: "A", type: "first" },
            { id: "A", type: "second" },
            { id: "A", type: "third" },
            { id: "A", type: "fourth" },
            { id: "A", type: "fifth" }
          ]
        }
      ],
      duplicate_edges: [
        { from: "A", from_type: "first", to: "B", to_type: null, count: 6n }
      ]
    }
  );

export default Template(
  validate_clean_test,
  validate_duplicate_nodes_test,
  validate_duplicate_edges_test,
  validate_dangling_edges_test,
  validate_orphaned_nodes_test,
  validate_complex_issues_test,
  validate_empty_test,
  validate_single_node_test,
  
  // Critical edge case tests (added to prevent production failures)
  validate_edges_no_nodes_test,
  validate_duplicate_edges_missing_nodes_test,
  validate_mixed_existence_test,
  
  // Additional edge case tests for robustness
  validate_empty_string_ids_test,
  validate_separator_in_ids_test,
  validate_self_loop_missing_node_test,
  validate_extreme_duplicates_test
);