import { Procedure } from "@elaraai/core";
import {
  Add,
  Const,
  Divide,
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
  Struct,
  Subtract,
} from "@elaraai/core";

import { ArrayType, FloatType, IntegerType, StringType, StructType } from "@elaraai/core";

import { Max } from "@elaraai/core";
import { graph_build_adjacency_lists } from "./shared_utils";
import { graph_ancestor_descendant } from "./graph_traversal";

import {
  GraphNode,
  GraphEdge,
  GraphFlowNode,
  GraphFlowEdge,
  GraphActiveEdge,
  GraphFlowConservationResult,
  GraphReachabilityResult,
} from "./types";

/**
 * Flow conservation analysis - verify conservation of flow through network
 * 
 * Analyzes whether flow is conserved at each node in a flow network. For each node,
 * checks if: initial_value + total_inflow = total_outflow + total_losses
 * 
 * Flows are calculated considering transmission losses on edges. An edge with 
 * weight W and loss_percentage L results in:
 * - actual_flow = W * (1 - L/100) arriving at destination
 * - loss = W * (L/100) lost during transmission
 * 
 * **Example - Balanced Flow:**
 * ```
 * Input Network:              Flow Analysis:
 *     A(8.0) ──60──→ B(0.0)    A→B: 60*0.9 = 54 arrives, 6 lost
 *       ↑       10% loss       B→A: 54*1.0 = 54 returns
 *       └────54←──────┘        A: 8+54 = 100-8 ✓ (conservation: input = output)
 * 
 * Result: {is_conserved: true, violations: []}
 * ```
 * 
 * **Use Cases:**
 * - Network flow validation: "Is mass/energy conserved at each node?"
 * - Pipeline analysis: "Are there flow imbalances indicating leaks or accumulation?"
 * - Resource allocation: "Does the flow distribution respect conservation laws?"
 * 
 * **Algorithm:** For each node, computes total inflow (considering losses) and total outflow,
 * then checks conservation equation: node_value + inflow = outflow + losses.
 * 
 * @param nodes Array of flow nodes with value (initial amount) and capacity properties
 * @param edges Array of flow edges with weight (flow amount) and loss_percentage properties
 * @returns Conservation result with is_conserved boolean and array of violating node IDs
 */
export const graph_flow_conservation = new Procedure("graph_flow_conservation")
  .input("nodes", ArrayType(GraphFlowNode))
  .input("edges", ArrayType(GraphFlowEdge))
  .output(GraphFlowConservationResult)
  .body(($, { nodes, edges }) => {
    // Build flow maps
    const nodeCapacities = $.let(NewDict(StringType, FloatType));
    const nodeValues = $.let(NewDict(StringType, FloatType));
    
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      const capacity = $.let(GetField(node, "capacity"));
      const value = $.let(GetField(node, "value"));
      
      $.insertOrUpdate(nodeCapacities, nodeId, capacity);
      $.insertOrUpdate(nodeValues, nodeId, value);
    });
    
    // Build flow adjacency lists
    const outflows = $.let(NewDict(StringType, ArrayType(StructType({
      to: StringType,
      flow: FloatType,
      loss: FloatType
    }))));
    const inflows = $.let(NewDict(StringType, ArrayType(StructType({
      from: StringType,
      flow: FloatType,
      loss: FloatType
    }))));
    
    $.forArray(edges, ($, edge) => {
      const fromId = $.let(GetField(edge, "from"));
      const toId = $.let(GetField(edge, "to"));
      const weight = $.let(GetField(edge, "weight"));
      const lossPercentage = $.let(GetField(edge, "loss_percentage"));
      
      const actualFlow = $.let(Multiply(weight, Subtract(Const(1.0), Divide(lossPercentage, Const(100.0)))));
      const lossAmount = $.let(Multiply(weight, Divide(lossPercentage, Const(100.0))));
      
      // Add to outflows
      $.if(In(outflows, fromId)).then($ => {
        const flows = $.let(Get(outflows, fromId));
        $.pushLast(flows, Struct({
          to: toId,
          flow: actualFlow,
          loss: lossAmount
        }));
      }).else($ => {
        $.insert(outflows, fromId, NewArray(StructType({
          to: StringType,
          flow: FloatType,
          loss: FloatType
        }), [Struct({
          to: toId,
          flow: actualFlow,
          loss: lossAmount
        })]));
      });
      
      // Add to inflows
      $.if(In(inflows, toId)).then($ => {
        const flows = $.let(Get(inflows, toId));
        $.pushLast(flows, Struct({
          from: fromId,
          flow: actualFlow,
          loss: lossAmount
        }));
      }).else($ => {
        $.insert(inflows, toId, NewArray(StructType({
          from: StringType,
          flow: FloatType,
          loss: FloatType
        }), [Struct({
          from: fromId,
          flow: actualFlow,
          loss: lossAmount
        })]));
      });
    });
    
    // Check conservation for each node
    const violations = $.let(NewArray(StringType));
    const isConserved = $.let(Const(true));
    const tolerance = $.let(Const(0.001)); // Small tolerance for floating point comparison
    
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      const nodeValue = $.let(Get(nodeValues, nodeId));
      
      // Calculate total inflow
      const totalInflow = $.let(Const(0.0));
      $.if(In(inflows, nodeId)).then($ => {
        const inflowList = $.let(Get(inflows, nodeId));
        $.forArray(inflowList, ($, inflow) => {
          const flow = $.let(GetField(inflow, "flow"));
          $.assign(totalInflow, Add(totalInflow, flow));
        });
      });
      
      // Calculate total outflow
      const totalOutflow = $.let(Const(0.0));
      $.if(In(outflows, nodeId)).then($ => {
        const outflowList = $.let(Get(outflows, nodeId));
        $.forArray(outflowList, ($, outflow) => {
          const flow = $.let(GetField(outflow, "flow"));
          $.assign(totalOutflow, Add(totalOutflow, flow));
        });
      });
      
      // Calculate total loss from this node
      const totalLoss = $.let(Const(0.0));
      $.if(In(outflows, nodeId)).then($ => {
        const outflowList = $.let(Get(outflows, nodeId));
        $.forArray(outflowList, ($, outflow) => {
          const loss = $.let(GetField(outflow, "loss"));
          $.assign(totalLoss, Add(totalLoss, loss));
        });
      });
      
      // Conservation equation: nodeValue + totalInflow = totalOutflow + totalLoss
      const input = $.let(Add(nodeValue, totalInflow));
      const output = $.let(Add(totalOutflow, totalLoss));
      const difference = $.let(Subtract(input, output));
      const absDifference = $.let(Max(difference, Multiply(difference, Const(-1.0))));
      
      $.if(Greater(absDifference, tolerance)).then($ => {
        $.assign(isConserved, Const(false));
        $.pushLast(violations, nodeId);
      });
    });
    
    $.return(Struct({
      is_conserved: isConserved,
      violations: violations
    }));
  });

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
      $.pushLast(undirectedEdges, Struct({
        from: toId,
        to: fromId
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
        // Start new component
        const componentId = $.let(Const("comp_"));
        // Simple component ID generation
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