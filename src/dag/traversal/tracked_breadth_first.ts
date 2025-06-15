import { DictType, Procedure } from "@elaraai/core";
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
} from "@elaraai/core";

import { ArrayType, IntegerType, Nullable, StringType } from "@elaraai/core";

import { graph_build_adjacency_lists } from "../core/adjacency_lists";
import { GraphNode, GraphEdge, GraphEnhancedTraversalNode } from "../types";

/**
 * Tracked Breadth-First Search - BFS traversal with detailed metadata tracking
 * 
 * **Purpose**: Performs breadth-first traversal while capturing rich metadata including
 * visit order, depth from start node, parent relationships, and edge type information.
 * Essential for building spanning trees, analyzing graph structure, and debugging traversal paths.
 * 
 * **Key Assumptions**:
 * - Graph represents directed connections with typed edges
 * - Node IDs are unique identifiers
 * - Multiple edges between same nodes are tracked by collecting all edge types
 * - Start node must exist in the graph (validated by presence in adjacency list or as target)
 * 
 * **Time Complexity**: O(V + E) where:
 * - V = number of reachable vertices from start node
 * - E = number of reachable edges from start node
 * Note: Same complexity as standard BFS with small constant factor for metadata collection
 * 
 * **Space Complexity**: O(V + E) for:
 * - Adjacency list construction: O(V + E)
 * - BFS queue and visited tracking: O(V)
 * - Parent and depth tracking maps: O(V)
 * - Result array with metadata: O(V)
 * 
 * **Input Parameters**:
 * @param nodes - Array of graph nodes with {id: string, type: string} structure
 * @param edges - Array of directed edges with {from: string, to: string, type: string} structure
 * @param source_node_id - ID of the node to begin traversal from
 * @param limit - Optional depth limit for traversal (null = unlimited, integer = max depth)
 * 
 * **Output Structure**:
 * @returns Array of GraphEnhancedTraversalNode containing:
 * - id: Node identifier
 * - type: Node type from original graph
 * - visited_order: Sequential order this node was visited (0-based)
 * - depth: Distance from start node (shortest path length)
 * - parent_edge_types: Array of edge types used to reach this node from parent
 * - parent_id: ID of parent node in traversal tree (null for start node)
 * - parent_type: Type of parent node (null for start node)
 * 
 * **Behavior Examples**:
 * 
 * ```
 * Example 1: Simple Tree Structure
 * Graph: A(input) -flow-> B(process) -output-> C(result)
 * Input: source_node_id="A", limit=null
 * Output:
 *   A: order=0, depth=0, parent=null, parent_edge_types=[]
 *   B: order=1, depth=1, parent=A, parent_edge_types=["flow"]
 *   C: order=2, depth=2, parent=B, parent_edge_types=["output"]
 * 
 * Example 2: Diamond Structure with Multiple Edge Types
 * Graph: A -flow-> B -process-> D
 *        A -data-> C -stream-> D
 * Input: source_node_id="A", limit=null
 * Output:
 *   A: order=0, depth=0, parent=null, parent_edge_types=[]
 *   B: order=1, depth=1, parent=A, parent_edge_types=["flow"]
 *   C: order=2, depth=1, parent=A, parent_edge_types=["data"]
 *   D: order=3, depth=2, parent=B, parent_edge_types=["process"]
 *   Note: D reached via B (first discovered), not C
 * 
 * Example 3: Level-Order Processing
 * Graph: A -setup-> B -config-> D
 *        A -init-> C -deploy-> E
 * Input: source_node_id="A", limit=null
 * Output: Processes level 1 (B,C) completely before level 2 (D,E)
 *   A: order=0, depth=0
 *   B: order=1, depth=1 (level 1 first)
 *   C: order=2, depth=1 (level 1 second)
 *   D: order=3, depth=2 (level 2 first)
 *   E: order=4, depth=2 (level 2 second)
 * 
 * Example 4: Depth-Limited Traversal
 * Graph: A -setup-> B -config-> D
 *        A -init-> C -deploy-> E
 * Input: source_node_id="A", limit=1
 * Output: Only processes nodes at depth 0 and 1
 *   A: order=0, depth=0
 *   B: order=1, depth=1 (level 1 first)
 *   C: order=2, depth=1 (level 1 second)
 *   Note: D and E not included (would be depth=2, exceeds limit=1)
 * ```
 * 
 * **Edge Cases Handled**:
 * - Start node with no outgoing edges: Returns single-node result
 * - Start node with no incoming edges: Parent fields are null
 * - Multiple edges between same nodes: All edge types collected in parent_edge_types
 * - Disconnected components: Only visits nodes reachable from start
 * - Self-loops: Handled correctly without infinite loops
 * - Invalid start node: Returns empty result
 * - Depth limit 0: Returns only start node
 * - Depth limit exceeded: Terminates traversal at specified depth
 * - Null limit: Unlimited traversal (default behavior)
 * 
 * **Use Cases**:
 * - Dependency analysis: "What's the shortest path and intermediate steps to reach each component?"
 * - Workflow visualization: "Show the breadth-first expansion of process dependencies"
 * - Debugging traversal: "What parent-child relationships were discovered during BFS?"
 * - Spanning tree construction: "Build minimum-depth tree connecting all reachable nodes"
 * - Manufacturing process analysis: "What's the level-by-level expansion of production dependencies?"
 * - Limited scope analysis: "Explore only immediate neighbors (limit=1) or within N hops (limit=N)"
 * - Performance optimization: "Constrain search depth to avoid exploring too far from start"
 */
export const graph_tracked_bfs = new Procedure("graph_tracked_bfs")
  .input("nodes", ArrayType(GraphNode))
  .input("edges", ArrayType(GraphEdge))
  .input("source_node_id", StringType)
  .input("limit", Nullable(IntegerType))
  .output(ArrayType(GraphEnhancedTraversalNode))
  .import(graph_build_adjacency_lists)
  .body(($, { nodes, edges, source_node_id, limit }, procs) => {
    // Build adjacency lists and edge type mapping using shared utility
    const adjacencyData = $.let(procs.graph_build_adjacency_lists(Struct({ edges })));
    const adjacencyList = $.let(GetField(adjacencyData, "adjacency_list"));
    
    // Build node type lookup for efficient access
    const nodeTypeMap = $.let(NewDict(StringType, StringType));
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      const nodeType = $.let(GetField(node, "type"));
      $.insert(nodeTypeMap, nodeId, nodeType);
    });
    
    // Build edge type mapping: from_node -> to_node -> [edge_types]
    const edgeTypeMap = $.let(NewDict(StringType, DictType(StringType, ArrayType(StringType))));
    $.forArray(edges, ($, edge) => {
      const fromId = $.let(GetField(edge, "from"));
      const toId = $.let(GetField(edge, "to"));
      const edgeType = $.let(GetField(edge, "type"));
      
      $.if(In(edgeTypeMap, fromId)).then($ => {
        const toMap = $.let(Get(edgeTypeMap, fromId));
        $.if(In(toMap, toId)).then($ => {
          const edgeTypes = $.let(Get(toMap, toId));
          $.pushLast(edgeTypes, edgeType);
        }).else($ => {
          $.insert(toMap, toId, NewArray(StringType, [edgeType]));
        });
      }).else($ => {
        const newToMap = $.let(NewDict(StringType, ArrayType(StringType)));
        $.insert(newToMap, toId, NewArray(StringType, [edgeType]));
        $.insert(edgeTypeMap, fromId, newToMap);
      });
    });
    
    // Initialize BFS structures
    const queue = $.let(NewArray(StringType, [source_node_id]));
    const visited = $.let(NewSet(StringType, [source_node_id]));
    const result = $.let(NewArray(GraphEnhancedTraversalNode));
    const parentMap = $.let(NewDict(StringType, Nullable(StringType)));
    const depthMap = $.let(NewDict(StringType, IntegerType));
    const visitOrder = $.let(Const(0n));
    
    // Initialize start node metadata
    $.insert(parentMap, source_node_id, Const(null, Nullable(StringType)));
    $.insert(depthMap, source_node_id, Const(0n));
    
    // BFS traversal with metadata collection
    $.while(Greater(Size(queue), Const(0n)), $ => {
      const current = $.let(Get(queue, Const(0n)));
      $.deleteFirst(queue);
      
      // Skip processing if current node exceeds depth limit
      const currentDepth = $.let(Get(depthMap, current));
      const shouldProcess = $.let(Const(true));
      
      $.ifNull(limit).then(_ => {
        // No limit: continue normally
      }).else(($, maxDepth) => {
        $.if(Greater(currentDepth, maxDepth)).then($ => {
          $.assign(shouldProcess, Const(false));
        });
      });
      
      $.if(shouldProcess).then($ => {
        // CRITICAL: Skip if node doesn't exist in graph
        $.if(In(nodeTypeMap, current)).then($ => {
        
        // Collect metadata for current node
        const currentDepth = $.let(Get(depthMap, current));
        const parentId = $.let(Get(parentMap, current));
        const currentType = $.let(Get(nodeTypeMap, current));
        
        // Get parent type and edge types
        const parentType = $.let(Const(null, Nullable(StringType)));
        const parentEdgeTypes = $.let(NewArray(StringType));
        
        $.ifNull(parentId).then(_ => {
          // Start node: no parent
        }).else(($, nonNullParentId) => {
          $.assign(parentType, Get(nodeTypeMap, nonNullParentId));
          
          // Get edge types from parent to current node
          $.if(In(edgeTypeMap, nonNullParentId)).then($ => {
            const parentToMap = $.let(Get(edgeTypeMap, nonNullParentId));
            $.if(In(parentToMap, current)).then($ => {
              const edgeTypes = $.let(Get(parentToMap, current));
              $.forArray(edgeTypes, ($, edgeType) => {
                $.pushLast(parentEdgeTypes, edgeType);
              });
            });
          });
        });
        
        // Add to result with full metadata
        $.pushLast(result, Struct({
          id: current,
          type: currentType,
          visited_order: visitOrder,
          depth: currentDepth,
          parent_edge_types: parentEdgeTypes,
          parent_id: parentId,
          parent_type: parentType
        }));
        
        $.assign(visitOrder, Add(visitOrder, Const(1n)));
        
        // Add unvisited neighbors to queue
        $.if(In(adjacencyList, current)).then($ => {
          const neighbors = $.let(Get(adjacencyList, current));
          $.forArray(neighbors, ($, neighbor) => {
            $.if(Not(In(visited, neighbor))).then($ => {
              $.insert(visited, neighbor);
              $.insert(parentMap, neighbor, current);
              $.insert(depthMap, neighbor, Add(currentDepth, Const(1n)));
              $.pushLast(queue, neighbor);
            });
          });
        });
        }); // Close the node exists check
      }); // Close the shouldProcess check
    });
    
    $.return(result);
  });