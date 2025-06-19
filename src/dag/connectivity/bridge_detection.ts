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
  StringJoin,
  StringType,
  Struct,
  StructType,
  Subtract,
  ToArray
} from "@elaraai/core";

import { graph_build_adjacency_lists } from "../core/adjacency_lists";
import { GraphNode, GraphEdge } from "../types";

// Bridge edge structure for output
export const GraphBridgeEdge = StructType({
  from: StringType,
  to: StringType
});

/**
 * Graph Bridge Detection - Iterative Tarjan's algorithm for finding critical edges
 * 
 * **Purpose**: Identifies critical edges (bridges) whose removal would increase the number
 * of connected components in an undirected graph. Uses iterative approach to prevent
 * stack overflow on large graphs while maintaining optimal O(V + E) complexity. Essential for
 * network resilience analysis and identifying critical connections in distributed systems.
 * 
 * **Key Assumptions**:
 * - Input graph is treated as undirected (reverse edges are automatically added)
 * - Graph may contain multiple disconnected components
 * - Self-loops are ignored as they cannot be bridges
 * - Parallel edges are deduplicated (treated as single undirected edge)
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
 * - Edge deduplication set: O(E)
 * - Post-order traversal stacks: O(V)
 * 
 * **Input Parameters**:
 * @param nodes - Array of GraphNode objects containing node definitions
 * @param edges - Array of GraphEdge objects representing directed connections (converted to undirected)
 * 
 * **Output Structure**:
 * @returns Array<GraphBridgeEdge> containing:
 * - Bridge edges with 'from' and 'to' string fields
 * - Empty array if no bridges exist
 * - Results are in discovery order (not sorted)
 * - Each bridge represents a critical connection
 * 
 * **Behavior Examples**:
 * ```
 * Example 1: Linear Chain
 * Graph: A—B—C
 * Input: nodes=[A,B,C], edges=[(A,B), (B,C)]
 * Output: [{from:"A",to:"B"}, {from:"B",to:"C"}]
 *   Both edges are bridges because removing either disconnects the graph
 * 
 * Example 2: Triangle (Complete Graph)
 * Graph: A—B—C—A  
 * Input: nodes=[A,B,C], edges=[(A,B), (B,C), (C,A)]
 * Output: []
 *   No bridges because any edge can be bypassed via alternate paths
 * 
 * Example 3: Bridge Connecting Cycles
 * Graph: (A-B-A) -- C-D -- (E-F-E)
 * Input: nodes=[A,B,C,D,E,F], edges=[(A,B), (B,A), (B,C), (C,D), (D,E), (E,F), (F,E)]
 * Output: [{from:"B",to:"C"}, {from:"C",to:"D"}, {from:"D",to:"E"}]
 *   Bridge edges connecting the cycles are critical for overall connectivity
 * ```
 * 
 * **Edge Cases Handled**:
 * - Empty graph: Returns empty array
 * - Single edge: Returns that edge as a bridge
 * - Disconnected components: Processes each component independently
 * - Self-loops: Ignored during processing (cannot be bridges)
 * - Parallel edges: Deduplicated automatically
 * - Complex nested cycles: Correctly identifies only bridge edges
 * 
 * **Use Cases**:
 * - Network infrastructure analysis: "Which connections are critical for network connectivity?"
 * - Transportation planning: "Which roads/bridges are essential and cannot fail?"
 * - Communication networks: "Which links are single points of failure?"
 * - Supply chain analysis: "Which connections are critical for distribution?"
 * - Circuit design: "Which connections are essential for electrical continuity?"
 * 
 * **Algorithm Details**:
 * Uses iterative Tarjan's bridge-finding algorithm with two-pass approach:
 * 1. First pass: DFS to set discovery times and build parent tree
 * 2. Second pass: Post-order traversal to update low-link values and detect bridges
 */

export const graph_bridge_detection = new Procedure("graph_bridge_detection")
  .input("nodes", ArrayType(GraphNode))
  .input("edges", ArrayType(GraphEdge))
  .output(ArrayType(GraphBridgeEdge))
  .import(graph_build_adjacency_lists)
  .body(($, { nodes, edges }, procs) => {
    
    // Early exit for trivial cases
    $.if(Less(Size(edges), Const(1n))).then($ => {
      $.return(NewArray(GraphBridgeEdge)); // No bridges possible without edges
    });
    
    // Build undirected adjacency list by adding reverse edges
    const undirectedEdges = $.let(NewArray(GraphEdge));
    const edgeSet = $.let(NewSet(StringType)); // Track unique edges to avoid duplicates
    
    $.forArray(edges, ($, edge) => {
      const fromId = $.let(GetField(edge, "from"));
      const toId = $.let(GetField(edge, "to"));
      
      // Skip self-loops (cannot be bridges)
      $.if(Not(Equal(fromId, toId))).then($ => {
        const edgeKey1 = $.let(StringJoin`${fromId}-${toId}`);
        const edgeKey2 = $.let(StringJoin`${toId}-${fromId}`);
        
        // Only add if not already seen (handle parallel edges)
        $.if(Not(In(edgeSet, edgeKey1))).then($ => {
          $.if(Not(In(edgeSet, edgeKey2))).then($ => {
            // Add forward edge
            $.pushLast(undirectedEdges, edge);
            
            // Add reverse edge to make undirected
            const edgeType = $.let(GetField(edge, "type"));
            $.pushLast(undirectedEdges, Struct({
              from: toId,
              to: fromId,
              type: edgeType
            }));
            
            $.insertOrUpdate(edgeSet, edgeKey1);
            $.insertOrUpdate(edgeSet, edgeKey2);
          });
        });
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
    const bridges = $.let(NewArray(GraphBridgeEdge));
    
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
        
        // Second pass - post-order processing to update low-links and find bridges
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
          
          // Update low-links from children and detect bridges
          $.if(In(adjacencyList, current)).then($ => {
            const neighbors = $.let(ToArray(Get(adjacencyList, current, NewArray(StringType))));
            $.forArray(neighbors, ($, neighbor) => {
              const neighborParent = $.let(Get(parent, neighbor, Const(-2n)));
              
              $.if(Equal(neighborParent, currentDiscovery)).then($ => {
                // This is a child - update low-link
                const childLow = $.let(Get(low, neighbor));
                const currentLow = $.let(Get(low, current));
                $.insertOrUpdate(low, current, Min(currentLow, childLow));
                
                // Check bridge condition: low[child] > discovery[current]
                $.if(Greater(childLow, currentDiscovery)).then($ => {
                  // Edge (current, neighbor) is a bridge
                  $.pushLast(bridges, Struct({
                    from: current,
                    to: neighbor
                  }));
                });
              }).elseIf(Not(Equal(Get(discovery, neighbor), currentParent))).then($ => {
                // Back edge (not to parent) - compare discovery times not parent values
                const neighborDiscovery = $.let(Get(discovery, neighbor));
                const currentLow = $.let(Get(low, current));
                $.insertOrUpdate(low, current, Min(currentLow, neighborDiscovery));
              });
            });
          });
          
          $.assign(i, Subtract(i, Const(1n)));
        });
      });
    });
    
    $.return(bridges);
  });