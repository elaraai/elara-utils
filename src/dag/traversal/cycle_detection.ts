import { Procedure } from "@elaraai/core";
import {
  Add,
  Const,
  Equal,
  Get,
  GetField,
  Greater,
  In,
  NewArray,
  NewDict,
  Size,
  StringJoin,
  Struct,
  Subtract,
} from "@elaraai/core";

import { ArrayType, IntegerType, StringType } from "@elaraai/core";

import { graph_build_adjacency_lists } from "../core/adjacency_lists";
import { GraphNode, GraphEdge, GraphCycleResult } from "../types";

/**
 * Cycle detection - detects if the graph contains any cycles and identifies the nodes involved
 * 
 * Uses DFS with state tracking to detect back edges that indicate cycles. Essential for validating 
 * that dependency graphs are actually DAGs (Directed Acyclic Graphs). Returns both a boolean flag 
 * and the specific nodes involved in detected cycles.
 * 
 * **Example - Simple Cycle:**
 * ```
 * Input Graph:           Cycle Detection:
 *     A ──→ B             1. Start DFS from A
 *     ↑     ↓             2. Visit A → B → C
 *     └──── C             3. C → A creates back edge!
 * 
 * Result: {has_cycle: true, cycle_nodes: ["A", "C"]}
 * ```
 * 
 * **Example - Self Loop:**
 * ```
 * Input Graph:           Cycle Detection:
 *     A ↺                 1. A has edge to itself
 *                         2. Immediate cycle detected
 * 
 * Result: {has_cycle: true, cycle_nodes: ["A", "A"]}
 * ```
 * 
 * **Example - No Cycle (DAG):**
 * ```
 * Input Graph:           Cycle Detection:
 *     A ──→ B             1. DFS visits all nodes
 *     └──→ C              2. No back edges found
 * 
 * Result: {has_cycle: false, cycle_nodes: []}
 * ```
 * 
 * **Use Cases:**
 * - Dependency validation: "Can these tasks be completed without circular dependencies?"
 * - Deadlock detection: "Will this resource allocation create deadlocks?"
 * - Topological sort validation: "Is topological ordering possible for this graph?"
 * 
 * **Algorithm:** Uses DFS with three node states (unvisited, visiting, visited) to detect back edges.
 * A back edge occurs when we encounter a node that's currently being visited in our DFS path.
 * 
 * **Complexity:** O(V + E) where V is the number of vertices and E is the number of edges.
 * 
 * @param nodes Array of graph nodes to check for cycles
 * @param edges Array of directed edges that might form cycles (from → to)
 * @returns Cycle result with has_cycle boolean and array of nodes involved in any detected cycle
 */
export const graph_cycle_detection = new Procedure("graph_cycle_detection")
  .input("nodes", ArrayType(GraphNode))
  .input("edges", ArrayType(GraphEdge))
  .output(GraphCycleResult)
  .import(graph_build_adjacency_lists)
  .body(($, { nodes, edges }, procs) => {
    const nodeCount = $.let(Size(nodes));
    const edgeCount = $.let(Size(edges));
    
    // Log start of cycle detection for large graphs
    $.log(StringJoin`Starting cycle detection on graph with ${nodeCount} nodes and ${edgeCount} edges`);
    
    // Build adjacency lists using shared utility
    $.log(Const("Building adjacency lists..."));
    const adjacencyData = $.let(procs.graph_build_adjacency_lists(Struct({ edges })));
    const adjacencyList = $.let(GetField(adjacencyData, "adjacency_list"));
    $.log(Const("Adjacency lists built successfully"));
    
    // DFS-based cycle detection with colors: white(0), gray(1), black(2)
    const color = $.let(NewDict(StringType, IntegerType));
    const cycleNodes = $.let(NewArray(StringType));
    const hasCycle = $.let(Const(false));
    
    // Initialize all nodes as white
    $.log(Const("Initializing node colors..."));
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      $.insert(color, nodeId, Const(0n)); // white
    });
    $.log(Const("Node color initialization complete"));
    
    // DFS from each unvisited node - with early termination and performance optimizations
    $.log(Const("Starting DFS traversal from unvisited nodes..."));
    const processedNodes = $.let(Const(0n));
    const totalNodes = $.let(Size(nodes));
    
    $.forArray(nodes, ($, node, nodeIndex, outerLabel) => {
      // Early exit if cycle already found
      $.if(hasCycle).then($ => {
        $.log(StringJoin`Cycle found! Terminating early after processing ${processedNodes} of ${totalNodes} nodes`);
        $.break(outerLabel);
      });
      
      // Progress logging for large graphs (at key milestones)
      $.if(Equal(nodeIndex, Const(50000n))).then($ => {
        $.log(StringJoin`Progress: processed 50,000 of ${totalNodes} nodes for DFS starts`);
      });
      $.if(Equal(nodeIndex, Const(100000n))).then($ => {
        $.log(StringJoin`Progress: processed 100,000 of ${totalNodes} nodes for DFS starts`);
      });
      $.if(Equal(nodeIndex, Const(500000n))).then($ => {
        $.log(StringJoin`Progress: processed 500,000 of ${totalNodes} nodes for DFS starts`);
      });
      $.if(Equal(nodeIndex, Const(1000000n))).then($ => {
        $.log(StringJoin`Progress: processed 1,000,000 of ${totalNodes} nodes for DFS starts`);
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
          // Early exit if cycle found during DFS
          $.if(hasCycle).then($ => {
            $.break(whileLabel);
          });
          
          $.assign(dfsSteps, Add(dfsSteps, Const(1n)));
          
          // Progress logging for deep DFS (at key milestones)
          $.if(Equal(dfsSteps, Const(10000n))).then($ => {
            $.log(StringJoin`DFS from node ${nodeId}: 10,000 steps, stack size: ${Size(stack)}`);
          });
          $.if(Equal(dfsSteps, Const(50000n))).then($ => {
            $.log(StringJoin`DFS from node ${nodeId}: 50,000 steps, stack size: ${Size(stack)}`);
          });
          $.if(Equal(dfsSteps, Const(100000n))).then($ => {
            $.log(StringJoin`DFS from node ${nodeId}: 100,000 steps, stack size: ${Size(stack)}`);
          });
          
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
                    $.pushLast(cycleNodes, neighbor);
                    $.pushLast(cycleNodes, current);
                    $.break(neighborLabel); // Break out of neighbor processing immediately
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
    
    // Final logging
    $.if(hasCycle).then($ => {
      $.log(StringJoin`Cycle detection completed: CYCLE FOUND with ${Size(cycleNodes)} cycle nodes`);
    }).else($ => {
      $.log(StringJoin`Cycle detection completed: NO CYCLES FOUND after processing ${totalNodes} nodes`);
    });
    
    $.return(Struct({
      has_cycle: hasCycle,
      cycle_nodes: cycleNodes
    }));
  });