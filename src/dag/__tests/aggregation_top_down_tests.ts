import { UnitTestBuilder } from "@elaraai/core";
import { Template } from "@elaraai/core";
import { graph_top_down_aggregation } from "../aggregation/top_down";

// === TOP-DOWN AGGREGATION TESTS ===

// Basic top-down aggregation test
const top_down_basic_test = new UnitTestBuilder("top_down_basic")
  .procedure(graph_top_down_aggregation)
  .test(
    {
      nodes: [
        { id: "A", value: 10.0, weight: null },
        { id: "B", value: 2.0, weight: null },
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
        aggregated_value: 10.0, // Own value
        contributing_nodes: ["A"] 
      },
      { 
        id: "B", 
        aggregated_value: 7.0, // 2 + 10/2 (half of A's value)
        contributing_nodes: ["B", "A"] 
      },
      { 
        id: "C", 
        aggregated_value: 8.0, // 3 + 10/2 (half of A's value)
        contributing_nodes: ["C", "A"] 
      }
    ]
  );

// Multi-level top-down aggregation test
const top_down_multilevel_test = new UnitTestBuilder("top_down_multilevel")
  .procedure(graph_top_down_aggregation)
  .test(
    {
      nodes: [
        { id: "A", value: 12.0, weight: null },
        { id: "B", value: 2.0, weight: null },
        { id: "C", value: 3.0, weight: null },
        { id: "D", value: 1.0, weight: null }
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "A", to: "C" },
        { from: "B", to: "D" }
      ]
    },
    [
      { 
        id: "A", 
        aggregated_value: 12.0,
        contributing_nodes: ["A"] 
      },
      { 
        id: "B", 
        aggregated_value: 8.0, // 2 + 12/2 = 8
        contributing_nodes: ["B", "A"] 
      },
      { 
        id: "C", 
        aggregated_value: 9.0, // 3 + 12/2 = 9
        contributing_nodes: ["C", "A"] 
      },
      { 
        id: "D", 
        aggregated_value: 9.0, // 1 + 8 (full B value)
        contributing_nodes: ["D", "B", "A"] 
      }
    ]
  );

export default Template(
  top_down_basic_test,
  top_down_multilevel_test
);