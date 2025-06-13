import { Procedure } from "@elaraai/core";
import {
  GetField,
  NewArray,
  Struct,
} from "@elaraai/core";

import { ArrayType, StringType, StructType } from "@elaraai/core";

import { graph_build_adjacency_lists } from "../shared_utils";
import { graph_ancestor_descendant } from "../graph_traversal";

import {
  GraphNode,
  GraphEdge,
  GraphActiveEdge,
  GraphReachabilityResult,
} from "../types";

/**
 * Dynamic reachability analysis with active/inactive edges
 * 
 * Analyzes graph reachability considering only active edges. For each node, computes:
 * - ancestors: all nodes that can reach this node via active edges (transitive closure)
 * - descendants: all nodes this node can reach via active edges (transitive closure)
 * 
 * The algorithm filters edges by their active status, then uses the existing `graph_ancestor_descendant`
 * procedure to compute reachability relationships. Inactive edges are completely ignored.
 * 
 * **Example:**
 * ```
 * Input Graph:           Active Edges Only:         Result:
 *     A ──→ B (active)       A ──→ B               A: ancestors=[], descendants=[B,C]
 *     A ──→ C (inactive)      B ──→ C               B: ancestors=[A], descendants=[C]
 *     B ──→ C (active)                             C: ancestors=[B,A], descendants=[]
 * ```
 * 
 * **Use Cases:**
 * - Network topology analysis: "Which nodes are reachable when certain links are down?"
 * - Conditional dependencies: "What's accessible given current system state?"
 * - Dynamic flow analysis: "How does enabling/disabling edges affect reachability?"
 * 
 * **Algorithm:** Filters active edges, delegates to `graph_ancestor_descendant` for reachability computation.
 * 
 * @param nodes Array of graph nodes  
 * @param edges Array of edges with active/inactive flags
 * @returns ancestor_map and descendant_map showing reachability relationships via active edges only
 */
export const graph_dynamic_reachability = new Procedure("graph_dynamic_reachability")
  .input("nodes", ArrayType(GraphNode))
  .input("edges", ArrayType(GraphActiveEdge))
  .output(GraphReachabilityResult)
  .import(graph_build_adjacency_lists)
  .import(graph_ancestor_descendant)
  .body(($, { nodes, edges }, procs) => {
    // Filter active edges and build adjacency lists using shared utility
    const activeEdges = $.let(NewArray(GraphEdge));
    
    $.forArray(edges, ($, edge) => {
      const isActive = $.let(GetField(edge, "active"));
      $.if(isActive).then($ => {
        $.pushLast(activeEdges, Struct({
          from: GetField(edge, "from"),
          to: GetField(edge, "to")
        }));
      });
    });
    
    
    // Use existing ancestor_descendant procedure for active edges
    const activeGraphNodes = $.let(NewArray(GraphNode));
    $.forArray(nodes, ($, node) => {
      $.pushLast(activeGraphNodes, node);
    });
    
    const ancestorDescendantResult = $.let(procs.graph_ancestor_descendant(Struct({
      nodes: activeGraphNodes,
      edges: activeEdges
    })));
    
    // Transform result to match expected output format
    const ancestorMap = $.let(NewArray(StructType({
      node: StringType,
      ancestors: ArrayType(StringType)
    })));
    const descendantMap = $.let(NewArray(StructType({
      node: StringType,
      descendants: ArrayType(StringType)
    })));
    
    $.forArray(ancestorDescendantResult, ($, ancestorNode) => {
      const nodeId = $.let(GetField(ancestorNode, "id"));
      const ancestors = $.let(GetField(ancestorNode, "ancestors"));
      const descendants = $.let(GetField(ancestorNode, "descendants"));
      
      $.pushLast(ancestorMap, Struct({
        node: nodeId,
        ancestors: ancestors
      }));
      
      $.pushLast(descendantMap, Struct({
        node: nodeId,
        descendants: descendants
      }));
    });
    
    $.return(Struct({
      ancestor_map: ancestorMap,
      descendant_map: descendantMap
    }));
  });