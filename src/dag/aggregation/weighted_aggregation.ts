import { Procedure } from "@elaraai/core";
import {
  Add,
  Const,
  Divide,
  Get,
  GetField,
  Greater,
  In,
  Multiply,
  NewArray,
  NewDict,
  NewSet,
  Not,
  Size,
  Struct,
  Subtract,
} from "@elaraai/core";

import { ArrayType, FloatType, StringType } from "@elaraai/core";

import { graph_build_adjacency_lists } from "../shared_utils";
import {
  GraphEdge,
  GraphValueNode,
  GraphWeightedAggregationNode,
} from "../types";

/**
 * Weighted aggregation - aggregates values using node weights from leaf nodes upward through dependency tree
 * 
 * For each node, calculates weighted sum, weighted average, and total weight of itself plus all its descendants.
 * Uses node weights to compute weighted statistics across the dependency tree. Handles null weights by defaulting to 1.0.
 * 
 * **Example:**
 * ```
 * Input Graph:           Values & Weights:           Result:
 *     A ──┐                A: 10 (w=2)               A: weighted_sum=49, weighted_avg=8.166666666666666, total_weight=6
 *         ├──→ B            B: 5 (w=1)                B: weighted_sum=5, weighted_avg=5.0, total_weight=1  
 *         └──→ C            C: 8 (w=3)                C: weighted_sum=24, weighted_avg=8.0, total_weight=3
 * ```
 * A aggregates: (10×2) + (5×1) + (8×3) = 20+5+24 = 49, average = 49÷6 = 8.166666666666666
 * 
 * **Calculations:**
 * - **weighted_sum**: Sum of (value × weight) for node and all descendants
 * - **weighted_average**: weighted_sum ÷ total_weight  
 * - **total_weight**: Sum of all weights in the subtree
 * 
 * **Use Cases:**
 * - Resource-weighted project analysis: "What's the quality-weighted impact of this work stream?"
 * - Priority-based aggregation: "How do high-priority tasks affect total project metrics?"
 * - Confidence-weighted calculations: "What's the reliability-adjusted estimate for this feature?"
 * 
 * **Algorithm:** Uses DFS traversal to visit all descendants and compute weighted statistics.
 * Null weights are treated as 1.0 for consistent calculation.
 * 
 * @param nodes Array of value nodes with id, numeric value, and optional weight (null defaults to 1.0)
 * @param edges Array of directed edges representing dependencies (from → to)
 * @returns Array of weighted aggregation results with weighted_sum, weighted_average, and total_weight for each input node
 */
export const graph_weighted_aggregation = new Procedure("graph_weighted_aggregation")
  .input("nodes", ArrayType(GraphValueNode))
  .input("edges", ArrayType(GraphEdge))
  .output(ArrayType(GraphWeightedAggregationNode))
  .import(graph_build_adjacency_lists)
  .body(($, { nodes, edges }, procs) => {
    // Build adjacency lists using shared utility
    const adjacencyData = $.let(procs.graph_build_adjacency_lists(Struct({ edges })));
    const adjacencyList = $.let(GetField(adjacencyData, "adjacency_list"));
    
    // Create node maps
    const nodeValues = $.let(NewDict(StringType, FloatType));
    const nodeWeights = $.let(NewDict(StringType, FloatType));
    
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      const value = $.let(GetField(node, "value"));
      const weight = $.let(GetField(node, "weight"));
      
      $.insertOrUpdate(nodeValues, nodeId, value);
      
      $.ifNull(weight).then($ => {
        $.insertOrUpdate(nodeWeights, nodeId, Const(1.0)); // Default weight
      }).else(($, nonNullWeight) => {
        $.insertOrUpdate(nodeWeights, nodeId, nonNullWeight);
      });
    });
    
    // Calculate weighted aggregations for each node
    const result = $.let(NewArray(GraphWeightedAggregationNode));
    
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
          
          // Add children of current
          const children = $.let(Get(adjacencyList, current, NewArray(StringType)));
          $.forArray(children, ($, child) => {
            $.if(Not(In(visited, child))).then($ => {
              $.pushLast(stack, child);
            });
          });
        });
      });
      
      // Calculate weighted sum and average including this node
      const weightedSum = $.let(Const(0.0));
      const totalWeight = $.let(Const(0.0));
      const nodeValue = $.let(Get(nodeValues, nodeId));
      const nodeWeight = $.let(Get(nodeWeights, nodeId));
      
      // Include current node
      $.assign(weightedSum, Add(weightedSum, Multiply(nodeValue, nodeWeight)));
      $.assign(totalWeight, Add(totalWeight, nodeWeight));
      
      // Include descendants
      $.forArray(descendants, ($, descendantId) => {
        const descValue = $.let(Get(nodeValues, descendantId));
        const descWeight = $.let(Get(nodeWeights, descendantId));
        $.assign(weightedSum, Add(weightedSum, Multiply(descValue, descWeight)));
        $.assign(totalWeight, Add(totalWeight, descWeight));
      });
      
      const weightedAverage = $.let(Const(0.0));
      $.if(Greater(totalWeight, Const(0.0))).then($ => {
        $.assign(weightedAverage, Divide(weightedSum, totalWeight));
      }).else($ => {
        $.assign(weightedAverage, Const(0.0));
      });
      
      $.pushLast(result, Struct({
        id: nodeId,
        weighted_sum: weightedSum,
        weighted_average: weightedAverage,
        total_weight: totalWeight
      }));
    });
    
    $.return(result);
  });