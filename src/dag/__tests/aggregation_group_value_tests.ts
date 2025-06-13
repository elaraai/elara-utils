import { UnitTestBuilder } from "@elaraai/core";
import { Template } from "@elaraai/core";
import { graph_group_value_rollup } from "../aggregation/group_value_rollup";

// === GROUP VALUE ROLLUP TESTS ===

// Basic group value rollup test
const group_value_basic_test = new UnitTestBuilder("group_value_basic")
  .procedure(graph_group_value_rollup)
  .test(
    {
      nodes: [
        { id: "A", value: new Map([["volume", 100.0], ["quality", 0.8], ["cost", 50.0]]) },
        { id: "B", value: new Map([["volume", 50.0], ["quality", 0.9], ["cost", 30.0]]) },
        { id: "C", value: new Map([["volume", 30.0], ["quality", 0.7], ["cost", 20.0]]) }
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "A", to: "C" }
      ]
    },
    [
      { 
        id: "A", 
        aggregated_values: new Map([["volume", 180.0], ["quality", 2.4], ["cost", 100.0]]), // Sum each key: volume=100+50+30, quality=0.8+0.9+0.7, cost=50+30+20
        contributing_nodes: ["A", "C", "B"]
      },
      { 
        id: "B", 
        aggregated_values: new Map([["volume", 50.0], ["quality", 0.9], ["cost", 30.0]]), // Just B's values
        contributing_nodes: ["B"]
      },
      { 
        id: "C", 
        aggregated_values: new Map([["volume", 30.0], ["quality", 0.7], ["cost", 20.0]]), // Just C's values
        contributing_nodes: ["C"]
      }
    ]
  );

// Complex group value rollup test
const group_value_complex_test = new UnitTestBuilder("group_value_complex")
  .procedure(graph_group_value_rollup)
  .test(
    {
      nodes: [
        { id: "A", value: new Map([["volume", 200.0], ["quality", 0.95], ["cost", 100.0]]) },
        { id: "B", value: new Map([["volume", 80.0], ["quality", 0.85], ["cost", 40.0]]) },
        { id: "C", value: new Map([["volume", 60.0], ["quality", 0.75], ["cost", 30.0]]) },
        { id: "D", value: new Map([["volume", 40.0], ["quality", 0.9], ["cost", 25.0]]) },
        { id: "E", value: new Map([["volume", 20.0], ["quality", 0.8], ["cost", 15.0]]) }
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
        aggregated_values: new Map([["volume", 400.0], ["quality", 4.25], ["cost", 210.0]]), // Sum all: volume=200+80+60+40+20, quality=0.95+0.85+0.75+0.9+0.8, cost=100+40+30+25+15
        contributing_nodes: ["A", "C", "E", "B", "D"]
      },
      { 
        id: "B", 
        aggregated_values: new Map([["volume", 120.0], ["quality", 1.75], ["cost", 65.0]]), // B+D: volume=80+40, quality=0.85+0.9, cost=40+25
        contributing_nodes: ["B", "D"]
      },
      { 
        id: "C", 
        aggregated_values: new Map([["volume", 80.0], ["quality", 1.55], ["cost", 45.0]]), // C+E: volume=60+20, quality=0.75+0.8, cost=30+15
        contributing_nodes: ["C", "E"]
      },
      { 
        id: "D", 
        aggregated_values: new Map([["volume", 40.0], ["quality", 0.9], ["cost", 25.0]]), // Just D
        contributing_nodes: ["D"]
      },
      { 
        id: "E", 
        aggregated_values: new Map([["volume", 20.0], ["quality", 0.8], ["cost", 15.0]]), // Just E
        contributing_nodes: ["E"]
      }
    ]
  );

export default Template(
  group_value_basic_test,
  group_value_complex_test
);