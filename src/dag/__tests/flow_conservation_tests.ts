import { UnitTestBuilder } from "@elaraai/core";
import { Template } from "@elaraai/core";
import { graph_flow_conservation } from "../flow/flow_conservation";

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

export default Template(
  flow_conservation_balanced_test,
  flow_conservation_violation_test,
  flow_conservation_losses_test
);