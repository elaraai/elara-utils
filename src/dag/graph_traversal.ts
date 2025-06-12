import { Procedure } from "@elaraai/core";
import {
  Add,
  Const,
  Equal,
  Get,
  GetField,
  Greater,
  In,
  Less,
  NewArray,
  NewDict,
  NewSet,
  Not,
  Size,
  Struct,
  Subtract,
  ToArray,
} from "@elaraai/core";

import { ArrayType, BooleanType, IntegerType, Nullable, StringType } from "@elaraai/core";

import { graph_build_adjacency_lists } from "./shared_utils";
import { 
    GraphNode, 
    GraphEdge, 
    GraphTraversalNode, 
    GraphTopologicalNode, 
    GraphCycleResult, 
    GraphAncestorNode 
} from "./types";

/**
 * Breadth-First Search (BFS) traversal - visits nodes level by level from the starting node
 * 
 * Explores neighbors at the current depth before moving to nodes at the next depth level.
 * Uses a queue (FIFO) for systematic level-order traversal. Ensures each node is visited exactly once.
 * 
 * **Example - Tree Structure:**
 * ```
 * Input Graph:           Traversal Order:
 *     A ──┐               1. A (start)
 *         ├──→ B           2. B (level 1)
 *         └──→ C           3. C (level 1) 
 *             ├──→ D       4. D (level 2)
 *             └──→ E       5. E (level 2)
 * 
 * Result: ["A", "B", "C", "D", "E"]
 * ```
 * 
 * **Example - Diamond Structure:**
 * ```
 * Input Graph:           Traversal Order:
 *         A               1. A (start)
 *       ┌─┴─┐             2. B (level 1)
 *       B   C             3. C (level 1)
 *       └─┬─┘             4. D (level 2, visited only once)
 *         D
 * 
 * Result: ["A", "B", "C", "D"]
 * ```
 * 
 * **Use Cases:**
 * - Shortest path discovery: "What's the minimum number of hops to reach this node?"
 * - Level-order processing: "Process all immediate dependencies before their sub-dependencies"
 * - Social network analysis: "Find connections within N degrees of separation"
 * 
 * **Algorithm:** Uses queue for FIFO processing and visited set to prevent cycles.
 * Handles disconnected nodes by only visiting reachable nodes from the start.
 * 
 * @param nodes Array of graph nodes (used for validation)
 * @param edges Array of directed edges representing connections (from → to)
 * @param startId ID of the node to begin traversal from
 * @returns Array of node IDs in breadth-first order
 */
export const graph_bfs = new Procedure("graph_bfs")
  .input("nodes", ArrayType(GraphNode))
  .input("edges", ArrayType(GraphEdge))
  .input("startId", StringType)
  .output(ArrayType(StringType))
  .import(graph_build_adjacency_lists)
  .body(($, { edges, startId }, procs) => {
    // Build adjacency lists using shared utility
    const adjacencyData = $.let(procs.graph_build_adjacency_lists(Struct({ edges })));
    const adjacencyList = $.let(GetField(adjacencyData, "adjacency_list"));
    
    // BFS using queue (Procedure methods)
    const queue = $.let(NewArray(StringType, [startId]));
    const visited = $.let(NewSet(StringType, [startId]));
    const result = $.let(NewArray(StringType));
    
    $.while(Greater(Size(queue), Const(0n)), $ => {
      const current = $.let(Get(queue, Const(0n)));
      $.deleteFirst(queue);
      $.pushLast(result, current);
      
      $.if(In(adjacencyList, current)).then($ => {
        const neighbors = $.let(Get(adjacencyList, current));
        $.forArray(neighbors, ($, neighbor) => {
          $.if(Not(In(visited, neighbor))).then($ => {
            $.insert(visited, neighbor);
            $.pushLast(queue, neighbor);
          });
        });
      });
    });
    
    $.return(result);
  });

/**
 * Depth-First Search (DFS) traversal - explores as far as possible along each branch before backtracking
 * 
 * Goes deep into the graph before exploring siblings at the same level. Uses a stack (LIFO) for 
 * systematic depth-first exploration. Ensures each node is visited exactly once.
 * 
 * **Example - Tree Structure:**
 * ```
 * Input Graph:           Traversal Order:
 *     A ──┐               1. A (start)
 *         ├──→ B           2. C (go deep first)
 *         └──→ C           3. B (backtrack, then explore)
 *             ├──→ D       4. E (continue deep)
 *             └──→ E       5. D (finish branch)
 * 
 * Result: ["A", "C", "B", "E", "D"] (stack reverses order)
 * ```
 * 
 * **Example - Diamond Structure:**
 * ```
 * Input Graph:           Traversal Order:
 *         A               1. A (start)
 *       ┌─┴─┐             2. C (first neighbor, go deep)
 *       B   C             3. D (reach bottom via C)
 *       └─┬─┘             4. B (backtrack, D already visited)
 *         D
 * 
 * Result: ["A", "C", "D", "B"]
 * ```
 * 
 * **Use Cases:**
 * - Dependency resolution: "Complete all sub-tasks before moving to the next main task"
 * - Path exploration: "Explore complete paths through decision trees"
 * - Cycle detection: "Detect cycles by tracking back edges during traversal"
 * 
 * **Algorithm:** Uses stack for LIFO processing and visited set to prevent cycles.
 * The stack-based approach naturally creates depth-first behavior by always processing the most recently added node.
 * 
 * @param nodes Array of graph nodes (used for validation)
 * @param edges Array of directed edges representing connections (from → to)
 * @param startId ID of the node to begin traversal from
 * @returns Array of node IDs in depth-first order
 */
export const graph_dfs = new Procedure("graph_dfs")
  .input("nodes", ArrayType(GraphNode))
  .input("edges", ArrayType(GraphEdge))
  .input("startId", StringType)
  .output(ArrayType(StringType))
  .import(graph_build_adjacency_lists)
  .body(($, { edges, startId }, procs) => {
    // Build adjacency lists using shared utility
    const adjacencyData = $.let(procs.graph_build_adjacency_lists(Struct({ edges })));
    const adjacencyList = $.let(GetField(adjacencyData, "adjacency_list"));
    
    // DFS using stack (Procedure methods)
    const stack = $.let(NewArray(StringType, [startId]));
    const visited = $.let(NewSet(StringType));
    const result = $.let(NewArray(StringType));
    
    $.while(Greater(Size(stack), Const(0n)), $ => {
      const current = $.let(Get(stack, Subtract(Size(stack), Const(1n))));
      $.deleteLast(stack);
      
      $.if(Not(In(visited, current))).then($ => {
        $.insert(visited, current);
        $.pushLast(result, current);
        
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
    
    $.return(result);
  });

/**
 * Enhanced traversal - performs BFS or DFS with detailed tracking of depth, order, and parent relationships
 * 
 * Extends basic traversal algorithms to capture rich traversal metadata including visit order, 
 * depth from start node, and parent relationships. Useful for building spanning trees and analyzing graph structure.
 * 
 * **Example - BFS Mode:**
 * ```
 * Input Graph:           BFS Result:
 *     A ──┐               A: order=0, depth=0, parent=null
 *         ├──→ B           B: order=1, depth=1, parent=A
 *         └──→ C           C: order=2, depth=1, parent=A
 *             └──→ D       D: order=3, depth=2, parent=B
 * 
 * Result: Level-order with depth tracking
 * ```
 * 
 * **Example - DFS Mode:**
 * ```
 * Input Graph:           DFS Result:
 *     A ──┐               A: order=0, depth=0, parent=null
 *         ├──→ B           C: order=1, depth=1, parent=A (visits C first)
 *         └──→ C           D: order=2, depth=2, parent=C (goes deep)
 *             └──→ D       B: order=3, depth=1, parent=A (backtracks)
 * 
 * Result: Depth-first with backtracking metadata
 * ```
 * 
 * **Use Cases:**
 * - Spanning tree construction: "Build a tree that connects all reachable nodes"
 * - Hierarchy analysis: "What's the depth and parent of each node in the dependency tree?"
 * - Distance calculation: "How far is each node from the starting point?"
 * 
 * **Algorithm:** Combines traversal logic with metadata tracking. 
 * BFS mode provides shortest-path depths, DFS mode provides exploration order with depths.
 * 
 * @param nodes Array of graph nodes (used for validation)
 * @param edges Array of directed edges representing connections (from → to)
 * @param startId ID of the node to begin traversal from
 * @param useBFS true for breadth-first (level-order), false for depth-first
 * @returns Array of traversal nodes with id, visited_order, depth, and parent_id
 */
export const graph_enhanced_traversal = new Procedure("graph_enhanced_traversal")
  .input("nodes", ArrayType(GraphNode))
  .input("edges", ArrayType(GraphEdge))
  .input("startId", StringType)
  .input("useBFS", BooleanType) // true for BFS, false for DFS
  .output(ArrayType(GraphTraversalNode))
  .body(($, { edges, startId, useBFS }) => {
    // Build adjacency list
    const adjacencyList = $.let(NewDict(StringType, ArrayType(StringType)));
    
    $.forArray(edges, ($, edge) => {
      const fromId = $.let(GetField(edge, "from"));
      const toId = $.let(GetField(edge, "to"));
      
      $.if(In(adjacencyList, fromId)).then($ => {
        const neighbors = $.let(Get(adjacencyList, fromId));
        $.pushLast(neighbors, toId);
      }).else($ => {
        $.insert(adjacencyList, fromId, NewArray(StringType, [toId]));
      });
    });
    
    // Initialize traversal structures
    const queue = $.let(NewArray(StringType, [startId]));
    const visited = $.let(NewSet(StringType));
    const result = $.let(NewArray(GraphTraversalNode));
    const parentMap = $.let(NewDict(StringType, Nullable(StringType)));
    const depthMap = $.let(NewDict(StringType, IntegerType));
    const visitOrder = $.let(Const(0n));
    
    // Initialize start node
    $.insert(parentMap, startId, Const(null, Nullable(StringType)));
    $.insert(depthMap, startId, Const(0n));
    
    $.while(Greater(Size(queue), Const(0n)), $ => {
      // Get current node based on BFS vs DFS
      const current = $.let(Const(""));
      $.if(useBFS).then($ => {
        const node = $.let(Get(queue, Const(0n)));
        $.deleteFirst(queue);
        $.assign(current, node);
      }).else($ => {
        const node = $.let(Get(queue, Subtract(Size(queue), Const(1n))));
        $.deleteLast(queue);
        $.assign(current, node);
      });
      
      $.if(Not(In(visited, current))).then($ => {
        $.insert(visited, current);
        
        // Add to result with traversal info
        const currentDepth = $.let(Get(depthMap, current));
        const currentParent = $.let(Get(parentMap, current));
        
        $.pushLast(result, Struct({
          id: current,
          visited_order: visitOrder,
          depth: currentDepth,
          parent_id: currentParent
        }));
        
        $.assign(visitOrder, Add(visitOrder, Const(1n)));
        
        // Add neighbors
        $.if(In(adjacencyList, current)).then($ => {
          const neighbors = $.let(Get(adjacencyList, current));
          $.forArray(neighbors, ($, neighbor) => {
            $.if(Not(In(visited, neighbor))).then($ => {
              $.if(Not(In(depthMap, neighbor))).then($ => {
                $.insert(depthMap, neighbor, Add(currentDepth, Const(1n)));
                $.insert(parentMap, neighbor, current);
                $.pushLast(queue, neighbor);
              });
            });
          });
        });
      });
    });
    
    $.return(result);
  });

/**
 * Topological sort - orders nodes such that for every edge (A→B), A comes before B in the ordering
 * 
 * Produces a linear ordering of nodes that respects dependency relationships. Essential for scheduling 
 * tasks where some tasks must complete before others can begin. Also assigns layer numbers for 
 * parallel processing optimization.
 * 
 * **Example - Basic DAG:**
 * ```
 * Input Graph:           Topological Order:        Layers:
 *     A ──┐               0: A (no dependencies)     Layer 0: [A]
 *         ├──→ B           1: B (depends on A)       Layer 1: [B, C]  
 *         └──→ C           2: C (depends on A)       Layer 2: [D]
 *             └─┬──→ D     3: D (depends on B,C)
 *               └───→ D
 * 
 * Result: [{id:"A", order:0, layer:0}, {id:"B", order:1, layer:1}, ...]
 * ```
 * 
 * **Example - Multiple Roots:**
 * ```
 * Input Graph:           Topological Order:        Layers:
 *     A ──┐               0: A (root 1)             Layer 0: [A, B]
 *         └──→ C          1: B (root 2)             Layer 1: [C]
 *     B ──┘               2: C (depends on A,B)
 * 
 * A and B can execute in parallel (same layer)
 * ```
 * 
 * **Use Cases:**
 * - Task scheduling: "In what order should tasks execute to respect dependencies?"
 * - Build systems: "Which modules should compile before others?"
 * - Course prerequisites: "What's a valid sequence to take these classes?"
 * 
 * **Algorithm:** Uses Kahn's algorithm with in-degree tracking and queue processing.
 * Layer assignment enables parallel execution of independent tasks.
 * 
 * @param nodes Array of graph nodes to be ordered
 * @param edges Array of directed edges representing dependencies (from → to)
 * @returns Array of topo nodes with id, topological order, and layer assignment
 */
export const graph_topological_sort = new Procedure("graph_topological_sort")
  .input("nodes", ArrayType(GraphNode))
  .input("edges", ArrayType(GraphEdge))
  .output(ArrayType(GraphTopologicalNode))
  .body(($, { nodes, edges }) => {
    // Build adjacency list and in-degree count
    const adjacencyList = $.let(NewDict(StringType, ArrayType(StringType)));
    const inDegree = $.let(NewDict(StringType, IntegerType));
    
    // Initialize all nodes with zero in-degree
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      $.insert(inDegree, nodeId, Const(0n));
      $.insert(adjacencyList, nodeId, NewArray(StringType));
    });
    
    // Build graph and calculate in-degrees
    $.forArray(edges, ($, edge) => {
      const fromId = $.let(GetField(edge, "from"));
      const toId = $.let(GetField(edge, "to"));
      
      // Add to adjacency list
      const neighbors = $.let(Get(adjacencyList, fromId, NewArray(StringType)));
      $.pushLast(neighbors, toId);
      
      // Increment in-degree
      const currentInDegree = $.let(Get(inDegree, toId, Const(0n)));
      $.insertOrUpdate(inDegree, toId, Add(currentInDegree, Const(1n)));
    });
    
    // Find nodes with zero in-degree
    const queue = $.let(NewArray(StringType));
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      const degree = $.let(Get(inDegree, nodeId));
      $.if(Equal(degree, Const(0n))).then($ => {
        $.pushLast(queue, nodeId);
      });
    });
    
    const result = $.let(NewArray(GraphTopologicalNode));
    const topoOrder = $.let(Const(0n));
    const layerNumber = $.let(Const(0n));
    
    // Process nodes layer by layer
    $.while(Greater(Size(queue), Const(0n)), $ => {
      const layerSize = $.let(Size(queue));
      const currentLayer = $.let(layerNumber);
      
      // Process all nodes in current layer
      const layerCounter = $.let(Const(0n));
      $.while(Less(layerCounter, layerSize), $ => {
        const current = $.let(Get(queue, Const(0n)));
        $.deleteFirst(queue);
        
        $.pushLast(result, Struct({
          id: current,
          topo_order: topoOrder,
          layer: currentLayer
        }));
        
        $.assign(topoOrder, Add(topoOrder, Const(1n)));
        $.assign(layerCounter, Add(layerCounter, Const(1n)));
        
        // Process neighbors
        const neighbors = $.let(Get(adjacencyList, current, NewArray(StringType)));
        $.forArray(neighbors, ($, neighbor) => {
          const neighborDegree = $.let(Get(inDegree, neighbor));
          const newDegree = $.let(Subtract(neighborDegree, Const(1n)));
          $.insertOrUpdate(inDegree, neighbor, newDegree);
          
          $.if(Equal(newDegree, Const(0n))).then($ => {
            $.pushLast(queue, neighbor);
          });
        });
      });
      
      // Increment layer number after processing all nodes in current layer
      $.assign(layerNumber, Add(layerNumber, Const(1n)));
    });
    
    $.return(result);
  });

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
    // Build adjacency lists using shared utility
    const adjacencyData = $.let(procs.graph_build_adjacency_lists(Struct({ edges })));
    const adjacencyList = $.let(GetField(adjacencyData, "adjacency_list"));
    
    // DFS-based cycle detection with colors: white(0), gray(1), black(2)
    const color = $.let(NewDict(StringType, IntegerType));
    const cycleNodes = $.let(NewArray(StringType));
    const hasCycle = $.let(Const(false));
    
    // Initialize all nodes as white
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      $.insert(color, nodeId, Const(0n)); // white
    });
    
    // DFS from each unvisited node
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      const nodeColor = $.let(Get(color, nodeId));
      
      $.if(Equal(nodeColor, Const(0n))).then($ => { // if white
        // Start DFS
        const stack = $.let(NewArray(StringType, [nodeId]));
        
        $.while(Greater(Size(stack), Const(0n)), $ => {
          const current = $.let(Get(stack, Subtract(Size(stack), Const(1n))));
          const currentColor = $.let(Get(color, current));
          
          $.if(Equal(currentColor, Const(0n))).then($ => { // white
            $.insertOrUpdate(color, current, Const(1n)); // mark gray
            
            $.if(In(adjacencyList, current)).then($ => {
              const neighbors = $.let(Get(adjacencyList, current));
              $.forArray(neighbors, ($, neighbor) => {
                const neighborColor = $.let(Get(color, neighbor));
                
                $.if(Equal(neighborColor, Const(1n))).then($ => { // gray = back edge = cycle
                  $.assign(hasCycle, Const(true));
                  $.pushLast(cycleNodes, neighbor);
                  $.pushLast(cycleNodes, current);
                }).elseIf(Equal(neighborColor, Const(0n))).then($ => { // white
                  $.pushLast(stack, neighbor);
                });
              });
            });
          }).elseIf(Equal(currentColor, Const(1n))).then($ => { // gray
            $.deleteLast(stack);
            $.insertOrUpdate(color, current, Const(2n)); // mark black
          }).else($ => { // black
            $.deleteLast(stack);
          });
        });
      });
    });
    
    $.return(Struct({
      has_cycle: hasCycle,
      cycle_nodes: cycleNodes
    }));
  });

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
