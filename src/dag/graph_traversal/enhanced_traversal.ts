import { Procedure } from "@elaraai/core";
import {
  Add,
  Const,
  Get,
  GetField,
  Greater,
  In,
  NewArray,
  NewDict,
  NewSet,
  Not,
  Size,
  Struct,
  Subtract,
} from "@elaraai/core";

import { ArrayType, BooleanType, IntegerType, Nullable, StringType } from "@elaraai/core";

import { GraphNode, GraphEdge, GraphTraversalNode } from "../types";

/**
 * Enhanced traversal - performs BFS or DFS with detailed tracking of depth, order, and parent relationships
 * 
 * Extends basic traversal algorithms to capture rich traversal metadata including visit order, 
 * depth from start node, and parent relationships. Useful for building spanning trees and analyzing graph structure.
 * 
 * **Example - BFS Mode:**
 * ```
 * Input Graph:           BFS Result:
 *     A ──┐               A: order=0, depth=0, parent=null
 *         ├──→ B           B: order=1, depth=1, parent=A
 *         └──→ C           C: order=2, depth=1, parent=A
 *             └──→ D       D: order=3, depth=2, parent=B
 * 
 * Result: Level-order with depth tracking
 * ```
 * 
 * **Example - DFS Mode:**
 * ```
 * Input Graph:           DFS Result:
 *     A ──┐               A: order=0, depth=0, parent=null
 *         ├──→ B           C: order=1, depth=1, parent=A (visits C first)
 *         └──→ C           D: order=2, depth=2, parent=C (goes deep)
 *             └──→ D       B: order=3, depth=1, parent=A (backtracks)
 * 
 * Result: Depth-first with backtracking metadata
 * ```
 * 
 * **Use Cases:**
 * - Spanning tree construction: "Build a tree that connects all reachable nodes"
 * - Hierarchy analysis: "What's the depth and parent of each node in the dependency tree?"
 * - Distance calculation: "How far is each node from the starting point?"
 * 
 * **Algorithm:** Combines traversal logic with metadata tracking. 
 * BFS mode provides shortest-path depths, DFS mode provides exploration order with depths.
 * 
 * @param nodes Array of graph nodes (used for validation)
 * @param edges Array of directed edges representing connections (from → to)
 * @param startId ID of the node to begin traversal from
 * @param useBFS true for breadth-first (level-order), false for depth-first
 * @returns Array of traversal nodes with id, visited_order, depth, and parent_id
 */
export const graph_enhanced_traversal = new Procedure("graph_enhanced_traversal")
  .input("nodes", ArrayType(GraphNode))
  .input("edges", ArrayType(GraphEdge))
  .input("startId", StringType)
  .input("useBFS", BooleanType) // true for BFS, false for DFS
  .output(ArrayType(GraphTraversalNode))
  .body(($, { edges, startId, useBFS }) => {
    // Build adjacency list
    const adjacencyList = $.let(NewDict(StringType, ArrayType(StringType)));
    
    $.forArray(edges, ($, edge) => {
      const fromId = $.let(GetField(edge, "from"));
      const toId = $.let(GetField(edge, "to"));
      
      $.if(In(adjacencyList, fromId)).then($ => {
        const neighbors = $.let(Get(adjacencyList, fromId));
        $.pushLast(neighbors, toId);
      }).else($ => {
        $.insert(adjacencyList, fromId, NewArray(StringType, [toId]));
      });
    });
    
    // Initialize traversal structures
    const queue = $.let(NewArray(StringType, [startId]));
    const visited = $.let(NewSet(StringType));
    const result = $.let(NewArray(GraphTraversalNode));
    const parentMap = $.let(NewDict(StringType, Nullable(StringType)));
    const depthMap = $.let(NewDict(StringType, IntegerType));
    const visitOrder = $.let(Const(0n));
    
    // Initialize start node
    $.insert(parentMap, startId, Const(null, Nullable(StringType)));
    $.insert(depthMap, startId, Const(0n));
    
    $.while(Greater(Size(queue), Const(0n)), $ => {
      // Get current node based on BFS vs DFS
      const current = $.let(Const(""));
      $.if(useBFS).then($ => {
        const node = $.let(Get(queue, Const(0n)));
        $.deleteFirst(queue);
        $.assign(current, node);
      }).else($ => {
        const node = $.let(Get(queue, Subtract(Size(queue), Const(1n))));
        $.deleteLast(queue);
        $.assign(current, node);
      });
      
      $.if(Not(In(visited, current))).then($ => {
        $.insert(visited, current);
        
        // Add to result with traversal info
        const currentDepth = $.let(Get(depthMap, current));
        const currentParent = $.let(Get(parentMap, current));
        
        $.pushLast(result, Struct({
          id: current,
          visited_order: visitOrder,
          depth: currentDepth,
          parent_id: currentParent
        }));
        
        $.assign(visitOrder, Add(visitOrder, Const(1n)));
        
        // Add neighbors
        $.if(In(adjacencyList, current)).then($ => {
          const neighbors = $.let(Get(adjacencyList, current));
          $.forArray(neighbors, ($, neighbor) => {
            $.if(Not(In(visited, neighbor))).then($ => {
              $.if(Not(In(depthMap, neighbor))).then($ => {
                $.insert(depthMap, neighbor, Add(currentDepth, Const(1n)));
                $.insert(parentMap, neighbor, current);
                $.pushLast(queue, neighbor);
              });
            });
          });
        });
      });
    });
    
    $.return(result);
  });