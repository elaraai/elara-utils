import { Procedure } from "@elaraai/core";
import {
  Const,
  Get,
  GetField,
  Greater,
  In,
  NewArray,
  NewSet,
  Not,
  Size,
  Struct,
  Subtract,
} from "@elaraai/core";

import { ArrayType, StringType } from "@elaraai/core";

import { graph_build_adjacency_lists } from "../core/adjacency_lists";
import { GraphNode, GraphEdge } from "../types";

/**
 * Depth-First Search (DFS) traversal - explores as far as possible along each branch before backtracking
 * 
 * Goes deep into the graph before exploring siblings at the same level. Uses a stack (LIFO) for 
 * systematic depth-first exploration. Ensures each node is visited exactly once.
 * 
 * **Example - Tree Structure:**
 * ```
 * Input Graph:           Traversal Order:
 *     A ──┐               1. A (start)
 *         ├──→ B           2. C (go deep first)
 *         └──→ C           3. B (backtrack, then explore)
 *             ├──→ D       4. E (continue deep)
 *             └──→ E       5. D (finish branch)
 * 
 * Result: ["A", "C", "B", "E", "D"] (stack reverses order)
 * ```
 * 
 * **Example - Diamond Structure:**
 * ```
 * Input Graph:           Traversal Order:
 *         A               1. A (start)
 *       ┌─┴─┐             2. C (first neighbor, go deep)
 *       B   C             3. D (reach bottom via C)
 *       └─┬─┘             4. B (backtrack, D already visited)
 *         D
 * 
 * Result: ["A", "C", "D", "B"]
 * ```
 * 
 * **Use Cases:**
 * - Dependency resolution: "Complete all sub-tasks before moving to the next main task"
 * - Path exploration: "Explore complete paths through decision trees"
 * - Cycle detection: "Detect cycles by tracking back edges during traversal"
 * 
 * **Algorithm:** Uses stack for LIFO processing and visited set to prevent cycles.
 * The stack-based approach naturally creates depth-first behavior by always processing the most recently added node.
 * 
 * **Complexity:** O(V + E) where V = reachable nodes, E = reachable edges
 * 
 * @param nodes Array of graph nodes (used for validation)
 * @param edges Array of directed edges representing connections (from → to)
 * @param source_node_id ID of the node to begin traversal from
 * @returns Array of node IDs in depth-first order
 */
export const graph_dfs = new Procedure("graph_dfs")
  .input("nodes", ArrayType(GraphNode))
  .input("edges", ArrayType(GraphEdge))
  .input("source_node_id", StringType)
  .output(ArrayType(StringType))
  .import(graph_build_adjacency_lists)
  .body(($, { edges, source_node_id }, procs) => {
    // Build adjacency lists using shared utility
    const adjacencyData = $.let(procs.graph_build_adjacency_lists(Struct({ edges })));
    const adjacencyList = $.let(GetField(adjacencyData, "adjacency_list"));
    
    // DFS using stack (Procedure methods)
    const stack = $.let(NewArray(StringType, [source_node_id]));
    const visited = $.let(NewSet(StringType));
    const result = $.let(NewArray(StringType));
    
    $.while(Greater(Size(stack), Const(0n)), $ => {
      const current = $.let(Get(stack, Subtract(Size(stack), Const(1n))));
      $.deleteLast(stack);
      
      $.if(Not(In(visited, current))).then($ => {
        $.insert(visited, current);
        $.pushLast(result, current);
        
        $.if(In(adjacencyList, current)).then($ => {
          const neighbors = $.let(Get(adjacencyList, current));
          $.forArray(neighbors, ($, neighbor) => {
            $.if(Not(In(visited, neighbor))).then($ => {
              $.pushLast(stack, neighbor);
            });
          });
        });
      });
    });
    
    $.return(result);
  });