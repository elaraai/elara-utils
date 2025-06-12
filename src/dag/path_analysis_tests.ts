import { UnitTestBuilder } from "@elaraai/core";
import { Template } from "@elaraai/core";

import { 
    graph_all_paths, 
    graph_path_membership, 
    graph_shortest_path,
    graph_critical_path,
    graph_subgraphs_from_targets,
    graph_subgraphs_from_sources
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

// ===== SUBGRAPH EXTRACTION TESTS =====

// Test 1: Basic target extraction - simple linear chain
const targets_linear_test = new UnitTestBuilder("targets_linear")
    .procedure(graph_subgraphs_from_targets)
    .test(
        {
            nodes: [
                { id: "A", type: "source" },
                { id: "B", type: "middle" },
                { id: "C", type: "target" }
            ],
            edges: [
                { from: "A", to: "B" },
                { from: "B", to: "C" }
            ],
            source_node_types: new Set(["source"]),
            target_node_types: new Set(["target"])
        },
        {
            subgraphs: [
                {
                    nodes: [
                        { id: "A", type: "source" },
                        { id: "B", type: "middle" },
                        { id: "C", type: "target" }
                    ],
                    edges: [
                        { from: "B", to: "C" },
                        { from: "A", to: "B" }
                    ],
                    source_nodes: [
                        { id: "A", type: "source" }
                    ],
                    target_nodes: [
                        { id: "C", type: "target" }
                    ]
                }
            ]
        }
    );

// Test 2: Basic source extraction
const sources_linear_test = new UnitTestBuilder("sources_linear")
    .procedure(graph_subgraphs_from_sources)
    .test(
        {
            nodes: [
                { id: "A", type: "source" },
                { id: "B", type: "middle" },
                { id: "C", type: "target" }
            ],
            edges: [
                { from: "A", to: "B" },
                { from: "B", to: "C" }
            ],
            source_node_types: new Set(["source"]),
            target_node_types: new Set(["target"])
        },
        {
            subgraphs: [
                {
                    nodes: [
                        { id: "A", type: "source" },
                        { id: "B", type: "middle" },
                        { id: "C", type: "target" }
                    ],
                    edges: [
                        { from: "A", to: "B" },
                        { from: "B", to: "C" }
                    ],
                    source_nodes: [
                        { id: "A", type: "source" }
                    ],
                    target_nodes: [
                        { id: "C", type: "target" }
                    ]
                }
            ]
        }
    );

// Test 6: Multiple targets with branching paths (for targets algorithm)
const targets_multiple_branches_test = new UnitTestBuilder("targets_multiple_branches")
    .procedure(graph_subgraphs_from_targets)
    .test(
        {
            nodes: [
                { id: "A", type: "source" },
                { id: "B", type: "middle" },
                { id: "C", type: "middle" },
                { id: "D", type: "target" },
                { id: "E", type: "target" }
            ],
            edges: [
                { from: "A", to: "B" },
                { from: "A", to: "C" },
                { from: "B", to: "D" },
                { from: "C", to: "E" }
            ],
            source_node_types: new Set(["source"]),
            target_node_types: new Set(["target"])
        },
        {
            subgraphs: [
                {
                    nodes: [
                        { id: "A", type: "source" },
                        { id: "B", type: "middle" },
                        { id: "D", type: "target" }
                    ],
                    edges: [
                        { from: "B", to: "D" },
                        { from: "A", to: "B" }
                    ],
                    source_nodes: [
                        { id: "A", type: "source" }
                    ],
                    target_nodes: [
                        { id: "D", type: "target" }
                    ]
                },
                {
                    nodes: [
                        { id: "A", type: "source" },
                        { id: "C", type: "middle" },
                        { id: "E", type: "target" }
                    ],
                    edges: [
                        { from: "C", to: "E" },
                        { from: "A", to: "C" }
                    ],
                    source_nodes: [
                        { id: "A", type: "source" }
                    ],
                    target_nodes: [
                        { id: "E", type: "target" }
                    ]
                }
            ]
        }
    );

// Test 7: Multiple sources with branching paths (for sources algorithm)
const sources_multiple_branches_test = new UnitTestBuilder("sources_multiple_branches")
    .procedure(graph_subgraphs_from_sources)
    .test(
        {
            nodes: [
                { id: "A", type: "source" },
                { id: "B", type: "source" },
                { id: "C", type: "middle" },
                { id: "D", type: "middle" },
                { id: "E", type: "target" }
            ],
            edges: [
                { from: "A", to: "C" },
                { from: "B", to: "D" },
                { from: "C", to: "E" },
                { from: "D", to: "E" }
            ],
            source_node_types: new Set(["source"]),
            target_node_types: new Set(["target"])
        },
        {
            subgraphs: [
                {
                    nodes: [
                        { id: "A", type: "source" },
                        { id: "C", type: "middle" },
                        { id: "E", type: "target" }
                    ],
                    edges: [
                        { from: "A", to: "C" },
                        { from: "C", to: "E" }
                    ],
                    source_nodes: [
                        { id: "A", type: "source" }
                    ],
                    target_nodes: [
                        { id: "E", type: "target" }
                    ]
                },
                {
                    nodes: [
                        { id: "B", type: "source" },
                        { id: "D", type: "middle" },
                        { id: "E", type: "target" }
                    ],
                    edges: [
                        { from: "B", to: "D" },
                        { from: "D", to: "E" }
                    ],
                    source_nodes: [
                        { id: "B", type: "source" }
                    ],
                    target_nodes: [
                        { id: "E", type: "target" }
                    ]
                }
            ]
        }
    );

// Test 8: Isolated target node (no incoming edges)
const targets_isolated_test = new UnitTestBuilder("targets_isolated")
    .procedure(graph_subgraphs_from_targets)
    .test(
        {
            nodes: [
                { id: "A", type: "source" },
                { id: "B", type: "target" },
                { id: "C", type: "target" }
            ],
            edges: [
                { from: "A", to: "B" }
            ],
            source_node_types: new Set(["source"]),
            target_node_types: new Set(["target"])
        },
        {
            subgraphs: [
                {
                    nodes: [
                        { id: "A", type: "source" },
                        { id: "B", type: "target" }
                    ],
                    edges: [
                        { from: "A", to: "B" }
                    ],
                    source_nodes: [
                        { id: "A", type: "source" }
                    ],
                    target_nodes: [
                        { id: "B", type: "target" }
                    ]
                },
                {
                    nodes: [
                        { id: "C", type: "target" }
                    ],
                    edges: [],
                    source_nodes: [],
                    target_nodes: [
                        { id: "C", type: "target" }
                    ]
                }
            ]
        }
    );

// Test 9: Isolated source node (no outgoing edges)
const sources_isolated_test = new UnitTestBuilder("sources_isolated")
    .procedure(graph_subgraphs_from_sources)
    .test(
        {
            nodes: [
                { id: "A", type: "source" },
                { id: "B", type: "source" },
                { id: "C", type: "target" }
            ],
            edges: [
                { from: "A", to: "C" }
            ],
            source_node_types: new Set(["source"]),
            target_node_types: new Set(["target"])
        },
        {
            subgraphs: [
                {
                    nodes: [
                        { id: "A", type: "source" },
                        { id: "C", type: "target" }
                    ],
                    edges: [
                        { from: "A", to: "C" }
                    ],
                    source_nodes: [
                        { id: "A", type: "source" }
                    ],
                    target_nodes: [
                        { id: "C", type: "target" }
                    ]
                },
                {
                    nodes: [
                        { id: "B", type: "source" }
                    ],
                    edges: [],
                    source_nodes: [
                        { id: "B", type: "source" }
                    ],
                    target_nodes: []
                }
            ]
        }
    );

// Test 10: Empty source_node_types (nodes with no incoming edges become sources)
const targets_empty_sources_test = new UnitTestBuilder("targets_empty_sources")
    .procedure(graph_subgraphs_from_targets)
    .test(
        {
            nodes: [
                { id: "A", type: "node" },
                { id: "B", type: "node" },
                { id: "C", type: "target" }
            ],
            edges: [
                { from: "B", to: "C" }
            ],
            source_node_types: new Set([]),
            target_node_types: new Set(["target"])
        },
        {
            subgraphs: [
                {
                    nodes: [
                        { id: "B", type: "node" },
                        { id: "C", type: "target" }
                    ],
                    edges: [
                        { from: "B", to: "C" }
                    ],
                    source_nodes: [
                        { id: "B", type: "node" }
                    ],
                    target_nodes: [
                        { id: "C", type: "target" }
                    ]
                }
            ]
        }
    );

// Test 11: Empty target_node_types (nodes with no outgoing edges become targets)
const sources_empty_targets_test = new UnitTestBuilder("sources_empty_targets")
    .procedure(graph_subgraphs_from_sources)
    .test(
        {
            nodes: [
                { id: "A", type: "source" },
                { id: "B", type: "node" },
                { id: "C", type: "node" }
            ],
            edges: [
                { from: "A", to: "B" }
            ],
            source_node_types: new Set(["source"]),
            target_node_types: new Set([])
        },
        {
            subgraphs: [
                {
                    nodes: [
                        { id: "A", type: "source" },
                        { id: "B", type: "node" }
                    ],
                    edges: [
                        { from: "A", to: "B" }
                    ],
                    source_nodes: [
                        { id: "A", type: "source" }
                    ],
                    target_nodes: [
                        { id: "B", type: "node" }
                    ]
                }
            ]
        }
    );

// Test 12: Cycle handling in backward traversal
const targets_cycle_test = new UnitTestBuilder("targets_cycle")
    .procedure(graph_subgraphs_from_targets)
    .test(
        {
            nodes: [
                { id: "A", type: "source" },
                { id: "B", type: "middle" },
                { id: "C", type: "middle" },
                { id: "D", type: "target" }
            ],
            edges: [
                { from: "A", to: "B" },
                { from: "B", to: "C" },
                { from: "C", to: "B" },
                { from: "C", to: "D" }
            ],
            source_node_types: new Set(["source"]),
            target_node_types: new Set(["target"])
        },
        {
            subgraphs: [
                {
                    nodes: [
                        { id: "A", type: "source" },
                        { id: "B", type: "middle" },
                        { id: "C", type: "middle" },
                        { id: "D", type: "target" }
                    ],
                    edges: [
                        { from: "C", to: "D" },
                        { from: "B", to: "C" },
                        { from: "A", to: "B" },
                        { from: "C", to: "B" }
                    ],
                    source_nodes: [
                        { id: "A", type: "source" }
                    ],
                    target_nodes: [
                        { id: "D", type: "target" }
                    ]
                }
            ]
        }
    );

// Test 13: Cycle handling in forward traversal
const sources_cycle_test = new UnitTestBuilder("sources_cycle")
    .procedure(graph_subgraphs_from_sources)
    .test(
        {
            nodes: [
                { id: "A", type: "source" },
                { id: "B", type: "middle" },
                { id: "C", type: "middle" },
                { id: "D", type: "target" }
            ],
            edges: [
                { from: "A", to: "B" },
                { from: "B", to: "C" },
                { from: "C", to: "B" },
                { from: "C", to: "D" }
            ],
            source_node_types: new Set(["source"]),
            target_node_types: new Set(["target"])
        },
        {
            subgraphs: [
                {
                    nodes: [
                        { id: "A", type: "source" },
                        { id: "B", type: "middle" },
                        { id: "C", type: "middle" },
                        { id: "D", type: "target" }
                    ],
                    edges: [
                        { from: "A", to: "B" },
                        { from: "B", to: "C" },
                        { from: "C", to: "B" },
                        { from: "C", to: "D" }
                    ],
                    source_nodes: [
                        { id: "A", type: "source" }
                    ],
                    target_nodes: [
                        { id: "D", type: "target" }
                    ]
                }
            ]
        }
    );

// Test 14: Disconnected components
const disconnected_components_test = new UnitTestBuilder("disconnected_components")
    .procedure(graph_subgraphs_from_targets)
    .test(
        {
            nodes: [
                { id: "A", type: "source" },
                { id: "B", type: "target" },
                { id: "C", type: "source" },
                { id: "D", type: "target" }
            ],
            edges: [
                { from: "A", to: "B" },
                { from: "C", to: "D" }
            ],
            source_node_types: new Set(["source"]),
            target_node_types: new Set(["target"])
        },
        {
            subgraphs: [
                {
                    nodes: [
                        { id: "A", type: "source" },
                        { id: "B", type: "target" }
                    ],
                    edges: [
                        { from: "A", to: "B" }
                    ],
                    source_nodes: [
                        { id: "A", type: "source" }
                    ],
                    target_nodes: [
                        { id: "B", type: "target" }
                    ]
                },
                {
                    nodes: [
                        { id: "C", type: "source" },
                        { id: "D", type: "target" }
                    ],
                    edges: [
                        { from: "C", to: "D" }
                    ],
                    source_nodes: [
                        { id: "C", type: "source" }
                    ],
                    target_nodes: [
                        { id: "D", type: "target" }
                    ]
                }
            ]
        }
    );

// Test 15: Single node graph (both source and target)
const single_node_test = new UnitTestBuilder("single_node")
    .procedure(graph_subgraphs_from_targets)
    .test(
        {
            nodes: [
                { id: "A", type: "both" }
            ],
            edges: [],
            source_node_types: new Set(["both"]),
            target_node_types: new Set(["both"])
        },
        {
            subgraphs: [
                {
                    nodes: [
                        { id: "A", type: "both" }
                    ],
                    edges: [],
                    source_nodes: [
                        { id: "A", type: "both" }
                    ],
                    target_nodes: [
                        { id: "A", type: "both" }
                    ]
                }
            ]
        }
    );

// Test 16: Empty graph
const empty_graph_test = new UnitTestBuilder("empty_graph")
    .procedure(graph_subgraphs_from_targets)
    .test(
        {
            nodes: [],
            edges: [],
            source_node_types: new Set(["source"]),
            target_node_types: new Set(["target"])
        },
        {
            subgraphs: []
        }
    );

// Test 17: Complex diamond with multiple paths to same target
const diamond_pattern_test = new UnitTestBuilder("diamond_pattern")
    .procedure(graph_subgraphs_from_targets)
    .test(
        {
            nodes: [
                { id: "A", type: "source" },
                { id: "B", type: "middle" },
                { id: "C", type: "middle" },
                { id: "D", type: "target" }
            ],
            edges: [
                { from: "A", to: "B" },
                { from: "A", to: "C" },
                { from: "B", to: "D" },
                { from: "C", to: "D" }
            ],
            source_node_types: new Set(["source"]),
            target_node_types: new Set(["target"])
        },
        {
            subgraphs: [
                {
                    nodes: [
                        { id: "A", type: "source" },
                        { id: "B", type: "middle" },
                        { id: "C", type: "middle" },
                        { id: "D", type: "target" }
                    ],
                    edges: [
                        { from: "B", to: "D" },
                        { from: "C", to: "D" },
                        { from: "A", to: "C" },
                        { from: "A", to: "B" }
                    ],
                    source_nodes: [
                        { id: "A", type: "source" }
                    ],
                    target_nodes: [
                        { id: "D", type: "target" }
                    ]
                }
            ]
        }
    );

// Test 18: Self-loop edge case
const self_loop_test = new UnitTestBuilder("self_loop")
    .procedure(graph_subgraphs_from_targets)
    .test(
        {
            nodes: [
                { id: "A", type: "source" },
                { id: "B", type: "middle" },
                { id: "C", type: "target" }
            ],
            edges: [
                { from: "A", to: "B" },
                { from: "B", to: "B" },
                { from: "B", to: "C" }
            ],
            source_node_types: new Set(["source"]),
            target_node_types: new Set(["target"])
        },
        {
            subgraphs: [
                {
                    nodes: [
                        { id: "A", type: "source" },
                        { id: "B", type: "middle" },
                        { id: "C", type: "target" }
                    ],
                    edges: [
                        { from: "B", to: "C" },
                        { from: "A", to: "B" },
                        { from: "B", to: "B" }
                    ],
                    source_nodes: [
                        { id: "A", type: "source" }
                    ],
                    target_nodes: [
                        { id: "C", type: "target" }
                    ]
                }
            ]
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
  critical_path_single_test,
  
  // Subgraph extraction tests - basic
  targets_linear_test,
  sources_linear_test,
  
  // Subgraph extraction tests - comprehensive edge cases
  targets_multiple_branches_test,
  sources_multiple_branches_test,
  targets_isolated_test,
  sources_isolated_test,
  targets_empty_sources_test,
  sources_empty_targets_test,
  targets_cycle_test,
  sources_cycle_test,
  disconnected_components_test,
  single_node_test,
  empty_graph_test,
  diamond_pattern_test,
  self_loop_test
);