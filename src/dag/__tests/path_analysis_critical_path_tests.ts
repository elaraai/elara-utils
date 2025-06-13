import { UnitTestBuilder } from "@elaraai/core";
import { Template } from "@elaraai/core";

import { graph_critical_path } from "../path_analysis/critical_path";

// === CRITICAL PATH TESTS ===

// Basic critical path test
const critical_path_basic_test = new UnitTestBuilder("critical_path_basic")
  .procedure(graph_critical_path)
  .test(
    {
      nodes: [
        { id: "A", type: "task", start_time: new Date("2024-01-01T00:00:00Z"), end_time: new Date("2024-01-01T00:03:00Z") },
        { id: "B", type: "task", start_time: new Date("2024-01-01T00:03:00Z"), end_time: new Date("2024-01-01T00:05:00Z") },
        { id: "C", type: "task", start_time: new Date("2024-01-01T00:05:00Z"), end_time: new Date("2024-01-01T00:09:00Z") }
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "B", to: "C" }
      ]
    },
    {
      critical_path: ["A", "B", "C"],
      total_duration: 9.0
    }
  );

// Critical path with parallel tasks
const critical_path_parallel_test = new UnitTestBuilder("critical_path_parallel")
  .procedure(graph_critical_path)
  .test(
    {
      nodes: [
        { id: "A", type: "start", start_time: new Date("2024-01-01T00:00:00Z"), end_time: new Date("2024-01-01T00:02:00Z") },
        { id: "B", type: "long", start_time: new Date("2024-01-01T00:02:00Z"), end_time: new Date("2024-01-01T00:10:00Z") },
        { id: "C", type: "short", start_time: new Date("2024-01-01T00:02:00Z"), end_time: new Date("2024-01-01T00:05:00Z") },
        { id: "D", type: "end", start_time: new Date("2024-01-01T00:10:00Z"), end_time: new Date("2024-01-01T00:11:00Z") }
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "A", to: "C" },
        { from: "B", to: "D" },
        { from: "C", to: "D" }
      ]
    },
    {
      critical_path: ["A", "B", "D"], // Longest path
      total_duration: 11.0
    }
  );

// Complex critical path test
const critical_path_complex_test = new UnitTestBuilder("critical_path_complex")
  .procedure(graph_critical_path)
  .test(
    {
      nodes: [
        { id: "A", type: "task", start_time: new Date("2024-01-01T00:00:00Z"), end_time: new Date("2024-01-01T00:04:00Z") },
        { id: "B", type: "task", start_time: new Date("2024-01-01T00:04:00Z"), end_time: new Date("2024-01-01T00:10:00Z") },
        { id: "C", type: "task", start_time: new Date("2024-01-01T00:04:00Z"), end_time: new Date("2024-01-01T00:06:00Z") },
        { id: "D", type: "task", start_time: new Date("2024-01-01T00:10:00Z"), end_time: new Date("2024-01-01T00:13:00Z") },
        { id: "E", type: "task", start_time: new Date("2024-01-01T00:06:00Z"), end_time: new Date("2024-01-01T00:11:00Z") },
        { id: "F", type: "task", start_time: new Date("2024-01-01T00:13:00Z"), end_time: new Date("2024-01-01T00:14:00Z") }
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "A", to: "C" },
        { from: "B", to: "D" },
        { from: "C", to: "E" },
        { from: "D", to: "F" },
        { from: "E", to: "F" }
      ]
    },
    {
      critical_path: ["A", "B", "D", "F"], // A(4) + B(6) + D(3) + F(1) = 14
      total_duration: 14.0
    }
  );

// Edge case: single node critical path
const critical_path_single_test = new UnitTestBuilder("critical_path_single")
  .procedure(graph_critical_path)
  .test(
    {
      nodes: [
        { id: "A", type: "only", start_time: new Date("2024-01-01T00:00:00Z"), end_time: new Date("2024-01-01T00:05:00Z") }
      ],
      edges: []
    },
    {
      critical_path: ["A"],
      total_duration: 5.0
    }
  );

export default Template(
  critical_path_basic_test,
  critical_path_parallel_test,
  critical_path_complex_test,
  critical_path_single_test
);