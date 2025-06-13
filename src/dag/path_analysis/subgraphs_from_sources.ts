import { Procedure } from "@elaraai/core";
import {
  Add,
  And,
  Const,
  Equal,
  Get,
  GetField,
  Greater,
  In,
  NewArray,
  NewDict,
  NewSet,
  Size,
  StringJoin,
  Struct,
} from "@elaraai/core";

import { ArrayType, SetType, StringType, StructType } from "@elaraai/core";

import { graph_build_adjacency_lists } from "../shared_utils";
import { graph_connected_components } from "../flow_conservation";
import {
  GraphNode,
  GraphEdge,
  PathSubgraph,
  PathSubgraphsResult,
} from "../types";

/**
 * Extract subgraphs based on connected components containing source node types.
 * 
 * This procedure groups source nodes that belong to the same connected component into 
 * single subgraphs, representing workflows with multiple entry points that can reach 
 * shared nodes. Only components containing at least one source node are included.
 * 
 * **Algorithm**: 
 * 1. Find all connected components in the graph (treating edges as undirected for connectivity)
 * 2. Identify which components contain source nodes
 * 3. Process all edges in single pass: build adjacency list + filter edges by component
 * 4. Process all nodes in single pass: classify and group by component (O(V) batch processing)
 * 5. Assemble final subgraphs only for components containing source nodes
 * 
 * **Key Behavior:**
 * - **Connected sources**: Multiple sources in the same connected component are grouped into a single subgraph
 * - **Isolated sources**: Sources in separate components each get their own subgraph  
 * - **Component isolation**: Each subgraph contains only nodes and edges from its connected component
 * - **Source validation**: Components without any source nodes are excluded entirely
 * 
 * **Example 1 - Connected Sources (Multiple Entry Points):**
 * ```
 * Input Graph:                    Result: Single subgraph
 *     A (source) ──→ C ──→ E      {
 *                    ↗              nodes: [A,B,C,D,E], 
 *     B (source) ──→ D ──→ E        edges: [A→C, B→D, C→E, D→E],
 *                                   source_nodes: [A,B], 
 *                                   target_nodes: [E]
 *                                 }
 * ```
 * 
 * **Example 2 - Disconnected Components:**
 * ```
 * Input Graph:                    Result: Three separate subgraphs
 *     A (source) ──→ B            Subgraph 1: {nodes: [A,B], edges: [A→B], sources: [A], targets: [B]}
 *     C (source) ──→ D            Subgraph 2: {nodes: [C,D], edges: [C→D], sources: [C], targets: [D]}  
 *     E (source) ──→ F            Subgraph 3: {nodes: [E,F], edges: [E→F], sources: [E], targets: [F]}
 *     (no connections between components)
 * ```
 * 
 * **Example 3 - Mixed Connected/Isolated:**
 * ```
 * Input Graph:                    Result: Three subgraphs
 *     A (source) ──→ C ──→ E      Subgraph 1: {nodes: [A,B,C,D,E], sources: [A,B], targets: [E]}
 *                    ↗            Subgraph 2: {nodes: [F], sources: [F], targets: []}
 *     B (source) ──→ D ──→ E      Subgraph 3: {nodes: [G,H], sources: [G], targets: [H]}
 *     F (source) [isolated]
 *     G (source) ──→ H
 * ```
 * 
 * **Target Node Detection:**
 * - If `target_node_types` is specified: nodes matching those types are marked as targets
 * - If `target_node_types` is empty: nodes with no outgoing edges are automatically marked as targets
 * 
 * @param nodes - All nodes in the full graph  
 * @param edges - All edges in the full graph
 * @param source_node_types - Node types to treat as workflow entry points (must contain at least one type)
 * @param target_node_types - Node types to treat as workflow endpoints (can be empty set)
 * @returns PathSubgraphsResult containing one subgraph per connected component that has source nodes
 */
export const graph_subgraphs_from_sources = new Procedure("graph_subgraphs_from_sources")
  .input("nodes", ArrayType(GraphNode))
  .input("edges", ArrayType(GraphEdge))
  .input("source_node_types", SetType(StringType))
  .input("target_node_types", SetType(StringType))
  .output(PathSubgraphsResult)
  .import(graph_build_adjacency_lists)
  .import(graph_connected_components)
  .body(($, { nodes, edges, source_node_types, target_node_types }, procs) => {
    const nodeCount = $.let(Size(nodes));
    const edgeCount = $.let(Size(edges));
    const sourceTypeCount = $.let(Size(source_node_types));

    $.log(StringJoin`Starting connected component subgraph extraction: ${nodeCount} nodes, ${edgeCount} edges, ${sourceTypeCount} source types`);

    // Validate source_node_types is not empty
    $.if(Equal(Size(source_node_types), Const(0n))).then($ => {
      $.error(Const("source_node_types must contain at least one element"));
    });

    // Build node dictionary and collect source nodes
    $.log(Const("Building node dictionary and collecting source nodes..."));
    const nodeDict = $.let(NewDict(StringType, GraphNode));
    const sourceNodeIds = $.let(NewSet(StringType));

    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      const nodeType = $.let(GetField(node, "type"));
      $.insert(nodeDict, nodeId, node);

      $.if(In(source_node_types, nodeType)).then($ => {
        $.insert(sourceNodeIds, nodeId);
      });
    });

    const foundSourceCount = $.let(Size(sourceNodeIds));
    $.log(StringJoin`Found ${foundSourceCount} source nodes of specified types`);

    // Early exit if no source nodes
    $.if(Equal(Size(sourceNodeIds), Const(0n))).then($ => {
      $.log(Const("No source nodes found - returning empty result"));
      $.return(Struct({
        subgraphs: NewArray(PathSubgraph)
      }));
    });

    // Find connected components
    $.log(Const("Finding connected components..."));
    const connectedComponentsResult = $.let(procs.graph_connected_components(Struct({ nodes, edges })));
    const componentAssignments = $.let(GetField(connectedComponentsResult, "component_assignments"));
    const componentInfo = $.let(GetField(connectedComponentsResult, "component_info"));

    $.log(StringJoin`Found ${Size(componentInfo)} connected components`);

    // Build maps for fast lookups
    const nodeToComponent = $.let(NewDict(StringType, StringType)); // nodeId -> componentId
    $.forArray(componentAssignments, ($, assignment) => {
      const nodeId = $.let(GetField(assignment, "node_id"));
      const componentId = $.let(GetField(assignment, "component_id"));
      $.insert(nodeToComponent, nodeId, componentId);
    });

    // Group source nodes by their connected components
    const componentToSources = $.let(NewDict(StringType, ArrayType(StringType))); // componentId -> [sourceIds]
    $.forSet(sourceNodeIds, ($, sourceId) => {
      const componentId = $.let(Get(nodeToComponent, sourceId));
      $.if(In(componentToSources, componentId)).then($ => {
        const sources = $.let(Get(componentToSources, componentId));
        $.pushLast(sources, sourceId);
      }).else($ => {
        $.insert(componentToSources, componentId, NewArray(StringType, [sourceId]));
      });
    });

    // Combined edge processing: build adjacency (for target detection) and filter by component in single O(E) pass
    $.log(Const("Processing edges for adjacency and component filtering..."));
    const adjacencyDict = $.let(NewDict(StringType, SetType(StringType)));
    const componentToEdges = $.let(NewDict(StringType, ArrayType(GraphEdge)));
    const needAdjacency = $.let(Equal(Size(target_node_types), Const(0n)));

    $.forArray(edges, ($, edge) => {
      const fromId = $.let(GetField(edge, "from"));
      const toId = $.let(GetField(edge, "to"));

      // Build adjacency list if needed (when target_node_types is empty)
      $.if(needAdjacency).then($ => {
        $.if(In(adjacencyDict, fromId)).then($ => {
          const neighbors = $.let(Get(adjacencyDict, fromId));
          $.insert(neighbors, toId);
        }).else($ => {
          $.insert(adjacencyDict, fromId, NewSet(StringType, [toId]));
        });
      });

      // Filter edges by component (only include if both nodes in same component)
      $.if(
        And(
          In(nodeToComponent, fromId),
          In(nodeToComponent, toId),
          Equal(Get(nodeToComponent, fromId), Get(nodeToComponent, toId))
        ),
      ).then($ => {
        const componentId = $.let(Get(nodeToComponent, fromId));
        $.if(In(componentToEdges, componentId))
          .then($ => {
            const componentEdges = $.let(Get(componentToEdges, componentId));
            $.pushLast(componentEdges, edge);
          })
          .else($ => {
            $.insert(componentToEdges, componentId, NewArray(GraphEdge, [edge]));
          });
      });
    });

    // Debug: log the component-to-edges mapping
    const totalComponentsWithEdges = $.let(Size(componentToEdges));
    $.log(StringJoin`Edge filtering complete: ${totalComponentsWithEdges} components have edges`);

    // Build subgraphs using O(V) batch processing instead of O(C×V) per-component processing
    $.log(Const("Building subgraphs for components with source nodes..."));
    
    // Initialize subgraph data structures for each component that has sources
    const componentSubgraphs = $.let(NewDict(StringType, StructType({
      nodes: ArrayType(GraphNode),
      source_nodes: ArrayType(GraphNode), 
      target_nodes: ArrayType(GraphNode),
      edges: ArrayType(GraphEdge)
    })));
    
    const totalComponentsWithSources = $.let(Size(componentToSources));
    $.log(StringJoin`Initializing subgraphs for ${totalComponentsWithSources} components with source nodes`);
    
    // Initialize arrays for each component with sources
    $.forDict(componentToSources, ($, _sourceList, componentId) => {
      $.insert(componentSubgraphs, componentId, Struct({
        nodes: NewArray(GraphNode),
        source_nodes: NewArray(GraphNode),
        target_nodes: NewArray(GraphNode), 
        edges: NewArray(GraphEdge)
      }));
    });

    // O(V) batch processing: iterate all nodes once, classify and group by component
    $.log(Const("Processing all nodes in single pass..."));
    const processedNodes = $.let(Const(0n));
    
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      const nodeType = $.let(GetField(node, "type"));
      const componentId = $.let(Get(nodeToComponent, nodeId));
      
      // Only process nodes in components that have sources
      $.if(In(componentSubgraphs, componentId)).then($ => {
        const subgraphData = $.let(Get(componentSubgraphs, componentId));
        const nodeArray = $.let(GetField(subgraphData, "nodes"));
        const sourceArray = $.let(GetField(subgraphData, "source_nodes"));
        const targetArray = $.let(GetField(subgraphData, "target_nodes"));
        
        // Add node to component's node list
        $.pushLast(nodeArray, node);
        
        // Classify as source if type matches
        $.if(In(source_node_types, nodeType)).then($ => {
          $.pushLast(sourceArray, node);
        });
        
        // Classify as target based on type or outgoing edges
        $.if(Greater(Size(target_node_types), Const(0n))).then($ => {
          // Use explicit target types
          $.if(In(target_node_types, nodeType)).then($ => {
            $.pushLast(targetArray, node);
          });
        }).else($ => {
          // Use nodes with no outgoing edges as targets
          $.if(In(adjacencyDict, nodeId)).then(() => {
            // Node has outgoing edges, not a target
          }).else($ => {
            // Node has no outgoing edges, it's a target
            $.pushLast(targetArray, node);
          });
        });
      });
      
      // Progress logging every 100k nodes
      $.assign(processedNodes, Add(processedNodes, Const(1n)));
      $.if(Equal(processedNodes, Const(100000n))).then($ => {
        $.log(StringJoin`Processed 100k/${nodeCount} nodes...`);
      });
      $.if(Equal(processedNodes, Const(500000n))).then($ => {
        $.log(StringJoin`Processed 500k/${nodeCount} nodes...`);
      });
      $.if(Equal(processedNodes, Const(1000000n))).then($ => {
        $.log(StringJoin`Processed 1M/${nodeCount} nodes...`);
      });
    });

    // Add edges to their respective component subgraphs  
    $.log(Const("Adding edges to component subgraphs..."));
    $.forDict(componentToEdges, ($, edgeArray, componentId) => {
      $.if(In(componentSubgraphs, componentId)).then($ => {
        const subgraphData = $.let(Get(componentSubgraphs, componentId));
        const subgraphEdges = $.let(GetField(subgraphData, "edges"));
        
        $.forArray(edgeArray, ($, edge) => {
          $.pushLast(subgraphEdges, edge);
        });
      });
    });

    // Convert component subgraphs to final result array
    $.log(Const("Converting to final subgraph array..."));
    const subgraphs = $.let(NewArray(PathSubgraph));
    
    $.forDict(componentSubgraphs, ($, subgraphData, _componentId) => {
      const subgraph = $.let(Struct({
        nodes: GetField(subgraphData, "nodes"),
        edges: GetField(subgraphData, "edges"), 
        source_nodes: GetField(subgraphData, "source_nodes"),
        target_nodes: GetField(subgraphData, "target_nodes")
      }));
      
      $.pushLast(subgraphs, subgraph);
    });

    const finalSubgraphCount = $.let(Size(subgraphs));
    $.log(StringJoin`Connected component extraction completed: found ${finalSubgraphCount} subgraphs with source nodes from ${foundSourceCount} total sources`);

    $.return(Struct({
      subgraphs: subgraphs
    }));
  });