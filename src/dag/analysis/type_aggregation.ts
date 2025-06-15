import { Procedure } from "@elaraai/core";
import {
  Add,
  And,
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
  Struct,
} from "@elaraai/core";

import { ArrayType, DictType, IntegerType, StringType } from "@elaraai/core";

import {
  GraphNode,
  GraphEdge,
  GraphTypeAggregateNode,
  GraphTypeAggregateEdge,
  GraphTypeAggregateResult,
} from "../types";

/**
 * Graph Aggregation by Type - aggregates nodes and transitions by their types
 * 
 * Groups nodes by type and analyzes type-to-type transitions to create an aggregate graph structure.
 * Computes node statistics (count) per type and edge statistics (transition counts, probabilities).
 * 
 * **Example:**
 * ```
 * Input Graph:                    Node Types:               Aggregate Result:
 *     A ──┐                         A: "op1"                Nodes: op1(2), op2(1)
 *         ├──→ B                     B: "op2"                Edges: op1→op1(1, 0.333...)
 *         └──→ C ──→ B               C: "op1"                       op1→op2(2, 0.666...)
 *              D (isolated)          D: "op3" (EXCLUDED)
 * 
 * Individual Nodes    →    Type Groups    →    Aggregate Graph
 *   A(op1) ──┐               op1: A,C            op1 ──┐ 
 *           ├──→ B(op2)       op2: B                   ├──→ op1 (1/3)
 *           └──→ C(op1) ──→ B                          └──→ op2 (2/3)
 *                D(op3) ❌ EXCLUDED (no edges)
 * ```
 * 
 * **IMPORTANT**: Only node types that participate in edges appear in the aggregate graph.
 * Orphaned nodes (not connected to any edges) are excluded from both aggregate_nodes and aggregate_edges.
 * 
 * **Calculations:**
 * - **Node aggregation**: Groups by type, counts instances per type
 * - **Edge aggregation**: For each type→type transition, counts occurrences and calculates probabilities
 * - **Transition probability**: P(A→B) = count(A→B) / total_outgoing_edges_from_type_A
 * 
 * **Detailed Example:**
 * ```
 * From A(op1) → B(op2): op1→op2 transition (count +1)
 * From A(op1) → C(op1): op1→op1 transition (count +1)  
 * From C(op1) → B(op2): op1→op2 transition (count +1)
 * 
 * Result:
 * - op1 has 3 total outgoing edges → P(op1→op1) = 1/3 ≈ 0.333
 *                                  → P(op1→op2) = 2/3 ≈ 0.667
 * ```
 * 
 * **Use Cases:**
 * - Workflow pattern analysis: "What are the common operation type sequences?"
 * - Process optimization: "Which operation types are most frequent?"
 * - State machine analysis: "What's the probability of transitioning between different states?"
 * 
 * **Algorithm:** 
 * 1. Groups nodes by type and counts instances
 * 2. Analyzes edge patterns to compute type-to-type transition frequencies and probabilities
 * 3. **CRITICAL**: Only includes node types that participate in at least one edge (as source OR target)
 * 4. Orphaned node types (no edges) are completely excluded from the aggregate graph
 * 
 * **Complexity:** O(V + E) - Single pass through vertices for grouping and edges for transition analysis
 * 
 * @param nodes Array of graph nodes with id and type
 * @param edges Array of directed edges representing transitions (from → to)
 * @returns Aggregate graph with type-based nodes and transition edges
 */
export const graph_aggregation_by_type = new Procedure("graph_aggregation_by_type")
  .input("nodes", ArrayType(GraphNode))
  .input("edges", ArrayType(GraphEdge))
  .output(GraphTypeAggregateResult)
  .body(($, { nodes, edges }) => {
    // Create map for node type lookup
    const nodeTypeMap = $.let(NewDict(StringType, StringType)); // id -> type
    
    // Process nodes to build type map
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      const nodeType = $.let(GetField(node, "type"));
      
      $.insertOrUpdate(nodeTypeMap, nodeId, nodeType);
    });
    
    // Group nodes by type for counting
    const typeNodeCounts = $.let(NewDict(StringType, IntegerType)); // type -> count
    
    $.forArray(nodes, ($, node) => {
      const nodeType = $.let(GetField(node, "type"));
      
      // Update node count for this type
      const currentCount = $.let(Get(typeNodeCounts, nodeType, Const(0n)));
      $.insertOrUpdate(typeNodeCounts, nodeType, Add(currentCount, Const(1n)));
    });
    
    // Analyze edge transitions by type including edge types
    const typeTransitionCounts = $.let(NewDict(StringType, DictType(StringType, DictType(StringType, IntegerType)))); // from_type -> (edge_type -> (to_type -> count))
    const typeOutgoingCounts = $.let(NewDict(StringType, IntegerType)); // type -> total outgoing edges
    
    $.forArray(edges, ($, edge) => {
      const fromId = $.let(GetField(edge, "from"));
      const toId = $.let(GetField(edge, "to"));
      const edgeType = $.let(GetField(edge, "type"));
      
      // Only process edges where both nodes exist in the node type map
      $.if(And(In(nodeTypeMap, fromId), In(nodeTypeMap, toId))).then($ => {
        // Get types for source and target nodes
        const fromType = $.let(Get(nodeTypeMap, fromId));
        const toType = $.let(Get(nodeTypeMap, toId));
        
        // Update transition count for this type triple (from_type, edge_type, to_type)
        $.if(In(typeTransitionCounts, fromType)).then($ => {
          const edgeTypeMap = $.let(Get(typeTransitionCounts, fromType));
          
          $.if(In(edgeTypeMap, edgeType)).then($ => {
            const transitions = $.let(Get(edgeTypeMap, edgeType));
            const currentCount = $.let(Get(transitions, toType, Const(0n)));
            $.insertOrUpdate(transitions, toType, Add(currentCount, Const(1n)));
          }).else($ => {
            const newTransitions = $.let(NewDict(StringType, IntegerType));
            $.insertOrUpdate(newTransitions, toType, Const(1n));
            $.insertOrUpdate(edgeTypeMap, edgeType, newTransitions);
          });
        }).else($ => {
          const newEdgeTypeMap = $.let(NewDict(StringType, DictType(StringType, IntegerType)));
          const newTransitions = $.let(NewDict(StringType, IntegerType));
          $.insertOrUpdate(newTransitions, toType, Const(1n));
          $.insertOrUpdate(newEdgeTypeMap, edgeType, newTransitions);
          $.insertOrUpdate(typeTransitionCounts, fromType, newEdgeTypeMap);
        });
        
        // Update total outgoing count for source type
        const currentOutgoing = $.let(Get(typeOutgoingCounts, fromType, Const(0n)));
        $.insertOrUpdate(typeOutgoingCounts, fromType, Add(currentOutgoing, Const(1n)));
      });
    });
    
    // Build aggregate edges and collect participating types in one pass
    const aggregateEdges = $.let(NewArray(GraphTypeAggregateEdge));
    const typesInEdges = $.let(NewSet(StringType));
    
    $.forDict(typeTransitionCounts, ($, edgeTypeMap, fromType) => {
      $.insertOrUpdate(typesInEdges, fromType); // Collect fromType
      const totalOutgoing = $.let(Get(typeOutgoingCounts, fromType, Const(0n)));
      
      $.forDict(edgeTypeMap, ($, transitions, edgeType) => {
        $.forDict(transitions, ($, transitionCount, toType) => {
          $.insertOrUpdate(typesInEdges, toType); // Collect toType
          
          const probability = $.let(Const(0.0));
          
          $.if(Greater(totalOutgoing, Const(0n))).then($ => {
            // Convert integers to floats for division
            const transitionFloat = $.let(Multiply(transitionCount, Const(1.0)));
            const totalFloat = $.let(Multiply(totalOutgoing, Const(1.0)));
            $.assign(probability, Divide(transitionFloat, totalFloat));
          });
          
          $.pushLast(aggregateEdges, Struct({
            from_type: fromType,
            to_type: toType,
            edge_type: edgeType,
            transition_count: transitionCount,
            transition_probability: probability
          }));
        });
      });
    });
    
    // Build aggregate nodes only for types that participate in edges
    const aggregateNodes = $.let(NewArray(GraphTypeAggregateNode));
    
    $.forSet(typesInEdges, ($, nodeType) => {
      const nodeCount = $.let(Get(typeNodeCounts, nodeType, Const(0n)));
      $.pushLast(aggregateNodes, Struct({
        type: nodeType,
        node_count: nodeCount
      }));
    });
    
    // Return aggregate result
    $.return(Struct({
      aggregate_nodes: aggregateNodes,
      aggregate_edges: aggregateEdges
    }));
  });