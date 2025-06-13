import { Procedure } from "@elaraai/core";
import {
  Add,
  Const,
  Divide,
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

import { graph_build_adjacency_lists } from "../shared_utils";
import {
  GraphEdge,
  GraphValueNode,
  GraphAggregationNode,
} from "../types";

/**
 * Top-down aggregation - distributes values from parent nodes downward through dependency tree
 * 
 * For each node, calculates its own value plus a distributed portion of all its ancestors' values.
 * Parent values are distributed equally among all direct children. This is useful for resource 
 * allocation where parent resources need to be shared among dependent tasks.
 * 
 * **Example:**
 * ```
 * Input Graph:           Node Values:          Result:
 *     A ──┐                A: 10                A: 10.0 (just A - root)
 *         ├──→ B            B: 2                 B: 7.0 (2 + 10/2)  
 *         └──→ C            C: 3                 C: 8.0 (3 + 10/2)
 * ```
 * A's value (10) is split equally between B and C (5 each), then added to their own values.
 * 
 * **Multi-level Example:**
 * ```
 * Input Graph:                 Values:          Result:
 *     A ──┐                      A: 12          A: 12.0 (just A - root)
 *         ├──→ B ──→ D            B: 2           B: 8.0 (2 + 12/2)
 *         └──→ C                  C: 3           C: 9.0 (3 + 12/2)
 *                                D: 1           D: 9.0 (1 + all of B's 8.0)
 * ```
 * A distributes 6 to each child (B, C). D gets all of B's accumulated value.
 * 
 * **Use Cases:**
 * - Resource allocation: "How should parent resources be distributed to dependent tasks?"
 * - Budget distribution: "What's the total allocated budget for each task including inheritance?"
 * - Cost sharing: "How do shared costs flow down through organizational hierarchies?"
 * 
 * **Algorithm:** Distributes parent values equally among direct children, then accumulates down the tree.
 * Each node gets its own value plus distributed values from all ancestors.
 * 
 * @param nodes Array of value nodes with id and numeric value
 * @param edges Array of directed edges representing dependencies (from → to)
 * @returns Array of aggregation results with total distributed value and contributing nodes for each input node
 */
export const graph_top_down_aggregation = new Procedure("graph_top_down_aggregation")
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
    
    // Find root nodes (no parents)
    const rootNodes = $.let(NewArray(StringType));
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      $.if(Not(In(reverseAdjacencyList, nodeId))).then($ => {
        $.pushLast(rootNodes, nodeId);
      });
    });
    
    // Process nodes top-down using BFS
    const processed = $.let(NewSet(StringType));
    const queue = $.let(NewArray(StringType));
    const distributedValues = $.let(NewDict(StringType, FloatType));
    const contributingNodes = $.let(NewDict(StringType, ArrayType(StringType)));
    
    // Initialize root nodes
    $.forArray(rootNodes, ($, rootId) => {
      $.pushLast(queue, rootId);
      const rootValue = $.let(Get(nodeValues, rootId));
      $.insertOrUpdate(distributedValues, rootId, rootValue);
      $.insertOrUpdate(contributingNodes, rootId, NewArray(StringType, [rootId]));
    });
    
    $.while(Greater(Size(queue), Const(0n)), $ => {
      const currentNode = $.let(Get(queue, Const(0n)));
      $.deleteFirst(queue);
      $.insert(processed, currentNode);
      
      // Distribute value to children
      $.if(In(adjacencyList, currentNode)).then($ => {
        const children = $.let(Get(adjacencyList, currentNode));
        const childrenCount = $.let(Size(children));
        const currentDistributedValue = $.let(Get(distributedValues, currentNode));
        const currentContributors = $.let(Get(contributingNodes, currentNode));
        
        $.if(Greater(childrenCount, Const(0n))).then($ => {
          const valuePerChild = $.let(Divide(currentDistributedValue, childrenCount));
          
          $.forArray(children, ($, child) => {
            const childOwnValue = $.let(Get(nodeValues, child));
            const childTotalValue = $.let(Add(childOwnValue, valuePerChild));
            
            // Combine contributors
            const childContributors = $.let(NewArray(StringType, [child]));
            $.forArray(currentContributors, ($, contributor) => {
              $.pushLast(childContributors, contributor);
            });
            
            $.insertOrUpdate(distributedValues, child, childTotalValue);
            $.insertOrUpdate(contributingNodes, child, childContributors);
            
            $.if(Not(In(processed, child))).then($ => {
              $.pushLast(queue, child);
            });
          });
        });
      });
    });
    
    // Build result
    const result = $.let(NewArray(GraphAggregationNode));
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      const distValue = $.let(Get(distributedValues, nodeId, Const(0.0)));
      const contributors = $.let(Get(contributingNodes, nodeId, NewArray(StringType)));
      
      $.pushLast(result, Struct({
        id: nodeId,
        aggregated_value: distValue,
        contributing_nodes: contributors
      }));
    });
    
    $.return(result);
  });