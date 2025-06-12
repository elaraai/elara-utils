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

import { ArrayType, FloatType, IntegerType, Nullable, SetType, StringType, StructType } from "@elaraai/core";

import { graph_build_adjacency_lists } from "./shared_utils";
import {
  GraphNode,
  GraphEdge,
  GraphWeightedEdge,
  GraphTemporalNode,
  GraphPathResult,
  GraphPathNode,
  GraphShortestPathResult,
  GraphCriticalPathResult,
  PathSubgraph,
  PathSubgraphsResult,
} from "./types";

/**
 * All paths enumeration - finds all possible paths between two nodes in a directed graph
 * 
 * Discovers every distinct path from a start node to an end node, useful for analyzing
 * alternative routes, redundancy, or exploring all possible execution flows. Uses DFS 
 * with backtracking to exhaustively enumerate paths.
 * 
 * **Example - Simple Diamond:**
 * ```
 * Input Graph:           All Paths A→D:
 *     A ──┐               Path 1: A → C → D
 *         ├──→ B          Path 2: A → B → D  
 *         └──→ C
 *             └─┬──→ D    Result: {paths: [["A","C","D"], ["A","B","D"]], path_count: 2}
 *               └───→ D
 * ```
 * 
 * **Example - Complex Network:**
 * ```
 * Input Graph:           All Paths A→E:
 *     A ──┐               Path 1: A → B → E
 *         ├──→ B ──┐      Path 2: A → B → D → E
 *         └──→ C   ├──→ E Path 3: A → C → D → E
 *             └──→ D ──┘
 * 
 * Result: {paths: [["A","B","E"], ["A","B","D","E"], ["A","C","D","E"]], path_count: 3}
 * ```
 * 
 * **Example - No Path:**
 * ```
 * Input Graph:           All Paths A→C:
 *     A ──→ B             No connection to C
 *     C (isolated)        
 * 
 * Result: {paths: [], path_count: 0}
 * ```
 * 
 * **Use Cases:**
 * - Route planning: "What are all possible routes between these locations?"
 * - Dependency analysis: "How many ways can task A lead to task B?"
 * - Network resilience: "If some paths fail, what alternatives exist?"
 * 
 * **Algorithm:** Uses DFS with backtracking and cycle detection. Maintains current path
 * and backtracks when reaching dead ends or target node. Handles cycles by avoiding revisiting nodes in current path.
 * 
 * @param nodes Array of graph nodes (used for validation)
 * @param edges Array of directed edges representing connections (from → to)
 * @param startId ID of the starting node
 * @param endId ID of the target node
 * @returns Path result with array of all paths and total path count
 */
export const graph_all_paths = new Procedure("graph_all_paths")
  .input("nodes", ArrayType(GraphNode))
  .input("edges", ArrayType(GraphEdge))
  .input("startId", StringType)
  .input("endId", StringType)
  .output(GraphPathResult)
  .import(graph_build_adjacency_lists)
  .body(($, { edges, startId, endId }, procs) => {
    // Build adjacency lists using shared utility
    const adjacencyData = $.let(procs.graph_build_adjacency_lists(Struct({ edges })));
    const adjacencyList = $.let(GetField(adjacencyData, "adjacency_list"));
    
    const allPaths = $.let(NewArray(ArrayType(StringType)));

    // DFS to find all paths
    const dfsStack = $.let(NewArray(StringType, [startId]));
    const pathStack = $.let(NewArray(ArrayType(StringType), [NewArray(StringType, [startId])]));
    
    $.while(Greater(Size(dfsStack), Const(0n)), $ => {
      const currentNode = $.let(Get(dfsStack, Subtract(Size(dfsStack), Const(1n))));
      const currentPathState = $.let(Get(pathStack, Subtract(Size(pathStack), Const(1n))));
      $.deleteLast(dfsStack);
      $.deleteLast(pathStack);
      
      $.if(Equal(currentNode, endId)).then($ => {
        // Found a path to end
        $.pushLast(allPaths, currentPathState);
      }).else($ => {
        // Continue searching
        $.if(In(adjacencyList, currentNode)).then($ => {
          const neighbors = $.let(Get(adjacencyList, currentNode));
          $.forArray(neighbors, ($, neighbor) => {
            // Check if neighbor is already in current path (avoid cycles)
            const isInPath = $.let(Const(false));
            $.forArray(currentPathState, ($, pathNode) => {
              $.if(Equal(pathNode, neighbor)).then($ => {
                $.assign(isInPath, Const(true));
              });
            });
            
            $.if(Not(isInPath)).then($ => {
              // Extend path with neighbor
              const newPath = $.let(NewArray(StringType));
              $.forArray(currentPathState, ($, pathNode) => {
                $.pushLast(newPath, pathNode);
              });
              $.pushLast(newPath, neighbor);
              
              $.pushLast(dfsStack, neighbor);
              $.pushLast(pathStack, newPath);
            });
          });
        });
      });
    });
    
    $.return(Struct({
      paths: allPaths,
      path_count: Size(allPaths)
    }));
  });

/**
 * Path membership analysis - determines which paths each node belongs to
 * 
 * For each node, identifies all the paths (from start to end) that pass through it.
 * Uses the `graph_all_paths` procedure to find all possible paths, then analyzes
 * which nodes participate in which paths.
 * 
 * **Example:**
 * ```
 * Input Graph:           All Paths A→D:           Path Membership:
 *     A ──┌──────┐           Path 0: [A,C,D]        A: belongs to paths [0,1]
 *         ├──→ B       Path 1: [A,B,D]        B: belongs to path [1]
 *         └──→ C                               C: belongs to path [0]
 *             └─┬──→ D                               D: belongs to paths [0,1]
 * ```
 * 
 * **Use Cases:**
 * - Critical node analysis: "Which nodes are on the most paths?"
 * - Redundancy analysis: "If this node fails, how many paths are affected?"
 * - Path diversity: "Which nodes provide alternative routing options?"
 * 
 * **Algorithm:** First finds all paths using DFS, then for each node checks
 * which path indices it appears in.
 * 
 * @param nodes Array of graph nodes (used for validation)
 * @param edges Array of directed edges representing connections (from → to)
 * @param startId ID of the starting node
 * @param endId ID of the target node
 * @returns Array of path nodes with id and array of path indices the node belongs to
 */
// Path membership analysis - which paths each node belongs to
export const graph_path_membership = new Procedure("graph_path_membership")
  .input("nodes", ArrayType(GraphNode))
  .input("edges", ArrayType(GraphEdge))
  .input("startId", StringType)
  .input("endId", StringType)
  .output(ArrayType(GraphPathNode))
  .import(graph_all_paths)
  .body(($, { nodes, edges, startId, endId }, procs) => {
    // Use existing all_paths procedure to find all paths
    const pathResult = $.let(procs.graph_all_paths(Struct({ 
      nodes, 
      edges, 
      startId, 
      endId 
    })));
    const allPaths = $.let(GetField(pathResult, "paths"));
    
    // Now analyze path membership for each node
    const result = $.let(NewArray(GraphPathNode));
    
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      const pathMembership = $.let(NewArray(IntegerType));
      
      // Check which paths this node belongs to
      const pathIndex = $.let(Const(0n));
      $.forArray(allPaths, ($, path) => {
        const isInThisPath = $.let(Const(false));
        $.forArray(path, ($, pathNode) => {
          $.if(Equal(pathNode, nodeId)).then($ => {
            $.assign(isInThisPath, Const(true));
          });
        });
        
        $.if(isInThisPath).then($ => {
          $.pushLast(pathMembership, pathIndex);
        });
        
        $.assign(pathIndex, Add(pathIndex, Const(1n)));
      });
      
      $.pushLast(result, Struct({
        id: nodeId,
        path_membership: pathMembership
      }));
    });
    
    $.return(result);
  });

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
 * @param nodes Array of graph nodes (used for initialization)
 * @param edges Array of weighted edges with from, to, and weight properties
 * @param startId ID of the starting node
 * @param endId ID of the target node
 * @returns Shortest path result with path array and total cost
 */
// Shortest path using Dijkstra's algorithm
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
 * @param nodes Array of temporal nodes with id, type, start_time, and end_time
 * @param edges Array of directed edges representing task dependencies (from → to)
 * @returns Critical path result with path array and total project duration
 */
// Critical path analysis for project scheduling
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

/**
 * Extract all subgraphs that contain paths leading to specified target node types.
 * Uses backward traversal to ensure complete coverage of all possible routes to targets.
 * 
 * **Algorithm**: For each target node, performs backward DFS traversal to find all 
 * nodes that can reach it. Groups connected components that share the same target.
 * 
 * **Example - Multiple Targets:**
 * ```
 * Input Graph:                    Result Subgraphs:
 *     A ──→ B ──→ D (target)      Subgraph 1: {nodes: [A,B,D], edges: [A→B,B→D], 
 *     │                                        source_nodes: [A], target_nodes: [D]}
 *     └──→ C ──→ E (target)       Subgraph 2: {nodes: [A,C,E], edges: [A→C,C→E],
 *                                              source_nodes: [A], target_nodes: [E]}
 * ```
 * 
 * @param nodes - All nodes in the full graph
 * @param edges - All edges in the full graph  
 * @param source_node_types - Node types to treat as start points (can be empty)
 * @param target_node_types - Node types to treat as endpoints (must have elements)
 * @returns PathSubgraphsResult containing all subgraphs leading to targets
 */
export const graph_subgraphs_from_targets = new Procedure("graph_subgraphs_from_targets")
    .input("nodes", ArrayType(GraphNode))
    .input("edges", ArrayType(GraphEdge))
    .input("source_node_types", SetType(StringType))
    .input("target_node_types", SetType(StringType))
    .output(PathSubgraphsResult)
    .body(($, { nodes, edges, source_node_types, target_node_types }) => {
        // Validate target_node_types is not empty
        $.if(Equal(Size(target_node_types), Const(0n))).then($ => {
            $.error(Const("target_node_types must contain at least one element"));
        });

        // Build reverse adjacency list (for backward traversal)
        const reverseAdjacencyList = $.let(NewDict(StringType, ArrayType(StringType)));
        
        $.forArray(edges, ($, edge) => {
            const fromId = $.let(GetField(edge, "from"));
            const toId = $.let(GetField(edge, "to"));
            
            // Build reverse adjacency (to -> from)
            $.if(In(reverseAdjacencyList, toId)).then($ => {
                const parents = $.let(Get(reverseAdjacencyList, toId));
                $.pushLast(parents, fromId);
            }).else($ => {
                $.insert(reverseAdjacencyList, toId, NewArray(StringType, [fromId]));
            });
        });

        // Create node lookup dictionary
        const nodeDict = $.let(NewDict(StringType, GraphNode));
        $.forArray(nodes, ($, node) => {
            const nodeId = $.let(GetField(node, "id"));
            $.insert(nodeDict, nodeId, node);
        });

        // Find all target nodes
        const targetNodes = $.let(NewArray(GraphNode));
        $.forArray(nodes, ($, node) => {
            const nodeType = $.let(GetField(node, "type"));
            $.if(In(target_node_types, nodeType)).then($ => {
                $.pushLast(targetNodes, node);
            });
        });

        // If no target nodes found, return empty result
        $.if(Equal(Size(targetNodes), Const(0n))).then($ => {
            $.return(Struct({
                subgraphs: NewArray(PathSubgraph)
            }));
        });

        // For each connected component containing targets, perform backward traversal
        const globalVisited = $.let(NewSet(StringType));
        const subgraphs = $.let(NewArray(PathSubgraph));

        $.forArray(targetNodes, ($, targetNode) => {
            const targetId = $.let(GetField(targetNode, "id"));
            
            // Skip if already processed in another subgraph
            $.if(Not(In(globalVisited, targetId))).then($ => {
                // Backward traversal from this target
                const subgraphNodes = $.let(NewSet(StringType));
                const subgraphEdges = $.let(NewArray(GraphEdge));
                const stack = $.let(NewArray(StringType, [targetId]));
                const visited = $.let(NewSet(StringType));

                $.while(Greater(Size(stack), Const(0n)), $ => {
                    const current = $.let(Get(stack, Subtract(Size(stack), Const(1n))));
                    $.deleteLast(stack);

                    $.if(Not(In(visited, current))).then($ => {
                        $.insert(visited, current);
                        $.insert(subgraphNodes, current);

                        // Add parents to stack for backward traversal
                        $.if(In(reverseAdjacencyList, current)).then($ => {
                            const parents = $.let(Get(reverseAdjacencyList, current));
                            $.forArray(parents, ($, parent) => {
                                // Collect edge during traversal
                                $.pushLast(subgraphEdges, Struct({from: parent, to: current}));
                                
                                $.if(Not(In(visited, parent))).then($ => {
                                    $.pushLast(stack, parent);
                                });
                            });
                        });
                    });
                });

                // Mark all nodes in this subgraph as globally visited
                $.forSet(subgraphNodes, ($, nodeId) => {
                    $.insertOrUpdate(globalVisited, nodeId);
                });

                // Extract nodes for this subgraph
                const subgraphNodeArray = $.let(NewArray(GraphNode));
                const subgraphSourceNodes = $.let(NewArray(GraphNode));
                const subgraphTargetNodes = $.let(NewArray(GraphNode));
                
                $.forSet(subgraphNodes, ($, nodeId) => {
                    const node = $.let(Get(nodeDict, nodeId));
                    $.pushLast(subgraphNodeArray, node);
                    
                    const nodeType = $.let(GetField(node, "type"));
                    
                    // Check if it's a source node (if source_node_types is not empty)
                    $.if(Greater(Size(source_node_types), Const(0n))).then($ => {
                        $.if(In(source_node_types, nodeType)).then($ => {
                            $.pushLast(subgraphSourceNodes, node);
                        });
                    }).else($ => {
                        // If source_node_types is empty, nodes with no incoming edges are sources
                        $.if(Not(In(reverseAdjacencyList, nodeId))).then($ => {
                            $.pushLast(subgraphSourceNodes, node);
                        });
                    });
                    
                    // Check if it's a target node
                    $.if(In(target_node_types, nodeType)).then($ => {
                        $.pushLast(subgraphTargetNodes, node);
                    });
                });

                // Edges already collected during traversal

                // Create subgraph and add to results
                const subgraph = $.let(Struct({
                    nodes: subgraphNodeArray,
                    edges: subgraphEdges,
                    source_nodes: subgraphSourceNodes,
                    target_nodes: subgraphTargetNodes
                }));
                
                $.pushLast(subgraphs, subgraph);
            });
        });

        $.return(Struct({
            subgraphs: subgraphs
        }));
    });

/**
 * Extract all subgraphs that contain paths starting from specified source node types.
 * Uses forward traversal to find all reachable destinations from source nodes.
 * 
 * **Algorithm**: For each source node, performs forward DFS traversal to find all 
 * reachable nodes. Groups connected components that share the same source.
 * 
 * **Example - Multiple Sources:**
 * ```
 * Input Graph:                    Result Subgraphs:
 *     A (source) ──→ C ──→ E      Subgraph 1: {nodes: [A,C,E], edges: [A→C,C→E],
 *                                             source_nodes: [A], target_nodes: [E]}
 *     B (source) ──→ D ──→ E      Subgraph 2: {nodes: [B,D,E], edges: [B→D,D→E],
 *                                             source_nodes: [B], target_nodes: [E]}
 * ```
 * 
 * @param nodes - All nodes in the full graph
 * @param edges - All edges in the full graph
 * @param source_node_types - Node types to treat as start points (must have elements)
 * @param target_node_types - Node types to treat as endpoints (can be empty)
 * @returns PathSubgraphsResult containing all subgraphs starting from sources
 */
export const graph_subgraphs_from_sources = new Procedure("graph_subgraphs_from_sources")
    .input("nodes", ArrayType(GraphNode))
    .input("edges", ArrayType(GraphEdge))
    .input("source_node_types", SetType(StringType))
    .input("target_node_types", SetType(StringType))
    .output(PathSubgraphsResult)
    .body(($, { nodes, edges, source_node_types, target_node_types }) => {
        // Validate source_node_types is not empty
        $.if(Equal(Size(source_node_types), Const(0n))).then($ => {
            $.error(Const("source_node_types must contain at least one element"));
        });

        // Build forward adjacency list
        const forwardAdjacencyList = $.let(NewDict(StringType, ArrayType(StringType)));
        
        $.forArray(edges, ($, edge) => {
            const fromId = $.let(GetField(edge, "from"));
            const toId = $.let(GetField(edge, "to"));
            
            $.if(In(forwardAdjacencyList, fromId)).then($ => {
                const children = $.let(Get(forwardAdjacencyList, fromId));
                $.pushLast(children, toId);
            }).else($ => {
                $.insert(forwardAdjacencyList, fromId, NewArray(StringType, [toId]));
            });
        });

        // Create node lookup dictionary
        const nodeDict = $.let(NewDict(StringType, GraphNode));
        $.forArray(nodes, ($, node) => {
            const nodeId = $.let(GetField(node, "id"));
            $.insert(nodeDict, nodeId, node);
        });

        // Find all source nodes
        const sourceNodes = $.let(NewArray(GraphNode));
        $.forArray(nodes, ($, node) => {
            const nodeType = $.let(GetField(node, "type"));
            $.if(In(source_node_types, nodeType)).then($ => {
                $.pushLast(sourceNodes, node);
            });
        });

        // If no source nodes found, return empty result
        $.if(Equal(Size(sourceNodes), Const(0n))).then($ => {
            $.return(Struct({
                subgraphs: NewArray(PathSubgraph)
            }));
        });

        // For each connected component containing sources, perform forward traversal
        const globalVisited = $.let(NewSet(StringType));
        const subgraphs = $.let(NewArray(PathSubgraph));

        $.forArray(sourceNodes, ($, sourceNode) => {
            const sourceId = $.let(GetField(sourceNode, "id"));
            
            // Skip if already processed in another subgraph
            $.if(Not(In(globalVisited, sourceId))).then($ => {
                // Forward traversal from this source
                const subgraphNodes = $.let(NewSet(StringType));
                const subgraphEdges = $.let(NewArray(GraphEdge));
                const stack = $.let(NewArray(StringType, [sourceId]));
                const visited = $.let(NewSet(StringType));

                $.while(Greater(Size(stack), Const(0n)), $ => {
                    const current = $.let(Get(stack, Subtract(Size(stack), Const(1n))));
                    $.deleteLast(stack);

                    $.if(Not(In(visited, current))).then($ => {
                        $.insert(visited, current);
                        $.insert(subgraphNodes, current);

                        // Add children to stack for forward traversal
                        $.if(In(forwardAdjacencyList, current)).then($ => {
                            const children = $.let(Get(forwardAdjacencyList, current));
                            $.forArray(children, ($, child) => {
                                // Collect edge during traversal
                                $.pushLast(subgraphEdges, Struct({from: current, to: child}));
                                
                                $.if(Not(In(visited, child))).then($ => {
                                    $.pushLast(stack, child);
                                });
                            });
                        });
                    });
                });

                // Mark all nodes in this subgraph as globally visited
                $.forSet(subgraphNodes, ($, nodeId) => {
                    $.insertOrUpdate(globalVisited, nodeId);
                });

                // Extract nodes for this subgraph
                const subgraphNodeArray = $.let(NewArray(GraphNode));
                const subgraphSourceNodes = $.let(NewArray(GraphNode));
                const subgraphTargetNodes = $.let(NewArray(GraphNode));
                
                $.forSet(subgraphNodes, ($, nodeId) => {
                    const node = $.let(Get(nodeDict, nodeId));
                    $.pushLast(subgraphNodeArray, node);
                    
                    const nodeType = $.let(GetField(node, "type"));
                    
                    // Check if it's a source node
                    $.if(In(source_node_types, nodeType)).then($ => {
                        $.pushLast(subgraphSourceNodes, node);
                    });
                    
                    // Check if it's a target node (if target_node_types is not empty)
                    $.if(Greater(Size(target_node_types), Const(0n))).then($ => {
                        $.if(In(target_node_types, nodeType)).then($ => {
                            $.pushLast(subgraphTargetNodes, node);
                        });
                    }).else($ => {
                        // If target_node_types is empty, nodes with no outgoing edges are targets
                        $.if(Not(In(forwardAdjacencyList, nodeId))).then($ => {
                            $.pushLast(subgraphTargetNodes, node);
                        });
                    });
                });

                // Edges already collected during traversal

                // Create subgraph and add to results
                const subgraph = $.let(Struct({
                    nodes: subgraphNodeArray,
                    edges: subgraphEdges,
                    source_nodes: subgraphSourceNodes,
                    target_nodes: subgraphTargetNodes
                }));
                
                $.pushLast(subgraphs, subgraph);
            });
        });

        $.return(Struct({
            subgraphs: subgraphs
        }));
    });