# elara-utils

Utilities and helpers for the application of Elara Development Kit (EDK)

## Overview

This repository provides a collection of utilities and helper functions designed to enhance and extend the capabilities of the Elara Development Kit (EDK). The EDK consists of two core dependencies:

- **@elaraai/core** - Core functionality and data structures
- **@elaraai/cli** - Command-line interface and development tools

## Structure

The utilities are organized into thematic subdirectories under `src/`, each containing specialized tools and helpers:

### DAG Utilities (`src/dag/`)

Directed Acyclic Graph utilities for data flow analysis and processing. The DAG utilities are organized into specialized modules, each containing focused procedures for specific graph operations.

- **Guides:**
  - [DAG Development Guide](src/dag/DAG_DEVELOPMENT_GUIDE.md) - Development patterns and best practices

- **Core Modules:**

#### Data Aggregation (`src/dag/aggregation/`)
Value aggregation and rollup operations across graph structures:
- `bottom_up_aggregation.ts` - Aggregates node values from leaf nodes upward through dependency tree to calculate total value impact including all descendants
- `top_down_aggregation.ts` - Distributes values from parent nodes downward through dependency tree, sharing parent resources equally among direct children  
- `weighted_aggregation.ts` - Aggregates values using node weights from leaf nodes upward, computing weighted sums, averages, and total weights
- `group_value_rollup.ts` - Aggregates multi-attribute dictionary values from leaf nodes upward, summing each dictionary key independently across the dependency tree
- `aggregation_by_type.ts` - Groups nodes by type and analyzes type-to-type transitions to create aggregate graph structure with transition probabilities
- `type_statistics.ts` - Fast type-based analysis providing node type patterns, source/target identification, and type transition probabilities without expensive traversal
- `path_statistics.ts` - Comprehensive path analysis using graph traversal to calculate path depth, branching factors, and type sequence patterns for workflow complexity assessment
- `index.ts` - Exports all aggregation procedures

#### Flow Conservation (`src/dag/flow_conservation/`)
Network flow analysis and connectivity validation:
- `flow_conservation.ts` - Verifies conservation of flow through network, checking if flow is conserved at each node considering transmission losses
- `dynamic_reachability.ts` - Analyzes graph reachability considering only active edges, computing ancestors and descendants via active connections only
- `connected_components.ts` - Identifies connected components in an undirected graph representation using optimized O(V + E) algorithm with unique component IDs
- `index.ts` - Exports all flow conservation procedures

#### Graph Traversal (`src/dag/graph_traversal/`) 
Core graph traversal algorithms and analysis:
- `bfs.ts` - Performs breadth-first search traversal visiting nodes level by level from the starting node using queue-based exploration
- `dfs.ts` - Performs depth-first search traversal exploring as far as possible along each branch before backtracking using stack-based exploration
- `enhanced_traversal.ts` - Performs BFS or DFS with detailed tracking of depth, order, and parent relationships for spanning tree construction
- `topological_sort.ts` - Orders nodes such that for every edge (A→B), A comes before B, essential for dependency-based task scheduling
- `cycle_detection.ts` - Detects if the graph contains any cycles and identifies the nodes involved using DFS with state tracking
- `ancestor_descendant.ts` - Identifies all ancestors, descendants, and reachable nodes for each node through transitive closure computation
- `index.ts` - Exports all graph traversal procedures

#### Path Analysis (`src/dag/path_analysis/`)
Advanced path finding and subgraph extraction:
- `all_paths.ts` - Finds all possible paths between two nodes in a directed graph using DFS with backtracking for exhaustive path enumeration
- `path_membership.ts` - Determines which paths each node belongs to by analyzing participation across all possible routes between start and end
- `shortest_path.ts` - Finds the path with minimum total weight from start to end node using Dijkstra's algorithm for weighted graphs
- `critical_path.ts` - Identifies the longest path through a project network to determine project duration and critical tasks for scheduling
- `subgraphs.ts` - **Optimized O(V + E)** - Extracts subgraphs by connected components with optional node type filtering, with dramatic performance improvements for large graphs
- `all_paths_to_targets.ts` - Finds all paths from any sources to specific target nodes using forward traversal
- `index.ts` - Exports all path analysis procedures

#### Shared Utilities (`src/dag/shared_utils/`)
Common utilities and validation functions:
- `build_adjacency_lists.ts` - Builds both forward and reverse adjacency list representations from graph edges, used by most other graph algorithms
- `adjacency_dict_operations.ts` - Dictionary operations for adjacency list manipulation and queries
- `graph_validate.ts` - Validates graph structure and identifies issues including orphaned nodes, dangling edges, duplicate nodes, and duplicate edges
- `index.ts` - Exports all shared utility procedures

#### Time Aggregation (`src/dag/time_aggregation/`)
Temporal analysis and duration calculations:
- `temporal_bottom_up_aggregation.ts` - Aggregates task durations from leaf nodes upward through dependency tree to calculate total time impact including all descendants
- `temporal_top_down_aggregation.ts` - Aggregates task durations from root nodes downward through dependency tree to calculate total prerequisite work needed
- `index.ts` - Exports all time aggregation procedures

#### Core Types and Tests
- `types.ts` - TypeScript type definitions for all DAG structures and interfaces
- `__tests/` - Comprehensive test suite with 25+ test files organized by procedure for thorough validation

## Development

### Running Tests

The project includes a comprehensive test suite with 25+ individual test files organized by procedure. Use the provided Makefile to run tests:

```bash
# Run all tests
make all

# Run test suites by module
make dag_aggregation_tests           # All aggregation procedures
make dag_flow_conservation_tests     # Flow conservation and connectivity  
make dag_graph_traversal_tests       # BFS, DFS, topological sort, cycles
make dag_path_analysis_tests         # Path finding and subgraph extraction
make dag_shared_utils_tests          # Adjacency lists and validation
make dag_time_aggregation_tests      # Temporal analysis procedures

# Run individual procedure tests
make dag_aggregation_bottom_up_tests
make dag_flow_conservation_components_tests
make dag_path_analysis_subgraphs_sources_tests
make dag_graph_traversal_bfs_tests
# ... and 20+ more individual test targets
```

**Test Organization**: Each procedure has dedicated test files in `src/dag/__tests/` with comprehensive test cases covering edge cases, error conditions, and performance scenarios.

## Future Expansion

This repository is designed to accommodate additional utility themes as they are developed. New subdirectories will be added under `src/` to organize utilities by their specific domain or functionality.

## Using this library

```typescript
import { Procedure } from "@elaraai/core";
import { 
  graph_bottom_up_aggregation 
} from "elara-utils/src/dag/aggregation";
import { 
  graph_bfs,
  graph_connected_components
} from "elara-utils/src/dag/graph_traversal";
import { 
  graph_subgraphs
} from "elara-utils/src/dag/path_analysis";
import { 
  graph_validate 
} from "elara-utils/src/dag/shared_utils";

// Use the DAG utilities in your EDK procedures
const myAnalysisProcedure = new Procedure("my_analysis")
  .input("nodes", ArrayType(GraphNode))
  .input("edges", ArrayType(GraphEdge))
  .input("source_types", SetType(StringType))
  .output(PathSubgraphsResult)
  .import(graph_subgraphs_from_sources)
  .import(graph_validate)
  .body(($, { nodes, edges, source_types }, procs) => {
    // Validate graph structure first
    const validation = $.let(procs.graph_validate(Struct({ nodes, edges })));
    
    // Extract subgraphs with optional filtering
    const result = $.let(procs.graph_subgraphs(Struct({ 
      nodes, 
      edges, 
      filter_by_types: source_types
    })));
    
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
