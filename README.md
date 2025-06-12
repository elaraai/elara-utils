# elara-utils

Utilities and helpers for the application of Elara Development Kit (EDK)

## Overview

This repository provides a collection of utilities and helper functions designed to enhance and extend the capabilities of the Elara Development Kit (EDK). The EDK consists of two core dependencies:

- **@elaraai/core** - Core functionality and data structures
- **@elaraai/cli** - Command-line interface and development tools

## Structure

The utilities are organized into thematic subdirectories under `src/`, each containing specialized tools and helpers:

### DAG Utilities (`src/dag/`)

Directed Acyclic Graph utilities for data flow analysis and processing:

- **Guides:**
  - [DAG Development Guide](src/dag/DAG_DEVELOPMENT_GUIDE.md) - Development patterns and best practices

- **Core Modules:**
  - `aggregation.ts` - Data aggregation functions for DAG nodes
    - `graph_bottom_up_aggregation` - Aggregates node values from leaf nodes upward through dependency tree to calculate total value impact including all descendants
    - `graph_top_down_aggregation` - Distributes values from parent nodes downward through dependency tree, sharing parent resources equally among direct children
    - `graph_weighted_aggregation` - Aggregates values using node weights from leaf nodes upward, computing weighted sums, averages, and total weights
    - `graph_group_value_rollup` - Aggregates multi-attribute dictionary values from leaf nodes upward, summing each dictionary key independently across the dependency tree
    - `graph_aggregation_by_type` - Groups nodes by type and analyzes type-to-type transitions to create aggregate graph structure with transition probabilities
  - `flow_conservation.ts` - Flow conservation analysis and validation
    - `graph_flow_conservation` - Verifies conservation of flow through network, checking if flow is conserved at each node considering transmission losses
    - `graph_dynamic_reachability` - Analyzes graph reachability considering only active edges, computing ancestors and descendants via active connections only
    - `graph_connected_components` - Identifies connected components in an undirected graph representation, finding groups of nodes reachable from each other
  - `graph_traversal.ts` - Graph traversal algorithms and utilities
    - `graph_bfs` - Performs breadth-first search traversal visiting nodes level by level from the starting node using queue-based exploration
    - `graph_dfs` - Performs depth-first search traversal exploring as far as possible along each branch before backtracking using stack-based exploration
    - `graph_enhanced_traversal` - Performs BFS or DFS with detailed tracking of depth, order, and parent relationships for spanning tree construction
    - `graph_topological_sort` - Orders nodes such that for every edge (A→B), A comes before B, essential for dependency-based task scheduling
    - `graph_cycle_detection` - Detects if the graph contains any cycles and identifies the nodes involved using DFS with state tracking
    - `graph_ancestor_descendant` - Identifies all ancestors, descendants, and reachable nodes for each node through transitive closure computation
  - `path_analysis.ts` - Path finding and analysis tools
    - `graph_all_paths` - Finds all possible paths between two nodes in a directed graph using DFS with backtracking for exhaustive path enumeration
    - `graph_path_membership` - Determines which paths each node belongs to by analyzing participation across all possible routes between start and end
    - `graph_shortest_path` - Finds the path with minimum total weight from start to end node using Dijkstra's algorithm for weighted graphs
    - `graph_critical_path` - Identifies the longest path through a project network to determine project duration and critical tasks for scheduling
    - `graph_subgraphs_from_targets` - Extracts all subgraphs that contain paths leading to specified target node types using backward traversal
    - `graph_subgraphs_from_sources` - Extracts all subgraphs that contain paths starting from specified source node types using forward traversal
  - `shared_utils.ts` - Common utilities shared across DAG modules
    - `graph_build_adjacency_lists` - Builds both forward and reverse adjacency list representations from graph edges, used by most other graph algorithms
    - `graph_validate` - Validates graph structure and identifies issues including orphaned nodes, dangling edges, duplicate nodes, and duplicate edges
  - `time_aggregation.ts` - Time-based aggregation functions
    - `graph_temporal_bottom_up_aggregation` - Aggregates task durations from leaf nodes upward through dependency tree to calculate total time impact including all descendants
    - `graph_temporal_top_down_aggregation` - Aggregates task durations from root nodes downward through dependency tree to calculate total prerequisite work needed
  - `types.ts` - TypeScript type definitions

## Development

### Running Tests

Use the provided Makefile to run tests for specific modules:

```bash
# Run all tests
make all

# Run specific test suites
make dag_aggregation_tests
make dag_flow_conservation_tests
make dag_time_aggregation_tests
make dag_shared_utils_tests
make dag_path_analysis_tests
make dag_graph_traversal_tests
```

## Future Expansion

This repository is designed to accommodate additional utility themes as they are developed. New subdirectories will be added under `src/` to organize utilities by their specific domain or functionality.

## Using this library

```typescript
import { Procedure } from "@elaraai/core";
import { 
  graph_bottom_up_aggregation,
  graph_bfs,
  graph_validate
} from "elara-utils/src/dag";

// Use the DAG utilities in your EDK procedures
const myProcedure = new Procedure("my_analysis")
  .input("nodes", ArrayType(GraphNode))
  .input("edges", ArrayType(GraphEdge))
  .output(ArrayType(GraphAggregationNode))
  .import(graph_bottom_up_aggregation)
  .body(($, { nodes, edges }, procs) => {
    const result = $.let(procs.graph_bottom_up_aggregation(Struct({ nodes, edges })));
    $.return(result);
  });
```

## Contributing

When adding new utilities:

1. Organize code into thematic subdirectories under `src/`
2. Include comprehensive tests with `_tests.ts` suffix
3. Add relevant documentation and guides
4. Update the Makefile to include new test targets

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 
