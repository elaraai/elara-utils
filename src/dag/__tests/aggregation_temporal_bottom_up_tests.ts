import { UnitTestBuilder } from "@elaraai/core";
import { Template } from "@elaraai/core";
import { graph_temporal_bottom_up_aggregation } from "../aggregation/temporal_bottom_up";

// Basic bottom-up temporal aggregation test
const temporal_bottom_up_basic_test = new UnitTestBuilder("temporal_bottom_up_basic")
  .procedure(graph_temporal_bottom_up_aggregation)
  .test(
    {
      nodes: [
        { id: "A", type: "root", start_time: new Date("2024-01-01T09:00:00Z"), end_time: new Date("2024-01-01T09:10:00Z") },
        { id: "B", type: "leaf", start_time: new Date("2024-01-01T10:00:00Z"), end_time: new Date("2024-01-01T10:20:00Z") },
        { id: "C", type: "leaf", start_time: new Date("2024-01-01T11:00:00Z"), end_time: new Date("2024-01-01T11:30:00Z") }
      ],
      edges: [
        { from: "A", to: "B", type: "flow" },
        { from: "A", to: "C", type: "flow" }
      ]
    },
    [
      { id: "A", total_duration: 60.0, contributing_nodes: ["A", "B", "C"] }, // A + B + C
      { id: "B", total_duration: 20.0, contributing_nodes: ["B"] }, // Just B
      { id: "C", total_duration: 30.0, contributing_nodes: ["C"] }  // Just C
    ]
  );

// Multi-level bottom-up aggregation test
const temporal_bottom_up_multilevel_test = new UnitTestBuilder("temporal_bottom_up_multilevel")
  .procedure(graph_temporal_bottom_up_aggregation)
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
      { id: "A", total_duration: 75.0, contributing_nodes: ["A", "B", "C", "E", "D"] }, // All nodes (DFS order)
      { id: "B", total_duration: 30.0, contributing_nodes: ["B", "D"] }, // B + D
      { id: "C", total_duration: 40.0, contributing_nodes: ["C", "E"] }, // C + E
      { id: "D", total_duration: 20.0, contributing_nodes: ["D"] }, // Just D
      { id: "E", total_duration: 25.0, contributing_nodes: ["E"] }  // Just E
    ]
  );

// Single node test
const temporal_single_node_test = new UnitTestBuilder("temporal_single_node")
  .procedure(graph_temporal_bottom_up_aggregation)
  .test(
    {
      nodes: [
        { id: "A", type: "isolated", start_time: new Date("2024-01-01T09:00:00Z"), end_time: new Date("2024-01-01T09:42:00Z") }
      ],
      edges: []
    },
    [
      { id: "A", total_duration: 42.0, contributing_nodes: ["A"] }
    ]
  );

// Disconnected components test
const temporal_disconnected_test = new UnitTestBuilder("temporal_disconnected")
  .procedure(graph_temporal_bottom_up_aggregation)
  .test(
    {
      nodes: [
        { id: "A", type: "root1", start_time: new Date("2024-01-01T09:00:00Z"), end_time: new Date("2024-01-01T09:10:00Z") },
        { id: "B", type: "leaf1", start_time: new Date("2024-01-01T10:00:00Z"), end_time: new Date("2024-01-01T10:20:00Z") },
        { id: "C", type: "root2", start_time: new Date("2024-01-01T11:00:00Z"), end_time: new Date("2024-01-01T11:30:00Z") },
        { id: "D", type: "leaf2", start_time: new Date("2024-01-01T12:00:00Z"), end_time: new Date("2024-01-01T12:40:00Z") }
      ],
      edges: [
        { from: "A", to: "B", type: "connection" },
        { from: "C", to: "D", type: "connection" }
      ]
    },
    [
      { id: "A", total_duration: 30.0, contributing_nodes: ["A", "B"] }, // A + B
      { id: "B", total_duration: 20.0, contributing_nodes: ["B"] }, // Just B
      { id: "C", total_duration: 70.0, contributing_nodes: ["C", "D"] }, // C + D
      { id: "D", total_duration: 40.0, contributing_nodes: ["D"] }  // Just D
    ]
  );

export default Template(
  temporal_bottom_up_basic_test,
  temporal_bottom_up_multilevel_test,
  temporal_single_node_test,
  temporal_disconnected_test
);