import { UnitTestBuilder } from "@elaraai/core";
import { Template } from "@elaraai/core";

import { graph_subgraphs_from_sources } from "../path_analysis/subgraphs_from_sources";

// ===== SUBGRAPH EXTRACTION FROM SOURCES TESTS =====

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

// Test 7: Multiple sources with branching paths - should create ONE subgraph with multiple sources
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
                    source_nodes: [
                        { id: "A", type: "source" },
                        { id: "B", type: "source" }
                    ],
                    target_nodes: [
                        { id: "E", type: "target" }
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

// Edge case: Multiple completely disconnected components with sources
const sources_multiple_disconnected_components_test = new UnitTestBuilder("sources_multiple_disconnected_components")
    .procedure(graph_subgraphs_from_sources)
    .test(
        {
            nodes: [
                { id: "A", type: "source" },
                { id: "B", type: "middle" },
                { id: "C", type: "target" },
                { id: "D", type: "source" },
                { id: "E", type: "middle" },
                { id: "F", type: "target" },
                { id: "G", type: "source" },
                { id: "H", type: "target" }
            ],
            edges: [
                // Component 1: A → B → C
                { from: "A", to: "B" },
                { from: "B", to: "C" },
                // Component 2: D → E → F  
                { from: "D", to: "E" },
                { from: "E", to: "F" },
                // Component 3: G → H
                { from: "G", to: "H" }
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
                },
                {
                    nodes: [
                        { id: "D", type: "source" },
                        { id: "E", type: "middle" },
                        { id: "F", type: "target" }
                    ],
                    edges: [
                        { from: "D", to: "E" },
                        { from: "E", to: "F" }
                    ],
                    source_nodes: [
                        { id: "D", type: "source" }
                    ],
                    target_nodes: [
                        { id: "F", type: "target" }
                    ]
                },
                {
                    nodes: [
                        { id: "G", type: "source" },
                        { id: "H", type: "target" }
                    ],
                    edges: [
                        { from: "G", to: "H" }
                    ],
                    source_nodes: [
                        { id: "G", type: "source" }
                    ],
                    target_nodes: [
                        { id: "H", type: "target" }
                    ]
                }
            ]
        }
    );

// Edge case: Mix of connected component (multiple sources) and isolated sources
const sources_mixed_connected_disconnected_test = new UnitTestBuilder("sources_mixed_connected_disconnected")
    .procedure(graph_subgraphs_from_sources)
    .test(
        {
            nodes: [
                { id: "A", type: "source" },
                { id: "B", type: "source" },
                { id: "C", type: "middle" },
                { id: "D", type: "middle" },
                { id: "E", type: "target" },
                { id: "F", type: "source" },  // Isolated
                { id: "G", type: "source" },  // Isolated
                { id: "H", type: "target" }   // Connected to G only
            ],
            edges: [
                // Connected component: A and B both reach E
                { from: "A", to: "C" },
                { from: "B", to: "D" },
                { from: "C", to: "E" },
                { from: "D", to: "E" },
                // Separate component: G → H
                { from: "G", to: "H" }
                // F is completely isolated (no edges)
            ],
            source_node_types: new Set(["source"]),
            target_node_types: new Set(["target"])
        },
        {
            subgraphs: [
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
                    source_nodes: [
                        { id: "A", type: "source" },
                        { id: "B", type: "source" }
                    ],
                    target_nodes: [
                        { id: "E", type: "target" }
                    ]
                },
                {
                    nodes: [
                        { id: "F", type: "source" }
                    ],
                    edges: [],
                    source_nodes: [
                        { id: "F", type: "source" }
                    ],
                    target_nodes: []
                },
                {
                    nodes: [
                        { id: "G", type: "source" },
                        { id: "H", type: "target" }
                    ],
                    edges: [
                        { from: "G", to: "H" }
                    ],
                    source_nodes: [
                        { id: "G", type: "source" }
                    ],
                    target_nodes: [
                        { id: "H", type: "target" }
                    ]
                }
            ]
        }
    );

// Edge case: Linear chain vs isolated sources
const sources_chain_vs_isolated_test = new UnitTestBuilder("sources_chain_vs_isolated")
    .procedure(graph_subgraphs_from_sources)
    .test(
        {
            nodes: [
                { id: "S1", type: "source" },
                { id: "M1", type: "middle" },
                { id: "M2", type: "middle" },
                { id: "M3", type: "middle" },
                { id: "T1", type: "target" },
                { id: "S2", type: "source" },  // Isolated
                { id: "S3", type: "source" },  // Isolated
                { id: "S4", type: "source" }   // Isolated
            ],
            edges: [
                // Long chain: S1 → M1 → M2 → M3 → T1
                { from: "S1", to: "M1" },
                { from: "M1", to: "M2" },
                { from: "M2", to: "M3" },
                { from: "M3", to: "T1" }
                // S2, S3, S4 have no edges (isolated)
            ],
            source_node_types: new Set(["source"]),
            target_node_types: new Set(["target"])
        },
        {
            subgraphs: [
                {
                    nodes: [
                        { id: "S1", type: "source" },
                        { id: "M1", type: "middle" },
                        { id: "M2", type: "middle" },
                        { id: "M3", type: "middle" },
                        { id: "T1", type: "target" }
                    ],
                    edges: [
                        { from: "S1", to: "M1" },
                        { from: "M1", to: "M2" },
                        { from: "M2", to: "M3" },
                        { from: "M3", to: "T1" }
                    ],
                    source_nodes: [
                        { id: "S1", type: "source" }
                    ],
                    target_nodes: [
                        { id: "T1", type: "target" }
                    ]
                },
                {
                    nodes: [
                        { id: "S2", type: "source" }
                    ],
                    edges: [],
                    source_nodes: [
                        { id: "S2", type: "source" }
                    ],
                    target_nodes: []
                },
                {
                    nodes: [
                        { id: "S3", type: "source" }
                    ],
                    edges: [],
                    source_nodes: [
                        { id: "S3", type: "source" }
                    ],
                    target_nodes: []
                },
                {
                    nodes: [
                        { id: "S4", type: "source" }
                    ],
                    edges: [],
                    source_nodes: [
                        { id: "S4", type: "source" }
                    ],
                    target_nodes: []
                }
            ]
        }
    );

// Edge case: Complex multiple components with different topologies
const sources_complex_multiple_components_test = new UnitTestBuilder("sources_complex_multiple_components")
    .procedure(graph_subgraphs_from_sources)
    .test(
        {
            nodes: [
                // Component 1: Diamond pattern with multiple sources
                { id: "S1", type: "source" },
                { id: "S2", type: "source" },
                { id: "M1", type: "middle" },
                { id: "M2", type: "middle" },
                { id: "T1", type: "target" },
                // Component 2: Star pattern
                { id: "S3", type: "source" },
                { id: "M3", type: "middle" },
                { id: "M4", type: "middle" },
                { id: "M5", type: "middle" },
                { id: "T2", type: "target" },
                // Component 3: Simple pair
                { id: "S4", type: "source" },
                { id: "T3", type: "target" }
            ],
            edges: [
                // Component 1: Diamond - both S1 and S2 reach T1 through different paths
                { from: "S1", to: "M1" },
                { from: "S2", to: "M2" },
                { from: "M1", to: "T1" },
                { from: "M2", to: "T1" },
                // Component 2: Star - S3 fans out to multiple paths that converge at T2
                { from: "S3", to: "M3" },
                { from: "S3", to: "M4" },
                { from: "S3", to: "M5" },
                { from: "M3", to: "T2" },
                { from: "M4", to: "T2" },
                { from: "M5", to: "T2" },
                // Component 3: Direct connection
                { from: "S4", to: "T3" }
            ],
            source_node_types: new Set(["source"]),
            target_node_types: new Set(["target"])
        },
        {
            subgraphs: [
                {
                    nodes: [
                        { id: "S1", type: "source" },
                        { id: "S2", type: "source" },
                        { id: "M1", type: "middle" },
                        { id: "M2", type: "middle" },
                        { id: "T1", type: "target" }
                    ],
                    edges: [
                        { from: "S1", to: "M1" },
                        { from: "S2", to: "M2" },
                        { from: "M1", to: "T1" },
                        { from: "M2", to: "T1" }
                    ],
                    source_nodes: [
                        { id: "S1", type: "source" },
                        { id: "S2", type: "source" }
                    ],
                    target_nodes: [
                        { id: "T1", type: "target" }
                    ]
                },
                {
                    nodes: [
                        { id: "S3", type: "source" },
                        { id: "M3", type: "middle" },
                        { id: "M4", type: "middle" },
                        { id: "M5", type: "middle" },
                        { id: "T2", type: "target" }
                    ],
                    edges: [
                        { from: "S3", to: "M3" },
                        { from: "S3", to: "M4" },
                        { from: "S3", to: "M5" },
                        { from: "M3", to: "T2" },
                        { from: "M4", to: "T2" },
                        { from: "M5", to: "T2" }
                    ],
                    source_nodes: [
                        { id: "S3", type: "source" }
                    ],
                    target_nodes: [
                        { id: "T2", type: "target" }
                    ]
                },
                {
                    nodes: [
                        { id: "S4", type: "source" },
                        { id: "T3", type: "target" }
                    ],
                    edges: [
                        { from: "S4", to: "T3" }
                    ],
                    source_nodes: [
                        { id: "S4", type: "source" }
                    ],
                    target_nodes: [
                        { id: "T3", type: "target" }
                    ]
                }
            ]
        }
    );

export default Template(
  sources_linear_test,
  sources_multiple_branches_test,
  sources_isolated_test,
  sources_empty_targets_test,
  sources_cycle_test,
  sources_multiple_disconnected_components_test,
  sources_mixed_connected_disconnected_test,
  sources_chain_vs_isolated_test,
  sources_complex_multiple_components_test
);