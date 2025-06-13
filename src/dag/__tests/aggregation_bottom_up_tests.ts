import { UnitTestBuilder } from "@elaraai/core";
import { Template } from "@elaraai/core";
import { graph_bottom_up_aggregation } from "../aggregation/bottom_up_aggregation";

// === BOTTOM-UP AGGREGATION TESTS ===

// Basic bottom-up aggregation test
const bottom_up_basic_test = new UnitTestBuilder("bottom_up_basic")
  .procedure(graph_bottom_up_aggregation)
  .test(
    {
      nodes: [
        { id: "A", value: 10.0, weight: null },
        { id: "B", value: 5.0, weight: null },
        { id: "C", value: 3.0, weight: null }
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "A", to: "C" }
      ]
    },
    [
      { 
        id: "A", 
        aggregated_value: 18.0, // 10 + 5 + 3
        contributing_nodes: ["A", "B", "C"] 
      },
      { 
        id: "B", 
        aggregated_value: 5.0, 
        contributing_nodes: ["B"] 
      },
      { 
        id: "C", 
        aggregated_value: 3.0, 
        contributing_nodes: ["C"] 
      }
    ]
  );

// Multi-level bottom-up aggregation test
const bottom_up_multilevel_test = new UnitTestBuilder("bottom_up_multilevel")
  .procedure(graph_bottom_up_aggregation)
  .test(
    {
      nodes: [
        { id: "A", value: 1.0, weight: null },
        { id: "B", value: 2.0, weight: null },
        { id: "C", value: 3.0, weight: null },
        { id: "D", value: 4.0, weight: null },
        { id: "E", value: 5.0, weight: null }
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "A", to: "C" },
        { from: "B", to: "D" },
        { from: "C", to: "E" }
      ]
    },
    [
      { 
        id: "A", 
        aggregated_value: 15.0, // 1 + (2 + 4) + (3 + 5)
        contributing_nodes: ["A", "B", "D", "C", "E"] 
      },
      { 
        id: "B", 
        aggregated_value: 6.0, // 2 + 4
        contributing_nodes: ["B", "D"] 
      },
      { 
        id: "C", 
        aggregated_value: 8.0, // 3 + 5
        contributing_nodes: ["C", "E"] 
      },
      { 
        id: "D", 
        aggregated_value: 4.0, 
        contributing_nodes: ["D"] 
      },
      { 
        id: "E", 
        aggregated_value: 5.0, 
        contributing_nodes: ["E"] 
      }
    ]
  );

// Edge case: single node tests
const single_node_aggregation_test = new UnitTestBuilder("single_node_aggregation")
  .procedure(graph_bottom_up_aggregation)
  .test(
    {
      nodes: [
        { id: "A", value: 42.0, weight: null }
      ],
      edges: []
    },
    [
      { 
        id: "A", 
        aggregated_value: 42.0,
        contributing_nodes: ["A"] 
      }
    ]
  );

export default Template(
  bottom_up_basic_test,
  bottom_up_multilevel_test,
  single_node_aggregation_test
);