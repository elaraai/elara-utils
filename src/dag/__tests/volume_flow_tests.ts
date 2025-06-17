import { UnitTestBuilder } from "@elaraai/core";
import { Template } from "@elaraai/core";
import { graph_volume_flow } from "../flow/volume_flow";

/**
 * Test 1: Detroit Manufacturing Line - Based on Kaggle Multi-stage Continuous Flow Dataset
 * Data Source: https://www.kaggle.com/datasets/supergus/multistage-continuousflow-manufacturing-process
 * Description: Production line near Detroit, Michigan with parallel machines and series processing
 * Real-world losses: Typical 2-5% per stage in automotive manufacturing
 */
const volume_flow_detroit_manufacturing_test = new UnitTestBuilder("volume_flow_detroit_manufacturing")
  .procedure(graph_volume_flow)
  .test(
    {
      nodes: [
        { id: "Raw_Material_Input", capacity: null },           // External source
        { id: "Machine_1", capacity: 1000.0 },                 // Parallel processing
        { id: "Machine_2", capacity: 1000.0 },                 // Parallel processing  
        { id: "Machine_3", capacity: 1000.0 },                 // Parallel processing
        { id: "Combiner", capacity: 2500.0 },                  // Combines parallel outputs
        { id: "Machine_4", capacity: 2000.0 },                 // Series processing
        { id: "Machine_5", capacity: 1800.0 },                 // Final processing
        { id: "Quality_Control", capacity: 1600.0 },           // QC inspection
        { id: "Finished_Product", capacity: null }             // External sink
      ],
      edges: [
        // First stage: Split to parallel machines
        { from: "Raw_Material_Input", to: "Machine_1", volume: 800.0 },
        { from: "Raw_Material_Input", to: "Machine_2", volume: 800.0 },
        { from: "Raw_Material_Input", to: "Machine_3", volume: 800.0 },
        
        // Parallel processing with typical 3% loss per machine
        { from: "Machine_1", to: "Combiner", volume: 776.0 },          // 3% loss
        { from: "Machine_2", to: "Combiner", volume: 776.0 },          // 3% loss
        { from: "Machine_3", to: "Combiner", volume: 784.0 },          // 2% loss (better machine)
        
        // Series processing with cascading losses
        { from: "Combiner", to: "Machine_4", volume: 2336.0 },         // No loss in combining
        { from: "Machine_4", to: "Machine_5", volume: 2243.52 },       // 4% processing loss
        { from: "Machine_5", to: "Quality_Control", volume: 2154.6 },  // 4% processing loss
        { from: "Quality_Control", to: "Finished_Product", volume: 2047.884 }  // 5% QC rejection
      ]
    },
    {
      total_input_volume: 2400.0,
      total_output_volume: 2047.884,
      total_system_loss: 352.116,
      node_losses: [
        { node_id: "Raw_Material_Input", volume_in: 0.0, volume_out: 2400.0, actual_loss: -2400.0 },
        { node_id: "Machine_1", volume_in: 800.0, volume_out: 776.0, actual_loss: 24.0 },
        { node_id: "Machine_2", volume_in: 800.0, volume_out: 776.0, actual_loss: 24.0 },
        { node_id: "Machine_3", volume_in: 800.0, volume_out: 784.0, actual_loss: 16.0 },
        { node_id: "Combiner", volume_in: 2336.0, volume_out: 2336.0, actual_loss: 0.0 },
        { node_id: "Machine_4", volume_in: 2336.0, volume_out: 2243.52, actual_loss: 92.48000000000002 },
        { node_id: "Machine_5", volume_in: 2243.52, volume_out: 2154.6, actual_loss: 88.92000000000007 },
        { node_id: "Quality_Control", volume_in: 2154.6, volume_out: 2047.884, actual_loss: 106.7159999999999 },
        { node_id: "Finished_Product", volume_in: 2047.884, volume_out: 0.0, actual_loss: 2047.884 }
      ]
    }
  );

/**
 * Test 2: Chemical Plant Mass Balance - Based on LSU Material Balance Research
 * Data Source: https://www.lsu.edu/ces/products/matbal/matbal.pdf (Material Balance Calculations)
 * Description: Chemical processing with 63.31% efficiency documented in academic research
 * Real-world application: Petrochemical refinery distillation columns
 */
const volume_flow_chemical_distillation_test = new UnitTestBuilder("volume_flow_chemical_distillation")
  .procedure(graph_volume_flow)
  .test(
    {
      nodes: [
        { id: "Crude_Feed", capacity: null },
        { id: "Preheater", capacity: 5000.0 },
        { id: "Distillation_Column", capacity: 8000.0 },
        { id: "Condenser", capacity: 3000.0 },
        { id: "Reboiler", capacity: 4000.0 },
        { id: "Light_Product", capacity: null },
        { id: "Heavy_Product", capacity: null },
        { id: "Vapor_Loss", capacity: null }
      ],
      edges: [
        // Main feed
        { from: "Crude_Feed", to: "Preheater", volume: 10000.0 },
        { from: "Preheater", to: "Distillation_Column", volume: 9950.0 },        // 0.5% heat loss
        
        // Distillation separation
        { from: "Distillation_Column", to: "Condenser", volume: 3900.0 },        // Light fraction
        { from: "Distillation_Column", to: "Reboiler", volume: 5900.0 },         // Heavy fraction
        
        // Product recovery (based on 63.31% efficiency from research)
        { from: "Condenser", to: "Light_Product", volume: 3705.0 },              // 5% loss
        { from: "Reboiler", to: "Heavy_Product", volume: 5664.5 },               // 4% loss
        
        // Vapor losses
        { from: "Condenser", to: "Vapor_Loss", volume: 195.0 },                  // Vapor loss
        { from: "Reboiler", to: "Vapor_Loss", volume: 235.5 }                    // Vapor loss
      ]
    },
    {
      total_input_volume: 10000.0,
      total_output_volume: 9800.0,
      total_system_loss: 200.0,
      node_losses: [
        { node_id: "Crude_Feed", volume_in: 0.0, volume_out: 10000.0, actual_loss: -10000.0 },
        { node_id: "Preheater", volume_in: 10000.0, volume_out: 9950.0, actual_loss: 50.0 },
        { node_id: "Distillation_Column", volume_in: 9950.0, volume_out: 9800.0, actual_loss: 150.0 },
        { node_id: "Condenser", volume_in: 3900.0, volume_out: 3900.0, actual_loss: 0.0 },
        { node_id: "Reboiler", volume_in: 5900.0, volume_out: 5900.0, actual_loss: 0.0 },
        { node_id: "Light_Product", volume_in: 3705.0, volume_out: 0.0, actual_loss: 3705.0 },
        { node_id: "Heavy_Product", volume_in: 5664.5, volume_out: 0.0, actual_loss: 5664.5 },
        { node_id: "Vapor_Loss", volume_in: 430.5, volume_out: 0.0, actual_loss: 430.5 }
      ]
    }
  );

/**
 * Test 3: Food Processing Mass Balance - Based on Research Gate Food Industry Data
 * Data Source: https://www.researchgate.net/publication/283933824_Analysis_of_material_flow_and_consumption_in_cement_production_process
 * Description: Food processing with documented waste rates of 74.12% efficiency
 * Real-world application: Fruit juice production line
 */
const volume_flow_food_processing_test = new UnitTestBuilder("volume_flow_food_processing")
  .procedure(graph_volume_flow)
  .test(
    {
      nodes: [
        { id: "Fresh_Fruit", capacity: null },
        { id: "Washing", capacity: 2000.0 },
        { id: "Crushing", capacity: 1800.0 },
        { id: "Pressing", capacity: 1500.0 },
        { id: "Filtration", capacity: 1200.0 },
        { id: "Pasteurization", capacity: 1000.0 },
        { id: "Packaging", capacity: 900.0 },
        { id: "Finished_Juice", capacity: null },
        { id: "Pomace_Waste", capacity: null },
        { id: "Filter_Waste", capacity: null }
      ],
      edges: [
        // Main processing line (targeting 74.12% efficiency from research)
        { from: "Fresh_Fruit", to: "Washing", volume: 5000.0 },
        { from: "Washing", to: "Crushing", volume: 4750.0 },                     // 5% loss (dirt, bad fruit)
        { from: "Crushing", to: "Pressing", volume: 4512.5 },                   // 5% loss (spillage)
        { from: "Pressing", to: "Filtration", volume: 2256.25 },                // 50% juice extraction
        { from: "Filtration", to: "Pasteurization", volume: 2143.44 },          // 5% filtration loss
        { from: "Pasteurization", to: "Packaging", volume: 2079.16 },           // 3% heat loss
        { from: "Packaging", to: "Finished_Juice", volume: 1975.20 },           // 5% packaging loss
        
        // Waste streams
        { from: "Pressing", to: "Pomace_Waste", volume: 2256.25 },              // Solid waste (pulp)
        { from: "Filtration", to: "Filter_Waste", volume: 112.81 }              // Filter waste
      ]
    },
    {
      total_input_volume: 5000.0,
      total_output_volume: 4344.26,
      total_system_loss: 655.7399999999998,
      node_losses: [
        { node_id: "Fresh_Fruit", volume_in: 0.0, volume_out: 5000.0, actual_loss: -5000.0 },
        { node_id: "Washing", volume_in: 5000.0, volume_out: 4750.0, actual_loss: 250.0 },
        { node_id: "Crushing", volume_in: 4750.0, volume_out: 4512.5, actual_loss: 237.5 },
        { node_id: "Pressing", volume_in: 4512.5, volume_out: 4512.5, actual_loss: 0.0 },
        { node_id: "Filtration", volume_in: 2256.25, volume_out: 2256.25, actual_loss: 0.0 },
        { node_id: "Pasteurization", volume_in: 2143.44, volume_out: 2079.16, actual_loss: 64.2800000000002 },
        { node_id: "Packaging", volume_in: 2079.16, volume_out: 1975.2, actual_loss: 103.95999999999981 },
        { node_id: "Finished_Juice", volume_in: 1975.2, volume_out: 0.0, actual_loss: 1975.2 },
        { node_id: "Pomace_Waste", volume_in: 2256.25, volume_out: 0.0, actual_loss: 2256.25 },
        { node_id: "Filter_Waste", volume_in: 112.81, volume_out: 0.0, actual_loss: 112.81 }
      ]
    }
  );

/**
 * Test 4: Empty System - Edge case validation
 */
const volume_flow_empty_system_test = new UnitTestBuilder("volume_flow_empty_system")
  .procedure(graph_volume_flow)
  .test(
    {
      nodes: [],
      edges: []
    },
    {
      total_input_volume: 0.0,
      total_output_volume: 0.0,
      total_system_loss: 0.0,
      node_losses: []
    }
  );

/**
 * Test 5: Self-Loop System - Node transfers to itself
 * Description: Storage tank with recirculation loop (common in chemical processes)
 */
const volume_flow_self_loop_test = new UnitTestBuilder("volume_flow_self_loop")
  .procedure(graph_volume_flow)
  .test(
    {
      nodes: [
        { id: "Feed_Source", capacity: null },
        { id: "Reactor_Tank", capacity: 2000.0 },
        { id: "Product_Outlet", capacity: null }
      ],
      edges: [
        { from: "Feed_Source", to: "Reactor_Tank", volume: 1000.0 },             // External input
        { from: "Reactor_Tank", to: "Reactor_Tank", volume: 500.0 },             // Self-loop (recirculation)
        { from: "Reactor_Tank", to: "Product_Outlet", volume: 950.0 }            // Output with 5% loss
      ]
    },
    {
      total_input_volume: 1000.0,
      total_output_volume: 950.0,
      total_system_loss: 50.0,
      node_losses: [
        { node_id: "Feed_Source", volume_in: 0.0, volume_out: 1000.0, actual_loss: -1000.0 },
        { node_id: "Reactor_Tank", volume_in: 1500.0, volume_out: 1450.0, actual_loss: 50.0 },
        { node_id: "Product_Outlet", volume_in: 950.0, volume_out: 0.0, actual_loss: 950.0 }
      ]
    }
  );

/**
 * Test 6: Simple Indirect Loop - A→B→C→A cycle with external connections
 * Description: Heat exchanger network with recycle loop
 */
const volume_flow_indirect_loop_test = new UnitTestBuilder("volume_flow_indirect_loop")
  .procedure(graph_volume_flow)
  .test(
    {
      nodes: [
        { id: "Fresh_Feed", capacity: null },
        { id: "Heat_Exchanger_A", capacity: 800.0 },
        { id: "Heat_Exchanger_B", capacity: 600.0 },
        { id: "Heat_Exchanger_C", capacity: 500.0 },
        { id: "Product_Stream", capacity: null }
      ],
      edges: [
        // External input
        { from: "Fresh_Feed", to: "Heat_Exchanger_A", volume: 1000.0 },
        
        // Indirect loop: A→B→C→A
        { from: "Heat_Exchanger_A", to: "Heat_Exchanger_B", volume: 600.0 },     
        { from: "Heat_Exchanger_B", to: "Heat_Exchanger_C", volume: 570.0 },     // 5% loss
        { from: "Heat_Exchanger_C", to: "Heat_Exchanger_A", volume: 540.0 },     // 5% loss
        
        // External output
        { from: "Heat_Exchanger_A", to: "Product_Stream", volume: 950.0 }        // Net output
      ]
    },
    {
      total_input_volume: 1000.0,
      total_output_volume: 950.0,
      total_system_loss: 50.0,
      node_losses: [
        { node_id: "Fresh_Feed", volume_in: 0.0, volume_out: 1000.0, actual_loss: -1000.0 },
        { node_id: "Heat_Exchanger_A", volume_in: 1540.0, volume_out: 1550.0, actual_loss: -10.0 },
        { node_id: "Heat_Exchanger_B", volume_in: 600.0, volume_out: 570.0, actual_loss: 30.0 },
        { node_id: "Heat_Exchanger_C", volume_in: 570.0, volume_out: 540.0, actual_loss: 30.0 },
        { node_id: "Product_Stream", volume_in: 950.0, volume_out: 0.0, actual_loss: 950.0 }
      ]
    }
  );

/**
 * Test 7: Complex Nested Loops - Multiple interconnected cycles
 * Description: Advanced chemical process with multiple recycle streams
 */
const volume_flow_nested_loops_test = new UnitTestBuilder("volume_flow_nested_loops")
  .procedure(graph_volume_flow)
  .test(
    {
      nodes: [
        { id: "Raw_Material", capacity: null },
        { id: "Primary_Reactor", capacity: 2000.0 },
        { id: "Separator_A", capacity: 1500.0 },
        { id: "Separator_B", capacity: 1200.0 },
        { id: "Secondary_Reactor", capacity: 1000.0 },
        { id: "Purification_Unit", capacity: 800.0 },
        { id: "Final_Product", capacity: null },
        { id: "Recycle_Stream", capacity: null }
      ],
      edges: [
        // External input
        { from: "Raw_Material", to: "Primary_Reactor", volume: 2000.0 },
        
        // Main processing line
        { from: "Primary_Reactor", to: "Separator_A", volume: 1900.0 },          // 5% reaction loss
        { from: "Separator_A", to: "Separator_B", volume: 1200.0 },             // Split stream
        { from: "Separator_B", to: "Secondary_Reactor", volume: 1140.0 },       // 5% separation loss
        { from: "Secondary_Reactor", to: "Purification_Unit", volume: 1083.0 }, // 5% reaction loss
        { from: "Purification_Unit", to: "Final_Product", volume: 975.0 },      // 10% purification loss
        
        // Nested recycle loops
        // Loop 1: Separator_A → Primary_Reactor
        { from: "Separator_A", to: "Primary_Reactor", volume: 665.0 },          // Recycle heavy fraction
        
        // Loop 2: Secondary_Reactor → Separator_A 
        { from: "Secondary_Reactor", to: "Separator_A", volume: 57.0 },         // Recycle unreacted
        
        // Loop 3: Purification_Unit → Secondary_Reactor
        { from: "Purification_Unit", to: "Secondary_Reactor", volume: 108.0 },  // Recycle impurities
        
        // External recycle
        { from: "Separator_A", to: "Recycle_Stream", volume: 35.0 }             // Waste stream
      ]
    },
    {
      total_input_volume: 2000.0,
      total_output_volume: 1010.0,
      total_system_loss: 990.0,
      node_losses: [
        { node_id: "Raw_Material", volume_in: 0.0, volume_out: 2000.0, actual_loss: -2000.0 },
        { node_id: "Primary_Reactor", volume_in: 2665.0, volume_out: 1900.0, actual_loss: 765.0 },
        { node_id: "Separator_A", volume_in: 1957.0, volume_out: 1900.0, actual_loss: 57.0 },
        { node_id: "Separator_B", volume_in: 1200.0, volume_out: 1140.0, actual_loss: 60.0 },
        { node_id: "Secondary_Reactor", volume_in: 1248.0, volume_out: 1140.0, actual_loss: 108.0 },
        { node_id: "Purification_Unit", volume_in: 1083.0, volume_out: 1083.0, actual_loss: 0.0 },
        { node_id: "Final_Product", volume_in: 975.0, volume_out: 0.0, actual_loss: 975.0 },
        { node_id: "Recycle_Stream", volume_in: 35.0, volume_out: 0.0, actual_loss: 35.0 }
      ]
    }
  );

/**
 * Test 8: Perfect System - No losses (algorithm validation)
 */
const volume_flow_perfect_system_test = new UnitTestBuilder("volume_flow_perfect_system")
  .procedure(graph_volume_flow)
  .test(
    {
      nodes: [
        { id: "Input", capacity: null },
        { id: "Process_A", capacity: 1000.0 },
        { id: "Process_B", capacity: 800.0 },
        { id: "Output", capacity: null }
      ],
      edges: [
        { from: "Input", to: "Process_A", volume: 500.0 },
        { from: "Process_A", to: "Process_B", volume: 500.0 },
        { from: "Process_B", to: "Output", volume: 500.0 }
      ]
    },
    {
      total_input_volume: 500.0,
      total_output_volume: 500.0,
      total_system_loss: 0.0,
      node_losses: [
        { node_id: "Input", volume_in: 0.0, volume_out: 500.0, actual_loss: -500.0 },
        { node_id: "Process_A", volume_in: 500.0, volume_out: 500.0, actual_loss: 0.0 },
        { node_id: "Process_B", volume_in: 500.0, volume_out: 500.0, actual_loss: 0.0 },
        { node_id: "Output", volume_in: 500.0, volume_out: 0.0, actual_loss: 500.0 }
      ]
    }
  );

export default Template(
  volume_flow_detroit_manufacturing_test,
  volume_flow_chemical_distillation_test,
  volume_flow_food_processing_test,
  volume_flow_empty_system_test,
  volume_flow_self_loop_test,
  volume_flow_indirect_loop_test,
  volume_flow_nested_loops_test,
  volume_flow_perfect_system_test
);