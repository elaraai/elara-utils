import { UnitTestBuilder } from "@elaraai/core";
import { Template } from "@elaraai/core";
import { graph_dynamic_reachability } from "../flow_conservation/dynamic_reachability";

// Basic dynamic reachability test
const dynamic_reachability_basic_test = new UnitTestBuilder("dynamic_reachability_basic")
  .procedure(graph_dynamic_reachability)
  .test(
    {
      nodes: [
        { id: "A", type: "source" },
        { id: "B", type: "middle" },
        { id: "C", type: "sink" },
        { id: "D", type: "isolated" }
      ],
      edges: [
        { from: "A", to: "B", active: true },
        { from: "B", to: "C", active: true },
        { from: "A", to: "D", active: false } // Inactive edge
      ]
    },
    {
      ancestor_map: [
        { node: "A", ancestors: [] },
        { node: "B", ancestors: ["A"] },
        { node: "C", ancestors: ["B", "A"] },
        { node: "D", ancestors: [] } // No ancestors due to inactive edge
      ],
      descendant_map: [
        { node: "A", descendants: ["B", "C"] },
        { node: "B", descendants: ["C"] },
        { node: "C", descendants: [] },
        { node: "D", descendants: [] }
      ]
    }
  );

// Dynamic reachability with mixed active/inactive edges
const dynamic_reachability_mixed_test = new UnitTestBuilder("dynamic_reachability_mixed")
  .procedure(graph_dynamic_reachability)
  .test(
    {
      nodes: [
        { id: "A", type: "root" },
        { id: "B", type: "branch1" },
        { id: "C", type: "branch2" },
        { id: "D", type: "merge" }
      ],
      edges: [
        { from: "A", to: "B", active: true },
        { from: "A", to: "C", active: false }, // Inactive path
        { from: "B", to: "D", active: true },
        { from: "C", to: "D", active: true }
      ]
    },
    {
      ancestor_map: [
        { node: "A", ancestors: [] },
        { node: "B", ancestors: ["A"] },
        { node: "C", ancestors: [] }, // No ancestors due to inactive A->C
        { node: "D", ancestors: ["C", "B", "A"] } // C and B are direct ancestors, A is reachable via active path D←B←A
      ],
      descendant_map: [
        { node: "A", descendants: ["B", "D"] }, // Can't reach C due to inactive edge
        { node: "B", descendants: ["D"] },
        { node: "C", descendants: ["D"] }, // Can still reach D
        { node: "D", descendants: [] }
      ]
    }
  );

export default Template(
  dynamic_reachability_basic_test,
  dynamic_reachability_mixed_test
);