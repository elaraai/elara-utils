import { UnitTestBuilder } from "@elaraai/core";
import { Template } from "@elaraai/core";

import { graph_subgraphs_from_targets } from "../path_analysis/subgraphs_from_targets";

// ===== SUBGRAPH EXTRACTION FROM TARGETS TESTS =====

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

// Test 6: Multiple targets with branching paths - connected component groups both targets
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
                        { id: "C", type: "middle" },
                        { id: "E", type: "target" },
                        { id: "B", type: "middle" },
                        { id: "D", type: "target" }
                    ],
                    edges: [
                        { from: "A", to: "B" },
                        { from: "A", to: "C" },
                        { from: "B", to: "D" },
                        { from: "C", to: "E" }
                    ],
                    source_nodes: [
                        { id: "A", type: "source" }
                    ],
                    target_nodes: [
                        { id: "E", type: "target" },
                        { id: "D", type: "target" }
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
                        { id: "C", type: "middle" },
                        { id: "D", type: "target" },
                        { id: "B", type: "middle" }
                    ],
                    edges: [
                        { from: "A", to: "B" },
                        { from: "A", to: "C" },
                        { from: "B", to: "D" },
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
                        { from: "A", to: "B" },
                        { from: "B", to: "B" },
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

export default Template(
  targets_linear_test,
  targets_multiple_branches_test,
  targets_isolated_test,
  targets_empty_sources_test,
  targets_cycle_test,
  disconnected_components_test,
  single_node_test,
  empty_graph_test,
  diamond_pattern_test,
  self_loop_test
);