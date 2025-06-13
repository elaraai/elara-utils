import { UnitTestBuilder } from "@elaraai/core";
import { Template } from "@elaraai/core";
import { graph_connected_components } from "../flow_conservation/connected_components";

// Single connected component
const connected_components_single_test = new UnitTestBuilder("connected_components_single")
  .procedure(graph_connected_components)
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
      component_assignments: [
        { node_id: "A", component_id: "comp_0" },
        { node_id: "B", component_id: "comp_0" },
        { node_id: "C", component_id: "comp_0" }
      ],
      component_info: [
        { 
          component_id: "comp_0", 
          size: 3n, 
          nodes: ["A", "B", "C"] 
        }
      ]
    }
  );

// Multiple disconnected components
const connected_components_multiple_test = new UnitTestBuilder("connected_components_multiple")
  .procedure(graph_connected_components)
  .test(
    {
      nodes: [
        { id: "A", type: "comp1" },
        { id: "B", type: "comp1" },
        { id: "C", type: "comp2" },
        { id: "D", type: "comp2" },
        { id: "E", type: "isolated" }
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "C", to: "D" }
        // E is isolated
      ]
    },
    {
      component_assignments: [
        { node_id: "A", component_id: "comp_0" },
        { node_id: "B", component_id: "comp_0" },
        { node_id: "C", component_id: "comp_1" },
        { node_id: "D", component_id: "comp_1" },
        { node_id: "E", component_id: "comp_2" }
      ],
      component_info: [
        { component_id: "comp_0", size: 2n, nodes: ["A", "B"] },
        { component_id: "comp_1", size: 2n, nodes: ["C", "D"] },
        { component_id: "comp_2", size: 1n, nodes: ["E"] }
      ]
    }
  );

// Complex connected components with cycles
const connected_components_cycles_test = new UnitTestBuilder("connected_components_cycles")
  .procedure(graph_connected_components)
  .test(
    {
      nodes: [
        { id: "A", type: "cycle" },
        { id: "B", type: "cycle" },
        { id: "C", type: "cycle" },
        { id: "D", type: "separate" }
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "B", to: "C" },
        { from: "C", to: "A" }, // Cycle
        // D is isolated
      ]
    },
    {
      component_assignments: [
        { node_id: "A", component_id: "comp_0" },
        { node_id: "C", component_id: "comp_0" },
        { node_id: "B", component_id: "comp_0" },
        { node_id: "D", component_id: "comp_1" }
      ],
      component_info: [
        { component_id: "comp_0", size: 3n, nodes: ["A", "C", "B"] },
        { component_id: "comp_1", size: 1n, nodes: ["D"] }
      ]
    }
  );

// Edge case: all isolated nodes
const connected_components_isolated_test = new UnitTestBuilder("connected_components_isolated")
  .procedure(graph_connected_components)
  .test(
    {
      nodes: [
        { id: "A", type: "isolated" },
        { id: "B", type: "isolated" },
        { id: "C", type: "isolated" }
      ],
      edges: []
    },
    {
      component_assignments: [
        { node_id: "A", component_id: "comp_0" },
        { node_id: "B", component_id: "comp_1" },
        { node_id: "C", component_id: "comp_2" }
      ],
      component_info: [
        { component_id: "comp_0", size: 1n, nodes: ["A"] },
        { component_id: "comp_1", size: 1n, nodes: ["B"] },
        { component_id: "comp_2", size: 1n, nodes: ["C"] }
      ]
    }
  );

// Edge case: empty graph
const connected_components_empty_test = new UnitTestBuilder("connected_components_empty")
  .procedure(graph_connected_components)
  .test(
    {
      nodes: [],
      edges: []
    },
    {
      component_assignments: [],
      component_info: []
    }
  );

export default Template(
  connected_components_single_test,
  connected_components_multiple_test,
  connected_components_cycles_test,
  connected_components_isolated_test,
  connected_components_empty_test
);