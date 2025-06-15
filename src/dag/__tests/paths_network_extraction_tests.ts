import { UnitTestBuilder } from "@elaraai/core";
import { Template } from "@elaraai/core";
import { graph_network_extraction } from "../paths/network_extraction";

// === NETWORK EXTRACTION COMPREHENSIVE TESTS ===

/**
 * Test 1: Basic source-only extraction - single source
 * 
 * **Input Graph:**
 * ```
 * A(source) → B(process) → C(process) → D(target)
 * ```
 * 
 * **Query:** `source_node_ids=["A"], target_node_ids=[]`
 * 
 * **Expected Output:** 1 subgraph with 4 nodes, 3 edges
 * - Finds complete downstream network from source A
 * - Includes: A(source) + B,C,D(intermediates)
 * - Network: A → B → C → D
 */
const network_extraction_source_only_single_test = new UnitTestBuilder("network_extraction_source_only_single")
  .procedure(graph_network_extraction)
  .test(
    {
      nodes: [
        { id: "A", type: "source" },
        { id: "B", type: "process" },
        { id: "C", type: "process" },
        { id: "D", type: "target" }
      ],
      edges: [
        { from: "A", to: "B", type: "flow" },
        { from: "B", to: "C", type: "process" },
        { from: "C", to: "D", type: "output" }
      ],
      source_node_ids: ["A"],
      target_node_ids: []
    },
    {
      subgraphs: [{
        network_nodes: [
          { id: "A", type: "source" },
          { id: "B", type: "process" },
          { id: "C", type: "process" },
          { id: "D", type: "target" }
        ],
        network_edges: [
          { from: "A", to: "B", type: "flow" },
          { from: "B", to: "C", type: "process" },
          { from: "C", to: "D", type: "output" }
        ],
        source_nodes: [{ id: "A", type: "source" }],
        target_nodes: [],
        intermediate_nodes: [
          { id: "B", type: "process" },
          { id: "C", type: "process" },
          { id: "D", type: "target" }
        ],
        total_nodes: 4n,
        total_edges: 3n,
        network_depth: 4n
      }]
    }
  );

/**
 * Test 2: Basic target-only extraction - single target
 * 
 * **Input Graph:**
 * ```
 * A(source) → B(process) → C(process) → D(target)
 * ```
 * 
 * **Query:** `source_node_ids=[], target_node_ids=["D"]`
 * 
 * **Expected Output:** 1 subgraph with 4 nodes, 3 edges
 * - Finds complete upstream network to target D
 * - Includes: A,B,C(intermediates) + D(target)
 * - Network: A → B → C → D
 */
const network_extraction_target_only_single_test = new UnitTestBuilder("network_extraction_target_only_single")
  .procedure(graph_network_extraction)
  .test(
    {
      nodes: [
        { id: "A", type: "source" },
        { id: "B", type: "process" },
        { id: "C", type: "process" },
        { id: "D", type: "target" }
      ],
      edges: [
        { from: "A", to: "B", type: "flow" },
        { from: "B", to: "C", type: "process" },
        { from: "C", to: "D", type: "output" }
      ],
      source_node_ids: [],
      target_node_ids: ["D"]
    },
    {
      subgraphs: [{
        network_nodes: [
          { id: "A", type: "source" },
          { id: "B", type: "process" },
          { id: "C", type: "process" },
          { id: "D", type: "target" }
        ],
        network_edges: [
          { from: "A", to: "B", type: "flow" },
          { from: "B", to: "C", type: "process" },
          { from: "C", to: "D", type: "output" }
        ],
        source_nodes: [],
        target_nodes: [{ id: "D", type: "target" }],
        intermediate_nodes: [
          { id: "A", type: "source" },
          { id: "B", type: "process" },
          { id: "C", type: "process" }
        ],
        total_nodes: 4n,
        total_edges: 3n,
        network_depth: 4n
      }]
    }
  );

/**
 * Test 3: Both sources and targets - direct connection
 * 
 * **Input Graph:**
 * ```
 * A(source) → B(process) → C(target)    X(isolated) → Y(isolated)
 * ```
 * 
 * **Query:** `source_node_ids=["A"], target_node_ids=["C"]`
 * 
 * **Expected Output:** 1 subgraph with 3 nodes, 2 edges
 * - Finds connected network from A to C
 * - Includes: A(source) + B(intermediate) + C(target)
 * - Ignores: X,Y (not part of A→C network)
 * - Network: A → B → C
 */
const network_extraction_source_target_direct_test = new UnitTestBuilder("network_extraction_source_target_direct")
  .procedure(graph_network_extraction)
  .test(
    {
      nodes: [
        { id: "A", type: "source" },
        { id: "B", type: "process" },
        { id: "C", type: "target" },
        { id: "X", type: "isolated" },
        { id: "Y", type: "isolated" }
      ],
      edges: [
        { from: "A", to: "B", type: "flow" },
        { from: "B", to: "C", type: "output" },
        { from: "X", to: "Y", type: "unrelated" }
      ],
      source_node_ids: ["A"],
      target_node_ids: ["C"]
    },
    {
      subgraphs: [{
        network_nodes: [
          { id: "A", type: "source" },
          { id: "B", type: "process" },
          { id: "C", type: "target" }
        ],
        network_edges: [
          { from: "A", to: "B", type: "flow" },
          { from: "B", to: "C", type: "output" }
        ],
        source_nodes: [{ id: "A", type: "source" }],
        target_nodes: [{ id: "C", type: "target" }],
        intermediate_nodes: [{ id: "B", type: "process" }],
        total_nodes: 3n,
        total_edges: 2n,
        network_depth: 3n
      }]
    }
  );

/**
 * Test 4: Convergent processing - multiple sources to single target
 * 
 * **Input Graph:**
 * ```
 * A(source) → C(process) ↘
 *                         E(mixer) → F(target)
 * B(source) → D(process) ↗
 * ```
 * 
 * **Query:** `source_node_ids=["A", "B"], target_node_ids=["F"]`
 * 
 * **Expected Output:** 1 subgraph with 6 nodes, 5 edges
 * - Multiple starting points identify same connected network
 * - Includes: A,B(sources) + C,D,E(intermediates) + F(target)
 * - Network: A→C→E→F + B→D→E (convergent at E)
 */
const network_extraction_convergent_test = new UnitTestBuilder("network_extraction_convergent")
  .procedure(graph_network_extraction)
  .test(
    {
      nodes: [
        { id: "A", type: "source" },
        { id: "B", type: "source" },
        { id: "C", type: "process" },
        { id: "D", type: "process" },
        { id: "E", type: "mixer" },
        { id: "F", type: "target" }
      ],
      edges: [
        { from: "A", to: "C", type: "flow" },
        { from: "B", to: "D", type: "flow" },
        { from: "C", to: "E", type: "input" },
        { from: "D", to: "E", type: "input" },
        { from: "E", to: "F", type: "output" }
      ],
      source_node_ids: ["A", "B"],
      target_node_ids: ["F"]
    },
    {
      subgraphs: [{
        network_nodes: [
          { id: "A", type: "source" },
          { id: "B", type: "source" },
          { id: "C", type: "process" },
          { id: "D", type: "process" },
          { id: "E", type: "mixer" },
          { id: "F", type: "target" }
        ],
        network_edges: [
          { from: "A", to: "C", type: "flow" },
          { from: "B", to: "D", type: "flow" },
          { from: "C", to: "E", type: "input" },
          { from: "D", to: "E", type: "input" },
          { from: "E", to: "F", type: "output" }
        ],
        source_nodes: [
          { id: "A", type: "source" },
          { id: "B", type: "source" }
        ],
        target_nodes: [{ id: "F", type: "target" }],
        intermediate_nodes: [
          { id: "C", type: "process" },
          { id: "D", type: "process" },
          { id: "E", type: "mixer" }
        ],
        total_nodes: 6n,
        total_edges: 5n,
        network_depth: 6n
      }]
    }
  );

/**
 * Test 5: Disconnected components - separate networks from starting points
 * 
 * **Input Graph:**
 * ```
 * A(source) → B(process)    C(target) → D(process)
 * ```
 * 
 * **Query:** `source_node_ids=["A"], target_node_ids=["C"]`
 * 
 * **Expected Output:** 2 subgraphs with 2 nodes each, 1 edge each
 * - Starting points in different disconnected components
 * - Subgraph 1: A(source) + B(intermediate) | A→B
 * - Subgraph 2: C(target) + D(intermediate) | C→D
 */
const network_extraction_disconnected_test = new UnitTestBuilder("network_extraction_disconnected")
  .procedure(graph_network_extraction)
  .test(
    {
      nodes: [
        { id: "A", type: "source" },
        { id: "B", type: "process" },
        { id: "C", type: "target" },
        { id: "D", type: "process" }
      ],
      edges: [
        { from: "A", to: "B", type: "flow" },
        { from: "C", to: "D", type: "flow" }
      ],
      source_node_ids: ["A"],
      target_node_ids: ["C"]
    },
    {
      subgraphs: [
        {
          network_nodes: [
            { id: "A", type: "source" },
            { id: "B", type: "process" }
          ],
          network_edges: [
            { from: "A", to: "B", type: "flow" }
          ],
          source_nodes: [{ id: "A", type: "source" }],
          target_nodes: [],
          intermediate_nodes: [{ id: "B", type: "process" }],
          total_nodes: 2n,
          total_edges: 1n,
          network_depth: 2n
        },
        {
          network_nodes: [
            { id: "C", type: "target" },
            { id: "D", type: "process" }
          ],
          network_edges: [
            { from: "C", to: "D", type: "flow" }
          ],
          source_nodes: [],
          target_nodes: [{ id: "C", type: "target" }],
          intermediate_nodes: [{ id: "D", type: "process" }],
          total_nodes: 2n,
          total_edges: 1n,
          network_depth: 2n
        }
      ]
    }
  );

/**
 * Test 5a: Disconnected components - source only (single subgraph)
 * 
 * **Input Graph:**
 * ```
 * A(source) → B(process)    C(target) → D(process)
 * ```
 * 
 * **Query:** `source_node_ids=["A"], target_node_ids=[]`
 * 
 * **Expected Output:** 1 subgraph with 2 nodes, 1 edge
 * - Only processes network containing source A
 * - Includes: A(source) + B(intermediate)
 * - Ignores: C,D (not connected to A)
 * - Network: A → B
 */
const network_extraction_disconnected_source_only_test = new UnitTestBuilder("network_extraction_disconnected_source_only")
  .procedure(graph_network_extraction)
  .test(
    {
      nodes: [
        { id: "A", type: "source" },
        { id: "B", type: "process" },
        { id: "C", type: "target" },
        { id: "D", type: "process" }
      ],
      edges: [
        { from: "A", to: "B", type: "flow" },
        { from: "C", to: "D", type: "flow" }
      ],
      source_node_ids: ["A"],
      target_node_ids: []
    },
    {
      subgraphs: [
        {
          network_nodes: [
            { id: "A", type: "source" },
            { id: "B", type: "process" }
          ],
          network_edges: [
            { from: "A", to: "B", type: "flow" }
          ],
          source_nodes: [{ id: "A", type: "source" }],
          target_nodes: [],
          intermediate_nodes: [{ id: "B", type: "process" }],
          total_nodes: 2n,
          total_edges: 1n,
          network_depth: 2n
        }
      ]
    }
  );

/**
 * Test 5b: Disconnected components - target only (single subgraph)
 * 
 * **Input Graph:**
 * ```
 * A(source) → B(process)    C(target) → D(process)
 * ```
 * 
 * **Query:** `source_node_ids=[], target_node_ids=["C"]`
 * 
 * **Expected Output:** 1 subgraph with 2 nodes, 1 edge
 * - Only processes network containing target C
 * - Includes: C(target) + D(intermediate)
 * - Ignores: A,B (not connected to C)
 * - Network: C → D
 */
const network_extraction_disconnected_target_only_test = new UnitTestBuilder("network_extraction_disconnected_target_only")
  .procedure(graph_network_extraction)
  .test(
    {
      nodes: [
        { id: "A", type: "source" },
        { id: "B", type: "process" },
        { id: "C", type: "target" },
        { id: "D", type: "process" }
      ],
      edges: [
        { from: "A", to: "B", type: "flow" },
        { from: "C", to: "D", type: "flow" }
      ],
      source_node_ids: [],
      target_node_ids: ["C"]
    },
    {
      subgraphs: [
        {
          network_nodes: [
            { id: "C", type: "target" },
            { id: "D", type: "process" }
          ],
          network_edges: [
            { from: "C", to: "D", type: "flow" }
          ],
          source_nodes: [],
          target_nodes: [{ id: "C", type: "target" }],
          intermediate_nodes: [{ id: "D", type: "process" }],
          total_nodes: 2n,
          total_edges: 1n,
          network_depth: 2n
        }
      ]
    }
  );

/**
 * Test 6: Empty input arrays
 * Input: Graph A→B, source_node_ids=[], target_node_ids=[] | Output: 0 subgraphs
 */
const network_extraction_empty_inputs_test = new UnitTestBuilder("network_extraction_empty_inputs")
  .procedure(graph_network_extraction)
  .test(
    {
      nodes: [
        { id: "A", type: "source" },
        { id: "B", type: "target" }
      ],
      edges: [
        { from: "A", to: "B", type: "flow" }
      ],
      source_node_ids: [],
      target_node_ids: []
    },
    {
      subgraphs: []
    }
  );

/**
 * Test 7: Non-existent source IDs
 * Input: Graph A→B, source_node_ids=["MISSING", "NOTFOUND"] | Output: 0 subgraphs
 */
const network_extraction_invalid_sources_test = new UnitTestBuilder("network_extraction_invalid_sources")
  .procedure(graph_network_extraction)
  .test(
    {
      nodes: [
        { id: "A", type: "source" },
        { id: "B", type: "target" }
      ],
      edges: [
        { from: "A", to: "B", type: "flow" }
      ],
      source_node_ids: ["MISSING", "NOTFOUND"],
      target_node_ids: []
    },
    {
      subgraphs: []
    }
  );

/**
 * Test 8: Single node network (isolated)
 * Input: Graph A(isolated), source_node_ids=["A"] | Output: 1 subgraph (A only)
 */
const network_extraction_single_node_test = new UnitTestBuilder("network_extraction_single_node")
  .procedure(graph_network_extraction)
  .test(
    {
      nodes: [
        { id: "A", type: "isolated" }
      ],
      edges: [],
      source_node_ids: ["A"],
      target_node_ids: []
    },
    {
      subgraphs: [{
        network_nodes: [{ id: "A", type: "isolated" }],
        network_edges: [],
        source_nodes: [{ id: "A", type: "isolated" }],
        target_nodes: [],
        intermediate_nodes: [],
        total_nodes: 1n,
        total_edges: 0n,
        network_depth: 1n
      }]
    }
  );

/**
 * Test 9: Complex diamond pattern
 * Input: Diamond A→B→D, A→C→D, source_node_ids=["A"], target_node_ids=["D"] | Output: 1 subgraph (A,B,C,D)
 */
const network_extraction_diamond_test = new UnitTestBuilder("network_extraction_diamond")
  .procedure(graph_network_extraction)
  .test(
    {
      nodes: [
        { id: "A", type: "source" },
        { id: "B", type: "process" },
        { id: "C", type: "process" },
        { id: "D", type: "target" }
      ],
      edges: [
        { from: "A", to: "B", type: "branch1" },
        { from: "A", to: "C", type: "branch2" },
        { from: "B", to: "D", type: "merge1" },
        { from: "C", to: "D", type: "merge2" }
      ],
      source_node_ids: ["A"],
      target_node_ids: ["D"]
    },
    {
      subgraphs: [{
        network_nodes: [
          { id: "A", type: "source" },
          { id: "B", type: "process" },
          { id: "C", type: "process" },
          { id: "D", type: "target" }
        ],
        network_edges: [
          { from: "A", to: "B", type: "branch1" },
          { from: "A", to: "C", type: "branch2" },
          { from: "B", to: "D", type: "merge1" },
          { from: "C", to: "D", type: "merge2" }
        ],
        source_nodes: [{ id: "A", type: "source" }],
        target_nodes: [{ id: "D", type: "target" }],
        intermediate_nodes: [
          { id: "B", type: "process" },
          { id: "C", type: "process" }
        ],
        total_nodes: 4n,
        total_edges: 4n,
        network_depth: 4n
      }]
    }
  );

/**
 * Test 10: External source inclusion test
 * 
 * **Input Graph:**
 * ```
 * A(source) → B(process) → C(mixer) → D(target)
 *                          ↑
 * X(external) ────────────┘
 * ```
 * 
 * **Query:** `source_node_ids=["A"], target_node_ids=["D"]`
 * 
 * **Expected Output:** 1 subgraph with 5 nodes, 4 edges
 * - Includes external sources feeding into the main network
 * - Includes: A(source) + B,C,X(intermediates) + D(target)
 * - Network: A→B→C→D + X→C (external input to mixer)
 */
const network_extraction_external_sources_test = new UnitTestBuilder("network_extraction_external_sources")
  .procedure(graph_network_extraction)
  .test(
    {
      nodes: [
        { id: "A", type: "source" },
        { id: "B", type: "process" },
        { id: "C", type: "mixer" },
        { id: "D", type: "target" },
        { id: "X", type: "external" }
      ],
      edges: [
        { from: "A", to: "B", type: "flow" },
        { from: "B", to: "C", type: "input" },
        { from: "X", to: "C", type: "additive" },
        { from: "C", to: "D", type: "output" }
      ],
      source_node_ids: ["A"],
      target_node_ids: ["D"]
    },
    {
      subgraphs: [{
        network_nodes: [
          { id: "A", type: "source" },
          { id: "B", type: "process" },
          { id: "C", type: "mixer" },
          { id: "D", type: "target" },
          { id: "X", type: "external" }
        ],
        network_edges: [
          { from: "A", to: "B", type: "flow" },
          { from: "B", to: "C", type: "input" },
          { from: "X", to: "C", type: "additive" },
          { from: "C", to: "D", type: "output" }
        ],
        source_nodes: [{ id: "A", type: "source" }],
        target_nodes: [{ id: "D", type: "target" }],
        intermediate_nodes: [
          { id: "B", type: "process" },
          { id: "C", type: "mixer" },
          { id: "X", type: "external" }
        ],
        total_nodes: 5n,
        total_edges: 4n,
        network_depth: 5n
      }]
    }
  );

/**
 * Test 11: Multiple disconnected source subgraphs
 * Input: A→B→C, X→Y→Z, source_node_ids=["A", "X"] | Output: 2 subgraphs (A,B,C), (X,Y,Z)
 */
const network_extraction_multiple_sources_test = new UnitTestBuilder("network_extraction_multiple_sources")
  .procedure(graph_network_extraction)
  .test(
    {
      nodes: [
        { id: "A", type: "source" },
        { id: "B", type: "process" },
        { id: "C", type: "target" },
        { id: "X", type: "source" },
        { id: "Y", type: "process" },
        { id: "Z", type: "target" }
      ],
      edges: [
        { from: "A", to: "B", type: "flow" },
        { from: "B", to: "C", type: "output" },
        { from: "X", to: "Y", type: "flow" },
        { from: "Y", to: "Z", type: "output" }
      ],
      source_node_ids: ["A", "X"],
      target_node_ids: []
    },
    {
      subgraphs: [
        {
          network_nodes: [
            { id: "A", type: "source" },
            { id: "B", type: "process" },
            { id: "C", type: "target" }
          ],
          network_edges: [
            { from: "A", to: "B", type: "flow" },
            { from: "B", to: "C", type: "output" }
          ],
          source_nodes: [{ id: "A", type: "source" }],
          target_nodes: [],
          intermediate_nodes: [
            { id: "B", type: "process" },
            { id: "C", type: "target" }
          ],
          total_nodes: 3n,
          total_edges: 2n,
          network_depth: 3n
        },
        {
          network_nodes: [
            { id: "X", type: "source" },
            { id: "Y", type: "process" },
            { id: "Z", type: "target" }
          ],
          network_edges: [
            { from: "X", to: "Y", type: "flow" },
            { from: "Y", to: "Z", type: "output" }
          ],
          source_nodes: [{ id: "X", type: "source" }],
          target_nodes: [],
          intermediate_nodes: [
            { id: "Y", type: "process" },
            { id: "Z", type: "target" }
          ],
          total_nodes: 3n,
          total_edges: 2n,
          network_depth: 3n
        }
      ]
    }
  );

/**
 * Test 12: Multiple disconnected target subgraphs
 * Input: A→B→C, X→Y→Z, target_node_ids=["C", "Z"] | Output: 2 subgraphs (A,B,C), (X,Y,Z)
 */
const network_extraction_multiple_targets_test = new UnitTestBuilder("network_extraction_multiple_targets")
  .procedure(graph_network_extraction)
  .test(
    {
      nodes: [
        { id: "A", type: "source" },
        { id: "B", type: "process" },
        { id: "C", type: "target" },
        { id: "X", type: "source" },
        { id: "Y", type: "process" },
        { id: "Z", type: "target" }
      ],
      edges: [
        { from: "A", to: "B", type: "flow" },
        { from: "B", to: "C", type: "output" },
        { from: "X", to: "Y", type: "flow" },
        { from: "Y", to: "Z", type: "output" }
      ],
      source_node_ids: [],
      target_node_ids: ["C", "Z"]
    },
    {
      subgraphs: [
        {
          network_nodes: [
            { id: "A", type: "source" },
            { id: "B", type: "process" },
            { id: "C", type: "target" }
          ],
          network_edges: [
            { from: "A", to: "B", type: "flow" },
            { from: "B", to: "C", type: "output" }
          ],
          source_nodes: [],
          target_nodes: [{ id: "C", type: "target" }],
          intermediate_nodes: [
            { id: "A", type: "source" },
            { id: "B", type: "process" }
          ],
          total_nodes: 3n,
          total_edges: 2n,
          network_depth: 3n
        },
        {
          network_nodes: [
            { id: "X", type: "source" },
            { id: "Y", type: "process" },
            { id: "Z", type: "target" }
          ],
          network_edges: [
            { from: "X", to: "Y", type: "flow" },
            { from: "Y", to: "Z", type: "output" }
          ],
          source_nodes: [],
          target_nodes: [{ id: "Z", type: "target" }],
          intermediate_nodes: [
            { id: "X", type: "source" },
            { id: "Y", type: "process" }
          ],
          total_nodes: 3n,
          total_edges: 2n,
          network_depth: 3n
        }
      ]
    }
  );

/**
 * Test 13: Single target with multiple connected targets (includes siblings)
 * Input: A→B→C→E→F, X→D→E→G, target_node_ids=["F"] | Output: 1 subgraph (A,B,C,D,E,F,G,X)
 */
const network_extraction_single_target_multiple_connected_test = new UnitTestBuilder("network_extraction_single_target_multiple_connected")
  .procedure(graph_network_extraction)
  .test(
    {
      nodes: [
        { id: "A", type: "source" },
        { id: "B", type: "process" },
        { id: "C", type: "mixer" },
        { id: "E", type: "splitter" },
        { id: "F", type: "target" },
        { id: "G", type: "target" },
        { id: "X", type: "external" },
        { id: "D", type: "process" }
      ],
      edges: [
        { from: "A", to: "B", type: "flow" },
        { from: "B", to: "C", type: "input" },
        { from: "C", to: "E", type: "flow" },
        { from: "X", to: "D", type: "supply" },
        { from: "D", to: "E", type: "input" },
        { from: "E", to: "F", type: "output" },
        { from: "E", to: "G", type: "output" }
      ],
      source_node_ids: [],
      target_node_ids: ["F"]
    },
    {
      subgraphs: [{
        network_nodes: [
          { id: "A", type: "source" },
          { id: "B", type: "process" },
          { id: "C", type: "mixer" },
          { id: "E", type: "splitter" },
          { id: "F", type: "target" },
          { id: "G", type: "target" },
          { id: "X", type: "external" },
          { id: "D", type: "process" }
        ],
        network_edges: [
          { from: "A", to: "B", type: "flow" },
          { from: "B", to: "C", type: "input" },
          { from: "C", to: "E", type: "flow" },
          { from: "X", to: "D", type: "supply" },
          { from: "D", to: "E", type: "input" },
          { from: "E", to: "F", type: "output" },
          { from: "E", to: "G", type: "output" }
        ],
        source_nodes: [],
        target_nodes: [{ id: "F", type: "target" }],
        intermediate_nodes: [
          { id: "A", type: "source" },
          { id: "B", type: "process" },
          { id: "C", type: "mixer" },
          { id: "E", type: "splitter" },
          { id: "G", type: "target" },
          { id: "X", type: "external" },
          { id: "D", type: "process" }
        ],
        total_nodes: 8n,
        total_edges: 7n,
        network_depth: 8n
      }]
    }
  );

/**
 * Test 14: Complex external source integration showing B is included
 * Input: A→B→C→E→F, X→D→E, source_node_ids=["A"], target_node_ids=["F"] | Output: 1 subgraph (A,B,C,D,E,F,X)
 */
const network_extraction_complex_external_test = new UnitTestBuilder("network_extraction_complex_external")
  .procedure(graph_network_extraction)
  .test(
    {
      nodes: [
        { id: "A", type: "source" },
        { id: "B", type: "process" },
        { id: "C", type: "mixer" },
        { id: "D", type: "process" },
        { id: "E", type: "mixer" },
        { id: "F", type: "target" },
        { id: "X", type: "external" }
      ],
      edges: [
        { from: "A", to: "B", type: "flow" },
        { from: "B", to: "C", type: "input" },
        { from: "C", to: "E", type: "flow" },
        { from: "X", to: "D", type: "supply" },
        { from: "D", to: "E", type: "input" },
        { from: "E", to: "F", type: "output" }
      ],
      source_node_ids: ["A"],
      target_node_ids: ["F"]
    },
    {
      subgraphs: [{
        network_nodes: [
          { id: "A", type: "source" },
          { id: "B", type: "process" },
          { id: "C", type: "mixer" },
          { id: "D", type: "process" },
          { id: "E", type: "mixer" },
          { id: "F", type: "target" },
          { id: "X", type: "external" }
        ],
        network_edges: [
          { from: "A", to: "B", type: "flow" },
          { from: "B", to: "C", type: "input" },
          { from: "C", to: "E", type: "flow" },
          { from: "X", to: "D", type: "supply" },
          { from: "D", to: "E", type: "input" },
          { from: "E", to: "F", type: "output" }
        ],
        source_nodes: [{ id: "A", type: "source" }],
        target_nodes: [{ id: "F", type: "target" }],
        intermediate_nodes: [
          { id: "B", type: "process" },
          { id: "C", type: "mixer" },
          { id: "D", type: "process" },
          { id: "E", type: "mixer" },
          { id: "X", type: "external" }
        ],
        total_nodes: 7n,
        total_edges: 6n,
        network_depth: 7n
      }]
    }
  );

/**
 * Test 15: Multiple sources, multiple targets (connected) - Single unified network
 * Input: A→C→E, B→C→F, source_node_ids=["A", "B"], target_node_ids=["E", "F"] | Output: 1 subgraph (A,B,C,E,F)
 */
const network_extraction_multiple_sources_targets_connected_test = new UnitTestBuilder("network_extraction_multiple_sources_targets_connected")
  .procedure(graph_network_extraction)
  .test(
    {
      nodes: [
        { id: "A", type: "source" },
        { id: "B", type: "source" },
        { id: "C", type: "process" },
        { id: "E", type: "target" },
        { id: "F", type: "target" }
      ],
      edges: [
        { from: "A", to: "C", type: "flow" },
        { from: "B", to: "C", type: "flow" },
        { from: "C", to: "E", type: "output" },
        { from: "C", to: "F", type: "output" }
      ],
      source_node_ids: ["A", "B"],
      target_node_ids: ["E", "F"]
    },
    {
      subgraphs: [{
        network_nodes: [
          { id: "A", type: "source" },
          { id: "B", type: "source" },
          { id: "C", type: "process" },
          { id: "E", type: "target" },
          { id: "F", type: "target" }
        ],
        network_edges: [
          { from: "A", to: "C", type: "flow" },
          { from: "B", to: "C", type: "flow" },
          { from: "C", to: "E", type: "output" },
          { from: "C", to: "F", type: "output" }
        ],
        source_nodes: [
          { id: "A", type: "source" },
          { id: "B", type: "source" }
        ],
        target_nodes: [
          { id: "E", type: "target" },
          { id: "F", type: "target" }
        ],
        intermediate_nodes: [{ id: "C", type: "process" }],
        total_nodes: 5n,
        total_edges: 4n,
        network_depth: 5n
      }]
    }
  );

/**
 * Test 16: Multiple sources, multiple targets (disconnected) - Multiple separate networks
 * Input: A→B, X→Y, source_node_ids=["A", "X"], target_node_ids=["B", "Y"] | Output: 2 subgraphs (A,B), (X,Y)
 */
const network_extraction_multiple_sources_targets_disconnected_test = new UnitTestBuilder("network_extraction_multiple_sources_targets_disconnected")
  .procedure(graph_network_extraction)
  .test(
    {
      nodes: [
        { id: "A", type: "source" },
        { id: "B", type: "target" },
        { id: "X", type: "source" },
        { id: "Y", type: "target" }
      ],
      edges: [
        { from: "A", to: "B", type: "flow" },
        { from: "X", to: "Y", type: "flow" }
      ],
      source_node_ids: ["A", "X"],
      target_node_ids: ["B", "Y"]
    },
    {
      subgraphs: [
        {
          network_nodes: [
            { id: "A", type: "source" },
            { id: "B", type: "target" }
          ],
          network_edges: [
            { from: "A", to: "B", type: "flow" }
          ],
          source_nodes: [{ id: "A", type: "source" }],
          target_nodes: [{ id: "B", type: "target" }],
          intermediate_nodes: [],
          total_nodes: 2n,
          total_edges: 1n,
          network_depth: 2n
        },
        {
          network_nodes: [
            { id: "X", type: "source" },
            { id: "Y", type: "target" }
          ],
          network_edges: [
            { from: "X", to: "Y", type: "flow" }
          ],
          source_nodes: [{ id: "X", type: "source" }],
          target_nodes: [{ id: "Y", type: "target" }],
          intermediate_nodes: [],
          total_nodes: 2n,
          total_edges: 1n,
          network_depth: 2n
        }
      ]
    }
  );

/**
 * Test 17: Mixed valid and invalid IDs
 * Input: A→B, source_node_ids=["A", "INVALID"], target_node_ids=["B", "MISSING"] | Output: 1 subgraph (A,B)
 */
const network_extraction_mixed_valid_invalid_test = new UnitTestBuilder("network_extraction_mixed_valid_invalid")
  .procedure(graph_network_extraction)
  .test(
    {
      nodes: [
        { id: "A", type: "source" },
        { id: "B", type: "target" }
      ],
      edges: [
        { from: "A", to: "B", type: "flow" }
      ],
      source_node_ids: ["A", "INVALID"],
      target_node_ids: ["B", "MISSING"]
    },
    {
      subgraphs: [{
        network_nodes: [
          { id: "A", type: "source" },
          { id: "B", type: "target" }
        ],
        network_edges: [
          { from: "A", to: "B", type: "flow" }
        ],
        source_nodes: [{ id: "A", type: "source" }],
        target_nodes: [{ id: "B", type: "target" }],
        intermediate_nodes: [],
        total_nodes: 2n,
        total_edges: 1n,
        network_depth: 2n
      }]
    }
  );

/**
 * Test 18: Duplicate IDs in input arrays
 * Input: A→B, source_node_ids=["A", "A"], target_node_ids=["B", "B"] | Output: 1 subgraph (A,B)
 */
const network_extraction_duplicate_ids_test = new UnitTestBuilder("network_extraction_duplicate_ids")
  .procedure(graph_network_extraction)
  .test(
    {
      nodes: [
        { id: "A", type: "source" },
        { id: "B", type: "target" }
      ],
      edges: [
        { from: "A", to: "B", type: "flow" }
      ],
      source_node_ids: ["A", "A"],
      target_node_ids: ["B", "B"]
    },
    {
      subgraphs: [{
        network_nodes: [
          { id: "A", type: "source" },
          { id: "B", type: "target" }
        ],
        network_edges: [
          { from: "A", to: "B", type: "flow" }
        ],
        source_nodes: [{ id: "A", type: "source" }],
        target_nodes: [{ id: "B", type: "target" }],
        intermediate_nodes: [],
        total_nodes: 2n,
        total_edges: 1n,
        network_depth: 2n
      }]
    }
  );

/**
 * Test 19: Self-loops handling
 * Input: A→A (self-loop), A→B, source_node_ids=["A"], target_node_ids=["B"] | Output: 1 subgraph (A,B)
 */
const network_extraction_self_loops_test = new UnitTestBuilder("network_extraction_self_loops")
  .procedure(graph_network_extraction)
  .test(
    {
      nodes: [
        { id: "A", type: "source" },
        { id: "B", type: "target" }
      ],
      edges: [
        { from: "A", to: "A", type: "self_loop" },
        { from: "A", to: "B", type: "flow" }
      ],
      source_node_ids: ["A"],
      target_node_ids: ["B"]
    },
    {
      subgraphs: [{
        network_nodes: [
          { id: "A", type: "source" },
          { id: "B", type: "target" }
        ],
        network_edges: [
          { from: "A", to: "A", type: "self_loop" },
          { from: "A", to: "B", type: "flow" }
        ],
        source_nodes: [{ id: "A", type: "source" }],
        target_nodes: [{ id: "B", type: "target" }],
        intermediate_nodes: [],
        total_nodes: 2n,
        total_edges: 2n,
        network_depth: 2n
      }]
    }
  );

/**
 * Test 20: Cycles handling
 * Input: A→B→C→D + D→B (cycle), source_node_ids=["A"], target_node_ids=["D"] | Output: 1 subgraph (A,B,C,D)
 */
const network_extraction_cycles_test = new UnitTestBuilder("network_extraction_cycles")
  .procedure(graph_network_extraction)
  .test(
    {
      nodes: [
        { id: "A", type: "source" },
        { id: "B", type: "process" },
        { id: "C", type: "process" },
        { id: "D", type: "target" }
      ],
      edges: [
        { from: "A", to: "B", type: "flow" },
        { from: "B", to: "C", type: "process" },
        { from: "C", to: "D", type: "output" },
        { from: "D", to: "B", type: "cycle" }
      ],
      source_node_ids: ["A"],
      target_node_ids: ["D"]
    },
    {
      subgraphs: [{
        network_nodes: [
          { id: "A", type: "source" },
          { id: "B", type: "process" },
          { id: "C", type: "process" },
          { id: "D", type: "target" }
        ],
        network_edges: [
          { from: "A", to: "B", type: "flow" },
          { from: "B", to: "C", type: "process" },
          { from: "C", to: "D", type: "output" },
          { from: "D", to: "B", type: "cycle" }
        ],
        source_nodes: [{ id: "A", type: "source" }],
        target_nodes: [{ id: "D", type: "target" }],
        intermediate_nodes: [
          { id: "B", type: "process" },
          { id: "C", type: "process" }
        ],
        total_nodes: 4n,
        total_edges: 4n,
        network_depth: 4n
      }]
    }
  );

/**
 * Test 21: Large branching factor - Performance and correctness
 * Input: A→(B1,B2,B3,B4,B5)→C, source_node_ids=["A"], target_node_ids=["C"] | Output: 1 subgraph (A,B1,B2,B3,B4,B5,C)
 */
const network_extraction_large_branching_test = new UnitTestBuilder("network_extraction_large_branching")
  .procedure(graph_network_extraction)
  .test(
    {
      nodes: [
        { id: "A", type: "source" },
        { id: "B1", type: "process" },
        { id: "B2", type: "process" },
        { id: "B3", type: "process" },
        { id: "B4", type: "process" },
        { id: "B5", type: "process" },
        { id: "C", type: "target" }
      ],
      edges: [
        { from: "A", to: "B1", type: "branch" },
        { from: "A", to: "B2", type: "branch" },
        { from: "A", to: "B3", type: "branch" },
        { from: "A", to: "B4", type: "branch" },
        { from: "A", to: "B5", type: "branch" },
        { from: "B1", to: "C", type: "merge" },
        { from: "B2", to: "C", type: "merge" },
        { from: "B3", to: "C", type: "merge" },
        { from: "B4", to: "C", type: "merge" },
        { from: "B5", to: "C", type: "merge" }
      ],
      source_node_ids: ["A"],
      target_node_ids: ["C"]
    },
    {
      subgraphs: [{
        network_nodes: [
          { id: "A", type: "source" },
          { id: "B1", type: "process" },
          { id: "B2", type: "process" },
          { id: "B3", type: "process" },
          { id: "B4", type: "process" },
          { id: "B5", type: "process" },
          { id: "C", type: "target" }
        ],
        network_edges: [
          { from: "A", to: "B1", type: "branch" },
          { from: "A", to: "B2", type: "branch" },
          { from: "A", to: "B3", type: "branch" },
          { from: "A", to: "B4", type: "branch" },
          { from: "A", to: "B5", type: "branch" },
          { from: "B1", to: "C", type: "merge" },
          { from: "B2", to: "C", type: "merge" },
          { from: "B3", to: "C", type: "merge" },
          { from: "B4", to: "C", type: "merge" },
          { from: "B5", to: "C", type: "merge" }
        ],
        source_nodes: [{ id: "A", type: "source" }],
        target_nodes: [{ id: "C", type: "target" }],
        intermediate_nodes: [
          { id: "B1", type: "process" },
          { id: "B2", type: "process" },
          { id: "B3", type: "process" },
          { id: "B4", type: "process" },
          { id: "B5", type: "process" }
        ],
        total_nodes: 7n,
        total_edges: 10n,
        network_depth: 7n
      }]
    }
  );

/**
 * Test 22: Empty graph with valid node IDs - Error handling
 * Input: Empty graph, source_node_ids=["A"], target_node_ids=["B"] | Output: 0 subgraphs
 */
const network_extraction_empty_graph_valid_ids_test = new UnitTestBuilder("network_extraction_empty_graph_valid_ids")
  .procedure(graph_network_extraction)
  .test(
    {
      nodes: [],
      edges: [],
      source_node_ids: ["A"],
      target_node_ids: ["B"]
    },
    {
      subgraphs: []
    }
  );

/**
 * Test 23: Complex multi-chain external sources
 * Input: W→X→Y→Z→A→B, source_node_ids=["A"], target_node_ids=["B"] | Output: 1 subgraph (A,B,W,X,Y,Z)
 */
const network_extraction_multi_chain_external_test = new UnitTestBuilder("network_extraction_multi_chain_external")
  .procedure(graph_network_extraction)
  .test(
    {
      nodes: [
        { id: "W", type: "external" },
        { id: "X", type: "external" },
        { id: "Y", type: "external" },
        { id: "Z", type: "external" },
        { id: "A", type: "source" },
        { id: "B", type: "target" }
      ],
      edges: [
        { from: "W", to: "X", type: "supply" },
        { from: "X", to: "Y", type: "supply" },
        { from: "Y", to: "Z", type: "supply" },
        { from: "Z", to: "A", type: "supply" },
        { from: "A", to: "B", type: "flow" }
      ],
      source_node_ids: ["A"],
      target_node_ids: ["B"]
    },
    {
      subgraphs: [{
        network_nodes: [
          { id: "W", type: "external" },
          { id: "X", type: "external" },
          { id: "Y", type: "external" },
          { id: "Z", type: "external" },
          { id: "A", type: "source" },
          { id: "B", type: "target" }
        ],
        network_edges: [
          { from: "W", to: "X", type: "supply" },
          { from: "X", to: "Y", type: "supply" },
          { from: "Y", to: "Z", type: "supply" },
          { from: "Z", to: "A", type: "supply" },
          { from: "A", to: "B", type: "flow" }
        ],
        source_nodes: [{ id: "A", type: "source" }],
        target_nodes: [{ id: "B", type: "target" }],
        intermediate_nodes: [
          { id: "W", type: "external" },
          { id: "X", type: "external" },
          { id: "Y", type: "external" },
          { id: "Z", type: "external" }
        ],
        total_nodes: 6n,
        total_edges: 5n,
        network_depth: 6n
      }]
    }
  );


/**
 * Test 15: Multiple sources, multiple targets (connected) - Single unified network
 * Input: A→C→E, B→C→F, source_node_ids=["A"], target_node_ids=[] | Output: 1 subgraph (A,B,C,E,F)
 */
const network_extraction_limited_sources_targets_connected_test = new UnitTestBuilder("network_extraction_limited_sources_targets_connected_test")
  .procedure(graph_network_extraction)
  .test(
    {
      nodes: [
        { id: "A", type: "source" },
        { id: "B", type: "source" },
        { id: "C", type: "process" },
        { id: "E", type: "target" },
        { id: "F", type: "target" }
      ],
      edges: [
        { from: "A", to: "C", type: "flow" },
        { from: "B", to: "C", type: "flow" },
        { from: "C", to: "E", type: "output" },
        { from: "C", to: "F", type: "output" }
      ],
      source_node_ids: ["A"],
      target_node_ids: []
    },
    {
      subgraphs: [{
        network_nodes: [
          { id: "A", type: "source" },
          { id: "B", type: "source" },
          { id: "C", type: "process" },
          { id: "E", type: "target" },
          { id: "F", type: "target" }
        ],
        network_edges: [
          { from: "A", to: "C", type: "flow" },
          { from: "B", to: "C", type: "flow" },
          { from: "C", to: "E", type: "output" },
          { from: "C", to: "F", type: "output" }
        ],
        source_nodes: [
          { id: "A", type: "source" },
        ],
        target_nodes: [
        ],
        intermediate_nodes: [
          { id: "B", type: "source" },
          { id: "C", type: "process" },
          { id: "E", type: "target" },
          { id: "F", type: "target" }],
        total_nodes: 5n,
        total_edges: 4n,
        network_depth: 5n
      }]
    }
  );

export default Template(
  network_extraction_source_only_single_test,
  network_extraction_target_only_single_test,
  network_extraction_source_target_direct_test,
  network_extraction_convergent_test,
  network_extraction_disconnected_test,
  network_extraction_disconnected_source_only_test,
  network_extraction_disconnected_target_only_test,
  network_extraction_empty_inputs_test,
  network_extraction_invalid_sources_test,
  network_extraction_single_node_test,
  network_extraction_diamond_test,
  network_extraction_external_sources_test,
  network_extraction_multiple_sources_test,
  network_extraction_multiple_targets_test,
  network_extraction_single_target_multiple_connected_test,
  network_extraction_complex_external_test,
  network_extraction_multiple_sources_targets_connected_test,
  network_extraction_multiple_sources_targets_disconnected_test,
  network_extraction_mixed_valid_invalid_test,
  network_extraction_duplicate_ids_test,
  network_extraction_self_loops_test,
  network_extraction_cycles_test,
  network_extraction_large_branching_test,
  network_extraction_empty_graph_valid_ids_test,
  network_extraction_multi_chain_external_test,
  network_extraction_limited_sources_targets_connected_test
);