import { Procedure } from "@elaraai/core";
import {
  Add,
  Const,
  DivideSafe,
  Get,
  GetField,
  Greater,
  In,
  Multiply,
  NewArray,
  NewDict,
  NewSet,
  Not,
  Size,
  StringJoin,
  Struct,
} from "@elaraai/core";

import { ArrayType, FloatType, IntegerType, StringType, StructType } from "@elaraai/core";

import { 
  GraphEdge, 
  GraphNode, 
  GraphValidStatistics
} from "../types";

/**
 * Graph validation procedure - validates graph structure and provides aggregated statistics
 * 
 * Fast, efficient validation procedure optimized for bulk processing of large datasets.
 * Analyzes nodes and edges to identify structural problems and returns aggregated 
 * validation statistics suitable for processing thousands of subgraphs quickly.
 * 
 * **Example - Clean graph:**
 * ```
 * Input Graph:              Result Statistics:
 *     A ──→ B                total_node_count: 3
 *           │                valid_node_count: 3
 *           ▼                node_validity_ratio: 1.0
 *           C                connectivity_ratio: 1.0
 *                           problematic_node_types: []
 * ```
 * 
 * **Example - Graph with issues:**
 * ```
 * Input Graph:              Issues Found:           Result Statistics:
 * A ──→ [B missing]         B doesn't exist        total_node_count: 3
 * A ──→ [B missing]         Duplicate edge         valid_node_count: 2  
 * A (duplicate)             Duplicate node         duplicate_node_count: 1
 * D (orphaned)              No edges               dangling_edge_count: 2
 *                                                  node_validity_ratio: 0.67
 *                                                  connectivity_ratio: 0.5
 *                                                  problematic_node_types: [
 *                                                    {node_type: "orphan", 
 *                                                     orphaned_percentage: 100.0}
 *                                                  ]
 * ```
 * 
 * **Validation checks performed:**
 * 1. **Orphaned nodes**: Nodes that appear in node list but not referenced by any edges
 * 2. **Dangling edges**: Edges that reference nodes not present in the node list
 * 3. **Duplicate nodes**: Multiple nodes with the same ID (first occurrence kept)
 * 4. **Duplicate edges**: Multiple identical edges (same from/to pair, duplicates removed)
 * 
 * **Use Cases:**
 * - **Bulk validation**: "Validate 15K+ subgraphs efficiently"
 * - **Data quality overview**: "What percentage of my data is valid?"
 * - **Problem pattern identification**: "Which node types have the most issues?"
 * - **Preprocessing stats**: "Should I clean this data before expensive analysis?"
 * - **Triage**: "Which subgraphs need detailed investigation?"
 * 
 * **Performance:**
 * - O(V + E) time complexity - efficient for large graphs
 * 
 * **Algorithm:** Uses dictionaries to track node IDs and edge pairs for efficient
 * duplicate detection and orphan/dangling analysis. Calculates aggregated statistics only.
 * 
 * @param nodes Array of graph nodes to validate
 * @param edges Array of graph edges to validate
 * @returns Aggregated validation statistics for efficient bulk processing
 */
export const graph_validate = new Procedure("graph_validate")
  .input("nodes", ArrayType(GraphNode))
  .input("edges", ArrayType(GraphEdge))
  .output(GraphValidStatistics)
  .body(($, { nodes, edges }) => {
    // Basic counts
    const totalNodeCount = $.let(Size(nodes));
    const totalEdgeCount = $.let(Size(edges));
    
    // Early termination for large graphs to prevent memory exhaustion
    // For production safety on 2M-5M node graphs
    const maxNodes = $.let(Const(1000000n)); // 1M node safety limit
    const maxEdges = $.let(Const(5000000n)); // 5M edge safety limit
    
    $.if(Greater(totalNodeCount, maxNodes)).then($ => {
      $.error(StringJoin([
        Const("Graph too large for validation: "), 
        totalNodeCount, 
        Const(" nodes exceeds limit of "), 
        maxNodes
      ]));
    });
    
    $.if(Greater(totalEdgeCount, maxEdges)).then($ => {
      $.error(StringJoin([
        Const("Graph too large for validation: "), 
        totalEdgeCount, 
        Const(" edges exceeds limit of "), 
        maxEdges
      ]));
    });
    
    // Step 1: Analyze nodes for duplicates and build valid node map
    const nodeIdMap = $.let(NewDict(StringType, GraphNode)); // id -> first occurrence
    const nodeTypeMap = $.let(NewDict(StringType, StringType)); // id -> type (for first occurrence)
    const nodeCountMap = $.let(NewDict(StringType, IntegerType)); // id -> count
    const duplicateNodeCount = $.let(Const(0n));
    const validNodes = $.let(NewArray(GraphNode));
    
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      
      // Count occurrences
      const currentCount = $.let(Get(nodeCountMap, nodeId, Const(0n)));
      $.insertOrUpdate(nodeCountMap, nodeId, Add(currentCount, Const(1n)));
      
      // Store first occurrence as the valid node
      $.if(Not(In(nodeIdMap, nodeId))).then($ => {
        const nodeType = $.let(GetField(node, "type"));
        $.insert(nodeIdMap, nodeId, node);
        $.insert(nodeTypeMap, nodeId, nodeType);
      });
    });
    
    // Build valid nodes array and count duplicates
    const validNodeIds = $.let(NewSet(StringType));
    $.forDict(nodeIdMap, ($, node, nodeId) => {
      $.pushLast(validNodes, node);
      $.insert(validNodeIds, nodeId);
      
      const count = $.let(Get(nodeCountMap, nodeId, Const(0n)));
      $.if(Greater(count, Const(1n))).then($ => {
        $.assign(duplicateNodeCount, Add(duplicateNodeCount, Const(1n)));
      });
    });
    
    const validNodeCount = $.let(Size(validNodes));
    
    // Step 2: Analyze edges for duplicates and dangling references
    const edgePairMap = $.let(NewDict(StringType, StructType({
      from: StringType,
      to: StringType, 
      count: IntegerType
    }))); // "from:to" -> edge info
    const validEdges = $.let(NewArray(GraphEdge));
    const duplicateEdgeCount = $.let(Const(0n));
    const danglingEdgeCount = $.let(Const(0n));
    const seenValidPairs = $.let(NewSet(StringType)); // Track unique valid edge pairs
    
    $.forArray(edges, ($, edge) => {
      const fromId = $.let(GetField(edge, "from"));
      const toId = $.let(GetField(edge, "to"));
      
      // Create edge pair key by joining from and to IDs with separator
      const edgeKey = $.let(StringJoin([fromId, Const(":"), toId]));
      
      // Track edge pair occurrences
      $.if(In(edgePairMap, edgeKey)).then($ => {
        const existingInfo = $.let(Get(edgePairMap, edgeKey));
        const existingCount = $.let(GetField(existingInfo, "count"));
        $.insertOrUpdate(edgePairMap, edgeKey, Struct({
          from: fromId,
          to: toId,
          count: Add(existingCount, Const(1n))
        }));
      }).else($ => {
        $.insert(edgePairMap, edgeKey, Struct({
          from: fromId,
          to: toId,
          count: Const(1n)
        }));
      });
      
      // Check if both nodes exist
      const fromExists = $.let(In(validNodeIds, fromId));
      const toExists = $.let(In(validNodeIds, toId));
      
      $.if(fromExists).then($ => {
        $.if(toExists).then($ => {
          // Valid edge - add if not already seen
          $.if(Not(In(seenValidPairs, edgeKey))).then($ => {
            $.pushLast(validEdges, edge);
            $.insert(seenValidPairs, edgeKey);
          });
        }).else($ => {
          // To node doesn't exist - count as dangling
          $.assign(danglingEdgeCount, Add(danglingEdgeCount, Const(1n)));
        });
      }).else($ => {
        // From node doesn't exist - count as dangling
        $.assign(danglingEdgeCount, Add(danglingEdgeCount, Const(1n)));
      });
    });
    
    const validEdgeCount = $.let(Size(validEdges));
    
    // Count duplicate edges
    $.forDict(edgePairMap, ($, edgeInfo, _edgeKey) => {
      const count = $.let(GetField(edgeInfo, "count"));
      $.if(Greater(count, Const(1n))).then($ => {
        $.assign(duplicateEdgeCount, Add(duplicateEdgeCount, Const(1n)));
      });
    });
    
    // Step 3: Find orphaned nodes (nodes not referenced by any valid edges)
    const referencedNodes = $.let(NewSet(StringType));
    $.forArray(validEdges, ($, edge) => {
      const fromId = $.let(GetField(edge, "from"));
      const toId = $.let(GetField(edge, "to"));
      
      // Use insertOrUpdate to handle duplicate references
      $.insertOrUpdate(referencedNodes, fromId);
      $.insertOrUpdate(referencedNodes, toId);
    });
    
    const orphanedNodeCount = $.let(Const(0n));
    $.forArray(validNodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      $.if(Not(In(referencedNodes, nodeId))).then($ => {
        $.assign(orphanedNodeCount, Add(orphanedNodeCount, Const(1n)));
      });
    });
    
    // Calculate ratios (using DivideSafe to handle division by zero)
    const nodeValidityRatio = $.let(DivideSafe(validNodeCount, totalNodeCount));
    const edgeValidityRatio = $.let(DivideSafe(validEdgeCount, totalEdgeCount));
    const connectivityRatio = $.let(DivideSafe(Size(referencedNodes), validNodeCount));
    
    // Analyze problematic node types
    const nodeTypeProblems = $.let(NewDict(StringType, StructType({
      total_count: IntegerType,
      orphaned_count: IntegerType
    })));
    
    // Initialize type counters
    $.forArray(validNodes, ($, node) => {
      const nodeType = $.let(GetField(node, "type"));
      const current = $.let(Get(nodeTypeProblems, nodeType, Struct({
        total_count: Const(0n),
        orphaned_count: Const(0n)
      })));
      const totalCount = $.let(GetField(current, "total_count"));
      $.insertOrUpdate(nodeTypeProblems, nodeType, Struct({
        total_count: Add(totalCount, Const(1n)),
        orphaned_count: GetField(current, "orphaned_count")
      }));
    });
    
    // Count orphaned nodes by type
    $.forArray(validNodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      const nodeType = $.let(GetField(node, "type"));
      $.if(Not(In(referencedNodes, nodeId))).then($ => {
        const current = $.let(Get(nodeTypeProblems, nodeType));
        const orphanedCount = $.let(GetField(current, "orphaned_count"));
        $.insertOrUpdate(nodeTypeProblems, nodeType, Struct({
          total_count: GetField(current, "total_count"),
          orphaned_count: Add(orphanedCount, Const(1n))
        }));
      });
    });
    
    // Build problematic node types array
    const problematicNodeTypes = $.let(NewArray(StructType({
      node_type: StringType,
      orphaned_count: IntegerType,
      total_count: IntegerType,
      orphaned_percentage: FloatType
    })));
    
    $.forDict(nodeTypeProblems, ($, typeInfo, nodeType) => {
      const totalCount = $.let(GetField(typeInfo, "total_count"));
      const orphanedCount = $.let(GetField(typeInfo, "orphaned_count"));
      const orphanedPercentage = $.let(Multiply(DivideSafe(orphanedCount, totalCount), Const(100.0)));
      
      $.pushLast(problematicNodeTypes, Struct({
        node_type: nodeType,
        orphaned_count: orphanedCount,
        total_count: totalCount,
        orphaned_percentage: orphanedPercentage
      }));
    });
    
    // Analyze problematic edge patterns using proper nested structure
    // Track edge patterns using a temporary lookup structure
    const edgePatternLookup = $.let(NewDict(StringType, StructType({
      from_type: StringType,
      to_type: StringType,
      valid_count: IntegerType,
      dangling_count: IntegerType
    })));
    
    // Count valid edges by type pattern
    $.forArray(validEdges, ($, edge) => {
      const fromId = $.let(GetField(edge, "from"));
      const toId = $.let(GetField(edge, "to"));
      const fromType = $.let(Get(nodeTypeMap, fromId, Const("unknown")));
      const toType = $.let(Get(nodeTypeMap, toId, Const("unknown")));
      const patternKey = $.let(StringJoin([fromType, Const("->"), toType]));
      
      const current = $.let(Get(edgePatternLookup, patternKey, Struct({
        from_type: fromType,
        to_type: toType,
        valid_count: Const(0n),
        dangling_count: Const(0n)
      })));
      const validCount = $.let(GetField(current, "valid_count"));
      $.insertOrUpdate(edgePatternLookup, patternKey, Struct({
        from_type: fromType,
        to_type: toType,
        valid_count: Add(validCount, Const(1n)),
        dangling_count: GetField(current, "dangling_count")
      }));
    });
    
    // Count dangling edges by type pattern (approximation based on available data)
    $.forArray(edges, ($, edge) => {
      const fromId = $.let(GetField(edge, "from"));
      const toId = $.let(GetField(edge, "to"));
      const fromExists = $.let(In(validNodeIds, fromId));
      const toExists = $.let(In(validNodeIds, toId));
      
      $.if(Not(fromExists)).then($ => {
        $.if(toExists).then($ => {
          const toType = $.let(Get(nodeTypeMap, toId, Const("unknown")));
          const patternKey = $.let(StringJoin([Const("unknown"), Const("->"), toType]));
          
          const current = $.let(Get(edgePatternLookup, patternKey, Struct({
            from_type: Const("unknown"),
            to_type: toType,
            valid_count: Const(0n),
            dangling_count: Const(0n)
          })));
          const danglingCount = $.let(GetField(current, "dangling_count"));
          $.insertOrUpdate(edgePatternLookup, patternKey, Struct({
            from_type: Const("unknown"),
            to_type: toType,
            valid_count: GetField(current, "valid_count"),
            dangling_count: Add(danglingCount, Const(1n))
          }));
        });
      }).else($ => {
        $.if(Not(toExists)).then($ => {
          const fromType = $.let(Get(nodeTypeMap, fromId, Const("unknown")));
          const patternKey = $.let(StringJoin([fromType, Const("->"), Const("unknown")]));
          
          const current = $.let(Get(edgePatternLookup, patternKey, Struct({
            from_type: fromType,
            to_type: Const("unknown"),
            valid_count: Const(0n),
            dangling_count: Const(0n)
          })));
          const danglingCount = $.let(GetField(current, "dangling_count"));
          $.insertOrUpdate(edgePatternLookup, patternKey, Struct({
            from_type: fromType,
            to_type: Const("unknown"),
            valid_count: GetField(current, "valid_count"),
            dangling_count: Add(danglingCount, Const(1n))
          }));
        });
      });
    });
    
    // Build problematic edge patterns array from lookup structure
    const problematicEdgePatterns = $.let(NewArray(StructType({
      from_type: StringType,
      to_type: StringType,
      dangling_count: IntegerType,
      valid_count: IntegerType,
      failure_rate: FloatType
    })));
    
    $.forDict(edgePatternLookup, ($, patternInfo, _patternKey) => {
      const fromType = $.let(GetField(patternInfo, "from_type"));
      const toType = $.let(GetField(patternInfo, "to_type"));
      const validCount = $.let(GetField(patternInfo, "valid_count"));
      const danglingCount = $.let(GetField(patternInfo, "dangling_count"));
      const totalCount = $.let(Add(validCount, danglingCount));
      const failureRate = $.let(Multiply(DivideSafe(danglingCount, totalCount), Const(100.0)));
      
      $.pushLast(problematicEdgePatterns, Struct({
        from_type: fromType,
        to_type: toType,
        dangling_count: danglingCount,
        valid_count: validCount,
        failure_rate: failureRate
      }));
    });
    
    $.return(Struct({
      total_node_count: totalNodeCount,
      total_edge_count: totalEdgeCount,
      valid_node_count: validNodeCount,
      valid_edge_count: validEdgeCount,
      orphaned_node_count: orphanedNodeCount,
      dangling_edge_count: danglingEdgeCount,
      duplicate_node_count: duplicateNodeCount,
      duplicate_edge_count: duplicateEdgeCount,
      node_validity_ratio: nodeValidityRatio,
      edge_validity_ratio: edgeValidityRatio,
      connectivity_ratio: connectivityRatio,
      problematic_node_types: problematicNodeTypes,
      problematic_edge_patterns: problematicEdgePatterns
    }));
  });