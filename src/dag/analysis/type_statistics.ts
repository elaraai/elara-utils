import { Procedure } from "@elaraai/core";
import {
  GetField,
  In,
  NewArray,
  NewSet,
  Not,
  Size,
  Struct,
} from "@elaraai/core";

import { ArrayType, StringType } from "@elaraai/core";

import { graph_aggregation_by_type } from "./type_aggregation";
import { graph_build_adjacency_lists } from "../core/build_adjacency_lists";
import {
  GraphNode,
  GraphEdge,
  GraphTypeStatistics,
} from "../types";

/**
 * Graph Type Statistics - analysis of node types and type-based metrics without full traversal
 * 
 * Provides type-focused analysis of graph structure, identifying node type patterns,
 * source/target types, and type transition probabilities. Optimized for efficiency
 * by avoiding expensive traversal operations.
 * 
 * **Statistics Provided:**
 * - **Basic counts**: Total nodes and edges
 * - **Type analysis**: Unique node types and counts per type
 * - **Source/target analysis**: Types with no incoming/outgoing edges
 * - **Type transitions**: Probability matrix of type-to-type connections
 * 
 * **Example:**
 * ```
 * Input Graph:                    Types:                    Result:
 *     A ──┐                         A: "input"               node_count: 4
 *         ├──→ B                     B: "process"             edge_count: 3  
 *         └──→ C ──→ D               C: "process"             node_types: ["input", "process", "output"]
 *                                   D: "output"              unique_node_types_count: 3
 *                                                           source_node_types: ["input"]
 *                                                           target_node_types: ["output"]
 * ```
 * 
 * **Efficiency:**
 * - No graph traversal required - O(N + E) complexity
 * - Reuses `graph_aggregation_by_type` for core analysis
 * - Single-pass algorithms with minimal memory allocation
 * 
 * **Use Cases:**
 * - **Type distribution analysis**: "What types of operations are most common?"
 * - **Interface identification**: "What are the entry and exit points?"
 * - **Type flow patterns**: "How do different types connect?"
 * - **Quick graph profiling**: "What's the high-level structure?"
 * 
 * **Algorithm:**
 * 1. Use existing type aggregation for node/edge counts and transitions
 * 2. Build adjacency lists to identify actual source/target nodes
 * 3. Extract type information without expensive traversal
 * 
 * @param nodes Array of graph nodes with id and type
 * @param edges Array of directed edges representing dependencies (from → to)
 * @returns Type-focused graph statistics without traversal metrics
 */
export const graph_type_statistics = new Procedure("graph_type_statistics")
  .input("nodes", ArrayType(GraphNode))
  .input("edges", ArrayType(GraphEdge))
  .output(GraphTypeStatistics)
  .import(graph_aggregation_by_type)
  .import(graph_build_adjacency_lists)
  .body(($, { nodes, edges }, procs) => {
    // Build adjacency lists for structural analysis
    const adjacencyData = $.let(procs.graph_build_adjacency_lists(Struct({ edges })));
    const adjacencyList = $.let(GetField(adjacencyData, "adjacency_list"));
    const reverseAdjacencyList = $.let(GetField(adjacencyData, "reverse_adjacency_list"));
    // Get type aggregation results - reuses existing efficient procedure
    const typeAggregation = $.let(procs.graph_aggregation_by_type(Struct({ nodes, edges })));
    const aggregateNodes = $.let(GetField(typeAggregation, "aggregate_nodes"));
    const aggregateEdges = $.let(GetField(typeAggregation, "aggregate_edges"));
    
    // Calculate basic counts
    const nodeCount = $.let(Size(nodes));
    const edgeCount = $.let(Size(edges));
    
    // Extract unique node types from all nodes (not just aggregate nodes which only include those with edges)
    const allNodeTypes = $.let(NewSet(StringType));
    const nodeTypes = $.let(NewArray(StringType));
    
    // Collect all unique node types from actual nodes
    $.forArray(nodes, ($, node) => {
      const nodeType = $.let(GetField(node, "type"));
      $.insertOrUpdate(allNodeTypes, nodeType);
    });
    
    // Convert set to array for output
    $.forSet(allNodeTypes, ($, nodeType) => {
      $.pushLast(nodeTypes, nodeType);
    });
    
    // uniqueNodeTypesCount will be calculated later
    
    // Find actual source and target node types (not just type transitions)
    const sourceNodeTypes = $.let(NewSet(StringType));
    const targetNodeTypes = $.let(NewSet(StringType));
    const sourceNodeTypesArray = $.let(NewArray(StringType));
    const targetNodeTypesArray = $.let(NewArray(StringType));
    
    // Identify source nodes (no incoming edges) and target nodes (no outgoing edges)
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      const nodeType = $.let(GetField(node, "type"));
      
      // Check if node has incoming edges (not a source)
      const hasIncoming = $.let(In(reverseAdjacencyList, nodeId));
      
      // Check if node has outgoing edges (not a target)
      const hasOutgoing = $.let(In(adjacencyList, nodeId));
      
      // Source nodes: no incoming edges
      $.if(Not(hasIncoming)).then($ => {
        $.insertOrUpdate(sourceNodeTypes, nodeType);
      });
      
      // Target nodes: no outgoing edges
      $.if(Not(hasOutgoing)).then($ => {
        $.insertOrUpdate(targetNodeTypes, nodeType);
      });
    });
    
    // Convert sets to arrays for output
    $.forSet(sourceNodeTypes, ($, nodeType) => {
      $.pushLast(sourceNodeTypesArray, nodeType);
    });
    
    $.forSet(targetNodeTypes, ($, nodeType) => {
      $.pushLast(targetNodeTypesArray, nodeType);
    });
    
    // No additional structural metrics needed for type statistics
    // This procedure focuses on type analysis without expensive traversal
    
    // Calculate unique node types count right before return to ensure proper field ordering
    const uniqueNodeTypesCount = $.let(Size(nodeTypes));
    
    // Return type-focused statistics - field order must match GraphTypeStatistics exactly
    $.return(Struct({
      node_count: nodeCount,
      edge_count: edgeCount,
      node_types: nodeTypes,
      unique_node_types_count: uniqueNodeTypesCount,
      source_node_types: sourceNodeTypesArray,
      target_node_types: targetNodeTypesArray,
      aggregate_nodes: aggregateNodes,
      aggregate_edges: aggregateEdges
    }));
  });