import { UnitTestBuilder } from "@elaraai/core";
import { Template } from "@elaraai/core";

import { 
    graph_flow_conservation,
    graph_dynamic_reachability,
    graph_connected_components
} from "./flow_conservation";

// === FLOW CONSERVATION TESTS ===

// Basic flow conservation test - balanced
const flow_conservation_balanced_test = new UnitTestBuilder("flow_conservation_balanced")
  .procedure(graph_flow_conservation)
  .test(
    {
      nodes: [
        { id: "A", value: 8.0, capacity: 200.0 },   // Initial: 8 to balance total losses
        { id: "B", value: 0.0, capacity: 150.0 },
        { id: "C", value: 0.0, capacity: 100.0 }
      ],
      edges: [
        { from: "A", to: "B", weight: 60.0, loss_percentage: 10.0 }, // 54 arrives at B, 6 lost  
        { from: "A", to: "C", weight: 40.0, loss_percentage: 5.0 },  // 38 arrives at C, 2 lost
        { from: "B", to: "A", weight: 54.0, loss_percentage: 0.0 },  // 54 returns to A from B
        { from: "C", to: "A", weight: 38.0, loss_percentage: 0.0 }   // 38 returns to A from C
      ]
    },
    {
      is_conserved: true,
      violations: [] // All nodes have balanced inflow/outflow
    }
  );

// Flow conservation test - violation
const flow_conservation_violation_test = new UnitTestBuilder("flow_conservation_violation")
  .procedure(graph_flow_conservation)
  .test(
    {
      nodes: [
        { id: "A", value: 100.0, capacity: 200.0 },
        { id: "B", value: 0.0, capacity: 150.0 },
        { id: "C", value: 50.0, capacity: 100.0 } // Extra value that violates conservation
      ],
      edges: [
        { from: "A", to: "B", weight: 50.0, loss_percentage: 0.0 },
        { from: "A", to: "C", weight: 50.0, loss_percentage: 0.0 }
      ]
    },
    {
      is_conserved: false,
      violations: ["B", "C"] // B and C accumulate flow without outflow
    }
  );

// Flow conservation with losses
const flow_conservation_losses_test = new UnitTestBuilder("flow_conservation_losses")
  .procedure(graph_flow_conservation)
  .test(
    {
      nodes: [
        { id: "Source", value: 100.0, capacity: 150.0 },
        { id: "Middle", value: 0.0, capacity: 100.0 },
        { id: "Sink", value: 0.0, capacity: 100.0 }
      ],
      edges: [
        { from: "Source", to: "Middle", weight: 100.0, loss_percentage: 20.0 }, // 80 arrives
        { from: "Middle", to: "Sink", weight: 80.0, loss_percentage: 10.0 }      // 72 arrives
      ]
    },
    {
      is_conserved: false,
      violations: ["Sink"] // Sink accumulates 72 units without outflow
    }
  );

// === DYNAMIC REACHABILITY TESTS ===

// Basic dynamic reachability test
const dynamic_reachability_basic_test = new UnitTestBuilder("dynamic_reachability_basic")
  .procedure(graph_dynamic_reachability)
  .test(
    {
      nodes: [
        { id: "A", type: "source" },
        { id: "B", type: "middle" },
        { id: "C", type: "sink" },
        { id: "D", type: "isolated" }
      ],
      edges: [
        { from: "A", to: "B", active: true },
        { from: "B", to: "C", active: true },
        { from: "A", to: "D", active: false } // Inactive edge
      ]
    },
    {
      ancestor_map: [
        { node: "A", ancestors: [] },
        { node: "B", ancestors: ["A"] },
        { node: "C", ancestors: ["B", "A"] },
        { node: "D", ancestors: [] } // No ancestors due to inactive edge
      ],
      descendant_map: [
        { node: "A", descendants: ["B", "C"] },
        { node: "B", descendants: ["C"] },
        { node: "C", descendants: [] },
        { node: "D", descendants: [] }
      ]
    }
  );

// Dynamic reachability with mixed active/inactive edges
const dynamic_reachability_mixed_test = new UnitTestBuilder("dynamic_reachability_mixed")
  .procedure(graph_dynamic_reachability)
  .test(
    {
      nodes: [
        { id: "A", type: "root" },
        { id: "B", type: "branch1" },
        { id: "C", type: "branch2" },
        { id: "D", type: "merge" }
      ],
      edges: [
        { from: "A", to: "B", active: true },
        { from: "A", to: "C", active: false }, // Inactive path
        { from: "B", to: "D", active: true },
        { from: "C", to: "D", active: true }
      ]
    },
    {
      ancestor_map: [
        { node: "A", ancestors: [] },
        { node: "B", ancestors: ["A"] },
        { node: "C", ancestors: [] }, // No ancestors due to inactive A->C
        { node: "D", ancestors: ["C", "B", "A"] } // C and B are direct ancestors, A is reachable via active path D←B←A
      ],
      descendant_map: [
        { node: "A", descendants: ["B", "D"] }, // Can't reach C due to inactive edge
        { node: "B", descendants: ["D"] },
        { node: "C", descendants: ["D"] }, // Can still reach D
        { node: "D", descendants: [] }
      ]
    }
  );

// === CONNECTED COMPONENTS TESTS ===

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
        { node_id: "A", component_id: "comp_" },
        { node_id: "B", component_id: "comp_" },
        { node_id: "C", component_id: "comp_" }
      ],
      component_info: [
        { 
          component_id: "comp_", 
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
        { node_id: "A", component_id: "comp_" },
        { node_id: "B", component_id: "comp_" },
        { node_id: "C", component_id: "comp_" },
        { node_id: "D", component_id: "comp_" },
        { node_id: "E", component_id: "comp_" }
      ],
      component_info: [
        { component_id: "comp_", size: 2n, nodes: ["A", "B"] },
        { component_id: "comp_", size: 2n, nodes: ["C", "D"] },
        { component_id: "comp_", size: 1n, nodes: ["E"] }
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
        { node_id: "A", component_id: "comp_" },
        { node_id: "C", component_id: "comp_" },
        { node_id: "B", component_id: "comp_" },
        { node_id: "D", component_id: "comp_" }
      ],
      component_info: [
        { component_id: "comp_", size: 3n, nodes: ["A", "C", "B"] },
        { component_id: "comp_", size: 1n, nodes: ["D"] }
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
        { node_id: "A", component_id: "comp_" },
        { node_id: "B", component_id: "comp_" },
        { node_id: "C", component_id: "comp_" }
      ],
      component_info: [
        { component_id: "comp_", size: 1n, nodes: ["A"] },
        { component_id: "comp_", size: 1n, nodes: ["B"] },
        { component_id: "comp_", size: 1n, nodes: ["C"] }
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
  // Flow conservation tests
  flow_conservation_balanced_test,
  flow_conservation_violation_test,
  flow_conservation_losses_test,
  
  // Dynamic reachability tests
  dynamic_reachability_basic_test,
  dynamic_reachability_mixed_test,
  
  // Connected components tests
  connected_components_single_test,
  connected_components_multiple_test,
  connected_components_cycles_test,
  connected_components_isolated_test,
  connected_components_empty_test
);