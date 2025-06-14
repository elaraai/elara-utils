import { Procedure } from "@elaraai/core";
import {
  Add,
  Const,
  Duration,
  Equal,
  Get,
  GetField,
  Greater,
  In,
  Less,
  NewArray,
  NewDict,
  NewSet,
  Not,
  Size,
  Struct,
  Subtract,
} from "@elaraai/core";

import { ArrayType, FloatType, StringType } from "@elaraai/core";

import { graph_build_adjacency_lists } from "../core";
import {
  GraphTemporalNode,
  GraphEdge,
  GraphCriticalPathResult,
} from "../types";

/**
 * Critical path analysis for project scheduling
 * 
 * Identifies the longest path through a project network to determine project duration
 * and critical tasks. Uses forward and backward pass algorithms to calculate earliest
 * start times and latest finish times, then identifies the critical path.
 * 
 * **Example:**
 * ```
 * Input Tasks:                    Critical Path Analysis:
 *     A(4min) ──┌─────┐        Earliest Start: A=0, B=4, C=4, D=10
 *               ├─→ B(6min)   Latest Finish: A=4, B=10, C=6, D=14
 *               └─→ C(2min)   Critical Path: [A, B, D] (total: 14min)
 *                   └─┬─→ D(4min)
 * 
 * B is critical (no slack), C has 2min slack
 * ```
 * 
 * **Use Cases:**
 * - Project management: "Which tasks cannot be delayed without affecting project completion?"
 * - Schedule optimization: "What's the minimum project duration?"
 * - Resource allocation: "Which tasks need priority attention?"
 * 
 * **Algorithm:** Performs forward pass (earliest start) and backward pass (latest finish)
 * calculations, then traces the longest path through tasks with zero slack.
 * 
 * **Complexity:** O(V + E) where V is the number of vertices and E is the number of edges.
 * Each forward and backward pass visits each vertex and edge exactly once in topological order.
 * 
 * @param nodes Array of temporal nodes with id, type, start_time, and end_time
 * @param edges Array of directed edges representing task dependencies (from → to)
 * @returns Critical path result with path array and total project duration
 */
export const graph_critical_path = new Procedure("graph_critical_path")
  .input("nodes", ArrayType(GraphTemporalNode))
  .input("edges", ArrayType(GraphEdge))
  .output(GraphCriticalPathResult)
  .import(graph_build_adjacency_lists)
  .body(($, { nodes, edges }, procs) => {
    // Build adjacency lists using shared utility
    const adjacencyData = $.let(procs.graph_build_adjacency_lists(Struct({ edges })));
    const adjacencyList = $.let(GetField(adjacencyData, "adjacency_list"));
    const reverseAdjacencyList = $.let(GetField(adjacencyData, "reverse_adjacency_list"));

    // Create node duration map
    const nodeDurations = $.let(NewDict(StringType, FloatType));
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      const startTime = $.let(GetField(node, "start_time"));
      const endTime = $.let(GetField(node, "end_time"));
      const duration = $.let(Duration(startTime, endTime, "minute"));
      $.insertOrUpdate(nodeDurations, nodeId, duration);
    });

    // Calculate earliest start times (forward pass)
    const earliestStart = $.let(NewDict(StringType, FloatType));

    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      $.insertOrUpdate(earliestStart, nodeId, Const(0.0));
    });

    // Topological order processing for earliest start
    const processed = $.let(NewSet(StringType));
    const queue = $.let(NewArray(StringType));

    // Find nodes with no dependencies (start nodes)
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      $.if(Not(In(reverseAdjacencyList, nodeId))).then($ => {
        $.pushLast(queue, nodeId);
      });
    });

    $.while(Greater(Size(queue), Const(0n)), $ => {
      const currentNode = $.let(Get(queue, Const(0n)));
      $.deleteFirst(queue);
      $.insert(processed, currentNode);

      $.if(In(adjacencyList, currentNode)).then($ => {
        const children = $.let(Get(adjacencyList, currentNode));
        $.forArray(children, ($, child) => {
          const currentEarliest = $.let(Get(earliestStart, currentNode));
          const currentDuration = $.let(Get(nodeDurations, currentNode));
          const childEarliest = $.let(Add(currentEarliest, currentDuration));
          const existingChildEarliest = $.let(Get(earliestStart, child));

          $.if(Greater(childEarliest, existingChildEarliest)).then($ => {
            $.insertOrUpdate(earliestStart, child, childEarliest);
          });

          // Check if all parents of child are processed
          const allParentsProcessed = $.let(Const(true));
          $.if(In(reverseAdjacencyList, child)).then($ => {
            const parents = $.let(Get(reverseAdjacencyList, child));
            $.forArray(parents, ($, parent) => {
              $.if(Not(In(processed, parent))).then($ => {
                $.assign(allParentsProcessed, Const(false));
              });
            });
          });

          $.if(allParentsProcessed).then($ => {
            const isChildInQueue = $.let(Const(false));
            $.forArray(queue, ($, queueNode) => {
              $.if(Equal(queueNode, child)).then($ => {
                $.assign(isChildInQueue, Const(true));
              });
            });
            $.if(Not(isChildInQueue)).then($ => {
              $.pushLast(queue, child);
            });
          });
        });
      });
    });

    // Find project end time (maximum earliest start + duration)
    const projectEndTime = $.let(Const(0.0));
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      const nodeEarliest = $.let(Get(earliestStart, nodeId));
      const nodeDuration = $.let(Get(nodeDurations, nodeId));
      const nodeFinish = $.let(Add(nodeEarliest, nodeDuration));

      $.if(Greater(nodeFinish, projectEndTime)).then($ => {
        $.assign(projectEndTime, nodeFinish);
      });
    });

    // Calculate latest finish times (backward pass)
    const latestFinish = $.let(NewDict(StringType, FloatType));

    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      $.insertOrUpdate(latestFinish, nodeId, projectEndTime);
    });

    // Backward pass in reverse topological order
    $.clear(processed);
    $.clear(queue);

    // Find end nodes (no successors)
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      $.if(Not(In(adjacencyList, nodeId))).then($ => {
        $.pushLast(queue, nodeId);
      });
    });

    $.while(Greater(Size(queue), Const(0n)), $ => {
      const currentNode = $.let(Get(queue, Const(0n)));
      $.deleteFirst(queue);
      $.insert(processed, currentNode);

      $.if(In(reverseAdjacencyList, currentNode)).then($ => {
        const parents = $.let(Get(reverseAdjacencyList, currentNode));
        $.forArray(parents, ($, parent) => {
          const currentLatest = $.let(Get(latestFinish, currentNode));
          const parentDuration = $.let(Get(nodeDurations, parent));
          const parentLatest = $.let(Subtract(currentLatest, parentDuration));
          const existingParentLatest = $.let(Get(latestFinish, parent));

          $.if(Less(parentLatest, existingParentLatest)).then($ => {
            $.insertOrUpdate(latestFinish, parent, parentLatest);
          });

          // Add unprocessed parents to queue
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
              $.pushLast(queue, parent);
            });
          });
        });
      });
    });

    // Find critical path by identifying nodes on the longest path
    const criticalPath = $.let(NewArray(StringType));

    // Find the node with the maximum finish time (project end)
    const endNode = $.let(Const(""));
    const maxFinish = $.let(Const(0.0));
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      const nodeEarliest = $.let(Get(earliestStart, nodeId));
      const nodeDuration = $.let(Get(nodeDurations, nodeId));
      const nodeFinish = $.let(Add(nodeEarliest, nodeDuration));

      $.if(Greater(nodeFinish, maxFinish)).then($ => {
        $.assign(maxFinish, nodeFinish);
        $.assign(endNode, nodeId);
      });
    });

    // Trace backwards from end node to find critical path
    const pathStack = $.let(NewArray(StringType));
    const current = $.let(endNode);

    $.while(Not(Equal(current, Const(""))), $ => {
      $.pushLast(pathStack, current);

      // Find predecessor that contributes to critical path
      const predecessor = $.let(Const(""));
      const currentEarliest = $.let(Get(earliestStart, current));

      $.if(In(reverseAdjacencyList, current)).then($ => {
        const parents = $.let(Get(reverseAdjacencyList, current));
        $.forArray(parents, ($, parent) => {
          const parentEarliest = $.let(Get(earliestStart, parent));
          const parentDuration = $.let(Get(nodeDurations, parent));
          const parentFinish = $.let(Add(parentEarliest, parentDuration));

          // Parent is on critical path if its finish time equals current's earliest start
          $.if(Equal(parentFinish, currentEarliest)).then($ => {
            $.assign(predecessor, parent);
          });
        });
      });

      $.assign(current, predecessor);
    });

    // Reverse the path stack to get correct order
    $.while(Greater(Size(pathStack), Const(0n)), $ => {
      const lastNode = $.let(Get(pathStack, Subtract(Size(pathStack), Const(1n))));
      $.deleteLast(pathStack);
      $.pushLast(criticalPath, lastNode);
    });

    $.return(Struct({
      critical_path: criticalPath,
      total_duration: projectEndTime
    }));
  });