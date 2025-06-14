import { Procedure } from "@elaraai/core";
import {
  Const,
  Get,
  GetField,
  In,
  NewArray,
  NewDict,
  NewSet,
  Not,
  StringJoin,
  Struct,
} from "@elaraai/core";

import { ArrayType, StringType, StructType } from "@elaraai/core";

import {
  GraphNode,
  GraphEdge,
} from "../types";

/**
 * Missing transitions analysis - identifies expected node type transitions that are absent from the graph
 * 
 * Analyzes the graph to find which expected type-to-type transitions are missing.
 * This is useful for validating that graphs follow expected patterns or workflows.
 * 
 * **Example:**
 * ```
 * Input Graph:                Expected Transitions:       Missing Transitions:
 *     A(input) ──→ B(process)    input → process ✓         input → validation (missing)
 *     B(process) ──→ C(output)   process → output ✓        process → backup (missing)
 *                                input → validation ❌
 *                                process → backup ❌
 * 
 * Result: [
 *   { from_type: "input", to_type: "validation" },
 *   { from_type: "process", to_type: "backup" }
 * ]
 * ```
 * 
 * **Use Cases:**
 * - **Workflow validation**: "Are all required processing steps present?"
 * - **Pattern compliance**: "Does this graph follow our expected patterns?"
 * - **Quality assurance**: "What workflow steps are missing?"
 * - **Template verification**: "Does this match our standard workflow template?"
 * 
 * **Algorithm:**
 * 1. Build set of actual transitions from edges and node types
 * 2. Compare against expected transitions
 * 3. Return transitions that are expected but not present
 * 
 * **Complexity:** O(V + E + T) where V = nodes, E = edges, T = expected transitions
 * 
 * @param nodes Array of graph nodes with types
 * @param edges Array of directed edges
 * @param expected_transitions Array of expected type-to-type transitions to validate
 * @returns Array of missing transitions with from_type and to_type
 */
export const graph_missing_transitions = new Procedure("graph_missing_transitions")
  .input("nodes", ArrayType(GraphNode))
  .input("edges", ArrayType(GraphEdge))
  .input("expected_transitions", ArrayType(StructType({
    from_type: StringType,
    to_type: StringType
  })))
  .output(ArrayType(StructType({
    from_type: StringType,
    to_type: StringType
  })))
  .body(($, { nodes, edges, expected_transitions }) => {
    // Build node type map: id -> type
    const nodeTypeMap = $.let(NewDict(StringType, StringType));
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      const nodeType = $.let(GetField(node, "type"));
      $.insert(nodeTypeMap, nodeId, nodeType);
    });

    // Build set of actual transitions present in the graph
    const actualTransitions = $.let(NewSet(StringType)); // "from_type:to_type" format
    $.forArray(edges, ($, edge) => {
      const fromId = $.let(GetField(edge, "from"));
      const toId = $.let(GetField(edge, "to"));
      
      // Only process edges where both nodes exist
      $.if(In(nodeTypeMap, fromId)).then($ => {
        $.if(In(nodeTypeMap, toId)).then($ => {
          const fromType = $.let(Get(nodeTypeMap, fromId));
          const toType = $.let(Get(nodeTypeMap, toId));
          const transitionKey = $.let(StringJoin([fromType, Const(":"), toType]));
          $.insert(actualTransitions, transitionKey);
        });
      });
    });

    // Find missing transitions
    const missingTransitions = $.let(NewArray(StructType({
      from_type: StringType,
      to_type: StringType
    })));

    $.forArray(expected_transitions, ($, expectedTransition) => {
      const fromType = $.let(GetField(expectedTransition, "from_type"));
      const toType = $.let(GetField(expectedTransition, "to_type"));
      const transitionKey = $.let(StringJoin([fromType, Const(":"), toType]));
      
      // If this expected transition is not in the actual transitions, it's missing
      $.if(Not(In(actualTransitions, transitionKey))).then($ => {
        $.pushLast(missingTransitions, Struct({
          from_type: fromType,
          to_type: toType
        }));
      });
    });

    $.return(missingTransitions);
  });