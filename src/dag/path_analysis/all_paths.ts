import { Procedure } from "@elaraai/core";
import {
  Const,
  Equal,
  Get,
  GetField,
  Greater,
  In,
  NewArray,
  Not,
  Size,
  Struct,
  Subtract,
} from "@elaraai/core";

import { ArrayType, StringType } from "@elaraai/core";

import { graph_build_adjacency_lists } from "../shared_utils";
import {
  GraphNode,
  GraphEdge,
  GraphPathResult,
} from "../types";

/**
 * All paths enumeration - finds all possible paths between two nodes in a directed graph
 * 
 * Discovers every distinct path from a start node to an end node, useful for analyzing
 * alternative routes, redundancy, or exploring all possible execution flows. Uses DFS 
 * with backtracking to exhaustively enumerate paths.
 * 
 * **Example - Simple Diamond:**
 * ```
 * Input Graph:           All Paths A→D:
 *     A ──┐               Path 1: A → C → D
 *         ├──→ B          Path 2: A → B → D  
 *         └──→ C
 *             └─┬──→ D    Result: {paths: [["A","C","D"], ["A","B","D"]], path_count: 2}
 *               └───→ D
 * ```
 * 
 * **Example - Complex Network:**
 * ```
 * Input Graph:           All Paths A→E:
 *     A ──┐               Path 1: A → B → E
 *         ├──→ B ──┐      Path 2: A → B → D → E
 *         └──→ C   ├──→ E Path 3: A → C → D → E
 *             └──→ D ──┘
 * 
 * Result: {paths: [["A","B","E"], ["A","B","D","E"], ["A","C","D","E"]], path_count: 3}
 * ```
 * 
 * **Example - No Path:**
 * ```
 * Input Graph:           All Paths A→C:
 *     A ──→ B             No connection to C
 *     C (isolated)        
 * 
 * Result: {paths: [], path_count: 0}
 * ```
 * 
 * **Use Cases:**
 * - Route planning: "What are all possible routes between these locations?"
 * - Dependency analysis: "How many ways can task A lead to task B?"
 * - Network resilience: "If some paths fail, what alternatives exist?"
 * 
 * **Algorithm:** Uses DFS with backtracking and cycle detection. Maintains current path
 * and backtracks when reaching dead ends or target node. Handles cycles by avoiding revisiting nodes in current path.
 * 
 * @param nodes Array of graph nodes (used for validation)
 * @param edges Array of directed edges representing connections (from → to)
 * @param startId ID of the starting node
 * @param endId ID of the target node
 * @returns Path result with array of all paths and total path count
 */
export const graph_all_paths = new Procedure("graph_all_paths")
  .input("nodes", ArrayType(GraphNode))
  .input("edges", ArrayType(GraphEdge))
  .input("startId", StringType)
  .input("endId", StringType)
  .output(GraphPathResult)
  .import(graph_build_adjacency_lists)
  .body(($, { edges, startId, endId }, procs) => {
    // Build adjacency lists using shared utility
    const adjacencyData = $.let(procs.graph_build_adjacency_lists(Struct({ edges })));
    const adjacencyList = $.let(GetField(adjacencyData, "adjacency_list"));

    const allPaths = $.let(NewArray(ArrayType(StringType)));

    // DFS to find all paths
    const dfsStack = $.let(NewArray(StringType, [startId]));
    const pathStack = $.let(NewArray(ArrayType(StringType), [NewArray(StringType, [startId])]));

    $.while(Greater(Size(dfsStack), Const(0n)), $ => {
      const currentNode = $.let(Get(dfsStack, Subtract(Size(dfsStack), Const(1n))));
      const currentPathState = $.let(Get(pathStack, Subtract(Size(pathStack), Const(1n))));
      $.deleteLast(dfsStack);
      $.deleteLast(pathStack);

      $.if(Equal(currentNode, endId)).then($ => {
        // Found a path to end
        $.pushLast(allPaths, currentPathState);
      }).else($ => {
        // Continue searching
        $.if(In(adjacencyList, currentNode)).then($ => {
          const neighbors = $.let(Get(adjacencyList, currentNode));
          $.forArray(neighbors, ($, neighbor) => {
            // Check if neighbor is already in current path (avoid cycles)
            const isInPath = $.let(Const(false));
            $.forArray(currentPathState, ($, pathNode) => {
              $.if(Equal(pathNode, neighbor)).then($ => {
                $.assign(isInPath, Const(true));
              });
            });

            $.if(Not(isInPath)).then($ => {
              // Extend path with neighbor
              const newPath = $.let(NewArray(StringType));
              $.forArray(currentPathState, ($, pathNode) => {
                $.pushLast(newPath, pathNode);
              });
              $.pushLast(newPath, neighbor);

              $.pushLast(dfsStack, neighbor);
              $.pushLast(pathStack, newPath);
            });
          });
        });
      });
    });

    $.return(Struct({
      paths: allPaths,
      path_count: Size(allPaths)
    }));
  });