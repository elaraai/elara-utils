import { UnitTestBuilder } from "@elaraai/core";
import { Template } from "@elaraai/core";

import { graph_path_membership } from "../paths/path_membership";

// === PATH MEMBERSHIP TESTS ===

// Basic path membership test
const path_membership_basic_test = new UnitTestBuilder("path_membership_basic")
  .procedure(graph_path_membership)
  .test(
    {
      nodes: [
        { id: "A", type: "start" },
        { id: "B", type: "path1" },
        { id: "C", type: "path2" },
        { id: "D", type: "end" }
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "A", to: "C" },
        { from: "B", to: "D" },
        { from: "C", to: "D" }
      ],
      startId: "A",
      endId: "D"
    },
    [
      { id: "A", path_membership: [0n, 1n] }, // In both paths
      { id: "B", path_membership: [1n] },     // Only in path 1 (A->B->D)
      { id: "C", path_membership: [0n] },     // Only in path 0 (A->C->D)
      { id: "D", path_membership: [0n, 1n] }  // In both paths
    ]
  );

// Complex path membership test
const path_membership_complex_test = new UnitTestBuilder("path_membership_complex")
  .procedure(graph_path_membership)
  .test(
    {
      nodes: [
        { id: "A", type: "start" },
        { id: "B", type: "node" },
        { id: "C", type: "node" },
        { id: "D", type: "node" },
        { id: "E", type: "end" }
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "A", to: "C" },
        { from: "B", to: "D" },
        { from: "C", to: "D" },
        { from: "B", to: "E" },
        { from: "D", to: "E" }
      ],
      startId: "A",
      endId: "E"
    },
    [
      { id: "A", path_membership: [0n, 1n, 2n] }, // In all 3 paths
      { id: "B", path_membership: [1n, 2n] },     // In paths A->B->E and A->B->D->E
      { id: "C", path_membership: [0n] },         // Only in A->C->D->E path
      { id: "D", path_membership: [0n, 2n] },     // In paths that go through D
      { id: "E", path_membership: [0n, 1n, 2n] }  // In all 3 paths
    ]
  );

export default Template(
  path_membership_basic_test,
  path_membership_complex_test
);