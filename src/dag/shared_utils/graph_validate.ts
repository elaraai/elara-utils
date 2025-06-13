import { Procedure } from "@elaraai/core";
import {
  Add,
  Const,
  Get,
  GetField,
  Greater,
  In,
  NewArray,
  NewDict,
  NewSet,
  Not,
  StringJoin,
  Struct,
} from "@elaraai/core";

import { ArrayType, IntegerType, StringType, StructType } from "@elaraai/core";

import { 
  GraphEdge, 
  GraphNode, 
  GraphValidateResult, 
  GraphDuplicateNode, 
  GraphDuplicateEdge,
  GraphDanglingEdge
} from "../types";

/**
 * Graph validation procedure - validates graph structure and identifies issues
 * 
 * Analyzes nodes and edges to identify structural problems and returns clean data 
 * along with validation issues. This is essential for ensuring graph algorithms 
 * operate on well-formed data and can help identify data quality problems.
 * 
 * **Validation checks performed:**
 * 1. **Orphaned nodes**: Nodes that appear in node list but not referenced by any edges
 * 2. **Dangling edges**: Edges that reference nodes not present in the node list
 * 3. **Duplicate nodes**: Multiple nodes with the same ID (first occurrence kept)
 * 4. **Duplicate edges**: Multiple identical edges (same from/to pair, duplicates removed)
 * 
 * **Example - Clean graph:**
 * ```
 * Input:
 * nodes: [{id: "A"}, {id: "B"}, {id: "C"}]
 * edges: [{from: "A", to: "B"}, {from: "B", to: "C"}]
 * 
 * Result:
 * valid_nodes: [{id: "A"}, {id: "B"}, {id: "C"}]
 * valid_edges: [{from: "A", to: "B"}, {from: "B", to: "C"}]
 * orphaned_nodes: []
 * dangling_edges: []
 * duplicate_nodes: []
 * duplicate_edges: []
 * ```
 * 
 * **Example - Graph with issues:**
 * ```
 * Input:
 * nodes: [{id: "A"}, {id: "A"}, {id: "B"}, {id: "D"}]
 * edges: [{from: "A", to: "B"}, {from: "A", to: "B"}, {from: "B", to: "C"}]
 * 
 * Result:
 * valid_nodes: [{id: "A"}, {id: "B"}]
 * valid_edges: [{from: "A", to: "B"}]
 * orphaned_nodes: [{id: "D"}]
 * dangling_edges: [{from: "B", to: "C"}]
 * duplicate_nodes: [{id: "A", count: 2, instances: [{id: "A"}, {id: "A"}]}]
 * duplicate_edges: [{from: "A", to: "B", count: 2}]
 * ```
 * 
 * **Use Cases:**
 * - **Data validation**: "Is this graph data well-formed for processing?"
 * - **Data cleaning**: "Remove invalid edges and duplicate nodes before analysis"
 * - **Quality assurance**: "What data quality issues exist in this graph?"
 * - **Preprocessing**: "Clean the graph before running expensive algorithms"
 * 
 * **Algorithm:**
 * 1. Build maps of existing node IDs and edge pairs
 * 2. Identify duplicate nodes and edges
 * 3. Create clean versions with duplicates removed
 * 4. Find dangling edges that reference non-existent nodes
 * 5. Find orphaned nodes not referenced by any valid edges
 * 
 * @param nodes Array of graph nodes to validate
 * @param edges Array of graph edges to validate
 * @returns Validation result with clean data and identified issues
 */
export const graph_validate = new Procedure("graph_validate")
  .input("nodes", ArrayType(GraphNode))
  .input("edges", ArrayType(GraphEdge))
  .output(GraphValidateResult)
  .body(($, { nodes, edges }) => {
    // Step 1: Analyze nodes for duplicates and build valid node map
    const nodeIdMap = $.let(NewDict(StringType, GraphNode)); // id -> first occurrence
    const nodeTypeMap = $.let(NewDict(StringType, StringType)); // id -> type (for first occurrence)
    const nodeCountMap = $.let(NewDict(StringType, IntegerType)); // id -> count
    const nodeInstanceMap = $.let(NewDict(StringType, ArrayType(GraphNode))); // id -> all instances
    const duplicateNodes = $.let(NewArray(GraphDuplicateNode));
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
        $.insert(nodeInstanceMap, nodeId, NewArray(GraphNode, [node]));
      }).else($ => {
        const instances = $.let(Get(nodeInstanceMap, nodeId, NewArray(GraphNode)));
        $.pushLast(instances, node);
      });
    });
    
    // Build valid nodes array and identify duplicates
    const validNodeIds = $.let(NewSet(StringType));
    $.forDict(nodeIdMap, ($, node, nodeId) => {
      $.pushLast(validNodes, node);
      $.insert(validNodeIds, nodeId);
      
      const count = $.let(Get(nodeCountMap, nodeId, Const(0n)));
      $.if(Greater(count, Const(1n))).then($ => {
        const instances = $.let(Get(nodeInstanceMap, nodeId, NewArray(GraphNode)));
        $.pushLast(duplicateNodes, Struct({
          id: nodeId,
          count: count,
          instances: instances
        }));
      });
    });
    
    // Step 2: Analyze edges for duplicates and dangling references
    const edgePairMap = $.let(NewDict(StringType, StructType({
      from: StringType,
      to: StringType, 
      count: IntegerType
    }))); // "from:to" -> edge info
    const validEdges = $.let(NewArray(GraphEdge));
    const danglingEdges = $.let(NewArray(GraphDanglingEdge));
    const duplicateEdges = $.let(NewArray(GraphDuplicateEdge));
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
          // To node doesn't exist - create dangling edge with type info
          const fromType = $.let(Get(nodeTypeMap, fromId, Const(null))); // null if missing
          $.pushLast(danglingEdges, Struct({
            from: fromId,
            from_type: fromType,
            to: toId,
            to_type: Const(null) // Unknown type since node doesn't exist
          }));
        });
      }).else($ => {
        // From node doesn't exist - create dangling edge with type info
        $.if(toExists).then($ => {
          const toType = $.let(Get(nodeTypeMap, toId, Const(null)));
          $.pushLast(danglingEdges, Struct({
            from: fromId,
            from_type: Const(null), // Unknown type since node doesn't exist
            to: toId,
            to_type: toType
          }));
        }).else($ => {
          // Both nodes don't exist
          $.pushLast(danglingEdges, Struct({
            from: fromId,
            from_type: Const(null), // Unknown type since node doesn't exist
            to: toId,
            to_type: Const(null) // Unknown type since node doesn't exist
          }));
        });
      });
    });
    
    // Build duplicate edges list
    $.forDict(edgePairMap, ($, edgeInfo, _edgeKey) => {
      const count = $.let(GetField(edgeInfo, "count"));
      $.if(Greater(count, Const(1n))).then($ => {
        const fromId = $.let(GetField(edgeInfo, "from"));
        const toId = $.let(GetField(edgeInfo, "to"));
        const fromType = $.let(Get(nodeTypeMap, fromId, Const(null))); // null if missing
        const toType = $.let(Get(nodeTypeMap, toId, Const(null))); // null if missing
        
        $.pushLast(duplicateEdges, Struct({
          from: fromId,
          from_type: fromType,
          to: toId,
          to_type: toType,
          count: count
        }));
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
    
    const orphanedNodes = $.let(NewArray(GraphNode));
    $.forArray(validNodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      $.if(Not(In(referencedNodes, nodeId))).then($ => {
        $.pushLast(orphanedNodes, node);
      });
    });
    
    $.return(Struct({
      valid_nodes: validNodes,
      valid_edges: validEdges,
      orphaned_nodes: orphanedNodes,
      dangling_edges: danglingEdges,
      duplicate_nodes: duplicateNodes,
      duplicate_edges: duplicateEdges
    }));
  });