import { UnitTestBuilder } from "@elaraai/core";
import { Template } from "@elaraai/core";

import { 
    graph_all_paths, 
    graph_path_membership, 
    graph_shortest_path,
    graph_critical_path
} from "./path_analysis";

// === ALL PATHS TESTS ===

// Basic linear path test
const all_paths_linear_test = new UnitTestBuilder("all_paths_linear")
  .procedure(graph_all_paths)
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
      ],
      startId: "A",
      endId: "C"
    },
    {
      paths: [["A", "B", "C"]],
      path_count: 1n
    }
  );

// Multiple paths test
const all_paths_multiple_test = new UnitTestBuilder("all_paths_multiple")
  .procedure(graph_all_paths)
  .test(
    {
      nodes: [
        { id: "A", type: "start" },
        { id: "B", type: "path1" },
        { id: "C", type: "path2" },
        { id: "D", type: "end" }
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "A", to: "C" },
        { from: "B", to: "D" },
        { from: "C", to: "D" }
      ],
      startId: "A",
      endId: "D"
    },
    {
      paths: [["A", "C", "D"], ["A", "B", "D"]],
      path_count: 2n
    }
  );

// Complex graph with multiple paths
const all_paths_complex_test = new UnitTestBuilder("all_paths_complex")
  .procedure(graph_all_paths)
  .test(
    {
      nodes: [
        { id: "A", type: "start" },
        { id: "B", type: "node" },
        { id: "C", type: "node" },
        { id: "D", type: "node" },
        { id: "E", type: "end" }
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "A", to: "C" },
        { from: "B", to: "D" },
        { from: "C", to: "D" },
        { from: "B", to: "E" },
        { from: "D", to: "E" }
      ],
      startId: "A",
      endId: "E"
    },
    {
      paths: [["A", "C", "D", "E"], ["A", "B", "E"], ["A", "B", "D", "E"]],
      path_count: 3n
    }
  );

// No path exists test
const all_paths_no_path_test = new UnitTestBuilder("all_paths_no_path")
  .procedure(graph_all_paths)
  .test(
    {
      nodes: [
        { id: "A", type: "start" },
        { id: "B", type: "isolated" },
        { id: "C", type: "end" }
      ],
      edges: [
        { from: "A", to: "B" }
      ],
      startId: "A",
      endId: "C"
    },
    {
      paths: [],
      path_count: 0n
    }
  );

// === PATH MEMBERSHIP TESTS ===

// Basic path membership test
const path_membership_basic_test = new UnitTestBuilder("path_membership_basic")
  .procedure(graph_path_membership)
  .test(
    {
      nodes: [
        { id: "A", type: "start" },
        { id: "B", type: "path1" },
        { id: "C", type: "path2" },
        { id: "D", type: "end" }
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "A", to: "C" },
        { from: "B", to: "D" },
        { from: "C", to: "D" }
      ],
      startId: "A",
      endId: "D"
    },
    [
      { id: "A", path_membership: [0n, 1n] }, // In both paths
      { id: "B", path_membership: [1n] },     // Only in path 1 (A->B->D)
      { id: "C", path_membership: [0n] },     // Only in path 0 (A->C->D)
      { id: "D", path_membership: [0n, 1n] }  // In both paths
    ]
  );

// Complex path membership test
const path_membership_complex_test = new UnitTestBuilder("path_membership_complex")
  .procedure(graph_path_membership)
  .test(
    {
      nodes: [
        { id: "A", type: "start" },
        { id: "B", type: "node" },
        { id: "C", type: "node" },
        { id: "D", type: "node" },
        { id: "E", type: "end" }
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "A", to: "C" },
        { from: "B", to: "D" },
        { from: "C", to: "D" },
        { from: "B", to: "E" },
        { from: "D", to: "E" }
      ],
      startId: "A",
      endId: "E"
    },
    [
      { id: "A", path_membership: [0n, 1n, 2n] }, // In all 3 paths
      { id: "B", path_membership: [1n, 2n] },     // In paths A->B->E and A->B->D->E
      { id: "C", path_membership: [0n] },         // Only in A->C->D->E path
      { id: "D", path_membership: [0n, 2n] },     // In paths that go through D
      { id: "E", path_membership: [0n, 1n, 2n] }  // In all 3 paths
    ]
  );

// === SHORTEST PATH TESTS ===

// Basic shortest path test
const shortest_path_basic_test = new UnitTestBuilder("shortest_path_basic")
  .procedure(graph_shortest_path)
  .test(
    {
      nodes: [
        { id: "A", type: "start" },
        { id: "B", type: "middle" },
        { id: "C", type: "end" }
      ],
      edges: [
        { from: "A", to: "B", weight: 5.0, delay: null },
        { from: "B", to: "C", weight: 3.0, delay: null }
      ],
      startId: "A",
      endId: "C"
    },
    {
      shortest_path: ["A", "B", "C"],
      total_cost: 8.0
    }
  );

// Multiple paths with different costs
const shortest_path_multiple_test = new UnitTestBuilder("shortest_path_multiple")
  .procedure(graph_shortest_path)
  .test(
    {
      nodes: [
        { id: "A", type: "start" },
        { id: "B", type: "expensive" },
        { id: "C", type: "cheap" },
        { id: "D", type: "end" }
      ],
      edges: [
        { from: "A", to: "B", weight: 10.0, delay: null },
        { from: "A", to: "C", weight: 2.0, delay: null },
        { from: "B", to: "D", weight: 1.0, delay: null },
        { from: "C", to: "D", weight: 3.0, delay: null }
      ],
      startId: "A",
      endId: "D"
    },
    {
      shortest_path: ["A", "C", "D"],
      total_cost: 5.0
    }
  );

// Complex shortest path test
const shortest_path_complex_test = new UnitTestBuilder("shortest_path_complex")
  .procedure(graph_shortest_path)
  .test(
    {
      nodes: [
        { id: "A", type: "start" },
        { id: "B", type: "node" },
        { id: "C", type: "node" },
        { id: "D", type: "node" },
        { id: "E", type: "end" }
      ],
      edges: [
        { from: "A", to: "B", weight: 4.0, delay: null },
        { from: "A", to: "C", weight: 2.0, delay: null },
        { from: "B", to: "D", weight: 3.0, delay: null },
        { from: "C", to: "B", weight: 1.0, delay: null },
        { from: "C", to: "D", weight: 4.0, delay: null },
        { from: "D", to: "E", weight: 2.0, delay: null }
      ],
      startId: "A",
      endId: "E"
    },
    {
      shortest_path: ["A", "C", "D", "E"],
      total_cost: 8.0
    }
  );

// === CRITICAL PATH TESTS ===

// Basic critical path test
const critical_path_basic_test = new UnitTestBuilder("critical_path_basic")
  .procedure(graph_critical_path)
  .test(
    {
      nodes: [
        { id: "A", type: "task", start_time: new Date("2024-01-01T00:00:00Z"), end_time: new Date("2024-01-01T00:03:00Z") },
        { id: "B", type: "task", start_time: new Date("2024-01-01T00:03:00Z"), end_time: new Date("2024-01-01T00:05:00Z") },
        { id: "C", type: "task", start_time: new Date("2024-01-01T00:05:00Z"), end_time: new Date("2024-01-01T00:09:00Z") }
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "B", to: "C" }
      ]
    },
    {
      critical_path: ["A", "B", "C"],
      total_duration: 9.0
    }
  );

// Critical path with parallel tasks
const critical_path_parallel_test = new UnitTestBuilder("critical_path_parallel")
  .procedure(graph_critical_path)
  .test(
    {
      nodes: [
        { id: "A", type: "start", start_time: new Date("2024-01-01T00:00:00Z"), end_time: new Date("2024-01-01T00:02:00Z") },
        { id: "B", type: "long", start_time: new Date("2024-01-01T00:02:00Z"), end_time: new Date("2024-01-01T00:10:00Z") },
        { id: "C", type: "short", start_time: new Date("2024-01-01T00:02:00Z"), end_time: new Date("2024-01-01T00:05:00Z") },
        { id: "D", type: "end", start_time: new Date("2024-01-01T00:10:00Z"), end_time: new Date("2024-01-01T00:11:00Z") }
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "A", to: "C" },
        { from: "B", to: "D" },
        { from: "C", to: "D" }
      ]
    },
    {
      critical_path: ["A", "B", "D"], // Longest path
      total_duration: 11.0
    }
  );

// Complex critical path test
const critical_path_complex_test = new UnitTestBuilder("critical_path_complex")
  .procedure(graph_critical_path)
  .test(
    {
      nodes: [
        { id: "A", type: "task", start_time: new Date("2024-01-01T00:00:00Z"), end_time: new Date("2024-01-01T00:04:00Z") },
        { id: "B", type: "task", start_time: new Date("2024-01-01T00:04:00Z"), end_time: new Date("2024-01-01T00:10:00Z") },
        { id: "C", type: "task", start_time: new Date("2024-01-01T00:04:00Z"), end_time: new Date("2024-01-01T00:06:00Z") },
        { id: "D", type: "task", start_time: new Date("2024-01-01T00:10:00Z"), end_time: new Date("2024-01-01T00:13:00Z") },
        { id: "E", type: "task", start_time: new Date("2024-01-01T00:06:00Z"), end_time: new Date("2024-01-01T00:11:00Z") },
        { id: "F", type: "task", start_time: new Date("2024-01-01T00:13:00Z"), end_time: new Date("2024-01-01T00:14:00Z") }
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "A", to: "C" },
        { from: "B", to: "D" },
        { from: "C", to: "E" },
        { from: "D", to: "F" },
        { from: "E", to: "F" }
      ]
    },
    {
      critical_path: ["A", "B", "D", "F"], // A(4) + B(6) + D(3) + F(1) = 14
      total_duration: 14.0
    }
  );

// Edge case: single node critical path
const critical_path_single_test = new UnitTestBuilder("critical_path_single")
  .procedure(graph_critical_path)
  .test(
    {
      nodes: [
        { id: "A", type: "only", start_time: new Date("2024-01-01T00:00:00Z"), end_time: new Date("2024-01-01T00:05:00Z") }
      ],
      edges: []
    },
    {
      critical_path: ["A"],
      total_duration: 5.0
    }
  );

export default Template(
  // All paths tests
  all_paths_linear_test,
  all_paths_multiple_test,
  all_paths_complex_test,
  all_paths_no_path_test,
  
  // Path membership tests
  path_membership_basic_test,
  path_membership_complex_test,
  
  // Shortest path tests
  shortest_path_basic_test,
  shortest_path_multiple_test,
  shortest_path_complex_test,
  
  // Critical path tests
  critical_path_basic_test,
  critical_path_parallel_test,
  critical_path_complex_test,
  critical_path_single_test
);