import { Procedure } from "@elaraai/core";
import {
  Add,
  Const,
  Equal,
  GetField,
  Struct,
} from "@elaraai/core";

import { ArrayType, IntegerType, StringType } from "@elaraai/core";

import {
  NewArray,
} from "@elaraai/core";

import { graph_all_paths } from "./all_paths";
import {
  GraphNode,
  GraphEdge,
  GraphPathNode,
} from "../types";

/**
 * Path membership analysis - determines which paths each node belongs to
 * 
 * For each node, identifies all the paths (from start to end) that pass through it.
 * Uses the `graph_all_paths` procedure to find all possible paths, then analyzes
 * which nodes participate in which paths.
 * 
 * **Example:**
 * ```
 * Input Graph:           All Paths A→D:           Path Membership:
 *     A ──┌──────┐           Path 0: [A,C,D]        A: belongs to paths [0,1]
 *         ├──→ B       Path 1: [A,B,D]        B: belongs to path [1]
 *         └──→ C                               C: belongs to path [0]
 *             └─┬──→ D                               D: belongs to paths [0,1]
 * ```
 * 
 * **Use Cases:**
 * - Critical node analysis: "Which nodes are on the most paths?"
 * - Redundancy analysis: "If this node fails, how many paths are affected?"
 * - Path diversity: "Which nodes provide alternative routing options?"
 * 
 * **Algorithm:** First finds all paths using DFS, then for each node checks
 * which path indices it appears in.
 * 
 * **Complexity:** O(V! * P) inheriting from all_paths
 * 
 * @param nodes Array of graph nodes (used for validation)
 * @param edges Array of directed edges representing connections (from → to)
 * @param source_node_id ID of the starting node
 * @param endId ID of the target node
 * @returns Array of path nodes with id and array of path indices the node belongs to
 */
export const graph_path_membership = new Procedure("graph_path_membership")
  .input("nodes", ArrayType(GraphNode))
  .input("edges", ArrayType(GraphEdge))
  .input("source_node_id", StringType)
  .input("endId", StringType)
  .output(ArrayType(GraphPathNode))
  .import(graph_all_paths)
  .body(($, { nodes, edges, source_node_id, endId }, procs) => {
    // Use existing all_paths procedure to find all paths
    const pathResult = $.let(procs.graph_all_paths(Struct({
      nodes,
      edges,
      source_node_id,
      endId
    })));
    const allPaths = $.let(GetField(pathResult, "paths"));

    // Now analyze path membership for each node
    const result = $.let(NewArray(GraphPathNode));

    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      const pathMembership = $.let(NewArray(IntegerType));

      // Check which paths this node belongs to
      const pathIndex = $.let(Const(0n));
      $.forArray(allPaths, ($, path) => {
        const isInThisPath = $.let(Const(false));
        $.forArray(path, ($, pathNode) => {
          $.if(Equal(pathNode, nodeId)).then($ => {
            $.assign(isInThisPath, Const(true));
          });
        });

        $.if(isInThisPath).then($ => {
          $.pushLast(pathMembership, pathIndex);
        });

        $.assign(pathIndex, Add(pathIndex, Const(1n)));
      });

      $.pushLast(result, Struct({
        id: nodeId,
        path_membership: pathMembership
      }));
    });

    $.return(result);
  });