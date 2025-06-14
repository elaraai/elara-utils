import { UnitTestBuilder } from "@elaraai/core";
import { Template } from "@elaraai/core";
import { graph_workflow_completeness } from "../analysis/workflow_completeness";

// Test 1: Complete workflow - input connects to output
const workflow_completeness_complete_test = new UnitTestBuilder("workflow_completeness_complete")
  .procedure(graph_workflow_completeness)
  .test(
    {
      nodes: [
        { id: "A", type: "input" },
        { id: "B", type: "process" },
        { id: "C", type: "output" }
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "B", to: "C" }
      ],
      workflow_patterns: [
        {
          start_types: ["input"],
          end_types: ["output"]
        }
      ]
    },
    {
      total_patterns_checked: 1n,
      complete_workflows: 1n,
      incomplete_workflows: 0n,
      workflow_details: [
        {
          start_types: ["input"],
          end_types: ["output"],
          complete_count: 1n,
          incomplete_count: 0n
        }
      ]
    }
  );

// Test 2: Incomplete workflow - no path from input to output
const workflow_completeness_incomplete_test = new UnitTestBuilder("workflow_completeness_incomplete")
  .procedure(graph_workflow_completeness)
  .test(
    {
      nodes: [
        { id: "A", type: "input" },
        { id: "B", type: "process" },
        { id: "C", type: "output" }
      ],
      edges: [
        { from: "A", to: "B" }
        // Missing B -> C connection
      ],
      workflow_patterns: [
        {
          start_types: ["input"],
          end_types: ["output"]
        }
      ]
    },
    {
      total_patterns_checked: 1n,
      complete_workflows: 0n,
      incomplete_workflows: 1n,
      workflow_details: [
        {
          start_types: ["input"],
          end_types: ["output"],
          complete_count: 0n,
          incomplete_count: 1n
        }
      ]
    }
  );

// Test 3: Multiple workflow patterns
const workflow_completeness_multiple_patterns_test = new UnitTestBuilder("workflow_completeness_multiple_patterns")
  .procedure(graph_workflow_completeness)
  .test(
    {
      nodes: [
        { id: "A", type: "input" },
        { id: "B", type: "process" },
        { id: "C", type: "output" },
        { id: "D", type: "validation" }
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "B", to: "C" },
        { from: "A", to: "D" }
      ],
      workflow_patterns: [
        {
          start_types: ["input"],
          end_types: ["output"]
        },
        {
          start_types: ["input"],
          end_types: ["validation"]
        }
      ]
    },
    {
      total_patterns_checked: 2n,
      complete_workflows: 2n,
      incomplete_workflows: 0n,
      workflow_details: [
        {
          start_types: ["input"],
          end_types: ["output"],
          complete_count: 1n,
          incomplete_count: 0n
        },
        {
          start_types: ["input"],
          end_types: ["validation"],
          complete_count: 1n,
          incomplete_count: 0n
        }
      ]
    }
  );

// Test 4: Multiple start and end types
const workflow_completeness_multiple_types_test = new UnitTestBuilder("workflow_completeness_multiple_types")
  .procedure(graph_workflow_completeness)
  .test(
    {
      nodes: [
        { id: "A1", type: "input1" },
        { id: "A2", type: "input2" },
        { id: "B", type: "process" },
        { id: "C1", type: "output1" },
        { id: "C2", type: "output2" }
      ],
      edges: [
        { from: "A1", to: "B" },
        { from: "A2", to: "B" },
        { from: "B", to: "C1" },
        { from: "B", to: "C2" }
      ],
      workflow_patterns: [
        {
          start_types: ["input1", "input2"],
          end_types: ["output1", "output2"]
        }
      ]
    },
    {
      total_patterns_checked: 1n,
      complete_workflows: 2n, // Both A1 and A2 can reach outputs
      incomplete_workflows: 0n,
      workflow_details: [
        {
          start_types: ["input1", "input2"],
          end_types: ["output1", "output2"],
          complete_count: 2n,
          incomplete_count: 0n
        }
      ]
    }
  );

// Test 5: Disconnected components - some workflows incomplete
const workflow_completeness_disconnected_test = new UnitTestBuilder("workflow_completeness_disconnected")
  .procedure(graph_workflow_completeness)
  .test(
    {
      nodes: [
        { id: "A1", type: "input" },
        { id: "B1", type: "process" },
        { id: "C1", type: "output" },
        { id: "A2", type: "input" }, // Isolated input
        { id: "C2", type: "output" }  // Isolated output
      ],
      edges: [
        { from: "A1", to: "B1" },
        { from: "B1", to: "C1" }
        // A2 and C2 are disconnected
      ],
      workflow_patterns: [
        {
          start_types: ["input"],
          end_types: ["output"]
        }
      ]
    },
    {
      total_patterns_checked: 1n,
      complete_workflows: 1n, // Only A1 -> C1 is complete
      incomplete_workflows: 1n, // A2 cannot reach any output
      workflow_details: [
        {
          start_types: ["input"],
          end_types: ["output"],
          complete_count: 1n,
          incomplete_count: 1n
        }
      ]
    }
  );

// Test 6: Empty patterns
const workflow_completeness_empty_patterns_test = new UnitTestBuilder("workflow_completeness_empty_patterns")
  .procedure(graph_workflow_completeness)
  .test(
    {
      nodes: [
        { id: "A", type: "input" },
        { id: "B", type: "output" }
      ],
      edges: [
        { from: "A", to: "B" }
      ],
      workflow_patterns: []
    },
    {
      total_patterns_checked: 0n,
      complete_workflows: 0n,
      incomplete_workflows: 0n,
      workflow_details: []
    }
  );

export default Template(
  workflow_completeness_complete_test,
  workflow_completeness_incomplete_test,
  workflow_completeness_multiple_patterns_test,
  workflow_completeness_multiple_types_test,
  workflow_completeness_disconnected_test,
  workflow_completeness_empty_patterns_test
);