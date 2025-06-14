import { Procedure } from "@elaraai/core";
import {
  Add,
  Const,
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
} from "@elaraai/core";

import { ArrayType, FloatType, Nullable, StringType, StructType } from "@elaraai/core";

import {
  GraphNode,
  GraphWeightedEdge,
  GraphShortestPathResult,
} from "../types";

/**
 * Shortest path using Dijkstra's algorithm
 * 
 * Finds the path with minimum total weight from start to end node using Dijkstra's algorithm.
 * Handles weighted graphs where each edge has a cost/weight. Returns both the path and total cost.
 * 
 * **Example:**
 * ```
 * Input Graph:           Edge Weights:          Shortest Path:
 *     A ──┌─────┐         A→B: weight=10        Path: [A,C,D]
 *         ├─→ B (10)     A→C: weight=2         Total cost: 5.0
 *         └─→ C (2)      B→D: weight=1
 *             └─→ D (3)      C→D: weight=3
 * 
 * Alternative paths: A→B→D (cost=11), A→C→D (cost=5) ← shortest
 * ```
 * 
 * **Use Cases:**
 * - Route optimization: "What's the lowest-cost path between these points?"
 * - Resource minimization: "Which sequence minimizes total resource usage?"
 * - Efficient scheduling: "What's the fastest way to complete these dependencies?"
 * 
 * **Algorithm:** Classic Dijkstra implementation with priority queue simulation.
 * Maintains distance table and reconstructs path via predecessor tracking.
 * 
 * **Complexity:** O((V + E) log V) where V is the number of vertices and E is the number of edges.
 * 
 * @param nodes Array of graph nodes (used for initialization)
 * @param edges Array of weighted edges with from, to, and weight properties
 * @param startId ID of the starting node
 * @param endId ID of the target node
 * @returns Shortest path result with path array and total cost
 */
export const graph_shortest_path = new Procedure("graph_shortest_path")
  .input("nodes", ArrayType(GraphNode))
  .input("edges", ArrayType(GraphWeightedEdge))
  .input("startId", StringType)
  .input("endId", StringType)
  .output(GraphShortestPathResult)
  .body(($, { nodes, edges, startId, endId }) => {
    // Build weighted adjacency list
    const adjacencyList = $.let(NewDict(StringType, ArrayType(StructType({
      to: StringType,
      weight: FloatType
    }))));

    $.forArray(edges, ($, edge) => {
      const fromId = $.let(GetField(edge, "from"));
      const toId = $.let(GetField(edge, "to"));
      const weight = $.let(GetField(edge, "weight"));

      $.if(In(adjacencyList, fromId)).then($ => {
        const neighbors = $.let(Get(adjacencyList, fromId));
        $.pushLast(neighbors, Struct({ to: toId, weight: weight }));
      }).else($ => {
        $.insert(adjacencyList, fromId, NewArray(StructType({
          to: StringType,
          weight: FloatType
        }), [Struct({ to: toId, weight: weight })]));
      });
    });

    // Initialize distances and previous nodes
    const distances = $.let(NewDict(StringType, FloatType));
    const previous = $.let(NewDict(StringType, Nullable(StringType)));
    const visited = $.let(NewSet(StringType));
    const unvisited = $.let(NewArray(StringType));

    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      $.insertOrUpdate(distances, nodeId, Const(Number.POSITIVE_INFINITY));
      $.insertOrUpdate(previous, nodeId, Const(null, Nullable(StringType)));
      $.pushLast(unvisited, nodeId);
    });

    // Set start distance to 0
    $.insertOrUpdate(distances, startId, Const(0.0));

    // Dijkstra's algorithm
    $.while(Greater(Size(unvisited), Const(0n)), $ => {
      // Find unvisited node with minimum distance
      const minDistance = $.let(Const(Number.POSITIVE_INFINITY));
      const currentNode = $.let(Const(""));
      const minIndex = $.let(Const(0n));

      const index = $.let(Const(0n));
      $.forArray(unvisited, ($, nodeId) => {
        const nodeDistance = $.let(Get(distances, nodeId));
        $.if(Less(nodeDistance, minDistance)).then($ => {
          $.assign(minDistance, nodeDistance);
          $.assign(currentNode, nodeId);
          $.assign(minIndex, index);
        });
        $.assign(index, Add(index, Const(1n)));
      });

      // Remove current node from unvisited
      // Simple removal by rebuilding array without the element
      const newUnvisited = $.let(NewArray(StringType));
      const rebuildIndex = $.let(Const(0n));
      $.forArray(unvisited, ($, nodeId) => {
        $.if(Not(Equal(rebuildIndex, minIndex))).then($ => {
          $.pushLast(newUnvisited, nodeId);
        });
        $.assign(rebuildIndex, Add(rebuildIndex, Const(1n)));
      });
      $.clear(unvisited);
      $.forArray(newUnvisited, ($, nodeId) => {
        $.pushLast(unvisited, nodeId);
      });

      $.insert(visited, currentNode);

      // If we reached the end node, we can break
      $.if(Equal(currentNode, endId)).then($ => {
        $.clear(unvisited); // Force loop to end
      });

      // Update distances to neighbors
      $.if(In(adjacencyList, currentNode)).then($ => {
        const neighbors = $.let(Get(adjacencyList, currentNode));
        $.forArray(neighbors, ($, neighbor) => {
          const neighborId = $.let(GetField(neighbor, "to"));
          const edgeWeight = $.let(GetField(neighbor, "weight"));

          $.if(Not(In(visited, neighborId))).then($ => {
            const currentDistance = $.let(Get(distances, currentNode));
            const newDistance = $.let(Add(currentDistance, edgeWeight));
            const existingDistance = $.let(Get(distances, neighborId));

            $.if(Less(newDistance, existingDistance)).then($ => {
              $.insertOrUpdate(distances, neighborId, newDistance);
              $.insertOrUpdate(previous, neighborId, currentNode);
            });
          });
        });
      });
    });

    // Reconstruct shortest path
    const shortestPath = $.let(NewArray(StringType));
    const totalCost = $.let(Get(distances, endId));

    const current = $.let(endId);
    $.while(Not(Equal(current, Const(""))), $ => {
      $.pushFirst(shortestPath, current);
      const prev = $.let(Get(previous, current));

      $.ifNull(prev).then($ => {
        $.assign(current, Const(""));
      }).else(($, nonNullPrev) => {
        $.assign(current, nonNullPrev);
      });
    });

    $.return(Struct({
      shortest_path: shortestPath,
      total_cost: totalCost
    }));
  });