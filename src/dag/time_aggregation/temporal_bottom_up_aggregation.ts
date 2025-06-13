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

import { graph_build_adjacency_lists } from "../shared_utils";
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
 * Bottom-up temporal aggregation - aggregates task durations from leaf nodes upward through dependency tree
 * 
 * For each node, calculates the total duration of itself plus all its descendants (nodes that depend on it).
 * This is useful for project planning where you want to know the total time impact of starting a particular task,
 * including all the work that flows from it.
 * 
 * **Example:**
 * ```
 * Input Graph:           Calculated Durations:    Result:
 *     A ──┐                A: 10min              A: 60min (10+20+30)
 *         ├──→ B            B: 20min              B: 20min (just B)  
 *         └──→ C            C: 30min              C: 30min (just C)
 * ```
 * 
 * **Multi-level Example:**
 * ```
 * Input Graph:                 Durations:        Result:
 *     A ──┐                      A: 5min         A: 75min (5+10+15+20+25)
 *         ├──→ B ──→ D            B: 10min        B: 30min (10+20)
 *         └──→ C ──→ E            C: 15min        C: 40min (15+25)
 *                                D: 20min        D: 20min, E: 25min
 *                                E: 25min
 * ```
 * 
 * **Use Cases:**
 * - Project impact analysis: "If I start task A, how much total work is involved?"
 * - Resource planning: "What's the total duration commitment for this work stream?"
 * - Critical path analysis: "Which starting tasks have the biggest downstream impact?"
 * 
 * **Algorithm:** Uses DFS traversal to visit all descendants and sum their durations.
 * Duration is calculated using Duration(start_time, end_time, 'minute') for precise minute calculations.
 * Handles cycles, disconnected components, and complex dependency structures.
 * 
 * @param nodes Array of temporal nodes with id, type, start_time, and end_time (all required)
 * @param edges Array of directed edges representing dependencies (from → to)
 * @returns Array of aggregation results with total_duration and contributing_nodes for each input node
 */
export const graph_temporal_bottom_up_aggregation = new Procedure("graph_temporal_bottom_up_aggregation")
  .input("nodes", ArrayType(GraphTemporalNode))
  .input("edges", ArrayType(GraphEdge))
  .output(ArrayType(TemporalAggregationNode))
  .import(graph_build_adjacency_lists)
  .body(($, { nodes, edges }, procs) => {
    // Build adjacency lists using shared utility
    const adjacencyData = $.let(procs.graph_build_adjacency_lists(Struct({ edges })));
    const adjacencyList = $.let(GetField(adjacencyData, "adjacency_list"));
    
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
      
      // DFS to find all descendants and sum their durations
      const totalDuration = $.let(nodeDuration);
      const contributingNodes = $.let(NewArray(StringType, [nodeId]));
      const visited = $.let(NewSet(StringType));
      const stack = $.let(NewArray(StringType, [nodeId]));
      
      $.while(Greater(Size(stack), Const(0n)), $ => {
        const current = $.let(Get(stack, Subtract(Size(stack), Const(1n))));
        $.deleteLast(stack);
        
        $.if(Not(In(visited, current))).then($ => {
          $.insert(visited, current);
          
          // Add children to stack and process their durations
          $.if(In(adjacencyList, current)).then($ => {
            const children = $.let(ToArray(Get(adjacencyList, current)));
            $.forArray(children, ($, child) => {
              $.if(Not(In(visited, child))).then($ => {
                $.pushLast(stack, child);
                
                // Add child's duration to total
                $.if(In(nodeMap, child)).then($ => {
                  const childNode = $.let(Get(nodeMap, child));
                  const childStartTime = $.let(GetField(childNode, "start_time"));
                  const childEndTime = $.let(GetField(childNode, "end_time"));
                  const childDuration = $.let(Duration(childStartTime, childEndTime, "minute"));
                  $.assign(totalDuration, Add(totalDuration, childDuration));
                  $.pushLast(contributingNodes, child);
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