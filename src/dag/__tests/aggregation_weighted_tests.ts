import { UnitTestBuilder } from "@elaraai/core";
import { Template } from "@elaraai/core";
import { graph_weighted_aggregation } from "../aggregation/weighted_aggregation";

// === WEIGHTED AGGREGATION TESTS ===

// Basic weighted aggregation test
const weighted_basic_test = new UnitTestBuilder("weighted_basic")
  .procedure(graph_weighted_aggregation)
  .test(
    {
      nodes: [
        { id: "A", value: 10.0, weight: 2.0 },
        { id: "B", value: 5.0, weight: 1.0 },
        { id: "C", value: 8.0, weight: 3.0 }
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "A", to: "C" }
      ]
    },
    [
      { 
        id: "A", 
        weighted_sum: 49.0, // (10*2) + (5*1) + (8*3) = 20 + 5 + 24
        weighted_average: 8.166666666666666, // 49 / (2+1+3) = 49/6 ≈ 8.17
        total_weight: 6.0 
      },
      { 
        id: "B", 
        weighted_sum: 5.0, // 5*1
        weighted_average: 5.0, // 5/1
        total_weight: 1.0 
      },
      { 
        id: "C", 
        weighted_sum: 24.0, // 8*3
        weighted_average: 8.0, // 24/3
        total_weight: 3.0 
      }
    ]
  );

// Weighted aggregation with nulls (default weights)
const weighted_nulls_test = new UnitTestBuilder("weighted_nulls")
  .procedure(graph_weighted_aggregation)
  .test(
    {
      nodes: [
        { id: "A", value: 6.0, weight: null }, // Default weight = 1.0
        { id: "B", value: 4.0, weight: 2.0 }
      ],
      edges: [
        { from: "A", to: "B" }
      ]
    },
    [
      { 
        id: "A", 
        weighted_sum: 14.0, // (6*1) + (4*2) = 6 + 8
        weighted_average: 4.666666666666667, // 14 / (1+2) = 14/3 ≈ 4.67
        total_weight: 3.0 
      },
      { 
        id: "B", 
        weighted_sum: 8.0, // 4*2
        weighted_average: 4.0, // 8/2
        total_weight: 2.0 
      }
    ]
  );

// Edge case: disconnected nodes
const disconnected_aggregation_test = new UnitTestBuilder("disconnected_aggregation")
  .procedure(graph_weighted_aggregation)
  .test(
    {
      nodes: [
        { id: "A", value: 10.0, weight: 1.0 },
        { id: "B", value: 20.0, weight: 2.0 },
        { id: "C", value: 30.0, weight: 3.0 }
      ],
      edges: []
    },
    [
      { 
        id: "A", 
        weighted_sum: 10.0,
        weighted_average: 10.0,
        total_weight: 1.0 
      },
      { 
        id: "B", 
        weighted_sum: 40.0,
        weighted_average: 20.0,
        total_weight: 2.0 
      },
      { 
        id: "C", 
        weighted_sum: 90.0,
        weighted_average: 30.0,
        total_weight: 3.0 
      }
    ]
  );

export default Template(
  weighted_basic_test,
  weighted_nulls_test,
  disconnected_aggregation_test
);