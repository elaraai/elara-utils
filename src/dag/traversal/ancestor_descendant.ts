import { Procedure } from "@elaraai/core";
import {
  Const,
  Get,
  GetField,
  Greater,
  In,
  NewArray,
  NewSet,
  Not,
  Size,
  Struct,
  Subtract,
  ToArray,
} from "@elaraai/core";

import { ArrayType, StringType } from "@elaraai/core";

import { graph_build_adjacency_lists } from "../core/adjacency_lists";
import { GraphNode, GraphEdge, GraphAncestorNode } from "../types";

/**
 * Ancestor/Descendant enumeration - identifies all ancestors, descendants, and reachable nodes for each node
 * 
 * For each node, computes three important sets: ancestors (nodes that can reach this node), 
 * descendants (nodes this node can reach), and all reachable nodes (union of ancestors and descendants).
 * Essential for dependency analysis and impact assessment.
 * 
 * **Example:**
 * ```
 * Input Graph:           Analysis Results:
 *     A ──┐               A: ancestors=[], descendants=[B,C,D], reachable=[B,C,D]
 *         ├──→ B ──→ D     B: ancestors=[A], descendants=[D], reachable=[A,D]
 *         └──→ C           C: ancestors=[A], descendants=[], reachable=[A]
 *                         D: ancestors=[A,B], descendants=[], reachable=[A,B]
 * ```
 * 
 * **Complex Example:**
 * ```
 * Input Graph:           Analysis Results:
 *     A ──→ B ──→ D       A: ancestors=[], descendants=[B,C,D,E], reachable=[B,C,D,E]
 *     └──→ C ──→ E        B: ancestors=[A], descendants=[D], reachable=[A,D]
 *                         C: ancestors=[A], descendants=[E], reachable=[A,E]
 *                         D: ancestors=[A,B], descendants=[], reachable=[A,B]
 *                         E: ancestors=[A,C], descendants=[], reachable=[A,C]
 * ```
 * 
 * **Use Cases:**
 * - Impact analysis: "If this component changes, what else is affected?"
 * - Dependency tracking: "What does this task depend on transitively?"
 * - Access control: "Which users can influence this resource through the permission graph?"
 * 
 * **Algorithm:** Uses DFS traversal in both forward and reverse directions to compute 
 * transitive closure of relationships. Efficiently handles complex dependency networks.
 * 
 * **Complexity:** O(V * (V + E)) where V is the number of vertices and E is the number of edges.
 * For each vertex, performs a DFS traversal of the entire graph in both directions.
 * 
 * @param nodes Array of graph nodes to analyze
 * @param edges Array of directed edges representing dependencies (from → to)
 * @returns Array of ancestor nodes with id, ancestors array, descendants array, and reachable_nodes array
 */
export const graph_ancestor_descendant = new Procedure("graph_ancestor_descendant")
  .input("nodes", ArrayType(GraphNode))
  .input("edges", ArrayType(GraphEdge))
  .output(ArrayType(GraphAncestorNode))
  .import(graph_build_adjacency_lists)
  .body(($, { nodes, edges }, procs) => {
    // Build adjacency lists using shared utility
    const adjacencyData = $.let(procs.graph_build_adjacency_lists(Struct({ edges })));
    const adjacencyList = $.let(GetField(adjacencyData, "adjacency_list"));
    const reverseAdjacencyList = $.let(GetField(adjacencyData, "reverse_adjacency_list"));
    
    const result = $.let(NewArray(GraphAncestorNode));
    
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      
      // Find all ancestors (DFS on reverse graph)
      const ancestors = $.let(NewArray(StringType));
      const visitedAncestors = $.let(NewSet(StringType));
      const ancestorStack = $.let(ToArray(Get(reverseAdjacencyList, nodeId, NewArray(StringType))));
      
      $.while(Greater(Size(ancestorStack), Const(0n)), $ => {
        const current = $.let(Get(ancestorStack, Subtract(Size(ancestorStack), Const(1n))));
        $.deleteLast(ancestorStack);
        
        $.if(Not(In(visitedAncestors, current))).then($ => {
          $.insert(visitedAncestors, current);
          $.pushLast(ancestors, current);
          
          // Add parents of current
          const parents = $.let(ToArray(Get(reverseAdjacencyList, current, NewArray(StringType))));
          $.forArray(parents, ($, parent) => {
            $.if(Not(In(visitedAncestors, parent))).then($ => {
              $.pushLast(ancestorStack, parent);
            });
          });
        });
      });
      
      // Find all descendants (DFS on forward graph)
      const descendants = $.let(NewArray(StringType));
      const visitedDescendants = $.let(NewSet(StringType));
      const descendantStack = $.let(ToArray(Get(adjacencyList, nodeId, NewArray(StringType))));
      
      $.while(Greater(Size(descendantStack), Const(0n)), $ => {
        const current = $.let(Get(descendantStack, Subtract(Size(descendantStack), Const(1n))));
        $.deleteLast(descendantStack);
        
        $.if(Not(In(visitedDescendants, current))).then($ => {
          $.insert(visitedDescendants, current);
          $.pushLast(descendants, current);
          
          // Add children of current
          const children = $.let(ToArray(Get(adjacencyList, current, NewArray(StringType))));
          $.forArray(children, ($, child) => {
            $.if(Not(In(visitedDescendants, child))).then($ => {
              $.pushLast(descendantStack, child);
            });
          });
        });
      });
      
      // Reachable nodes = ancestors + descendants
      const reachableNodes = $.let(NewArray(StringType));
      $.forArray(ancestors, ($, ancestor) => {
        $.pushLast(reachableNodes, ancestor);
      });
      $.forArray(descendants, ($, descendant) => {
        $.pushLast(reachableNodes, descendant);
      });
      
      $.pushLast(result, Struct({
        id: nodeId,
        ancestors: ancestors,
        descendants: descendants,
        reachable_nodes: reachableNodes
      }));
    });
    
    $.return(result);
  });