import { UnitTestBuilder } from "@elaraai/core";
import { Template } from "@elaraai/core";
import { graph_missing_transitions } from "../analysis/missing_transitions";

// Test 1: No missing transitions - all expected patterns present
const missing_transitions_none_test = new UnitTestBuilder("missing_transitions_none")
  .procedure(graph_missing_transitions)
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
      expected_transitions: [
        { from_type: "input", to_type: "process" },
        { from_type: "process", to_type: "output" }
      ]
    },
    [] // No missing transitions
  );

// Test 2: Some missing transitions
const missing_transitions_some_test = new UnitTestBuilder("missing_transitions_some")
  .procedure(graph_missing_transitions)
  .test(
    {
      nodes: [
        { id: "A", type: "input" },
        { id: "B", type: "process" },
        { id: "C", type: "output" }
      ],
      edges: [
        { from: "A", to: "B" }
        // Missing B -> C edge
      ],
      expected_transitions: [
        { from_type: "input", to_type: "process" },
        { from_type: "process", to_type: "output" },
        { from_type: "input", to_type: "validation" }
      ]
    },
    [
      { from_type: "process", to_type: "output" },
      { from_type: "input", to_type: "validation" }
    ]
  );

// Test 3: All transitions missing
const missing_transitions_all_test = new UnitTestBuilder("missing_transitions_all")
  .procedure(graph_missing_transitions)
  .test(
    {
      nodes: [
        { id: "A", type: "input" },
        { id: "B", type: "process" }
      ],
      edges: [], // No edges at all
      expected_transitions: [
        { from_type: "input", to_type: "process" },
        { from_type: "process", to_type: "output" }
      ]
    },
    [
      { from_type: "input", to_type: "process" },
      { from_type: "process", to_type: "output" }
    ]
  );

// Test 4: Empty expected transitions
const missing_transitions_empty_expected_test = new UnitTestBuilder("missing_transitions_empty_expected")
  .procedure(graph_missing_transitions)
  .test(
    {
      nodes: [
        { id: "A", type: "input" },
        { id: "B", type: "process" }
      ],
      edges: [
        { from: "A", to: "B" }
      ],
      expected_transitions: []
    },
    [] // No expected transitions, so nothing can be missing
  );

// Test 5: Dangling edges (edges to non-existent nodes) - should be ignored
const missing_transitions_dangling_test = new UnitTestBuilder("missing_transitions_dangling")
  .procedure(graph_missing_transitions)
  .test(
    {
      nodes: [
        { id: "A", type: "input" },
        { id: "B", type: "process" }
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "B", to: "C" }, // C doesn't exist
        { from: "D", to: "B" }  // D doesn't exist
      ],
      expected_transitions: [
        { from_type: "input", to_type: "process" },
        { from_type: "process", to_type: "unknown" }
      ]
    },
    [
      { from_type: "process", to_type: "unknown" }
    ]
  );

export default Template(
  missing_transitions_none_test,
  missing_transitions_some_test,
  missing_transitions_all_test,
  missing_transitions_empty_expected_test,
  missing_transitions_dangling_test
);