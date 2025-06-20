import { Procedure, ToArray, ToSet } from "@elaraai/core";
import {
  Add,
  And,
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
  SetType,
  Size,
  StringType,
  Struct,
  SubsetEqual,
  Subtract
} from "@elaraai/core";

import { graph_build_adjacency_lists } from "../core/adjacency_lists";
import { GraphNode, GraphEdge, GraphPathSubgraph } from "../types";

/**
 * Graph Strong Subgraphs Extraction - Extract complete subgraphs from strongly connected components with filtering
 * 
 * **Purpose**: Identifies strongly connected components (SCCs) in a directed graph and returns them as complete
 * subgraph structures with nodes, edges, source/target detection, and type filtering capabilities. Each SCC
 * is a maximal set of vertices where every vertex can reach every other vertex within the component.
 * Uses Tarjan's algorithm for optimal O(V + E) complexity with comprehensive subgraph metadata collection.
 * 
 * **Key Assumptions**:
 * - Input graph is treated as directed (edges maintain their direction)
 * - Graph may contain multiple disconnected components
 * - Self-loops are valid and included in SCC analysis
 * - Parallel edges are treated as separate directed connections
 * - Node types and edge types are string identifiers for filtering
 * - Empty filter arrays mean no filtering (return all SCCs)
 * - Source/target nodes are detected within each SCC's local context
 * 
 * **Time Complexity**: O(V + E + F×T) where:
 * - V = number of vertices in the graph
 * - E = number of edges in the graph
 * - F = number of filter sets (node_types.length + edge_types.length)
 * - T = average types per SCC (for intersection operations)
 * Note: Tarjan's algorithm provides optimal O(V + E) SCC detection
 * 
 * **Space Complexity**: O(V + E + S×T) for:
 * - Adjacency list storage: O(V + E)
 * - Tarjan's algorithm state: O(V)
 * - SCC subgraph storage: O(V + E)
 * - Type tracking per SCC: O(S×T) where S = SCC count
 * 
 * **Input Parameters**:
 * @param nodes - Array of GraphNode objects containing node definitions
 * @param edges - Array of GraphEdge objects representing directed connections
 * @param node_types - Array of sets where each set contains required node types (complete intersection required)
 * @param edge_types - Array of sets where each set contains required edge types (complete intersection required)
 * 
 * **Output Structure**:
 * @returns Array<GraphPathSubgraph> containing:
 * - nodes: Complete GraphNode objects in the SCC
 * - edges: All edges connecting nodes within the SCC
 * - source_nodes: Node IDs that have no incoming edges within the SCC
 * - target_nodes: Node IDs that have no outgoing edges within the SCC
 * - node_types: Set of all node types present in the SCC
 * - edge_types: Set of all edge types present in the SCC
 * 
 * **Behavior Examples**:
 * ```
 * Example 1: Simple Cycle
 * Graph: A→B→C→A
 * Input: nodes=[A,B,C], edges=[(A,B), (B,C), (C,A)]
 * Output: Single subgraph with all nodes, no sources/targets (all strongly connected)
 * 
 * Example 2: Chain with Cycle
 * Graph: A→B→C→D, C→B (so B↔C form SCC)
 * Input: nodes=[A,B,C,D], edges=[(A,B), (B,C), (C,D), (C,B)]
 * Output: Three subgraphs: [D], [B,C], [A] with appropriate edges and source/target detection
 * 
 * Example 3: Filtering Example
 * Input: node_types = [Set(["process"])], SCCs contain mixed node types
 * Output: Only SCCs that contain at least one "process" node type
 * ```
 * 
 * **Edge Cases Handled**:
 * - Empty graph: Returns empty array
 * - Single node: Returns single-element SCC
 * - Acyclic graphs: Each node forms its own SCC
 * - Self-loops: Properly included in SCC analysis
 * - Complex nested cycles: Correctly identifies maximal SCCs
 * - Disconnected components: Processes each component independently
 * 
 * **Use Cases**:
 * - Dependency cycle analysis: "Which modules have circular dependencies?"
 * - Workflow loop detection: "Which process groups form feedback loops?"
 * - Component decomposition: "How can we break down this system into independent parts?"
 * - Critical path analysis: "Which strongly connected process groups need optimization?"
 * - System architecture validation: "Are there unwanted circular dependencies?"
 * 
 * **Algorithm Details**:
 * 1. Apply Tarjan's SCC algorithm to identify strongly connected components
 * 2. For each SCC, collect all nodes and compute local edge set
 * 3. Build SCC-local adjacency to detect sources and targets within component
 * 4. Apply filtering based on node types and edge types if specified
 * 5. Return complete subgraph structures for filtered SCCs
 */
export const graph_strong_subgraphs = new Procedure("graph_strong_subgraphs")
  .input("nodes", ArrayType(GraphNode))
  .input("edges", ArrayType(GraphEdge))
  .input("node_types", ArrayType(SetType(StringType)))
  .input("edge_types", ArrayType(SetType(StringType)))
  .output(ArrayType(GraphPathSubgraph))
  .import(graph_build_adjacency_lists)
  .body(($, { nodes, edges, node_types, edge_types }, procs) => {
    
    // Early exit for empty graph
    $.if(Less(Size(nodes), Const(1n))).then($ => {
      $.return(NewArray(GraphPathSubgraph));
    });
    
    // Pre-calculate filtering flags for efficiency
    const hasNodeFiltering = $.let(Greater(Size(node_types), Const(0n)));
    const hasEdgeFiltering = $.let(Greater(Size(edge_types), Const(0n)));
    
    // Build directed adjacency list and node lookup
    const adjacencyData = $.let(procs.graph_build_adjacency_lists(Struct({ edges })));
    const adjacencyList = $.let(GetField(adjacencyData, "adjacency_list"));
    
    // Build node lookup map for O(1) access
    const nodeLookup = $.let(NewDict(StringType, GraphNode));
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      $.insertOrUpdate(nodeLookup, nodeId, node);
    });
    
    // Pre-group edges by source for efficient SCC edge collection
    const edgesBySource = $.let(NewDict(StringType, ArrayType(GraphEdge)));
    $.forArray(edges, ($, edge) => {
      const fromId = $.let(GetField(edge, "from"));
      $.if(In(edgesBySource, fromId)).then($ => {
        const sourceEdges = $.let(Get(edgesBySource, fromId));
        $.pushLast(sourceEdges, edge);
      }).else($ => {
        $.insertOrUpdate(edgesBySource, fromId, NewArray(GraphEdge, [edge]));
      });
    });
    
    // Tarjan's SCC algorithm state
    let time = $.let(Const(0n));
    const discovery = $.let(NewDict(StringType, IntegerType));
    const low = $.let(NewDict(StringType, IntegerType));
    const visited = $.let(NewSet(StringType));
    const onStack = $.let(NewSet(StringType));
    const sccStack = $.let(NewArray(StringType));
    const filteredSubgraphs = $.let(NewArray(GraphPathSubgraph));
    
    // Reusable data structures for each SCC
    const sccNodes = $.let(NewArray(GraphNode));
    const sccEdges = $.let(NewArray(GraphEdge));
    const sccNodeIds = $.let(NewSet(StringType));
    const sccNodeTypes = $.let(NewSet(StringType));
    const sccEdgeTypes = $.let(NewSet(StringType));
    const sccSources = $.let(NewArray(StringType));
    const sccTargets = $.let(NewArray(StringType));
    
    // Process each unvisited component using Tarjan's algorithm
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      
      $.if(Not(In(visited, nodeId))).then($ => {
        // Tarjan's iterative DFS with inline SCC detection
        const dfsStack = $.let(NewArray(StringType, [nodeId]));
        
        $.while(Greater(Size(dfsStack), Const(0n)), $ => {
          const current = $.let(Get(dfsStack, Subtract(Size(dfsStack), Const(1n))));
          
          $.if(Not(In(visited, current))).then($ => {
            // Visit node - initialize Tarjan's state
            $.insertOrUpdate(visited, current);
            $.insertOrUpdate(discovery, current, time);
            $.insertOrUpdate(low, current, time);
            $.assign(time, Add(time, Const(1n)));
            $.insertOrUpdate(onStack, current);
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
            // Backtrack - update low-links and check for SCC root
            $.deleteLast(dfsStack);
            
            // Update low-links from processed children
            $.if(In(adjacencyList, current)).then($ => {
              const neighbors = $.let(ToArray(Get(adjacencyList, current, NewArray(StringType))));
              $.forArray(neighbors, ($, neighbor) => {
                $.if(In(visited, neighbor)).then($ => {
                  $.if(In(onStack, neighbor)).then($ => {
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
              // Found SCC root - extract complete SCC subgraph
              
              // Clear reusable structures
              $.clear(sccNodes);
              $.clear(sccEdges);
              $.clear(sccNodeIds);
              $.clear(sccNodeTypes);
              $.clear(sccEdgeTypes);
              $.clear(sccSources);
              $.clear(sccTargets);
              
              // Extract SCC nodes from stack
              $.while(Greater(Size(sccStack), Const(0n)), ($, loopLabel) => {
                const stackTop = $.let(Get(sccStack, Subtract(Size(sccStack), Const(1n))));
                $.deleteLast(sccStack);
                $.delete(onStack, stackTop);
                
                // Add node to SCC
                $.insertOrUpdate(sccNodeIds, stackTop);
                $.if(In(nodeLookup, stackTop)).then($ => {
                  const node = $.let(Get(nodeLookup, stackTop));
                  const nodeType = $.let(GetField(node, "type"));
                  $.pushLast(sccNodes, node);
                  $.insertOrUpdate(sccNodeTypes, nodeType);
                });
                
                $.if(Equal(stackTop, current)).then($ => {
                  $.break(loopLabel);
                });
              });
              
              // Collect edges within this SCC
              $.forArray(sccNodes, ($, sccNode) => {
                const sccNodeId = $.let(GetField(sccNode, "id"));
                $.if(In(edgesBySource, sccNodeId)).then($ => {
                  const nodeEdges = $.let(Get(edgesBySource, sccNodeId));
                  $.forArray(nodeEdges, ($, edge) => {
                    const toId = $.let(GetField(edge, "to"));
                    const edgeType = $.let(GetField(edge, "type"));
                    // Only include edge if target is also in this SCC
                    $.if(In(sccNodeIds, toId)).then($ => {
                      $.pushLast(sccEdges, edge);
                      $.insertOrUpdate(sccEdgeTypes, edgeType);
                    });
                  });
                });
              });
              
              // Build SCC-local adjacency for source/target detection
              const sccIncomingEdges = $.let(NewSet(StringType));
              const sccOutgoingEdges = $.let(NewSet(StringType));
              
              $.forArray(sccEdges, ($, edge) => {
                const fromId = $.let(GetField(edge, "from"));
                const toId = $.let(GetField(edge, "to"));
                $.insertOrUpdate(sccOutgoingEdges, fromId);
                $.insertOrUpdate(sccIncomingEdges, toId);
              });
              
              // Detect sources and targets within SCC
              $.forArray(sccNodes, ($, sccNode) => {
                const sccNodeId = $.let(GetField(sccNode, "id"));
                
                // Source: no incoming edges within this SCC
                $.if(Not(In(sccIncomingEdges, sccNodeId))).then($ => {
                  $.pushLast(sccSources, sccNodeId);
                });
                
                // Target: no outgoing edges within this SCC
                $.if(Not(In(sccOutgoingEdges, sccNodeId))).then($ => {
                  $.pushLast(sccTargets, sccNodeId);
                });
              });
              
              // Apply filtering immediately to avoid building unnecessary structures
              let shouldInclude = $.let(Const(true));
              
              // Node type filtering: SCC must contain ALL types from at least one filter set
              $.if(hasNodeFiltering).then($ => {
                let nodeTypeMatch = $.let(Const(false));
                $.forArray(node_types, ($, requiredNodeTypeSet, _index, block) => {
                  $.if(SubsetEqual(requiredNodeTypeSet, sccNodeTypes)).then($ => {
                    $.assign(nodeTypeMatch, Const(true));
                    $.break(block); // Early termination
                  });
                });
                $.assign(shouldInclude, nodeTypeMatch);
              });
              
              // Edge type filtering: SCC must contain ALL types from at least one filter set
              $.if(And(shouldInclude, hasEdgeFiltering)).then($ => {
                let edgeTypeMatch = $.let(Const(false));
                $.forArray(edge_types, ($, requiredEdgeTypeSet, _index, block) => {
                  $.if(SubsetEqual(requiredEdgeTypeSet, sccEdgeTypes)).then($ => {
                    $.assign(edgeTypeMatch, Const(true));
                    $.break(block); // Early termination
                  });
                });
                $.assign(shouldInclude, edgeTypeMatch);
              });
              
              // Only build and store subgraph if it passes all filtering criteria
              $.if(shouldInclude).then($ => {
                const subgraph = $.let(Struct({
                  nodes: ToArray(sccNodes),
                  edges: ToArray(sccEdges),
                  source_nodes: ToArray(sccSources),
                  target_nodes: ToArray(sccTargets),
                  node_types: ToSet(sccNodeTypes, v => v),
                  edge_types: ToSet(sccEdgeTypes, v => v)
                }));
                
                $.pushLast(filteredSubgraphs, subgraph);
              });
            });
          });
        });
      });
    });
    
    $.return(filteredSubgraphs);
  });