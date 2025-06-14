import { Procedure } from "@elaraai/core";
import {
  And,
  Const,
  Get,
  GetField,
  Greater,
  In,
  NewArray,
  NewDict,
  Not,
  Size,
  StringJoin,
  Struct,
} from "@elaraai/core";

import { ArrayType, SetType, StringType, StructType } from "@elaraai/core";

import { graph_build_adjacency_lists } from "../core";
import { graph_connected_components } from "../connectivity/connected_components";
import {
  GraphNode,
  GraphEdge,
  GraphPathSubgraph,
  GraphPathSubgraphsResult,
} from "../types";

/**
 * Extract subgraphs from connected components with optional node type filtering.
 * 
 * Returns subgraphs for connected components in the graph. Can optionally filter to only
 * return components that contain at least one node of the specified types.
 * 
 * **Algorithm:**
 * 1. Find all connected components using optimized O(V + E) algorithm
 * 2. Group nodes and edges by their connected component
 * 3. Auto-detect source nodes (no incoming edges) and target nodes (no outgoing edges)
 * 4. Optionally filter components based on node types
 * 5. Return complete subgraphs for each (filtered) component
 * 
 * **Use Cases:**
 * - **Debugging connectivity**: "Why do I have many components from few nodes?"
 * - **Workflow analysis**: "Show me all workflows that involve specific node types"
 * - **Graph validation**: "What are the actual disconnected pieces?"
 * - **Data quality**: "Which components should be connected but aren't?"
 * 
 * **Examples:**
 * ```
 * // Get ALL components (no filtering)
 * subgraphs_from_components(nodes, edges, new Set([]))
 * 
 * // Get only components containing input nodes
 * subgraphs_from_components(nodes, edges, new Set(["input"]))
 * 
 * // Get components with either input OR process nodes  
 * subgraphs_from_components(nodes, edges, new Set(["input", "process"]))
 * ```
 * 
 * **Example Graph:**
 * ```
 * Input Graph:                    filter_by_types=[]     filter_by_types=["input"]
 *     A(input) ──→ B              3 subgraphs            1 subgraph (first only)
 *     C ──→ D ──→ E               
 *     F [isolated]                
 * ```
 * 
 * **Performance:**
 * - O(V + E) connected components analysis
 * - O(V) node grouping and filtering (single pass)
 * - O(E) edge filtering (single pass)
 * - Total: O(V + E) - efficient for large graphs
 * 
 * @param nodes All nodes in the graph
 * @param edges All edges in the graph
 * @param filter_by_types Node types to filter by. Empty set = no filtering (return all components)
 * @returns GraphPathSubgraphsResult with subgraphs for each matching connected component
 */
export const graph_subgraphs = new Procedure("graph_subgraphs")
  .input("nodes", ArrayType(GraphNode))
  .input("edges", ArrayType(GraphEdge))
  .input("filter_by_types", SetType(StringType))
  .output(GraphPathSubgraphsResult)
  .import(graph_build_adjacency_lists)
  .import(graph_connected_components)
  .body(($, { nodes, edges, filter_by_types }, procs) => {
    const nodeCount = $.let(Size(nodes));
    const edgeCount = $.let(Size(edges));
    
    $.log(StringJoin`Starting subgraph extraction from connected components: ${nodeCount} nodes, ${edgeCount} edges`);
    
    // Find connected components
    $.log(Const("Finding connected components..."));
    const componentsResult = $.let(procs.graph_connected_components(Struct({ nodes, edges })));
    const componentAssignments = $.let(GetField(componentsResult, "component_assignments"));
    const componentInfo = $.let(GetField(componentsResult, "component_info"));
    
    $.log(StringJoin`Found ${Size(componentInfo)} connected components`);
    
    // Build node-to-component lookup for O(1) edge filtering
    const nodeToComponent = $.let(NewDict(StringType, StringType));
    $.forArray(componentAssignments, ($, assignment) => {
      const nodeId = $.let(GetField(assignment, "node_id"));
      const componentId = $.let(GetField(assignment, "component_id"));
      $.insert(nodeToComponent, nodeId, componentId);
    });
    
    // Initialize subgraph data structures for each component
    $.log(Const("Initializing subgraph data structures..."));
    const componentSubgraphs = $.let(NewDict(StringType, StructType({
      nodes: ArrayType(GraphNode),
      edges: ArrayType(GraphEdge),
      source_nodes: ArrayType(GraphNode),
      target_nodes: ArrayType(GraphNode)
    })));
    
    // Initialize empty arrays for each component
    $.forArray(componentInfo, ($, component) => {
      const componentId = $.let(GetField(component, "component_id"));
      $.insert(componentSubgraphs, componentId, Struct({
        nodes: NewArray(GraphNode),
        edges: NewArray(GraphEdge),
        source_nodes: NewArray(GraphNode),
        target_nodes: NewArray(GraphNode)
      }));
    });
    
    // Group nodes by component in single O(V) pass
    $.log(Const("Grouping nodes by component..."));
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      const componentId = $.let(Get(nodeToComponent, nodeId));
      const subgraphData = $.let(Get(componentSubgraphs, componentId));
      const nodeArray = $.let(GetField(subgraphData, "nodes"));
      $.pushLast(nodeArray, node);
    });
    
    // Build adjacency lists for source/target detection  
    $.log(Const("Building adjacency lists for source/target detection..."));
    const adjacencyData = $.let(procs.graph_build_adjacency_lists(Struct({ edges })));
    const adjacencyList = $.let(GetField(adjacencyData, "adjacency_list"));
    const reverseAdjacencyList = $.let(GetField(adjacencyData, "reverse_adjacency_list"));
    
    // Filter edges by component in single O(E) pass
    $.log(Const("Filtering edges by component..."));
    $.forArray(edges, ($, edge) => {
      const fromId = $.let(GetField(edge, "from"));
      const toId = $.let(GetField(edge, "to"));
      
      // Only include edge if both nodes are in same component
      $.if(And(In(nodeToComponent, fromId), In(nodeToComponent, toId))).then($ => {
        const componentId = $.let(Get(nodeToComponent, fromId));
        const subgraphData = $.let(Get(componentSubgraphs, componentId));
        const edgeArray = $.let(GetField(subgraphData, "edges"));
        $.pushLast(edgeArray, edge);
      });
    });
    
    // Detect source and target nodes within each component
    $.log(Const("Detecting source and target nodes..."));
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      const componentId = $.let(Get(nodeToComponent, nodeId));
      
      const subgraphData = $.let(Get(componentSubgraphs, componentId));
      const sourceArray = $.let(GetField(subgraphData, "source_nodes"));
      const targetArray = $.let(GetField(subgraphData, "target_nodes"));
      
      // Check if node is a source (no incoming edges)
      $.if(Not(In(reverseAdjacencyList, nodeId))).then($ => {
        $.pushLast(sourceArray, node);
      });
      
      // Check if node is a target (no outgoing edges)
      $.if(Not(In(adjacencyList, nodeId))).then($ => {
        $.pushLast(targetArray, node);
      });
    });
    
    // Apply optional filtering by node types
    $.log(Const("Applying node type filtering..."));
    const filteredComponents = $.let(NewDict(StringType, StructType({
      nodes: ArrayType(GraphNode),
      edges: ArrayType(GraphEdge),
      source_nodes: ArrayType(GraphNode),
      target_nodes: ArrayType(GraphNode)
    })));
    
    $.if(Greater(Size(filter_by_types), Const(0n))).then($ => {
      // Filter: only include components that contain at least one node of specified types
      $.forDict(componentSubgraphs, ($, subgraphData, componentId) => {
        const componentNodes = $.let(GetField(subgraphData, "nodes"));
        const hasRequiredType = $.let(Const(false));
        
        $.forArray(componentNodes, ($, node) => {
          const nodeType = $.let(GetField(node, "type"));
          $.if(In(filter_by_types, nodeType)).then($ => {
            $.assign(hasRequiredType, Const(true));
          });
        });
        
        $.if(hasRequiredType).then($ => {
          $.insert(filteredComponents, componentId, subgraphData);
        });
      });
    }).else($ => {
      // No filtering: include all components
      $.forDict(componentSubgraphs, ($, subgraphData, componentId) => {
        $.insert(filteredComponents, componentId, subgraphData);
      });
    });
    
    // Convert to final subgraph result array
    $.log(Const("Converting to final subgraph array..."));
    const subgraphs = $.let(NewArray(GraphPathSubgraph));
    
    $.forDict(filteredComponents, ($, subgraphData, _componentId) => {
      const componentNodes = $.let(GetField(subgraphData, "nodes"));
      const componentEdges = $.let(GetField(subgraphData, "edges"));
      const sourceNodes = $.let(GetField(subgraphData, "source_nodes"));
      const targetNodes = $.let(GetField(subgraphData, "target_nodes"));
      
      // Build complete subgraph with detected sources and targets
      const subgraph = $.let(Struct({
        nodes: componentNodes,
        edges: componentEdges,
        source_nodes: sourceNodes,
        target_nodes: targetNodes
      }));
      
      $.pushLast(subgraphs, subgraph);
    });
    
    $.log(StringJoin`Subgraph extraction complete: created ${Size(subgraphs)} subgraphs from ${Size(componentInfo)} connected components`);
    
    $.return(Struct({
      subgraphs: subgraphs
    }));
  });