import { Procedure, ToArray, ToSet } from "@elaraai/core";
import {
  And,
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
  SubsetEqual,
  Subtract,
} from "@elaraai/core";

import { ArrayType, SetType, StringType } from "@elaraai/core";

import { graph_build_adjacency_lists } from "../core";
import {
  GraphNode,
  GraphEdge,
  GraphPathSubgraph,
} from "../types";

/**
 * Graph Subgraph Extraction - Extract subgraphs from connected components with efficient set-based filtering
 * 
 * **Purpose**: Returns subgraphs for connected components in the graph with advanced filtering capabilities.
 * Uses efficient set intersection operations to filter components that contain complete sets of required
 * node types and/or edge types. A subgraph must contain ALL node types from at least one filter set
 * to be included in results.
 * 
 * **Key Assumptions**:
 * - Graph may contain multiple disconnected components
 * - Node types and edge types are string identifiers
 * - Filtering requires complete intersection (all types in a filter set must be present)
 * - Empty filter arrays mean no filtering (return all components)
 * - Source/target nodes are auto-detected within each component
 * 
 * **Time Complexity**: O(V + E + F×T) where:
 * - V = number of vertices in the graph  
 * - E = number of edges in the graph
 * - F = number of filter sets (node_types.length + edge_types.length)
 * - T = average types per component (for intersection operations)
 * 
 * **Space Complexity**: O(V + E + C×T) for:
 * - Connected component storage: O(V + E)
 * - Type tracking per component: O(C×T) where C = component count
 * - Adjacency lists and lookups: O(V + E)
 * 
 * **Input Parameters**:
 * @param nodes - Array of GraphNode objects containing node definitions
 * @param edges - Array of GraphEdge objects representing connections
 * @param node_types - Array of sets where each set contains required node types (complete intersection required)
 * @param edge_types - Array of sets where each set contains required edge types (complete intersection required)
 * 
 * **Output Structure**:
 * @returns GraphPathSubgraphsResult containing:
 * - subgraphs: Array of complete subgraphs that match filtering criteria
 * - Each subgraph includes nodes, edges, source_nodes, and target_nodes
 * 
 * **Behavior Examples**:
 * ```
 * Example 1: Node Type Filtering
 * Input: node_types = [Set(["input", "process"]), Set(["output"])]
 * Behavior: Include subgraphs that contain ALL of {input, process} OR ALL of {output}
 * 
 * Example 2: Edge Type Filtering  
 * Input: edge_types = [Set(["flow", "control"]), Set(["data"])]
 * Behavior: Include subgraphs that contain ALL of {flow, control} OR ALL of {data}
 * 
 * Example 3: Combined Filtering
 * Input: node_types = [Set(["input"])], edge_types = [Set(["flow"])]
 * Behavior: Include subgraphs that contain input nodes AND flow edges
 * 
 * Example 4: No Filtering
 * Input: node_types = [], edge_types = []
 * Behavior: Return all connected components as subgraphs
 * ```
 * 
 * **Edge Cases Handled**:
 * - Empty filter arrays: No filtering applied, return all components
 * - No matching components: Return empty subgraphs array
 * - Single node components: Properly handled for source/target detection
 * - Self-loops: Included in edge type analysis
 * - Disconnected components: Each processed independently
 * 
 * **Use Cases**:
 * - Workflow analysis: "Show me all workflows that have complete input→process→output chains"
 * - Quality control: "Find subgraphs with all required processing steps"
 * - Feature extraction: "Extract components that contain specific type combinations"
 * - Debugging connectivity: "Why do I have disconnected pieces missing required types?"
 * - Data validation: "Which components have incomplete type coverage?"
 * 
 * **Algorithm Details**:
 * 1. Find connected components using optimized O(V + E) algorithm
 * 2. Build type sets for each component during DFS traversal
 * 3. Apply filtering immediately after component discovery (avoids redundant work)
 * 4. Only build complete subgraph structures for components that pass filters
 * 5. Auto-detect source/target nodes within each component
 * 6. Return filtered subgraphs with all metadata
 */
export const graph_subgraphs = new Procedure("graph_subgraphs")
  .input("nodes", ArrayType(GraphNode))
  .input("edges", ArrayType(GraphEdge))
  .input("node_types", ArrayType(SetType(StringType)))
  .input("edge_types", ArrayType(SetType(StringType)))
  .output(ArrayType(GraphPathSubgraph))
  .import(graph_build_adjacency_lists)
  .body(($, { nodes, edges, node_types, edge_types }, procs) => {
    
    // OPTIMIZATION 1: Single adjacency build (no edge doubling, no double construction)
    const adjacencyData = $.let(procs.graph_build_adjacency_lists(Struct({ edges })));
    const forwardAdjacency = $.let(GetField(adjacencyData, "adjacency_list"));
    const reverseAdjacency = $.let(GetField(adjacencyData, "reverse_adjacency_list"));
    
    // OPTIMIZATION 2: Pre-group edges by source for O(E) component edge collection
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
    
    // Build node lookup map for efficient O(1) node access by ID
    const nodeLookup = $.let(NewDict(StringType, GraphNode));
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      $.insertOrUpdate(nodeLookup, nodeId, node);
    });
    
    // Find connected components and build filtered subgraphs directly in single DFS traversal
    const visited = $.let(NewSet(StringType));
    const filteredSubgraphs = $.let(NewArray(GraphPathSubgraph));
    
    // Pre-calculate filtering flags for efficiency
    const hasNodeFiltering = $.let(Greater(Size(node_types), Const(0n)));
    const hasEdgeFiltering = $.let(Greater(Size(edge_types), Const(0n)));
    
    // OPTIMIZATION 1: O(N+E) component discovery using unvisited queue
    const unvisitedQueue = $.let(NewArray(StringType));
    $.forArray(nodes, ($, node) => {
      $.pushLast(unvisitedQueue, GetField(node, "id"));
    });
    
    // Reusable arrays for memory efficiency
    const componentNodes = $.let(NewArray(GraphNode));
    const componentEdges = $.let(NewArray(GraphEdge));
    const componentSources = $.let(NewArray(StringType));
    const componentTargets = $.let(NewArray(StringType));
    const componentNodeTypes = $.let(NewSet(StringType));
    const componentEdgeTypes = $.let(NewSet(StringType));
    const stack = $.let(NewArray(StringType));
    
    // OPTIMIZATION 4&5: Cache adjacency lookups to avoid repeated dictionary access
    const cachedForwardNeighbors = $.let(NewArray(StringType));
    const cachedReverseNeighbors = $.let(NewArray(StringType));
    
    $.while(Greater(Size(unvisitedQueue), Const(0n)), $ => {
      const startNodeId = $.let(Get(unvisitedQueue, Const(0n)));
      $.deleteFirst(unvisitedQueue);
      
      $.if(Not(In(visited, startNodeId))).then($ => {        
        // Clear reusable arrays for new component
        $.clear(componentNodes);
        $.clear(componentEdges);
        $.clear(componentSources);
        $.clear(componentTargets);
        $.clear(componentNodeTypes);
        $.clear(componentEdgeTypes);
        $.clear(stack);
        
        $.pushLast(stack, startNodeId);
        
        // DFS to find all nodes in this component
        $.while(Greater(Size(stack), Const(0n)), $ => {
          const currentNodeId = $.let(Get(stack, Subtract(Size(stack), Const(1n))));
          $.deleteLast(stack);
          
          $.if(Not(In(visited, currentNodeId))).then($ => {
            $.insertOrUpdate(visited, currentNodeId);
            
            // Get node object from lookup map - O(1) instead of O(N)
            $.if(In(nodeLookup, currentNodeId)).then($ => {
              const node = $.let(Get(nodeLookup, currentNodeId));
              const nodeType = $.let(GetField(node, "type"));
              $.pushLast(componentNodes, node);
              $.insertOrUpdate(componentNodeTypes, nodeType);
              
              // Note: Source/target detection moved to after edge collection
              // to use component-local adjacency instead of global adjacency
            });
            
            // OPTIMIZATION 4&5: Cache adjacency lookups for reuse
            $.clear(cachedForwardNeighbors);
            $.clear(cachedReverseNeighbors);
            
            $.if(In(forwardAdjacency, currentNodeId)).then($ => {
              const forwardNeighbors = $.let(Get(forwardAdjacency, currentNodeId));
              $.forArray(forwardNeighbors, ($, neighborId) => {
                $.pushLast(cachedForwardNeighbors, neighborId);
              });
            });
            
            $.if(In(reverseAdjacency, currentNodeId)).then($ => {
              const reverseNeighbors = $.let(Get(reverseAdjacency, currentNodeId));
              $.forArray(reverseNeighbors, ($, neighborId) => {
                $.pushLast(cachedReverseNeighbors, neighborId);
              });
            });
            
            // Add forward neighbors to stack
            $.forArray(cachedForwardNeighbors, ($, neighborId) => {
              $.if(Not(In(visited, neighborId))).then($ => {
                $.pushLast(stack, neighborId);
              });
            });
            
            // Add reverse neighbors to stack (for undirected connectivity)
            $.forArray(cachedReverseNeighbors, ($, neighborId) => {
              $.if(Not(In(visited, neighborId))).then($ => {
                $.pushLast(stack, neighborId);
              });
            });
          });
        });
        
        // OPTIMIZATION 2: O(E) edge collection - build component node set efficiently
        const componentNodeIds = $.let(NewSet(StringType));
        $.forArray(componentNodes, ($, node) => {
          $.insertOrUpdate(componentNodeIds, GetField(node, "id"));
        });
        
        $.forArray(componentNodes, ($, node) => {
          const nodeId = $.let(GetField(node, "id"));
          $.if(In(edgesBySource, nodeId)).then($ => {
            const nodeEdges = $.let(Get(edgesBySource, nodeId));
            $.forArray(nodeEdges, ($, edge) => {
              const toId = $.let(GetField(edge, "to"));
              const edgeType = $.let(GetField(edge, "type"));
              // Only include edge if target is also in this component
              $.if(In(componentNodeIds, toId)).then($ => {
                $.pushLast(componentEdges, edge);
                $.insertOrUpdate(componentEdgeTypes, edgeType);
              });
            });
          });
        });
        
        // Build component-local adjacency for accurate source/target detection
        const componentIncomingEdges = $.let(NewSet(StringType));
        const componentOutgoingEdges = $.let(NewSet(StringType));
        
        $.forArray(componentEdges, ($, edge) => {
          const fromId = $.let(GetField(edge, "from"));
          const toId = $.let(GetField(edge, "to"));
          $.insertOrUpdate(componentOutgoingEdges, fromId);
          $.insertOrUpdate(componentIncomingEdges, toId);
        });
        
        // Detect sources and targets based on component-local edges
        $.forArray(componentNodes, ($, node) => {
          const nodeId = $.let(GetField(node, "id"));
          
          // Source: no incoming edges within this component
          $.if(Not(In(componentIncomingEdges, nodeId))).then($ => {
            $.pushLast(componentSources, nodeId);
          });
          
          // Target: no outgoing edges within this component  
          $.if(Not(In(componentOutgoingEdges, nodeId))).then($ => {
            $.pushLast(componentTargets, nodeId);
          });
        });
        
        // Apply filtering immediately to avoid building unnecessary data structures
        let shouldInclude = $.let(Const(true));
        
        // Node type filtering: component must contain ALL types from at least one filter set
        $.if(hasNodeFiltering).then($ => {
          let nodeTypeMatch = $.let(Const(false));
          $.forArray(node_types, ($, requiredNodeTypeSet, _index, block) => {
            // Efficient: check if required set ⊆ component types (all required types present)
            $.if(SubsetEqual(requiredNodeTypeSet, componentNodeTypes)).then($ => {
              $.assign(nodeTypeMatch, Const(true));
              $.break(block); // Early termination - break on first match
            });
          });
          $.assign(shouldInclude, nodeTypeMatch);
        });
        
        // Edge type filtering: component must contain ALL types from at least one filter set  
        $.if(And(shouldInclude, hasEdgeFiltering)).then($ => {
          let edgeTypeMatch = $.let(Const(false));
          $.forArray(edge_types, ($, requiredEdgeTypeSet, _index, block) => {
            // Efficient: check if required set ⊆ component types (all required types present)
            $.if(SubsetEqual(requiredEdgeTypeSet, componentEdgeTypes)).then($ => {
              $.assign(edgeTypeMatch, Const(true));
              $.break(block); // Early termination - break on first match
            });
          });
          $.assign(shouldInclude, edgeTypeMatch);
        });
        
        // Only build and store subgraph if it passes all filtering criteria
        $.if(shouldInclude).then($ => {
          const subgraph = $.let(Struct({
            nodes: ToArray(componentNodes),
            edges: ToArray(componentEdges),
            source_nodes: ToArray(componentSources),
            target_nodes: ToArray(componentTargets),
            node_types: ToSet(componentNodeTypes, v => v),
            edge_types: ToSet(componentEdgeTypes, v => v)
          }));
          
          $.pushLast(filteredSubgraphs, subgraph);
        })
      });
    });
    
    $.return(filteredSubgraphs);
  });