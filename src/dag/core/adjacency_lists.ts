import { Procedure } from "@elaraai/core";
import {
  Get,
  GetField,
  In,
  NewArray,
  NewDict,
  NewSet,
  Not,
  Struct,
} from "@elaraai/core";

import { ArrayType, DictType, SetType, StringType, StructType } from "@elaraai/core";

import { 
  GraphEdge
} from "../types";

/**
 * Shared utility for building adjacency lists from graph edges
 * 
 * Creates both forward and reverse adjacency list representations of a graph.
 * This is a fundamental operation used by most graph algorithms, so extracting 
 * it into a shared procedure eliminates code duplication across 17+ procedures.
 * 
 * **Note: Duplicate edges are automatically deduplicated.** If there are multiple 
 * edges between the same pair of nodes, only one connection will be preserved in 
 * the adjacency lists. This creates a simple graph representation.
 * 
 * **Input:**
 * - edges: Array of directed edges with {from: StringType, to: StringType}
 * 
 * **Output:**
 * - adjacency_list: Dictionary mapping each node to its outgoing neighbors
 * - reverse_adjacency_list: Dictionary mapping each node to its incoming neighbors
 * 
 * **Algorithm:**
 * For each edge (from → to):
 * 1. Add 'to' to adjacency_list[from] (if not already present)
 * 2. Add 'from' to reverse_adjacency_list[to] (if not already present)
 * 
 * **Complexity:** O(E) where E = number of edges (linear scan with constant-time operations)
 * 
 * @param edges Array of directed edges representing the graph structure
 * @returns Object with both forward and reverse adjacency dictionaries
 */
export const graph_build_adjacency_lists = new Procedure("graph_build_adjacency_lists")
  .input("edges", ArrayType(GraphEdge))
  .output(StructType({
    adjacency_list: DictType(StringType, ArrayType(StringType)),
    reverse_adjacency_list: DictType(StringType, ArrayType(StringType))
  }))
  .body(($, { edges }) => {
    const adjacencyList = $.let(NewDict(StringType, ArrayType(StringType)));
    const reverseAdjacencyList = $.let(NewDict(StringType, ArrayType(StringType)));
    // Track seen edges to avoid duplicates
    const forwardEdgesSeen = $.let(NewDict(StringType, SetType(StringType))); // fromId -> Set of toIds
    const reverseEdgesSeen = $.let(NewDict(StringType, SetType(StringType))); // toId -> Set of fromIds
    
    $.forArray(edges, ($, edge) => {
      const fromId = $.let(GetField(edge, "from"));
      const toId = $.let(GetField(edge, "to"));
      
      // Build forward adjacency list with duplicate checking
      $.if(In(adjacencyList, fromId)).then($ => {
        const neighbors = $.let(Get(adjacencyList, fromId));
        const seenNeighbors = $.let(Get(forwardEdgesSeen, fromId));
        $.if(Not(In(seenNeighbors, toId))).then($ => {
          $.pushLast(neighbors, toId);
          $.insert(seenNeighbors, toId);
        });
      }).else($ => {
        $.insert(adjacencyList, fromId, NewArray(StringType, [toId]));
        $.insert(forwardEdgesSeen, fromId, NewSet(StringType, [toId]));
      });
      
      // Build reverse adjacency list with duplicate checking
      $.if(In(reverseAdjacencyList, toId)).then($ => {
        const parents = $.let(Get(reverseAdjacencyList, toId));
        const seenParents = $.let(Get(reverseEdgesSeen, toId));
        $.if(Not(In(seenParents, fromId))).then($ => {
          $.pushLast(parents, fromId);
          $.insert(seenParents, fromId);
        });
      }).else($ => {
        $.insert(reverseAdjacencyList, toId, NewArray(StringType, [fromId]));
        $.insert(reverseEdgesSeen, toId, NewSet(StringType, [fromId]));
      });
    });
    
    $.return(Struct({
      adjacency_list: adjacencyList,
      reverse_adjacency_list: reverseAdjacencyList
    }));
  });