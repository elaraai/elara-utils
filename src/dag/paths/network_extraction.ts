import { Procedure } from "@elaraai/core";
import {
  ArrayType,
  Const,
  GetField,
  Greater,
  In,
  IntegerType,
  NewArray,
  NewSet,
  Not,
  Size,
  StringType,
  Struct,
  StructType,
  And
} from "@elaraai/core";

import { GraphNode, GraphEdge } from "../types";
import { graph_bfs } from "../traversal/breadth_first";

// Input structure for network extraction
export const GraphNetworkExtractionInput = StructType({
  nodes: ArrayType(GraphNode),
  edges: ArrayType(GraphEdge),
  source_node_ids: ArrayType(StringType),
  target_node_ids: ArrayType(StringType)
});

// Individual subgraph structure
export const GraphNetworkSubgraph = StructType({
  network_nodes: ArrayType(GraphNode),
  network_edges: ArrayType(GraphEdge),
  source_nodes: ArrayType(GraphNode),
  target_nodes: ArrayType(GraphNode),
  intermediate_nodes: ArrayType(GraphNode),
  total_nodes: IntegerType,
  total_edges: IntegerType,
  network_depth: IntegerType
});

// Result structure for network extraction
export const GraphNetworkExtractionResult = StructType({
  subgraphs: ArrayType(GraphNetworkSubgraph)
});

/**
 * Graph Network Extraction - Extract complete connected processing networks from specified starting points
 * 
 * **Purpose**: Identifies complete processing networks for batch genealogy traceability by finding
 * all nodes that are transitively connected to specified source and/or target node IDs. This is 
 * essential for understanding full material flows, dependencies, and impacts in manufacturing processes.
 * 
 * **Key Assumptions**:
 * - Graph represents a directed processing network (edges = material/information flow)
 * - Node IDs are unique identifiers for processing steps, materials, or operations
 * - External dependencies are represented as edges feeding into the main processing flow
 * - Networks may have cycles (handled correctly without infinite loops)
 * 
 * **Time Complexity**: O(S × (V + E)) where:
 * - S = number of unique starting points (source_node_ids + target_node_ids)
 * - V = total vertices in graph
 * - E = total edges in graph
 * Note: Optimized with significant constant factor improvements through pre-computation and efficient lookups
 * 
 * **Space Complexity**: O(V + E) for:
 * - Pre-built lookup structures: O(V + E) 
 * - BFS visited tracking: O(V)
 * - Reversed edge graph (built once): O(E)
 * - Result storage and intermediate sets: O(V + E)
 * 
 * **Input Parameters**:
 * @param nodes - Array of all graph nodes with {id: string, type: string} structure
 * @param edges - Array of all directed edges with {from: string, to: string, type: string} structure
 * @param source_node_ids - Array of source node IDs to use as network discovery starting points
 * @param target_node_ids - Array of target node IDs to use as network discovery starting points
 * 
 * **Output Structure**:
 * @returns GraphNetworkExtractionResult containing:
 * - subgraphs: Array of complete networks, each containing:
 *   - network_nodes: All nodes in this connected network
 *   - network_edges: All edges within this network  
 *   - source_nodes: Nodes from input source_node_ids found in this network
 *   - target_nodes: Nodes from input target_node_ids found in this network
 *   - intermediate_nodes: All other nodes (including external sources and sibling endpoints)
 *   - total_nodes: Count of nodes in network
 *   - total_edges: Count of edges in network
 *   - network_depth: Same as total_nodes (legacy field)
 * 
 * **Behavior Examples**:
 * 
 * ```
 * Example 1: Disconnected Networks from Multiple Sources
 * Graph: A→B→C    X→Y→Z
 * Input: source_node_ids=["A", "X"], target_node_ids=[]
 * Output: 2 subgraphs
 *   Subgraph 1: nodes=[A,B,C], source_nodes=[A], target_nodes=[], intermediate_nodes=[B,C]
 *   Subgraph 2: nodes=[X,Y,Z], source_nodes=[X], target_nodes=[], intermediate_nodes=[Y,Z]
 * 
 * Example 2: Connected Network from Multiple Sources  
 * Graph: A↘   
 *          C→D→F
 *        B↗
 * Input: source_node_ids=["A", "B"], target_node_ids=[]
 * Output: 1 subgraph (merged since A,B are in same network)
 *   Subgraph 1: nodes=[A,B,C,D,F], source_nodes=[A,B], target_nodes=[], intermediate_nodes=[C,D,F]
 * 
 * Example 3: Sibling Endpoint Discovery
 * Graph: A→B→C→E→F
 *              ↳G
 * Input: source_node_ids=[], target_node_ids=["F"]
 * Output: 1 subgraph
 *   Subgraph 1: nodes=[A,B,C,E,F,G], source_nodes=[], target_nodes=[F], intermediate_nodes=[A,B,C,E,G]
 *   Note: G included as sibling endpoint (forward reachable from network nodes)
 * 
 * Example 4: External Source Integration
 * Graph: A→B→C→E→F
 *            ↑
 *        X→D→┘
 * Input: source_node_ids=["A"], target_node_ids=["F"]  
 * Output: 1 subgraph
 *   Subgraph 1: nodes=[A,B,C,D,E,F,X], source_nodes=[A], target_nodes=[F], intermediate_nodes=[B,C,D,E,X]
 *   Note: X,D included as external sources feeding into main A→F network
 * 
 * Example 5: Multi-Level External Sources
 * Graph: W→X→Y→Z→A→B
 * Input: source_node_ids=["A"], target_node_ids=["B"]
 * Output: 1 subgraph  
 *   Subgraph 1: nodes=[A,B,W,X,Y,Z], source_nodes=[A], target_nodes=[B], intermediate_nodes=[W,X,Y,Z]
 *   Note: Entire external chain W→X→Y→Z discovered through iterative external source detection
 * 
 * Example 6: Mixed Starting Points - Same Network
 * Graph: A→C→E→F
 *        B→D→↗
 * Input: source_node_ids=["A","B"], target_node_ids=["F"]
 * Output: 1 subgraph (all nodes are transitively connected)
 *   Subgraph 1: nodes=[A,B,C,D,E,F], source_nodes=[A,B], target_nodes=[F], intermediate_nodes=[C,D,E]
 * 
 * Example 7: Mixed Starting Points - Separate Networks  
 * Graph: A→B    X→Y
 * Input: source_node_ids=["A"], target_node_ids=["Y"]
 * Output: 2 subgraphs (disconnected networks)
 *   Subgraph 1: nodes=[A,B], source_nodes=[A], target_nodes=[], intermediate_nodes=[B]
 *   Subgraph 2: nodes=[X,Y], source_nodes=[], target_nodes=[Y], intermediate_nodes=[X]
 * ```
 * 
 * **Edge Cases Handled**:
 * - Empty input arrays: Returns empty result
 * - Invalid node IDs: Silently filtered out during validation
 * - Duplicate input IDs: Automatically deduplicated  
 * - Self-loops: Handled correctly without infinite loops
 * - Cycles: Processed correctly using BFS visited tracking
 * - Isolated nodes: Included as single-node networks if specified as starting points
 * - Mixed valid/invalid IDs: Only valid IDs processed, invalid ones ignored
 * 
 * **Use Cases**:
 * - Manufacturing batch genealogy: "What materials and processes contributed to this final product?"
 * - Supply chain traceability: "What suppliers and processing steps are involved in this order?"
 * - Impact analysis: "If this component fails, what downstream processes are affected?"
 * - Regulatory compliance: "Show complete processing history for this batch"
 * - Process optimization: "What are the complete workflows between these operations?"
 */
export const graph_network_extraction = new Procedure("graph_network_extraction")
  .input("nodes", ArrayType(GraphNode))
  .input("edges", ArrayType(GraphEdge))
  .input("source_node_ids", ArrayType(StringType))
  .input("target_node_ids", ArrayType(StringType))
  .output(GraphNetworkExtractionResult)
  .import(graph_bfs)
  .body(($, { nodes, edges, source_node_ids, target_node_ids }, procs) => {
    
    const has_sources = $.let(Greater(Size(source_node_ids), Const(0n)));
    const has_targets = $.let(Greater(Size(target_node_ids), Const(0n)));
    
    // Early exit if no sources or targets specified
    $.if(And(Not(has_sources), Not(has_targets))).then($ => {
      $.return(Struct({
        subgraphs: NewArray(GraphNetworkSubgraph)
      }));
    });
    
    // OPTIMIZATION 1: Build reusable data structures once at the beginning
    
    // Build valid node ID lookup set (O(N) once instead of O(N×M) per validation)
    const valid_node_ids = $.let(NewSet(StringType));
    $.forArray(nodes, ($, node) => {
      $.insert(valid_node_ids, GetField(node, "id"));
    });
    
    // Build reversed edges once (O(E) once instead of O(E×S) per starting point)
    const reversed_edges = $.let(NewArray(GraphEdge));
    $.forArray(edges, ($, edge) => {
      const reversed_edge = $.let(Struct({
        from: GetField(edge, "to"),
        to: GetField(edge, "from"),
        type: GetField(edge, "type")
      }));
      $.pushLast(reversed_edges, reversed_edge);
    });
    
    // Build source and target lookup sets once (O(M) once instead of O(M×S) per subgraph)
    const source_node_set = $.let(NewSet(StringType));
    $.forArray(source_node_ids, ($, source_id) => {
      $.if(In(valid_node_ids, source_id)).then($ => {
        $.insertOrUpdate(source_node_set, source_id);
      });
    });
    
    const target_node_set = $.let(NewSet(StringType));
    $.forArray(target_node_ids, ($, target_id) => {
      $.if(In(valid_node_ids, target_id)).then($ => {
        $.insertOrUpdate(target_node_set, target_id);
      });
    });
    
    // OPTIMIZATION 2: Collect starting points using O(1) lookups
    const starting_node_ids = $.let(NewSet(StringType));
    $.forSet(source_node_set, ($, source_id) => {
      $.insert(starting_node_ids, source_id);
    });
    $.forSet(target_node_set, ($, target_id) => {
      $.insertOrUpdate(starting_node_ids, target_id);
    });
    
    // Find complete connected networks containing starting points
    const processed_nodes = $.let(NewSet(StringType));
    const result_subgraphs = $.let(NewArray(GraphNetworkSubgraph));
    
    $.forSet(starting_node_ids, ($, starting_node_id) => {
      // OPTIMIZATION 3: Simplified processed check (removed redundant reachability BFS)
      $.if(Not(In(processed_nodes, starting_node_id))).then($ => {
        
        // Find complete connected component using bidirectional BFS
        const network_node_ids = $.let(NewSet(StringType));
        
        // Forward BFS from starting point
        const forward_reachable = $.let(procs.graph_bfs(Struct({
          nodes: nodes,
          edges: edges,
          startId: starting_node_id
        })));
        
        $.forArray(forward_reachable, ($, node_id) => {
          $.insertOrUpdate(network_node_ids, node_id);
        });
        
        // OPTIMIZATION 4: Use pre-built reversed edges
        const backward_reachable = $.let(procs.graph_bfs(Struct({
          nodes: nodes,
          edges: reversed_edges,
          startId: starting_node_id
        })));
        
        $.forArray(backward_reachable, ($, node_id) => {
          $.insertOrUpdate(network_node_ids, node_id);
        });
        
        // Forward BFS from all network nodes to capture sibling endpoints
        // OPTIMIZATION 5: Use forSet directly instead of converting to array
        const additional_nodes = $.let(NewSet(StringType));
        $.forSet(network_node_ids, ($, node_id) => {
          const forward_reachable = $.let(procs.graph_bfs(Struct({
            nodes: nodes,
            edges: edges,
            startId: node_id
          })));
          
          $.forArray(forward_reachable, ($, reachable_id) => {
            $.if(Not(In(network_node_ids, reachable_id))).then($ => {
              $.insertOrUpdate(additional_nodes, reachable_id);
            });
          });
        });
        
        // Add all additional nodes to the main network
        $.forSet(additional_nodes, ($, node_id) => {
          $.insertOrUpdate(network_node_ids, node_id);
        });
        
        // Iteratively include external sources that feed into the network
        // Track newly added nodes to only check relevant edges each iteration
        const newly_added_nodes = $.let(NewSet(StringType));
        
        // Initialize with current network nodes as "newly added" for first iteration
        $.forSet(network_node_ids, ($, node_id) => {
          $.insert(newly_added_nodes, node_id);
        });
        
        // Continue until no new external sources are found
        $.while(Greater(Size(newly_added_nodes), Const(0n)), $ => {
          const next_newly_added = $.let(NewSet(StringType));
          
          // Only check edges where 'to' node is newly added (optimization)
          $.forArray(edges, ($, edge) => {
            const from_id = $.let(GetField(edge, "from"));
            const to_id = $.let(GetField(edge, "to"));
            
            // Only process edges where the target was recently added
            $.if(In(newly_added_nodes, to_id)).then($ => {
              $.if(Not(In(network_node_ids, from_id))).then($ => {
                $.insert(network_node_ids, from_id);
                $.insert(next_newly_added, from_id);
              });
            });
          });
          
          // Update newly_added_nodes for next iteration
          $.assign(newly_added_nodes, next_newly_added);
        });
        
        // Mark all nodes in this network as processed IMMEDIATELY
        // This prevents duplicate processing when multiple starting points are in the same network
        $.forSet(network_node_ids, ($, node_id) => {
          $.insertOrUpdate(processed_nodes, node_id);
        });
        
        // OPTIMIZATION 6: Combined filtering and categorization in single pass
        const filtered_nodes = $.let(NewArray(GraphNode));
        const filtered_edges = $.let(NewArray(GraphEdge));
        const source_nodes = $.let(NewArray(GraphNode));
        const target_nodes = $.let(NewArray(GraphNode));
        const intermediate_nodes = $.let(NewArray(GraphNode));
        
        // Filter and categorize nodes in single pass
        $.forArray(nodes, ($, node) => {
          const node_id = $.let(GetField(node, "id"));
          $.if(In(network_node_ids, node_id)).then($ => {
            $.pushLast(filtered_nodes, node);
            
            // Categorize in same loop to avoid second pass
            $.if(In(source_node_set, node_id)).then($ => {
              $.pushLast(source_nodes, node);
            }).else($ => {
              $.if(In(target_node_set, node_id)).then($ => {
                $.pushLast(target_nodes, node);
              }).else($ => {
                $.pushLast(intermediate_nodes, node);
              });
            });
          });
        });
        
        // Filter edges
        $.forArray(edges, ($, edge) => {
          const from_id = $.let(GetField(edge, "from"));
          const to_id = $.let(GetField(edge, "to"));
          $.if(And(In(network_node_ids, from_id), In(network_node_ids, to_id))).then($ => {
            $.pushLast(filtered_edges, edge);
          });
        });
        
        const subgraph = $.let(Struct({
          network_nodes: filtered_nodes,
          network_edges: filtered_edges,
          source_nodes: source_nodes,
          target_nodes: target_nodes,
          intermediate_nodes: intermediate_nodes,
          total_nodes: Size(filtered_nodes),
          total_edges: Size(filtered_edges),
          network_depth: Size(filtered_nodes)
        }));
        
        $.pushLast(result_subgraphs, subgraph);
      });
    });
    
    $.return(Struct({
      subgraphs: result_subgraphs
    }));
  });