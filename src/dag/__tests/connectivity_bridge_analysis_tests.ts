import { UnitTestBuilder } from "@elaraai/core";
import { Template } from "@elaraai/core";
import { graph_bridge_analysis } from "../connectivity/bridge_analysis";

// Test 1: No bridge nodes - fully connected graph
const bridge_analysis_none_test = new UnitTestBuilder("bridge_analysis_none")
  .procedure(graph_bridge_analysis)
  .test(
    {
      nodes: [
        { id: "A", type: "node" },
        { id: "B", type: "node" },
        { id: "C", type: "node" }
      ],
      edges: [
        { from: "A", to: "B", type: "flow" },
        { from: "B", to: "C", type: "flow" },
        { from: "C", to: "A", type: "flow" } // Creates cycle, no bridges
      ]
    },
    [] // No bridge nodes
  );

// Test 2: Single bridge node connecting two components
const bridge_analysis_single_test = new UnitTestBuilder("bridge_analysis_single")
  .procedure(graph_bridge_analysis)
  .test(
    {
      nodes: [
        { id: "A", type: "left" },
        { id: "B", type: "bridge" },
        { id: "C", type: "right" }
      ],
      edges: [
        { from: "A", to: "B", type: "connection" },
        { from: "B", to: "C", type: "connection" }
      ]
    },
    [
      { node_id: "B", component_increase: 1n, criticality_score: 0.3333333333333333 }
    ]
  );

// Test 3: Multiple bridge nodes
const bridge_analysis_multiple_test = new UnitTestBuilder("bridge_analysis_multiple")
  .procedure(graph_bridge_analysis)
  .test(
    {
      nodes: [
        { id: "A", type: "node" },
        { id: "B", type: "bridge1" },
        { id: "C", type: "bridge2" },
        { id: "D", type: "node" },
        { id: "E", type: "node" }
      ],
      edges: [
        { from: "A", to: "B", type: "process" },
        { from: "B", to: "C", type: "process" },
        { from: "C", to: "D", type: "process" },
        { from: "D", to: "E", type: "process" }
      ]
    },
    [
      { node_id: "B", component_increase: 1n, criticality_score: 0.2 },
      { node_id: "C", component_increase: 1n, criticality_score: 0.2 },
      { node_id: "D", component_increase: 1n, criticality_score: 0.2 }
    ]
  );

// Test 4: Isolated nodes - no edges
const bridge_analysis_isolated_test = new UnitTestBuilder("bridge_analysis_isolated")
  .procedure(graph_bridge_analysis)
  .test(
    {
      nodes: [
        { id: "A", type: "isolated" },
        { id: "B", type: "isolated" },
        { id: "C", type: "isolated" }
      ],
      edges: []
    },
    [] // No bridge nodes when there are no edges
  );

// Test 5: Complex network with some bridges
const bridge_analysis_complex_test = new UnitTestBuilder("bridge_analysis_complex")
  .procedure(graph_bridge_analysis)
  .test(
    {
      nodes: [
        { id: "A", type: "cluster1" },
        { id: "B", type: "cluster1" },
        { id: "C", type: "bridge" },
        { id: "D", type: "cluster2" },
        { id: "E", type: "cluster2" },
        { id: "F", type: "isolated" }
      ],
      edges: [
        // Cluster 1
        { from: "A", to: "B", type: "transfer" },
        { from: "B", to: "A", type: "transfer" },
        // Bridge connection
        { from: "B", to: "C", type: "bridge" },
        { from: "C", to: "D", type: "bridge" },
        // Cluster 2
        { from: "D", to: "E", type: "transfer" },
        { from: "E", to: "D", type: "transfer" }
        // F is isolated
      ]
    },
    [
      { node_id: "B", component_increase: 1n, criticality_score: 0.16666666666666666 },
      { node_id: "C", component_increase: 1n, criticality_score: 0.16666666666666666 },
      { node_id: "D", component_increase: 1n, criticality_score: 0.16666666666666666 }
    ]
  );

export default Template(
  bridge_analysis_none_test,
  bridge_analysis_single_test,
  bridge_analysis_multiple_test,
  bridge_analysis_isolated_test,
  bridge_analysis_complex_test
);