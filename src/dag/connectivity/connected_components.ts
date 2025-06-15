import { Procedure } from "@elaraai/core";
import {
  Add,
  Const,
  Get,
  GetField,
  Greater,
  In,
  NewArray,
  NewSet,
  Not,
  Size,
  StringJoin,
  Struct,
  Subtract,
} from "@elaraai/core";

import { ArrayType, IntegerType, StringType, StructType } from "@elaraai/core";

import { graph_build_adjacency_lists } from "../core/adjacency_lists";

import {
  GraphNode,
  GraphEdge,
} from "../types";

/**
 * Connected components analysis - find disconnected subgraphs
 * 
 * Identifies connected components in an undirected graph representation.
 * Treats all directed edges as bidirectional and finds groups of nodes that are
 * reachable from each other via any path (ignoring edge direction).
 * 
 * **Example:**
 * ```
 * Input Graph:           Connected Components:
 *     A ──→ B             Component 1: [A, B]
 *     C ──→ D             Component 2: [C, D]
 *     E (isolated)        Component 3: [E]
 * 
 * Result:
 * - component_assignments: [{node_id: "A", component_id: "comp_"}, ...]
 * - component_info: [{component_id: "comp_", size: 2, nodes: ["A", "B"]}, ...]
 * ```
 * 
 * **Use Cases:**
 * - Network analysis: "Which nodes can communicate with each other?"
 * - Cluster detection: "What are the isolated groups in this system?"
 * - Graph partitioning: "How many disconnected subgraphs exist?"
 * 
 * **Algorithm:** Converts directed edges to undirected by adding reverse edges,
 * then uses DFS to identify connected components. Each component gets a unique ID.
 * 
 * **Complexity:** O(V + E) where V is the number of vertices and E is the number of edges.
 * 
 * @param nodes Array of graph nodes
 * @param edges Array of directed edges (treated as undirected for connectivity analysis)
 * @returns component assignments and component information with sizes and node lists
 */
export const graph_connected_components = new Procedure("graph_connected_components")
  .input("nodes", ArrayType(GraphNode))
  .input("edges", ArrayType(GraphEdge))
  .output(StructType({
    component_assignments: ArrayType(StructType({
      node_id: StringType,
      component_id: StringType
    })),
    component_info: ArrayType(StructType({
      component_id: StringType,
      size: IntegerType,
      nodes: ArrayType(StringType)
    }))
  }))
  .import(graph_build_adjacency_lists)
  .body(($, { nodes, edges }, procs) => {
    // Build undirected adjacency list by adding reverse edges
    const undirectedEdges = $.let(NewArray(GraphEdge));
    
    $.forArray(edges, ($, edge) => {
      const fromId = $.let(GetField(edge, "from"));
      const toId = $.let(GetField(edge, "to"));
      
      // Add forward edge
      $.pushLast(undirectedEdges, edge);
      
      // Add reverse edge to make undirected
      const edgeType = $.let(GetField(edge, "type"));
      $.pushLast(undirectedEdges, Struct({
        from: toId,
        to: fromId,
        type: edgeType
      }));
    });
    
    const adjacencyData = $.let(procs.graph_build_adjacency_lists(Struct({ edges: undirectedEdges })));
    const adjacencyList = $.let(GetField(adjacencyData, "adjacency_list"));
    
    // Find connected components using DFS
    const visited = $.let(NewSet(StringType));
    const componentAssignments = $.let(NewArray(StructType({
      node_id: StringType,
      component_id: StringType
    })));
    const componentInfo = $.let(NewArray(StructType({
      component_id: StringType,
      size: IntegerType,
      nodes: ArrayType(StringType)
    })));
    const componentCounter = $.let(Const(0n));
    
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      
      $.if(Not(In(visited, nodeId))).then($ => {
        // Start new component with unique ID
        const componentId = $.let(StringJoin`comp_${componentCounter}`);
        // Generate unique component ID based on counter
        const componentNodes = $.let(NewArray(StringType));
        const stack = $.let(NewArray(StringType, [nodeId]));
        
        $.while(Greater(Size(stack), Const(0n)), $ => {
          const current = $.let(Get(stack, Subtract(Size(stack), Const(1n))));
          $.deleteLast(stack);
          
          $.if(Not(In(visited, current))).then($ => {
            $.insert(visited, current);
            $.pushLast(componentNodes, current);
            
            $.pushLast(componentAssignments, Struct({
              node_id: current,
              component_id: componentId
            }));
            
            // Add neighbors to stack
            $.if(In(adjacencyList, current)).then($ => {
              const neighbors = $.let(Get(adjacencyList, current));
              $.forArray(neighbors, ($, neighbor) => {
                $.if(Not(In(visited, neighbor))).then($ => {
                  $.pushLast(stack, neighbor);
                });
              });
            });
          });
        });
        
        $.pushLast(componentInfo, Struct({
          component_id: componentId,
          size: Size(componentNodes),
          nodes: componentNodes
        }));
        
        $.assign(componentCounter, Add(componentCounter, Const(1n)));
      });
    });
    
    $.return(Struct({
      component_assignments: componentAssignments,
      component_info: componentInfo
    }));
  });