import { NewSet, Procedure, ToArray } from "@elaraai/core";
import {
  Add,
  And,
  Const,
  Equal,
  Get,
  GetField,
  Greater,
  In,
  NewArray,
  NewDict,
  Not,
  Size,
  Struct,
  Subtract,
} from "@elaraai/core";

import { ArrayType, BooleanType, IntegerType, StringType } from "@elaraai/core";

import { graph_build_adjacency_lists } from "../core/adjacency_lists";
import { GraphNode, GraphEdge, GraphCycleResult } from "../types";

/**
 * Graph Cycle Detection - Iterative DFS algorithm for detecting cycles in directed graphs
 * 
 * **Purpose**: Detects if the graph contains any cycles and identifies the nodes involved in cycles.
 * Uses DFS with state tracking to detect back edges that indicate cycles. Essential for validating 
 * that dependency graphs are actually DAGs (Directed Acyclic Graphs). Supports both early termination
 * for fast cycle detection and full traversal for comprehensive cycle node identification.
 * 
 * **Key Assumptions**:
 * - Input graph is treated as directed (edges maintain their direction)
 * - Graph may contain multiple disconnected components
 * - Self-loops are valid cycles and will be detected
 * - Parallel edges are treated as separate directed connections
 * - Node IDs are unique strings within the graph
 * 
 * **Time Complexity**: O(V + E) where:
 * - V = number of vertices in the graph
 * - E = number of edges in the graph
 * Note: Early termination can significantly improve performance when find_all_cycles = false
 * 
 * **Space Complexity**: O(V + E) for:
 * - Adjacency list storage: O(V + E)
 * - DFS state tracking (colors): O(V)
 * - DFS stack and cycle node storage: O(V)
 * 
 * **Input Parameters**:
 * @param nodes - Array of GraphNode objects containing node definitions
 * @param edges - Array of GraphEdge objects representing directed connections
 * @param find_all_cycles - If true, continues searching after finding first cycle to detect all cycle nodes
 * 
 * **Output Structure**:
 * @returns GraphCycleResult containing:
 * - has_cycle: Boolean indicating if any cycles were found
 * - cycle_nodes: Array of node IDs involved in detected cycles (order depends on DFS traversal)
 * 
 * **Behavior Examples**:
 * ```
 * Example 1: Simple Cycle (Early Termination)
 * Graph: A → B → C → A
 * Input: find_all_cycles = false
 * Output: {has_cycle: true, cycle_nodes: ["A", "C"]}
 *   Stops at first back edge detected
 * 
 * Example 2: Multiple Cycles (Full Detection)
 * Graph: A → B → A, C → D → C
 * Input: find_all_cycles = true  
 * Output: {has_cycle: true, cycle_nodes: ["A", "B", "C", "D"]}
 *   Finds all nodes involved in any cycle
 * 
 * Example 3: Self Loop
 * Graph: A ↺
 * Input: find_all_cycles = false
 * Output: {has_cycle: true, cycle_nodes: ["A", "A"]}
 *   Self-loop detected immediately
 * 
 * Example 4: No Cycles (DAG)
 * Graph: A → B → C
 * Input: find_all_cycles = false
 * Output: {has_cycle: false, cycle_nodes: []}
 *   No back edges found during DFS
 * ```
 * 
 * **Edge Cases Handled**:
 * - Empty graph: Returns {has_cycle: false, cycle_nodes: []}
 * - Single node: Returns {has_cycle: false, cycle_nodes: []} unless self-loop exists
 * - Disconnected components: Processes each component independently  
 * - Dangling edges: Edges referencing non-existent nodes are ignored
 * - Complex nested cycles: Correctly identifies all cycle participants when find_all_cycles = true
 * 
 * **Use Cases**:
 * - Dependency validation: "Can these tasks be completed without circular dependencies?"
 * - Deadlock detection: "Will this resource allocation create deadlocks?"
 * - Topological sort validation: "Is topological ordering possible for this graph?"
 * - Workflow analysis: "Does this process have circular dependencies?"
 * - Import/module dependency checking: "Are there circular imports in the codebase?"
 * 
 * **Algorithm Details**:
 * Uses iterative DFS with three-color node marking:
 * 1. White (0): Unvisited node
 * 2. Gray (1): Currently being processed (on DFS stack)
 * 3. Black (2): Completely processed
 * A back edge occurs when we encounter a gray node, indicating a cycle.
 */
export const graph_cycle_detection = new Procedure("graph_cycle_detection")
  .input("nodes", ArrayType(GraphNode))
  .input("edges", ArrayType(GraphEdge))
  .input("find_all_cycles", BooleanType)
  .output(GraphCycleResult)
  .import(graph_build_adjacency_lists)
  .body(($, { nodes, edges, find_all_cycles }, procs) => {

    // Log start of cycle detection for large graphs
    
    // Build adjacency lists using shared utility
    const adjacencyData = $.let(procs.graph_build_adjacency_lists(Struct({ edges })));
    const adjacencyList = $.let(GetField(adjacencyData, "adjacency_list"));
    
    // DFS-based cycle detection with colors: white(0), gray(1), black(2)
    const color = $.let(NewDict(StringType, IntegerType));
    const cycleNodes = $.let(NewSet(StringType));
    const hasCycle = $.let(Const(false));
    
    // Initialize all nodes as white
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      $.insert(color, nodeId, Const(0n)); // white
    });
    
    // DFS from each unvisited node - with early termination and performance optimizations
    const processedNodes = $.let(Const(0n));
    
    $.forArray(nodes, ($, node, _nodeIndex, outerLabel) => {
      // Early exit if cycle already found and not finding all cycles
      $.if(And(hasCycle, Not(find_all_cycles))).then($ => {
        $.break(outerLabel);
      });
      
      
      const nodeId = $.let(GetField(node, "id"));
      const nodeColor = $.let(Get(color, nodeId));
      
      // Only process truly unvisited nodes (skip black nodes from previous DFS trees)
      $.if(Equal(nodeColor, Const(0n))).then($ => { // if white
        $.assign(processedNodes, Add(processedNodes, Const(1n)));
        
        // Start DFS with pre-allocated stack
        const stack = $.let(NewArray(StringType, [nodeId]));
        const dfsSteps = $.let(Const(0n));
        
        $.while(Greater(Size(stack), Const(0n)), ($, whileLabel) => {
          // Early exit if cycle found during DFS and not finding all cycles
          $.if(And(hasCycle, Not(find_all_cycles))).then($ => {
            $.break(whileLabel);
          });
          
          $.assign(dfsSteps, Add(dfsSteps, Const(1n)));
          
          
          const current = $.let(Get(stack, Subtract(Size(stack), Const(1n))));
          const currentColor = $.let(Get(color, current)); // Single color lookup per iteration
          
          $.if(Equal(currentColor, Const(0n))).then($ => { // white
            $.insertOrUpdate(color, current, Const(1n)); // mark gray
            
            $.if(In(adjacencyList, current)).then($ => {
              const neighbors = $.let(Get(adjacencyList, current));
              
              // Process neighbors with early termination
              $.forArray(neighbors, ($, neighbor, _neighborIndex, neighborLabel) => {
                // Only process neighbors that exist in our color dictionary (valid nodes)
                $.if(In(color, neighbor)).then($ => {
                  const neighborColor = $.let(Get(color, neighbor));
                  
                  $.if(Equal(neighborColor, Const(1n))).then($ => { // gray = back edge = cycle
                    $.assign(hasCycle, Const(true));
                    $.insertOrUpdate(cycleNodes, neighbor);
                    $.insertOrUpdate(cycleNodes, current);
                    
                    // Only break early if not finding all cycles
                    $.if(Not(find_all_cycles)).then($ => {
                      $.break(neighborLabel); // Break out of neighbor processing immediately
                    });
                  }).elseIf(Equal(neighborColor, Const(0n))).then($ => { // white
                    $.pushLast(stack, neighbor);
                  });
                  // Skip black nodes (already processed) - no action needed
                });
                // Skip neighbors that don't exist in nodes array (dangling edges)
              });
            });
          }).elseIf(Equal(currentColor, Const(1n))).then($ => { // gray
            $.deleteLast(stack);
            $.insertOrUpdate(color, current, Const(2n)); // mark black
          }).else($ => { // black - already processed
            $.deleteLast(stack);
          });
        });
      });
    });
    
    $.return(Struct({
      has_cycle: hasCycle,
      cycle_nodes: ToArray(cycleNodes)
    }));
  });