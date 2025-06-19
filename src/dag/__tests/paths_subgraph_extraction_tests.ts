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
                { from: "A", to: "B", type: "flow" },
                { from: "C", to: "D", type: "flow" }
            ],
            node_types: [],
            edge_types: []
        },
        [
            {
                nodes: [
                    { id: "A", type: "source" },
                    { id: "B", type: "target" }
                ],
                edges: [
                    { from: "A", to: "B", type: "flow" }
                ],
                source_nodes: ["A"],
                target_nodes: ["B"],
                node_types: new Set(["source", "target"]),
                edge_types: new Set(["flow"])
            },
            {
                nodes: [
                    { id: "C", type: "source" },
                    { id: "D", type: "target" }
                ],
                edges: [
                    { from: "C", to: "D", type: "flow" }
                ],
                source_nodes: ["C"],
                target_nodes: ["D"],
                node_types: new Set(["source", "target"]),
                edge_types: new Set(["flow"])
            }
        ]
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
                { from: "A", to: "B", type: "process" },
                { from: "A", to: "C", type: "process" },
                { from: "B", to: "D", type: "transfer" },
                { from: "C", to: "E", type: "transfer" }
            ],
            node_types: [],
            edge_types: []
        },
        [
            {
                nodes: [
                    { id: "A", type: "source" },
                    { id: "C", type: "middle" },
                    { id: "E", type: "target" },
                    { id: "B", type: "middle" },
                    { id: "D", type: "target" }
                ],
                edges: [
                    { from: "A", to: "B", type: "process" },
                    { from: "A", to: "C", type: "process" },
                    { from: "C", to: "E", type: "transfer" },
                    { from: "B", to: "D", type: "transfer" }
                ],
                source_nodes: ["A"],
                target_nodes: ["E", "D"],
                node_types: new Set(["source", "middle", "target"]),
                edge_types: new Set(["process", "transfer"])
            }
        ]
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
                { from: "B", to: "C", type: "connection" }
            ],
            node_types: [],
            edge_types: []
        },
        [
            {
                nodes: [
                    { id: "A", type: "isolated" }
                ],
                edges: [],
                source_nodes: ["A"],
                target_nodes: ["A"],
                node_types: new Set(["isolated"]),
                edge_types: new Set([])
            },
            {
                nodes: [
                    { id: "B", type: "connected" },
                    { id: "C", type: "connected" }
                ],
                edges: [
                    { from: "B", to: "C", type: "connection" }
                ],
                source_nodes: ["B"],
                target_nodes: ["C"],
                node_types: new Set(["connected"]),
                edge_types: new Set(["connection"])
            },
            {
                nodes: [
                    { id: "D", type: "isolated" }
                ],
                edges: [],
                source_nodes: ["D"],
                target_nodes: ["D"],
                node_types: new Set(["isolated"]),
                edge_types: new Set([])
            }
        ]
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
                { from: "A", to: "B", type: "input" },
                { from: "B", to: "C", type: "output" },
                { from: "D", to: "F", type: "direct" }
            ],
            node_types: [],
            edge_types: []
        },
        [
            {
                nodes: [
                    { id: "A", type: "input" },
                    { id: "B", type: "process" },
                    { id: "C", type: "output" }
                ],
                edges: [
                    { from: "A", to: "B", type: "input" },
                    { from: "B", to: "C", type: "output" }
                ],
                source_nodes: ["A"],
                target_nodes: ["C"],
                node_types: new Set(["input", "process", "output"]),
                edge_types: new Set(["input", "output"])
            },
            {
                nodes: [
                    { id: "D", type: "input" },
                    { id: "F", type: "output" }
                ],
                edges: [
                    { from: "D", to: "F", type: "direct" }
                ],
                source_nodes: ["D"],
                target_nodes: ["F"],
                node_types: new Set(["input", "output"]),
                edge_types: new Set(["direct"])
            },
            {
                nodes: [
                    { id: "E", type: "isolated" }
                ],
                edges: [],
                source_nodes: ["E"],
                target_nodes: ["E"],
                node_types: new Set(["isolated"]),
                edge_types: new Set([])
            }
        ]
    );

// Test 5: Empty graph
const components_empty_test = new UnitTestBuilder("components_empty")
    .procedure(graph_subgraphs)
    .test(
        {
            nodes: [],
            edges: [],
            node_types: [],
            edge_types: []
        },
        []
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
            node_types: [],
            edge_types: []
        },
        [
            {
                nodes: [
                    { id: "A", type: "lonely" }
                ],
                edges: [],
                source_nodes: ["A"],
                target_nodes: ["A"],
                node_types: new Set(["lonely"]),
                edge_types: new Set([])
            }
        ]
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
                { from: "A", to: "B", type: "input" },
                { from: "B", to: "C", type: "output" },
                { from: "D", to: "E", type: "processing" }
            ],
            node_types: [new Set(["process"])],
            edge_types: []
        },
        [
            {
                nodes: [
                    { id: "A", type: "input" },
                    { id: "B", type: "process" },
                    { id: "C", type: "output" }
                ],
                edges: [
                    { from: "A", to: "B", type: "input" },
                    { from: "B", to: "C", type: "output" }
                ],
                source_nodes: ["A"],
                target_nodes: ["C"],
                node_types: new Set(["input", "process", "output"]),
                edge_types: new Set(["input", "output"])
            },
            {
                nodes: [
                    { id: "D", type: "other" },
                    { id: "E", type: "process" }
                ],
                edges: [
                    { from: "D", to: "E", type: "processing" }
                ],
                source_nodes: ["D"],
                target_nodes: ["E"],
                node_types: new Set(["other", "process"]),
                edge_types: new Set(["processing"])
            }
        ]
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
                { from: "A", to: "B", type: "start" },
                { from: "B", to: "C", type: "forward" },
                { from: "C", to: "B", type: "feedback" }, // Cycle
                { from: "C", to: "D", type: "finish" }
            ],
            node_types: [],
            edge_types: []
        },
        [
            {
                nodes: [
                    { id: "A", type: "start" },
                    { id: "B", type: "middle" },
                    { id: "C", type: "middle" },
                    { id: "D", type: "end" }
                ],
                edges: [
                    { from: "A", to: "B", type: "start" },
                    { from: "B", to: "C", type: "forward" },
                    { from: "C", to: "B", type: "feedback" },
                    { from: "C", to: "D", type: "finish" }
                ],
                source_nodes: ["A"],
                target_nodes: ["D"],
                node_types: new Set(["start", "middle", "end"]),
                edge_types: new Set(["start", "forward", "feedback", "finish"])
            }
        ]
    );

// ===== ADVANCED FILTERING TESTS =====

// Test 9: Edge type filtering
const components_edge_filter_test = new UnitTestBuilder("components_edge_filter")
    .procedure(graph_subgraphs)
    .test(
        {
            nodes: [
                { id: "A", type: "input" },
                { id: "B", type: "process" },
                { id: "C", type: "output" },
                { id: "D", type: "input" },
                { id: "E", type: "process" }
            ],
            edges: [
                { from: "A", to: "B", type: "data" },
                { from: "B", to: "C", type: "control" },
                { from: "D", to: "E", type: "signal" }
            ],
            node_types: [],
            edge_types: [new Set(["data", "control"])]
        },
        [
            {
                nodes: [
                    { id: "A", type: "input" },
                    { id: "B", type: "process" },
                    { id: "C", type: "output" }
                ],
                edges: [
                    { from: "A", to: "B", type: "data" },
                    { from: "B", to: "C", type: "control" }
                ],
                source_nodes: ["A"],
                target_nodes: ["C"],
                node_types: new Set(["input", "process", "output"]),
                edge_types: new Set(["data", "control"])
            }
        ]
    );

// Test 10: Multiple node type sets filtering
const components_multiple_node_types_test = new UnitTestBuilder("components_multiple_node_types")
    .procedure(graph_subgraphs)
    .test(
        {
            nodes: [
                { id: "A", type: "input" },
                { id: "B", type: "process" },
                { id: "C", type: "output" },
                { id: "D", type: "monitor" },
                { id: "E", type: "control" },
                { id: "F", type: "isolated" }
            ],
            edges: [
                { from: "A", to: "B", type: "flow" },
                { from: "B", to: "C", type: "flow" },
                { from: "D", to: "E", type: "flow" },
                // F is isolated
            ],
            node_types: [
                new Set(["input", "process", "output"]), // First component matches this
                new Set(["monitor", "control"])          // Second component matches this
            ],
            edge_types: []
        },
        [
            {
                nodes: [
                    { id: "A", type: "input" },
                    { id: "B", type: "process" },
                    { id: "C", type: "output" }
                ],
                edges: [
                    { from: "A", to: "B", type: "flow" },
                    { from: "B", to: "C", type: "flow" }
                ],
                source_nodes: ["A"],
                target_nodes: ["C"],
                node_types: new Set(["input", "process", "output"]),
                edge_types: new Set(["flow"])
            },
            {
                nodes: [
                    { id: "D", type: "monitor" },
                    { id: "E", type: "control" }
                ],
                edges: [
                    { from: "D", to: "E", type: "flow" }
                ],
                source_nodes: ["D"],
                target_nodes: ["E"],
                node_types: new Set(["monitor", "control"]),
                edge_types: new Set(["flow"])
            }
        ]
    );

// Test 11: Multiple edge type sets filtering
const components_multiple_edge_types_test = new UnitTestBuilder("components_multiple_edge_types")
    .procedure(graph_subgraphs)
    .test(
        {
            nodes: [
                { id: "A", type: "node" },
                { id: "B", type: "node" },
                { id: "C", type: "node" },
                { id: "D", type: "node" },
                { id: "E", type: "node" },
                { id: "F", type: "node" }
            ],
            edges: [
                { from: "A", to: "B", type: "data" },
                { from: "B", to: "C", type: "control" },
                { from: "D", to: "E", type: "signal" },
                { from: "E", to: "F", type: "feedback" }
            ],
            node_types: [],
            edge_types: [
                new Set(["data", "control"]),    // First component matches this
                new Set(["signal", "feedback"])  // Second component matches this
            ]
        },
        [
            {
                nodes: [
                    { id: "A", type: "node" },
                    { id: "B", type: "node" },
                    { id: "C", type: "node" }
                ],
                edges: [
                    { from: "A", to: "B", type: "data" },
                    { from: "B", to: "C", type: "control" }
                ],
                source_nodes: ["A"],
                target_nodes: ["C"],
                node_types: new Set(["node"]),
                edge_types: new Set(["data", "control"])
            },
            {
                nodes: [
                    { id: "D", type: "node" },
                    { id: "E", type: "node" },
                    { id: "F", type: "node" }
                ],
                edges: [
                    { from: "D", to: "E", type: "signal" },
                    { from: "E", to: "F", type: "feedback" }
                ],
                source_nodes: ["D"],
                target_nodes: ["F"],
                node_types: new Set(["node"]),
                edge_types: new Set(["signal", "feedback"])
            }
        ]
    );

// Test 12: Combined node and edge type filtering
const components_combined_filtering_test = new UnitTestBuilder("components_combined_filtering")
    .procedure(graph_subgraphs)
    .test(
        {
            nodes: [
                { id: "A", type: "input" },
                { id: "B", type: "process" },
                { id: "C", type: "output" },
                { id: "D", type: "input" },
                { id: "E", type: "process" },
                { id: "F", type: "monitor" },
                { id: "G", type: "control" }
            ],
            edges: [
                // Component 1: has input+process+output nodes AND data+control edges
                { from: "A", to: "B", type: "data" },
                { from: "B", to: "C", type: "control" },
                // Component 2: has input+process nodes but only signal edges (fails edge filter)
                { from: "D", to: "E", type: "signal" },
                // Component 3: has monitor+control nodes and data edges (fails node filter)
                { from: "F", to: "G", type: "data" }
            ],
            node_types: [new Set(["input", "process", "output"])],
            edge_types: [new Set(["data", "control"])]
        },
        [
            {
                nodes: [
                    { id: "A", type: "input" },
                    { id: "B", type: "process" },
                    { id: "C", type: "output" }
                ],
                edges: [
                    { from: "A", to: "B", type: "data" },
                    { from: "B", to: "C", type: "control" }
                ],
                source_nodes: ["A"],
                target_nodes: ["C"],
                node_types: new Set(["input", "process", "output"]),
                edge_types: new Set(["data", "control"])
            }
        ]
    );

// Test 13: Strict filtering - no components match
const components_no_match_test = new UnitTestBuilder("components_no_match")
    .procedure(graph_subgraphs)
    .test(
        {
            nodes: [
                { id: "A", type: "input" },
                { id: "B", type: "process" },
                { id: "C", type: "output" }
            ],
            edges: [
                { from: "A", to: "B", type: "data" },
                { from: "B", to: "C", type: "control" }
            ],
            node_types: [new Set(["missing", "types"])],
            edge_types: [new Set(["nonexistent", "edges"])]
        },
        []
    );

// Test 14: Partial match - node types match but edge types don't
const components_partial_match_test = new UnitTestBuilder("components_partial_match")
    .procedure(graph_subgraphs)
    .test(
        {
            nodes: [
                { id: "A", type: "input" },
                { id: "B", type: "process" },
                { id: "C", type: "output" }
            ],
            edges: [
                { from: "A", to: "B", type: "data" },
                { from: "B", to: "C", type: "control" }
            ],
            node_types: [new Set(["input", "process"])], // Matches (subset of component)
            edge_types: [new Set(["missing", "edge"])]   // Doesn't match
        },
        []
    );

// ===== EDGE CASE TESTS FOR INFINITE LOOP SCENARIOS =====

// Test 15: Self-loops - nodes that reference themselves
const components_self_loops_test = new UnitTestBuilder("components_self_loops")
    .procedure(graph_subgraphs)
    .test(
        {
            nodes: [
                { id: "A", type: "self_ref" },
                { id: "B", type: "normal" },
                { id: "C", type: "self_ref" }
            ],
            edges: [
                { from: "A", to: "A", type: "self_loop" },  // Self-loop
                { from: "B", to: "C", type: "normal" },
                { from: "C", to: "C", type: "self_loop" }   // Another self-loop
            ],
            node_types: [],
            edge_types: []
        },
        [
            {
                nodes: [
                    { id: "A", type: "self_ref" }
                ],
                edges: [
                    { from: "A", to: "A", type: "self_loop" }
                ],
                source_nodes: [],  // Self-loop means no pure source
                target_nodes: [],  // Self-loop means no pure target
                node_types: new Set(["self_ref"]),
                edge_types: new Set(["self_loop"])
            },
            {
                nodes: [
                    { id: "B", type: "normal" },
                    { id: "C", type: "self_ref" }
                ],
                edges: [
                    { from: "B", to: "C", type: "normal" },
                    { from: "C", to: "C", type: "self_loop" }
                ],
                source_nodes: ["B"],
                target_nodes: [],  // C has self-loop so not a pure target
                node_types: new Set(["normal", "self_ref"]),
                edge_types: new Set(["normal", "self_loop"])
            }
        ]
    );

// Test 16: Duplicate edges - same edge defined multiple times
const components_duplicate_edges_test = new UnitTestBuilder("components_duplicate_edges")
    .procedure(graph_subgraphs)
    .test(
        {
            nodes: [
                { id: "A", type: "start" },
                { id: "B", type: "end" }
            ],
            edges: [
                { from: "A", to: "B", type: "flow" },
                { from: "A", to: "B", type: "flow" },  // Exact duplicate
                { from: "A", to: "B", type: "control" }  // Same nodes, different type
            ],
            node_types: [],
            edge_types: []
        },
        [
            {
                nodes: [
                    { id: "A", type: "start" },
                    { id: "B", type: "end" }
                ],
                edges: [
                    { from: "A", to: "B", type: "flow" },
                    { from: "A", to: "B", type: "flow" },
                    { from: "A", to: "B", type: "control" }
                ],
                source_nodes: ["A"],
                target_nodes: ["B"],
                node_types: new Set(["start", "end"]),
                edge_types: new Set(["flow", "control"])
            }
        ]
    );

// Test 17: Bidirectional edges - edges that go both ways
const components_bidirectional_test = new UnitTestBuilder("components_bidirectional")
    .procedure(graph_subgraphs)
    .test(
        {
            nodes: [
                { id: "A", type: "peer" },
                { id: "B", type: "peer" }
            ],
            edges: [
                { from: "A", to: "B", type: "forward" },
                { from: "B", to: "A", type: "backward" }  // Creates cycle
            ],
            node_types: [],
            edge_types: []
        },
        [
            {
                nodes: [
                    { id: "A", type: "peer" },
                    { id: "B", type: "peer" }
                ],
                edges: [
                    { from: "A", to: "B", type: "forward" },
                    { from: "B", to: "A", type: "backward" }
                ],
                source_nodes: [],  // Both nodes have incoming edges
                target_nodes: [],  // Both nodes have outgoing edges
                node_types: new Set(["peer"]),
                edge_types: new Set(["forward", "backward"])
            }
        ]
    );

// Test 18: Dangling edge references - edges referencing non-existent nodes
const components_dangling_edges_test = new UnitTestBuilder("components_dangling_edges")
    .procedure(graph_subgraphs)
    .test(
        {
            nodes: [
                { id: "A", type: "real" },
                { id: "B", type: "real" }
            ],
            edges: [
                { from: "A", to: "B", type: "valid" },
                { from: "A", to: "MISSING", type: "dangling" },  // Points to non-existent node
                { from: "GHOST", to: "B", type: "dangling" }     // From non-existent node
            ],
            node_types: [],
            edge_types: []
        },
        [
            {
                nodes: [
                    { id: "A", type: "real" },
                    { id: "B", type: "real" }
                ],
                edges: [
                    { from: "A", to: "B", type: "valid" }
                    // Dangling edges are correctly filtered out - they reference non-existent nodes
                ],
                source_nodes: ["A"],
                target_nodes: ["B"],
                node_types: new Set(["real"]),
                edge_types: new Set(["valid"])  // Only valid edge types remain
            }
        ]
    );

// Test 19: Duplicate node IDs - multiple nodes with same ID
const components_duplicate_nodes_test = new UnitTestBuilder("components_duplicate_nodes")
    .procedure(graph_subgraphs)
    .test(
        {
            nodes: [
                { id: "A", type: "first" },
                { id: "A", type: "duplicate" },  // Same ID, different type
                { id: "B", type: "normal" }
            ],
            edges: [
                { from: "A", to: "B", type: "edge" }
            ],
            node_types: [],
            edge_types: []
        },
        [
            {
                nodes: [
                    { id: "A", type: "duplicate" },  // Only last node with ID "A" is kept in lookup
                    { id: "B", type: "normal" }
                ],
                edges: [
                    { from: "A", to: "B", type: "edge" }
                ],
                source_nodes: ["A"],  // Only one entry since lookup deduplicates
                target_nodes: ["B"],
                node_types: new Set(["duplicate", "normal"]),  // Only types from kept nodes
                edge_types: new Set(["edge"])
            }
        ]
    );

// Test 20: Very large connected component - stress test
const components_large_component_test = new UnitTestBuilder("components_large_component")
    .procedure(graph_subgraphs)
    .test(
        {
            nodes: [
                { id: "N0", type: "node" },
                { id: "N1", type: "node" },
                { id: "N2", type: "node" },
                { id: "N3", type: "node" },
                { id: "N4", type: "node" },
                { id: "N5", type: "node" },
                { id: "N6", type: "node" },
                { id: "N7", type: "node" },
                { id: "N8", type: "node" },
                { id: "N9", type: "node" }
            ],
            edges: [
                // Create a chain: N0 -> N1 -> N2 -> ... -> N9
                { from: "N0", to: "N1", type: "chain" },
                { from: "N1", to: "N2", type: "chain" },
                { from: "N2", to: "N3", type: "chain" },
                { from: "N3", to: "N4", type: "chain" },
                { from: "N4", to: "N5", type: "chain" },
                { from: "N5", to: "N6", type: "chain" },
                { from: "N6", to: "N7", type: "chain" },
                { from: "N7", to: "N8", type: "chain" },
                { from: "N8", to: "N9", type: "chain" },
                // Add some cross-connections to make it more complex
                { from: "N0", to: "N5", type: "skip" },
                { from: "N2", to: "N7", type: "skip" },
                { from: "N4", to: "N9", type: "skip" }
            ],
            node_types: [],
            edge_types: []
        },
        [
            {
                nodes: [
                    { id: "N0", type: "node" },
                    { id: "N5", type: "node" },
                    { id: "N4", type: "node" },
                    { id: "N3", type: "node" },
                    { id: "N2", type: "node" },
                    { id: "N1", type: "node" },
                    { id: "N7", type: "node" },
                    { id: "N6", type: "node" },
                    { id: "N8", type: "node" },
                    { id: "N9", type: "node" }
                ],
                edges: [
                    { from: "N0", to: "N1", type: "chain" },
                    { from: "N0", to: "N5", type: "skip" },
                    { from: "N5", to: "N6", type: "chain" },
                    { from: "N4", to: "N5", type: "chain" },
                    { from: "N4", to: "N9", type: "skip" },
                    { from: "N3", to: "N4", type: "chain" },
                    { from: "N2", to: "N3", type: "chain" },
                    { from: "N2", to: "N7", type: "skip" },
                    { from: "N1", to: "N2", type: "chain" },
                    { from: "N7", to: "N8", type: "chain" },
                    { from: "N6", to: "N7", type: "chain" },
                    { from: "N8", to: "N9", type: "chain" }
                ],
                source_nodes: ["N0"],
                target_nodes: ["N9"],
                node_types: new Set(["node"]),
                edge_types: new Set(["chain", "skip"])
            }
        ]
    );

export default Template(
  components_simple_test,
  components_connected_test,
  components_isolated_test,
  components_mixed_test,
  components_empty_test,
  components_single_node_test,
  components_filter_test,
  components_cycle_test,
  components_edge_filter_test,
  components_multiple_node_types_test,
  components_multiple_edge_types_test,
  components_combined_filtering_test,
  components_no_match_test,
  components_partial_match_test,
  components_self_loops_test,
  components_duplicate_edges_test,
  components_bidirectional_test,
  components_dangling_edges_test,
  components_duplicate_nodes_test,
  components_large_component_test
);