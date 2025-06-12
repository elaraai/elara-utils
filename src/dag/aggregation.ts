import { Procedure } from "@elaraai/core";
import {
  Add,
  Const,
  Divide,
  Equal,
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

import { ArrayType, DictType, FloatType, IntegerType, StringType } from "@elaraai/core";

import { graph_build_adjacency_lists } from "./shared_utils";
import {
  GraphEdge,
  GraphNode,
  GraphValueNode,
  GraphGroupValueNode,
  GraphAggregationNode,
  GraphGroupAggregationNode,
  GraphWeightedAggregationNode,
  GraphTypeAggregateNode,
  GraphTypeAggregateEdge,
  GraphTypeAggregateResult,
} from "./types";
/**
 * Bottom-up aggregation - aggregates node values from leaf nodes upward through dependency tree
 * 
 * For each node, calculates the total value of itself plus all its descendants (nodes that depend on it).
 * This is useful for project planning where you want to know the total resource impact of starting a particular task,
 * including all the work that flows from it.
 * 
 * **Example:**
 * ```
 * Input Graph:           Node Values:          Result:
 *     A ──┐                A: 10                A: 18 (10+5+3)
 *         ├──→ B            B: 5                 B: 5 (just B)  
 *         └──→ C            C: 3                 C: 3 (just C)
 * ```
 * 
 * **Multi-level Example:**
 * ```
 * Input Graph:                 Values:          Result:
 *     A ──┐                      A: 1           A: 15 (1+2+3+4+5)
 *         ├──→ B ──→ D            B: 2           B: 6 (2+4)
 *         └──→ C ──→ E            C: 3           C: 8 (3+5)
 *                                D: 4           D: 4, E: 5
 *                                E: 5
 * ```
 * 
 * **Use Cases:**
 * - Project impact analysis: "If I start task A, what's the total resource commitment?"
 * - Resource planning: "What's the total value/cost for this work stream?"
 * - Critical path analysis: "Which starting tasks have the biggest downstream impact?"
 * 
 * **Algorithm:** Uses DFS traversal to visit all descendants and sum their values.
 * Handles cycles, disconnected components, and complex dependency structures.
 * 
 * @param nodes Array of value nodes with id and numeric value
 * @param edges Array of directed edges representing dependencies (from → to)
 * @returns Array of aggregation results with total value and contributing nodes for each input node
 */
export const graph_bottom_up_aggregation = new Procedure("graph_bottom_up_aggregation")
  .input("nodes", ArrayType(GraphValueNode))
  .input("edges", ArrayType(GraphEdge))
  .output(ArrayType(GraphAggregationNode))
  .import(graph_build_adjacency_lists)
  .body(($, { nodes, edges }, procs) => {
    // Build adjacency lists using shared utility
    const adjacencyData = $.let(procs.graph_build_adjacency_lists(Struct({ edges })));
    const adjacencyList = $.let(GetField(adjacencyData, "adjacency_list"));
    const reverseAdjacencyList = $.let(GetField(adjacencyData, "reverse_adjacency_list"));
    
    // Create node value map
    const nodeValues = $.let(NewDict(StringType, FloatType));
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      const value = $.let(GetField(node, "value"));
      $.insertOrUpdate(nodeValues, nodeId, value);
    });
    
    // Find leaf nodes (no children)
    const leafNodes = $.let(NewArray(StringType));
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      $.if(Not(In(adjacencyList, nodeId))).then($ => {
        $.pushLast(leafNodes, nodeId);
      });
    });
    
    // Process nodes bottom-up using topological sort
    const processed = $.let(NewSet(StringType));
    const queue = $.let(NewArray(StringType));
    const aggregatedValues = $.let(NewDict(StringType, FloatType));
    const contributingNodes = $.let(NewDict(StringType, ArrayType(StringType)));
    
    // Initialize leaf nodes
    $.forArray(leafNodes, ($, leafId) => {
      $.pushLast(queue, leafId);
      const leafValue = $.let(Get(nodeValues, leafId));
      $.insertOrUpdate(aggregatedValues, leafId, leafValue);
      $.insertOrUpdate(contributingNodes, leafId, NewArray(StringType, [leafId]));
    });
    
    $.while(Greater(Size(queue), Const(0n)), $ => {
      const currentNode = $.let(Get(queue, Const(0n)));
      $.deleteFirst(queue);
      $.insert(processed, currentNode);
      
      // Check if all children are processed, if so add parents to queue
      $.if(In(reverseAdjacencyList, currentNode)).then($ => {
        const parents = $.let(Get(reverseAdjacencyList, currentNode));
        $.forArray(parents, ($, parent) => {
          // Check if all children of parent are processed
          const allChildrenProcessed = $.let(Const(true));
          $.if(In(adjacencyList, parent)).then($ => {
            const children = $.let(Get(adjacencyList, parent));
            $.forArray(children, ($, child) => {
              $.if(Not(In(processed, child))).then($ => {
                $.assign(allChildrenProcessed, Const(false));
              });
            });
          });
          
          $.if(allChildrenProcessed).then($ => {
            const isParentInQueue = $.let(Const(false));
            $.forArray(queue, ($, queueNode) => {
              $.if(Equal(queueNode, parent)).then($ => {
                $.assign(isParentInQueue, Const(true));
              });
            });
            
            $.if(Not(isParentInQueue)).then($ => {
              $.if(Not(In(processed, parent))).then($ => {
                // Aggregate values from children
                const parentValue = $.let(Get(nodeValues, parent));
                const totalValue = $.let(parentValue);
                const allContributors = $.let(NewArray(StringType, [parent]));
                
                $.if(In(adjacencyList, parent)).then($ => {
                  const children = $.let(Get(adjacencyList, parent));
                  $.forArray(children, ($, child) => {
                    const childAggValue = $.let(Get(aggregatedValues, child));
                    $.assign(totalValue, Add(totalValue, childAggValue));
                    
                    // Add child's contributors
                    const childContributors = $.let(Get(contributingNodes, child));
                    $.forArray(childContributors, ($, contributor) => {
                      $.pushLast(allContributors, contributor);
                    });
                  });
                });
                
                $.insertOrUpdate(aggregatedValues, parent, totalValue);
                $.insertOrUpdate(contributingNodes, parent, allContributors);
                $.pushLast(queue, parent);
              });
            });
          });
        });
      });
    });
    
    // Build result
    const result = $.let(NewArray(GraphAggregationNode));
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      const aggValue = $.let(Get(aggregatedValues, nodeId));
      const contributors = $.let(Get(contributingNodes, nodeId));
      
      $.pushLast(result, Struct({
        id: nodeId,
        aggregated_value: aggValue,
        contributing_nodes: contributors
      }));
    });
    
    $.return(result);
  });

/**
 * Top-down aggregation - distributes values from parent nodes downward through dependency tree
 * 
 * For each node, calculates its own value plus a distributed portion of all its ancestors' values.
 * Parent values are distributed equally among all direct children. This is useful for resource 
 * allocation where parent resources need to be shared among dependent tasks.
 * 
 * **Example:**
 * ```
 * Input Graph:           Node Values:          Result:
 *     A ──┐                A: 10                A: 10.0 (just A - root)
 *         ├──→ B            B: 2                 B: 7.0 (2 + 10/2)  
 *         └──→ C            C: 3                 C: 8.0 (3 + 10/2)
 * ```
 * A's value (10) is split equally between B and C (5 each), then added to their own values.
 * 
 * **Multi-level Example:**
 * ```
 * Input Graph:                 Values:          Result:
 *     A ──┐                      A: 12          A: 12.0 (just A - root)
 *         ├──→ B ──→ D            B: 2           B: 8.0 (2 + 12/2)
 *         └──→ C                  C: 3           C: 9.0 (3 + 12/2)
 *                                D: 1           D: 9.0 (1 + all of B's 8.0)
 * ```
 * A distributes 6 to each child (B, C). D gets all of B's accumulated value.
 * 
 * **Use Cases:**
 * - Resource allocation: "How should parent resources be distributed to dependent tasks?"
 * - Budget distribution: "What's the total allocated budget for each task including inheritance?"
 * - Cost sharing: "How do shared costs flow down through organizational hierarchies?"
 * 
 * **Algorithm:** Distributes parent values equally among direct children, then accumulates down the tree.
 * Each node gets its own value plus distributed values from all ancestors.
 * 
 * @param nodes Array of value nodes with id and numeric value
 * @param edges Array of directed edges representing dependencies (from → to)
 * @returns Array of aggregation results with total distributed value and contributing nodes for each input node
 */
export const graph_top_down_aggregation = new Procedure("graph_top_down_aggregation")
  .input("nodes", ArrayType(GraphValueNode))
  .input("edges", ArrayType(GraphEdge))
  .output(ArrayType(GraphAggregationNode))
  .import(graph_build_adjacency_lists)
  .body(($, { nodes, edges }, procs) => {
    // Build adjacency lists using shared utility
    const adjacencyData = $.let(procs.graph_build_adjacency_lists(Struct({ edges })));
    const adjacencyList = $.let(GetField(adjacencyData, "adjacency_list"));
    const reverseAdjacencyList = $.let(GetField(adjacencyData, "reverse_adjacency_list"));
    
    // Create node value map
    const nodeValues = $.let(NewDict(StringType, FloatType));
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      const value = $.let(GetField(node, "value"));
      $.insertOrUpdate(nodeValues, nodeId, value);
    });
    
    // Find root nodes (no parents)
    const rootNodes = $.let(NewArray(StringType));
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      $.if(Not(In(reverseAdjacencyList, nodeId))).then($ => {
        $.pushLast(rootNodes, nodeId);
      });
    });
    
    // Process nodes top-down using BFS
    const processed = $.let(NewSet(StringType));
    const queue = $.let(NewArray(StringType));
    const distributedValues = $.let(NewDict(StringType, FloatType));
    const contributingNodes = $.let(NewDict(StringType, ArrayType(StringType)));
    
    // Initialize root nodes
    $.forArray(rootNodes, ($, rootId) => {
      $.pushLast(queue, rootId);
      const rootValue = $.let(Get(nodeValues, rootId));
      $.insertOrUpdate(distributedValues, rootId, rootValue);
      $.insertOrUpdate(contributingNodes, rootId, NewArray(StringType, [rootId]));
    });
    
    $.while(Greater(Size(queue), Const(0n)), $ => {
      const currentNode = $.let(Get(queue, Const(0n)));
      $.deleteFirst(queue);
      $.insert(processed, currentNode);
      
      // Distribute value to children
      $.if(In(adjacencyList, currentNode)).then($ => {
        const children = $.let(Get(adjacencyList, currentNode));
        const childrenCount = $.let(Size(children));
        const currentDistributedValue = $.let(Get(distributedValues, currentNode));
        const currentContributors = $.let(Get(contributingNodes, currentNode));
        
        $.if(Greater(childrenCount, Const(0n))).then($ => {
          const valuePerChild = $.let(Divide(currentDistributedValue, childrenCount));
          
          $.forArray(children, ($, child) => {
            const childOwnValue = $.let(Get(nodeValues, child));
            const childTotalValue = $.let(Add(childOwnValue, valuePerChild));
            
            // Combine contributors
            const childContributors = $.let(NewArray(StringType, [child]));
            $.forArray(currentContributors, ($, contributor) => {
              $.pushLast(childContributors, contributor);
            });
            
            $.insertOrUpdate(distributedValues, child, childTotalValue);
            $.insertOrUpdate(contributingNodes, child, childContributors);
            
            $.if(Not(In(processed, child))).then($ => {
              $.pushLast(queue, child);
            });
          });
        });
      });
    });
    
    // Build result
    const result = $.let(NewArray(GraphAggregationNode));
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      const distValue = $.let(Get(distributedValues, nodeId, Const(0.0)));
      const contributors = $.let(Get(contributingNodes, nodeId, NewArray(StringType)));
      
      $.pushLast(result, Struct({
        id: nodeId,
        aggregated_value: distValue,
        contributing_nodes: contributors
      }));
    });
    
    $.return(result);
  });

/**
 * Weighted aggregation - aggregates values using node weights from leaf nodes upward through dependency tree
 * 
 * For each node, calculates weighted sum, weighted average, and total weight of itself plus all its descendants.
 * Uses node weights to compute weighted statistics across the dependency tree. Handles null weights by defaulting to 1.0.
 * 
 * **Example:**
 * ```
 * Input Graph:           Values & Weights:           Result:
 *     A ──┐                A: 10 (w=2)               A: weighted_sum=49, weighted_avg=8.166666666666666, total_weight=6
 *         ├──→ B            B: 5 (w=1)                B: weighted_sum=5, weighted_avg=5.0, total_weight=1  
 *         └──→ C            C: 8 (w=3)                C: weighted_sum=24, weighted_avg=8.0, total_weight=3
 * ```
 * A aggregates: (10×2) + (5×1) + (8×3) = 20+5+24 = 49, average = 49÷6 = 8.166666666666666
 * 
 * **Calculations:**
 * - **weighted_sum**: Sum of (value × weight) for node and all descendants
 * - **weighted_average**: weighted_sum ÷ total_weight  
 * - **total_weight**: Sum of all weights in the subtree
 * 
 * **Use Cases:**
 * - Resource-weighted project analysis: "What's the quality-weighted impact of this work stream?"
 * - Priority-based aggregation: "How do high-priority tasks affect total project metrics?"
 * - Confidence-weighted calculations: "What's the reliability-adjusted estimate for this feature?"
 * 
 * **Algorithm:** Uses DFS traversal to visit all descendants and compute weighted statistics.
 * Null weights are treated as 1.0 for consistent calculation.
 * 
 * @param nodes Array of value nodes with id, numeric value, and optional weight (null defaults to 1.0)
 * @param edges Array of directed edges representing dependencies (from → to)
 * @returns Array of weighted aggregation results with weighted_sum, weighted_average, and total_weight for each input node
 */
export const graph_weighted_aggregation = new Procedure("graph_weighted_aggregation")
  .input("nodes", ArrayType(GraphValueNode))
  .input("edges", ArrayType(GraphEdge))
  .output(ArrayType(GraphWeightedAggregationNode))
  .import(graph_build_adjacency_lists)
  .body(($, { nodes, edges }, procs) => {
    // Build adjacency lists using shared utility
    const adjacencyData = $.let(procs.graph_build_adjacency_lists(Struct({ edges })));
    const adjacencyList = $.let(GetField(adjacencyData, "adjacency_list"));
    
    // Create node maps
    const nodeValues = $.let(NewDict(StringType, FloatType));
    const nodeWeights = $.let(NewDict(StringType, FloatType));
    
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      const value = $.let(GetField(node, "value"));
      const weight = $.let(GetField(node, "weight"));
      
      $.insertOrUpdate(nodeValues, nodeId, value);
      
      $.ifNull(weight).then($ => {
        $.insertOrUpdate(nodeWeights, nodeId, Const(1.0)); // Default weight
      }).else(($, nonNullWeight) => {
        $.insertOrUpdate(nodeWeights, nodeId, nonNullWeight);
      });
    });
    
    // Calculate weighted aggregations for each node
    const result = $.let(NewArray(GraphWeightedAggregationNode));
    
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      
      // Find all descendants using DFS
      const descendants = $.let(NewArray(StringType));
      const visited = $.let(NewSet(StringType));
      const stack = $.let(Get(adjacencyList, nodeId, NewArray(StringType)));
      
      $.while(Greater(Size(stack), Const(0n)), $ => {
        const current = $.let(Get(stack, Subtract(Size(stack), Const(1n))));
        $.deleteLast(stack);
        
        $.if(Not(In(visited, current))).then($ => {
          $.insert(visited, current);
          $.pushLast(descendants, current);
          
          // Add children of current
          const children = $.let(Get(adjacencyList, current, NewArray(StringType)));
          $.forArray(children, ($, child) => {
            $.if(Not(In(visited, child))).then($ => {
              $.pushLast(stack, child);
            });
          });
        });
      });
      
      // Calculate weighted sum and average including this node
      const weightedSum = $.let(Const(0.0));
      const totalWeight = $.let(Const(0.0));
      const nodeValue = $.let(Get(nodeValues, nodeId));
      const nodeWeight = $.let(Get(nodeWeights, nodeId));
      
      // Include current node
      $.assign(weightedSum, Add(weightedSum, Multiply(nodeValue, nodeWeight)));
      $.assign(totalWeight, Add(totalWeight, nodeWeight));
      
      // Include descendants
      $.forArray(descendants, ($, descendantId) => {
        const descValue = $.let(Get(nodeValues, descendantId));
        const descWeight = $.let(Get(nodeWeights, descendantId));
        $.assign(weightedSum, Add(weightedSum, Multiply(descValue, descWeight)));
        $.assign(totalWeight, Add(totalWeight, descWeight));
      });
      
      const weightedAverage = $.let(Const(0.0));
      $.if(Greater(totalWeight, Const(0.0))).then($ => {
        $.assign(weightedAverage, Divide(weightedSum, totalWeight));
      }).else($ => {
        $.assign(weightedAverage, Const(0.0));
      });
      
      $.pushLast(result, Struct({
        id: nodeId,
        weighted_sum: weightedSum,
        weighted_average: weightedAverage,
        total_weight: totalWeight
      }));
    });
    
    $.return(result);
  });

/**
 * Group value rollup - aggregates multi-attribute dictionary values from leaf nodes upward through dependency tree
 * 
 * For each node, sums dictionary values for all matching keys across itself and all its descendants.
 * This enables aggregation of complex multi-dimensional data (volume, quality, cost, etc.) in a single pass.
 * Each dictionary key is summed independently across the dependency tree.
 * 
 * **Example:**
 * ```
 * Input Graph:           Dictionary Values:                    Result:
 *     A ──┐                A: {volume:100, quality:0.8, cost:50}   A: {volume:180, quality:2.4, cost:100}
 *         ├──→ B            B: {volume:50, quality:0.9, cost:30}    B: {volume:50, quality:0.9, cost:30}  
 *         └──→ C            C: {volume:30, quality:0.7, cost:20}    C: {volume:30, quality:0.7, cost:20}
 * ```
 * A aggregates: volume=100+50+30=180, quality=0.8+0.9+0.7=2.4, cost=50+30+20=100
 * 
 * **Multi-level Example:**
 * ```
 * Input Graph:           Values:                           Result:
 *     A ──┐               A: {vol:200, qual:0.95}          A: {vol:400, qual:4.25} (sum all)
 *         ├──→ B ──→ D     B: {vol:80, qual:0.85}           B: {vol:120, qual:1.75} (B+D)
 *         └──→ C ──→ E     C: {vol:60, qual:0.75}           C: {vol:80, qual:1.55} (C+E)  
 *                         D: {vol:40, qual:0.9}            D: {vol:40, qual:0.9} (just D)
 *                         E: {vol:20, qual:0.8}            E: {vol:20, qual:0.8} (just E)
 * ```
 * 
 * **Use Cases:**
 * - Multi-metric project tracking: "What's the total volume, quality, and cost for this work stream?"
 * - Resource portfolio analysis: "How do CPU, memory, and storage requirements roll up?"
 * - Financial aggregation: "What are the combined revenue, expenses, and profit across divisions?"
 * 
 * **Algorithm:** Uses DFS traversal to visit all descendants and sum dictionary values by key.
 * Handles varying dictionary keys gracefully - missing keys are treated as 0.
 * 
 * @param nodes Array of group value nodes with id and dictionary of numeric values
 * @param edges Array of directed edges representing dependencies (from → to)
 * @returns Array of group aggregation results with summed dictionary values and contributing nodes for each input node
 */
export const graph_group_value_rollup = new Procedure("graph_group_value_rollup")
  .input("nodes", ArrayType(GraphGroupValueNode))
  .input("edges", ArrayType(GraphEdge))
  .output(ArrayType(GraphGroupAggregationNode))
  .import(graph_build_adjacency_lists)
  .body(($, { nodes, edges }, procs) => {
    // Build adjacency lists using shared utility
    const adjacencyData = $.let(procs.graph_build_adjacency_lists(Struct({ edges })));
    const adjacencyList = $.let(GetField(adjacencyData, "adjacency_list"));
    
    // Create node value maps
    const nodeValues = $.let(NewDict(StringType, DictType(StringType, FloatType)));
    
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      const valueDict = $.let(GetField(node, "value"));
      
      $.insertOrUpdate(nodeValues, nodeId, valueDict);
    });
    
    // Calculate multi-attribute rollups for each node
    const result = $.let(NewArray(GraphGroupAggregationNode));
    
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      
      // Find all descendants using DFS
      const descendants = $.let(NewArray(StringType));
      const visited = $.let(NewSet(StringType));
      const stack = $.let(Get(adjacencyList, nodeId, NewArray(StringType)));
      
      $.while(Greater(Size(stack), Const(0n)), $ => {
        const current = $.let(Get(stack, Subtract(Size(stack), Const(1n))));
        $.deleteLast(stack);
        
        $.if(Not(In(visited, current))).then($ => {
          $.insert(visited, current);
          $.pushLast(descendants, current);
          
          const children = $.let(Get(adjacencyList, current, NewArray(StringType)));
          $.forArray(children, ($, child) => {
            $.if(Not(In(visited, child))).then($ => {
              $.pushLast(stack, child);
            });
          });
        });
      });
      
      // Aggregate values from dictionary generically
      const nodeValueDict = $.let(Get(nodeValues, nodeId));
      const aggregatedDict = $.let(NewDict(StringType, FloatType));
      const contributors = $.let(NewArray(StringType, [nodeId]));
      
      // Initialize aggregated dict with current node's values
      $.forDict(nodeValueDict, ($, value, key) => {
        $.insertOrUpdate(aggregatedDict, key, value);
      });
      
      // Add values from descendants
      $.forArray(descendants, ($, descendantId) => {
        $.pushLast(contributors, descendantId);
        const descendantDict = $.let(Get(nodeValues, descendantId));
        
        $.forDict(descendantDict, ($, value, key) => {
          const existingValue = $.let(Get(aggregatedDict, key, Const(0.0)));
          $.insertOrUpdate(aggregatedDict, key, Add(existingValue, value));
        });
      });
      
      $.pushLast(result, Struct({
        id: nodeId,
        aggregated_values: aggregatedDict,
        contributing_nodes: contributors
      }));
    });
    
    $.return(result);
  });

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
    
    // Analyze edge transitions by type
    const typeTransitionCounts = $.let(NewDict(StringType, DictType(StringType, IntegerType))); // from_type -> (to_type -> count)
    const typeOutgoingCounts = $.let(NewDict(StringType, IntegerType)); // type -> total outgoing edges
    
    $.forArray(edges, ($, edge) => {
      const fromId = $.let(GetField(edge, "from"));
      const toId = $.let(GetField(edge, "to"));
      
      // Get types for source and target nodes
      const fromType = $.let(Get(nodeTypeMap, fromId));
      const toType = $.let(Get(nodeTypeMap, toId));
      
      // Update transition count for this type pair
      $.if(In(typeTransitionCounts, fromType)).then($ => {
        const transitions = $.let(Get(typeTransitionCounts, fromType));
        const currentCount = $.let(Get(transitions, toType, Const(0n)));
        $.insertOrUpdate(transitions, toType, Add(currentCount, Const(1n)));
      }).else($ => {
        const newTransitions = $.let(NewDict(StringType, IntegerType));
        $.insertOrUpdate(newTransitions, toType, Const(1n));
        $.insertOrUpdate(typeTransitionCounts, fromType, newTransitions);
      });
      
      // Update total outgoing count for source type
      const currentOutgoing = $.let(Get(typeOutgoingCounts, fromType, Const(0n)));
      $.insertOrUpdate(typeOutgoingCounts, fromType, Add(currentOutgoing, Const(1n)));
    });
    
    // Build aggregate edges and collect participating types in one pass
    const aggregateEdges = $.let(NewArray(GraphTypeAggregateEdge));
    const typesInEdges = $.let(NewSet(StringType));
    
    $.forDict(typeTransitionCounts, ($, transitions, fromType) => {
      $.insertOrUpdate(typesInEdges, fromType); // Collect fromType
      const totalOutgoing = $.let(Get(typeOutgoingCounts, fromType, Const(0n)));
      
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
          transition_count: transitionCount,
          transition_probability: probability
        }));
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