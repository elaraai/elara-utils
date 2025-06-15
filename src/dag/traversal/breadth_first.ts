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
} from "@elaraai/core";

import { ArrayType, StringType } from "@elaraai/core";

import { graph_build_adjacency_lists } from "../core/adjacency_lists";
import { GraphNode, GraphEdge } from "../types";

/**
 * Breadth-First Search (BFS) traversal - visits nodes level by level from the starting node
 * 
 * Explores neighbors at the current depth before moving to nodes at the next depth level.
 * Uses a queue (FIFO) for systematic level-order traversal. Ensures each node is visited exactly once.
 * 
 * **Example - Tree Structure:**
 * ```
 * Input Graph:           Traversal Order:
 *     A ──┐               1. A (start)
 *         ├──→ B           2. B (level 1)
 *         └──→ C           3. C (level 1) 
 *             ├──→ D       4. D (level 2)
 *             └──→ E       5. E (level 2)
 * 
 * Result: ["A", "B", "C", "D", "E"]
 * ```
 * 
 * **Example - Diamond Structure:**
 * ```
 * Input Graph:           Traversal Order:
 *         A               1. A (start)
 *       ┌─┴─┐             2. B (level 1)
 *       B   C             3. C (level 1)
 *       └─┬─┘             4. D (level 2, visited only once)
 *         D
 * 
 * Result: ["A", "B", "C", "D"]
 * ```
 * 
 * **Use Cases:**
 * - Shortest path discovery: "What's the minimum number of hops to reach this node?"
 * - Level-order processing: "Process all immediate dependencies before their sub-dependencies"
 * - Social network analysis: "Find connections within N degrees of separation"
 * 
 * **Algorithm:** Uses queue for FIFO processing and visited set to prevent cycles.
 * Handles disconnected nodes by only visiting reachable nodes from the start.
 * 
 * **Complexity:** O(V + E) where V = reachable nodes, E = reachable edges
 * 
 * @param nodes Array of graph nodes (used for validation)
 * @param edges Array of directed edges representing connections (from → to)
 * @param source_node_id ID of the node to begin traversal from
 * @returns Array of node IDs in breadth-first order
 */
export const graph_bfs = new Procedure("graph_bfs")
  .input("nodes", ArrayType(GraphNode))
  .input("edges", ArrayType(GraphEdge))
  .input("source_node_id", StringType)
  .output(ArrayType(StringType))
  .import(graph_build_adjacency_lists)
  .body(($, { edges, source_node_id }, procs) => {
    // Build adjacency lists using shared utility
    const adjacencyData = $.let(procs.graph_build_adjacency_lists(Struct({ edges })));
    const adjacencyList = $.let(GetField(adjacencyData, "adjacency_list"));
    
    // BFS using queue (Procedure methods)
    const queue = $.let(NewArray(StringType, [source_node_id]));
    const visited = $.let(NewSet(StringType, [source_node_id]));
    const result = $.let(NewArray(StringType));
    
    $.while(Greater(Size(queue), Const(0n)), $ => {
      const current = $.let(Get(queue, Const(0n)));
      $.deleteFirst(queue);
      $.pushLast(result, current);
      
      $.if(In(adjacencyList, current)).then($ => {
        const neighbors = $.let(Get(adjacencyList, current));
        $.forArray(neighbors, ($, neighbor) => {
          $.if(Not(In(visited, neighbor))).then($ => {
            $.insert(visited, neighbor);
            $.pushLast(queue, neighbor);
          });
        });
      });
    });
    
    $.return(result);
  });