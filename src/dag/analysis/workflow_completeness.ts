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

import { ArrayType, IntegerType, StringType, StructType } from "@elaraai/core";

import { graph_build_adjacency_lists } from "../core/adjacency_lists";
import {
  GraphNode,
  GraphEdge,
} from "../types";

/**
 * Workflow completeness analysis - validates end-to-end workflow patterns
 * 
 * Analyzes the graph to determine how many complete workflows exist based on
 * user-defined patterns. A complete workflow has paths from any start type to
 * any end type within the same connected component.
 * 
 * **Example:**
 * ```
 * Input Graph:                Workflow Patterns:           Analysis:
 *     A(input) ──→ B(process)    Pattern 1:                 Complete: 1 (A→B→C)
 *     B(process) ──→ C(output)     start_types: ["input"]    Incomplete: 1 (D isolated)
 *     D(input) (isolated)          end_types: ["output"]     
 * 
 * Result: {
 *   total_patterns_checked: 1,
 *   complete_workflows: 1,
 *   incomplete_workflows: 1,
 *   workflow_details: [
 *     {
 *       start_types: ["input"],
 *       end_types: ["output"],
 *       complete_count: 1,
 *       incomplete_count: 1
 *     }
 *   ]
 * }
 * ```
 * 
 * **Use Cases:**
 * - **Process validation**: "Are all our workflows complete end-to-end?"
 * - **Quality assurance**: "Which workflows are missing endpoints?"
 * - **System completeness**: "Do we have proper input→output flows?"
 * - **Template compliance**: "Does this match our workflow requirements?"
 * 
 * **Algorithm:**
 * 1. For each workflow pattern, find nodes matching start/end types
 * 2. Use graph traversal to check connectivity between start and end nodes
 * 3. Count complete (connected) vs incomplete (disconnected) workflows
 * 4. Provide detailed breakdown per pattern
 * 
 * **Complexity:** O(P * S * (V + E)) where P = patterns, S = start nodes per pattern, V = nodes, E = edges
 * 
 * @param nodes Array of graph nodes with types
 * @param edges Array of directed edges
 * @param workflow_patterns Array of workflow definitions with start and end types
 * @returns Workflow completeness analysis with counts and details
 */
export const graph_workflow_completeness = new Procedure("graph_workflow_completeness")
  .input("nodes", ArrayType(GraphNode))
  .input("edges", ArrayType(GraphEdge))
  .input("workflow_patterns", ArrayType(StructType({
    start_types: ArrayType(StringType),
    end_types: ArrayType(StringType)
  })))
  .output(StructType({
    total_patterns_checked: IntegerType,
    complete_workflows: IntegerType,
    incomplete_workflows: IntegerType,
    workflow_details: ArrayType(StructType({
      start_types: ArrayType(StringType),
      end_types: ArrayType(StringType),
      complete_count: IntegerType,
      incomplete_count: IntegerType
    }))
  }))
  .import(graph_build_adjacency_lists)
  .body(($, { nodes, edges, workflow_patterns }, procs) => {
    const totalPatternsChecked = $.let(Size(workflow_patterns));
    const totalCompleteWorkflows = $.let(Const(0n));
    const totalIncompleteWorkflows = $.let(Const(0n));
    const workflowDetails = $.let(NewArray(StructType({
      start_types: ArrayType(StringType),
      end_types: ArrayType(StringType),
      complete_count: IntegerType,
      incomplete_count: IntegerType
    })));

    // Build adjacency lists for reachability analysis
    const adjacencyResult = $.let(procs.graph_build_adjacency_lists(Struct({
      edges: edges
    })));
    const forwardAdjacency = $.let(GetField(adjacencyResult, "adjacency_list"));

    // Create node type mapping
    const nodeTypeMap = $.let(NewDict(StringType, StringType));
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      const nodeType = $.let(GetField(node, "type"));
      $.insert(nodeTypeMap, nodeId, nodeType);
    });

    // Process each workflow pattern
    $.forArray(workflow_patterns, ($, pattern) => {
      const startTypes = $.let(GetField(pattern, "start_types"));
      const endTypes = $.let(GetField(pattern, "end_types"));
      const completeCount = $.let(Const(0n));
      const incompleteCount = $.let(Const(0n));

      // Find all start nodes matching start types
      const startNodes = $.let(NewArray(StringType));
      $.forArray(nodes, ($, node) => {
        const nodeId = $.let(GetField(node, "id"));
        const nodeType = $.let(GetField(node, "type"));
        
        // Check if this node's type is in start_types
        $.forArray(startTypes, ($, startType) => {
          $.if(Equal(nodeType, startType)).then($ => {
            $.pushLast(startNodes, nodeId);
          });
        });
      });

      // Find all end nodes matching end types
      const endNodes = $.let(NewArray(StringType));
      $.forArray(nodes, ($, node) => {
        const nodeId = $.let(GetField(node, "id"));
        const nodeType = $.let(GetField(node, "type"));
        
        // Check if this node's type is in end_types
        $.forArray(endTypes, ($, endType) => {
          $.if(Equal(nodeType, endType)).then($ => {
            $.pushLast(endNodes, nodeId);
          });
        });
      });

      // For each start node, check if it can reach any end node
      $.forArray(startNodes, ($, startNodeId) => {
        const hasCompleteWorkflow = $.let(Const(false));
        
        // Use BFS to find all reachable nodes from this start node
        const visited = $.let(NewSet(StringType));
        const queue = $.let(NewArray(StringType, [startNodeId]));
        $.insert(visited, startNodeId);

        $.while(Greater(Size(queue), Const(0n)), $ => {
          const currentNodeId = $.let(Get(queue, Const(0n)));
          $.deleteFirst(queue);

          // Check if current node is an end node
          $.forArray(endNodes, ($, endNodeId) => {
            $.if(Equal(currentNodeId, endNodeId)).then($ => {
              $.assign(hasCompleteWorkflow, Const(true));
            });
          });

          // Add neighbors to queue if not visited
          $.if(In(forwardAdjacency, currentNodeId)).then($ => {
            const neighbors = $.let(Get(forwardAdjacency, currentNodeId, NewArray(StringType)));
            $.forArray(neighbors, ($, neighborId) => {
              $.if(Not(In(visited, neighborId))).then($ => {
                $.insert(visited, neighborId);
                $.pushLast(queue, neighborId);
              });
            });
          });
        });

        // Count as complete or incomplete
        $.if(hasCompleteWorkflow).then($ => {
          $.assign(completeCount, Add(completeCount, Const(1n)));
          $.assign(totalCompleteWorkflows, Add(totalCompleteWorkflows, Const(1n)));
        }).else($ => {
          $.assign(incompleteCount, Add(incompleteCount, Const(1n)));
          $.assign(totalIncompleteWorkflows, Add(totalIncompleteWorkflows, Const(1n)));
        });
      });

      // Add details for this pattern
      $.pushLast(workflowDetails, Struct({
        start_types: startTypes,
        end_types: endTypes,
        complete_count: completeCount,
        incomplete_count: incompleteCount
      }));
    });

    $.return(Struct({
      total_patterns_checked: totalPatternsChecked,
      complete_workflows: totalCompleteWorkflows,
      incomplete_workflows: totalIncompleteWorkflows,
      workflow_details: workflowDetails
    }));
  });