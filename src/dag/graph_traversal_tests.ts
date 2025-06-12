import { UnitTestBuilder } from "@elaraai/core";
import { Template } from "@elaraai/core";

import { 
    graph_bfs, 
    graph_dfs, 
    graph_enhanced_traversal, 
    graph_topological_sort, 
    graph_cycle_detection, 
    graph_ancestor_descendant 
} from "./graph_traversal";

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
        { from: "A", to: "B" },
        { from: "B", to: "C" }
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
        { from: "A", to: "B" },
        { from: "A", to: "C" },
        { from: "B", to: "D" },
        { from: "B", to: "E" }
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
        { from: "A", to: "B" },
        { from: "A", to: "C" },
        { from: "B", to: "D" },
        { from: "C", to: "D" }
      ],
      startId: "A"
    },
    ["A", "B", "C", "D"] // Should visit D only once
  );

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
        { from: "A", to: "B" },
        { from: "B", to: "C" }
      ],
      startId: "A"
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
        { from: "A", to: "B" },
        { from: "A", to: "C" },
        { from: "B", to: "D" },
        { from: "B", to: "E" }
      ],
      startId: "A"
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
        { from: "A", to: "B" },
        { from: "A", to: "C" },
        { from: "B", to: "D" },
        { from: "C", to: "D" }
      ],
      startId: "A"
    },
    ["A", "C", "D", "B"] // Should visit D only once via first path
  );

// === EDGE CASE TESTS ===

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

// Empty graph test (DFS)
const dfs_empty_test = new UnitTestBuilder("dfs_empty")
  .procedure(graph_dfs)
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

// Single node test (DFS)
const dfs_single_node_test = new UnitTestBuilder("dfs_single_node")
  .procedure(graph_dfs)
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
        { from: "A", to: "A" }, // Self-loop
        { from: "A", to: "B" }
      ],
      startId: "A"
    },
    ["A", "B"] // Should handle self-loop without infinite loop
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
        { from: "A", to: "A" }, // Self-loop
        { from: "A", to: "B" }
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
        { from: "A", to: "B" },
        { from: "C", to: "D" } // Separate component
      ],
      startId: "A"
    },
    ["A", "B"] // Should only visit connected component
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
        { from: "A", to: "B" },
        { from: "C", to: "D" } // Separate component
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
        { from: "A", to: "B" },
        { from: "B", to: "C" },
        { from: "C", to: "A" } // Creates cycle
      ],
      startId: "A"
    },
    ["A", "B", "C"] // Should visit each node exactly once
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
        { from: "A", to: "B" },
        { from: "B", to: "C" },
        { from: "C", to: "A" } // Creates cycle
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
        { from: "A", to: "B" },
        { from: "A", to: "B" }, // Duplicate edge
        { from: "A", to: "B" }  // Another duplicate
      ],
      startId: "A"
    },
    ["A", "B"] // Should handle duplicates correctly
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
        { from: "A", to: "B" },
        { from: "A", to: "B" }, // Duplicate edge
        { from: "A", to: "B" }  // Another duplicate
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
        { from: "root", to: "child1" },
        { from: "root", to: "child2" },
        { from: "root", to: "child3" },
        { from: "root", to: "child4" },
        { from: "root", to: "child5" }
      ],
      startId: "root"
    },
    ["root", "child1", "child2", "child3", "child4", "child5"] // Level-order
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
        { from: "root", to: "child1" },
        { from: "root", to: "child2" },
        { from: "root", to: "child3" },
        { from: "root", to: "child4" },
        { from: "root", to: "child5" }
      ],
      startId: "root"
    },
    ["root", "child5", "child4", "child3", "child2", "child1"] // Reverse order due to stack
  );

// === ENHANCED TRAVERSAL TESTS ===

// Enhanced BFS traversal test
const enhanced_bfs_test = new UnitTestBuilder("enhanced_bfs")
  .procedure(graph_enhanced_traversal)
  .test(
    {
      nodes: [
        { id: "A", type: "root" },
        { id: "B", type: "node" },
        { id: "C", type: "node" },
        { id: "D", type: "leaf" }
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "A", to: "C" },
        { from: "B", to: "D" }
      ],
      startId: "A",
      useBFS: true
    },
    [
      { id: "A", visited_order: 0n, depth: 0n, parent_id: null },
      { id: "B", visited_order: 1n, depth: 1n, parent_id: "A" },
      { id: "C", visited_order: 2n, depth: 1n, parent_id: "A" },
      { id: "D", visited_order: 3n, depth: 2n, parent_id: "B" }
    ]
  );

// Enhanced DFS traversal test  
const enhanced_dfs_test = new UnitTestBuilder("enhanced_dfs")
  .procedure(graph_enhanced_traversal)
  .test(
    {
      nodes: [
        { id: "A", type: "root" },
        { id: "B", type: "node" },
        { id: "C", type: "node" },
        { id: "D", type: "leaf" }
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "A", to: "C" },
        { from: "B", to: "D" }
      ],
      startId: "A",
      useBFS: false
    },
    [
      { id: "A", visited_order: 0n, depth: 0n, parent_id: null },
      { id: "C", visited_order: 1n, depth: 1n, parent_id: "A" },
      { id: "B", visited_order: 2n, depth: 1n, parent_id: "A" },
      { id: "D", visited_order: 3n, depth: 2n, parent_id: "B" }
    ]
  );

// === TOPOLOGICAL SORT TESTS ===

// Basic topological sort test
const topo_sort_basic_test = new UnitTestBuilder("topo_sort_basic")
  .procedure(graph_topological_sort)
  .test(
    {
      nodes: [
        { id: "A", type: "start" },
        { id: "B", type: "middle" },
        { id: "C", type: "middle" },
        { id: "D", type: "end" }
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "A", to: "C" },
        { from: "B", to: "D" },
        { from: "C", to: "D" }
      ]
    },
    [
      { id: "A", topo_order: 0n, layer: 0n },
      { id: "B", topo_order: 1n, layer: 1n },
      { id: "C", topo_order: 2n, layer: 1n },
      { id: "D", topo_order: 3n, layer: 2n }
    ]
  );

// Topological sort with multiple roots
const topo_sort_multiple_roots_test = new UnitTestBuilder("topo_sort_multiple_roots")
  .procedure(graph_topological_sort)
  .test(
    {
      nodes: [
        { id: "A", type: "root1" },
        { id: "B", type: "root2" },
        { id: "C", type: "merge" }
      ],
      edges: [
        { from: "A", to: "C" },
        { from: "B", to: "C" }
      ]
    },
    [
      { id: "A", topo_order: 0n, layer: 0n },
      { id: "B", topo_order: 1n, layer: 0n },
      { id: "C", topo_order: 2n, layer: 1n }
    ]
  );

// === CYCLE DETECTION TESTS ===

// No cycle test
const cycle_detection_no_cycle_test = new UnitTestBuilder("cycle_detection_no_cycle")
  .procedure(graph_cycle_detection)
  .test(
    {
      nodes: [
        { id: "A", type: "node" },
        { id: "B", type: "node" },
        { id: "C", type: "node" }
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "B", to: "C" }
      ]
    },
    {
      has_cycle: false,
      cycle_nodes: []
    }
  );

// Simple cycle test
const cycle_detection_simple_cycle_test = new UnitTestBuilder("cycle_detection_simple_cycle")
  .procedure(graph_cycle_detection)
  .test(
    {
      nodes: [
        { id: "A", type: "node" },
        { id: "B", type: "node" },
        { id: "C", type: "node" }
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "B", to: "C" },
        { from: "C", to: "A" }
      ]
    },
    {
      has_cycle: true,
      cycle_nodes: ["A", "C"] // Back edge detected
    }
  );

// Self-loop cycle test
const cycle_detection_self_loop_test = new UnitTestBuilder("cycle_detection_self_loop")
  .procedure(graph_cycle_detection)
  .test(
    {
      nodes: [
        { id: "A", type: "self" }
      ],
      edges: [
        { from: "A", to: "A" }
      ]
    },
    {
      has_cycle: true,
      cycle_nodes: ["A", "A"]
    }
  );

// === ANCESTOR/DESCENDANT TESTS ===

// Basic ancestor/descendant test
const ancestor_descendant_basic_test = new UnitTestBuilder("ancestor_descendant_basic")
  .procedure(graph_ancestor_descendant)
  .test(
    {
      nodes: [
        { id: "A", type: "root" },
        { id: "B", type: "middle" },
        { id: "C", type: "middle" },
        { id: "D", type: "leaf" }
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "A", to: "C" },
        { from: "B", to: "D" }
      ]
    },
    [
      {
        id: "A",
        ancestors: [],
        descendants: ["C", "B", "D"],
        reachable_nodes: ["C", "B", "D"]
      },
      {
        id: "B", 
        ancestors: ["A"],
        descendants: ["D"],
        reachable_nodes: ["A", "D"]
      },
      {
        id: "C",
        ancestors: ["A"], 
        descendants: [],
        reachable_nodes: ["A"]
      },
      {
        id: "D",
        ancestors: ["B", "A"],
        descendants: [],
        reachable_nodes: ["B", "A"]
      }
    ]
  );

// Complex ancestor/descendant test
const ancestor_descendant_complex_test = new UnitTestBuilder("ancestor_descendant_complex")
  .procedure(graph_ancestor_descendant)
  .test(
    {
      nodes: [
        { id: "A", type: "root" },
        { id: "B", type: "node" },
        { id: "C", type: "node" },
        { id: "D", type: "node" },
        { id: "E", type: "leaf" }
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "A", to: "C" },
        { from: "B", to: "D" },
        { from: "C", to: "D" },
        { from: "D", to: "E" }
      ]
    },
    [
      {
        id: "A",
        ancestors: [],
        descendants: ["C", "D", "E", "B"],
        reachable_nodes: ["C", "D", "E", "B"]
      },
      {
        id: "B",
        ancestors: ["A"],
        descendants: ["D", "E"],
        reachable_nodes: ["A", "D", "E"]
      },
      {
        id: "C",
        ancestors: ["A"],
        descendants: ["D", "E"],
        reachable_nodes: ["A", "D", "E"]
      },
      {
        id: "D",
        ancestors: ["C", "A", "B"],
        descendants: ["E"],
        reachable_nodes: ["C", "A", "B", "E"]
      },
      {
        id: "E",
        ancestors: ["D", "C", "A", "B"],
        descendants: [],
        reachable_nodes: ["D", "C", "A", "B"]
      }
    ]
  );

// Edge case: disconnected components
const ancestor_descendant_disconnected_test = new UnitTestBuilder("ancestor_descendant_disconnected")
  .procedure(graph_ancestor_descendant)
  .test(
    {
      nodes: [
        { id: "A", type: "component1" },
        { id: "B", type: "component1" },
        { id: "C", type: "component2" },
        { id: "D", type: "component2" }
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "C", to: "D" }
      ]
    },
    [
      {
        id: "A",
        ancestors: [],
        descendants: ["B"],
        reachable_nodes: ["B"]
      },
      {
        id: "B",
        ancestors: ["A"],
        descendants: [],
        reachable_nodes: ["A"]
      },
      {
        id: "C",
        ancestors: [],
        descendants: ["D"],
        reachable_nodes: ["D"]
      },
      {
        id: "D",
        ancestors: ["C"],
        descendants: [],
        reachable_nodes: ["C"]
      }
    ]
  );

export default Template(
  // Basic functionality tests
  bfs_linear_test,
  bfs_tree_test,
  bfs_diamond_test,
  dfs_linear_test,
  dfs_tree_test,
  dfs_diamond_test,
  
  // Edge case tests
  bfs_empty_test,
  dfs_empty_test,
  bfs_single_node_test,
  dfs_single_node_test,
  bfs_self_loop_test,
  dfs_self_loop_test,
  bfs_disconnected_test,
  dfs_disconnected_test,
  bfs_cycle_test,
  dfs_cycle_test,
  bfs_duplicate_edges_test,
  dfs_duplicate_edges_test,
  bfs_large_branching_test,
  dfs_large_branching_test,
  
  // Enhanced traversal tests
  enhanced_bfs_test,
  enhanced_dfs_test,
  
  // Topological sort tests
  topo_sort_basic_test,
  topo_sort_multiple_roots_test,
  
  // Cycle detection tests
  cycle_detection_no_cycle_test,
  cycle_detection_simple_cycle_test,
  cycle_detection_self_loop_test,
  
  // Ancestor/descendant tests
  ancestor_descendant_basic_test,
  ancestor_descendant_complex_test,
  ancestor_descendant_disconnected_test
);