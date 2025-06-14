import { Procedure } from "@elaraai/core";
import {
  Add,
  Const,
  Equal,
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
} from "@elaraai/core";

import { ArrayType, FloatType, StringType } from "@elaraai/core";

import { graph_build_adjacency_lists } from "../core";
import {
  GraphEdge,
  GraphValueNode,
  GraphAggregationNode,
} from "../types";

/**
 * Bottom-up aggregation - aggregates node values from leaf nodes upward through dependency tree
 * 
 * For each node, calculates the total value of itself plus all its descendants (nodes that depend on it).
 * This is useful for project planning where you want to know the total resource impact of starting a particular task,
 * including all the work that flows from it.
 * 
 * **Example:**
 * ```
 * Input Graph:           Node Values:          Result:
 *     A ──┐                A: 10                A: 18 (10+5+3)
 *         ├──→ B            B: 5                 B: 5 (just B)  
 *         └──→ C            C: 3                 C: 3 (just C)
 * ```
 * 
 * **Multi-level Example:**
 * ```
 * Input Graph:                 Values:          Result:
 *     A ──┐                      A: 1           A: 15 (1+2+3+4+5)
 *         ├──→ B ──→ D            B: 2           B: 6 (2+4)
 *         └──→ C ──→ E            C: 3           C: 8 (3+5)
 *                                D: 4           D: 4, E: 5
 *                                E: 5
 * ```
 * 
 * **Use Cases:**
 * - Project impact analysis: "If I start task A, what's the total resource commitment?"
 * - Resource planning: "What's the total value/cost for this work stream?"
 * - Critical path analysis: "Which starting tasks have the biggest downstream impact?"
 * 
 * **Algorithm:** Uses DFS traversal to visit all descendants and sum their values.
 * Handles cycles, disconnected components, and complex dependency structures.
 * 
 * **Complexity:** O(V + E) where V is the number of vertices and E is the number of edges.
 * 
 * @param nodes Array of value nodes with id and numeric value
 * @param edges Array of directed edges representing dependencies (from → to)
 * @returns Array of aggregation results with total value and contributing nodes for each input node
 */
export const graph_bottom_up_aggregation = new Procedure("graph_bottom_up_aggregation")
  .input("nodes", ArrayType(GraphValueNode))
  .input("edges", ArrayType(GraphEdge))
  .output(ArrayType(GraphAggregationNode))
  .import(graph_build_adjacency_lists)
  .body(($, { nodes, edges }, procs) => {
    // Build adjacency lists using shared utility
    const adjacencyData = $.let(procs.graph_build_adjacency_lists(Struct({ edges })));
    const adjacencyList = $.let(GetField(adjacencyData, "adjacency_list"));
    const reverseAdjacencyList = $.let(GetField(adjacencyData, "reverse_adjacency_list"));
    
    // Create node value map
    const nodeValues = $.let(NewDict(StringType, FloatType));
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      const value = $.let(GetField(node, "value"));
      $.insertOrUpdate(nodeValues, nodeId, value);
    });
    
    // Find leaf nodes (no children)
    const leafNodes = $.let(NewArray(StringType));
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      $.if(Not(In(adjacencyList, nodeId))).then($ => {
        $.pushLast(leafNodes, nodeId);
      });
    });
    
    // Process nodes bottom-up using topological sort
    const processed = $.let(NewSet(StringType));
    const queue = $.let(NewArray(StringType));
    const aggregatedValues = $.let(NewDict(StringType, FloatType));
    const contributingNodes = $.let(NewDict(StringType, ArrayType(StringType)));
    
    // Initialize leaf nodes
    $.forArray(leafNodes, ($, leafId) => {
      $.pushLast(queue, leafId);
      const leafValue = $.let(Get(nodeValues, leafId));
      $.insertOrUpdate(aggregatedValues, leafId, leafValue);
      $.insertOrUpdate(contributingNodes, leafId, NewArray(StringType, [leafId]));
    });
    
    $.while(Greater(Size(queue), Const(0n)), $ => {
      const currentNode = $.let(Get(queue, Const(0n)));
      $.deleteFirst(queue);
      $.insert(processed, currentNode);
      
      // Check if all children are processed, if so add parents to queue
      $.if(In(reverseAdjacencyList, currentNode)).then($ => {
        const parents = $.let(Get(reverseAdjacencyList, currentNode));
        $.forArray(parents, ($, parent) => {
          // Check if all children of parent are processed
          const allChildrenProcessed = $.let(Const(true));
          $.if(In(adjacencyList, parent)).then($ => {
            const children = $.let(Get(adjacencyList, parent));
            $.forArray(children, ($, child) => {
              $.if(Not(In(processed, child))).then($ => {
                $.assign(allChildrenProcessed, Const(false));
              });
            });
          });
          
          $.if(allChildrenProcessed).then($ => {
            const isParentInQueue = $.let(Const(false));
            $.forArray(queue, ($, queueNode) => {
              $.if(Equal(queueNode, parent)).then($ => {
                $.assign(isParentInQueue, Const(true));
              });
            });
            
            $.if(Not(isParentInQueue)).then($ => {
              $.if(Not(In(processed, parent))).then($ => {
                // Aggregate values from children
                const parentValue = $.let(Get(nodeValues, parent));
                const totalValue = $.let(parentValue);
                const allContributors = $.let(NewArray(StringType, [parent]));
                
                $.if(In(adjacencyList, parent)).then($ => {
                  const children = $.let(Get(adjacencyList, parent));
                  $.forArray(children, ($, child) => {
                    const childAggValue = $.let(Get(aggregatedValues, child));
                    $.assign(totalValue, Add(totalValue, childAggValue));
                    
                    // Add child's contributors
                    const childContributors = $.let(Get(contributingNodes, child));
                    $.forArray(childContributors, ($, contributor) => {
                      $.pushLast(allContributors, contributor);
                    });
                  });
                });
                
                $.insertOrUpdate(aggregatedValues, parent, totalValue);
                $.insertOrUpdate(contributingNodes, parent, allContributors);
                $.pushLast(queue, parent);
              });
            });
          });
        });
      });
    });
    
    // Build result
    const result = $.let(NewArray(GraphAggregationNode));
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      const aggValue = $.let(Get(aggregatedValues, nodeId));
      const contributors = $.let(Get(contributingNodes, nodeId));
      
      $.pushLast(result, Struct({
        id: nodeId,
        aggregated_value: aggValue,
        contributing_nodes: contributors
      }));
    });
    
    $.return(result);
  });