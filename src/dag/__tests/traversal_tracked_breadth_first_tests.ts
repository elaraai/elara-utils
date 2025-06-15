import { Template, UnitTestBuilder } from "@elaraai/core";
import { graph_tracked_bfs } from "../traversal/tracked_breadth_first";

/**
 * Test 1: Simple Linear Chain
 * Input: A→B→C | Output: Level-order with parent tracking
 */
const tracked_bfs_linear_test = new UnitTestBuilder("tracked_bfs_linear")
  .procedure(graph_tracked_bfs)
  .test(
    {
      nodes: [
        { id: "A", type: "start" },
        { id: "B", type: "middle" },
        { id: "C", type: "end" }
      ],
      edges: [
        { from: "A", to: "B", type: "flow" },
        { from: "B", to: "C", type: "process" }
      ],
      source_node_id: "A",
      limit: null
    },
    [
      { id: "A", type: "start", visited_order: 0n, depth: 0n, parent_edge_types: [], parent_id: null, parent_type: null },
      { id: "B", type: "middle", visited_order: 1n, depth: 1n, parent_edge_types: ["flow"], parent_id: "A", parent_type: "start" },
      { id: "C", type: "end", visited_order: 2n, depth: 2n, parent_edge_types: ["process"], parent_id: "B", parent_type: "middle" }
    ]
  );

/**
 * Test 2: Diamond Structure (BFS level-order processing)
 * Input: A→B,C; B→D; C→D | Output: Level 1 (B,C) before Level 2 (D)
 */
const tracked_bfs_diamond_test = new UnitTestBuilder("tracked_bfs_diamond")
  .procedure(graph_tracked_bfs)
  .test(
    {
      nodes: [
        { id: "A", type: "source" },
        { id: "B", type: "processor" },
        { id: "C", type: "processor" },
        { id: "D", type: "sink" }
      ],
      edges: [
        { from: "A", to: "B", type: "split" },
        { from: "A", to: "C", type: "split" },
        { from: "B", to: "D", type: "merge" },
        { from: "C", to: "D", type: "merge" }
      ],
      source_node_id: "A",
      limit: null
    },
    [
      { id: "A", type: "source", visited_order: 0n, depth: 0n, parent_edge_types: [], parent_id: null, parent_type: null },
      { id: "B", type: "processor", visited_order: 1n, depth: 1n, parent_edge_types: ["split"], parent_id: "A", parent_type: "source" },
      { id: "C", type: "processor", visited_order: 2n, depth: 1n, parent_edge_types: ["split"], parent_id: "A", parent_type: "source" },
      { id: "D", type: "sink", visited_order: 3n, depth: 2n, parent_edge_types: ["merge"], parent_id: "B", parent_type: "processor" }
    ]
  );

/**
 * Test 3: Multi-level Tree Structure
 * Input: A→B,C; B→D,E; C→F | Output: Level-by-level expansion
 */
const tracked_bfs_tree_test = new UnitTestBuilder("tracked_bfs_tree")
  .procedure(graph_tracked_bfs)
  .test(
    {
      nodes: [
        { id: "A", type: "root" },
        { id: "B", type: "branch" },
        { id: "C", type: "branch" },
        { id: "D", type: "leaf" },
        { id: "E", type: "leaf" },
        { id: "F", type: "leaf" }
      ],
      edges: [
        { from: "A", to: "B", type: "left" },
        { from: "A", to: "C", type: "right" },
        { from: "B", to: "D", type: "left" },
        { from: "B", to: "E", type: "right" },
        { from: "C", to: "F", type: "child" }
      ],
      source_node_id: "A",
      limit: null
    },
    [
      { id: "A", type: "root", visited_order: 0n, depth: 0n, parent_edge_types: [], parent_id: null, parent_type: null },
      { id: "B", type: "branch", visited_order: 1n, depth: 1n, parent_edge_types: ["left"], parent_id: "A", parent_type: "root" },
      { id: "C", type: "branch", visited_order: 2n, depth: 1n, parent_edge_types: ["right"], parent_id: "A", parent_type: "root" },
      { id: "D", type: "leaf", visited_order: 3n, depth: 2n, parent_edge_types: ["left"], parent_id: "B", parent_type: "branch" },
      { id: "E", type: "leaf", visited_order: 4n, depth: 2n, parent_edge_types: ["right"], parent_id: "B", parent_type: "branch" },
      { id: "F", type: "leaf", visited_order: 5n, depth: 2n, parent_edge_types: ["child"], parent_id: "C", parent_type: "branch" }
    ]
  );

/**
 * Test 4: Multiple Edge Types Between Same Nodes
 * Input: A→B (flow,data); B→C (output) | Output: Collect all edge types
 */
const tracked_bfs_multi_edges_test = new UnitTestBuilder("tracked_bfs_multi_edges")
  .procedure(graph_tracked_bfs)
  .test(
    {
      nodes: [
        { id: "A", type: "source" },
        { id: "B", type: "processor" },
        { id: "C", type: "sink" }
      ],
      edges: [
        { from: "A", to: "B", type: "flow" },
        { from: "A", to: "B", type: "data" },
        { from: "A", to: "B", type: "signal" },
        { from: "B", to: "C", type: "output" }
      ],
      source_node_id: "A",
      limit: null
    },
    [
      { id: "A", type: "source", visited_order: 0n, depth: 0n, parent_edge_types: [], parent_id: null, parent_type: null },
      { id: "B", type: "processor", visited_order: 1n, depth: 1n, parent_edge_types: ["flow", "data", "signal"], parent_id: "A", parent_type: "source" },
      { id: "C", type: "sink", visited_order: 2n, depth: 2n, parent_edge_types: ["output"], parent_id: "B", parent_type: "processor" }
    ]
  );

/**
 * Test 5: Single Node (No Edges)
 * Input: A (isolated) | Output: Single node result
 */
const tracked_bfs_single_node_test = new UnitTestBuilder("tracked_bfs_single_node")
  .procedure(graph_tracked_bfs)
  .test(
    {
      nodes: [
        { id: "A", type: "isolated" }
      ],
      edges: [],
      source_node_id: "A",
      limit: null
    },
    [
      { id: "A", type: "isolated", visited_order: 0n, depth: 0n, parent_edge_types: [], parent_id: null, parent_type: null }
    ]
  );

/**
 * Test 6: Self-Loop Handling
 * Input: A→A,B; B→C | Output: Self-loop doesn't cause infinite traversal
 */
const tracked_bfs_self_loop_test = new UnitTestBuilder("tracked_bfs_self_loop")
  .procedure(graph_tracked_bfs)
  .test(
    {
      nodes: [
        { id: "A", type: "recursive" },
        { id: "B", type: "normal" },
        { id: "C", type: "end" }
      ],
      edges: [
        { from: "A", to: "A", type: "self" },
        { from: "A", to: "B", type: "forward" },
        { from: "B", to: "C", type: "continue" }
      ],
      source_node_id: "A",
      limit: null
    },
    [
      { id: "A", type: "recursive", visited_order: 0n, depth: 0n, parent_edge_types: [], parent_id: null, parent_type: null },
      { id: "B", type: "normal", visited_order: 1n, depth: 1n, parent_edge_types: ["forward"], parent_id: "A", parent_type: "recursive" },
      { id: "C", type: "end", visited_order: 2n, depth: 2n, parent_edge_types: ["continue"], parent_id: "B", parent_type: "normal" }
    ]
  );

/**
 * Test 7: Complex Manufacturing Workflow
 * Input: Real-world batch processing scenario | Output: Level-order with metadata
 */
const tracked_bfs_manufacturing_test = new UnitTestBuilder("tracked_bfs_manufacturing")
  .procedure(graph_tracked_bfs)
  .test(
    {
      nodes: [
        { id: "raw_material", type: "input" },
        { id: "quality_check", type: "validation" },
        { id: "processing", type: "operation" },
        { id: "packaging", type: "operation" },
        { id: "final_product", type: "output" }
      ],
      edges: [
        { from: "raw_material", to: "quality_check", type: "material_flow" },
        { from: "quality_check", to: "processing", type: "approved_material" },
        { from: "processing", to: "packaging", type: "processed_goods" },
        { from: "packaging", to: "final_product", type: "packaged_goods" }
      ],
      source_node_id: "raw_material",
      limit: null
    },
    [
      { id: "raw_material", type: "input", visited_order: 0n, depth: 0n, parent_edge_types: [], parent_id: null, parent_type: null },
      { id: "quality_check", type: "validation", visited_order: 1n, depth: 1n, parent_edge_types: ["material_flow"], parent_id: "raw_material", parent_type: "input" },
      { id: "processing", type: "operation", visited_order: 2n, depth: 2n, parent_edge_types: ["approved_material"], parent_id: "quality_check", parent_type: "validation" },
      { id: "packaging", type: "operation", visited_order: 3n, depth: 3n, parent_edge_types: ["processed_goods"], parent_id: "processing", parent_type: "operation" },
      { id: "final_product", type: "output", visited_order: 4n, depth: 4n, parent_edge_types: ["packaged_goods"], parent_id: "packaging", parent_type: "operation" }
    ]
  );

/**
 * Test 8: Disconnected Components (Unreachable Nodes)
 * Input: A→B; X→Y (disconnected) | Output: Only A,B reachable from A
 */
const tracked_bfs_disconnected_test = new UnitTestBuilder("tracked_bfs_disconnected")
  .procedure(graph_tracked_bfs)
  .test(
    {
      nodes: [
        { id: "A", type: "component1" },
        { id: "B", type: "component1" },
        { id: "X", type: "component2" },
        { id: "Y", type: "component2" }
      ],
      edges: [
        { from: "A", to: "B", type: "internal" },
        { from: "X", to: "Y", type: "internal" }
      ],
      source_node_id: "A",
      limit: null
    },
    [
      { id: "A", type: "component1", visited_order: 0n, depth: 0n, parent_edge_types: [], parent_id: null, parent_type: null },
      { id: "B", type: "component1", visited_order: 1n, depth: 1n, parent_edge_types: ["internal"], parent_id: "A", parent_type: "component1" }
    ]
  );

/**
 * Test 9: Empty Graph (No Nodes)
 * Input: Empty nodes/edges | Output: Empty result (no crash)
 */
const tracked_bfs_empty_test = new UnitTestBuilder("tracked_bfs_empty")
  .procedure(graph_tracked_bfs)
  .test(
    {
      nodes: [],
      edges: [],
      source_node_id: "nonexistent",
      limit: null
    },
    []
  );

/**
 * Test 10: Wide Branching (Many Children)
 * Input: A→B,C,D,E,F | Output: All children at same level
 */
const tracked_bfs_wide_test = new UnitTestBuilder("tracked_bfs_wide")
  .procedure(graph_tracked_bfs)
  .test(
    {
      nodes: [
        { id: "A", type: "hub" },
        { id: "B", type: "spoke" },
        { id: "C", type: "spoke" },
        { id: "D", type: "spoke" },
        { id: "E", type: "spoke" }
      ],
      edges: [
        { from: "A", to: "B", type: "distribute" },
        { from: "A", to: "C", type: "distribute" },
        { from: "A", to: "D", type: "distribute" },
        { from: "A", to: "E", type: "distribute" }
      ],
      source_node_id: "A",
      limit: null
    },
    [
      { id: "A", type: "hub", visited_order: 0n, depth: 0n, parent_edge_types: [], parent_id: null, parent_type: null },
      { id: "B", type: "spoke", visited_order: 1n, depth: 1n, parent_edge_types: ["distribute"], parent_id: "A", parent_type: "hub" },
      { id: "C", type: "spoke", visited_order: 2n, depth: 1n, parent_edge_types: ["distribute"], parent_id: "A", parent_type: "hub" },
      { id: "D", type: "spoke", visited_order: 3n, depth: 1n, parent_edge_types: ["distribute"], parent_id: "A", parent_type: "hub" },
      { id: "E", type: "spoke", visited_order: 4n, depth: 1n, parent_edge_types: ["distribute"], parent_id: "A", parent_type: "hub" }
    ]
  );

  
/**
 * CRITICAL Test 1: Actual Cycles (Not Just Self-Loops)
 * Input: A→B→C→A | Output: Should terminate without infinite loop
 */
const tracked_bfs_cycle_test = new UnitTestBuilder("tracked_bfs_cycle")
  .procedure(graph_tracked_bfs)
  .test(
    {
      nodes: [
        { id: "A", type: "cycle_node" },
        { id: "B", type: "cycle_node" },
        { id: "C", type: "cycle_node" }
      ],
      edges: [
        { from: "A", to: "B", type: "cycle" },
        { from: "B", to: "C", type: "cycle" },
        { from: "C", to: "A", type: "back_edge" }
      ],
      source_node_id: "A",
      limit: null
    },
    [
      { id: "A", type: "cycle_node", visited_order: 0n, depth: 0n, parent_edge_types: [], parent_id: null, parent_type: null },
      { id: "B", type: "cycle_node", visited_order: 1n, depth: 1n, parent_edge_types: ["cycle"], parent_id: "A", parent_type: "cycle_node" },
      { id: "C", type: "cycle_node", visited_order: 2n, depth: 2n, parent_edge_types: ["cycle"], parent_id: "B", parent_type: "cycle_node" }
    ]
  );

/**
 * CRITICAL Test 2: Complex Interconnected Cycles
 * Input: Multiple overlapping cycles | Output: Visit each node exactly once
 */
const tracked_bfs_complex_cycles_test = new UnitTestBuilder("tracked_bfs_complex_cycles")
  .procedure(graph_tracked_bfs)
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
        { from: "B", to: "C", type: "cycle1" },
        { from: "C", to: "B", type: "back1" },  // Cycle 1: B↔C
        { from: "B", to: "D", type: "bridge" },
        { from: "D", to: "E", type: "cycle2" },
        { from: "E", to: "D", type: "back2" },  // Cycle 2: D↔E
        { from: "C", to: "A", type: "return" }  // Back to start
      ],
      source_node_id: "A",
      limit: null
    },
    [
      { id: "A", type: "hub", visited_order: 0n, depth: 0n, parent_edge_types: [], parent_id: null, parent_type: null },
      { id: "B", type: "cycle1", visited_order: 1n, depth: 1n, parent_edge_types: ["start"], parent_id: "A", parent_type: "hub" },
      { id: "C", type: "cycle1", visited_order: 2n, depth: 2n, parent_edge_types: ["cycle1"], parent_id: "B", parent_type: "cycle1" },
      { id: "D", type: "cycle2", visited_order: 3n, depth: 2n, parent_edge_types: ["bridge"], parent_id: "B", parent_type: "cycle1" },
      { id: "E", type: "cycle2", visited_order: 4n, depth: 3n, parent_edge_types: ["cycle2"], parent_id: "D", parent_type: "cycle2" }
    ]
  );

/**
 * CRITICAL Test 3: Invalid Start Node (Production Error)
 * Input: Start node not in graph | Output: Empty result, no crash
 */
const tracked_bfs_invalid_start_test = new UnitTestBuilder("tracked_bfs_invalid_start")
  .procedure(graph_tracked_bfs)
  .test(
    {
      nodes: [
        { id: "A", type: "valid" },
        { id: "B", type: "valid" }
      ],
      edges: [
        { from: "A", to: "B", type: "connection" }
      ],
      source_node_id: "NONEXISTENT",
      limit: null
    },
    []  // Should return empty, not crash
  );

/**
 * CRITICAL Test 4: Duplicate Edges (Data Quality Issue)
 * Input: Same edge appears multiple times | Output: Handle gracefully
 */
const tracked_bfs_duplicate_edges_test = new UnitTestBuilder("tracked_bfs_duplicate_edges")
  .procedure(graph_tracked_bfs)
  .test(
    {
      nodes: [
        { id: "A", type: "source" },
        { id: "B", type: "target" }
      ],
      edges: [
        { from: "A", to: "B", type: "primary" },
        { from: "A", to: "B", type: "primary" },  // Exact duplicate
        { from: "A", to: "B", type: "secondary" }
      ],
      source_node_id: "A",
      limit: null
    },
    [
      { id: "A", type: "source", visited_order: 0n, depth: 0n, parent_edge_types: [], parent_id: null, parent_type: null },
      { id: "B", type: "target", visited_order: 1n, depth: 1n, parent_edge_types: ["primary", "primary", "secondary"], parent_id: "A", parent_type: "source" }
    ]
  );

/**
 * CRITICAL Test 5: Dangling Edges (Bad Data)
 * Input: Edges reference non-existent nodes | Output: Should ignore gracefully
 */
const tracked_bfs_dangling_edges_test = new UnitTestBuilder("tracked_bfs_dangling_edges")
  .procedure(graph_tracked_bfs)
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
      source_node_id: "A",
      limit: null
    },
    [
      { id: "A", type: "valid", visited_order: 0n, depth: 0n, parent_edge_types: [], parent_id: null, parent_type: null },
      { id: "B", type: "valid", visited_order: 1n, depth: 1n, parent_edge_types: ["valid"], parent_id: "A", parent_type: "valid" }
    ]
  );

/**
 * CRITICAL Test 6: Large Fan-Out (Performance Stress)
 * Input: One node with many children | Output: Handle efficiently
 */
const tracked_bfs_large_fanout_test = new UnitTestBuilder("tracked_bfs_large_fanout")
  .procedure(graph_tracked_bfs)
  .test(
    {
      nodes: [
        { id: "root", type: "distributor" },
        { id: "child_1", type: "endpoint" },
        { id: "child_2", type: "endpoint" },
        { id: "child_3", type: "endpoint" },
        { id: "child_4", type: "endpoint" },
        { id: "child_5", type: "endpoint" },
        { id: "child_6", type: "endpoint" },
        { id: "child_7", type: "endpoint" },
        { id: "child_8", type: "endpoint" },
        { id: "child_9", type: "endpoint" },
        { id: "child_10", type: "endpoint" }
      ],
      edges: [
        { from: "root", to: "child_1", type: "distribute" },
        { from: "root", to: "child_2", type: "distribute" },
        { from: "root", to: "child_3", type: "distribute" },
        { from: "root", to: "child_4", type: "distribute" },
        { from: "root", to: "child_5", type: "distribute" },
        { from: "root", to: "child_6", type: "distribute" },
        { from: "root", to: "child_7", type: "distribute" },
        { from: "root", to: "child_8", type: "distribute" },
        { from: "root", to: "child_9", type: "distribute" },
        { from: "root", to: "child_10", type: "distribute" }
      ],
      source_node_id: "root",
      limit: null
    },
    [
      { id: "root", type: "distributor", visited_order: 0n, depth: 0n, parent_edge_types: [], parent_id: null, parent_type: null },
      { id: "child_1", type: "endpoint", visited_order: 1n, depth: 1n, parent_edge_types: ["distribute"], parent_id: "root", parent_type: "distributor" },
      { id: "child_2", type: "endpoint", visited_order: 2n, depth: 1n, parent_edge_types: ["distribute"], parent_id: "root", parent_type: "distributor" },
      { id: "child_3", type: "endpoint", visited_order: 3n, depth: 1n, parent_edge_types: ["distribute"], parent_id: "root", parent_type: "distributor" },
      { id: "child_4", type: "endpoint", visited_order: 4n, depth: 1n, parent_edge_types: ["distribute"], parent_id: "root", parent_type: "distributor" },
      { id: "child_5", type: "endpoint", visited_order: 5n, depth: 1n, parent_edge_types: ["distribute"], parent_id: "root", parent_type: "distributor" },
      { id: "child_6", type: "endpoint", visited_order: 6n, depth: 1n, parent_edge_types: ["distribute"], parent_id: "root", parent_type: "distributor" },
      { id: "child_7", type: "endpoint", visited_order: 7n, depth: 1n, parent_edge_types: ["distribute"], parent_id: "root", parent_type: "distributor" },
      { id: "child_8", type: "endpoint", visited_order: 8n, depth: 1n, parent_edge_types: ["distribute"], parent_id: "root", parent_type: "distributor" },
      { id: "child_9", type: "endpoint", visited_order: 9n, depth: 1n, parent_edge_types: ["distribute"], parent_id: "root", parent_type: "distributor" },
      { id: "child_10", type: "endpoint", visited_order: 10n, depth: 1n, parent_edge_types: ["distribute"], parent_id: "root", parent_type: "distributor" }
    ]
  );

/**
 * LIMIT Test 1: Depth Limit 0 (Start Node Only)
 * Input: A→B→C with limit=0 | Output: Only start node A
 */
const tracked_bfs_limit_zero_test = new UnitTestBuilder("tracked_bfs_limit_zero")
  .procedure(graph_tracked_bfs)
  .test(
    {
      nodes: [
        { id: "A", type: "start" },
        { id: "B", type: "middle" },
        { id: "C", type: "end" }
      ],
      edges: [
        { from: "A", to: "B", type: "flow" },
        { from: "B", to: "C", type: "process" }
      ],
      source_node_id: "A",
      limit: 0n
    },
    [
      { id: "A", type: "start", visited_order: 0n, depth: 0n, parent_edge_types: [], parent_id: null, parent_type: null }
    ]
  );

/**
 * LIMIT Test 2: Depth Limit 1 (First Level Only)
 * Input: A→B→C with limit=1 | Output: A and B only
 */
const tracked_bfs_limit_one_test = new UnitTestBuilder("tracked_bfs_limit_one")
  .procedure(graph_tracked_bfs)
  .test(
    {
      nodes: [
        { id: "A", type: "start" },
        { id: "B", type: "middle" },
        { id: "C", type: "end" }
      ],
      edges: [
        { from: "A", to: "B", type: "flow" },
        { from: "B", to: "C", type: "process" }
      ],
      source_node_id: "A",
      limit: 1n
    },
    [
      { id: "A", type: "start", visited_order: 0n, depth: 0n, parent_edge_types: [], parent_id: null, parent_type: null },
      { id: "B", type: "middle", visited_order: 1n, depth: 1n, parent_edge_types: ["flow"], parent_id: "A", parent_type: "start" }
    ]
  );

/**
 * LIMIT Test 3: Tree Structure with Depth Limit
 * Input: A→(B,C); B→(D,E); C→F with limit=1 | Output: A, B, C only
 */
const tracked_bfs_limit_tree_test = new UnitTestBuilder("tracked_bfs_limit_tree")
  .procedure(graph_tracked_bfs)
  .test(
    {
      nodes: [
        { id: "A", type: "root" },
        { id: "B", type: "branch" },
        { id: "C", type: "branch" },
        { id: "D", type: "leaf" },
        { id: "E", type: "leaf" },
        { id: "F", type: "leaf" }
      ],
      edges: [
        { from: "A", to: "B", type: "left" },
        { from: "A", to: "C", type: "right" },
        { from: "B", to: "D", type: "left" },
        { from: "B", to: "E", type: "right" },
        { from: "C", to: "F", type: "child" }
      ],
      source_node_id: "A",
      limit: 1n
    },
    [
      { id: "A", type: "root", visited_order: 0n, depth: 0n, parent_edge_types: [], parent_id: null, parent_type: null },
      { id: "B", type: "branch", visited_order: 1n, depth: 1n, parent_edge_types: ["left"], parent_id: "A", parent_type: "root" },
      { id: "C", type: "branch", visited_order: 2n, depth: 1n, parent_edge_types: ["right"], parent_id: "A", parent_type: "root" }
    ]
  );

/**
 * LIMIT Test 4: Large Limit (Equivalent to No Limit)
 * Input: A→B→C with limit=999 | Output: All nodes (same as unlimited)
 */
const tracked_bfs_limit_large_test = new UnitTestBuilder("tracked_bfs_limit_large")
  .procedure(graph_tracked_bfs)
  .test(
    {
      nodes: [
        { id: "A", type: "start" },
        { id: "B", type: "middle" },
        { id: "C", type: "end" }
      ],
      edges: [
        { from: "A", to: "B", type: "flow" },
        { from: "B", to: "C", type: "process" }
      ],
      source_node_id: "A",
      limit: 999n
    },
    [
      { id: "A", type: "start", visited_order: 0n, depth: 0n, parent_edge_types: [], parent_id: null, parent_type: null },
      { id: "B", type: "middle", visited_order: 1n, depth: 1n, parent_edge_types: ["flow"], parent_id: "A", parent_type: "start" },
      { id: "C", type: "end", visited_order: 2n, depth: 2n, parent_edge_types: ["process"], parent_id: "B", parent_type: "middle" }
    ]
  );

export default Template(
  tracked_bfs_linear_test,
  tracked_bfs_diamond_test,
  tracked_bfs_tree_test,
  tracked_bfs_multi_edges_test,
  tracked_bfs_single_node_test,
  tracked_bfs_self_loop_test,
  tracked_bfs_manufacturing_test,
  tracked_bfs_disconnected_test,
  tracked_bfs_empty_test,
  tracked_bfs_wide_test,
  tracked_bfs_cycle_test,
  tracked_bfs_complex_cycles_test,
  tracked_bfs_invalid_start_test,
  tracked_bfs_duplicate_edges_test,
  tracked_bfs_dangling_edges_test,
  tracked_bfs_large_fanout_test,
  tracked_bfs_limit_zero_test,
  tracked_bfs_limit_one_test,
  tracked_bfs_limit_tree_test,
  tracked_bfs_limit_large_test
);