import { Procedure } from "@elaraai/core";
import {
  Add,
  Const,
  Get,
  GetField,
  Greater,
  In,
  NewArray,
  NewDict,
  Subtract,
  Struct,
} from "@elaraai/core";

import { ArrayType, BooleanType, FloatType, StringType } from "@elaraai/core";

import {
  GraphVolumeNode,
  GraphVolumeEdge,
  GraphNodeLoss,
  GraphSystemLossResult,
} from "../types";

/**
 * System Loss Detection - identify, quantify, and locate volume losses in processing networks
 * 
 * **Purpose**: Detects and quantifies actual volume losses in industrial processing networks
 * by analyzing flow patterns and calculating where material goes missing. Designed for 
 * operational monitoring of manufacturing processes, chemical plants, and supply chains 
 * where material losses directly impact efficiency and profitability.
 * 
 * **Key Approach**:
 * - **External Flow Tracking**: Distinguishes system inputs (sources) from outputs (sinks)
 * - **Absolute Loss Calculation**: Tracks actual volume losses, not just mass balance violations
 * - **Node-Level Analysis**: Identifies specific locations where losses occur
 * - **System-Wide Metrics**: Provides total loss quantification for operational dashboards
 * 
 * **Algorithm Logic**:
 * 1. **Identify System Boundaries**: Nodes with no inflow = sources, nodes with no outflow = sinks
 * 2. **Calculate Node Losses**: For each node, loss = volume_in - volume_out (positive = loss)
 * 3. **System Loss Calculation**: total_input - total_output = total system loss
 * 4. **Loss Localization**: Report per-node losses for targeted investigation
 * 
 * **Time Complexity**: O(V + E) where:
 * - V = number of nodes (processing units/vessels)
 * - E = number of edges (material transfers)
 * Single pass through all nodes and edges to build flow maps and calculate losses
 * 
 * **Space Complexity**: O(V + E) for:
 * - Flow tracking dictionaries: O(E)
 * - Node loss analysis arrays: O(V)
 * 
 * **Input Parameters**:
 * @param nodes - Array of processing nodes (vessels, tanks, operations)
 *   - id: unique identifier
 *   - capacity: optional capacity (not used for loss calculation)
 * @param edges - Array of volume transfers between nodes
 *   - from: source node identifier
 *   - to: destination node identifier  
 *   - volume: actual transferred volume (positive values)
 * 
 * **Output Structure**:
 * @returns GraphSystemLossResult containing:
 * - total_input_volume: sum of all volumes entering the system from external sources
 * - total_output_volume: sum of all volumes leaving the system to external sinks
 * - total_system_loss: total volume lost in the system (input - output)
 * - node_losses: per-node analysis showing volume_in, volume_out, and actual_loss
 * 
 * **Behavior Examples**:
 * ```
 * Example 1: Simple Process Line
 * Nodes: [Source, Tank_A, Tank_B, Outlet]
 * Transfers: [Source→Tank_A: 1000, Tank_A→Tank_B: 950, Tank_B→Outlet: 900]
 * Result: total_input=1000, total_output=900, total_system_loss=100
 * Node losses: Tank_A=50, Tank_B=50
 * 
 * Example 2: No Losses (Perfect System)
 * Nodes: [Source, Tank, Outlet] 
 * Transfers: [Source→Tank: 500, Tank→Outlet: 500]
 * Result: total_input=500, total_output=500, total_system_loss=0
 * Node losses: Tank=0
 * 
 * Example 3: Multiple Sources and Sinks
 * Nodes: [Source_A, Source_B, Mixer, Sink_A, Sink_B]
 * Transfers: [Source_A→Mixer: 300, Source_B→Mixer: 200, Mixer→Sink_A: 250, Mixer→Sink_B: 200]
 * Result: total_input=500, total_output=450, total_system_loss=50
 * Node losses: Mixer=50
 * ```
 * 
 * **Edge Cases Handled**:
 * - Empty system: returns zero values for all metrics
 * - Single node: handled as either pure source or pure sink
 * - Self-loops: volume transfers to same node (counted as both in and out)
 * - Disconnected components: each component analyzed independently
 * - Multiple sources/sinks: properly aggregates across all external flows
 * 
 * **Use Cases**:
 * - **Process Efficiency Monitoring**: "Where are we losing 5% of our throughput?"
 * - **Leak Detection**: "Which tanks are showing unexplained volume losses?"
 * - **Supply Chain Optimization**: "What's our total shrinkage from farm to shelf?"
 * - **Quality Control**: "Is our filtration system losing more material than expected?"
 * - **Cost Analysis**: "How much product value are we losing to process inefficiencies?"
 */
export const graph_volume_flow = new Procedure("graph_volume_flow")
  .input("nodes", ArrayType(GraphVolumeNode))
  .input("edges", ArrayType(GraphVolumeEdge))
  .output(GraphSystemLossResult)
  .body(($, { nodes, edges }) => {
    // Build volume flow tracking
    const volumeIn = $.let(NewDict(StringType, FloatType));
    const volumeOut = $.let(NewDict(StringType, FloatType));
    const nodeExists = $.let(NewDict(StringType, BooleanType));
    
    // Initialize all nodes
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      $.insert(nodeExists, nodeId, Const(true));
      $.insert(volumeIn, nodeId, Const(0.0));
      $.insert(volumeOut, nodeId, Const(0.0));
    });
    
    // Process all transfers
    $.forArray(edges, ($, edge) => {
      const fromId = $.let(GetField(edge, "from"));
      const toId = $.let(GetField(edge, "to"));
      const volume = $.let(GetField(edge, "volume"));
      
      // Only process transfers between existing nodes
      $.if(In(nodeExists, fromId)).then($ => {
        $.if(In(nodeExists, toId)).then($ => {
          // Update outflow for source node
          const currentOut = $.let(Get(volumeOut, fromId));
          $.insertOrUpdate(volumeOut, fromId, Add(currentOut, volume));
          
          // Update inflow for destination node
          const currentIn = $.let(Get(volumeIn, toId));
          $.insertOrUpdate(volumeIn, toId, Add(currentIn, volume));
        });
      });
    });
    
    // Calculate system totals and node losses
    const totalInput = $.let(Const(0.0));
    const totalOutput = $.let(Const(0.0));
    const node_losses = $.let(NewArray(GraphNodeLoss));
    
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      const nodeVolumeIn = $.let(Get(volumeIn, nodeId));
      const nodeVolumeOut = $.let(Get(volumeOut, nodeId));
      const actualLoss = $.let(Subtract(nodeVolumeIn, nodeVolumeOut));
      
      // Identify external sources (no inflow) and sinks (no outflow)
      const isSource = $.let(Greater(Const(0.001), nodeVolumeIn));  // Volume in ≈ 0
      const isSink = $.let(Greater(Const(0.001), nodeVolumeOut));   // Volume out ≈ 0
      
      // Add to system totals
      $.if(isSource).then($ => {
        // This is an external source - its outflow is system input
        $.assign(totalInput, Add(totalInput, nodeVolumeOut));
      });
      
      $.if(isSink).then($ => {
        // This is an external sink - its inflow is system output
        $.assign(totalOutput, Add(totalOutput, nodeVolumeIn));
      });
      
      // Record node loss analysis
      $.pushLast(node_losses, Struct({
        node_id: nodeId,
        volume_in: nodeVolumeIn,
        volume_out: nodeVolumeOut,
        actual_loss: actualLoss
      }));
    });
    
    // Calculate total system loss
    const totalSystemLoss = $.let(Subtract(totalInput, totalOutput));
    
    $.return(Struct({
      total_input_volume: totalInput,
      total_output_volume: totalOutput,
      total_system_loss: totalSystemLoss,
      node_losses: node_losses
    }));
  });