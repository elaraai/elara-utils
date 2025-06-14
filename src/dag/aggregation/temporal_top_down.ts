import { Procedure } from "@elaraai/core";
import {
  Add,
  Const,
  Duration,
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
  ToArray,
} from "@elaraai/core";

import { ArrayType, FloatType, StringType, StructType } from "@elaraai/core";

import { graph_build_adjacency_lists } from "../core";
import { 
    GraphTemporalNode, 
    GraphEdge
} from "../types";

// Temporal aggregation result node
export const TemporalAggregationNode = StructType({
    id: StringType,
    total_duration: FloatType,
    contributing_nodes: ArrayType(StringType)
});
export type TemporalAggregationNode = typeof TemporalAggregationNode;

/**
 * Top-down temporal aggregation - aggregates task durations from root nodes downward through dependency tree
 * 
 * For each node, calculates the total duration of itself plus all its ancestors (nodes it depends on).
 * This is useful for understanding the total prerequisite work needed before a task can complete.
 * 
 * **Example:**
 * ```
 * Input Graph:           Calculated Durations:    Result:
 *     A ──┐                A: 10min              A: 10min (just A - root)
 *         ├──→ B            B: 20min              B: 30min (A + B)  
 *         └──→ C            C: 30min              C: 40min (A + C)
 * ```
 * 
 * **Multi-level Example:**
 * ```
 * Input Graph:                 Durations:        Result:
 *     A ──┐                      A: 5min         A: 5min (just A - root)
 *         ├──→ B ──→ D            B: 10min        B: 15min (A + B)
 *         └──→ C ──→ E            C: 15min        C: 20min (A + C)
 *                                D: 20min        D: 35min (A + B + D)
 *                                E: 25min        E: 45min (A + C + E)
 * ```
 * 
 * **Use Cases:**
 * - Dependency analysis: "What's the total prerequisite work for this task?"
 * - Timeline planning: "How much cumulative effort leads up to this deliverable?"
 * - Bottleneck identification: "Which end tasks have the longest dependency chains?"
 * 
 * **Algorithm:** Uses DFS traversal to visit all ancestors and sum their durations.
 * Duration is calculated using Duration(start_time, end_time, 'minute') for precise minute calculations.
 * Handles cycles, disconnected components, and complex dependency structures.
 * 
 * **Complexity:** O(V + E) for temporal tree traversal
 * 
 * @param nodes Array of temporal nodes with id, type, start_time, and end_time (all required)
 * @param edges Array of directed edges representing dependencies (from → to)
 * @returns Array of aggregation results with total_duration and contributing_nodes for each input node
 */
export const graph_temporal_top_down_aggregation = new Procedure("graph_temporal_top_down_aggregation")
  .input("nodes", ArrayType(GraphTemporalNode))
  .input("edges", ArrayType(GraphEdge))
  .output(ArrayType(TemporalAggregationNode))
  .import(graph_build_adjacency_lists)
  .body(($, { nodes, edges }, procs) => {
    // Build adjacency lists using shared utility
    const adjacencyData = $.let(procs.graph_build_adjacency_lists(Struct({ edges })));
    const reverseAdjacencyList = $.let(GetField(adjacencyData, "reverse_adjacency_list"));
    
    // Create node lookup map
    const nodeMap = $.let(NewDict(StringType, GraphTemporalNode));
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      $.insert(nodeMap, nodeId, node);
    });
    
    // Calculate aggregated durations for each node
    const result = $.let(NewArray(TemporalAggregationNode));
    
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      const startTime = $.let(GetField(node, "start_time"));
      const endTime = $.let(GetField(node, "end_time"));
      
      // Calculate duration in minutes using Duration function
      const nodeDuration = $.let(Duration(startTime, endTime, "minute"));
      
      // DFS to find all ancestors and sum their durations
      const totalDuration = $.let(nodeDuration);
      const contributingNodes = $.let(NewArray(StringType, [nodeId]));
      const visited = $.let(NewSet(StringType));
      const stack = $.let(NewArray(StringType, [nodeId]));
      
      $.while(Greater(Size(stack), Const(0n)), $ => {
        const current = $.let(Get(stack, Subtract(Size(stack), Const(1n))));
        $.deleteLast(stack);
        
        $.if(Not(In(visited, current))).then($ => {
          $.insert(visited, current);
          
          // Add parents to stack and process their durations
          $.if(In(reverseAdjacencyList, current)).then($ => {
            const parents = $.let(ToArray(Get(reverseAdjacencyList, current)));
            $.forArray(parents, ($, parent) => {
              $.if(Not(In(visited, parent))).then($ => {
                $.pushLast(stack, parent);
                
                // Add parent's duration to total
                $.if(In(nodeMap, parent)).then($ => {
                  const parentNode = $.let(Get(nodeMap, parent));
                  const parentStartTime = $.let(GetField(parentNode, "start_time"));
                  const parentEndTime = $.let(GetField(parentNode, "end_time"));
                  const parentDuration = $.let(Duration(parentStartTime, parentEndTime, "minute"));
                  $.assign(totalDuration, Add(totalDuration, parentDuration));
                  $.pushLast(contributingNodes, parent);
                });
              });
            });
          });
        });
      });
      
      $.pushLast(result, Struct({
        id: nodeId,
        total_duration: totalDuration,
        contributing_nodes: contributingNodes
      }));
    });
    
    $.return(result);
  });