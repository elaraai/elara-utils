import { UnitTestBuilder } from "@elaraai/core";
import { Template } from "@elaraai/core";

import { graph_subgraphs } from "../paths/subgraph_extraction";

// ===== SUBGRAPH EXTRACTION FROM CONNECTED COMPONENTS TESTS =====

// Test 1: Simple disconnected components
const components_simple_test = new UnitTestBuilder("components_simple")
    .procedure(graph_subgraphs)
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
            filter_by_types: new Set([])
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

// Test 2: Connected component with branching
const components_connected_test = new UnitTestBuilder("components_connected")
    .procedure(graph_subgraphs)
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
            filter_by_types: new Set([])
        },
        {
            subgraphs: [
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
                    source_nodes: [
                        { id: "A", type: "source" }
                    ],
                    target_nodes: [
                        { id: "D", type: "target" },
                        { id: "E", type: "target" }
                    ]
                }
            ]
        }
    );

// Test 3: Isolated nodes (size-1 components)
const components_isolated_test = new UnitTestBuilder("components_isolated")
    .procedure(graph_subgraphs)
    .test(
        {
            nodes: [
                { id: "A", type: "isolated" },
                { id: "B", type: "connected" },
                { id: "C", type: "connected" },
                { id: "D", type: "isolated" }
            ],
            edges: [
                { from: "B", to: "C" }
            ],
            filter_by_types: new Set([])
        },
        {
            subgraphs: [
                {
                    nodes: [
                        { id: "A", type: "isolated" }
                    ],
                    edges: [],
                    source_nodes: [
                        { id: "A", type: "isolated" }
                    ],
                    target_nodes: [
                        { id: "A", type: "isolated" }
                    ]
                },
                {
                    nodes: [
                        { id: "B", type: "connected" },
                        { id: "C", type: "connected" }
                    ],
                    edges: [
                        { from: "B", to: "C" }
                    ],
                    source_nodes: [
                        { id: "B", type: "connected" }
                    ],
                    target_nodes: [
                        { id: "C", type: "connected" }
                    ]
                },
                {
                    nodes: [
                        { id: "D", type: "isolated" }
                    ],
                    edges: [],
                    source_nodes: [
                        { id: "D", type: "isolated" }
                    ],
                    target_nodes: [
                        { id: "D", type: "isolated" }
                    ]
                }
            ]
        }
    );

// Test 4: Complex mixed components
const components_mixed_test = new UnitTestBuilder("components_mixed")
    .procedure(graph_subgraphs)
    .test(
        {
            nodes: [
                { id: "A", type: "input" },
                { id: "B", type: "process" },
                { id: "C", type: "output" },
                { id: "D", type: "input" },
                { id: "E", type: "isolated" },
                { id: "F", type: "output" }
            ],
            edges: [
                { from: "A", to: "B" },
                { from: "B", to: "C" },
                { from: "D", to: "F" }
            ],
            filter_by_types: new Set([])
        },
        {
            subgraphs: [
                {
                    nodes: [
                        { id: "A", type: "input" },
                        { id: "B", type: "process" },
                        { id: "C", type: "output" }
                    ],
                    edges: [
                        { from: "A", to: "B" },
                        { from: "B", to: "C" }
                    ],
                    source_nodes: [
                        { id: "A", type: "input" }
                    ],
                    target_nodes: [
                        { id: "C", type: "output" }
                    ]
                },
                {
                    nodes: [
                        { id: "D", type: "input" },
                        { id: "F", type: "output" }
                    ],
                    edges: [
                        { from: "D", to: "F" }
                    ],
                    source_nodes: [
                        { id: "D", type: "input" }
                    ],
                    target_nodes: [
                        { id: "F", type: "output" }
                    ]
                },
                {
                    nodes: [
                        { id: "E", type: "isolated" }
                    ],
                    edges: [],
                    source_nodes: [
                        { id: "E", type: "isolated" }
                    ],
                    target_nodes: [
                        { id: "E", type: "isolated" }
                    ]
                }
            ]
        }
    );

// Test 5: Empty graph
const components_empty_test = new UnitTestBuilder("components_empty")
    .procedure(graph_subgraphs)
    .test(
        {
            nodes: [],
            edges: [],
            filter_by_types: new Set([])
        },
        {
            subgraphs: []
        }
    );

// Test 6: Single node
const components_single_node_test = new UnitTestBuilder("components_single_node")
    .procedure(graph_subgraphs)
    .test(
        {
            nodes: [
                { id: "A", type: "lonely" }
            ],
            edges: [],
            filter_by_types: new Set([])
        },
        {
            subgraphs: [
                {
                    nodes: [
                        { id: "A", type: "lonely" }
                    ],
                    edges: [],
                    source_nodes: [
                        { id: "A", type: "lonely" }
                    ],
                    target_nodes: [
                        { id: "A", type: "lonely" }
                    ]
                }
            ]
        }
    );

// Test 7: Node type filtering
const components_filter_test = new UnitTestBuilder("components_filter")
    .procedure(graph_subgraphs)
    .test(
        {
            nodes: [
                { id: "A", type: "input" },
                { id: "B", type: "process" },
                { id: "C", type: "output" },
                { id: "D", type: "other" },
                { id: "E", type: "process" }
            ],
            edges: [
                { from: "A", to: "B" },
                { from: "B", to: "C" },
                { from: "D", to: "E" }
            ],
            filter_by_types: new Set(["process"])
        },
        {
            subgraphs: [
                {
                    nodes: [
                        { id: "A", type: "input" },
                        { id: "B", type: "process" },
                        { id: "C", type: "output" }
                    ],
                    edges: [
                        { from: "A", to: "B" },
                        { from: "B", to: "C" }
                    ],
                    source_nodes: [
                        { id: "A", type: "input" }
                    ],
                    target_nodes: [
                        { id: "C", type: "output" }
                    ]
                },
                {
                    nodes: [
                        { id: "D", type: "other" },
                        { id: "E", type: "process" }
                    ],
                    edges: [
                        { from: "D", to: "E" }
                    ],
                    source_nodes: [
                        { id: "D", type: "other" }
                    ],
                    target_nodes: [
                        { id: "E", type: "process" }
                    ]
                }
            ]
        }
    );

// Test 8: Cycle handling
const components_cycle_test = new UnitTestBuilder("components_cycle")
    .procedure(graph_subgraphs)
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
                { from: "B", to: "C" },
                { from: "C", to: "B" }, // Cycle
                { from: "C", to: "D" }
            ],
            filter_by_types: new Set([])
        },
        {
            subgraphs: [
                {
                    nodes: [
                        { id: "A", type: "start" },
                        { id: "B", type: "middle" },
                        { id: "C", type: "middle" },
                        { id: "D", type: "end" }
                    ],
                    edges: [
                        { from: "A", to: "B" },
                        { from: "B", to: "C" },
                        { from: "C", to: "B" },
                        { from: "C", to: "D" }
                    ],
                    source_nodes: [
                        { id: "A", type: "start" }
                    ],
                    target_nodes: [
                        { id: "D", type: "end" }
                    ]
                }
            ]
        }
    );

export default Template(
  components_simple_test,
  components_connected_test,
  components_isolated_test,
  components_mixed_test,
  components_empty_test,
  components_single_node_test,
  components_filter_test,
  components_cycle_test
);