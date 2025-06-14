import { Procedure } from "@elaraai/core";
import {
  DivideSafe,
  Equal,
  GetField,
  Greater,
  NewArray,
  Not,
  Size,
  Struct,
  Subtract,
} from "@elaraai/core";

import { ArrayType, FloatType, IntegerType, StringType, StructType } from "@elaraai/core";

import { graph_connected_components } from "./connected_components";
import {
  GraphNode,
  GraphEdge,
} from "../types";

/**
 * Bridge node analysis - identifies critical nodes whose removal disconnects the graph
 * 
 * Analyzes connectivity criticality by determining which nodes act as bridges between
 * different parts of the graph. A bridge node is one whose removal would increase the
 * number of connected components, making it critical for overall connectivity.
 * 
 * **Example:**
 * ```
 * Input Graph:                Bridge Analysis:
 *     A ──→ B ──→ C             Original: 1 component [A,B,C,D,E]
 *           │                   Remove B: 2 components [A], [C,D,E]  
 *           ▼                   Remove C: 2 components [A,B], [D,E]
 *           D ──→ E             Remove others: still 1 component
 * 
 * Result: [
 *   { node_id: "B", component_increase: 1, criticality_score: 0.25 },
 *   { node_id: "C", component_increase: 1, criticality_score: 0.25 }
 * ]
 * ```
 * 
 * **Criticality Score**: 
 * - component_increase / total_nodes
 * - Higher scores indicate more critical nodes
 * - Range: 0.0 (not critical) to 1.0 (maximum criticality)
 * 
 * **Use Cases:**
 * - **Network reliability**: "Which nodes are single points of failure?"
 * - **Infrastructure planning**: "Where should we add redundancy?"
 * - **Risk assessment**: "What happens if this critical node fails?"
 * - **System robustness**: "How fragile is our connectivity?"
 * 
 * **Algorithm:**
 * 1. Calculate baseline connected components
 * 2. For each node, simulate removal and recalculate components
 * 3. Identify nodes whose removal increases component count
 * 4. Calculate criticality scores based on connectivity impact
 * 
 * **Performance**: O(V * (V + E)) - checks each node removal
 * 
 * @param nodes Array of graph nodes
 * @param edges Array of directed edges (treated as undirected for connectivity)
 * @returns Array of bridge nodes with their connectivity impact metrics
 */
export const graph_bridge_analysis = new Procedure("graph_bridge_analysis")
  .input("nodes", ArrayType(GraphNode))
  .input("edges", ArrayType(GraphEdge))
  .output(ArrayType(StructType({
    node_id: StringType,
    component_increase: IntegerType,
    criticality_score: FloatType
  })))
  .import(graph_connected_components)
  .body(($, { nodes, edges }, procs) => {
    const totalNodes = $.let(Size(nodes));
    const bridgeNodes = $.let(NewArray(StructType({
      node_id: StringType,
      component_increase: IntegerType,
      criticality_score: FloatType
    })));

    // Calculate baseline connected components
    const baselineResult = $.let(procs.graph_connected_components(Struct({
      nodes: nodes,
      edges: edges
    })));
    const baselineComponentInfo = $.let(GetField(baselineResult, "component_info"));
    const baselineComponentCount = $.let(Size(baselineComponentInfo));

    // For each node, test what happens when we remove it
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      
      // Create filtered nodes (without current node)
      const filteredNodes = $.let(NewArray(GraphNode));
      $.forArray(nodes, ($, otherNode) => {
        const otherNodeId = $.let(GetField(otherNode, "id"));
        $.if(Not(Equal(nodeId, otherNodeId))).then($ => {
          $.pushLast(filteredNodes, otherNode);
        });
      });

      // Create filtered edges (without edges involving current node)
      const filteredEdges = $.let(NewArray(GraphEdge));
      $.forArray(edges, ($, edge) => {
        const fromId = $.let(GetField(edge, "from"));
        const toId = $.let(GetField(edge, "to"));
        $.if(Not(Equal(nodeId, fromId))).then($ => {
          $.if(Not(Equal(nodeId, toId))).then($ => {
            $.pushLast(filteredEdges, edge);
          });
        });
      });

      // Calculate connected components without this node
      const filteredResult = $.let(procs.graph_connected_components(Struct({
        nodes: filteredNodes,
        edges: filteredEdges
      })));
      const filteredComponentInfo = $.let(GetField(filteredResult, "component_info"));
      const filteredComponentCount = $.let(Size(filteredComponentInfo));

      // Check if removing this node increased the number of components
      $.if(Greater(filteredComponentCount, baselineComponentCount)).then($ => {
        const componentIncrease = $.let(Subtract(filteredComponentCount, baselineComponentCount));
        const criticalityScore = $.let(DivideSafe(componentIncrease, totalNodes));
        
        $.pushLast(bridgeNodes, Struct({
          node_id: nodeId,
          component_increase: componentIncrease,
          criticality_score: criticalityScore
        }));
      });
    });

    $.return(bridgeNodes);
  });