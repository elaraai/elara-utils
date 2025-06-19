import { Procedure } from "@elaraai/core";
import {
  Add,
  ArrayType,
  Const,
  Equal,
  Get,
  GetField,
  Greater,
  GreaterEqual,
  In,
  IntegerType,
  Less,
  Min,
  NewArray,
  NewDict,
  NewSet,
  Not,
  Size,
  StringType,
  Struct,
  Subtract,
  ToArray
} from "@elaraai/core";

import { graph_build_adjacency_lists } from "../core/adjacency_lists";
import { GraphNode, GraphEdge } from "../types";

/**
 * Graph Articulation Points Detection - Iterative Tarjan's algorithm for finding critical vertices
 * 
 * **Purpose**: Identifies critical vertices (articulation points) whose removal would increase 
 * the number of connected components in an undirected graph. Uses iterative approach to prevent
 * stack overflow on large graphs while maintaining optimal O(V + E) complexity. Essential for
 * network reliability analysis and identifying single points of failure in connected systems.
 * 
 * **Key Assumptions**:
 * - Input graph is treated as undirected (reverse edges are automatically added)
 * - Graph may contain multiple disconnected components
 * - Self-loops are ignored as they cannot be articulation points
 * - Parallel edges are treated as single edges for connectivity analysis
 * - Node IDs are unique strings within the graph
 * 
 * **Time Complexity**: O(V + E) where:
 * - V = number of vertices in the graph
 * - E = number of edges in the graph
 * Note: Iterative implementation prevents stack overflow on large graphs
 * 
 * **Space Complexity**: O(V + E) for:
 * - Adjacency list storage: O(V + E)
 * - Discovery/low-link arrays: O(V)
 * - Visited sets and parent tracking: O(V)
 * - Post-order traversal stacks: O(V)
 * 
 * **Input Parameters**:
 * @param nodes - Array of GraphNode objects containing node definitions
 * @param edges - Array of GraphEdge objects representing directed connections (converted to undirected)
 * 
 * **Output Structure**:
 * @returns Array<string> containing:
 * - Node IDs that are articulation points
 * - Empty array if no articulation points exist
 * - Results are in discovery order (not sorted)
 * 
 * **Behavior Examples**:
 * ```
 * Example 1: Linear Chain
 * Graph: A—B—C
 * Input: nodes=[A,B,C], edges=[(A,B), (B,C)]
 * Output: ["B"]
 *   B is an articulation point because removing it disconnects A from C
 * 
 * Example 2: Triangle (Complete Graph)
 * Graph: A—B—C—A
 * Input: nodes=[A,B,C], edges=[(A,B), (B,C), (C,A)]
 * Output: []
 *   No articulation points because any vertex can be reached via alternate paths
 * 
 * Example 3: Star Graph
 * Graph: Center connected to 3 leaves
 * Input: nodes=[center,leaf1,leaf2,leaf3], edges=[(center,leaf1), (center,leaf2), (center,leaf3)]
 * Output: ["center"]
 *   Center is articulation point because removing it isolates all leaves
 * ```
 * 
 * **Edge Cases Handled**:
 * - Empty graph: Returns empty array
 * - Single node: Returns empty array (cannot be articulation point)
 * - Disconnected components: Processes each component independently
 * - Self-loops: Ignored during processing
 * - Parallel edges: Treated as single undirected edge
 * 
 * **Use Cases**:
 * - Network reliability analysis: "Which routers are single points of failure?"
 * - Social network analysis: "Which people are critical connectors between groups?"
 * - Infrastructure planning: "Which roads/bridges are essential for connectivity?"
 * - Dependency analysis: "Which components are critical for system operation?"
 * - Circuit analysis: "Which nodes are essential for electrical connectivity?"
 */

export const graph_articulation_points = new Procedure("graph_articulation_points")
  .input("nodes", ArrayType(GraphNode))
  .input("edges", ArrayType(GraphEdge))
  .output(ArrayType(StringType))
  .import(graph_build_adjacency_lists)
  .body(($, { nodes, edges }, procs) => {
    
    $.if(Less(Size(nodes), Const(2n))).then($ => {
      $.return(NewArray(StringType));
    });
    
    // Build undirected adjacency list
    const undirectedEdges = $.let(NewArray(GraphEdge));
    $.forArray(edges, ($, edge) => {
      const fromId = $.let(GetField(edge, "from"));
      const toId = $.let(GetField(edge, "to"));
      
      $.pushLast(undirectedEdges, edge);
      $.if(Not(Equal(fromId, toId))).then($ => {
        const edgeType = $.let(GetField(edge, "type"));
        $.pushLast(undirectedEdges, Struct({
          from: toId,
          to: fromId,
          type: edgeType
        }));
      });
    });
    
    const adjacencyData = $.let(procs.graph_build_adjacency_lists(Struct({ edges: undirectedEdges })));
    const adjacencyList = $.let(GetField(adjacencyData, "adjacency_list"));
    
    // Tarjan's algorithm state
    let time = $.let(Const(0n));
    const discovery = $.let(NewDict(StringType, IntegerType));
    const low = $.let(NewDict(StringType, IntegerType));
    const visited = $.let(NewSet(StringType));
    const parent = $.let(NewDict(StringType, IntegerType)); // Use integer parent (-1 for root)
    const articulationPoints = $.let(NewSet(StringType));
    
    // Process each unvisited component
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      
      $.if(Not(In(visited, nodeId))).then($ => {
        // DFS to visit all nodes and set discovery/low times
        const toVisit = $.let(NewArray(StringType, [nodeId]));
        
        $.insertOrUpdate(parent, nodeId, Const(-1n)); // -1 indicates root
        
        // First pass - visit all nodes and set discovery/low times
        $.while(Greater(Size(toVisit), Const(0n)), $ => {
          const current = $.let(Get(toVisit, Subtract(Size(toVisit), Const(1n))));
          
          $.if(Not(In(visited, current))).then($ => {
            $.insertOrUpdate(visited, current);
            $.insertOrUpdate(discovery, current, time);
            $.insertOrUpdate(low, current, time);
            $.assign(time, Add(time, Const(1n)));
            
            // Add unvisited neighbors
            $.if(In(adjacencyList, current)).then($ => {
              const neighbors = $.let(ToArray(Get(adjacencyList, current, NewArray(StringType))));
              $.forArray(neighbors, ($, neighbor) => {
                $.if(Not(In(visited, neighbor))).then($ => {
                  $.insertOrUpdate(parent, neighbor, Get(discovery, current));
                  $.pushLast(toVisit, neighbor);
                });
              });
            });
          }).else($ => {
            $.deleteLast(toVisit);
          });
        });
        
        // Second pass - post-order processing to update low-links and find articulation points
        const postOrder = $.let(NewArray(StringType));
        const tempStack = $.let(NewArray(StringType, [nodeId]));
        const tempVisited = $.let(NewSet(StringType));
        
        // Build post-order traversal
        $.while(Greater(Size(tempStack), Const(0n)), $ => {
          const current = $.let(Get(tempStack, Subtract(Size(tempStack), Const(1n))));
          
          $.if(Not(In(tempVisited, current))).then($ => {
            $.insertOrUpdate(tempVisited, current);
            $.pushLast(postOrder, current);
            
            $.if(In(adjacencyList, current)).then($ => {
              const neighbors = $.let(ToArray(Get(adjacencyList, current, NewArray(StringType))));
              $.forArray(neighbors, ($, neighbor) => {
                const neighborParent = $.let(Get(parent, neighbor, Const(-2n)));
                const currentDiscovery = $.let(Get(discovery, current));
                $.if(Equal(neighborParent, currentDiscovery)).then($ => {
                  $.pushLast(tempStack, neighbor);
                });
              });
            });
          }).else($ => {
            $.deleteLast(tempStack);
          });
        });
        
        // Process in reverse post-order (children before parents)
        const postOrderSize = $.let(Size(postOrder));
        let i = $.let(Subtract(postOrderSize, Const(1n)));
        
        $.while(GreaterEqual(i, Const(0n)), $ => {
          const current = $.let(Get(postOrder, i));
          const currentParent = $.let(Get(parent, current, Const(-2n)));
          const currentDiscovery = $.let(Get(discovery, current));
          let childrenCount = $.let(Const(0n));
          
          // Update low-links from children and count children
          $.if(In(adjacencyList, current)).then($ => {
            const neighbors = $.let(ToArray(Get(adjacencyList, current, NewArray(StringType))));
            $.forArray(neighbors, ($, neighbor) => {
              const neighborParent = $.let(Get(parent, neighbor, Const(-2n)));
              
              $.if(Equal(neighborParent, currentDiscovery)).then($ => {
                // This is a child - update low-link and count
                $.assign(childrenCount, Add(childrenCount, Const(1n)));
                const childLow = $.let(Get(low, neighbor));
                const currentLow = $.let(Get(low, current));
                $.insertOrUpdate(low, current, Min(currentLow, childLow));
                
                // Check articulation point condition for non-root
                $.if(Not(Equal(currentParent, Const(-1n)))).then($ => {
                  $.if(GreaterEqual(childLow, currentDiscovery)).then($ => {
                    $.insertOrUpdate(articulationPoints, current);
                  });
                });
              }).elseIf(Not(Equal(Get(discovery, neighbor), currentParent))).then($ => {
                // Back edge (not to parent) - compare discovery times not parent values
                const neighborDiscovery = $.let(Get(discovery, neighbor));
                const currentLow = $.let(Get(low, current));
                $.insertOrUpdate(low, current, Min(currentLow, neighborDiscovery));
              });
            });
          });
          
          // Check root articulation point condition
          $.if(Equal(currentParent, Const(-1n))).then($ => {
            $.if(Greater(childrenCount, Const(1n))).then($ => {
              $.insertOrUpdate(articulationPoints, current);
            });
          });
          
          $.assign(i, Subtract(i, Const(1n)));
        });
      });
    });
    
    // Convert result to array
    const result = $.let(NewArray(StringType));
    $.forSet(articulationPoints, ($, point) => {
      $.pushLast(result, point);
    });
    
    $.return(result);
  });