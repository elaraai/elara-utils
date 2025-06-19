import { Procedure } from "@elaraai/core";
import {
  Add,
  ArrayType,
  Const,
  Equal,
  Get,
  GetField,
  Greater,
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
 * Graph Strongly Connected Components Detection - Iterative Tarjan's algorithm for finding SCCs
 * 
 * **Purpose**: Identifies strongly connected components (SCCs) in a directed graph, where each SCC
 * is a maximal set of vertices such that every vertex can reach every other vertex within the component.
 * Uses iterative approach to prevent stack overflow on large graphs while maintaining optimal O(V + E) complexity.
 * Essential for analyzing cyclic dependencies, deadlock detection, and component-based graph decomposition.
 * 
 * **Key Assumptions**:
 * - Input graph is treated as directed (edges are NOT reversed)
 * - Graph may contain multiple disconnected components
 * - Self-loops are valid and included in SCC analysis
 * - Parallel edges are treated as separate directed connections
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
 * - DFS stack and on-stack tracking: O(V)
 * - SCC result storage: O(V)
 * 
 * **Input Parameters**:
 * @param nodes - Array of GraphNode objects containing node definitions
 * @param edges - Array of GraphEdge objects representing directed connections (kept as directed)
 * 
 * **Output Structure**:
 * @returns Array<Array<string>> containing:
 * - Each inner array represents one strongly connected component
 * - Inner arrays contain node IDs that can all reach each other
 * - Empty outer array if no nodes exist
 * - Single-node SCCs for nodes with no cycles
 * - Results are in reverse topological order of SCCs
 * 
 * **Behavior Examples**:
 * ```
 * Example 1: Simple Cycle
 * Graph: A→B→C→A
 * Input: nodes=[A,B,C], edges=[(A,B), (B,C), (C,A)]
 * Output: [["A", "B", "C"]]
 *   All three nodes can reach each other, forming one SCC
 * 
 * Example 2: Chain with Cycle
 * Graph: A→B→C→D, C→B (so B↔C form a cycle)
 * Input: nodes=[A,B,C,D], edges=[(A,B), (B,C), (C,D), (C,B)]
 * Output: [["D"], ["B", "C"], ["A"]]
 *   Three SCCs: isolated D, cycle B-C, isolated A (in reverse topological order)
 * 
 * Example 3: GeeksforGeeks Example
 * Graph: 0→1, 1→2, 2→3, 3→2, 2→4
 * Input: nodes=[0,1,2,3,4], edges=[(0,1), (1,2), (2,3), (3,2), (2,4)]
 * Output: [["4"], ["2", "3"], ["1"], ["0"]]
 *   Four SCCs: isolated 4, cycle 2-3, isolated 1, isolated 0
 * ```
 * 
 * **Edge Cases Handled**:
 * - Empty graph: Returns empty array
 * - Single node: Returns single-element SCC
 * - Disconnected components: Processes each component independently
 * - Self-loops: Included in SCC analysis (node reaches itself)
 * - Acyclic graphs: Each node forms its own SCC
 * - Complex nested cycles: Correctly identifies maximal SCCs
 * 
 * **Use Cases**:
 * - Dependency analysis: "Which components have circular dependencies?"
 * - Deadlock detection: "Which processes can potentially deadlock?"
 * - Module organization: "How should we group interdependent modules?"
 * - Compiler optimization: "Which code blocks can be optimized together?"
 * - Social network analysis: "Which groups have mutual connections?"
 * - Web page ranking: "Which pages link to each other in cycles?"
 * 
 * **Algorithm Details**:
 * Uses iterative Tarjan's SCC algorithm with explicit stack management:
 * 1. DFS traversal tracking discovery times and low-link values
 * 2. Maintain explicit stack of vertices in current DFS path
 * 3. Track which vertices are currently on the stack
 * 4. When low[v] == discovery[v], vertex v is an SCC root
 * 5. Pop stack until reaching root to extract complete SCC
 */

export const graph_strongly_connected_components = new Procedure("graph_strongly_connected_components")
  .input("nodes", ArrayType(GraphNode))
  .input("edges", ArrayType(GraphEdge))
  .output(ArrayType(ArrayType(StringType)))
  .import(graph_build_adjacency_lists)
  .body(($, { nodes, edges }, procs) => {
    
    // Early exit for empty graph
    $.if(Less(Size(nodes), Const(1n))).then($ => {
      $.return(NewArray(ArrayType(StringType)));
    });
    
    // Build directed adjacency list (keep original direction, no reverse edges)
    const adjacencyData = $.let(procs.graph_build_adjacency_lists(Struct({ edges })));
    const adjacencyList = $.let(GetField(adjacencyData, "adjacency_list"));
    
    // Tarjan's SCC algorithm state
    let time = $.let(Const(0n));
    const discovery = $.let(NewDict(StringType, IntegerType));
    const low = $.let(NewDict(StringType, IntegerType));
    const visited = $.let(NewSet(StringType));
    const onStack = $.let(NewSet(StringType));
    const sccStack = $.let(NewArray(StringType));
    const sccs = $.let(NewArray(ArrayType(StringType)));
    
    // Process each unvisited component
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      
      $.if(Not(In(visited, nodeId))).then($ => {
        // Use a single-pass DFS that handles SCC detection inline
        const dfsStack = $.let(NewArray(StringType, [nodeId]));
        
        // Process DFS stack 
        $.while(Greater(Size(dfsStack), Const(0n)), $ => {
          const current = $.let(Get(dfsStack, Subtract(Size(dfsStack), Const(1n))));
          
          $.if(Not(In(visited, current))).then($ => {
            // Visit node
            $.insertOrUpdate(visited, current);
            $.insertOrUpdate(discovery, current, time);
            $.insertOrUpdate(low, current, time);
            $.assign(time, Add(time, Const(1n)));
            $.insertOrUpdate(onStack, current); // Add to SCC stack immediately
            $.pushLast(sccStack, current);
            
            // Process neighbors
            $.if(In(adjacencyList, current)).then($ => {
              const neighbors = $.let(ToArray(Get(adjacencyList, current, NewArray(StringType))));
              $.forArray(neighbors, ($, neighbor) => {
                $.if(Not(In(visited, neighbor))).then($ => {
                  // Tree edge - add to DFS stack
                  $.pushLast(dfsStack, neighbor);
                }).elseIf(In(onStack, neighbor)).then($ => {
                  // Back edge - update low-link
                  const neighborDiscovery = $.let(Get(discovery, neighbor));
                  const currentLow = $.let(Get(low, current));
                  $.insertOrUpdate(low, current, Min(currentLow, neighborDiscovery));
                });
              });
            });
          }).else($ => {
            // Backtrack - this is where we check for SCC root
            $.deleteLast(dfsStack);
            
            // Update low-links from processed children
            $.if(In(adjacencyList, current)).then($ => {
              const neighbors = $.let(ToArray(Get(adjacencyList, current, NewArray(StringType))));
              $.forArray(neighbors, ($, neighbor) => {
                $.if(In(visited, neighbor)).then($ => {
                  $.if(In(onStack, neighbor)).then($ => {
                    // Update from child/back edge on stack
                    const neighborLow = $.let(Get(low, neighbor));
                    const currentLow = $.let(Get(low, current));
                    $.insertOrUpdate(low, current, Min(currentLow, neighborLow));
                  });
                });
              });
            });
            
            // Check if current is SCC root
            const currentDiscovery = $.let(Get(discovery, current));
            const currentLow = $.let(Get(low, current));
            $.if(Equal(currentLow, currentDiscovery)).then($ => {
              // Found SCC root - extract SCC
              const scc = $.let(NewArray(StringType));
              
              $.while(Greater(Size(sccStack), Const(0n)), ($, loopLabel) => {
                const stackTop = $.let(Get(sccStack, Subtract(Size(sccStack), Const(1n))));
                $.deleteLast(sccStack);
                $.delete(onStack, stackTop);
                $.pushLast(scc, stackTop);
                
                $.if(Equal(stackTop, current)).then($ => {
                  $.break(loopLabel);
                });
              });
              
              $.pushLast(sccs, scc);
            });
          });
        });
      });
    });
    
    $.return(sccs);
  });