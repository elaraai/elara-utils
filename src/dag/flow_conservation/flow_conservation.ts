import { Procedure } from "@elaraai/core";
import {
  Add,
  Const,
  Divide,
  Get,
  GetField,
  Greater,
  In,
  Multiply,
  NewArray,
  NewDict,
  Struct,
  Subtract,
} from "@elaraai/core";

import { ArrayType, FloatType, StringType, StructType } from "@elaraai/core";

import { Max } from "@elaraai/core";

import {
  GraphFlowNode,
  GraphFlowEdge,
  GraphFlowConservationResult,
} from "../types";

/**
 * Flow conservation analysis - verify conservation of flow through network
 * 
 * Analyzes whether flow is conserved at each node in a flow network. For each node,
 * checks if: initial_value + total_inflow = total_outflow + total_losses
 * 
 * Flows are calculated considering transmission losses on edges. An edge with 
 * weight W and loss_percentage L results in:
 * - actual_flow = W * (1 - L/100) arriving at destination
 * - loss = W * (L/100) lost during transmission
 * 
 * **Example - Balanced Flow:**
 * ```
 * Input Network:              Flow Analysis:
 *     A(8.0) ──60──→ B(0.0)    A→B: 60*0.9 = 54 arrives, 6 lost
 *       ↑       10% loss       B→A: 54*1.0 = 54 returns
 *       └────54←──────┘        A: 8+54 = 100-8 ✓ (conservation: input = output)
 * 
 * Result: {is_conserved: true, violations: []}
 * ```
 * 
 * **Use Cases:**
 * - Network flow validation: "Is mass/energy conserved at each node?"
 * - Pipeline analysis: "Are there flow imbalances indicating leaks or accumulation?"
 * - Resource allocation: "Does the flow distribution respect conservation laws?"
 * 
 * **Algorithm:** For each node, computes total inflow (considering losses) and total outflow,
 * then checks conservation equation: node_value + inflow = outflow + losses.
 * 
 * @param nodes Array of flow nodes with value (initial amount) and capacity properties
 * @param edges Array of flow edges with weight (flow amount) and loss_percentage properties
 * @returns Conservation result with is_conserved boolean and array of violating node IDs
 */
export const graph_flow_conservation = new Procedure("graph_flow_conservation")
  .input("nodes", ArrayType(GraphFlowNode))
  .input("edges", ArrayType(GraphFlowEdge))
  .output(GraphFlowConservationResult)
  .body(($, { nodes, edges }) => {
    // Build flow maps
    const nodeCapacities = $.let(NewDict(StringType, FloatType));
    const nodeValues = $.let(NewDict(StringType, FloatType));
    
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      const capacity = $.let(GetField(node, "capacity"));
      const value = $.let(GetField(node, "value"));
      
      $.insertOrUpdate(nodeCapacities, nodeId, capacity);
      $.insertOrUpdate(nodeValues, nodeId, value);
    });
    
    // Build flow adjacency lists
    const outflows = $.let(NewDict(StringType, ArrayType(StructType({
      to: StringType,
      flow: FloatType,
      loss: FloatType
    }))));
    const inflows = $.let(NewDict(StringType, ArrayType(StructType({
      from: StringType,
      flow: FloatType,
      loss: FloatType
    }))));
    
    $.forArray(edges, ($, edge) => {
      const fromId = $.let(GetField(edge, "from"));
      const toId = $.let(GetField(edge, "to"));
      const weight = $.let(GetField(edge, "weight"));
      const lossPercentage = $.let(GetField(edge, "loss_percentage"));
      
      const actualFlow = $.let(Multiply(weight, Subtract(Const(1.0), Divide(lossPercentage, Const(100.0)))));
      const lossAmount = $.let(Multiply(weight, Divide(lossPercentage, Const(100.0))));
      
      // Add to outflows
      $.if(In(outflows, fromId)).then($ => {
        const flows = $.let(Get(outflows, fromId));
        $.pushLast(flows, Struct({
          to: toId,
          flow: actualFlow,
          loss: lossAmount
        }));
      }).else($ => {
        $.insert(outflows, fromId, NewArray(StructType({
          to: StringType,
          flow: FloatType,
          loss: FloatType
        }), [Struct({
          to: toId,
          flow: actualFlow,
          loss: lossAmount
        })]));
      });
      
      // Add to inflows
      $.if(In(inflows, toId)).then($ => {
        const flows = $.let(Get(inflows, toId));
        $.pushLast(flows, Struct({
          from: fromId,
          flow: actualFlow,
          loss: lossAmount
        }));
      }).else($ => {
        $.insert(inflows, toId, NewArray(StructType({
          from: StringType,
          flow: FloatType,
          loss: FloatType
        }), [Struct({
          from: fromId,
          flow: actualFlow,
          loss: lossAmount
        })]));
      });
    });
    
    // Check conservation for each node
    const violations = $.let(NewArray(StringType));
    const isConserved = $.let(Const(true));
    const tolerance = $.let(Const(0.001)); // Small tolerance for floating point comparison
    
    $.forArray(nodes, ($, node) => {
      const nodeId = $.let(GetField(node, "id"));
      const nodeValue = $.let(Get(nodeValues, nodeId));
      
      // Calculate total inflow
      const totalInflow = $.let(Const(0.0));
      $.if(In(inflows, nodeId)).then($ => {
        const inflowList = $.let(Get(inflows, nodeId));
        $.forArray(inflowList, ($, inflow) => {
          const flow = $.let(GetField(inflow, "flow"));
          $.assign(totalInflow, Add(totalInflow, flow));
        });
      });
      
      // Calculate total outflow
      const totalOutflow = $.let(Const(0.0));
      $.if(In(outflows, nodeId)).then($ => {
        const outflowList = $.let(Get(outflows, nodeId));
        $.forArray(outflowList, ($, outflow) => {
          const flow = $.let(GetField(outflow, "flow"));
          $.assign(totalOutflow, Add(totalOutflow, flow));
        });
      });
      
      // Calculate total loss from this node
      const totalLoss = $.let(Const(0.0));
      $.if(In(outflows, nodeId)).then($ => {
        const outflowList = $.let(Get(outflows, nodeId));
        $.forArray(outflowList, ($, outflow) => {
          const loss = $.let(GetField(outflow, "loss"));
          $.assign(totalLoss, Add(totalLoss, loss));
        });
      });
      
      // Conservation equation: nodeValue + totalInflow = totalOutflow + totalLoss
      const input = $.let(Add(nodeValue, totalInflow));
      const output = $.let(Add(totalOutflow, totalLoss));
      const difference = $.let(Subtract(input, output));
      const absDifference = $.let(Max(difference, Multiply(difference, Const(-1.0))));
      
      $.if(Greater(absDifference, tolerance)).then($ => {
        $.assign(isConserved, Const(false));
        $.pushLast(violations, nodeId);
      });
    });
    
    $.return(Struct({
      is_conserved: isConserved,
      violations: violations
    }));
  });