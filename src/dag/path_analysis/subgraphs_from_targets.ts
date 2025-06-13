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
  NewSet,
  Not,
  Size,
  StringJoin,
  Struct,
} from "@elaraai/core";

import { ArrayType, SetType, StringType } from "@elaraai/core";

import { graph_build_adjacency_lists } from "../shared_utils";
import { graph_connected_components } from "../flow_conservation";
import {
  GraphNode,
  GraphEdge,
  PathSubgraph,
  PathSubgraphsResult,
} from "../types";

/**
 * Extract subgraphs based on connected components containing target node types.
 * Uses connected component analysis to group targets that belong to the same reachable network.
 * 
 * **Algorithm**: 
 * 1. Find all connected components in the graph (treating edges as undirected for connectivity)
 * 2. Identify components that contain at least one target node
 * 3. Create one subgraph per connected component, with all targets in that component as endpoints
 * 
 * **Key Insight**: Targets that share source nodes belong to the same logical subgraph,
 * representing a single connected workflow with multiple endpoints.
 * 
 * **Example - Connected Targets:**
 * ```
 * Input Graph:                    Result Subgraph:
 *     A ──→ B ──→ D (target)      Single subgraph: {
 *     │           ↗               nodes: [A,B,C,D,E], 
 *     └──→ C ──→ E (target)       edges: [A→B, A→C, B→D, C→E],
 *                                 source_nodes: [A], 
 *                                 target_nodes: [D,E]
 *                               }
 * ```
 * 
 * **Example - Disconnected Components:**
 * ```
 * Input Graph:                    Result Subgraphs:
 *     A ──→ D (target)            Subgraph 1: {nodes: [A,D], target_nodes: [D]}
 *     B ──→ E (target)            Subgraph 2: {nodes: [B,E], target_nodes: [E]}
 *     (no connection between A-D and B-E)
 * ```
 * 
 * @param nodes - All nodes in the full graph
 * @param edges - All edges in the full graph  
 * @param source_node_types - Node types to treat as start points (can be empty)
 * @param target_node_types - Node types to treat as endpoints (must have elements)
 * @returns PathSubgraphsResult containing subgraphs grouped by connected component
 */
export const graph_subgraphs_from_targets = new Procedure("graph_subgraphs_from_targets")
  .input("nodes", ArrayType(GraphNode))
  .input("edges", ArrayType(GraphEdge))
  .input("source_node_types", SetType(StringType))
  .input("target_node_types", SetType(StringType))
  .output(PathSubgraphsResult)
  .import(graph_build_adjacency_lists)
  .import(graph_connected_components)
  .body(($, { nodes, edges, source_node_types, target_node_types }, procs) => {
    const nodeCount = $.let(Size(nodes));
    const edgeCount = $.let(Size(edges));
    const targetTypeCount = $.let(Size(target_node_types));

    $.log(StringJoin`Starting connected component subgraph extraction from targets: ${nodeCount} nodes, ${edgeCount} edges, ${targetTypeCount} target types`);

    // Validate target_node_types is not empty
    $.if(Equal(Size(target_node_types), Const(0n))).then($ => {
      $.error(Const("target_node_types must contain at least one element"));
    });

    // Build node dictionary and collect target nodes
    $.log(Const("Building node dictionary and collecting target nodes..."));
    const nodeDict = $.let(NewDict(StringType, GraphNode));
    const targetNodeIds = $.let(NewSet(StringType));

    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      const nodeType = $.let(GetField(node, "type"));
      $.insert(nodeDict, nodeId, node);

      $.if(In(target_node_types, nodeType)).then($ => {
        $.insert(targetNodeIds, nodeId);
      });
    });

    const foundTargetCount = $.let(Size(targetNodeIds));
    $.log(StringJoin`Found ${foundTargetCount} target nodes of specified types`);

    // Early exit if no target nodes
    $.if(Equal(Size(targetNodeIds), Const(0n))).then($ => {
      $.log(Const("No target nodes found - returning empty result"));
      $.return(Struct({
        subgraphs: NewArray(PathSubgraph)
      }));
    });

    // Find connected components
    $.log(Const("Finding connected components..."));
    const connectedComponentsResult = $.let(procs.graph_connected_components(Struct({ nodes, edges })));
    const componentAssignments = $.let(GetField(connectedComponentsResult, "component_assignments"));
    const componentInfo = $.let(GetField(connectedComponentsResult, "component_info"));

    $.log(StringJoin`Found ${Size(componentInfo)} connected components`);

    // Build maps for fast lookups
    const nodeToComponent = $.let(NewDict(StringType, StringType)); // nodeId -> componentId
    $.forArray(componentAssignments, ($, assignment) => {
      const nodeId = $.let(GetField(assignment, "node_id"));
      const componentId = $.let(GetField(assignment, "component_id"));
      $.insert(nodeToComponent, nodeId, componentId);
    });

    // Group target nodes by their connected components
    const componentToTargets = $.let(NewDict(StringType, ArrayType(StringType))); // componentId -> [targetIds]
    $.forSet(targetNodeIds, ($, targetId) => {
      const componentId = $.let(Get(nodeToComponent, targetId));
      $.if(In(componentToTargets, componentId)).then($ => {
        const targets = $.let(Get(componentToTargets, componentId));
        $.pushLast(targets, targetId);
      }).else($ => {
        $.insert(componentToTargets, componentId, NewArray(StringType, [targetId]));
      });
    });

    // Create subgraphs for components that contain target nodes
    $.log(Const("Building subgraphs for components with target nodes..."));
    const subgraphs = $.let(NewArray(PathSubgraph));
    const processedComponents = $.let(Const(0n));

    $.forArray(componentInfo, ($, component) => {
      const componentId = $.let(GetField(component, "component_id"));
      const componentNodes = $.let(GetField(component, "nodes"));

      // Check if this component has any target nodes
      $.if(In(componentToTargets, componentId)).then($ => {
        $.assign(processedComponents, Add(processedComponents, Const(1n)));

        // Build subgraph for this connected component
        const subgraphNodeArray = $.let(NewArray(GraphNode));
        const subgraphSourceNodes = $.let(NewArray(GraphNode));
        const subgraphTargetNodes = $.let(NewArray(GraphNode));
        const subgraphEdges = $.let(NewArray(GraphEdge));

        // Convert component nodes array to set for fast lookup
        const componentNodeSet = $.let(NewSet(StringType));
        $.forArray(componentNodes, ($, nodeId) => {
          $.insert(componentNodeSet, nodeId);
        });

        // Collect nodes and classify them
        $.forArray(componentNodes, ($, nodeId) => {
          const node = $.let(Get(nodeDict, nodeId));
          $.pushLast(subgraphNodeArray, node);

          const nodeType = $.let(GetField(node, "type"));

          // Check if it's a source node
          $.if(Greater(Size(source_node_types), Const(0n))).then($ => {
            $.if(In(source_node_types, nodeType)).then($ => {
              $.pushLast(subgraphSourceNodes, node);
            });
          }).else($ => {
            // If source_node_types is empty, nodes with no incoming edges are sources
            const hasIncoming = $.let(Const(false));
            $.forArray(edges, ($, edge) => {
              const toId = $.let(GetField(edge, "to"));
              $.if(Equal(toId, nodeId)).then($ => {
                $.assign(hasIncoming, Const(true));
              });
            });
            $.if(Not(hasIncoming)).then($ => {
              $.pushLast(subgraphSourceNodes, node);
            });
          });

          // Check if it's a target node
          $.if(In(target_node_types, nodeType)).then($ => {
            $.pushLast(subgraphTargetNodes, node);
          });
        });

        // Collect edges within this component
        $.forArray(edges, ($, edge) => {
          const fromId = $.let(GetField(edge, "from"));
          const toId = $.let(GetField(edge, "to"));

          $.if(In(componentNodeSet, fromId)).then($ => {
            $.if(In(componentNodeSet, toId)).then($ => {
              $.pushLast(subgraphEdges, edge);
            });
          });
        });

        const subgraph = $.let(Struct({
          nodes: subgraphNodeArray,
          edges: subgraphEdges,
          source_nodes: subgraphSourceNodes,
          target_nodes: subgraphTargetNodes
        }));

        $.pushLast(subgraphs, subgraph);
      });
    });

    const finalSubgraphCount = $.let(Size(subgraphs));
    $.log(StringJoin`Connected component extraction completed: found ${finalSubgraphCount} subgraphs with target nodes from ${foundTargetCount} total targets`);

    $.return(Struct({
      subgraphs: subgraphs
    }));
  });