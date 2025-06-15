import { UnitTestBuilder } from "@elaraai/core";
import { Template } from "@elaraai/core";
import { graph_temporal_top_down_aggregation } from "../aggregation/temporal_top_down";

// Basic top-down temporal aggregation test
const temporal_top_down_basic_test = new UnitTestBuilder("temporal_top_down_basic")
  .procedure(graph_temporal_top_down_aggregation)
  .test(
    {
      nodes: [
        { id: "A", type: "root", start_time: new Date("2024-01-01T09:00:00Z"), end_time: new Date("2024-01-01T09:10:00Z") },
        { id: "B", type: "leaf", start_time: new Date("2024-01-01T10:00:00Z"), end_time: new Date("2024-01-01T10:20:00Z") },
        { id: "C", type: "leaf", start_time: new Date("2024-01-01T11:00:00Z"), end_time: new Date("2024-01-01T11:30:00Z") }
      ],
      edges: [
        { from: "A", to: "B", type: "flow" },
        { from: "A", to: "C", type: "process" }
      ]
    },
    [
      { id: "A", total_duration: 10.0, contributing_nodes: ["A"] }, // Just A (root)
      { id: "B", total_duration: 30.0, contributing_nodes: ["B", "A"] }, // B + A
      { id: "C", total_duration: 40.0, contributing_nodes: ["C", "A"] }  // C + A
    ]
  );

// Multi-level top-down aggregation test
const temporal_top_down_multilevel_test = new UnitTestBuilder("temporal_top_down_multilevel")
  .procedure(graph_temporal_top_down_aggregation)
  .test(
    {
      nodes: [
        { id: "A", type: "root", start_time: new Date("2024-01-01T09:00:00Z"), end_time: new Date("2024-01-01T09:05:00Z") },
        { id: "B", type: "middle", start_time: new Date("2024-01-01T10:00:00Z"), end_time: new Date("2024-01-01T10:10:00Z") },
        { id: "C", type: "middle", start_time: new Date("2024-01-01T11:00:00Z"), end_time: new Date("2024-01-01T11:15:00Z") },
        { id: "D", type: "leaf", start_time: new Date("2024-01-01T12:00:00Z"), end_time: new Date("2024-01-01T12:20:00Z") },
        { id: "E", type: "leaf", start_time: new Date("2024-01-01T13:00:00Z"), end_time: new Date("2024-01-01T13:25:00Z") }
      ],
      edges: [
        { from: "A", to: "B", type: "process" },
        { from: "A", to: "C", type: "process" },
        { from: "B", to: "D", type: "transfer" },
        { from: "C", to: "E", type: "transfer" }
      ]
    },
    [
      { id: "A", total_duration: 5.0, contributing_nodes: ["A"] }, // Just A (root)
      { id: "B", total_duration: 15.0, contributing_nodes: ["B", "A"] }, // B + A
      { id: "C", total_duration: 20.0, contributing_nodes: ["C", "A"] }, // C + A
      { id: "D", total_duration: 35.0, contributing_nodes: ["D", "B", "A"] }, // D + B + A
      { id: "E", total_duration: 45.0, contributing_nodes: ["E", "C", "A"] }  // E + C + A
    ]
  );

export default Template(
  temporal_top_down_basic_test,
  temporal_top_down_multilevel_test
);