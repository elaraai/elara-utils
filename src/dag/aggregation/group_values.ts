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

import { ArrayType, DictType, FloatType, StringType } from "@elaraai/core";

import { graph_build_adjacency_lists } from "../core";
import {
  GraphEdge,
  GraphGroupValueNode,
  GraphGroupAggregationNode,
} from "../types";

/**
 * Group value rollup - aggregates multi-attribute dictionary values from leaf nodes upward through dependency tree
 * 
 * For each node, sums dictionary values for all matching keys across itself and all its descendants.
 * This enables aggregation of complex multi-dimensional data (volume, quality, cost, etc.) in a single pass.
 * Each dictionary key is summed independently across the dependency tree.
 * 
 * **Example:**
 * ```
 * Input Graph:           Dictionary Values:                    Result:
 *     A ──┐                A: {volume:100, quality:0.8, cost:50}   A: {volume:180, quality:2.4, cost:100}
 *         ├──→ B            B: {volume:50, quality:0.9, cost:30}    B: {volume:50, quality:0.9, cost:30}  
 *         └──→ C            C: {volume:30, quality:0.7, cost:20}    C: {volume:30, quality:0.7, cost:20}
 * ```
 * A aggregates: volume=100+50+30=180, quality=0.8+0.9+0.7=2.4, cost=50+30+20=100
 * 
 * **Multi-level Example:**
 * ```
 * Input Graph:           Values:                           Result:
 *     A ──┐               A: {vol:200, qual:0.95}          A: {vol:400, qual:4.25} (sum all)
 *         ├──→ B ──→ D     B: {vol:80, qual:0.85}           B: {vol:120, qual:1.75} (B+D)
 *         └──→ C ──→ E     C: {vol:60, qual:0.75}           C: {vol:80, qual:1.55} (C+E)  
 *                         D: {vol:40, qual:0.9}            D: {vol:40, qual:0.9} (just D)
 *                         E: {vol:20, qual:0.8}            E: {vol:20, qual:0.8} (just E)
 * ```
 * 
 * **Use Cases:**
 * - Multi-metric project tracking: "What's the total volume, quality, and cost for this work stream?"
 * - Resource portfolio analysis: "How do CPU, memory, and storage requirements roll up?"
 * - Financial aggregation: "What are the combined revenue, expenses, and profit across divisions?"
 * 
 * **Algorithm:** Uses DFS traversal to visit all descendants and sum dictionary values by key.
 * Handles varying dictionary keys gracefully - missing keys are treated as 0.
 * 
 * **Complexity:** O(V + E + K) - DFS traversal through vertices and edges, plus dictionary operations over K keys
 * 
 * @param nodes Array of group value nodes with id and dictionary of numeric values
 * @param edges Array of directed edges representing dependencies (from → to)
 * @returns Array of group aggregation results with summed dictionary values and contributing nodes for each input node
 */
export const graph_group_value_rollup = new Procedure("graph_group_value_rollup")
  .input("nodes", ArrayType(GraphGroupValueNode))
  .input("edges", ArrayType(GraphEdge))
  .output(ArrayType(GraphGroupAggregationNode))
  .import(graph_build_adjacency_lists)
  .body(($, { nodes, edges }, procs) => {
    // Build adjacency lists using shared utility
    const adjacencyData = $.let(procs.graph_build_adjacency_lists(Struct({ edges })));
    const adjacencyList = $.let(GetField(adjacencyData, "adjacency_list"));
    
    // Create node value maps
    const nodeValues = $.let(NewDict(StringType, DictType(StringType, FloatType)));
    
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      const valueDict = $.let(GetField(node, "value"));
      
      $.insertOrUpdate(nodeValues, nodeId, valueDict);
    });
    
    // Calculate multi-attribute rollups for each node
    const result = $.let(NewArray(GraphGroupAggregationNode));
    
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      
      // Find all descendants using DFS
      const descendants = $.let(NewArray(StringType));
      const visited = $.let(NewSet(StringType));
      const stack = $.let(Get(adjacencyList, nodeId, NewArray(StringType)));
      
      $.while(Greater(Size(stack), Const(0n)), $ => {
        const current = $.let(Get(stack, Subtract(Size(stack), Const(1n))));
        $.deleteLast(stack);
        
        $.if(Not(In(visited, current))).then($ => {
          $.insert(visited, current);
          $.pushLast(descendants, current);
          
          const children = $.let(Get(adjacencyList, current, NewArray(StringType)));
          $.forArray(children, ($, child) => {
            $.if(Not(In(visited, child))).then($ => {
              $.pushLast(stack, child);
            });
          });
        });
      });
      
      // Aggregate values from dictionary generically
      const nodeValueDict = $.let(Get(nodeValues, nodeId));
      const aggregatedDict = $.let(NewDict(StringType, FloatType));
      const contributors = $.let(NewArray(StringType, [nodeId]));
      
      // Initialize aggregated dict with current node's values
      $.forDict(nodeValueDict, ($, value, key) => {
        $.insertOrUpdate(aggregatedDict, key, value);
      });
      
      // Add values from descendants
      $.forArray(descendants, ($, descendantId) => {
        $.pushLast(contributors, descendantId);
        const descendantDict = $.let(Get(nodeValues, descendantId));
        
        $.forDict(descendantDict, ($, value, key) => {
          const existingValue = $.let(Get(aggregatedDict, key, Const(0.0)));
          $.insertOrUpdate(aggregatedDict, key, Add(existingValue, value));
        });
      });
      
      $.pushLast(result, Struct({
        id: nodeId,
        aggregated_values: aggregatedDict,
        contributing_nodes: contributors
      }));
    });
    
    $.return(result);
  });