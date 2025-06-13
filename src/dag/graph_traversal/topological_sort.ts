import { Procedure } from "@elaraai/core";
import {
  Add,
  Const,
  Equal,
  Get,
  GetField,
  Greater,
  Less,
  NewArray,
  NewDict,
  Size,
  Struct,
  Subtract,
} from "@elaraai/core";

import { ArrayType, IntegerType, StringType } from "@elaraai/core";

import { GraphNode, GraphEdge, GraphTopologicalNode } from "../types";

/**
 * Topological sort - orders nodes such that for every edge (A→B), A comes before B in the ordering
 * 
 * Produces a linear ordering of nodes that respects dependency relationships. Essential for scheduling 
 * tasks where some tasks must complete before others can begin. Also assigns layer numbers for 
 * parallel processing optimization.
 * 
 * **Example - Basic DAG:**
 * ```
 * Input Graph:           Topological Order:        Layers:
 *     A ──┐               0: A (no dependencies)     Layer 0: [A]
 *         ├──→ B           1: B (depends on A)       Layer 1: [B, C]  
 *         └──→ C           2: C (depends on A)       Layer 2: [D]
 *             └─┬──→ D     3: D (depends on B,C)
 *               └───→ D
 * 
 * Result: [{id:"A", order:0, layer:0}, {id:"B", order:1, layer:1}, ...]
 * ```
 * 
 * **Example - Multiple Roots:**
 * ```
 * Input Graph:           Topological Order:        Layers:
 *     A ──┐               0: A (root 1)             Layer 0: [A, B]
 *         └──→ C          1: B (root 2)             Layer 1: [C]
 *     B ──┘               2: C (depends on A,B)
 * 
 * A and B can execute in parallel (same layer)
 * ```
 * 
 * **Use Cases:**
 * - Task scheduling: "In what order should tasks execute to respect dependencies?"
 * - Build systems: "Which modules should compile before others?"
 * - Course prerequisites: "What's a valid sequence to take these classes?"
 * 
 * **Algorithm:** Uses Kahn's algorithm with in-degree tracking and queue processing.
 * Layer assignment enables parallel execution of independent tasks.
 * 
 * @param nodes Array of graph nodes to be ordered
 * @param edges Array of directed edges representing dependencies (from → to)
 * @returns Array of topo nodes with id, topological order, and layer assignment
 */
export const graph_topological_sort = new Procedure("graph_topological_sort")
  .input("nodes", ArrayType(GraphNode))
  .input("edges", ArrayType(GraphEdge))
  .output(ArrayType(GraphTopologicalNode))
  .body(($, { nodes, edges }) => {
    // Build adjacency list and in-degree count
    const adjacencyList = $.let(NewDict(StringType, ArrayType(StringType)));
    const inDegree = $.let(NewDict(StringType, IntegerType));
    
    // Initialize all nodes with zero in-degree
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      $.insert(inDegree, nodeId, Const(0n));
      $.insert(adjacencyList, nodeId, NewArray(StringType));
    });
    
    // Build graph and calculate in-degrees
    $.forArray(edges, ($, edge) => {
      const fromId = $.let(GetField(edge, "from"));
      const toId = $.let(GetField(edge, "to"));
      
      // Add to adjacency list
      const neighbors = $.let(Get(adjacencyList, fromId, NewArray(StringType)));
      $.pushLast(neighbors, toId);
      
      // Increment in-degree
      const currentInDegree = $.let(Get(inDegree, toId, Const(0n)));
      $.insertOrUpdate(inDegree, toId, Add(currentInDegree, Const(1n)));
    });
    
    // Find nodes with zero in-degree
    const queue = $.let(NewArray(StringType));
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      const degree = $.let(Get(inDegree, nodeId));
      $.if(Equal(degree, Const(0n))).then($ => {
        $.pushLast(queue, nodeId);
      });
    });
    
    const result = $.let(NewArray(GraphTopologicalNode));
    const topoOrder = $.let(Const(0n));
    const layerNumber = $.let(Const(0n));
    
    // Process nodes layer by layer
    $.while(Greater(Size(queue), Const(0n)), $ => {
      const layerSize = $.let(Size(queue));
      const currentLayer = $.let(layerNumber);
      
      // Process all nodes in current layer
      const layerCounter = $.let(Const(0n));
      $.while(Less(layerCounter, layerSize), $ => {
        const current = $.let(Get(queue, Const(0n)));
        $.deleteFirst(queue);
        
        $.pushLast(result, Struct({
          id: current,
          topo_order: topoOrder,
          layer: currentLayer
        }));
        
        $.assign(topoOrder, Add(topoOrder, Const(1n)));
        $.assign(layerCounter, Add(layerCounter, Const(1n)));
        
        // Process neighbors
        const neighbors = $.let(Get(adjacencyList, current, NewArray(StringType)));
        $.forArray(neighbors, ($, neighbor) => {
          const neighborDegree = $.let(Get(inDegree, neighbor));
          const newDegree = $.let(Subtract(neighborDegree, Const(1n)));
          $.insertOrUpdate(inDegree, neighbor, newDegree);
          
          $.if(Equal(newDegree, Const(0n))).then($ => {
            $.pushLast(queue, neighbor);
          });
        });
      });
      
      // Increment layer number after processing all nodes in current layer
      $.assign(layerNumber, Add(layerNumber, Const(1n)));
    });
    
    $.return(result);
  });