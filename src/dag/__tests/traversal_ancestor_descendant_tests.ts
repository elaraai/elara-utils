import { UnitTestBuilder } from "@elaraai/core";
import { Template } from "@elaraai/core";

import { graph_ancestor_descendant } from "../traversal/ancestor_descendant";

// === ANCESTOR/DESCENDANT TESTS ===

// Basic ancestor/descendant test
const ancestor_descendant_basic_test = new UnitTestBuilder("ancestor_descendant_basic")
  .procedure(graph_ancestor_descendant)
  .test(
    {
      nodes: [
        { id: "A", type: "root" },
        { id: "B", type: "middle" },
        { id: "C", type: "middle" },
        { id: "D", type: "leaf" }
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
        ancestors: [],
        descendants: ["C", "B", "D"],
        reachable_nodes: ["C", "B", "D"]
      },
      {
        id: "B", 
        ancestors: ["A"],
        descendants: ["D"],
        reachable_nodes: ["A", "D"]
      },
      {
        id: "C",
        ancestors: ["A"], 
        descendants: [],
        reachable_nodes: ["A"]
      },
      {
        id: "D",
        ancestors: ["B", "A"],
        descendants: [],
        reachable_nodes: ["B", "A"]
      }
    ]
  );

// Complex ancestor/descendant test
const ancestor_descendant_complex_test = new UnitTestBuilder("ancestor_descendant_complex")
  .procedure(graph_ancestor_descendant)
  .test(
    {
      nodes: [
        { id: "A", type: "root" },
        { id: "B", type: "node" },
        { id: "C", type: "node" },
        { id: "D", type: "node" },
        { id: "E", type: "leaf" }
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "A", to: "C" },
        { from: "B", to: "D" },
        { from: "C", to: "D" },
        { from: "D", to: "E" }
      ]
    },
    [
      {
        id: "A",
        ancestors: [],
        descendants: ["C", "D", "E", "B"],
        reachable_nodes: ["C", "D", "E", "B"]
      },
      {
        id: "B",
        ancestors: ["A"],
        descendants: ["D", "E"],
        reachable_nodes: ["A", "D", "E"]
      },
      {
        id: "C",
        ancestors: ["A"],
        descendants: ["D", "E"],
        reachable_nodes: ["A", "D", "E"]
      },
      {
        id: "D",
        ancestors: ["C", "A", "B"],
        descendants: ["E"],
        reachable_nodes: ["C", "A", "B", "E"]
      },
      {
        id: "E",
        ancestors: ["D", "C", "A", "B"],
        descendants: [],
        reachable_nodes: ["D", "C", "A", "B"]
      }
    ]
  );

// Edge case: disconnected components
const ancestor_descendant_disconnected_test = new UnitTestBuilder("ancestor_descendant_disconnected")
  .procedure(graph_ancestor_descendant)
  .test(
    {
      nodes: [
        { id: "A", type: "component1" },
        { id: "B", type: "component1" },
        { id: "C", type: "component2" },
        { id: "D", type: "component2" }
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "C", to: "D" }
      ]
    },
    [
      {
        id: "A",
        ancestors: [],
        descendants: ["B"],
        reachable_nodes: ["B"]
      },
      {
        id: "B",
        ancestors: ["A"],
        descendants: [],
        reachable_nodes: ["A"]
      },
      {
        id: "C",
        ancestors: [],
        descendants: ["D"],
        reachable_nodes: ["D"]
      },
      {
        id: "D",
        ancestors: ["C"],
        descendants: [],
        reachable_nodes: ["C"]
      }
    ]
  );

export default Template(
  ancestor_descendant_basic_test,
  ancestor_descendant_complex_test,
  ancestor_descendant_disconnected_test
);