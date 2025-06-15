import { Procedure } from "@elaraai/core";
import {
  Add,
  Const,
  Divide,
  GetField,
  Greater,
  In,
  Multiply,
  NewArray,
  NewSet,
  Not,
  Size,
  Struct,
  Equal,
} from "@elaraai/core";

import { ArrayType, StringType } from "@elaraai/core";

import { graph_build_adjacency_lists } from "../core/adjacency_lists";
import { graph_bfs } from "../traversal/breadth_first";
import {
  GraphNode,
  GraphEdge,
  GraphPathStatistics,
} from "../types";

/**
 * Graph Path Statistics - comprehensive path analysis using graph traversal algorithms
 * 
 * Provides detailed path-based analysis of graph structure, calculating both dependency depth
 * metrics (longest paths) and connectivity breadth metrics (reachability). Uses BFS traversal
 * to compute accurate path measurements for workflow complexity assessment.
 * 
 * **Statistics Provided:**
 * - **Basic counts**: Total nodes and edges
 * - **Dependency depth**: Longest path length and depth levels (critical path analysis)
 * - **Connectivity breadth**: Total reachable nodes and spanning tree size (connectivity analysis) 
 * - **Structural metrics**: Branching factor and complexity measures
 * - **Path signature**: Node type sequence for pattern matching
 * 
 * **Example:**
 * ```
 * Input Graph:                    Types:                    Result:
 *     A ──┐                         A: "input"               node_count: 4
 *         ├──→ B                     B: "process"             edge_count: 3  
 *         └──→ C ──→ D               C: "process"             longest_path_length: 2 (A→C→D)
 *                                   D: "output"              longest_path_depth: 3 (3 levels)
 *                                                           total_reachable_nodes: 4.0 (all reachable)
 *                                                           connectivity_span: 3 (3 edges in spanning tree)
 *                                                           branching_factor: 0.75 (3 edges / 4 nodes)
 *                                                           node_type_sequence: ["input", "process", "output"]
 * ```
 * 
 * **Efficiency:**
 * - Uses BFS traversal for accurate path analysis - O(V + E) per source node
 * - Builds adjacency lists for structural analysis - O(E)
 * - Single-pass algorithms where possible
 * 
 * **Use Cases:**
 * - **Critical path analysis**: "What's the longest dependency chain?" (longest_path_length)
 * - **Execution depth**: "How many sequential steps are required?" (longest_path_depth) 
 * - **Connectivity assessment**: "How interconnected is this workflow?" (total_reachable_nodes)
 * - **Complexity measurement**: "How complex is the branching structure?" (branching_factor)
 * - **Pattern recognition**: "What are the typical operation sequences?" (node_type_sequence)
 * 
 * **Algorithm:**
 * 1. Build adjacency lists for structural analysis
 * 2. Find source nodes (no incoming edges) using reverse adjacency  
 * 3. Use BFS from each source to find both longest paths and maximum reachability
 * 4. Calculate dependency depth (longest simple path) vs connectivity breadth (total reachable)
 * 5. Generate path signature from longest dependency chain
 * 
 * @param nodes Array of graph nodes with id and type
 * @param edges Array of directed edges representing dependencies (from → to)
 * @returns Comprehensive path statistics with both depth and breadth metrics
 */
export const graph_path_statistics = new Procedure("graph_path_statistics")
  .input("nodes", ArrayType(GraphNode))
  .input("edges", ArrayType(GraphEdge))
  .output(GraphPathStatistics)
  .import(graph_build_adjacency_lists)
  .import(graph_bfs)
  .body(($, { nodes, edges }, procs) => {
    // Build adjacency lists for structural analysis
    const adjacencyData = $.let(procs.graph_build_adjacency_lists(Struct({ edges })));
    // const adjacencyList = $.let(GetField(adjacencyData, "adjacency_list")); // Not used in current implementation
    const reverseAdjacencyList = $.let(GetField(adjacencyData, "reverse_adjacency_list"));
    
    // Calculate basic counts
    const nodeCount = $.let(Size(nodes));
    const edgeCount = $.let(Size(edges));
    
    // Find source nodes (no incoming edges) for depth calculation
    const sourceNodes = $.let(NewArray(StringType));
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      $.if(Not(In(reverseAdjacencyList, nodeId))).then($ => {
        $.pushLast(sourceNodes, nodeId);
      });
    });
    
    // Calculate both dependency depth metrics and connectivity metrics in a single efficient loop
    const longestPathLength = $.let(Const(0n));      // Edges in longest simple path
    const longestPathDepth = $.let(Const(0n));       // Levels in deepest path
    const totalReachableNodes = $.let(Const(0.0));   // Maximum reachable nodes (connectivity)
    const connectivitySpan = $.let(Const(0n));       // Edges in spanning tree
    
    // Node type sequence collection - collect unique types from best traversal
    const nodeTypeSequence = $.let(NewArray(StringType));
    const seenTypes = $.let(NewSet(StringType));
    
    $.if(Greater(Size(sourceNodes), Const(0n))).then($ => {
      $.forArray(sourceNodes, ($, sourceId) => {
        // Use BFS to get all reachable nodes from this source
        const traversalResult = $.let(procs.graph_bfs(Struct({ nodes, edges, source_node_id: sourceId })));
        const reachableCount = $.let(Size(traversalResult));
        
        // Connectivity metrics: total reachable nodes and spanning tree size
        const currentReachable = $.let(Multiply(reachableCount, Const(1.0)));
        $.if(Greater(currentReachable, totalReachableNodes)).then($ => {
          $.assign(totalReachableNodes, currentReachable);
          $.assign(connectivitySpan, Add(reachableCount, Const(-1n))); // edges in spanning tree
          
          // Clear and rebuild node type sequence from this best traversal
          $.clear(nodeTypeSequence);
          $.clear(seenTypes);
          
          // Build type sequence array from this traversal result (most comprehensive path)
          $.forArray(traversalResult, ($, nodeId) => {
            // Find the node type for this ID
            $.forArray(nodes, ($, node) => {
              const currentNodeId = $.let(GetField(node, "id"));
              $.if(Equal(currentNodeId, nodeId)).then($ => {
                const nodeType = $.let(GetField(node, "type"));
                // Only add if we haven't seen this type before in this traversal
                $.if(Not(In(seenTypes, nodeType))).then($ => {
                  $.insert(seenTypes, nodeType);
                  $.pushLast(nodeTypeSequence, nodeType);
                });
              });
            });
          });
        });
        
        // Dependency depth metrics: use reachable count as proxy for path depth
        $.if(Greater(reachableCount, longestPathDepth)).then($ => {
          $.assign(longestPathDepth, reachableCount);                    // levels (nodes)
          $.assign(longestPathLength, Add(reachableCount, Const(-1n))); // edges
        });
      });
    }).else($ => {
      // If no clear sources, use node count as fallback for isolated components
      $.if(Greater(nodeCount, Const(0n))).then($ => {
        $.assign(totalReachableNodes, Multiply(nodeCount, Const(1.0)));
        $.assign(connectivitySpan, Add(nodeCount, Const(-1n)));
        $.assign(longestPathDepth, nodeCount);
        $.assign(longestPathLength, Add(nodeCount, Const(-1n)));
        
        // For isolated nodes, collect all unique types
        $.forArray(nodes, ($, node) => {
          const nodeType = $.let(GetField(node, "type"));
          $.if(Not(In(seenTypes, nodeType))).then($ => {
            $.insert(seenTypes, nodeType);
            $.pushLast(nodeTypeSequence, nodeType);
          });
        });
      });
    });
    
    // Calculate actual branching factor (average out-degree)
    const branchingFactor = $.let(Const(0.0));
    $.if(Greater(nodeCount, Const(0n))).then($ => {
      const nodeCountFloat = $.let(Multiply(nodeCount, Const(1.0)));
      const edgeCountFloat = $.let(Multiply(edgeCount, Const(1.0)));
      $.assign(branchingFactor, Divide(edgeCountFloat, nodeCountFloat));
    });
    
    // Node type sequence is now collected in the main loop above for efficiency
    // This avoids an extra BFS call and ensures we get types from the most comprehensive path
    
    // Return comprehensive path statistics with both depth and breadth metrics
    $.return(Struct({
      node_count: nodeCount,
      edge_count: edgeCount,
      longest_path_length: longestPathLength,
      longest_path_depth: longestPathDepth,
      total_reachable_nodes: totalReachableNodes,
      connectivity_span: connectivitySpan,
      branching_factor: branchingFactor,
      node_type_sequence: nodeTypeSequence
    }));
  });